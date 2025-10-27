// Entity management system for ships, ports, and treasure
// Import dependencies if in Node.js environment
let NameGenerator, TreasureSystem, ShipSystem;
if (typeof require !== 'undefined') {
    try {
        NameGenerator = require('./nameGenerator.js');
    } catch (e) {
        // NameGenerator not available - names will be skipped
    }
    try {
        TreasureSystem = require('./treasure.js');
    } catch (e) {
        // TreasureSystem not available
    }
    try {
        ShipSystem = require('./ships.js');
    } catch (e) {
        // ShipSystem not available
    }
}

class EntityManager {
    constructor(mapGenerator, economyManager = null) {
        this.mapGenerator = mapGenerator;
        this.entities = new Map(); // Key: 'x,y', Value: entity object
        this.entityTypes = {
            ship: { char: 'S', color: '#8b4513' },
            port: { char: 'P', color: '#e74c3c' },
            treasure: { char: '$', color: '#f1c40f' }
        };

        // Use the same seeded random as the map generator
        this.seededRandom = mapGenerator.seededRandom;

        // Economy manager for trading system
        this.economyManager = economyManager;

        // Name generator for islands and ports
        if (typeof NameGenerator !== 'undefined') {
            this.nameGenerator = new NameGenerator(mapGenerator.getSeed());
        }

        // Phase 1: MVP Loop Systems
        if (typeof TreasureSystem !== 'undefined') {
            this.treasureSystem = new TreasureSystem(this.seededRandom);
        }
        if (typeof ShipSystem !== 'undefined') {
            this.shipSystem = new ShipSystem();
        }

        // Track discovered islands to avoid duplicate port spawning
        this.discoveredIslands = new Map(); // Key: 'x,y' (representative tile), Value: island data

        // Track spawn regions for dynamic entity generation
        this.spawnedRegions = new Set(); // Set of region keys 'chunkX,chunkY'
        this.regionSize = 120; // Size of each spawn region (covers 120x120 tiles)
    }
    
    addEntity(entity) {
        const key = `${entity.x},${entity.y}`;
        this.entities.set(key, entity);
    }
    
    removeEntity(x, y) {
        const key = `${x},${y}`;
        return this.entities.delete(key);
    }
    
    getEntityAt(x, y) {
        const key = `${x},${y}`;
        return this.entities.get(key);
    }
    
    getAllEntities() {
        return Array.from(this.entities.values());
    }
    
    getEntitiesByType(type) {
        return Array.from(this.entities.values()).filter(entity => entity.type === type);
    }
    
    isPositionOccupied(x, y) {
        return this.entities.has(`${x},${y}`);
    }

    // Create durability data for a ship
    createShipDurability(maxHull = 100) {
        return {
            current: maxHull,
            max: maxHull,
            lastDamage: null
        };
    }

    // Get ship condition based on durability
    getShipCondition(ship) {
        if (!ship.durability) return 'unknown';
        const percent = ship.durability.current / ship.durability.max;
        if (percent >= 0.9) return 'excellent';
        if (percent >= 0.6) return 'good';
        if (percent >= 0.3) return 'damaged';
        if (percent > 0) return 'critical';
        return 'destroyed';
    }

    // Get ship icon based on condition
    getShipIcon(ship) {
        const condition = this.getShipCondition(ship);
        const icons = {
            excellent: 'S',
            good: 'S',
            damaged: 's',
            critical: 's',
            destroyed: 'x'
        };
        return icons[condition] || 'S';
    }

    // Get ship color based on condition
    getShipColor(ship) {
        const condition = this.getShipCondition(ship);
        const colors = {
            excellent: '#8b4513',
            good: '#8b4513',
            damaged: '#d4a574',
            critical: '#ff6b6b',
            destroyed: '#666666'
        };
        return colors[condition] || '#8b4513';
    }
    
    // Get region key for a position
    getRegionKey(x, y) {
        const regionX = Math.floor(x / this.regionSize);
        const regionY = Math.floor(y / this.regionSize);
        return `${regionX},${regionY}`;
    }

    // Check if we need to spawn entities for current player position
    shouldSpawnForPosition(x, y) {
        const regionKey = this.getRegionKey(x, y);
        return !this.spawnedRegions.has(regionKey);
    }

    // Spawn entities in a new region (called dynamically during exploration)
    spawnEntitiesInRegion(centerX, centerY) {
        const regionKey = this.getRegionKey(centerX, centerY);

        if (this.spawnedRegions.has(regionKey)) {
            return 0; // Already spawned in this region
        }

        console.log(`Spawning entities in new region ${regionKey}...`);
        this.spawnedRegions.add(regionKey);

        const initialCount = this.entities.size;

        // Spawn entities in this region (radius 60 from region center)
        const regionCenterX = Math.floor(centerX / this.regionSize) * this.regionSize + (this.regionSize / 2);
        const regionCenterY = Math.floor(centerY / this.regionSize) * this.regionSize + (this.regionSize / 2);

        this.spawnPorts(regionCenterX, regionCenterY, 60);
        this.spawnTreasure(regionCenterX, regionCenterY, 60);
        this.spawnShips(regionCenterX, regionCenterY, 60);
        this.spawnBottles(regionCenterX, regionCenterY, 60); // Phase 3

        const spawnedCount = this.entities.size - initialCount;
        console.log(`Spawned ${spawnedCount} new entities in region ${regionKey}`);
        return spawnedCount;
    }

    spawnEntities(playerX = 0, playerY = 0) {
        console.log('Spawning entities around player...');

        // Clear existing entities
        this.entities.clear();
        this.spawnedRegions.clear();

        // First, spawn a ship near the player's starting location
        this.spawnPlayerStartingShip(playerX, playerY);

        // Mark starting region as spawned
        this.spawnedRegions.add(this.getRegionKey(playerX, playerY));

        // Then spawn other entities for the ocean-dominated world
        this.spawnPorts(playerX, playerY);
        this.spawnTreasure(playerX, playerY);
        this.spawnShips(playerX, playerY);
        this.spawnBottles(playerX, playerY); // Phase 3

        console.log(`Spawned ${this.entities.size} entities total`);
    }
    
    spawnPlayerStartingShip(playerX, playerY) {
        console.log('Spawning starting ship near player...');
        
        // Use coastal analysis to find the best ship placement near the player
        const coastalInfo = this.mapGenerator.analyzeCoastalArea(playerX, playerY, 5);
        
        if (coastalInfo.isCoastal && coastalInfo.bestEmbarkPoints.length > 0) {
            // Find the closest available embark point
            const availableEmbarkPoints = coastalInfo.bestEmbarkPoints.filter(pos => 
                !this.isPositionOccupied(pos.x, pos.y)
            );
            
            if (availableEmbarkPoints.length > 0) {
                const shipLocation = availableEmbarkPoints[0]; // Best location (already sorted)
                
                const startingShip = {
                    type: 'ship',
                    x: shipLocation.x,
                    y: shipLocation.y,
                    char: 'S',
                    color: '#8b4513',
                    isStartingShip: true,
                    playerSpawn: true,
                    durability: this.createShipDurability(100)
                };
                
                this.addEntity(startingShip);
                console.log(`Starting ship spawned at (${shipLocation.x}, ${shipLocation.y})`);
                return true;
            }
        }
        
        // Fallback: look for any nearby navigable water within a larger radius
        for (let radius = 2; radius <= 10; radius++) {
            const oceanTiles = this.getAvailableOceanTiles(playerX, playerY, radius);
            const navigableOceanTiles = oceanTiles.filter(tile => tile.navigable);
            
            if (navigableOceanTiles.length > 0) {
                // Sort by distance to player
                navigableOceanTiles.sort((a, b) => {
                    const distA = Math.sqrt((a.x - playerX) ** 2 + (a.y - playerY) ** 2);
                    const distB = Math.sqrt((b.x - playerX) ** 2 + (b.y - playerY) ** 2);
                    return distA - distB;
                });
                
                const shipLocation = navigableOceanTiles[0];
                const startingShip = {
                    type: 'ship',
                    x: shipLocation.x,
                    y: shipLocation.y,
                    char: 'S',
                    color: '#8b4513',
                    isStartingShip: true,
                    playerSpawn: true,
                    durability: this.createShipDurability(100)
                };
                
                this.addEntity(startingShip);
                console.log(`Starting ship spawned at (${shipLocation.x}, ${shipLocation.y}) - fallback method`);
                return true;
            }
        }
        
        console.log('Could not find suitable location for starting ship');
        return false;
    }
    
    // Island-aware port spawning system
    spawnPorts(centerX, centerY, radius = 60) {
        console.log('Starting island-aware port spawning...');

        // Scan area for land tiles
        const scanRadius = radius;
        const landTiles = [];

        for (let y = centerY - scanRadius; y < centerY + scanRadius; y++) {
            for (let x = centerX - scanRadius; x < centerX + scanRadius; x++) {
                const tile = this.mapGenerator.getBiomeAt(x, y);
                if (tile && tile.biome !== 'ocean') {
                    landTiles.push({ x, y });
                }
            }
        }

        console.log(`Found ${landTiles.length} land tiles to analyze`);

        // Discover and process islands
        const processedTiles = new Set();
        let totalPortsSpawned = 0;
        let islandsProcessed = 0;

        for (const landTile of landTiles) {
            const key = `${landTile.x},${landTile.y}`;

            // Skip if already processed as part of another island
            if (processedTiles.has(key)) continue;

            // Discover this island
            const island = this.discoverIsland(landTile.x, landTile.y, processedTiles);

            if (island && island.size >= 10) { // Only spawn ports on islands with 10+ tiles
                islandsProcessed++;
                const portsSpawned = this.spawnPortsOnIsland(island);
                totalPortsSpawned += portsSpawned;

                console.log(`Island "${island.name}" (${island.size} tiles): spawned ${portsSpawned} ports`);
            }
        }

        console.log(`Processed ${islandsProcessed} islands, spawned ${totalPortsSpawned} total ports`);
    }

    // Discover an island starting from a land tile
    discoverIsland(startX, startY, globalProcessed = new Set()) {
        const tile = this.mapGenerator.getBiomeAt(startX, startY);
        if (!tile || tile.biome === 'ocean') return null;

        // Use analyzeLandmass to get island data
        const landmassData = this.mapGenerator.analyzeLandmass(startX, startY, 500);

        if (landmassData.size === 0) return null;

        // Mark all tiles as processed using flood fill
        const visited = new Set();
        const queue = [[startX, startY]];
        const islandTiles = [];

        while (queue.length > 0 && visited.size < landmassData.size + 100) {
            const [x, y] = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key) || globalProcessed.has(key)) continue;

            const currentTile = this.mapGenerator.getBiomeAt(x, y);
            if (!currentTile || currentTile.biome === 'ocean') continue;

            visited.add(key);
            globalProcessed.add(key);
            islandTiles.push({ x, y, biome: currentTile.biome });

            // Add adjacent tiles
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of directions) {
                const newKey = `${x + dx},${y + dy}`;
                if (!visited.has(newKey) && !globalProcessed.has(newKey)) {
                    queue.push([x + dx, y + dy]);
                }
            }
        }

        // Generate island name
        const islandName = this.nameGenerator
            ? this.nameGenerator.generateIslandName(startX, startY, landmassData.size)
            : `Island_${startX}_${startY}`;

        const island = {
            centerX: startX,
            centerY: startY,
            size: landmassData.size,
            name: islandName,
            tiles: islandTiles,
            biomes: landmassData.biomes,
            diversity: landmassData.diversity,
            richness: landmassData.richness
        };

        // Store in discovered islands
        this.discoveredIslands.set(`${startX},${startY}`, island);

        return island;
    }

    // Determine how many ports to spawn on an island based on size
    getPortCountForIsland(size) {
        if (size < 10) return 0;           // Tiny: no ports
        if (size < 30) return 1;           // Small: 1 port
        if (size < 80) return 1 + Math.floor(Math.random() * 2); // Medium: 1-2 ports
        if (size < 150) return 2 + Math.floor(Math.random() * 3); // Large: 2-4 ports
        if (size < 300) return 3 + Math.floor(Math.random() * 4); // Huge: 3-6 ports
        return 5 + Math.floor(Math.random() * 4); // Massive: 5-8 ports
    }

    // Spawn ports on a specific island
    spawnPortsOnIsland(island) {
        const portCount = this.getPortCountForIsland(island.size);
        if (portCount === 0) return 0;

        // Find coastal tiles (land tiles adjacent to ocean)
        const coastalTiles = this.findCoastalTiles(island);

        if (coastalTiles.length === 0) {
            console.log(`Warning: Island "${island.name}" has no coastal tiles!`);
            return 0;
        }

        // Distribute ports around the coastline
        const portLocations = this.distributePortsAlongCoast(coastalTiles, portCount);

        let portsSpawned = 0;
        for (const location of portLocations) {
            if (this.isPositionOccupied(location.x, location.y)) continue;

            // Generate port name
            const portName = this.nameGenerator
                ? this.nameGenerator.generatePortName(location.x, location.y, island.name)
                : `Port_${location.x}_${location.y}`;

            const port = {
                type: 'port',
                x: location.x,
                y: location.y,
                char: 'P',
                color: '#e74c3c',
                hasShips: true,
                shipsAvailable: this.seededRandom.randomInt(1, 3),
                lastVisited: null,
                // Island and name data
                islandName: island.name,
                portName: portName,
                islandSize: island.size
            };

            // Initialize economy data if economy manager is available
            if (this.economyManager) {
                port.economy = this.economyManager.determinePortEconomy(port, this.mapGenerator);
            }

            this.addEntity(port);
            portsSpawned++;
        }

        return portsSpawned;
    }

    // Find all coastal tiles on an island (land tiles adjacent to ocean)
    findCoastalTiles(island) {
        const coastalTiles = [];
        const checkedTiles = new Set();

        for (const tile of island.tiles) {
            const key = `${tile.x},${tile.y}`;
            if (checkedTiles.has(key)) continue;
            checkedTiles.add(key);

            // Check if this land tile is adjacent to ocean
            let adjacentToOcean = false;
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

            for (const [dx, dy] of directions) {
                const neighborTile = this.mapGenerator.getBiomeAt(tile.x + dx, tile.y + dy);
                if (neighborTile && neighborTile.biome === 'ocean') {
                    adjacentToOcean = true;
                    break;
                }
            }

            if (adjacentToOcean) {
                // Prefer walkable tiles for ports
                const isWalkable = this.mapGenerator.isWalkable(tile.x, tile.y, false);
                coastalTiles.push({
                    x: tile.x,
                    y: tile.y,
                    biome: tile.biome,
                    walkable: isWalkable
                });
            }
        }

        // Prioritize walkable coastal tiles
        return coastalTiles.sort((a, b) => b.walkable - a.walkable);
    }

    // Distribute ports evenly around the coastline
    distributePortsAlongCoast(coastalTiles, portCount) {
        if (coastalTiles.length === 0) return [];
        if (portCount >= coastalTiles.length) return coastalTiles;

        // Select evenly spaced ports around the coast
        const portLocations = [];
        const step = Math.floor(coastalTiles.length / portCount);

        for (let i = 0; i < portCount; i++) {
            const index = (i * step) % coastalTiles.length;
            portLocations.push(coastalTiles[index]);
        }

        return portLocations;
    }
    
    spawnTreasure(centerX, centerY, radius = 60) {
        const treasureCount = 30; // More treasure for increased land availability
        const walkableTiles = this.getAvailableWalkableTiles(centerX, centerY, radius);

        for (let i = 0; i < treasureCount && walkableTiles.length > 0; i++) {
            const randomIndex = Math.floor(this.seededRandom.random() * walkableTiles.length);
            const tile = walkableTiles[randomIndex];

            // Generate treasure data using TreasureSystem (Phase 1: MVP Loop)
            let treasureData = null;
            let color = '#f1c40f'; // Default yellow
            if (this.treasureSystem) {
                treasureData = this.treasureSystem.generateTreasure({
                    position: { x: tile.x, y: tile.y }
                });
                // Use rarity-based color
                const display = this.treasureSystem.getTreasureDisplay(treasureData.rarity);
                color = display.color;
            }

            const treasure = {
                type: 'treasure',
                x: tile.x,
                y: tile.y,
                char: '$',
                color: color,
                treasureData: treasureData // Store treasure data for collection
            };

            this.addEntity(treasure);
            walkableTiles.splice(randomIndex, 1); // Remove used tile
        }

        console.log(`Spawned ${Math.min(treasureCount, walkableTiles.length)} treasures`);
    }
    
    spawnShips(centerX, centerY, radius = 60) {
        const shipCount = 20; // Ships for 80% water world
        const oceanTiles = this.getAvailableOceanTiles(centerX, centerY, radius);

        for (let i = 0; i < shipCount && oceanTiles.length > 0; i++) {
            const randomIndex = Math.floor(this.seededRandom.random() * oceanTiles.length);
            const tile = oceanTiles[randomIndex];

            const ship = {
                type: 'ship',
                x: tile.x,
                y: tile.y,
                char: 'S',
                color: '#8b4513',
                durability: this.createShipDurability(100)
            };

            this.addEntity(ship);
            oceanTiles.splice(randomIndex, 1); // Remove used tile
        }

        console.log(`Spawned ${Math.min(shipCount, oceanTiles.length)} ships`);
    }

    // Phase 3: Floating Bottles
    spawnBottles(centerX, centerY, radius = 60) {
        const bottleCount = 8; // Fewer bottles than treasure (rare finds)
        const oceanTiles = this.getAvailableOceanTiles(centerX, centerY, radius);

        for (let i = 0; i < bottleCount && oceanTiles.length > 0; i++) {
            const randomIndex = Math.floor(this.seededRandom.random() * oceanTiles.length);
            const tile = oceanTiles[randomIndex];

            // 60% treasure map, 40% rare treasure
            const containsMap = this.seededRandom.random() < 0.6;

            const bottle = {
                type: 'bottle',
                x: tile.x,
                y: tile.y,
                char: 'B',
                color: '#3498db', // Blue
                containsMap: containsMap,
                description: containsMap ? 'A floating bottle (contains a map)' : 'A floating bottle (contains treasure)'
            };

            this.addEntity(bottle);
            oceanTiles.splice(randomIndex, 1); // Remove used tile
        }

        console.log(`Spawned ${Math.min(bottleCount, oceanTiles.length)} bottles`);
    }

    getAvailableWalkableTiles(centerX = 0, centerY = 0, radius = 60) {
        const walkableTiles = [];
        
        for (let y = centerY - radius; y < centerY + radius; y++) {
            for (let x = centerX - radius; x < centerX + radius; x++) {
                const tile = this.mapGenerator.getBiomeAt(x, y);
                if (tile && this.mapGenerator.isWalkable(x, y, false)) {
                    // Exclude ocean, mountain, and swamp as per PRD
                    if (tile.biome !== 'ocean' && tile.biome !== 'mountain' && tile.biome !== 'swamp') {
                        if (!this.isPositionOccupied(x, y)) {
                            walkableTiles.push({ x, y });
                        }
                    }
                }
            }
        }
        
        return walkableTiles;
    }
    
    getAvailableOceanTiles(centerX = 0, centerY = 0, radius = 50) {
        const oceanTiles = [];
        
        for (let y = centerY - radius; y < centerY + radius; y++) {
            for (let x = centerX - radius; x < centerX + radius; x++) {
                const tile = this.mapGenerator.getBiomeAt(x, y);
                if (tile && tile.biome === 'ocean') {
                    if (!this.isPositionOccupied(x, y)) {
                        // Prefer navigable water for ship placement
                        const isNavigable = this.mapGenerator.isShipPlacementValid(x, y);
                        oceanTiles.push({ x, y, navigable: isNavigable });
                    }
                }
            }
        }
        
        // Sort by navigability (navigable water first)
        return oceanTiles.sort((a, b) => b.navigable - a.navigable);
    }
    
    interactWithEntity(x, y, player) {
        const entity = this.getEntityAt(x, y);
        if (!entity) {
            return { success: false, message: 'Nothing to interact with here.' };
        }
        
        // Only allow interactions in foot mode
        if (player.getMode() !== 'foot') {
            return { success: false, message: 'Cannot interact while on ship.' };
        }
        
        switch (entity.type) {
            case 'treasure':
                return this.collectTreasure(entity, player);

            case 'port':
                return this.visitPort(entity, player);

            case 'ship':
                return { success: false, message: 'Use the board command to board the ship.' };

            case 'shipwreck':
                return this.salvageShipwreck(entity, player);

            default:
                return { success: false, message: 'Unknown entity type.' };
        }
    }

    collectTreasure(treasureEntity, player) {
        // Generate or use existing treasure data
        let treasureItem;
        if (treasureEntity.treasureData) {
            // Already has treasure data (from map generation)
            treasureItem = treasureEntity.treasureData;
        } else if (this.treasureSystem) {
            // Generate new treasure
            treasureItem = this.treasureSystem.generateTreasure({
                position: { x: treasureEntity.x, y: treasureEntity.y }
            });
        } else {
            // Fallback if TreasureSystem not available
            treasureItem = {
                type: 'treasure',
                name: 'Gold Coins',
                value: 50,
                weight: 1,
                rarity: 'common'
            };
        }

        // Try to add to cargo
        const result = player.addToCargo(treasureItem);

        if (result.success) {
            // Remove treasure from map
            this.removeEntity(treasureEntity.x, treasureEntity.y);
            return {
                success: true,
                message: `Found ${treasureItem.name}! (${treasureItem.value}g) ${result.message}`
            };
        } else {
            // Cargo full, treasure stays on ground
            return {
                success: false,
                message: `Cannot pick up ${treasureItem.name} - ${result.message}`
            };
        }
    }

    // Phase 2: Shipwreck Salvage
    salvageShipwreck(shipwreck, player) {
        if (!shipwreck.cargo || shipwreck.cargo.length === 0) {
            // Empty shipwreck
            this.removeEntity(shipwreck.x, shipwreck.y);
            return {
                success: false,
                message: '⚓ The wreckage is empty - already looted'
            };
        }

        // Try to salvage items from wreck
        let itemsRecovered = 0;
        let itemsLeft = 0;
        const recoveredItems = [];

        for (let i = shipwreck.cargo.length - 1; i >= 0; i--) {
            const item = shipwreck.cargo[i];
            const result = player.addToCargo(item);

            if (result.success) {
                recoveredItems.push(item);
                shipwreck.cargo.splice(i, 1);
                itemsRecovered++;
            } else {
                itemsLeft++;
            }
        }

        // Calculate total value recovered
        const totalValue = recoveredItems.reduce((sum, item) => sum + (item.value || 0), 0);

        // Update or remove shipwreck
        if (shipwreck.cargo.length === 0) {
            // All items recovered, remove wreck
            this.removeEntity(shipwreck.x, shipwreck.y);
            return {
                success: true,
                message: `⚓ Salvaged all ${itemsRecovered} items from wreck! (~${totalValue}g) The wreck sinks into the depths.`
            };
        } else {
            // Some items remain
            shipwreck.description = `Wreckage of a ${shipwreck.shipType} (${shipwreck.cargo.length} items remain)`;
            return {
                success: true,
                message: `⚓ Salvaged ${itemsRecovered} items (~${totalValue}g). ${itemsLeft} items remain (cargo full)`
            };
        }
    }

    // Phase 3: Bottle Collection (while on ship)
    collectBottle(bottle, player) {
        // Remove bottle from map
        this.removeEntity(bottle.x, bottle.y);

        if (bottle.containsMap) {
            // Generate treasure map pointing to land
            const distance = 50 + Math.floor(this.seededRandom.random() * 200); // 50-250 tiles away
            const angle = this.seededRandom.random() * Math.PI * 2;
            const initialX = Math.round(player.x + Math.cos(angle) * distance);
            const initialY = Math.round(player.y + Math.sin(angle) * distance);

            // Find nearest land tile (search in expanding radius)
            let targetX = initialX;
            let targetY = initialY;
            let foundLand = false;

            for (let radius = 0; radius < 20 && !foundLand; radius++) {
                for (let dx = -radius; dx <= radius && !foundLand; dx++) {
                    for (let dy = -radius; dy <= radius && !foundLand; dy++) {
                        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                        const checkX = initialX + dx;
                        const checkY = initialY + dy;
                        const tile = this.mapGenerator.getTileAt(checkX, checkY);

                        if (tile && tile.biome !== 'ocean' && tile.biome !== 'deep_ocean' && tile.walkable) {
                            targetX = checkX;
                            targetY = checkY;
                            foundLand = true;
                        }
                    }
                }
            }

            // If no land found, default to original location (shouldn't happen often)
            if (!foundLand) {
                targetX = initialX;
                targetY = initialY;
            }

            // Determine treasure quality based on distance
            let treasureRarity;
            if (distance < 100) treasureRarity = 'uncommon';
            else if (distance < 150) treasureRarity = 'rare';
            else treasureRarity = 'legendary';

            const treasureMap = {
                type: 'treasure_map',
                name: 'Treasure Map',
                targetX: targetX,
                targetY: targetY,
                treasureRarity: treasureRarity,
                distance: distance,
                weight: 0, // Maps are weightless
                value: 0, // No sell value
                description: `A worn map showing treasure at (${targetX}, ${targetY}) - ${Math.floor(distance)} tiles away`
            };

            const result = player.addToCargo(treasureMap);

            if (result.success) {
                return {
                    success: true,
                    message: `🍾 Found a bottle! It contains a treasure map! Location: (${targetX}, ${targetY})`
                };
            } else {
                // Cargo full, map is lost
                return {
                    success: false,
                    message: `🍾 Found a bottle with a map, but cargo is full! Map lost...`
                };
            }
        } else {
            // Generate rare treasure
            let treasureItem;
            if (this.treasureSystem) {
                // Use treasure system with higher rarity
                treasureItem = this.treasureSystem.generateTreasure({
                    position: { x: bottle.x, y: bottle.y },
                    rarityBoost: 0.5 // Increase chance of rare items
                });
            } else {
                // Fallback rare treasure
                treasureItem = {
                    type: 'treasure',
                    name: 'Jeweled Goblet',
                    value: 150,
                    weight: 2,
                    rarity: 'rare'
                };
            }

            const result = player.addToCargo(treasureItem);

            if (result.success) {
                return {
                    success: true,
                    message: `🍾 Found a bottle! It contains ${treasureItem.name}! (${treasureItem.value}g)`
                };
            } else {
                // Cargo full, item is lost
                return {
                    success: false,
                    message: `🍾 Found a bottle with ${treasureItem.name}, but cargo is full! Lost at sea...`
                };
            }
        }
    }
    
    visitPort(port, player) {
        port.lastVisited = Date.now();

        // Phase 1: MVP Loop - Home port claiming
        let welcomeMessage = '';
        if (player.setHomePort) {
            const isFirstPort = player.setHomePort(port);
            if (isFirstPort) {
                port.isHomePort = true;
                welcomeMessage = `\n🏰 ${port.portName || 'This port'} is now your HOME PORT! You can always return here.`;
            }
        }

        // Check if this is home port
        const isHome = player.isAtHomePort && player.isAtHomePort();
        const portLabel = isHome ? `${port.portName || 'Port'} (HOME)` : (port.portName || 'Port');

        // Spawn ships in nearby ocean tiles if port has ships available
        let shipsMessage = '';
        if (port.hasShips && port.shipsAvailable > 0) {
            const spawned = this.spawnPortShips(port);
            if (spawned > 0) {
                port.shipsAvailable -= spawned;
                if (port.shipsAvailable <= 0) {
                    port.hasShips = false;
                    port.color = '#a93226'; // Darker red when no ships available
                }
                shipsMessage = `\n${spawned} ship(s) available nearby. Ships remaining: ${port.shipsAvailable}`;
            }
        }

        return {
            success: true,
            message: `Welcome to ${portLabel}!${welcomeMessage}${shipsMessage}\n\nPort services available - use 'P' to open port menu.`,
            portData: port, // Pass port data for menu
            isHomePort: isHome
        };
    }
    
    spawnPortShips(port) {
        // Use the enhanced coastal analysis to find optimal ship placement locations
        const shipSpots = this.findOptimalPortShipLocations(port.x, port.y, 4);
        const shipsToSpawn = Math.min(port.shipsAvailable, shipSpots.length, 2); // Max 2 ships per visit
        
        let spawned = 0;
        for (let i = 0; i < shipsToSpawn; i++) {
            const spot = shipSpots[i];
            if (!this.isPositionOccupied(spot.x, spot.y)) {
                const ship = {
                    type: 'ship',
                    x: spot.x,
                    y: spot.y,
                    char: 'S',
                    color: '#8b4513',
                    fromPort: true,
                    portX: port.x,
                    portY: port.y,
                    portAccessible: true, // Flag indicating this ship has good port access
                    durability: this.createShipDurability(100)
                };
                this.addEntity(ship);
                spawned++;
            }
        }
        
        return spawned;
    }
    
    findOptimalPortShipLocations(centerX, centerY, radius) {
        // Use the coastal analysis to find the best ship placement locations
        const coastalInfo = this.mapGenerator.analyzeCoastalArea(centerX, centerY, radius);
        
        // If we have embark points from the coastal analysis, use those
        if (coastalInfo.bestEmbarkPoints.length > 0) {
            // Filter out occupied positions
            return coastalInfo.bestEmbarkPoints.filter(pos => !this.isPositionOccupied(pos.x, pos.y));
        }
        
        // Fall back to finding navigable water tiles
        const navigableWater = coastalInfo.waterTiles.filter(tile => 
            tile.navigable && !this.isPositionOccupied(tile.x, tile.y)
        );
        
        if (navigableWater.length > 0) {
            // Sort by distance
            return navigableWater.sort((a, b) => a.distance - b.distance);
        }
        
        // If no suitable tiles found through coastal analysis, use the legacy method
        return this.findNearbyOceanTiles(centerX, centerY, radius);
    }
    
    findNearbyOceanTiles(centerX, centerY, radius) {
        const oceanTiles = [];
        
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (x === centerX && y === centerY) continue; // Skip center tile
                
                const tile = this.mapGenerator.getBiomeAt(x, y);
                if (tile && tile.biome === 'ocean') {
                    // Calculate distance from center
                    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                    
                    // Use the improved ship placement validation
                    const isNavigable = this.mapGenerator.isShipPlacementValid(x, y);
                    const waterBodySize = this.mapGenerator.getWaterBodySize(x, y);
                    
                    // Check if this water tile has direct access to the port
                    const hasPortAccess = this.hasDirectPortAccess(x, y, centerX, centerY);
                    
                    oceanTiles.push({ 
                        x, y, distance, 
                        navigable: isNavigable,
                        waterBodySize: waterBodySize,
                        portAccess: hasPortAccess
                    });
                }
            }
        }
        
        // Sort by port access first, then navigability, then distance, then water body size
        return oceanTiles.sort((a, b) => {
            if (a.portAccess !== b.portAccess) return b.portAccess - a.portAccess;
            if (a.navigable !== b.navigable) return b.navigable - a.navigable;
            if (a.distance !== b.distance) return a.distance - b.distance;
            return b.waterBodySize - a.waterBodySize;
        });
    }
    
    // Check if a water tile has direct access to a port (no land blocking the path)
    hasDirectPortAccess(waterX, waterY, portX, portY) {
        // Simple line-of-sight check between water tile and port
        const dx = portX - waterX;
        const dy = portY - waterY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // If too far, don't bother with detailed check
        if (distance > 5) return false;
        
        // For very close tiles, assume access is possible
        if (distance <= 1.5) return true;
        
        // Check if there's a direct path without land blocking
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        const xStep = dx / steps;
        const yStep = dy / steps;
        
        // Check points along the line
        for (let i = 1; i < steps; i++) {
            const checkX = Math.round(waterX + xStep * i);
            const checkY = Math.round(waterY + yStep * i);
            
            // Skip checking the endpoints
            if ((checkX === waterX && checkY === waterY) || (checkX === portX && checkY === portY)) {
                continue;
            }
            
            const tile = this.mapGenerator.getBiomeAt(checkX, checkY);
            
            // If we hit land that's not the port itself, path is blocked
            if (tile && tile.biome !== 'ocean' && !(checkX === portX && checkY === portY)) {
                return false;
            }
        }
        
        return true;
    }
    
    getEntityInfo(type) {
        return this.entityTypes[type];
    }
    
    getEntityCount(type) {
        return this.getEntitiesByType(type).length;
    }
    
    getRemainingTreasure() {
        return this.getEntityCount('treasure');
    }
    
    // Check if player is standing on an entity
    checkPlayerPosition(player) {
        const entity = this.getEntityAt(player.x, player.y);

        if (!entity) return null;

        // Phase 3: Bottles can be collected while on ship
        if (player.getMode() === 'ship' && entity.type === 'bottle') {
            return this.collectBottle(entity, player);
        }

        // Foot mode interactions (treasure, ports, shipwrecks)
        if (player.getMode() === 'foot') {
            return this.interactWithEntity(player.x, player.y, player);
        }

        return null;
    }

    // ===== PORT SERVICES (Phase 1: MVP Loop) =====

    /**
     * Sell treasure from player cargo
     * @param {Object} player - Player instance
     * @param {string} sellOption - 'all' or index number
     * @returns {Object} - Sale result
     */
    sellTreasure(player, sellOption = 'all') {
        if (!player.cargoHold || player.cargoHold.length === 0) {
            return {
                success: false,
                message: 'No cargo to sell!'
            };
        }

        let goldEarned = 0;
        let itemsSold = 0;

        if (sellOption === 'all') {
            // Sell all treasure items
            const treasures = player.cargoHold.filter(item => item.type === 'treasure');
            treasures.forEach(treasure => {
                goldEarned += treasure.value || 0;
                itemsSold++;
            });

            // Remove treasures from cargo
            player.cargoHold = player.cargoHold.filter(item => item.type !== 'treasure');
        } else {
            // Sell specific item by index
            const index = parseInt(sellOption);
            if (index >= 0 && index < player.cargoHold.length) {
                const item = player.cargoHold[index];
                if (item.type === 'treasure') {
                    goldEarned = item.value || 0;
                    itemsSold = 1;
                    player.removeFromCargo(index);
                } else {
                    return {
                        success: false,
                        message: 'That item is not treasure!'
                    };
                }
            } else {
                return {
                    success: false,
                    message: 'Invalid cargo index!'
                };
            }
        }

        if (itemsSold > 0) {
            player.addGold(goldEarned);
            return {
                success: true,
                message: `Sold ${itemsSold} treasure(s) for ${goldEarned}g! Total gold: ${player.gold}g`,
                goldEarned: goldEarned,
                itemsSold: itemsSold
            };
        }

        return {
            success: false,
            message: 'No treasure to sell!'
        };
    }

    /**
     * Buy a new ship at port
     * @param {Object} player - Player instance
     * @param {string} shipType - Ship type to buy
     * @returns {Object} - Purchase result
     */
    buyShip(player, shipType) {
        if (!this.shipSystem) {
            return {
                success: false,
                message: 'Ship system not available!'
            };
        }

        const shipStats = this.shipSystem.getShipStats(shipType);
        if (!shipStats) {
            return {
                success: false,
                message: 'Unknown ship type!'
            };
        }

        // Check if player can afford
        if (!player.canAfford(shipStats.cost)) {
            return {
                success: false,
                message: `Not enough gold! Need ${shipStats.cost}g, have ${player.gold}g`
            };
        }

        // Check if player already has this ship
        if (player.currentShip === shipType) {
            return {
                success: false,
                message: `You already have a ${shipStats.name}!`
            };
        }

        // Purchase ship
        player.spendGold(shipStats.cost);
        player.currentShip = shipType;
        player.maxCargoSpace = shipStats.maxCargo;
        player.maxShipHull = shipStats.maxHull;
        player.shipHull = shipStats.maxHull; // Full hull on new ship

        // Drop excess cargo if new ship has less space
        const cargoWeight = player.getCargoWeight();
        if (cargoWeight > player.maxCargoSpace) {
            const excess = cargoWeight - player.maxCargoSpace;
            return {
                success: true,
                message: `Purchased ${shipStats.name} for ${shipStats.cost}g! WARNING: ${excess} cargo units dropped (exceeded capacity)!`,
                shipType: shipType,
                dropped: excess
            };
        }

        return {
            success: true,
            message: `Purchased ${shipStats.name} for ${shipStats.cost}g! Gold remaining: ${player.gold}g`,
            shipType: shipType
        };
    }

    /**
     * Repair ship hull at port
     * @param {Object} player - Player instance
     * @param {number} costPerHP - Cost per hull point (from economy)
     * @returns {Object} - Repair result
     */
    repairShip(player, costPerHP = 2) {
        if (!this.shipSystem) {
            return {
                success: false,
                message: 'Ship system not available!'
            };
        }

        const damage = player.maxShipHull - player.shipHull;

        if (damage === 0) {
            return {
                success: false,
                message: 'Ship is already at full hull!'
            };
        }

        const totalCost = damage * costPerHP;

        if (!player.canAfford(totalCost)) {
            // Offer partial repair
            const affordableHP = Math.floor(player.gold / costPerHP);
            if (affordableHP > 0) {
                return {
                    success: false,
                    message: `Full repair costs ${totalCost}g (you have ${player.gold}g). Can repair ${affordableHP} HP for ${affordableHP * costPerHP}g?`,
                    partialRepair: {
                        hp: affordableHP,
                        cost: affordableHP * costPerHP
                    }
                };
            }

            return {
                success: false,
                message: `Not enough gold to repair! Need ${totalCost}g, have ${player.gold}g`
            };
        }

        // Repair ship
        player.spendGold(totalCost);
        player.shipHull = player.maxShipHull;

        return {
            success: true,
            message: `Ship repaired! Restored ${damage} HP for ${totalCost}g. Gold remaining: ${player.gold}g`,
            hpRestored: damage,
            costPaid: totalCost
        };
    }

    /**
     * Get available services at current port
     * @param {Object} port - Port entity
     * @param {Object} player - Player instance
     * @returns {Object} - Service information
     */
    getPortServices(port, player) {
        const services = {
            portName: port.portName || 'Port',
            isHomePort: player.isAtHomePort && player.isAtHomePort(),
            services: []
        };

        // Merchant (sell treasure)
        const cargoSummary = player.getCargoSummary();
        const treasureCount = player.cargoHold.filter(item => item.type === 'treasure').length;
        const treasureValue = player.cargoHold
            .filter(item => item.type === 'treasure')
            .reduce((sum, item) => sum + item.value, 0);

        services.services.push({
            name: 'Merchant',
            key: 'merchant',
            description: `Sell treasure (${treasureCount} items worth ${treasureValue}g)`,
            available: treasureCount > 0
        });

        // Shipyard (buy ships, repair)
        if (this.shipSystem) {
            const availableShips = this.shipSystem.getAvailableShips(player.gold);
            const damage = player.maxShipHull - player.shipHull;
            const repairCost = damage * 2;

            services.services.push({
                name: 'Shipyard',
                key: 'shipyard',
                description: `Buy ships (${availableShips.filter(s => s.canAfford).length} affordable) | Repair (${repairCost}g)`,
                available: true,
                shipsAvailable: availableShips.length,
                needsRepair: damage > 0
            });
        }

        return services;
    }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityManager;
}