export class InputManager {
    constructor(container) {
        this.container = container;
        this.moveVector = { x: 0, y: 0 };

        this.joystickZone = document.createElement('div');
        this.joystickZone.id = 'joystick-zone';
        
        this.joystickBase = document.createElement('div');
        this.joystickBase.id = 'joystick-base';
        
        this.joystickKnob = document.createElement('div');
        this.joystickKnob.id = 'joystick-knob';

        this.joystickBase.appendChild(this.joystickKnob);
        this.joystickZone.appendChild(this.joystickBase);
        this.container.appendChild(this.joystickZone);

        this.joystickActive = false;
        this.touchId = null;
        this.maxDistance = 60;

        this.initStyles();
        this.bindEvents();
    }

    initStyles() {
        this.joystickZone.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 40%;
            height: 60%;
            z-index: 100;
            pointer-events: auto;
        `;

        this.joystickBase.style.cssText = `
            position: absolute;
            display: none;
            width: 140px;
            height: 140px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.3);
            border: 3px solid rgba(255, 255, 255, 0.5);
            transform: translate(-50%, -50%);
            backdrop-filter: blur(2px);
        `;

        this.joystickKnob.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.8);
            border: 2px solid rgba(255, 255, 255, 1);
            transform: translate(-50%, -50%);
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;
    }

    bindEvents() {
        this.joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.touchId = touch.identifier;
            this.joystickActive = true;

            this.joystickBase.style.left = `${touch.clientX}px`;
            this.joystickBase.style.top = `${touch.clientY}px`;
            this.joystickBase.style.display = 'block';
        }, { passive: false });

        this.joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystickActive) return;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.touchId) {
                    const baseRect = this.joystickBase.getBoundingClientRect();
                    const centerX = baseRect.left + baseRect.width / 2;
                    const centerY = baseRect.top + baseRect.height / 2;
                    
                    let deltaX = touch.clientX - centerX;
                    let deltaY = touch.clientY - centerY;
                    
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    
                    if (distance > this.maxDistance) {
                        deltaX = (deltaX / distance) * this.maxDistance;
                        deltaY = (deltaY / distance) * this.maxDistance;
                    }
                    
                    this.joystickKnob.style.left = `calc(50% + ${deltaX}px)`;
                    this.joystickKnob.style.top = `calc(50% + ${deltaY}px)`;
                    
                    this.moveVector.x = deltaX / this.maxDistance;
                    this.moveVector.y = deltaY / this.maxDistance;
                    break;
                }
            }
        }, { passive: false });

        const endHandler = (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchId) {
                    this.joystickActive = false;
                    this.touchId = null;
                    this.moveVector = { x: 0, y: 0 };
                    this.joystickBase.style.display = 'none';
                    this.joystickKnob.style.left = '50%';
                    this.joystickKnob.style.top = '50%';
                    break;
                }
            }
        };

        this.joystickZone.addEventListener('touchend', endHandler, { passive: false });
        this.joystickZone.addEventListener('touchcancel', endHandler, { passive: false });
    }

    getMovementVector() {
        return this.moveVector;
    }

    isMoving() {
        return this.moveVector.x !== 0 || this.moveVector.y !== 0;
    }
}
