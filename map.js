// Map generation and biome system

// Load dependencies for Node.js environment
if (typeof require !== 'undefined') {
    if (typeof SeededRandom === 'undefined') {
        var SeededRandom = require('./seeded-random');
    }
    if (typeof ROT === 'undefined') {
        var ROT = require('rot-js');
    }
}

class MapGenerator {
    constructor(width = 48, height = 28, seed = null) {
        this.displayWidth = width;
        this.displayHeight = height;
        this.worldSize = 200; // Much larger world
        this.map = new Map(); // Use Map for sparse storage
        this.biomes = {};
        this.cameraX = 0;
        this.cameraY = 0;
        
        // Initialize seeded random system
        this.seed = seed || Date.now();
        this.seededRandom = new SeededRandom(this.seed);
        
        this.initializeBiomes();
        
        console.log(`MapGenerator initialized with seed: ${this.seed}`);
    }
    
    initializeBiomes() {
        this.biomes = {
            ocean: { char: '~', color: '#3498db', walkable: false, shipWalkable: true },
            beach: { char: '.', color: '#f39c12', walkable: true, shipWalkable: false },
            mountain: { char: '^', color: '#7f8c8d', walkable: true, shipWalkable: false },
            snow: { char: '*', color: '#ecf0f1', walkable: true, shipWalkable: false },
            desert: { char: ':', color: '#e67e22', walkable: true, shipWalkable: false },
            savanna: { char: '"', color: '#d35400', walkable: true, shipWalkable: false },
            jungle: { char: '#', color: '#27ae60', walkable: true, shipWalkable: false },
            swamp: { char: '%', color: '#16a085', walkable: true, shipWalkable: false },
            taiga: { char: 'T', color: '#2c3e50', walkable: true, shipWalkable: false },
            tropical: { char: 't', color: '#e74c3c', walkable: true, shipWalkable: false },
            forest: { char: '♠', color: '#229954', walkable: true, shipWalkable: false }
        };
    }
    
    generateMap() {
        console.log(`Generating infinite map system with seed: ${this.seed}...`);
        
        // Initialize seeded noise generators
        this.elevationNoise = new ROT.Noise.Simplex();
        this.moistureNoise = new ROT.Noise.Simplex();
        this.temperatureNoise = new ROT.Noise.Simplex();
        
        // Seed the ROT.js noise generators if possible
        if (this.elevationNoise.setSeed) {
            this.elevationNoise.setSeed(this.seed);
            this.moistureNoise.setSeed(this.seed + 1000);
            this.temperatureNoise.setSeed(this.seed + 2000);
        }
        
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
        
        // Generate moisture (keep original)
        let moisture = (this.moistureNoise.get(x * 0.09 + 100, y * 0.09 + 100) + 1) / 2;

        // Generate latitude-based temperature (asymptotic approach for infinite world)
        // World center (y=0) = equator (hottest)
        // Temperature decreases away from equator but never reaches absolute zero
        // Uses atan for asymptotic curve - temperature approaches minimum but infinite exploration possible
        const latitudeEffect = Math.atan(Math.abs(y) / 300) / (Math.PI / 2); // 0-1 range, slower falloff
        const latitudeTemp = Math.max(0.3, 1.0 - (latitudeEffect * 0.7)); // Approaches 30% warmth minimum

        // Combine latitude with noise for variation
        const temperatureNoise = (this.temperatureNoise.get(x * 0.07 + 200, y * 0.07 + 200) + 1) / 2;
        let temperature = (latitudeTemp * 0.7) + (temperatureNoise * 0.3); // 70% latitude, 30% noise

        // Clamp elevation first (needed for climate calculations)
        elevation = Math.max(0, Math.min(1, elevation));

        // Phase 3: Elevation temperature lapse
        // Temperature drops with elevation (cooler at high altitudes)
        if (elevation > 0.45) { // Only affects land above sea level
            const elevationEffect = (elevation - 0.45) * 0.6; // Up to -33% at peaks
            temperature = temperature * (1.0 - elevationEffect);
        }

        // Phase 3: Rain shadow effect
        // Check for mountains to the west (prevailing wind direction)
        const checkDistance = 5; // Check 5 tiles upwind
        let hasUpwindMountain = false;
        for (let i = 1; i <= checkDistance; i++) {
            const upwindX = x - i; // West is negative x
            const upwindTile = this.map.get(`${upwindX},${y}`);
            if (upwindTile && upwindTile.elevation > 0.75) { // Mountain height
                hasUpwindMountain = true;
                break;
            }
        }
        if (hasUpwindMountain && elevation < 0.75) { // Rain shadow on leeward side
            moisture = moisture * 0.4; // Significantly drier (60% reduction)
        }

        // Clamp climate values to 0-1 range after all modifications
        temperature = Math.max(0, Math.min(1, temperature));
        moisture = Math.max(0, Math.min(1, moisture));

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
            // Adjusted for asymptotic temperature system (min ~0.3)
            if (temperature < 0.5) {
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
        } else if (temperature < 0.35) { // Very cold (adjusted for asymptotic system)
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
        let landNeighbors = 0;
        let beachNeighbors = 0;
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const neighbor = this.getBiomeAt(x + dx, y + dy);
                if (neighbor) {
                    if (neighbor.biome === 'ocean') {
                        waterNeighbors++;
                    } else if (neighbor.biome === 'beach') {
                        beachNeighbors++;
                        landNeighbors++;
                    } else if (neighbor.biome !== 'ocean' && !this.biomes[neighbor.biome].shipWalkable) {
                        landNeighbors++;
                    }
                }
            }
        }
        
        // For ship placement near ports, we want water that's close to land but not too enclosed
        // At least 4 water neighbors ensures enough space for ship navigation
        // Having 1-3 land neighbors ensures it's near coast but not in a tight cove
        return waterNeighbors >= 4 && landNeighbors >= 1 && landNeighbors <= 3;
    }
    
    // Check if a position is suitable for ship placement (more permissive than isNavigableWater)
    isShipPlacementValid(x, y) {
        const tile = this.getBiomeAt(x, y);
        if (!tile || tile.biome !== 'ocean') return false;
        
        // For general ship placement, we just need enough water to navigate
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
    
    // Analyze landmass for port tier determination
    analyzeLandmass(startX, startY, maxSize = 150) {
        const tile = this.getBiomeAt(startX, startY);
        if (!tile || tile.biome === 'ocean') {
            return { size: 0, biomes: {}, diversity: 0, richness: 0 };
        }

        const visited = new Set();
        const biomeCount = {};
        const queue = [[startX, startY]];

        // Biome richness scores (more valuable biomes = higher scores)
        const biomeValue = {
            forest: 3,
            jungle: 3,
            tropical: 3,
            beach: 2,
            savanna: 2,
            taiga: 2,
            desert: 1,
            swamp: 1,
            mountain: 1,
            snow: 1
        };

        while (queue.length > 0 && visited.size < maxSize) {
            const [x, y] = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;

            const currentTile = this.getBiomeAt(x, y);
            if (!currentTile || currentTile.biome === 'ocean') continue;

            visited.add(key);

            // Count biome types
            const biome = currentTile.biome;
            biomeCount[biome] = (biomeCount[biome] || 0) + 1;

            // Add adjacent tiles to queue
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of directions) {
                const newKey = `${x + dx},${y + dy}`;
                if (!visited.has(newKey)) {
                    queue.push([x + dx, y + dy]);
                }
            }
        }

        // Calculate diversity (number of unique biomes)
        const diversity = Object.keys(biomeCount).length;

        // Calculate richness (weighted by biome value)
        let richness = 0;
        for (const [biome, count] of Object.entries(biomeCount)) {
            richness += (biomeValue[biome] || 1) * count;
        }
        richness = richness / visited.size; // Average richness per tile

        return {
            size: visited.size,
            biomes: biomeCount,
            diversity: diversity,
            richness: richness
        };
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

    // Get height tier name from elevation value
    getHeightTier(elevation) {
        if (elevation < 0.30) return 'deep_ocean';
        if (elevation < 0.40) return 'shallow_ocean';
        if (elevation < 0.45) return 'beach';
        if (elevation < 0.60) return 'lowlands';
        if (elevation < 0.75) return 'hills';
        if (elevation < 0.90) return 'mountains';
        return 'peaks';
    }

    // Convert elevation to approximate meters
    elevationToMeters(elevation) {
        // Map 0.0-1.0 elevation to -500m to 2000m
        return Math.round((elevation * 2500) - 500);
    }

    // Get elevation shading factor (0.0 = darkest, 1.0 = lightest)
    getElevationShade(elevation) {
        // Ocean depths get darker
        if (elevation < 0.40) {
            // Deep ocean: 0.5x brightness, shallow: 0.7x brightness
            return 0.5 + (elevation / 0.40) * 0.2;
        }
        // Land gets lighter with elevation (subtle effect)
        if (elevation > 0.45) {
            // Land: 1.0x to 1.15x brightness (slight lightening at peaks)
            return 1.0 + ((elevation - 0.45) / 0.55) * 0.15;
        }
        // Beach is neutral
        return 1.0;
    }

    // Adjust hex color brightness by factor
    adjustColorBrightness(hexColor, factor) {
        // If it's an ANSI color code (for terminal mode), return as-is
        // Terminal colors can't be brightness-adjusted with limited palette
        if (hexColor && hexColor.startsWith('\x1b[')) {
            return hexColor;
        }

        // Remove # if present
        const hex = hexColor.replace('#', '');

        // Parse RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Apply brightness factor
        const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
        const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
        const newB = Math.min(255, Math.max(0, Math.round(b * factor)));

        // Convert back to hex
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }

    // Generate resource glyph for a specific position
    generateResourceGlyph(x, y, biomeType, resourceManager, platform = 'web') {
        // Get tile elevation for shading
        const tile = this.getBiomeAt(x, y);
        const elevation = tile ? tile.elevation : 0.5;
        const shadeFactor = this.getElevationShade(elevation);

        if (!resourceManager) {
            const biome = this.biomes[biomeType];
            return {
                char: biome.char,
                color: this.adjustColorBrightness(biome.color, shadeFactor),
                walkable: biome.walkable,
                shipWalkable: biome.shipWalkable
            };
        }

        const biomeConfig = resourceManager.getBiomeResources(biomeType);
        if (!biomeConfig || !biomeConfig.glyphDistribution) {
            const biome = this.biomes[biomeType];
            return {
                char: biome.char,
                color: this.adjustColorBrightness(biome.color, shadeFactor),
                walkable: biome.walkable,
                shipWalkable: biome.shipWalkable
            };
        }

        // Use position-based seeded random for deterministic glyph generation
        const positionSeed = this.seed + (x * 1000) + (y * 1000000);
        const positionRandom = new SeededRandom(positionSeed);

        // Calculate total weight
        let totalWeight = 0;
        for (const glyph of biomeConfig.glyphDistribution) {
            totalWeight += glyph.weight;
        }

        // Select glyph based on weight
        const randomValue = positionRandom.random() * totalWeight;
        let currentWeight = 0;

        for (const glyphConfig of biomeConfig.glyphDistribution) {
            currentWeight += glyphConfig.weight;
            if (randomValue <= currentWeight) {
                if (glyphConfig.glyph === 'biome_fallback') {
                    // Return original biome glyph with elevation shading
                    const biome = this.biomes[biomeType];
                    return {
                        char: biome.char,
                        color: this.adjustColorBrightness(biome.color, shadeFactor),
                        walkable: biome.walkable,
                        shipWalkable: biome.shipWalkable
                    };
                } else {
                    // Check if location is depleted for visual representation
                    const isDepleted = resourceManager.isLocationVisuallyDepleted(x, y);

                    // Return resource glyph (normal or depleted variant)
                    const resourceGlyph = resourceManager.getResourceGlyph(glyphConfig.glyph, platform, isDepleted);
                    const resourceColor = resourceManager.getResourceColor(glyphConfig.glyph, isDepleted) || this.biomes[biomeType].color;

                    if (resourceGlyph) {
                        return {
                            char: resourceGlyph,
                            color: this.adjustColorBrightness(resourceColor, shadeFactor),
                            walkable: this.biomes[biomeType].walkable,
                            shipWalkable: this.biomes[biomeType].shipWalkable,
                            resourceType: glyphConfig.glyph,
                            depleted: isDepleted
                        };
                    }
                }
            }
        }
        
        // Fallback to original biome
        return this.biomes[biomeType];
    }
    
    // Analyze coastal areas for ship boarding/unboarding
    analyzeCoastalArea(x, y, radius = 3) {
        const coastalInfo = {
            isCoastal: false,
            waterTiles: [],
            landTiles: [],
            beachTiles: [],
            bestEmbarkPoints: [],
            bestDisembarkPoints: []
        };
        
        // Check if the center tile is land or water
        const centerTile = this.getBiomeAt(x, y);
        if (!centerTile) return coastalInfo;
        
        const isLandCenter = centerTile.biome !== 'ocean';
        
        // Scan the area around the position
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue; // Skip center
                
                const nx = x + dx;
                const ny = y + dy;
                const tile = this.getBiomeAt(nx, ny);
                
                if (!tile) continue;
                
                // Calculate distance from center (for sorting later)
                const distance = Math.sqrt(dx*dx + dy*dy);
                const tileInfo = { 
                    x: nx, 
                    y: ny, 
                    biome: tile.biome,
                    distance: distance
                };
                
                if (tile.biome === 'ocean') {
                    // For water tiles, check if they're suitable for ship placement
                    const isNavigable = this.isShipPlacementValid(nx, ny);
                    tileInfo.navigable = isNavigable;
                    coastalInfo.waterTiles.push(tileInfo);
                    
                    // If center is land and this water tile is navigable, it's a potential embark point
                    if (isLandCenter && isNavigable) {
                        coastalInfo.bestEmbarkPoints.push(tileInfo);
                    }
                } else {
                    // For land tiles
                    const isWalkable = this.isWalkable(nx, ny, false);
                    tileInfo.walkable = isWalkable;
                    coastalInfo.landTiles.push(tileInfo);
                    
                    // Track beach tiles separately (preferred for disembarking)
                    if (tile.biome === 'beach') {
                        coastalInfo.beachTiles.push(tileInfo);
                        
                        // If center is water and this is a walkable beach, it's a good disembark point
                        if (!isLandCenter && isWalkable) {
                            coastalInfo.bestDisembarkPoints.push(tileInfo);
                        }
                    } else if (!isLandCenter && isWalkable) {
                        // Non-beach walkable land is still a valid disembark point, but less preferred
                        coastalInfo.bestDisembarkPoints.push(tileInfo);
                    }
                }
            }
        }
        
        // Sort embark points by navigability and distance
        coastalInfo.bestEmbarkPoints.sort((a, b) => {
            if (a.navigable !== b.navigable) return b.navigable - a.navigable;
            return a.distance - b.distance;
        });
        
        // Sort disembark points - beaches first, then by distance
        coastalInfo.bestDisembarkPoints.sort((a, b) => {
            if ((a.biome === 'beach') !== (b.biome === 'beach')) {
                return (a.biome === 'beach') ? -1 : 1;
            }
            return a.distance - b.distance;
        });
        
        // Determine if this is a coastal area (has both land and water)
        coastalInfo.isCoastal = coastalInfo.waterTiles.length > 0 && coastalInfo.landTiles.length > 0;
        
        return coastalInfo;
    }
    
    // Find the best location to place a ship near a coastal point
    findBestShipPlacement(x, y, radius = 3) {
        const coastalInfo = this.analyzeCoastalArea(x, y, radius);
        
        // If there are suitable embark points, return the best one
        if (coastalInfo.bestEmbarkPoints.length > 0) {
            return coastalInfo.bestEmbarkPoints[0];
        }
        
        // If no ideal points found, look for any navigable water
        const navigableWater = coastalInfo.waterTiles.filter(tile => tile.navigable);
        if (navigableWater.length > 0) {
            // Sort by distance and return closest
            navigableWater.sort((a, b) => a.distance - b.distance);
            return navigableWater[0];
        }
        
        // No suitable water found
        return null;
    }
    
    // Find the best location to disembark from a ship onto land
    findBestDisembarkLocation(x, y, radius = 3) {
        const coastalInfo = this.analyzeCoastalArea(x, y, radius);
        
        // If there are suitable disembark points, return the best one (beaches preferred)
        if (coastalInfo.bestDisembarkPoints.length > 0) {
            return coastalInfo.bestDisembarkPoints[0];
        }
        
        // If no ideal points found, look for any walkable land
        const walkableLand = coastalInfo.landTiles.filter(tile => tile.walkable);
        if (walkableLand.length > 0) {
            // Sort by distance and return closest
            walkableLand.sort((a, b) => a.distance - b.distance);
            return walkableLand[0];
        }
        
        // No suitable land found
        return null;
    }

    findNearestWalkableLand(startX, startY, maxRadius = 20) {
        // Search in expanding radius for walkable land (not ocean)
        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let angle = 0; angle < 360; angle += 30) {
                const testX = Math.round(startX + radius * Math.cos(angle * Math.PI / 180));
                const testY = Math.round(startY + radius * Math.sin(angle * Math.PI / 180));

                const tile = this.getBiomeAt(testX, testY);
                if (tile && this.isWalkable(testX, testY, false) && tile.biome !== 'ocean') {
                    return { x: testX, y: testY, distance: radius };
                }
            }
        }
        return null;
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
    
    // Seed management methods
    getSeed() {
        return this.seed;
    }
    
    setSeed(newSeed) {
        this.seed = newSeed;
        this.seededRandom.setSeed(newSeed);
        
        // Clear existing map to regenerate with new seed
        this.map.clear();
        
        // Reinitialize noise generators with new seed
        this.generateMap();
        
        console.log(`Map seed changed to: ${this.seed}`);
    }
    
    // Generate deterministic random number for this position
    getSeededRandomAt(x, y, offset = 0) {
        // Create a deterministic seed based on position and global seed
        const positionSeed = this.seed + (x * 73856093) + (y * 19349663) + offset;
        const tempRandom = new SeededRandom(positionSeed);
        return tempRandom.random();
    }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}