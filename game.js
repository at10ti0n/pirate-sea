// Main game class and initialization
class PirateSeaGame {
    constructor() {
        this.mapGenerator = null;
        this.player = null;
        this.entityManager = null;
        this.fogOfWar = null;
        this.uiManager = null;
        this.gameRunning = false;
        this.treasureCollected = 0;
        this.portsVisited = 0;
    }
    
    async initialize() {
        try {
            console.log('Initializing Pirate Sea game...');
            
            // Wait for ROT.js to be loaded
            if (typeof ROT === 'undefined') {
                console.error('ROT.js library not loaded!');
                return false;
            }
            
            // Initialize game systems
            this.mapGenerator = new MapGenerator();
            this.mapGenerator.generateMap();
            
            this.entityManager = new EntityManager(this.mapGenerator);
            this.player = new Player(this.mapGenerator);
            this.fogOfWar = new FogOfWar(this.mapGenerator);
            this.uiManager = new UIManager(this);
            
            // Initialize display
            this.uiManager.initializeDisplay();
            
            // Spawn entities around player
            this.entityManager.spawnEntities(this.player.x, this.player.y);
            
            // Initial game state update
            this.updateGameState();
            
            // Initial render
            this.render();
            
            this.gameRunning = true;
            console.log('Game initialized successfully!');
            
            // Welcome message
            this.uiManager.addMessage('Welcome to Pirate Sea!');
            this.uiManager.addMessage('Use arrow keys or touch controls to move.');
            this.uiManager.showGameInfo();
            
            return true;
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            return false;
        }
    }
    
    updateGameState() {
        if (!this.gameRunning) return;
        
        // Update fog of war based on player position
        this.fogOfWar.updateVisibility(this.player.x, this.player.y);
        
        // Check for entity interactions at player position
        this.checkEntityInteractions();
    }
    
    checkEntityInteractions() {
        const interaction = this.entityManager.checkPlayerPosition(this.player);
        if (interaction && interaction.success) {
            this.uiManager.addMessage(interaction.message);
            
            // Track statistics
            if (interaction.message.includes('treasure')) {
                this.treasureCollected++;
                this.checkWinCondition();
            } else if (interaction.message.includes('port')) {
                this.portsVisited++;
            }
        }
    }
    
    checkWinCondition() {
        const remainingTreasure = this.entityManager.getRemainingTreasure();
        if (remainingTreasure === 0) {
            this.uiManager.addMessage('Congratulations! You found all the treasure!');
            this.uiManager.addMessage('You are the ultimate pirate!');
        }
    }
    
    onPlayerMove() {
        if (!this.gameRunning) return;
        
        // Update game state
        this.updateGameState();
        
        // Re-render the game
        this.render();
        
        // Update UI info
        this.uiManager.showGameInfo();
    }
    
    render() {
        if (!this.uiManager || !this.uiManager.display) return;
        
        this.uiManager.render();
    }
    
    restart() {
        console.log('Restarting game...');
        
        // Reset game state
        this.treasureCollected = 0;
        this.portsVisited = 0;
        this.uiManager.clearMessages();
        
        // Regenerate map and entities
        this.mapGenerator.generateMap();
        this.entityManager.spawnEntities(this.player.x, this.player.y);
        
        // Reset player
        this.player.initialize();
        
        // Update game state and render
        this.updateGameState();
        this.render();
        
        // Welcome message
        this.uiManager.addMessage('Game restarted!');
        this.uiManager.showGameInfo();
    }
    
    getGameStats() {
        return {
            treasureCollected: this.treasureCollected,
            treasureRemaining: this.entityManager.getRemainingTreasure(),
            portsVisited: this.portsVisited,
            playerMode: this.player.getMode(),
            playerPosition: this.player.getPosition()
        };
    }
    
    // Debug function to show all entities
    debugShowAllEntities() {
        const entities = this.entityManager.getAllEntities();
        console.log('All entities:', entities);
        
        entities.forEach(entity => {
            this.uiManager.addMessage(`${entity.type} at (${entity.x}, ${entity.y})`);
        });
    }
}

// Global game instance
let game = null;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing game...');
    
    game = new PirateSeaGame();
    const success = await game.initialize();
    
    if (!success) {
        console.error('Failed to initialize game');
        const gameDisplay = document.getElementById('game-display');
        if (gameDisplay) {
            gameDisplay.innerHTML = '<p style="color: red;">Failed to load game. Please refresh the page.</p>';
        }
    }
});

// Export for debugging
window.game = game;