export class InventoryUI {
    constructor(container) {
        this.container = container;
        this.isOpen = false;
        
        this.element = document.createElement('div');
        this.element.id = 'inventory-ui';
        this.element.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 10px;
            padding: 20px;
            color: white;
            font-family: sans-serif;
            display: none;
            flex-direction: column;
            align-items: center;
            z-index: 200;
            min-width: 300px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        this.container.appendChild(this.element);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.element.style.display = this.isOpen ? 'flex' : 'none';
    }

    update(items) {
        if (!this.isOpen) return;
        
        let html = `<h2 style="margin-bottom: 20px;">Inventory</h2>`;
        html += `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; width: 100%;">`;
        
        for (const [name, count] of Object.entries(items)) {
            if (count > 0) {
                let icon = '📦';
                if (name === 'wood') icon = '🪵';
                if (name === 'stone') icon = '🪨';
                
                html += `
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 5px; text-align: center;">
                        <div style="font-size: 32px;">${icon}</div>
                        <div style="margin-top: 5px; text-transform: capitalize;">${name}</div>
                        <div style="font-weight: bold; color: #4a7a3a;">${count}</div>
                    </div>
                `;
            }
        }

        if (Object.values(items).every(v => v === 0)) {
            html += `<p>Inventory is empty. Go chop some trees!</p>`;
        }

        html += `</div>`;
        html += `<button id="close-inventory" style="margin-top: 20px; padding: 10px 20px; background: #4a7a3a; color: white; border: none; border-radius: 5px; font-weight: bold;">CLOSE</button>`;
        
        this.element.innerHTML = html;
        
        document.getElementById('close-inventory').addEventListener('click', () => this.toggle());
    }
}
