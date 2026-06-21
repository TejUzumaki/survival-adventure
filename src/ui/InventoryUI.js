export class InventoryUI {
    constructor(container) {
        this.container = container;
        this.isOpen = false;
        this.selectedSlot = -1; // For drag/drop logic
        
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
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        this.container.appendChild(this.element);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.element.style.display = this.isOpen ? 'flex' : 'none';
        this.selectedSlot = -1; // Reset selection on close
    }

    update(items) {
        if (!this.isOpen) return;
        
        let html = `<h2 style="margin-bottom: 15px;">Inventory</h2>`;
        html += `<div style="display: grid; grid-template-columns: repeat(4, 60px); gap: 10px;">`;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const isSelected = this.selectedSlot === i;
            
            let icon = '';
            let count = '';
            if (item) {
                if (item.name === 'wood') icon = '🪵';
                else if (item.name === 'stone') icon = '🪨';
                count = item.count;
            }
            
            html += `
                <div class="inv-slot" data-index="${i}" style="
                    width: 60px; height: 60px; 
                    background: ${isSelected ? 'rgba(255,255,0,0.3)' : 'rgba(255,255,255,0.1)'}; 
                    border: 2px solid ${isSelected ? 'yellow' : 'rgba(255,255,255,0.2)'}; 
                    border-radius: 5px; 
                    display: flex; flex-direction: column; 
                    align-items: center; justify-content: center;
                    font-size: 24px; cursor: pointer; user-select: none;
                ">
                    <span>${icon}</span>
                    <span style="font-size: 12px; font-weight: bold;">${count}</span>
                </div>
            `;
        }
        
        html += `</div>`;
        html += `<button id="close-inventory" style="margin-top: 20px; padding: 10px 20px; background: #4a7a3a; color: white; border: none; border-radius: 5px; font-weight: bold;">CLOSE</button>`;
        
        this.element.innerHTML = html;
        
        // Attach listeners
        document.getElementById('close-inventory').addEventListener('click', () => this.toggle());
        
        const slots = this.element.querySelectorAll('.inv-slot');
        slots.forEach(slot => {
            slot.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const index = parseInt(slot.dataset.index);
                
                if (this.selectedSlot === -1) {
                    // Selecting a slot
                    if (items[index]) {
                        this.selectedSlot = index;
                        this.update(items);
                    }
                } else {
                    // Swapping
                    if (this.selectedSlot !== index) {
                        // Trigger swap event for Game.js to handle
                        window.dispatchEvent(new CustomEvent('inventory_swap', { detail: { a: this.selectedSlot, b: index } }));
                    }
                    this.selectedSlot = -1;
                    this.update(items);
                }
            });
        });
    }
}
