import * as THREE from 'three';

export class AnimationController {
    constructor(mesh, animations) {
        this.mesh = mesh;
        this.mixer = new THREE.AnimationMixer(mesh);
        this.actions = {};
        this.currentAction = null;
        this.isAttacking = false;

        animations.forEach(clip => {
            const filteredTracks = clip.tracks.filter(track => {
                if (track.name === 'position' || track.name === 'quaternion') return false;
                if (track.name.toLowerCase().includes('hips.position') || track.name.toLowerCase().includes('root.position')) return false;
                return true;
            });

            const cleanClip = new THREE.AnimationClip(clip.name, clip.duration, filteredTracks);
            const name = cleanClip.name.toLowerCase();
            
            if (name.includes('idle')) this.actions.idle = this.mixer.clipAction(cleanClip);
            else if (name.includes('run') || name.includes('sprint')) this.actions.run = this.mixer.clipAction(cleanClip);
            else if (name.includes('walk')) this.actions.walk = this.mixer.clipAction(cleanClip);
            else if (name.includes('jump') || name.includes('fall') || name.includes('leap')) this.actions.jump = this.mixer.clipAction(cleanClip);
            else if (name.includes('attack') || name.includes('gather') || name.includes('chop') || name.includes('slash')) this.actions.attack = this.mixer.clipAction(cleanClip);
        });

        // Fallbacks
        if (!this.actions.idle && animations.length > 0) {
            const clip = animations[0];
            const filteredTracks = clip.tracks.filter(track => track.name.includes('.'));
            const cleanClip = new THREE.AnimationClip(clip.name, clip.duration, filteredTracks);
            this.actions.idle = this.mixer.clipAction(cleanClip);
        }
        if (!this.actions.walk && this.actions.idle) this.actions.walk = this.actions.idle;
        if (!this.actions.run && this.actions.walk) this.actions.run = this.actions.walk;
        if (!this.actions.jump && this.actions.idle) this.actions.jump = this.actions.idle;
        if (!this.actions.attack && this.actions.idle) this.actions.attack = this.actions.idle;

        this.play('idle', 0.0);
    }

    play(name, fadeDuration = 0.2) {
        const newAction = this.actions[name];
        if (!newAction || newAction === this.currentAction) return;

        newAction.reset();
        newAction.setEffectiveTimeScale(1);
        newAction.setEffectiveWeight(1);
        newAction.play();

        if (this.currentAction) {
            this.currentAction.fadeOut(fadeDuration);
            newAction.fadeIn(fadeDuration);
        }
        this.currentAction = newAction;
    }

    triggerAttack() {
        if (!this.actions.attack || this.isAttacking) return;
        
        this.isAttacking = true;
        const action = this.actions.attack;
        action.reset();
        action.setEffectiveWeight(1);
        action.setEffectiveTimeScale(1.5);
        action.fadeIn(0.1);
        action.play();
        
        const duration = action.getClip().duration / 1.5;
        setTimeout(() => {
            this.isAttacking = false;
            action.fadeOut(0.2);
        }, duration * 1000);
    }

    update(delta, state) {
        this.mixer.update(delta);
        
        if (this.isAttacking) return;
        
        if (state.isJumping) {
            this.play('jump', 0.1);
        } else if (state.isMoving && state.isSprinting) {
            this.play('run');
        } else if (state.isMoving) {
            this.play('walk');
        } else {
            this.play('idle');
        }
    }
}
