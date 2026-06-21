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
        this.update({ wood: 0, stone: 0 });
    }

    update(resources) {
        this.element.innerHTML = `
            🪵 Wood: ${resources.wood || 0}<br>
            🪨 Stone: ${resources.stone || 0}
        `;
    }
}
