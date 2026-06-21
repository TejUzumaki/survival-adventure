import * as THREE from 'three';

export class ResourceSystem {
    constructor(scene, playerMesh, worldGenerator, inventorySystem, audioManager) {
        this.scene = scene;
        this.player = playerMesh;
        this.worldGenerator = worldGenerator;
        this.inventorySystem = inventorySystem;
        this.audioManager = audioManager;
        this.resources = [];
    }

    registerResource(mesh, type) {
        mesh.userData.resourceType = type;
        mesh.userData.health = 3;
        mesh.userData.maxHealth = 3;
        mesh.userData.isFalling = false;
        mesh.userData.originalRotation = mesh.rotation.clone();
        this.resources.push(mesh);
    }

    harvest(equippedTool) {
        let closestResource = null;
        let closestDist = 4.0; // 4 meter reach
        
        for (const res of this.resources) {
            if (res.userData.isFalling) continue;
            
            const dist = res.position.distanceTo(this.player.position);
            if (dist < closestDist) {
                closestDist = dist;
                closestResource = res;
            }
        }

        if (closestResource) {
            const type = closestResource.userData.resourceType;
            
            if (type === 'tree' && equippedTool !== 'axe') return false;
            if (type === 'rock' && equippedTool !== 'pickaxe') return false;

            closestResource.userData.health--;
            this._shakeResource(closestResource);
            this.audioManager.playSound('chop');

            if (closestResource.userData.health <= 0) {
                this._fallResource(closestResource);
            }
            return true;
        }
        return false;
    }

    _shakeResource(mesh) {
        const originalRot = mesh.userData.originalRotation;
        let shakes = 0;
        const interval = setInterval(() => {
            mesh.rotation.z = originalRot.z + (Math.random() - 0.5) * 0.2;
            shakes++;
            if (shakes > 4) {
                clearInterval(interval);
                mesh.rotation.copy(originalRot);
            }
        }, 50);
    }

    _fallResource(mesh) {
        mesh.userData.isFalling = true;
        mesh.userData.fallTime = 0;
        mesh.userData.resourceGiven = false;
        
        const index = this.worldGenerator.colliders.findIndex(c => c.x === mesh.position.x && c.z === mesh.position.z);
        if (index > -1) this.worldGenerator.colliders.splice(index, 1);
    }

    update(delta) {
        for (let i = this.resources.length - 1; i >= 0; i--) {
            const res = this.resources[i];
            
            if (res.userData.isFalling) {
                res.userData.fallTime += delta;
                
                if (!res.userData.resourceGiven) {
                    if (res.userData.resourceType === 'tree') {
                        this.inventorySystem.addItem('wood', 3);
                    } else if (res.userData.resourceType === 'rock') {
                        this.inventorySystem.addItem('stone', 2);
                    }
                    res.userData.resourceGiven = true;
                }
                
                res.rotation.x += delta * 4.0;
                const scale = Math.max(0, 1.0 - res.userData.fallTime);
                res.scale.set(scale, scale, scale);
                
                if (res.userData.fallTime > 1.0) {
                    this.scene.remove(res);
                    this.resources.splice(i, 1);
                }
            }
        }
    }
}
