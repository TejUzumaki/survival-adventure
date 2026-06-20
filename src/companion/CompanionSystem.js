import * as THREE from 'three';
import { AnimationController } from '../player/AnimationController.js';

export class CompanionSystem {
    constructor(companionMesh, animations, playerMesh, worldGenerator) {
        this.companion = companionMesh;
        this.player = playerMesh;
        this.worldGenerator = worldGenerator;
        this.animationController = new AnimationController(companionMesh, animations);
        
        this.followOffset = new THREE.Vector3(1.5, 0, 0);
        this.moveSpeed = 7.0;
        this.rotationSpeed = 8.0;
        this.isMoving = false;
    }

    update(delta) {
        const targetPos = new THREE.Vector3();
        targetPos.copy(this.player.position);
        
        const offset = this.followOffset.clone().applyQuaternion(this.player.quaternion);
        targetPos.add(offset);

        const distance = this.companion.position.distanceTo(targetPos);

        if (distance > 1.0) {
            this.isMoving = true;
            const direction = new THREE.Vector3().subVectors(targetPos, this.companion.position).normalize();
            
            // Move horizontally
            this.companion.position.x += direction.x * Math.min(this.moveSpeed * delta, distance);
            this.companion.position.z += direction.z * Math.min(this.moveSpeed * delta, distance);
            
            const targetAngle = Math.atan2(direction.x, direction.z);
            const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetAngle, 0, 'YXZ'));
            this.companion.quaternion.slerp(targetQuat, delta * this.rotationSpeed);
        } else {
            this.isMoving = false;
            this.companion.quaternion.slerp(this.player.quaternion, delta * this.rotationSpeed);
        }

        // Snap to terrain
        this.companion.position.y = this.worldGenerator.getHeightAt(this.companion.position.x, this.companion.position.z);

        this.animationController.update(delta, { isMoving: this.isMoving, isSprinting: false, isJumping: false });
    }
}
