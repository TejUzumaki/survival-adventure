import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', async () => {
    const game = new Game();
    
    try {
        await game.init();
        game.start();
        console.log("Game initialized and started successfully.");
    } catch (error) {
        console.error("CRITICAL ERROR DURING GAME INIT:", error);
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div style="color: white; text-align: center; padding: 20px; font-family: sans-serif;">
                <h2>Failed to Load Game</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
});
