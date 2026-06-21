import * as THREE from 'three';

export class EquipmentSystem {
    constructor(playerMesh, assetManager) {
        this.player = playerMesh;
        this.assetManager = assetManager;
        this.rightHandBone = null;
        this.currentTool = null;

        this._findHandBone();
    }

    _findHandBone() {
        let bestMatch = null;
        this.player.traverse(object => {
            if (object.isBone) {
                const name = object.name.toLowerCase();
                // Look for hand bones
                if (name.includes('hand')) {
                    // Prioritize right hand, but accept any hand if right isn't found
                    if (name.includes('right') || name.includes('r_hand')) {
                        bestMatch = object;
                    } else if (!bestMatch) {
                        bestMatch = object;
                    }
                }
            }
        });

        this.rightHandBone = bestMatch;
        if (this.rightHandBone) {
            console.log("Attached tool to bone:", this.rightHandBone.name);
        } else {
            console.warn("No hand bone found! Attaching to player root.");
            this.rightHandBone = this.player; // Fallback
        }
    }

    async equip(toolName) {
        this.unequip();

        let path = '';
        if (toolName === 'axe') path = '/assets/tools/Axe%201.glb';
        else if (toolName === 'pickaxe') path = '/assets/tools/Pickaxe%201.glb';
        else return;

        try {
            const gltf = await this.assetManager.loadGLTF(path, toolName);
            this.currentTool = gltf.scene;
            this.currentTool.name = toolName;
            
            this.currentTool.scale.set(1, 1, 1);
            
            // Attach to bone
            this.rightHandBone.add(this.currentTool);
            
            // Apply manual offset and rotation so it sits correctly in the hand
            // These values might need tweaking based on the exact mesh, but are good defaults
            this.currentTool.position.set(0, 0.1, 0.1);
            this.currentTool.rotation.set(Math.PI / 2, 0, Math.PI / 2); // Rotate so blade faces forward
        } catch (e) {
            console.error(`Failed to equip ${toolName}`, e);
        }
    }

    unequip() {
        if (this.currentTool && this.rightHandBone) {
            this.rightHandBone.remove(this.currentTool);
            this.currentTool = null;
        }
    }

    getCurrentTool() {
        return this.currentTool ? this.currentTool.name : null;
    }
}
