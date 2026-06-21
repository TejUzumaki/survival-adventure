import * as THREE from 'three';

export class PlayerController {
    constructor(scene, camera, mesh, worldGenerator) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = mesh;
        this.worldGenerator = worldGenerator;

        this.walkSpeed = 5.5;
        this.sprintSpeed = 9.0;
        this.rotationSpeed = 15.0;
        this.gravity = -20.0;
        this.jumpForce = 8.0;
        this.isGrounded = true;
        this.velocityY = 0;
        this.isJumping = false;

        // Stamina
        this.maxStamina = 100;
        this.stamina = 100;
        this.staminaDrain = 25; // per second
        this.staminaRegen = 15; // per second

        this.raycaster = new THREE.Raycaster();
        this.downVector = new THREE.Vector3(0, -1, 0);
        
        this._tempMove = new THREE.Vector3();
        this._tempForward = new THREE.Vector3();
        this._tempRight = new THREE.Vector3();
        this._targetRotation = new THREE.Quaternion();
    }

    update(delta, inputVector, isSprinting) {
        this._handleGroundCheck();
        this._handleGravity(delta);
        
        // Stamina Logic
        const isMoving = inputVector.x !== 0 || inputVector.y !== 0;
        if (isSprinting && isMoving && this.stamina > 0) {
            this.stamina -= this.staminaDrain * delta;
            if (this.stamina < 0) this.stamina = 0;
        } else {
            this.stamina += this.staminaRegen * delta;
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
        }

        // Actual sprint state depends on stamina
        const actualSprint = isSprinting && this.stamina > 0;

        this._handleMovement(delta, inputVector, actualSprint);
        
        // Anti-Glitch
        if (this.mesh.position.y < -10) {
            this.mesh.position.set(0, 20, 0);
            this.velocityY = 0;
        }
    }

    _handleGroundCheck() {
        const terrainHeight = this.worldGenerator.getHeightAt(this.mesh.position.x, this.mesh.position.z);
        if (this.mesh.position.y <= terrainHeight + 0.1) {
            this.mesh.position.y = terrainHeight;
            this.velocityY = 0;
            if (!this.isGrounded) this.isJumping = false;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
    }

    _handleGravity(delta) {
        if (!this.isGrounded) {
            this.velocityY += this.gravity * delta;
            this.mesh.position.y += this.velocityY * delta;
        }
    }

    _handleMovement(delta, inputVector, isSprinting) {
        const speed = isSprinting ? this.sprintSpeed : this.walkSpeed;

        this.camera.getWorldDirection(this._tempForward);
        this._tempForward.y = 0;
        this._tempForward.normalize();
        
        this._tempRight.crossVectors(this._tempForward, this.mesh.up).normalize();

        this._tempMove.set(0, 0, 0);
        this._tempMove.addScaledVector(this._tempForward, -inputVector.y);
        this._tempMove.addScaledVector(this._tempRight, inputVector.x);
        
        if (this._tempMove.lengthSq() > 0) {
            this._tempMove.normalize();
            
            let nextX = this.mesh.position.x + this._tempMove.x * speed * delta;
            let nextZ = this.mesh.position.z + this._tempMove.z * speed * delta;
            
            let isBlocked = false;
            const playerRadius = 0.5;
            
            for (const collider of this.worldGenerator.colliders) {
                const dx = nextX - collider.x;
                const dz = nextZ - collider.z;
                const distSq = dx * dx + dz * dz;
                const minDist = collider.radius + playerRadius;
                
                if (distSq < minDist * minDist) {
                    isBlocked = true;
                    break;
                }
            }
            
            if (!isBlocked) {
                this.mesh.position.x = nextX;
                this.mesh.position.z = nextZ;
            }

            const targetAngle = Math.atan2(this._tempMove.x, this._tempMove.z);
            this._targetRotation.setFromEuler(new THREE.Euler(0, targetAngle, 0, 'YXZ'));
            this.mesh.quaternion.slerp(this._targetRotation, this.rotationSpeed * delta);
        }
    }

    jump() {
        if (this.isGrounded) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
            this.isJumping = true;
        }
    }
}
