import * as THREE from 'three';

export class EquipmentSystem {
    constructor(playerMesh, assetManager) {
        this.player = playerMesh;
        this.assetManager = assetManager;
        this.rightHandBone = null;
        this.currentTool = null; // 'axe', 'pickaxe', or null

        this._findHandBone();
    }

    _findHandBone() {
        this.player.traverse(object => {
            if (object.isBone && object.name.toLowerCase().includes('hand')) {
                if (object.name.toLowerCase().includes('right')) {
                    this.rightHandBone = object;
                    console.log("Found Right Hand Bone:", this.rightHandBone.name);
                }
            }
        });

        if (!this.rightHandBone) {
            console.warn("Right hand bone not found! Attaching tool to player root instead.");
            this.rightHandBone = this.player; // Fallback
        }
    }

    async equip(toolName) {
        this.unequip();

        let path = '';
        // FIX: Encode spaces in URL to prevent 404 errors
        if (toolName === 'axe') path = '/assets/tools/Axe%201.glb';
        else if (toolName === 'pickaxe') path = '/assets/tools/Pickaxe%201.glb';
        else return;

        try {
            const gltf = await this.assetManager.loadGLTF(path, toolName);
            this.currentTool = gltf.scene;
            this.currentTool.name = toolName; // Explicitly set name for logic checks
            
            this.currentTool.scale.set(1, 1, 1);
            this.currentTool.rotation.set(0, 0, 0);
            
            if (this.rightHandBone) {
                this.rightHandBone.add(this.currentTool);
                this.currentTool.position.set(0, 0, 0);
            }
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
