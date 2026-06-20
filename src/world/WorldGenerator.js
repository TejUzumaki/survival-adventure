import * as THREE from 'three';

export class WorldGenerator {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.terrainSize = 200;
        this.terrainSegments = 100;
        this.terrainMesh = null;
        this.maxTerrainHeight = 3.0;
        
        // Simple deterministic pseudo-random function for terrain heights
        this.seed = 12345;
    }

    async generate() {
        this._generateTerrain();
        await this._populateEnvironment();
    }

    _hash(x, y) {
        let n = x + y * 57 + this.seed;
        n = (n << 13) ^ n;
        return (1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    }

    _getTerrainHeight(x, z) {
        // Layered sine waves for smooth rolling hills and shallow trenches
        const h1 = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.5;
        const h2 = Math.sin(x * 0.05 + z * 0.05) * 1.0;
        return (h1 + h2) * 0.5;
    }

    _generateTerrain() {
        const geo = new THREE.PlaneGeometry(this.terrainSize, this.terrainSize, this.terrainSegments, this.terrainSegments);
        geo.rotateX(-Math.PI / 2);
        
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            pos.setY(i, this._getTerrainHeight(x, z));
        }
        
        geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({ color: 0x3a5f3a, flatShading: false });
        this.terrainMesh = new THREE.Mesh(geo, mat);
        this.terrainMesh.receiveShadow = true;
        this.scene.add(this.terrainMesh);
    }

    async _populateEnvironment() {
        const assetsToLoad = [
            'CommonTree_1.gltf', 'CommonTree_2.gltf', 'Pine_1.gltf', 'Pine_2.gltf', 
            'Rock_Medium_1.gltf', 'Rock_Medium_2.gltf', 'Bush_Common.gltf', 'Mushroom_Common.gltf'
        ];
        
        const loadedAssets = [];
        for (const assetName of assetsToLoad) {
            try {
                const path = `/assets/environment/glTF/${assetName}`;
                const gltf = await this.assetManager.loadGLTF(path, assetName);
                loadedAssets.push(gltf.scene);
            } catch (e) {
                console.warn(`Failed to load ${assetName}`, e);
            }
        }

        // Scatter assets
        loadedAssets.forEach(asset => {
            for (let i = 0; i < 15; i++) { // 15 instances of each asset
                const clone = asset.clone();
                const x = (Math.random() - 0.5) * 150;
                const z = (Math.random() - 0.5) * 150;
                const y = this._getTerrainHeight(x, z);
                
                clone.position.set(x, y, z);
                clone.rotation.y = Math.random() * Math.PI * 2;
                
                const scale = 0.8 + Math.random() * 0.5;
                clone.scale.set(scale, scale, scale);
                
                clone.traverse(o => {
                    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
                });
                
                this.scene.add(clone);
            }
        });
    }

    getHeightAt(x, z) {
        return this._getTerrainHeight(x, z);
    }
}
