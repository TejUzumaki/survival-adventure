export class MobileControls {
    constructor(container, audioManager) {
        this.container = container;
        this.audioManager = audioManager;
        this.buttons = {};
        
        // Compact vertical column layout
        this.createButton('jump', 'JUMP', 'bottom: 15px; right: 20px;');
        this.createButton('gather', 'GATH', 'bottom: 80px; right: 20px;');
        this.createButton('action', 'ACT', 'bottom: 145px; right: 20px;');
        this.createButton('sprint', 'SPRINT', 'bottom: 210px; right: 20px;', true);
        this.createButton('inventory', 'INV', 'top: 15px; right: 15px;');
    }

    createButton(id, label, positionCss, isToggle = false) {
        const btn = document.createElement('div');
        btn.id = `btn-${id}`;
        btn.innerText = label;
        btn.style.cssText = `
            position: absolute;
            ${positionCss}
            width: 55px; /* Smaller buttons */
            height: 55px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.7);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            z-index: 150;
            pointer-events: auto;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            backdrop-filter: blur(2px);
            touch-action: none;
        `;
        this.container.appendChild(btn);
        this.buttons[id] = { element: btn, active: false, isToggle: isToggle };

        // Using pointerdown is 100% reliable on mobile and desktop
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.audioManager.playSound('click');
            
            if (id === 'jump') {
                window.dispatchEvent(new Event('game_jump'));
            }
            
            if (isToggle) {
                this.buttons[id].active = !this.buttons[id].active;
                if (this.buttons[id].active) {
                    btn.style.background = 'rgba(255, 255, 255, 0.8)';
                    btn.style.color = 'black';
                } else {
                    btn.style.background = 'rgba(0, 0, 0, 0.5)';
                    btn.style.color = 'white';
                }
            } else {
                this.buttons[id].active = true;
                btn.style.background = 'rgba(255, 255, 255, 0.8)';
                btn.style.color = 'black';
            }
        });

        const endHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isToggle) {
                btn.style.background = 'rgba(0, 0, 0, 0.5)';
                btn.style.color = 'white';
            }
        };
        btn.addEventListener('pointerup', endHandler);
        btn.addEventListener('pointerleave', endHandler);
        btn.addEventListener('pointercancel', endHandler);
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
