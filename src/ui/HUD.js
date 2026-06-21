export class HUD {
    constructor(container) {
        this.container = container;
        this.element = document.createElement('div');
        this.element.id = 'hud';
        this.element.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            font-family: sans-serif;
            font-size: 16px;
            text-shadow: 2px 2px 4px black;
            z-index: 100;
            pointer-events: none;
        `;
        this.container.appendChild(this.element);
        
        // Stamina Bar
        this.staminaContainer = document.createElement('div');
        this.staminaContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 150px;
            height: 10px;
            background: rgba(0,0,0,0.5);
            border: 1px solid white;
            border-radius: 5px;
            z-index: 100;
            overflow: hidden;
        `;
        this.staminaFill = document.createElement('div');
        this.staminaFill.style.cssText = `
            width: 100%;
            height: 100%;
            background: #4a7a3a;
            transition: width 0.1s;
        `;
        this.staminaContainer.appendChild(this.staminaFill);
        this.container.appendChild(this.staminaContainer);

        this.update({ wood: 0, stone: 0 }, 100, 60);
    }

    update(resources, stamina, fps) {
        this.element.innerHTML = `
            FPS: ${fps}<br>
            🪵 Wood: ${resources.wood || 0}<br>
            🪨 Stone: ${resources.stone || 0}
        `;
        this.staminaFill.style.width = `${stamina}%`;
    }
}
