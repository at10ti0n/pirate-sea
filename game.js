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
        this.economyManager = null;
        this.weatherManager = null;
        this.gameRunning = false;
        this.treasureCollected = 0;
        this.portsVisited = 0;
        this.turnCount = 0;
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

            // Initialize resource and economy systems
            const seededRandom = new SeededRandom(this.seed);
            this.resourceManager = new ResourceManager(this.mapGenerator, seededRandom);
            this.playerInventory = new PlayerInventory(100);
            this.economyManager = new EconomyManager(seededRandom);
            this.weatherManager = new WeatherManager(seededRandom);
            this.weatherManager.initializeNoise();

            this.entityManager = new EntityManager(this.mapGenerator, this.economyManager);
            this.player = new Player(this.mapGenerator);
            this.fogOfWar = new FogOfWar(this.mapGenerator);
            
            this.uiManager = new UIManager(this);
            
            // Initialize display
            this.uiManager.initializeDisplay();
            
            // Spawn entities around player
            this.entityManager.spawnEntities(this.player.x, this.player.y);

            // Generate initial weather
            this.weatherManager.generateWeather(this.player.x, this.player.y);

            // Initial game state update
            this.updateGameState();
            
            // Initial render
            this.render();
            
            this.gameRunning = true;
            console.log('Game initialized successfully!');
            
            // Welcome message
            this.uiManager.addMessage('Welcome to Pirate Sea!');
            this.uiManager.addMessage('Use arrow keys or touch controls to move.');
            this.uiManager.updateSeedDisplay();
            this.uiManager.showGameInfo();
            
            return true;
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            return false;
        }
    }
    
    updateGameState() {
        if (!this.gameRunning) return;

        this.turnCount++;

        // Update fog of war based on player position
        this.fogOfWar.updateVisibility(this.player.x, this.player.y);

        // Check for entity interactions at player position
        this.checkEntityInteractions();

        // Update weather systems (every turn)
        if (this.weatherManager) {
            this.weatherManager.updateWeather(this.player.x, this.player.y);
            this.applyWeatherEffects();
            this.checkWeatherWarnings();
        }
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
            playerPosition: this.player.getPosition(),
            seed: this.mapGenerator.getSeed()
        };
    }
    
    // Resource gathering methods
    attemptGather() {
        if (!this.resourceManager || !this.playerInventory) {
            this.uiManager.addMessage('Resource system not initialized');
            return;
        }
        
        // Check if player is on ship
        if (this.player.getMode() === 'ship') {
            this.uiManager.addMessage('Cannot gather resources while on ship');
            return;
        }
        
        // Attempt to gather at current position
        const result = this.resourceManager.attemptGather(
            this.player.x, 
            this.player.y, 
            this.playerInventory
        );
        
        this.uiManager.addMessage(result.message);
        
        // Update inventory display if it's open
        if (this.uiManager.isInventoryOpen()) {
            this.uiManager.updateInventoryDisplay();
        }
    }
    
    toggleInventory() {
        if (!this.playerInventory) {
            this.uiManager.addMessage('Inventory system not initialized');
            return;
        }

        this.uiManager.toggleInventory();
    }

    openTrading(port) {
        if (!this.economyManager) {
            this.uiManager.addMessage('Trading system not initialized');
            return;
        }

        if (!port || !port.economy) {
            this.uiManager.addMessage('No merchant available at this port');
            return;
        }

        this.uiManager.showTradingScreen(port);
    }

    checkShipDestruction() {
        // Only check if player is in ship mode
        if (this.player.mode !== 'ship' || !this.player.shipDurability) {
            return false;
        }

        // Check if ship is destroyed
        if (this.player.shipDurability.current <= 0) {
            this.handleShipSinking();
            return true;
        }

        // Warn at critical HP
        const hpPercent = this.player.shipDurability.current / this.player.shipDurability.max;
        if (hpPercent <= 0.2 && !this.criticalWarningShown) {
            this.uiManager.addMessage('⚠ CRITICAL: Your ship is falling apart! Seek port immediately!');
            this.criticalWarningShown = true;
        } else if (hpPercent > 0.2) {
            this.criticalWarningShown = false;
        }

        return false;
    }

    handleShipSinking() {
        this.uiManager.addMessage('💀 YOUR SHIP HAS SUNK! 💀');
        this.uiManager.addMessage('You struggle to swim to the nearest shore...');

        // Find nearest land using map generator
        const nearestLand = this.mapGenerator.findNearestWalkableLand(this.player.x, this.player.y, 20);

        if (nearestLand) {
            this.player.x = nearestLand.x;
            this.player.y = nearestLand.y;
            this.player.mode = 'foot';
            this.player.shipDurability = null;
            this.uiManager.addMessage(`You wash ashore at (${nearestLand.x}, ${nearestLand.y}), exhausted but alive.`);
        } else {
            // Fallback: just switch to foot mode at current location
            this.player.mode = 'foot';
            this.player.shipDurability = null;
            this.uiManager.addMessage('Somehow you survived and made it to shore!');
        }

        // Update game state
        this.updateGameState();
        this.render();
    }

    damageShip(amount) {
        if (this.player.mode !== 'ship' || !this.player.shipDurability) {
            return;
        }

        this.player.shipDurability.current = Math.max(0, this.player.shipDurability.current - amount);
        this.player.shipDurability.lastDamage = Date.now();

        const condition = this.entityManager.getShipCondition({ durability: this.player.shipDurability });
        this.uiManager.addMessage(`⚓ Ship took ${amount} damage! (${this.player.shipDurability.current}/${this.player.shipDurability.max} HP - ${condition})`);

        // Check if ship was destroyed
        this.checkShipDestruction();
    }

    applyWeatherEffects() {
        // Only damage ships, not players on foot
        if (this.player.mode !== 'ship' || !this.player.shipDurability) {
            return;
        }

        // Calculate weather damage at player position
        const damage = this.weatherManager.calculateWeatherDamage(this.player.x, this.player.y);

        if (damage > 0) {
            this.damageShip(damage);

            // Add weather-specific message
            const weatherName = this.weatherManager.getWeatherName(this.player.x, this.player.y);
            if (damage >= 10) {
                this.uiManager.addMessage(`🌪️ The ${weatherName} batters your ship!`);
            }
        }
    }

    checkWeatherWarnings() {
        // Only warn when on ship
        if (this.player.mode !== 'ship') {
            return;
        }

        // Check for nearby dangerous weather
        const nearbyWeather = this.weatherManager.findNearbyDangerousWeather(
            this.player.x,
            this.player.y,
            10
        );

        if (nearbyWeather.length > 0 && !this.lastWeatherWarning) {
            const closest = nearbyWeather[0];
            const weatherType = closest.weather.type;
            const direction = closest.direction;

            this.uiManager.addMessage(`⚠️ ${weatherType.toUpperCase()} approaching from the ${direction}!`);
            this.lastWeatherWarning = this.turnCount;
        } else if (nearbyWeather.length === 0) {
            this.lastWeatherWarning = null;
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

// Export for debugging
window.game = game;