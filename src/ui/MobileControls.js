export class MobileControls {
    constructor(container) {
        this.container = container;
        this.buttons = {};
        
        // Tighter vertical arc layout
        this.createButton('jump', 'JUMP', 'bottom: 15px; right: 80px;');
        this.createButton('action', 'ACT', 'bottom: 85px; right: 130px;');
        this.createButton('gather', 'GATH', 'bottom: 155px; right: 130px;');
        this.createButton('sprint', 'SPRINT', 'bottom: 225px; right: 80px;', true);
        this.createButton('inventory', 'INV', 'top: 15px; right: 15px;');
    }

    createButton(id, label, positionCss, isToggle = false) {
        const btn = document.createElement('div');
        btn.id = `btn-${id}`;
        btn.innerText = label;
        btn.style.cssText = `
            position: absolute;
            ${positionCss}
            width: 65px;
            height: 65px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.6);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            z-index: 120;
            pointer-events: auto;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            backdrop-filter: blur(2px);
            touch-action: none;
        `;
        this.container.appendChild(btn);
        this.buttons[id] = { element: btn, active: false, isToggle: isToggle };

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (id === 'jump') {
                window.dispatchEvent(new Event('game_jump'));
            }
            
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
                this.buttons[id].active = true;
                btn.style.background = 'rgba(255, 255, 255, 0.7)';
                btn.style.color = 'black';
            }
        }, { passive: false });

        const endHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isToggle) {
                btn.style.background = 'rgba(0, 0, 0, 0.4)';
                btn.style.color = 'white';
            }
        };
        btn.addEventListener('touchend', endHandler, { passive: false });
        btn.addEventListener('touchcancel', endHandler, { passive: false });
    }

    isPressed(id) { return this.buttons[id]?.active || false; }
    
    consumePress(id) {
        if (this.buttons[id]?.active && !this.buttons[id]?.isToggle) {
            this.buttons[id].active = false;
            return true;
        }
        return false;
    }
}
