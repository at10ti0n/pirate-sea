// Map generation and biome system
class MapGenerator {
    constructor(width = 48, height = 28) {
        this.displayWidth = width;
        this.displayHeight = height;
        this.worldSize = 200; // Much larger world
        this.map = new Map(); // Use Map for sparse storage
        this.biomes = {};
        this.cameraX = 0;
        this.cameraY = 0;
        this.initializeBiomes();
    }
    
    initializeBiomes() {
        this.biomes = {
            ocean: { char: '~', color: '#2980b9', walkable: false, shipWalkable: true },
            beach: { char: '.', color: '#f39c12', walkable: true, shipWalkable: false },
            mountain: { char: '^', color: '#7f8c8d', walkable: false, shipWalkable: false },
            snow: { char: '*', color: '#ecf0f1', walkable: false, shipWalkable: false },
            desert: { char: ':', color: '#e67e22', walkable: true, shipWalkable: false },
            savanna: { char: '"', color: '#d35400', walkable: true, shipWalkable: false },
            jungle: { char: '#', color: '#27ae60', walkable: true, shipWalkable: false },
            swamp: { char: '%', color: '#16a085', walkable: false, shipWalkable: false },
            taiga: { char: 'T', color: '#2c3e50', walkable: true, shipWalkable: false },
            tropical: { char: 't', color: '#e74c3c', walkable: true, shipWalkable: false },
            forest: { char: '♠', color: '#229954', walkable: true, shipWalkable: false }
        };
    }
    
    generateMap() {
        console.log('Generating infinite map system...');
        
        // Initialize noise generators
        this.elevationNoise = new ROT.Noise.Simplex();
        this.moistureNoise = new ROT.Noise.Simplex();
        this.temperatureNoise = new ROT.Noise.Simplex();
        
        console.log('Infinite map system ready');
        return this.map;
    }
    
    generateChunkAt(x, y) {
        const key = `${x},${y}`;
        if (this.map.has(key)) {
            return this.map.get(key);
        }
        
        // 80% water world - ocean with more frequent islands
        const baseScale = 0.025; // Large scale for landmasses
        const islandScale = 0.12; // Medium island details
        const atollScale = 0.2; // Small atolls and rocks
        
        // Base ocean level - majority is ocean
        let elevation = 0.2; // Start low (ocean default)
        
        // Large landmasses - less rare than 90% world
        const continentNoise = (this.elevationNoise.get(x * baseScale, y * baseScale) + 1) / 2;
        if (continentNoise > 0.75) { // 25% chance of large land influence
            elevation += (continentNoise - 0.75) * 1.8;
        }
        
        // Medium islands - more frequent
        const islandNoise = (this.elevationNoise.get(x * islandScale + 500, y * islandScale + 500) + 1) / 2;
        if (islandNoise > 0.7) { // 30% chance of island influence
            elevation += (islandNoise - 0.7) * 1.3;
        }
        
        // Small atolls and rocks - more common
        const atollNoise = (this.elevationNoise.get(x * atollScale + 1000, y * atollScale + 1000) + 1) / 2;
        if (atollNoise > 0.75) { // 25% chance of small land
            elevation += (atollNoise - 0.75) * 1.0;
        }
        
        // Island chains - more frequent
        const chainScale = 0.06;
        const chain1 = (this.elevationNoise.get(x * chainScale + 1500, y * chainScale + 1500) + 1) / 2;
        const chain2 = (this.elevationNoise.get(x * chainScale + 2500, y * chainScale + 2500) + 1) / 2;
        const chain3 = (this.elevationNoise.get(x * chainScale + 3500, y * chainScale + 3500) + 1) / 2;
        
        if (chain1 > 0.8) { // More frequent island chains
            elevation += (chain1 - 0.8) * 1.5;
        }
        if (chain2 > 0.85) { // Additional chains
            elevation += (chain2 - 0.85) * 1.2;
        }
        if (chain3 > 0.82) { // Third chain pattern
            elevation += (chain3 - 0.82) * 1.0;
        }
        
        // Generate moisture and temperature
        const moisture = (this.moistureNoise.get(x * 0.09 + 100, y * 0.09 + 100) + 1) / 2;
        const temperature = (this.temperatureNoise.get(x * 0.07 + 200, y * 0.07 + 200) + 1) / 2;
        
        // Clamp elevation
        elevation = Math.max(0, Math.min(1, elevation));
        
        // Determine initial biome
        let biome = this.determineBiome(elevation, moisture, temperature);
        
        // Check if this would create a small landmass (less than 9 tiles)
        if (biome !== 'ocean') {
            const landmassSize = this.getLandmassSize(x, y, biome);
            if (landmassSize < 9) {
                biome = 'ocean'; // Convert small landmasses to ocean
            }
        }
        
        const tile = {
            x: x,
            y: y,
            biome: biome,
            elevation: elevation,
            moisture: moisture,
            temperature: temperature,
            visible: false,
            explored: false
        };
        
        this.map.set(key, tile);
        return tile;
    }
    
    updateCamera(playerX, playerY) {
        // Center camera on player
        this.cameraX = playerX - Math.floor(this.displayWidth / 2);
        this.cameraY = playerY - Math.floor(this.displayHeight / 2);
    }
    
    getVisibleTiles() {
        const tiles = [];
        for (let y = 0; y < this.displayHeight; y++) {
            for (let x = 0; x < this.displayWidth; x++) {
                const worldX = this.cameraX + x;
                const worldY = this.cameraY + y;
                const tile = this.generateChunkAt(worldX, worldY);
                tiles.push({
                    tile: tile,
                    screenX: x,
                    screenY: y,
                    worldX: worldX,
                    worldY: worldY
                });
            }
        }
        return tiles;
    }
    
    determineBiome(elevation, moisture, temperature) {
        // 80% water world - ocean with balanced land distribution
        if (elevation < 0.3) { // Deep ocean - majority of world
            return 'ocean';
        } else if (elevation < 0.4) { // Shallow seas around islands
            return 'ocean';
        } else if (elevation < 0.45) { // Beaches - coastal areas
            return 'beach';
        } else if (elevation > 0.9) { // Only highest peaks become mountains
            if (temperature < 0.4) {
                return 'snow';
            } else {
                return 'mountain';
            }
        } else if (moisture < 0.15) { // Very dry conditions for deserts
            if (temperature > 0.75) {
                return 'desert';
            } else {
                return 'savanna';
            }
        } else if (moisture > 0.85) { // Very wet conditions
            if (temperature > 0.75) {
                return 'jungle';
            } else {
                return 'swamp';
            }
        } else if (temperature < 0.2) { // Very cold
            return 'taiga';
        } else if (temperature > 0.8) { // Very hot
            return 'tropical';
        } else {
            return 'forest'; // Default for small islands
        }
    }
    
    getBiomeAt(x, y) {
        return this.generateChunkAt(x, y);
    }
    
    // Check if a position is part of a navigable sea/ocean
    isNavigableWater(x, y) {
        const tile = this.getBiomeAt(x, y);
        if (!tile || tile.biome !== 'ocean') return false;
        
        // Check if surrounded by enough water to be navigable
        let waterNeighbors = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const neighbor = this.getBiomeAt(x + dx, y + dy);
                if (neighbor && neighbor.biome === 'ocean') {
                    waterNeighbors++;
                }
            }
        }
        
        return waterNeighbors >= 3; // At least 3 water neighbors makes it navigable
    }
    
    // Get the size of the water body at a given position
    getWaterBodySize(x, y, visited = new Set(), maxSize = 100) {
        const tile = this.getBiomeAt(x, y);
        if (!tile || tile.biome !== 'ocean') return 0;
        
        const key = `${x},${y}`;
        if (visited.has(key) || visited.size >= maxSize) return 0;
        
        visited.add(key);
        let size = 1;
        
        // Check adjacent tiles
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of directions) {
            if (visited.size < maxSize) {
                size += this.getWaterBodySize(x + dx, y + dy, visited, maxSize);
            }
        }
        
        return size;
    }
    
    // Get the size of a landmass at a given position
    getLandmassSize(x, y, targetBiome, visited = new Set(), maxSize = 20) {
        // Check if already processed
        const key = `${x},${y}`;
        if (visited.has(key) || visited.size >= maxSize) return visited.size >= maxSize ? maxSize : 0;
        
        // Generate elevation, moisture, temperature for this position
        const baseScale = 0.025;
        const islandScale = 0.12;
        const atollScale = 0.2;
        
        let elevation = 0.2;
        
        // Same noise generation logic as generateChunkAt
        const continentNoise = (this.elevationNoise.get(x * baseScale, y * baseScale) + 1) / 2;
        if (continentNoise > 0.75) {
            elevation += (continentNoise - 0.75) * 1.8;
        }
        
        const islandNoise = (this.elevationNoise.get(x * islandScale + 500, y * islandScale + 500) + 1) / 2;
        if (islandNoise > 0.7) {
            elevation += (islandNoise - 0.7) * 1.3;
        }
        
        const atollNoise = (this.elevationNoise.get(x * atollScale + 1000, y * atollScale + 1000) + 1) / 2;
        if (atollNoise > 0.75) {
            elevation += (atollNoise - 0.75) * 1.0;
        }
        
        // Island chains
        const chainScale = 0.06;
        const chain1 = (this.elevationNoise.get(x * chainScale + 1500, y * chainScale + 1500) + 1) / 2;
        const chain2 = (this.elevationNoise.get(x * chainScale + 2500, y * chainScale + 2500) + 1) / 2;
        const chain3 = (this.elevationNoise.get(x * chainScale + 3500, y * chainScale + 3500) + 1) / 2;
        
        if (chain1 > 0.8) elevation += (chain1 - 0.8) * 1.5;
        if (chain2 > 0.85) elevation += (chain2 - 0.85) * 1.2;
        if (chain3 > 0.82) elevation += (chain3 - 0.82) * 1.0;
        
        const moisture = (this.moistureNoise.get(x * 0.09 + 100, y * 0.09 + 100) + 1) / 2;
        const temperature = (this.temperatureNoise.get(x * 0.07 + 200, y * 0.07 + 200) + 1) / 2;
        
        elevation = Math.max(0, Math.min(1, elevation));
        
        // Check if this would be land
        const tempBiome = this.determineBiome(elevation, moisture, temperature);
        if (tempBiome === 'ocean') return 0;
        
        visited.add(key);
        let size = 1;
        
        // Check adjacent tiles
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of directions) {
            if (visited.size < maxSize) {
                size += this.getLandmassSize(x + dx, y + dy, targetBiome, visited, maxSize);
            }
        }
        
        return size;
    }
    
    getBiomeInfo(biomeName) {
        return this.biomes[biomeName];
    }
    
    isWalkable(x, y, onShip = false) {
        const tile = this.getBiomeAt(x, y);
        if (!tile) return false;
        
        const biomeInfo = this.getBiomeInfo(tile.biome);
        if (onShip) {
            return biomeInfo.shipWalkable;
        } else {
            return biomeInfo.walkable;
        }
    }
    
    getWalkableTiles(onShip = false, centerX = 0, centerY = 0, radius = 50) {
        const walkableTiles = [];
        for (let y = centerY - radius; y < centerY + radius; y++) {
            for (let x = centerX - radius; x < centerX + radius; x++) {
                if (this.isWalkable(x, y, onShip)) {
                    walkableTiles.push({ x, y });
                }
            }
        }
        return walkableTiles;
    }
    
    setVisibility(x, y, visible) {
        const tile = this.getBiomeAt(x, y);
        if (tile) {
            tile.visible = visible;
            if (visible) {
                tile.explored = true;
            }
        }
    }
    
    clearVisibility() {
        // Clear visibility for all loaded tiles
        for (const [key, tile] of this.map) {
            tile.visible = false;
        }
    }
}