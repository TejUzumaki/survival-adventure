import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 150);

        this.setupLighting();
        // Ground is now handled by WorldGenerator
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        this.sun = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sun.position.set(50, 100, 50);
        this.sun.castShadow = true;
        
        this.sun.shadow.mapSize.width = 1024;
        this.sun.shadow.mapSize.height = 1024;
        this.sun.shadow.camera.near = 0.5;
        this.sun.shadow.camera.far = 200;
        this.sun.shadow.camera.left = -50;
        this.sun.shadow.camera.right = 50;
        this.sun.shadow.camera.top = 50;
        this.sun.shadow.camera.bottom = -50;
        
        this.scene.add(this.sun);
    }

    add(object) { this.scene.add(object); }
    remove(object) { this.scene.remove(object); }
}
