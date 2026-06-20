export class MobileControls {
    constructor(container) {
        this.container = container;
        this.buttons = {};
        
        // Semi-circle layout on bottom right
        this.createButton('jump', 'JUMP', 'bottom: 20px; right: 100px;');
        this.createButton('action', 'ACT', 'bottom: 80px; right: 160px;');
        this.createButton('gather', 'GATH', 'bottom: 160px; right: 160px;');
        this.createButton('sprint', 'SPRINT', 'bottom: 220px; right: 100px;', true); // Toggle button
        this.createButton('inventory', 'INV', 'top: 20px; right: 20px;');
    }

    createButton(id, label, positionCss, isToggle = false) {
        const btn = document.createElement('div');
        btn.id = `btn-${id}`;
        btn.innerText = label;
        btn.style.cssText = `
            position: absolute;
            ${positionCss}
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.6);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            z-index: 110;
            pointer-events: auto;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            backdrop-filter: blur(2px);
        `;
        this.container.appendChild(btn);
        this.buttons[id] = { element: btn, active: false, isToggle: isToggle };

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (isToggle) {
                this.buttons[id].active = !this.buttons[id].active;
                if (this.buttons[id].active) {
                    btn.style.background = 'rgba(255, 255, 255, 0.7)';
                    btn.style.color = 'black';
                } else {
                    btn.style.background = 'rgba(0, 0, 0, 0.4)';
                    btn.style.color = 'white';
                }
            } else {
                // For non-toggle buttons, we just trigger a flag that lasts one frame
                this.buttons[id].active = true;
            }
        }, { passive: false });

        const endHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isToggle) {
                this.buttons[id].active = false;
            }
        };
        btn.addEventListener('touchend', endHandler, { passive: false });
        btn.addEventListener('touchcancel', endHandler, { passive: false });
    }

    isPressed(id) {
        return this.buttons[id]?.active || false;
    }

    consumePress(id) {
        if (this.buttons[id]?.active) {
            this.buttons[id].active = false;
            return true;
        }
        return false;
    }
}
