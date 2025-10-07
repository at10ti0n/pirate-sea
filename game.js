// Main game class and initialization
class PirateSeaGame {
    constructor(seed = null) {
        this.seed = seed;
        this.mapGenerator = null;
        this.player = null;
        this.entityManager = null;
        this.fogOfWar = null;
        this.uiManager = null;
        this.resourceManager = null;
        this.playerInventory = null;
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
            
            // Initialize game systems with seed
            this.mapGenerator = new MapGenerator(48, 28, this.seed);
            this.mapGenerator.generateMap();
            
            this.entityManager = new EntityManager(this.mapGenerator);
            this.player = new Player(this.mapGenerator);
            this.fogOfWar = new FogOfWar(this.mapGenerator);
            
            // Initialize resource system with error handling
            try {
                const seededRandom = new SeededRandom(this.seed);
                this.resourceManager = new ResourceManager(this.mapGenerator, seededRandom);
                this.playerInventory = new PlayerInventory(500); // Increased capacity for better UX
                
                // Validate resource system initialization
                const resourceValidation = this.validateResourceSystem();
                if (!resourceValidation.isValid) {
                    console.warn('Resource system validation issues:', resourceValidation.issues);
                }
                
            } catch (resourceError) {
                console.error('Failed to initialize resource system:', resourceError);
                // Continue without resource system but log the error
                this.resourceManager = null;
                this.playerInventory = null;
            }
            
            this.uiManager = new UIManager(this);
            
            // Initialize display
            this.uiManager.initializeDisplay();
            
            // Spawn entities around player
            this.entityManager.spawnEntities(this.player.x, this.player.y);
            
            // Try to load saved game state
            const loadResult = this.loadGameState();
            if (loadResult.success) {
                this.uiManager.addMessage(loadResult.message, 'system');
            } else {
                console.log('No saved game found, starting fresh');
            }
            
            // Initial game state update
            this.updateGameState();
            
            // Initial render
            this.render();
            
            this.gameRunning = true;
            
            // Enable auto-save (every 3 minutes for better performance)
            this.enableAutoSave(3);
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            console.log('Game initialized successfully!');
            
            // Welcome message
            this.uiManager.addMessage('Welcome to Pirate Sea!');
            this.uiManager.addMessage('Use arrow keys or touch controls to move.');
            if (this.resourceManager) {
                this.uiManager.addMessage('Press G to gather resources, I for inventory.');
            }
            this.uiManager.updateSeedDisplay();
            this.uiManager.showGameInfo();
            
            return true;
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            
            // Try to provide helpful error information
            if (error.message.includes('ROT')) {
                console.error('ROT.js library issue - check if library is loaded correctly');
            } else if (error.message.includes('localStorage')) {
                console.error('LocalStorage access issue - check browser permissions');
            }
            
            return false;
        }
    }
    
    // Validate resource system integrity
    validateResourceSystem() {
        const issues = [];
        
        if (!this.resourceManager) {
            issues.push('ResourceManager not initialized');
        } else {
            // Check if resource definitions are loaded
            const resourceTypes = ['stone', 'sand', 'wood', 'hay', 'ore', 'berries', 'reeds'];
            for (const resourceType of resourceTypes) {
                const resourceInfo = this.resourceManager.getResourceInfo(resourceType);
                if (!resourceInfo) {
                    issues.push(`Missing resource definition: ${resourceType}`);
                }
            }
            
            // Check if biome resources are configured
            const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
            for (const biome of biomes) {
                const biomeConfig = this.resourceManager.getBiomeResources(biome);
                if (!biomeConfig) {
                    issues.push(`Missing biome configuration: ${biome}`);
                }
            }
        }
        
        if (!this.playerInventory) {
            issues.push('PlayerInventory not initialized');
        } else {
            const inventoryValidation = this.playerInventory.validateInventory();
            if (!inventoryValidation.isValid) {
                issues.push(...inventoryValidation.issues);
            }
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }
    
    // Performance monitoring setup
    setupPerformanceMonitoring() {
        // Monitor resource system performance every 5 minutes
        this.performanceMonitorInterval = setInterval(() => {
            if (this.resourceManager) {
                const metrics = this.resourceManager.getPerformanceMetrics();
                
                // Log performance metrics for debugging
                console.log('Resource System Performance:', metrics);
                
                // Optimize if needed
                if (metrics.totalLocationStates > 800) {
                    const optimized = this.resourceManager.optimizeLocationStates();
                    if (optimized > 0) {
                        console.log(`Optimized ${optimized} resource locations for performance`);
                    }
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    // Cleanup method for proper shutdown
    cleanup() {
        try {
            // Save game state before cleanup
            if (this.gameRunning) {
                this.saveGameState();
            }
            
            // Clear intervals
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
            
            if (this.performanceMonitorInterval) {
                clearInterval(this.performanceMonitorInterval);
                this.performanceMonitorInterval = null;
            }
            
            // Cleanup resource system
            if (this.resourceManager) {
                this.resourceManager.forceCleanup();
            }
            
            this.gameRunning = false;
            console.log('Game cleanup completed');
            
        } catch (error) {
            console.error('Error during game cleanup:', error);
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
        try {
            const interaction = this.entityManager.checkPlayerPosition(this.player);
            if (interaction && interaction.success) {
                this.uiManager.addMessage(interaction.message);
                
                // Track statistics
                if (interaction.message.includes('treasure')) {
                    this.treasureCollected++;
                    this.checkWinCondition();
                } else if (interaction.message.includes('port')) {
                    this.portsVisited++;
                    
                    // Auto-save when visiting ports (safe checkpoint)
                    if (this.autoSaveInterval) {
                        setTimeout(() => {
                            const saveResult = this.saveGameState();
                            if (saveResult.success) {
                                this.uiManager.addMessage('Progress saved at port', 'system');
                            }
                        }, 500);
                    }
                }
            }
        } catch (error) {
            console.error('Error during entity interaction:', error);
        }
    }
    
    // Enhanced ship boarding with inventory state validation
    handleShipBoarding() {
        try {
            if (!this.player || !this.entityManager) {
                console.error('Player or entity manager not initialized');
                return { success: false, message: 'System not ready' };
            }
            
            const currentMode = this.player.getMode();
            
            if (currentMode === 'foot') {
                // Boarding a ship - validate inventory state before boarding
                if (this.playerInventory) {
                    const inventoryValidation = this.playerInventory.validateInventory();
                    if (!inventoryValidation.isValid) {
                        console.warn('Inventory validation issues before boarding:', inventoryValidation.issues);
                        // Fix issues but allow boarding to continue
                    }
                }
                
                // Try boarding an existing ship first
                const boardResult = this.player.boardShip(null, this.entityManager);
                if (boardResult.success) {
                    this.uiManager.addMessage(boardResult.message);
                    this.updateGameState();
                    this.render();
                    return boardResult;
                }
                
                // If no ship to board, try embarking from coast
                const embarkResult = this.player.embarkFromCoast(this.entityManager);
                this.uiManager.addMessage(embarkResult.message);
                
                if (embarkResult.success) {
                    this.updateGameState();
                    this.render();
                }
                
                return embarkResult;
                
            } else if (currentMode === 'ship') {
                // Unboarding from ship - validate inventory state after unboarding
                const unboardResult = this.player.unboard(null, this.entityManager);
                this.uiManager.addMessage(unboardResult.message);
                
                if (unboardResult.success) {
                    // Validate inventory state after mode change
                    if (this.playerInventory) {
                        const inventoryValidation = this.playerInventory.validateInventory();
                        if (!inventoryValidation.isValid) {
                            console.warn('Inventory validation issues after unboarding:', inventoryValidation.issues);
                        }
                    }
                    
                    this.updateGameState();
                    this.render();
                }
                
                return unboardResult;
            }
            
            return { success: false, message: 'Invalid player mode' };
            
        } catch (error) {
            console.error('Error during ship boarding/unboarding:', error);
            this.uiManager.addMessage('Ship operation failed', 'warning');
            return { success: false, message: 'Ship operation error' };
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
            playerPosition: this.player.getPosition(),
            seed: this.mapGenerator.getSeed()
        };
    }
    
    // Resource gathering methods with enhanced error handling
    attemptGather() {
        try {
            // Validate system initialization
            if (!this.resourceManager || !this.playerInventory) {
                this.uiManager.addMessage('Resource system not initialized', 'warning');
                console.error('Resource system not properly initialized');
                return;
            }
            
            // Validate player state
            if (!this.player) {
                this.uiManager.addMessage('Player not initialized', 'warning');
                console.error('Player not initialized');
                return;
            }
            
            // Check if player is on ship
            if (this.player.getMode() === 'ship') {
                this.uiManager.addMessage('Cannot gather resources while on ship', 'warning');
                return;
            }
            
            // Validate player position
            const playerPos = this.player.getPosition();
            if (typeof playerPos.x !== 'number' || typeof playerPos.y !== 'number') {
                this.uiManager.addMessage('Invalid player position', 'warning');
                console.error('Invalid player position:', playerPos);
                return;
            }
            
            // Check if location is valid for gathering
            const tile = this.mapGenerator.getBiomeAt(playerPos.x, playerPos.y);
            if (!tile) {
                this.uiManager.addMessage('Invalid location for gathering', 'warning');
                return;
            }
            
            // Attempt to gather at current position
            const result = this.resourceManager.attemptGather(
                playerPos.x, 
                playerPos.y, 
                this.playerInventory
            );
            
            // Validate result
            if (!result || typeof result.success !== 'boolean') {
                this.uiManager.addMessage('Gathering system error', 'warning');
                console.error('Invalid gathering result:', result);
                return;
            }
            
            // Determine message type and track statistics
            let messageType = 'normal';
            if (result.success) {
                messageType = 'gathering-success';
                this.uiManager.trackGatheringAttempt(
                    playerPos.x, 
                    playerPos.y, 
                    true, 
                    result.resource, 
                    result.quantity
                );
                
                // Auto-save after successful gathering (performance optimization)
                if (this.autoSaveInterval && Math.random() < 0.1) { // 10% chance
                    setTimeout(() => this.saveGameState(), 100);
                }
            } else {
                if (result.message && result.message.includes('Inventory full')) {
                    messageType = 'inventory-full';
                } else {
                    messageType = 'gathering-failure';
                }
                this.uiManager.trackGatheringAttempt(playerPos.x, playerPos.y, false);
            }
            
            // Use standardized cross-platform feedback messages
            const feedbackMessage = this.resourceManager.getGatheringFeedbackMessage(result, 'web');
            this.uiManager.addMessage(feedbackMessage, messageType);
            
            // Update inventory display if it's open
            if (this.uiManager.isInventoryOpen()) {
                this.uiManager.updateInventoryDisplay();
            }
            
        } catch (error) {
            console.error('Error during resource gathering:', error);
            this.uiManager.addMessage('Gathering system error occurred', 'warning');
        }
    }

    // Resource examination methods
    examineLocation() {
        if (!this.resourceManager) {
            this.uiManager.addMessage('Resource system not initialized');
            return;
        }
        
        // Examine current location
        const result = this.resourceManager.examineLocation(this.player.x, this.player.y);
        
        if (!result.success) {
            this.uiManager.addMessage(result.message);
            return;
        }
        
        // Display examination results
        this.uiManager.displayExaminationResults(result);
    }

    // Show resource gathering help
    showGatheringHelp() {
        if (!this.resourceManager) {
            this.uiManager.addMessage('Resource system not initialized');
            return;
        }
        
        const helpInfo = this.resourceManager.getGatheringHelp();
        this.uiManager.displayGatheringHelp(helpInfo);
    }

    // Show detailed resource information
    showResourceInfo(resourceType) {
        if (!this.resourceManager) {
            this.uiManager.addMessage('Resource system not initialized');
            return;
        }
        
        const resourceInfo = this.resourceManager.getDetailedResourceInfo(resourceType);
        if (resourceInfo) {
            this.uiManager.displayResourceInfo(resourceInfo);
        } else {
            this.uiManager.addMessage(`No information available for resource: ${resourceType}`);
        }
    }
    
    toggleInventory() {
        if (!this.playerInventory) {
            this.uiManager.addMessage('Inventory system not initialized');
            return;
        }
        
        this.uiManager.toggleInventory();
    }
    
    // Save/Load functionality
    saveGameState() {
        try {
            const gameState = {
                version: '1.0',
                timestamp: Date.now(),
                seed: this.getSeed(),
                player: {
                    x: this.player.x,
                    y: this.player.y,
                    mode: this.player.mode,
                    lastShipPosition: this.player.lastShipPosition
                },
                gameStats: {
                    treasureCollected: this.treasureCollected,
                    portsVisited: this.portsVisited
                },
                inventory: this.playerInventory ? this.playerInventory.serialize() : null,
                resourceSystem: this.resourceManager ? this.resourceManager.serializeLocationStates() : null,
                entities: this.entityManager ? this.serializeEntities() : null
            };
            
            const serializedState = JSON.stringify(gameState);
            localStorage.setItem('pirateSeaGameState', serializedState);
            
            return { success: true, message: 'Game saved successfully!' };
        } catch (error) {
            console.error('Failed to save game:', error);
            return { success: false, message: `Failed to save game: ${error.message}` };
        }
    }
    
    loadGameState() {
        try {
            const savedState = localStorage.getItem('pirateSeaGameState');
            if (!savedState) {
                return { success: false, message: 'No saved game found' };
            }
            
            const gameState = JSON.parse(savedState);
            
            // Validate save version compatibility
            if (!gameState.version || gameState.version !== '1.0') {
                return { success: false, message: 'Save file version incompatible' };
            }
            
            // Restore seed and regenerate world
            if (gameState.seed) {
                this.seed = gameState.seed;
                this.mapGenerator.setSeed(gameState.seed);
            }
            
            // Restore player state
            if (gameState.player) {
                this.player.x = gameState.player.x || 0;
                this.player.y = gameState.player.y || 0;
                this.player.mode = gameState.player.mode || 'foot';
                this.player.lastShipPosition = gameState.player.lastShipPosition || null;
            }
            
            // Restore game statistics
            if (gameState.gameStats) {
                this.treasureCollected = gameState.gameStats.treasureCollected || 0;
                this.portsVisited = gameState.gameStats.portsVisited || 0;
            }
            
            // Restore inventory
            if (gameState.inventory && this.playerInventory) {
                const inventoryResult = this.playerInventory.deserialize(gameState.inventory);
                if (!inventoryResult.success) {
                    console.warn('Failed to restore inventory:', inventoryResult.message);
                }
            }
            
            // Restore resource system location states
            if (gameState.resourceSystem && this.resourceManager) {
                const resourceResult = this.resourceManager.deserializeLocationStates(gameState.resourceSystem);
                if (!resourceResult.success) {
                    console.warn('Failed to restore resource system:', resourceResult.message);
                }
            }
            
            // Restore entities
            if (gameState.entities) {
                this.deserializeEntities(gameState.entities);
            }
            
            // Update game state and render
            this.updateGameState();
            this.render();
            this.uiManager.showGameInfo();
            
            const saveDate = new Date(gameState.timestamp).toLocaleString();
            return { success: true, message: `Game loaded from ${saveDate}` };
            
        } catch (error) {
            console.error('Failed to load game:', error);
            return { success: false, message: `Failed to load game: ${error.message}` };
        }
    }
    
    serializeEntities() {
        const entities = this.entityManager.getAllEntities();
        return entities.map(entity => ({
            type: entity.type,
            x: entity.x,
            y: entity.y,
            char: entity.char,
            color: entity.color,
            fromCoast: entity.fromCoast,
            coastX: entity.coastX,
            coastY: entity.coastY,
            isStartingShip: entity.isStartingShip
        }));
    }
    
    deserializeEntities(entitiesData) {
        // Clear existing entities
        this.entityManager.entities.clear();
        
        // Restore entities
        entitiesData.forEach(entityData => {
            this.entityManager.addEntity(entityData);
        });
    }
    
    // Auto-save functionality
    enableAutoSave(intervalMinutes = 5) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            const result = this.saveGameState();
            if (result.success) {
                this.uiManager.addMessage('Game auto-saved', 'system');
            }
        }, intervalMinutes * 60 * 1000);
    }
    
    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Seed management methods
    getSeed() {
        return this.mapGenerator ? this.mapGenerator.getSeed() : this.seed;
    }
    
    setSeed(newSeed) {
        this.seed = newSeed;
        if (this.mapGenerator) {
            this.mapGenerator.setSeed(newSeed);
            
            // Respawn entities with new seed
            this.entityManager.spawnEntities(this.player.x, this.player.y);
            
            // Update game state and render
            this.updateGameState();
            this.render();
            
            this.uiManager.addMessage(`World regenerated with seed: ${newSeed}`);
        }
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

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (game) {
        game.cleanup();
    }
});

// Handle visibility change for performance optimization
document.addEventListener('visibilitychange', () => {
    if (game) {
        if (document.hidden) {
            // Page is hidden, reduce performance impact
            game.disableAutoSave();
        } else {
            // Page is visible again, resume normal operation
            game.enableAutoSave(3);
        }
    }
});

// Export for debugging
window.game = game;