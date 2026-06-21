export class MobileControls {
    constructor(container, audioManager) {
        this.container = container;
        this.audioManager = audioManager;
        this.buttons = {};
        
        this.createButton('jump', 'JUMP', 'bottom: 15px; right: 20px;');
        this.createButton('gather', 'GATH', 'bottom: 80px; right: 20px;');
        this.createButton('action', 'ACT', 'bottom: 145px; right: 20px;');
        this.createButton('sprint', 'SPRINT', 'bottom: 210px; right: 20px;', true);
        this.createButton('inventory', 'INV', 'top: 15px; right: 15px;');
    }

    createButton(id, label, defaultPositionCss, isToggle = false) {
        const btn = document.createElement('div');
        btn.id = `btn-${id}`;
        btn.innerText = label;
        
        // Load saved position from localStorage if it exists
        const savedPos = localStorage.getItem(`ui_pos_${id}`);
        const positionCss = savedPos ? JSON.parse(savedPos) : null;

        btn.style.cssText = `
            position: absolute;
            ${positionCss ? `left: ${positionCss.x}px; top: ${positionCss.y}px;` : defaultPositionCss}
            width: 55px;
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
            transition: background 0.2s, color 0.2s, border-color 0.2s;
        `;
        this.container.appendChild(btn);
        this.buttons[id] = { element: btn, active: false, isToggle: isToggle };

        let pressTimer = null;
        let isDragging = false;

        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Start 3-second timer to enter drag mode
            pressTimer = setTimeout(() => {
                isDragging = true;
                btn.style.borderColor = '#ff0000';
                if (navigator.vibrate) navigator.vibrate(100);
            }, 3000);
        });

        btn.addEventListener('pointermove', (e) => {
            if (isDragging) {
                e.preventDefault();
                const x = e.clientX - (btn.offsetWidth / 2);
                const y = e.clientY - (btn.offsetHeight / 2);
                btn.style.left = `${x}px`;
                btn.style.top = `${y}px`;
                btn.style.right = 'auto';
                btn.style.bottom = 'auto';
            }
        });

        const endHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearTimeout(pressTimer);

            if (isDragging) {
                // Save new position to localStorage
                isDragging = false;
                btn.style.borderColor = 'rgba(255, 255, 255, 0.7)';
                const rect = btn.getBoundingClientRect();
                localStorage.setItem(`ui_pos_${id}`, JSON.stringify({ x: rect.left, y: rect.top }));
                return; // Don't trigger button action if we were dragging
            }

            // Normal Tap Logic
            this.audioManager.playSound('click');
            if (id === 'jump') window.dispatchEvent(new Event('game_jump'));
            
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
                
                // Auto reset visual for non-toggle
                setTimeout(() => {
                    btn.style.background = 'rgba(0, 0, 0, 0.5)';
                    btn.style.color = 'white';
                }, 100);
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
