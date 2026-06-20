import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AssetManager {
    constructor() {
        this.cache = new Map();
        this.gltfLoader = new GLTFLoader();
    }

    async loadGLTF(path, name) {
        if (this.cache.has(name)) {
            return this.cache.get(name);
        }

        try {
            console.log(`[AssetManager] Loading: ${path}`);
            const gltf = await this.gltfLoader.loadAsync(path);
            this.cache.set(name, gltf);
            console.log(`[AssetManager] Successfully loaded: ${name}`);
            return gltf;
        } catch (error) {
            console.error(`[AssetManager] Failed to load ${name} from ${path}:`, error);
            throw error;
        }
    }

    getAsset(name) {
        return this.cache.get(name);
    }

    // Helper to enable shadows on all meshes within a loaded GLTF
    static setupShadows(object, castShadow = true, receiveShadow = true) {
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = castShadow;
                child.receiveShadow = receiveShadow;
            }
        });
    }
}
