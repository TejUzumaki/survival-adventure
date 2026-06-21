export class AudioManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch(e) {
            console.warn("Web Audio API not supported.");
        }
    }

    playSound(type) {
        if (!this.initialized) this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (type === 'chop') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.15);
        } else if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.05);
        }
    }
}
