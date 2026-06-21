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
                const isHand = name.includes('hand');
                const isRight = name.includes('right') || name.includes('r_hand') || name.includes('hand_r');
                const isLeft = name.includes('left') || name.includes('l_hand') || name.includes('hand_l');
                
                // Strictly find the right hand
                if (isHand && isRight && !isLeft) {
                    bestMatch = object;
                }
            }
        });

        this.rightHandBone = bestMatch;
        if (this.rightHandBone) {
            console.log("Attached tool to Right Hand Bone:", this.rightHandBone.name);
        } else {
            console.warn("Right hand bone not found! Attaching to player root.");
            this.rightHandBone = this.player;
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
            this.rightHandBone.add(this.currentTool);
            
            // Adjust offset and rotation to look correct
            this.currentTool.position.set(0, 0.1, 0.1);
            this.currentTool.rotation.set(Math.PI / 2, 0, Math.PI / 2);
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
