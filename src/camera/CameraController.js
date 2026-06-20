import * as THREE from 'three';

export class CameraController {
    constructor(camera, domElement, target, worldGenerator) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = target;
        this.worldGenerator = worldGenerator; // Injected for collision

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
        this.previousTouch = null;
        this.activeTouches = []; // Track ONLY touches in the camera zone

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
        for (let i = 0; i < e.changedTouches.length; i++) {
            this.activeTouches.push(e.changedTouches[i].identifier);
        }

        if (this.activeTouches.length === 1) {
            this.isDragging = true;
            this.previousTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (this.activeTouches.length === 2) {
            this.isDragging = false;
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            this.previousPinchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        if (this.isDragging && this.activeTouches.length === 1) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.previousTouch.x;
            const deltaY = touch.clientY - this.previousTouch.y;
            
            this.sphericalDelta.theta -= deltaX * this.rotationSpeed;
            this.sphericalDelta.phi -= deltaY * this.rotationSpeed;
            
            this.previousTouch = { x: touch.clientX, y: touch.clientY };
        } else if (this.activeTouches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);
            
            const deltaDistance = currentPinchDistance - this.previousPinchDistance;
            this.targetDistance -= deltaDistance * 0.05;
            this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
            
            this.previousPinchDistance = currentPinchDistance;
        }
    }

    onTouchEnd(e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const id = e.changedTouches[i].identifier;
            const index = this.activeTouches.indexOf(id);
            if (index > -1) this.activeTouches.splice(index, 1);
        }

        if (this.activeTouches.length === 0) {
            this.isDragging = false;
            this.previousTouch = null;
        } else if (this.activeTouches.length === 1) {
            this.isDragging = true;
            // Find remaining touch to prevent jump
            for(let i=0; i<e.touches.length; i++) {
                if (e.touches[i].identifier === this.activeTouches[0]) {
                    this.previousTouch = { x: e.touches[i].clientX, y: e.touches[i].clientY };
                    break;
                }
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

        // Terrain Collision for Camera
        const terrainHeight = this.worldGenerator.getHeightAt(desiredCameraPos.x, desiredCameraPos.z);
        if (desiredCameraPos.y < terrainHeight + 0.5) {
            desiredCameraPos.y = terrainHeight + 0.5;
        }

        this.camera.position.lerp(desiredCameraPos, this.smoothFactor);
        this.camera.lookAt(targetPos);
    }
}
