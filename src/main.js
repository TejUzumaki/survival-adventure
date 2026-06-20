import { Game } from './core/Game.js';

// Wait for DOM to be fully loaded
window.addEventListener('DOMContentLoaded', async () => {
    const game = new Game();
    
    try {
        await game.init();
        game.start();
        console.log("Game initialized and started successfully.");
    } catch (error) {
        console.error("Failed to initialize game:", error);
        // Future: Show user-friendly error screen
    }
});
