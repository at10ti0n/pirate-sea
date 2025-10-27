#!/usr/bin/env node

// Terminal-based pirate roguelike game
const readline = require('readline');
const ROT = require('rot-js');
const ResourceManager = require('./resource-manager');
const PlayerInventory = require('./player-inventory');
const EconomyManager = require('./economy');
const WeatherManager = require('./weather');
const FogOfWar = require('./fog');
const FoodSystem = require('./food-system');
const ShipProvisions = require('./ship-provisions');
const NameGenerator = require('./nameGenerator');
const SeededRandom = require('./seeded-random');
const TerminalDisplayAdapter = require('./terminal-display-adapter');
const MapGenerator = require('./map');
const Player = require('./player');
const EntityManager = require('./entities');

// PHASE 2-4: Using shared modules - TerminalMapGenerator, TerminalPlayer, and TerminalEntityManager removed

class TerminalGame {
    constructor(seed = null) {
        this.seed = seed;

        // Initialize display adapter for terminal colors
        this.displayAdapter = new TerminalDisplayAdapter();

        // Use shared MapGenerator
        this.mapGenerator = new MapGenerator(60, 20, seed);

        // Convert biome colors for terminal display
        this.mapGenerator.biomes = this.displayAdapter.convertBiomes(this.mapGenerator.biomes);

        // Initialize economy system
        this.economyManager = new EconomyManager(this.mapGenerator.seededRandom);
        this.weatherManager = new WeatherManager(this.mapGenerator.seededRandom);
        this.weatherManager.initializeNoise();

        // Use shared EntityManager
        this.entityManager = new EntityManager(this.mapGenerator, this.economyManager);

        // Convert entity type colors for terminal display
        for (const [key, entityType] of Object.entries(this.entityManager.entityTypes)) {
            this.entityManager.entityTypes[key] = this.displayAdapter.convertEntityType(entityType);
        }

        // Initialize fog of war system
        this.fogOfWar = new FogOfWar(this.mapGenerator);
        this.fogOfWar.setWeatherManager(this.weatherManager);

        this.player = null;
        this.running = false;
        this.turnCount = 0;
        this.messageLog = [];
        this.showInventory = false;
        this.showTrading = false;
        this.currentTradingPort = null;
        this.showPortMenu = false; // Phase 1: MVP Loop
        this.currentPort = null; // Phase 1: MVP Loop
        this.criticalWarningShown = false;
        this.lastWeatherWarning = null;
        this.criticalHullWarningShown = false; // Phase 2: Hull warnings
        this.moderateHullWarningShown = false; // Phase 2: Hull warnings
        this.lastDangerLevel = 'unknown'; // Phase 2: Track danger zone changes

        // Initialize resource system
        this.resourceManager = null;
        this.playerInventory = null;

        // Initialize food and rest systems
        this.foodSystem = new FoodSystem();
        this.shipProvisionsSystem = new ShipProvisions();

        this.setupReadline();
    }

    setupReadline() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Enable raw mode for immediate key capture
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
        }

        // Handle line input for trading and port menu (Phase 1: MVP Loop)
        this.rl.on('line', (input) => {
            if (this.showPortMenu && input.trim().length > 0) {
                this.handlePortMenuCommand(input);
                this.render();
            } else if (this.showTrading && input.trim().length > 0) {
                this.handleTradingCommand(input);
                this.render();
            }
        });

        process.stdin.on('keypress', (str, key) => {
            // Don't handle key presses if we're in menu mode and typing (Phase 1: MVP Loop)
            if (!this.showTrading && !this.showPortMenu) {
                this.handleKeyPress(key);
            } else {
                // Handle toggle keys to close menus
                if (key && key.name === 't' && this.showTrading) {
                    this.openTrading(); // Toggle off
                    this.render();
                } else if (key && key.name === 'p' && this.showPortMenu) {
                    this.openPortMenu(); // Toggle off
                    this.render();
                }
            }
        });
    }

    initialize() {
        console.clear();
        console.log('Initializing Pirate Sea Terminal Edition...');

        this.mapGenerator.generateMap();
        this.player = new Player(this.mapGenerator);

        // Initialize resource system
        this.resourceManager = new ResourceManager(this.mapGenerator, this.mapGenerator.seededRandom);
        this.playerInventory = new PlayerInventory(500);

        // Link inventory to player for economy system compatibility
        this.player.inventory = this.playerInventory;

        // Spawn all entities using island-aware system
        this.entityManager.spawnEntities(this.player.x, this.player.y);

        // Generate initial weather
        this.weatherManager.generateWeather(this.player.x, this.player.y);

        // Initialize fog of war visibility
        this.fogOfWar.updateVisibility(this.player.x, this.player.y);

        // Give player starting food for testing
        this.player.addFood('fish', 3);
        this.player.addFood('berries', 2);
        this.player.addFood('hardtack', 5);

        this.running = true;
        this.addMessage('Welcome to Pirate Sea! Use WASD to move, B to board/disembark, Q to quit.');
        this.addMessage('Press G to gather resources, I to view cargo, P for port services.');
        this.addMessage('Press T to trade resources, C to cook, E to eat, X to examine.');
        this.addMessage('Your starting dinghy has been placed nearby - explore and find treasure!');
        this.addMessage(`Starting gold: ${this.player.gold}g | Ship: ${this.player.currentShip} | Cargo: 0/${this.player.maxCargoSpace}`);
        this.render();
    }

    handleKeyPress(key) {
        if (!key) return;

        switch (key.name) {
            case 'w':
                this.player.move(0, -1);
                break;
            case 's':
                this.player.move(0, 1);
                break;
            case 'a':
                this.player.move(-1, 0);
                break;
            case 'd':
                this.player.move(1, 0);
                break;
            case 'q':
                this.quit();
                return;
            case 'b':
                this.toggleMode();
                break;
            case 'g':
                this.attemptGather();
                break;
            case 'i':
                this.toggleInventory();
                break;
            case 't':
                this.openTrading();
                break;
            case 'p':
                this.openPortMenu();
                break;
            case 'r':
                this.repairShip();
                break;
            case 'c':
                this.cookFood();
                break;
            case 'e':
                this.eatFood();
                break;
            case 'x':
                this.examineTile();
                break;
        }

        // Update game state
        this.turnCount++;

        // Check for entity interactions at current position (Phase 1: MVP Loop)
        // This handles automatic treasure collection and port visits
        const entityInteraction = this.entityManager.checkPlayerPosition(this.player);
        if (entityInteraction && entityInteraction.message) {
            this.addMessage(entityInteraction.message);
        }

        // Check if we need to spawn entities in new region (dynamic exploration)
        if (this.entityManager.shouldSpawnForPosition(this.player.x, this.player.y)) {
            const newEntities = this.entityManager.spawnEntitiesInRegion(this.player.x, this.player.y);
            if (newEntities > 0) {
                this.addMessage(`Discovered new lands! Found ${newEntities} new locations.`);
            }
        }

        // Update time of day (advances by 6 minutes per turn)
        this.fogOfWar.updateTimeOfDay(0.1);

        // Update fog of war based on player position (takes weather & time into account)
        this.fogOfWar.updateVisibility(this.player.x, this.player.y);

        // Phase 2: Pass player for distance-based weather spawning
        this.weatherManager.updateWeather(this.player.x, this.player.y, this.player);
        this.applyWeatherEffects();
        this.checkWeatherWarnings();
        this.checkDangerZone(); // Phase 2: Danger zone warnings

        this.render();
    }

    toggleMode() {
        if (this.player.mode === 'foot') {
            // Check if there's a ship at the current position or adjacent
            const currentEntity = this.entityManager.getEntityAt(this.player.x, this.player.y);
            if (currentEntity && currentEntity.type === 'ship') {
                // Store ship's durability before boarding
                this.player.shipDurability = currentEntity.durability || this.entityManager.createShipDurability(100);
                // Remove the ship entity since player is boarding it
                this.entityManager.removeEntity(this.player.x, this.player.y);
                this.player.mode = 'ship';
                this.addMessage('You board the ship!');
                return;
            }

            // Check adjacent positions for ships (including diagonals)
            const directions = [
                [0, 1], [0, -1], [1, 0], [-1, 0],  // Cardinal directions
                [1, 1], [1, -1], [-1, 1], [-1, -1] // Diagonal directions
            ];
            for (const [dx, dy] of directions) {
                const entity = this.entityManager.getEntityAt(this.player.x + dx, this.player.y + dy);
                if (entity && entity.type === 'ship') {
                    // Check if the ship position is navigable water
                    const shipTile = this.mapGenerator.getBiomeAt(this.player.x + dx, this.player.y + dy);
                    if (shipTile && shipTile.biome === 'ocean') {
                        // Store ship's durability before boarding
                        this.player.shipDurability = entity.durability || this.entityManager.createShipDurability(100);
                        // Remove the ship entity since player is boarding it
                        this.entityManager.removeEntity(this.player.x + dx, this.player.y + dy);

                        // Move to ship position and board it
                        this.player.x += dx;
                        this.player.y += dy;
                        this.player.mode = 'ship';
                        this.addMessage('You board the ship!');
                        return;
                    }
                }
            }

            this.addMessage('No ship nearby to board!');
        } else if (this.player.mode === 'ship') {
            // Check for nearby land to disembark
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of directions) {
                const landTile = this.mapGenerator.getBiomeAt(this.player.x + dx, this.player.y + dy);
                if (landTile && this.mapGenerator.isWalkable(this.player.x + dx, this.player.y + dy, false)) {
                    // Leave ship at current position with preserved durability
                    const ship = {
                        type: 'ship',
                        x: this.player.x,
                        y: this.player.y,
                        char: 'S',
                        color: '\x1b[33m',
                        durability: this.player.shipDurability || this.entityManager.createShipDurability(100)
                    };
                    this.entityManager.addEntity(ship);

                    // Move player to land
                    this.player.x += dx;
                    this.player.y += dy;
                    this.player.mode = 'foot';
                    this.addMessage('You disembark onto land!');
                    return;
                }
            }
            this.addMessage('No land nearby to disembark!');
        }
    }

    attemptGather() {
        // Check if player is on ship
        if (this.player.mode === 'ship') {
            this.addMessage('Cannot gather resources while on ship');
            return;
        }

        // Attempt to gather at current position
        const result = this.resourceManager.attemptGather(
            this.player.x, 
            this.player.y, 
            this.playerInventory
        );

        this.addMessage(result.message);
    }

    toggleInventory() {
        this.showInventory = !this.showInventory;
        if (this.showInventory) {
            this.addMessage('Cargo hold opened');
        } else {
            this.addMessage('Cargo hold closed');
        }
    }

    openTrading() {
        // Check if player is at a port
        const port = this.entityManager.getEntityAt(this.player.x, this.player.y);

        if (!port || port.type !== 'port') {
            this.addMessage('You must be at a port to trade! (Stand on P)');
            return;
        }

        if (!port.economy) {
            this.addMessage('This port has no merchant!');
            return;
        }

        this.showTrading = !this.showTrading;
        if (this.showTrading) {
            this.currentTradingPort = port;
            this.addMessage(`Trading at ${port.economy.tier} port - Gold: ${this.player.gold}g`);

            // Clear readline's input buffer to prevent stray keypresses
            // This prevents previously pressed keys from appearing in the trade input
            if (this.rl && this.rl.line) {
                this.rl.line = '';
                this.rl.cursor = 0;
                this.rl._refreshLine();
            }
        } else {
            this.currentTradingPort = null;
            this.addMessage('Closed trading');
        }
    }

    repairShip() {
        // Check if player is at a port
        const port = this.entityManager.getEntityAt(this.player.x, this.player.y);

        if (!port || port.type !== 'port') {
            this.addMessage('You must be at a port to repair! (Stand on P)');
            return;
        }

        if (!port.economy) {
            this.addMessage('This port has no shipyard!');
            return;
        }

        // Check if player has a ship
        if (!this.player.shipDurability) {
            this.addMessage('You don\'t have a ship to repair!');
            return;
        }

        // Create a temporary ship object for repair calculations
        const tempShip = { durability: this.player.shipDurability };

        // Get repair info
        const repairInfo = this.economyManager.getRepairInfo(tempShip, port);

        if (!repairInfo.canRepair) {
            this.addMessage('Your ship is already at full health!');
            return;
        }

        // Execute repair
        const result = this.economyManager.executeRepairTransaction(
            this.player,
            tempShip,
            port
        );

        if (result.success) {
            this.addMessage(`Repaired ${result.hpRepaired} HP for ${result.cost}g! Ship: ${result.newHp}/${result.maxHp} HP`);
        } else {
            this.addMessage(`Repair failed: ${result.error} (Cost: ${repairInfo.totalCost}g)`);
        }
    }

    cookFood() {
        // Determine cooking location based on current position
        const port = this.entityManager.getEntityAt(this.player.x, this.player.y);
        let location = 'campfire'; // Default to campfire

        if (port && port.type === 'port') {
            location = 'port';
        } else if (this.player.mode === 'ship') {
            location = 'ship';
        }

        // Get cookable items
        const cookableItems = this.player.getCookableItems(this.foodSystem);

        if (cookableItems.length === 0) {
            this.addMessage('No cookable food in inventory! (Try catching raw fish)');
            return;
        }

        // For now, cook the first cookable item (in future could add menu)
        const itemToCook = cookableItems[0];
        const result = this.player.cookFood(itemToCook.type, this.foodSystem, location);

        if (result.success) {
            this.addMessage(result.message);
        } else {
            this.addMessage(result.message);
        }
    }

    eatFood() {
        // Check if player has any food
        const foodInventory = this.player.getFoodInventory();

        if (foodInventory.length === 0) {
            this.addMessage('No food in inventory! Press I to check inventory.');
            return;
        }

        // For now, eat the first food item (in future could add menu)
        const foodItem = foodInventory[0];
        const result = this.player.eatFood(foodItem.type, this.foodSystem);

        if (result.success) {
            this.addMessage(result.message);
        } else {
            this.addMessage(result.message);
        }
    }

    examineTile() {
        // Get current tile information
        const x = this.player.x;
        const y = this.player.y;
        const tile = this.mapGenerator.getBiomeAt(x, y);

        if (!tile) {
            this.addMessage(`No tile data at (${x}, ${y})`);
            return;
        }

        // Build detailed tile info message
        let info = `=== Tile at (${x}, ${y}) ===`;

        // Biome information
        info += ` | Biome: ${tile.biome}`;
        info += ` | Walkable: ${tile.walkable ? 'Yes' : 'No'}`;
        info += ` | Ship: ${tile.shipWalkable ? 'Yes' : 'No'}`;

        // Elevation and terrain details
        if (tile.elevation !== undefined) {
            const heightMeters = this.mapGenerator.elevationToMeters(tile.elevation);
            const heightTier = this.mapGenerator.getHeightTier(tile.elevation);
            info += ` | Elevation: ${tile.elevation.toFixed(2)} (${heightMeters}m, ${heightTier})`;
        }
        if (tile.moisture !== undefined) {
            info += ` | Moisture: ${tile.moisture.toFixed(2)}`;
        }
        if (tile.temperature !== undefined) {
            info += ` | Temp: ${tile.temperature.toFixed(2)}`;
        }

        this.addMessage(info);

        // Check for entities at this location
        const entity = this.entityManager.getEntityAt(x, y);
        if (entity) {
            let entityInfo = `Entity: ${entity.type}`;

            if (entity.type === 'port' && entity.economy) {
                const tier = entity.economy.tier || 'unknown';
                const portName = entity.name || 'Unnamed Port';
                entityInfo += ` | Name: ${portName} | Tier: ${tier}`;

                // Show if port has been visited
                if (entity.economy.lastVisit) {
                    entityInfo += ' | Visited';
                }
            } else if (entity.type === 'ship') {
                if (entity.durability) {
                    entityInfo += ` | HP: ${entity.durability.current}/${entity.durability.max}`;
                }
                if (entity.isStartingShip) {
                    entityInfo += ' | Starting Ship';
                }
            } else if (entity.type === 'treasure') {
                entityInfo += ' | $$$';
            }

            this.addMessage(entityInfo);
        }

        // Check for resources
        const locationState = this.resourceManager.getLocationState(x, y);
        if (locationState) {
            const isDepleted = this.resourceManager.isLocationDepleted(x, y);
            if (!isDepleted && locationState.currentResource) {
                const resourceInfo = this.resourceManager.getResourceInfo(locationState.currentResource);
                if (resourceInfo) {
                    this.addMessage(`Resource: ${locationState.currentResource} | Rarity: ${resourceInfo.rarity}`);
                }
            } else if (isDepleted) {
                this.addMessage(`Resource: Depleted (regenerating)`);
            }
        } else {
            // Show what resources are available in this biome
            const biomeResources = this.resourceManager.getBiomeResources(tile.biome);
            if (biomeResources && biomeResources.length > 0) {
                const resourceNames = biomeResources.map(r => r.type).join(', ');
                this.addMessage(`Available resources in ${tile.biome}: ${resourceNames}`);
            }
        }

        // Check weather at location
        const weather = this.weatherManager.getWeatherAt(x, y);
        if (weather) {
            const weatherType = weather > 0.7 ? 'Stormy' : weather > 0.4 ? 'Cloudy' : 'Clear';
            this.addMessage(`Weather: ${weatherType} (${weather.toFixed(2)})`);
        }

        // Fog of war status
        const fogStatus = this.fogOfWar.getTileVisibilityState(x, y);
        if (fogStatus) {
            this.addMessage(`Visibility: ${fogStatus}`);
        }
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
            this.addMessage('⚠ CRITICAL: Your ship is falling apart! Seek port immediately!');
            this.criticalWarningShown = true;
        } else if (hpPercent > 0.2) {
            this.criticalWarningShown = false;
        }

        return false;
    }

    handleShipSinking() {
        this.addMessage('💀 YOUR SHIP HAS SUNK! 💀');
        this.addMessage('You struggle to swim to the nearest shore...');

        // Find nearest land
        const nearestLand = this.findNearestLand(this.player.x, this.player.y);

        if (nearestLand) {
            this.player.x = nearestLand.x;
            this.player.y = nearestLand.y;
            this.player.mode = 'foot';
            this.player.shipDurability = null;
            this.addMessage(`You wash ashore at (${nearestLand.x}, ${nearestLand.y}), exhausted but alive.`);
        } else {
            // Fallback: just switch to foot mode at current location
            this.player.mode = 'foot';
            this.player.shipDurability = null;
            this.addMessage('Somehow you survived and made it to shore!');
        }
    }

    findNearestLand(startX, startY) {
        // Search in expanding radius for walkable land
        for (let radius = 1; radius <= 20; radius++) {
            for (let angle = 0; angle < 360; angle += 30) {
                const testX = Math.round(startX + radius * Math.cos(angle * Math.PI / 180));
                const testY = Math.round(startY + radius * Math.sin(angle * Math.PI / 180));

                const tile = this.mapGenerator.getBiomeAt(testX, testY);
                if (tile && this.mapGenerator.isWalkable(testX, testY, false) && tile.biome !== 'ocean') {
                    return { x: testX, y: testY };
                }
            }
        }
        return null;
    }

    damageShip(amount) {
        if (this.player.mode !== 'ship' || !this.player.shipDurability) {
            return;
        }

        this.player.shipDurability.current = Math.max(0, this.player.shipDurability.current - amount);
        this.player.shipDurability.lastDamage = Date.now();

        const condition = this.entityManager.getShipCondition({ durability: this.player.shipDurability });
        this.addMessage(`⚓ Ship took ${amount} damage! (${this.player.shipDurability.current}/${this.player.shipDurability.max} HP - ${condition})`);

        // Check if ship was destroyed
        this.checkShipDestruction();
    }

    applyWeatherEffects() {
        // Phase 2: Storm damage using new hull system
        if (this.player.mode !== 'ship') {
            return;
        }

        // Get weather at current position
        const weather = this.weatherManager.getWeatherAt(this.player.x, this.player.y);
        if (!weather || weather.type === 'clear') {
            return;
        }

        // Get weather type configuration
        const weatherConfig = this.weatherManager.WEATHER_TYPES[weather.type];
        if (!weatherConfig || weatherConfig.damage === 0) {
            return;
        }

        // Apply storm damage using Phase 1 ship hull system
        const damage = this.player.applyStormDamage(weather.type, weatherConfig.damage);

        if (damage > 0) {
            const shipStats = this.player.getShipStats();
            const hullPercent = shipStats.hullPercent;

            // Weather-specific messages
            if (weather.type === 'hurricane') {
                this.addMessage(`🌀 HURRICANE batters your ship! -${damage} HP (${shipStats.hull}/${shipStats.maxHull})`);
            } else if (weather.type === 'storm') {
                this.addMessage(`⛈️ STORM damages ship! -${damage} HP (${shipStats.hull}/${shipStats.maxHull})`);
            } else if (weather.type === 'rain') {
                this.addMessage(`🌧️ Heavy rain damages ship -${damage} HP (${shipStats.hull}/${shipStats.maxHull})`);
            }

            // Hull damage warnings (Phase 2)
            if (hullPercent <= 10 && hullPercent > 0) {
                this.addMessage(`☠️ HULL FAILING! You are about to sink!`);
            } else if (hullPercent <= 25 && !this.criticalHullWarningShown) {
                this.addMessage(`🚨 CRITICAL DAMAGE! Return to port immediately!`);
                this.criticalHullWarningShown = true;
            } else if (hullPercent <= 50 && !this.moderateHullWarningShown) {
                this.addMessage(`⚠️ Hull damaged - repair at port recommended`);
                this.moderateHullWarningShown = true;
            }

            // Reset warnings if hull is repaired
            if (hullPercent > 25) {
                this.criticalHullWarningShown = false;
            }
            if (hullPercent > 50) {
                this.moderateHullWarningShown = false;
            }

            // Check for death
            if (this.player.isShipDestroyed()) {
                this.handleDeath('shipwreck');
            }
        }
    }

    // ===== PHASE 2: DEATH & RESPAWN SYSTEM =====

    handleDeath(cause) {
        // Phase 2: Stub implementation - will be expanded with shipwreck recovery
        this.addMessage('💀 YOUR SHIP HAS SUNK!');
        this.addMessage(`Lost all cargo at (${this.player.x}, ${this.player.y})`);
        this.addMessage(`Respawning at home port with dinghy... Gold safe: ${this.player.gold}g`);

        // TODO Phase 2: Create shipwreck entity with cargo
        // TODO Phase 2: Implement respawn at home port
        // For now, just reset hull
        this.player.shipHull = this.player.maxShipHull;
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

            this.addMessage(`⚠️ ${weatherType.toUpperCase()} approaching from the ${direction}!`);
            this.lastWeatherWarning = this.turnCount;
        } else if (nearbyWeather.length === 0) {
            this.lastWeatherWarning = null;
        }
    }

    checkDangerZone() {
        // Phase 2: Warn when entering new danger zones
        if (this.player.mode !== 'ship') {
            return;
        }

        const dangerInfo = this.player.getDangerLevel();

        // Check if danger level changed
        if (dangerInfo.level !== this.lastDangerLevel && dangerInfo.level !== 'unknown') {
            const messages = {
                safe: '🟢 Entering safe waters - storms unlikely',
                moderate: '🟡 Weather worsening - storms possible',
                dangerous: '🟠 DANGEROUS WATERS! Storms likely - consider returning to port!',
                extreme: '🔴 EXTREME DANGER! Hurricane risk! Turn back now!'
            };

            if (messages[dangerInfo.level]) {
                this.addMessage(messages[dangerInfo.level]);
            }

            this.lastDangerLevel = dangerInfo.level;
        }
    }

    renderTrading() {
        if (!this.currentTradingPort || !this.currentTradingPort.economy) return '';

        const port = this.currentTradingPort;
        const tierNames = { small: 'Small', medium: 'Medium', large: 'Large', capital: 'Capital' };

        let output = '\n';
        output += '='.repeat(60) + '\n';
        output += `  TRADING AT ${tierNames[port.economy.tier].toUpperCase()} PORT\n`;
        output += '='.repeat(60) + '\n';
        output += `Your Gold: ${this.player.gold}g | Merchant Gold: ${Math.floor(port.economy.gold)}g/${port.economy.maxGold}g\n\n`;

        // Sell section
        output += 'YOUR INVENTORY (Sell):\n';
        output += '-'.repeat(60) + '\n';
        const resources = Object.keys(this.economyManager.BASE_PRICES);
        let hasSellItems = false;
        for (const resource of resources) {
            const qty = this.playerInventory.getQuantity(resource);
            if (qty > 0) {
                hasSellItems = true;
                const sellPrice = this.economyManager.calculateSellPrice(resource, port);
                const basePrice = this.economyManager.BASE_PRICES[resource];
                const indicator = this.economyManager.getPriceIndicator(sellPrice, basePrice);

                // Check port storage space for this resource
                const portStock = port.economy.inventory[resource] || 0;
                const portCapacity = port.economy.inventoryCapacity[resource] || 1;
                const spaceAvailable = portCapacity - portStock;

                let storageInfo = '';
                if (spaceAvailable === 0) {
                    storageInfo = '\x1b[31m(Port FULL)\x1b[0m';
                } else if (spaceAvailable < qty) {
                    storageInfo = `\x1b[33m(Port: ${spaceAvailable} space)\x1b[0m`;
                } else {
                    storageInfo = `\x1b[90m(Port: ${spaceAvailable} space)\x1b[0m`;
                }

                output += `  ${resource.padEnd(10)} x${qty.toString().padStart(3)} | Sell: ${sellPrice.toString().padStart(3)}g ${indicator.padEnd(1)} ${storageInfo}\n`;
            }
        }
        if (!hasSellItems) {
            output += '  (No items to sell)\n';
        }

        output += '\n';

        // Buy section
        output += 'PORT GOODS (Buy):\n';
        output += '-'.repeat(60) + '\n';
        for (const resource of resources) {
            const buyPrice = this.economyManager.calculateBuyPrice(resource, port);
            const basePrice = this.economyManager.BASE_PRICES[resource];
            const indicator = this.economyManager.getPriceIndicator(buyPrice, basePrice);

            // Get stock information
            const stock = port.economy.inventory[resource] || 0;
            const capacity = port.economy.inventoryCapacity[resource] || 1;
            const stockPercent = stock / capacity;

            // Stock status indicator
            let stockStatus = '';
            if (stock === 0) {
                stockStatus = '\x1b[31mOUT OF STOCK\x1b[0m';
            } else if (stockPercent < 0.2) {
                stockStatus = '\x1b[33mVERY LOW\x1b[0m';
            } else if (stockPercent < 0.4) {
                stockStatus = '\x1b[93mLOW\x1b[0m';
            } else if (stockPercent > 0.8) {
                stockStatus = '\x1b[32mHIGH\x1b[0m';
            } else {
                stockStatus = '\x1b[90mNormal\x1b[0m';
            }

            output += `  ${resource.padEnd(10)} | Buy: ${buyPrice.toString().padStart(3)}g ${indicator.padEnd(1)} | Stock: ${Math.floor(stock).toString().padStart(3)}/${capacity.toString().padStart(3)} (${stockStatus})\n`;
        }

        output += '\n';
        output += 'Commands: sell <resource> <qty> | buy <resource> <qty> | T to close\n';
        output += 'Example: sell wood 10 | buy ore 5\n';
        output += '='.repeat(60) + '\n';

        return output;
    }

    handleTradingCommand(input) {
        const parts = input.trim().toLowerCase().split(' ');
        if (parts.length < 3) {
            this.addMessage('Usage: sell/buy <resource> <quantity>');
            return;
        }

        const action = parts[0];
        const resource = parts[1];
        const quantity = parseInt(parts[2]);

        if (isNaN(quantity) || quantity <= 0) {
            this.addMessage('Invalid quantity');
            return;
        }

        if (!this.economyManager.BASE_PRICES[resource]) {
            this.addMessage(`Unknown resource: ${resource}`);
            return;
        }

        if (action === 'sell') {
            const result = this.economyManager.executeSellTransaction(
                this.player,
                this.currentTradingPort,
                resource,
                quantity
            );

            if (result.success) {
                this.addMessage(`Sold ${quantity} ${resource} for ${result.earned}g!`);
            } else {
                this.addMessage(`Cannot sell: ${result.error}`);
            }
        } else if (action === 'buy') {
            const result = this.economyManager.executeBuyTransaction(
                this.player,
                this.currentTradingPort,
                resource,
                quantity
            );

            if (result.success) {
                this.addMessage(`Bought ${quantity} ${resource} for ${result.spent}g!`);
            } else {
                this.addMessage(`Cannot buy: ${result.error}`);
            }
        } else {
            this.addMessage('Unknown action. Use sell or buy');
        }
    }

    // ===== PHASE 1: MVP LOOP - PORT MENU SYSTEM =====

    openPortMenu() {
        // Check if player is at a port and on foot
        if (this.player.mode !== 'foot') {
            this.addMessage('You must disembark to visit port services!');
            return;
        }

        const port = this.entityManager.getEntityAt(this.player.x, this.player.y);

        if (!port || port.type !== 'port') {
            this.addMessage('You must be at a port! (Stand on P)');
            return;
        }

        this.showPortMenu = !this.showPortMenu;
        if (this.showPortMenu) {
            this.currentPort = port;
            const portName = port.portName || 'Port';
            const isHome = this.player.isAtHomePort();
            const label = isHome ? `${portName} (HOME PORT)` : portName;
            this.addMessage(`Opened port services at ${label}`);
        } else {
            this.currentPort = null;
            this.addMessage('Closed port services');
        }
    }

    renderPortMenu() {
        if (!this.currentPort) return '';

        const port = this.currentPort;
        const portName = port.portName || 'Port';
        const isHome = this.player.isAtHomePort();

        let output = '\n';
        output += '='.repeat(60) + '\n';
        output += `  ${portName.toUpperCase()}`;
        if (isHome) output += ' - HOME PORT';
        output += '\n';
        output += '='.repeat(60) + '\n';

        const cargoSummary = this.player.getCargoSummary();
        const shipStats = this.player.getShipStats();
        const distance = isHome ? 0 : Math.floor(this.player.getDistanceToHome() || 0);

        output += `Gold: ${this.player.gold}g | Ship: ${shipStats.type} | Cargo: ${cargoSummary.weight}/${cargoSummary.maxWeight}\n`;
        output += `Hull: ${shipStats.hull}/${shipStats.maxHull} HP`;
        if (!isHome) {
            output += ` | Distance from home: ${distance} tiles`;
        }
        output += '\n\n';

        output += 'PORT SERVICES:\n';
        output += '-'.repeat(60) + '\n';
        output += '1. MERCHANT - Sell Treasure\n';
        output += '2. SHIPYARD - Buy Ships & Repair\n';
        output += '3. Leave Port\n\n';

        // Show cargo contents
        if (cargoSummary.count > 0) {
            output += 'CARGO HOLD:\n';
            output += '-'.repeat(60) + '\n';
            const treasures = this.player.cargoHold.filter(item => item.type === 'treasure');
            if (treasures.length > 0) {
                let totalValue = 0;
                treasures.forEach((treasure, i) => {
                    output += `${i + 1}. ${treasure.name} (${treasure.rarity}) - ${treasure.value}g [${treasure.weight}]\n`;
                    totalValue += treasure.value;
                });
                output += `Total treasure value: ${totalValue}g\n`;
            }
            output += '\n';
        } else {
            output += 'Cargo hold empty.\n\n';
        }

        output += 'Commands: 1=Merchant, 2=Shipyard, 3=Leave, P=Close\n';
        return output;
    }

    handlePortMenuCommand(input) {
        const command = input.trim();

        if (command === '1') {
            this.openMerchant();
        } else if (command === '2') {
            this.openShipyard();
        } else if (command === '3' || command.toLowerCase() === 'leave') {
            this.showPortMenu = false;
            this.currentPort = null;
            this.addMessage('Left port services');
        } else {
            this.addMessage('Invalid command. Use 1, 2, or 3');
        }
    }

    openMerchant() {
        const treasures = this.player.cargoHold.filter(item => item.type === 'treasure');

        if (treasures.length === 0) {
            this.addMessage('No treasure to sell!');
            return;
        }

        // Sell all treasure
        const result = this.entityManager.sellTreasure(this.player, 'all');
        this.addMessage(result.message);
    }

    openShipyard() {
        if (!this.entityManager.shipSystem) {
            this.addMessage('Shipyard not available!');
            return;
        }

        const availableShips = this.entityManager.shipSystem.getAvailableShips(this.player.gold);
        const damage = this.player.maxShipHull - this.player.shipHull;

        let output = '\n';
        output += '='.repeat(60) + '\n';
        output += '  SHIPYARD\n';
        output += '='.repeat(60) + '\n';
        output += `Current Ship: ${this.player.currentShip} | Hull: ${this.player.shipHull}/${this.player.maxShipHull} HP\n`;
        output += `Your Gold: ${this.player.gold}g\n\n`;

        // Repair option
        if (damage > 0) {
            const repairCost = damage * 2;
            output += `REPAIR: Restore ${damage} HP for ${repairCost}g (R to repair)\n\n`;
        } else {
            output += 'Ship at full hull.\n\n';
        }

        // Available ships
        output += 'AVAILABLE SHIPS:\n';
        output += '-'.repeat(60) + '\n';
        availableShips.forEach((ship, i) => {
            const canAfford = ship.canAfford ? '✓' : '✗';
            output += `${i + 1}. ${ship.name} - ${ship.cost}g ${canAfford}\n`;
            output += `   Cargo: ${ship.maxCargo} | Hull: ${ship.maxHull} | Speed: ${ship.speed}x\n`;
            output += `   ${ship.description}\n`;
        });

        output += '\nCommands: 1-5=Buy ship, R=Repair, ESC=Back\n';
        console.log(output);

        // Get input
        this.rl.question('> ', (answer) => {
            this.handleShipyardCommand(answer.trim());
            this.render();
        });
    }

    handleShipyardCommand(input) {
        if (input.toLowerCase() === 'r') {
            const result = this.entityManager.repairShip(this.player, 2);
            this.addMessage(result.message);
            return;
        }

        const shipIndex = parseInt(input) - 1;
        if (isNaN(shipIndex)) {
            this.addMessage('Invalid command');
            return;
        }

        const availableShips = this.entityManager.shipSystem.getAvailableShips(this.player.gold);
        if (shipIndex < 0 || shipIndex >= availableShips.length) {
            this.addMessage('Invalid ship number');
            return;
        }

        const selectedShip = availableShips[shipIndex];
        const result = this.entityManager.buyShip(this.player, selectedShip.key);
        this.addMessage(result.message);
    }

    renderCargoInventory() {
        const cargoSummary = this.player.getCargoSummary();
        const shipStats = this.player.getShipStats();

        let output = '\n';
        output += '='.repeat(60) + '\n';
        output += '  CARGO HOLD\n';
        output += '='.repeat(60) + '\n';
        output += `Ship: ${shipStats.type} | Cargo: ${cargoSummary.weight}/${cargoSummary.maxWeight} units\n`;
        output += `Total value: ${this.player.getCargoValue()}g\n\n`;

        if (cargoSummary.count === 0) {
            output += 'Cargo hold is empty.\n';
        } else {
            output += 'CARGO:\n';
            output += '-'.repeat(60) + '\n';
            this.player.cargoHold.forEach((item, i) => {
                if (item.type === 'treasure') {
                    const raritySymbol = {
                        common: '○',
                        uncommon: '◐',
                        rare: '●',
                        legendary: '★'
                    }[item.rarity] || '○';
                    output += `${i + 1}. ${raritySymbol} ${item.name} - ${item.value}g [weight: ${item.weight}]\n`;
                    if (item.foundAt) {
                        output += `   Found at (${item.foundAt.x}, ${item.foundAt.y})\n`;
                    }
                } else {
                    output += `${i + 1}. ${item.name} (${item.type})\n`;
                }
            });
        }

        output += '\nPress I to close\n';
        return output;
    }

    render() {
        console.clear();

        // Update camera
        this.mapGenerator.updateCamera(this.player.x, this.player.y);

        // Get visible tiles
        const visibleTiles = this.mapGenerator.getVisibleTiles();

        // Create display buffer
        let display = '';

        for (let y = 0; y < this.mapGenerator.displayHeight; y++) {
            let line = '';
            for (let x = 0; x < this.mapGenerator.displayWidth; x++) {
                const tileData = visibleTiles.find(t => t.screenX === x && t.screenY === y);

                if (tileData) {
                    // Check fog of war visibility state
                    const visibilityState = this.fogOfWar.getTileVisibilityState(tileData.worldX, tileData.worldY);

                    if (visibilityState === 'hidden') {
                        // Tile has never been explored - show as blank
                        line += ' ';
                    } else if (tileData.worldX === this.player.x && tileData.worldY === this.player.y) {
                        // Player is always visible at their position
                        line += `\x1b[91m${this.player.getIcon()}\x1b[0m`;
                    } else {
                        const isVisible = visibilityState === 'visible';
                        const isExplored = visibilityState === 'explored';

                        // Check if there's weather at this position (only show if visible)
                        const weather = this.weatherManager.getWeatherAt(tileData.worldX, tileData.worldY);
                        const hasWeather = weather && weather.type !== 'clear';

                        // Check if there's an entity at this position (only show if visible)
                        const entity = this.entityManager.getEntityAt(tileData.worldX, tileData.worldY);

                        if (entity && isVisible) {
                            // Use dynamic icon/color for ships based on durability
                            let char, color;
                            if (entity.type === 'ship' && entity.durability) {
                                char = this.entityManager.getShipIcon(entity);
                                color = this.hexToAnsi(this.entityManager.getShipColor(entity));
                            } else {
                                const entityInfo = this.entityManager.entityTypes[entity.type];
                                char = entityInfo.char;
                                color = this.hexToAnsi(entityInfo.color);
                            }
                            line += `${color}${char}\x1b[0m`;
                        } else if (hasWeather && isVisible) {
                            // Show weather overlay if no entity (only if visible)
                            const weatherType = this.weatherManager.WEATHER_TYPES[weather.type];
                            if (weatherType && weatherType.char) {
                                // Convert hex color to ANSI
                                const ansiColor = this.hexToAnsi(weatherType.color);
                                line += `${ansiColor}${weatherType.char}\x1b[0m`;
                            } else {
                                // Fallback to terrain
                                const glyphInfo = this.mapGenerator.generateResourceGlyph(
                                    tileData.worldX,
                                    tileData.worldY,
                                    tileData.tile.biome,
                                    this.resourceManager,
                                    'terminal'
                                );
                                const ansiColor = this.hexToAnsi(glyphInfo.color);
                                const finalColor = isExplored ? this.dimColor(ansiColor) : ansiColor;
                                line += `${finalColor}${glyphInfo.char}\x1b[0m`;
                            }
                        } else {
                            // Show terrain (dimmed if only explored, not visible)
                            const glyphInfo = this.mapGenerator.generateResourceGlyph(
                                tileData.worldX,
                                tileData.worldY,
                                tileData.tile.biome,
                                this.resourceManager,
                                'terminal'
                            );
                            const ansiColor = this.hexToAnsi(glyphInfo.color);
                            const finalColor = isExplored ? this.dimColor(ansiColor) : ansiColor;
                            line += `${finalColor}${glyphInfo.char}\x1b[0m`;
                        }
                    }
                } else {
                    line += ' ';
                }
            }
            display += line + '\n';
        }

        console.log(display);

        // Display status with time of day and visibility info
        const timeStr = this.fogOfWar.getTimeOfDayString();
        const timePeriod = this.fogOfWar.getTimeOfDayPeriod();
        const viewRadius = this.fogOfWar.getViewRadius();

        // Get health and hunger info
        const health = this.player.getHealth();
        const hungerStatus = this.foodSystem.getHungerStatus(this.player.hunger);

        // Phase 1: MVP Loop - Enhanced status display
        const cargoSummary = this.player.getCargoSummary();
        const shipStats = this.player.getShipStats();
        const distanceToHome = this.player.getDistanceToHome();

        // Phase 2: Danger level display
        const dangerInfo = this.player.getDangerLevel();
        const dangerIcons = {
            safe: '🟢',
            moderate: '🟡',
            dangerous: '🟠',
            extreme: '🔴',
            unknown: '⚪'
        };
        const dangerIcon = dangerIcons[dangerInfo.level] || '⚪';

        console.log(`\nPosition: (${this.player.x}, ${this.player.y}) | Mode: ${this.player.mode} | Gold: ${this.player.gold}g`);
        console.log(`Health: ${health.current}/${health.max} HP | Hunger: ${Math.floor(this.player.hunger)}% (${hungerStatus.message})`);
        console.log(`Ship: ${shipStats.type} | Hull: ${shipStats.hull}/${shipStats.maxHull} HP | Cargo: ${cargoSummary.weight}/${cargoSummary.maxWeight}`);

        if (distanceToHome !== null) {
            console.log(`Home: ${Math.floor(distanceToHome)} tiles ${dangerIcon} ${dangerInfo.level.toUpperCase()} | Time: ${timeStr} (${timePeriod})`);
        } else {
            console.log(`Time: ${timeStr} (${timePeriod}) | Visibility: ${viewRadius} tiles`);
        }

        console.log('Controls: WASD=Move, B=Board/Disembark, I=Cargo, P=Port, G=Gather, T=Trade, C=Cook, E=Eat, X=Examine, Q=Quit');

        // Phase 1: Display port menu if active
        if (this.showPortMenu) {
            console.log(this.renderPortMenu());
            console.log('\nType your command and press Enter:');
        }

        // Display trading if active
        if (this.showTrading && !this.showPortMenu) {
            console.log(this.renderTrading());
            console.log('\nType your command and press Enter:');
        }

        // Display cargo inventory if toggled (Phase 1: MVP Loop)
        if (this.showInventory && !this.showTrading && !this.showPortMenu) {
            console.log(this.renderCargoInventory());

            // Also show resource inventory below cargo
            console.log('\n--- Resources ---');
            console.log(this.playerInventory.getInventoryDisplayTerminal(this.resourceManager));

            // Display food inventory
            const foodInventory = this.player.getFoodInventory();
            if (foodInventory.length > 0) {
                console.log('\n--- Food Inventory ---');
                foodInventory.forEach(item => {
                    const foodInfo = this.foodSystem.getFoodInfo(item.type);
                    const spoiled = this.foodSystem.isSpoiled(item, this.player.gameTime);
                    const status = spoiled ? ' [SPOILED]' : '';
                    const cookable = this.foodSystem.canCook(item.type) ? ' (cookable)' : '';
                    console.log(`  ${foodInfo.name} x${item.quantity}${status}${cookable} - ${foodInfo.restores}HP, ${foodInfo.hungerRestore}% hunger`);
                });
            } else {
                console.log('\n--- Food Inventory ---');
                console.log('  (no food)');
            }
        }

        // Display recent messages
        if (this.messageLog.length > 0) {
            console.log('\nMessages:');
            this.messageLog.slice(-3).forEach(msg => console.log(`  ${msg}`));
        }
    }

    hexToAnsi(hexColor) {
        if (!hexColor) return '\x1b[37m'; // Default to white

        // If it's already an ANSI code, return it as-is
        if (hexColor.startsWith('\x1b[')) {
            return hexColor;
        }

        // Use displayAdapter's comprehensive color map
        return this.displayAdapter.toAnsi(hexColor);
    }

    dimColor(ansiColor) {
        // Dim ANSI colors for explored-but-not-visible tiles
        // Convert bright colors to dark equivalents
        const dimMap = {
            '\x1b[34m': '\x1b[90m',   // Blue → Dark gray
            '\x1b[33m': '\x1b[90m',   // Yellow → Dark gray
            '\x1b[31m': '\x1b[90m',   // Red → Dark gray
            '\x1b[91m': '\x1b[90m',   // Bright red → Dark gray
            '\x1b[32m': '\x1b[90m',   // Green → Dark gray
            '\x1b[92m': '\x1b[90m',   // Bright green → Dark gray
            '\x1b[36m': '\x1b[90m',   // Cyan → Dark gray
            '\x1b[35m': '\x1b[90m',   // Magenta → Dark gray
            '\x1b[37m': '\x1b[90m',   // White → Dark gray
            '\x1b[93m': '\x1b[90m',   // Bright yellow → Dark gray
            '\x1b[97m': '\x1b[90m'    // Bright white → Dark gray
        };

        return dimMap[ansiColor] || '\x1b[90m'; // Default to dark gray
    }

    addMessage(message) {
        this.messageLog.push(message);
        if (this.messageLog.length > 10) {
            this.messageLog.shift();
        }
    }

    quit() {
        console.clear();
        console.log('Thanks for playing Pirate Sea!');
        this.rl.close();
        process.exit(0);
    }
}

// Start the game
if (require.main === module) {
    // Check for seed argument
    const args = process.argv.slice(2);
    let seed = null;
    
    // Look for --seed argument
    const seedIndex = args.indexOf('--seed');
    if (seedIndex !== -1 && seedIndex + 1 < args.length) {
        seed = parseInt(args[seedIndex + 1]);
        if (isNaN(seed)) {
            console.log('Invalid seed provided. Using random seed.');
            seed = null;
        }
    }
    
    const game = new TerminalGame(seed);
    game.initialize();
}