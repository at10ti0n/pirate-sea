// Entity management system for ships, ports, and treasure
class EntityManager {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.entities = new Map(); // Key: 'x,y', Value: entity object
        this.entityTypes = {
            ship: { char: 'S', color: '#8b4513' },
            port: { char: 'P', color: '#e74c3c' },
            treasure: { char: '$', color: '#f1c40f' }
        };
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
    
    spawnEntities(playerX = 0, playerY = 0) {
        console.log('Spawning entities around player...');
        
        // Clear existing entities
        this.entities.clear();
        
        // Spawn more entities for the ocean-dominated world
        this.spawnPorts(playerX, playerY);
        this.spawnTreasure(playerX, playerY);
        this.spawnShips(playerX, playerY);
        
        console.log(`Spawned ${this.entities.size} entities total`);
    }
    
    spawnPorts(centerX, centerY) {
        const portCount = 15; // More ports for increased land in 80% water world
        const walkableTiles = this.getAvailableWalkableTiles(centerX, centerY);
        
        for (let i = 0; i < portCount && walkableTiles.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * walkableTiles.length);
            const tile = walkableTiles[randomIndex];
            
            const port = {
                type: 'port',
                x: tile.x,
                y: tile.y,
                char: 'P',
                color: '#e74c3c',
                hasShips: true,
                shipsAvailable: Math.floor(Math.random() * 3) + 1, // 1-3 ships per port
                lastVisited: null
            };
            
            this.addEntity(port);
            walkableTiles.splice(randomIndex, 1); // Remove used tile
        }
        
        console.log(`Spawned ${Math.min(portCount, walkableTiles.length)} ports`);
    }
    
    spawnTreasure(centerX, centerY) {
        const treasureCount = 30; // More treasure for increased land availability
        const walkableTiles = this.getAvailableWalkableTiles(centerX, centerY);
        
        for (let i = 0; i < treasureCount && walkableTiles.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * walkableTiles.length);
            const tile = walkableTiles[randomIndex];
            
            const treasure = {
                type: 'treasure',
                x: tile.x,
                y: tile.y,
                char: '$',
                color: '#f1c40f'
            };
            
            this.addEntity(treasure);
            walkableTiles.splice(randomIndex, 1); // Remove used tile
        }
        
        console.log(`Spawned ${Math.min(treasureCount, walkableTiles.length)} treasures`);
    }
    
    spawnShips(centerX, centerY) {
        const shipCount = 20; // Ships for 80% water world
        const oceanTiles = this.getAvailableOceanTiles(centerX, centerY);
        
        for (let i = 0; i < shipCount && oceanTiles.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * oceanTiles.length);
            const tile = oceanTiles[randomIndex];
            
            const ship = {
                type: 'ship',
                x: tile.x,
                y: tile.y,
                char: 'S',
                color: '#8b4513'
            };
            
            this.addEntity(ship);
            oceanTiles.splice(randomIndex, 1); // Remove used tile
        }
        
        console.log(`Spawned ${Math.min(shipCount, oceanTiles.length)} ships`);
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
                        const isNavigable = this.mapGenerator.isNavigableWater(x, y);
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
                this.removeEntity(x, y);
                return { success: true, message: 'You found treasure!' };
                
            case 'port':
                return this.visitPort(entity);
                
            case 'ship':
                return { success: false, message: 'Use the board command to board the ship.' };
                
            default:
                return { success: false, message: 'Unknown entity type.' };
        }
    }
    
    visitPort(port) {
        port.lastVisited = Date.now();
        
        // Spawn ships in nearby ocean tiles if port has ships available
        if (port.hasShips && port.shipsAvailable > 0) {
            const spawned = this.spawnPortShips(port);
            if (spawned > 0) {
                port.shipsAvailable -= spawned;
                if (port.shipsAvailable <= 0) {
                    port.hasShips = false;
                    port.color = '#a93226'; // Darker red when no ships available
                }
                return { 
                    success: true, 
                    message: `Welcome to the port! ${spawned} ship(s) are now available nearby. Ships remaining: ${port.shipsAvailable}` 
                };
            }
        }
        
        return { 
            success: true, 
            message: port.hasShips ? 'Welcome to the port! No suitable docking spots for ships nearby.' : 'Welcome to the port! No ships available.' 
        };
    }
    
    spawnPortShips(port) {
        const shipSpots = this.findNearbyOceanTiles(port.x, port.y, 3);
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
                    portY: port.y
                };
                this.addEntity(ship);
                spawned++;
            }
        }
        
        return spawned;
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
                    const isNavigable = this.mapGenerator.isNavigableWater(x, y);
                    const waterBodySize = this.mapGenerator.getWaterBodySize(x, y);
                    
                    oceanTiles.push({ 
                        x, y, distance, 
                        navigable: isNavigable,
                        waterBodySize: waterBodySize 
                    });
                }
            }
        }
        
        // Sort by navigability first, then distance, then water body size
        return oceanTiles.sort((a, b) => {
            if (a.navigable !== b.navigable) return b.navigable - a.navigable;
            if (a.distance !== b.distance) return a.distance - b.distance;
            return b.waterBodySize - a.waterBodySize;
        });
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
        if (entity && player.getMode() === 'foot') {
            return this.interactWithEntity(player.x, player.y, player);
        }
        return null;
    }
}