import * as THREE from 'three';

export class CameraController {
    constructor(camera, domElement, target, worldGenerator) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = target;
        this.worldGenerator = worldGenerator;

        this.minDistance = 3;
        this.maxDistance = 15;
        this.currentDistance = 8;
        this.targetDistance = 8;
        
        this.minPolarAngle = 0.1;
        this.maxPolarAngle = Math.PI / 2 - 0.1;
        
        this.rotationSpeed = 0.005;
        this.smoothFactor = 0.1;

        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();
        
        this.isDragging = false;
        this.dragTouchId = null;
        this.previousTouch = null;
        
        this.pinchTouchIds = [];
        this.previousPinchDistance = 0;

        this.raycaster = new THREE.Raycaster();
        this.tempVec3 = new THREE.Vector3();

        this.initTouchZone();
        this.updateSphericalFromCamera();
    }

    initTouchZone() {
        this.touchZone = document.createElement('div');
        this.touchZone.id = 'camera-touch-zone';
        this.touchZone.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            width: 60%;
            height: 100%;
            z-index: 90;
            pointer-events: auto;
            touch-action: none;
        `;
        this.domElement.appendChild(this.touchZone);

        this.touchZone.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.touchZone.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.touchZone.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
        this.touchZone.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: false });
    }

    onTouchStart(e) {
        e.preventDefault();
        
        // If already dragging or pinching, ignore new touches for those actions
        if (this.isDragging || this.pinchTouchIds.length === 2) return;

        if (e.changedTouches.length === 1 && this.pinchTouchIds.length === 0) {
            const touch = e.changedTouches[0];
            this.isDragging = true;
            this.dragTouchId = touch.identifier;
            this.previousTouch = { x: touch.clientX, y: touch.clientY };
        } else if (e.changedTouches.length >= 1 && this.pinchTouchIds.length < 2) {
            // Start gathering touches for pinch
            for(let i = 0; i < e.changedTouches.length; i++) {
                if (this.pinchTouchIds.length < 2) {
                    this.pinchTouchIds.push(e.changedTouches[i].identifier);
                }
            }
            
            if (this.pinchTouchIds.length === 2) {
                this.isDragging = false; // Stop dragging if we start pinching
                this.dragTouchId = null;
                
                // Find the two touches for pinch
                let t1 = null, t2 = null;
                for(let i = 0; i < e.touches.length; i++) {
                    if (e.touches[i].identifier === this.pinchTouchIds[0]) t1 = e.touches[i];
                    if (e.touches[i].identifier === this.pinchTouchIds[1]) t2 = e.touches[i];
                }
                
                if (t1 && t2) {
                    const dx = t1.clientX - t2.clientX;
                    const dy = t1.clientY - t2.clientY;
                    this.previousPinchDistance = Math.sqrt(dx * dx + dy * dy);
                }
            }
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        
        if (this.isDragging && this.dragTouchId !== null) {
            // Find the specific touch that is dragging
            let touch = null;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.dragTouchId) {
                    touch = e.touches[i];
                    break;
                }
            }
            
            if (touch) {
                const deltaX = touch.clientX - this.previousTouch.x;
                const deltaY = touch.clientY - this.previousTouch.y;
                
                this.sphericalDelta.theta -= deltaX * this.rotationSpeed;
                this.sphericalDelta.phi -= deltaY * this.rotationSpeed;
                
                this.previousTouch = { x: touch.clientX, y: touch.clientY };
            }
        } else if (this.pinchTouchIds.length === 2) {
            let t1 = null, t2 = null;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.pinchTouchIds[0]) t1 = e.touches[i];
                if (e.touches[i].identifier === this.pinchTouchIds[1]) t2 = e.touches[i];
            }
            
            if (t1 && t2) {
                const dx = t1.clientX - t2.clientX;
                const dy = t1.clientY - t2.clientY;
                const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);
                
                const deltaDistance = currentPinchDistance - this.previousPinchDistance;
                this.targetDistance -= deltaDistance * 0.05;
                this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
                
                this.previousPinchDistance = currentPinchDistance;
            }
        }
    }

    onTouchEnd(e) {
        e.preventDefault();
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const endedId = e.changedTouches[i].identifier;
            
            if (endedId === this.dragTouchId) {
                this.isDragging = false;
                this.dragTouchId = null;
                this.previousTouch = null;
            }
            
            const pinchIndex = this.pinchTouchIds.indexOf(endedId);
            if (pinchIndex > -1) {
                this.pinchTouchIds.splice(pinchIndex, 1);
                this.previousPinchDistance = 0;
            }
        }
    }

    updateSphericalFromCamera() {
        this.tempVec3.copy(this.camera.position).sub(this.target.position);
        this.spherical.setFromVector3(this.tempVec3);
    }

    update(delta) {
        const offset = new THREE.Vector3();
        
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
        
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
        this.spherical.radius = this.targetDistance;
        
        this.sphericalDelta.theta *= 0.8;
        this.sphericalDelta.phi *= 0.8;

        const targetPos = new THREE.Vector3(
            this.target.position.x,
            this.target.position.y + 1.5,
            this.target.position.z
        );

        offset.setFromSpherical(this.spherical);
        const desiredCameraPos = targetPos.clone().add(offset);

        const terrainHeight = this.worldGenerator.getHeightAt(desiredCameraPos.x, desiredCameraPos.z);
        if (desiredCameraPos.y < terrainHeight + 0.5) {
            desiredCameraPos.y = terrainHeight + 0.5;
        }

        this.camera.position.lerp(desiredCameraPos, this.smoothFactor);
        this.camera.lookAt(targetPos);
    }
}
