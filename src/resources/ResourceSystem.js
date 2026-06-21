import * as THREE from 'three';

export class ResourceSystem {
    constructor(scene, playerMesh, worldGenerator) {
        this.scene = scene;
        this.player = playerMesh;
        this.worldGenerator = worldGenerator;
        this.resources = [];
        this.resourcesGained = { wood: 0, stone: 0 };

        this.raycaster = new THREE.Raycaster();
    }

    registerResource(mesh, type) {
        const health = 3;
        mesh.userData.resourceType = type;
        mesh.userData.health = health;
        mesh.userData.maxHealth = health;
        mesh.userData.isFalling = false;
        mesh.userData.originalRotation = mesh.rotation.clone();
        
        this.resources.push(mesh);
    }

    harvest(equippedTool) {
        const origin = this.player.position.clone();
        origin.y += 1.0;
        
        const playerForward = new THREE.Vector3();
        this.player.getWorldDirection(playerForward);
        
        this.raycaster.set(origin, playerForward);
        this.raycaster.far = 3.0;

        const intersects = this.raycaster.intersectObjects(this.resources, true);

        if (intersects.length > 0) {
            let hitObject = intersects[0].object;
            while (hitObject.parent && !hitObject.userData.resourceType) {
                hitObject = hitObject.parent;
            }

            if (hitObject.userData.resourceType) {
                const type = hitObject.userData.resourceType;
                
                if (type === 'tree' && equippedTool !== 'axe') return false;
                if (type === 'rock' && equippedTool !== 'pickaxe') return false;

                hitObject.userData.health--;
                this._shakeResource(hitObject);

                if (hitObject.userData.health <= 0) {
                    this._fallResource(hitObject);
                }
                return true;
            }
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
                
                // Give resource immediately when it starts falling
                if (!res.userData.resourceGiven) {
                    if (res.userData.resourceType === 'tree') this.resourcesGained.wood += 3;
                    else if (res.userData.resourceType === 'rock') this.resourcesGained.stone += 2;
                    res.userData.resourceGiven = true;
                }
                
                // Smooth fall and shrink effect
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
