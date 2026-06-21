import * as THREE from 'three';
import { AssetManager } from './AssetManager.js';
import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { PlayerController } from '../player/PlayerController.js';
import { AnimationController } from '../player/AnimationController.js';
import { CameraController } from '../camera/CameraController.js';
import { CompanionSystem } from '../companion/CompanionSystem.js';
import { MobileControls } from '../ui/MobileControls.js';
import { HUD } from '../ui/HUD.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { WorldGenerator } from '../world/WorldGenerator.js';
import { EquipmentSystem } from '../inventory/EquipmentSystem.js';
import { ResourceSystem } from '../resources/ResourceSystem.js';
import { InventorySystem } from '../inventory/InventorySystem.js';

export class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.uiOverlay = document.getElementById('ui-overlay');

        this.renderer = null;
        this.camera = null;

        this.sceneManager = null;
        this.assetManager = null;
        this.inputManager = null;
        this.playerController = null;
        this.animationController = null;
        this.cameraController = null;
        this.companionSystem = null;
        this.mobileControls = null;
        this.hud = null;
        this.inventoryUI = null;
        this.worldGenerator = null;
        this.equipmentSystem = null;
        this.resourceSystem = null;
        this.inventorySystem = null;

        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.delta = 0;
        this.timeStep = 1 / 60;
        this.maxSubSteps = 5;

        this.animate = this.animate.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    async init() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, powerPreference: 'high-performance', stencil: false, depth: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);

        this.sceneManager = new SceneManager();
        this.assetManager = new AssetManager();
        this.inputManager = new InputManager(this.container);
        this.mobileControls = new MobileControls(this.container);
        
        this.inventorySystem = new InventorySystem();
        this.hud = new HUD(this.container);
        this.inventoryUI = new InventoryUI(this.container);

        this.resourceSystem = new ResourceSystem(this.sceneManager.scene, null, null, this.inventorySystem);

        this.worldGenerator = new WorldGenerator(this.sceneManager.scene, this.assetManager, this.resourceSystem);
        await this.worldGenerator.generate();

        await this.loadInitialAssets();

        // Listen for instantaneous jump event
        window.addEventListener('game_jump', () => this.playerController.jump());

        window.addEventListener('resize', this.onResize);
        window.addEventListener('contextmenu', e => e.preventDefault());
    }

    async loadInitialAssets() {
        try {
            const playerGltf = await this.assetManager.loadGLTF('/assets/characters/UAL1_Standard_RM.glb', 'player');
            this.player = playerGltf.scene;
            AssetManager.setupShadows(this.player);
            this.sceneManager.add(this.player);
            this.player.position.y = this.worldGenerator.getHeightAt(0, 0);

            this.animationController = new AnimationController(this.player, playerGltf.animations);
            this.playerController = new PlayerController(this.sceneManager.scene, this.camera, this.player, this.worldGenerator);
            this.equipmentSystem = new EquipmentSystem(this.player, this.assetManager);
            
            this.resourceSystem.player = this.player;

            const companionGltf = await this.assetManager.loadGLTF('/assets/characters/RobotExpressive (1).glb', 'companion');
            this.companion = companionGltf.scene;
            this.companion.scale.set(0.35, 0.35, 0.35);
            AssetManager.setupShadows(this.companion);
            this.sceneManager.add(this.companion);

            this.cameraController = new CameraController(this.camera, this.container, this.player, this.worldGenerator);
            this.companionSystem = new CompanionSystem(this.companion, companionGltf.animations, this.player, this.worldGenerator);

        } catch (error) {
            console.error("Failed to load initial assets", error);
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.clock.start();
        requestAnimationFrame(this.animate);
    }

    stop() {
        this.isRunning = false;
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(this.animate);

        let frameDelta = this.clock.getDelta();
        if (frameDelta > 0.25) frameDelta = 0.25;

        this.delta += frameDelta;

        let subSteps = 0;
        while (this.delta >= this.timeStep && subSteps < this.maxSubSteps) {
            this.update(this.timeStep);
            this.delta -= this.timeStep;
            subSteps++;
        }

        this.render();
    }

    update(delta) {
        if (this.cameraController) this.cameraController.update(delta);

        if (this.playerController && this.inputManager) {
            const moveVector = this.inputManager.getMovementVector();
            const isSprinting = this.mobileControls.isPressed('sprint');
            
            if (this.mobileControls.consumePress('action')) {
                const currentTool = this.equipmentSystem.getCurrentTool();
                if (currentTool === null) this.equipmentSystem.equip('axe');
                else if (currentTool === 'axe') this.equipmentSystem.equip('pickaxe');
                else if (currentTool === 'pickaxe') this.equipmentSystem.unequip();
            }

            if (this.mobileControls.consumePress('gather')) {
                const equippedTool = this.equipmentSystem.getCurrentTool();
                this.animationController.triggerAttack();
                
                // Delay harvest to match swing
                setTimeout(() => {
                    this.resourceSystem.harvest(equippedTool);
                    this.hud.update(this.inventorySystem.getItems());
                }, 300);
            }

            if (this.mobileControls.consumePress('inventory')) {
                this.inventoryUI.toggle();
                this.inventoryUI.update(this.inventorySystem.getItems());
            }

            this.playerController.update(delta, moveVector, isSprinting);

            if (this.animationController) {
                this.animationController.update(delta, {
                    isMoving: this.inputManager.isMoving(),
                    isSprinting: isSprinting,
                    isJumping: this.playerController.isJumping
                });
            }
        }

        if (this.companionSystem) this.companionSystem.update(delta);
        if (this.resourceSystem) this.resourceSystem.update(delta);
    }

    render() {
        if (this.renderer && this.sceneManager && this.camera) {
            this.renderer.render(this.sceneManager.scene, this.camera);
        }
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);
    }
}
