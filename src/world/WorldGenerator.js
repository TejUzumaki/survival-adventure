import * as THREE from 'three';

export class WorldGenerator {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.terrainSize = 200;
        this.terrainSegments = 150;
        this.terrainMesh = null;
        this.colliders = []; // Store collision data {x, z, radius}
        
        this.seed = 12345;
    }

    async generate() {
        this._generateTerrain();
        await this._populateEnvironment();
    }

    _getTerrainHeight(x, z) {
        // Tropical rolling hills with small bumps
        const h1 = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.5;
        const h2 = Math.sin(x * 0.05 + z * 0.05) * 1.0;
        const h3 = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.2; // Small bumps
        return (h1 + h2 + h3) * 0.5;
    }

    _generateTerrain() {
        const geo = new THREE.PlaneGeometry(this.terrainSize, this.terrainSize, this.terrainSegments, this.terrainSegments);
        geo.rotateX(-Math.PI / 2);
        
        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        
        const colorTop = new THREE.Color(0x4a7a3a); // Lush green
        const colorBottom = new THREE.Color(0x3a5f2a); // Darker green
        
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const y = this._getTerrainHeight(x, z);
            pos.setY(i, y);
            
            // Add color variation based on height
            const mixedColor = colorBottom.clone().lerp(colorTop, (y + 1.5) / 3.0);
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }
        
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        
        const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false });
        this.terrainMesh = new THREE.Mesh(geo, mat);
        this.terrainMesh.receiveShadow = true;
        this.scene.add(this.terrainMesh);
    }

    async _populateEnvironment() {
        const assetsToLoad = [
            'CommonTree_1.gltf', 'CommonTree_2.gltf', 'CommonTree_3.gltf', 
            'Pine_1.gltf', 'Pine_2.gltf', 
            'Rock_Medium_1.gltf', 'Rock_Medium_2.gltf',
            'Bush_Common.gltf', 'Bush_Common_Flowers.gltf',
            'Mushroom_Common.gltf', 'Mushroom_Laetiporus.gltf',
            'Fern_1.gltf', 'Grass_Common_Tall.gltf', 'Pebble_Round_1.gltf'
        ];
        
        const loadedAssets = [];
        for (const assetName of assetsToLoad) {
            try {
                const path = `/assets/environment/glTF/${assetName}`;
                const gltf = await this.assetManager.loadGLTF(path, assetName);
                loadedAssets.push({ name: assetName, scene: gltf.scene });
            } catch (e) {
                console.warn(`Failed to load ${assetName}`, e);
            }
        }

        // Helper to add asset and register collider
        const placeAsset = (asset, x, z, scale, isCollider = false) => {
            const clone = asset.scene.clone();
            const y = this._getTerrainHeight(x, z);
            
            clone.position.set(x, y, z);
            clone.rotation.y = Math.random() * Math.PI * 2;
            clone.scale.set(scale, scale, scale);
            
            clone.traverse(o => {
                if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
            });
            
            this.scene.add(clone);
            
            if (isCollider) {
                // Calculate radius based on scale (approximate)
                const radius = scale * 1.0; 
                this.colliders.push({ x, z, radius });
            }
        };

        // Create dense forest clusters
        for (let i = 0; i < 10; i++) {
            const centerX = (Math.random() - 0.5) * 150;
            const centerZ = (Math.random() - 0.5) * 150;
            const treeType = loadedAssets.find(a => a.name.includes('CommonTree') || a.name.includes('Pine'));
            
            if (treeType) {
                for (let j = 0; j < 8; j++) {
                    const offsetX = (Math.random() - 0.5) * 20;
                    const offsetZ = (Math.random() - 0.5) * 20;
                    const x = centerX + offsetX;
                    const z = centerZ + offsetZ;
                    const scale = 0.8 + Math.random() * 0.6;
                    placeAsset(treeType, x, z, scale, true); // Trees are colliders
                }
                
                // Add bushes and ferns around trees
                const undergrowth = loadedAssets.filter(a => a.name.includes('Bush') || a.name.includes('Fern'));
                undergrowth.forEach(plant => {
                    for (let k = 0; k < 5; k++) {
                        const x = centerX + (Math.random() - 0.5) * 25;
                        const z = centerZ + (Math.random() - 0.5) * 25;
                        placeAsset(plant, x, z, 0.8 + Math.random() * 0.4, false);
                    }
                });
            }
        }

        // Scatter Rocks, Mushrooms, and Pebbles randomly
        const rocks = loadedAssets.filter(a => a.name.includes('Rock'));
        const mushrooms = loadedAssets.filter(a => a.name.includes('Mushroom'));
        const pebbles = loadedAssets.filter(a => a.name.includes('Pebble'));
        const grass = loadedAssets.filter(a => a.name.includes('Grass'));

        for (let i = 0; i < 40; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            if (rocks.length > 0) placeAsset(rocks[Math.floor(Math.random() * rocks.length)], x, z, 0.8 + Math.random() * 0.6, true);
            if (mushrooms.length > 0) placeAsset(mushrooms[Math.floor(Math.random() * mushrooms.length)], x + 1, z + 1, 0.5 + Math.random() * 0.3, false);
            if (pebbles.length > 0) placeAsset(pebbles[Math.floor(Math.random() * pebbles.length)], x - 1, z - 1, 0.3 + Math.random() * 0.2, false);
            if (grass.length > 0) placeAsset(grass[Math.floor(Math.random() * grass.length)], x + 2, z - 1, 0.6 + Math.random() * 0.4, false);
        }
    }

    getHeightAt(x, z) {
        return this._getTerrainHeight(x, z);
    }
}
