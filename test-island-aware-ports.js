// Test island-aware port spawning system
const ROT = require('rot-js');

// Seeded random class
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    setSeed(seed) {
        this.seed = seed;
    }

    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    nextInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
}

// Import modules
const NameGenerator = require('./nameGenerator.js');

// Simplified MapGenerator for testing
class TestMapGenerator {
    constructor(seed = 12345) {
        this.map = new Map();
        this.seed = seed;
        this.seededRandom = new SeededRandom(this.seed);

        // Initialize noise generators
        this.elevationNoise = new ROT.Noise.Simplex();
        this.moistureNoise = new ROT.Noise.Simplex();
        this.temperatureNoise = new ROT.Noise.Simplex();
    }

    getSeed() {
        return this.seed;
    }

    generateChunkAt(x, y) {
        const key = `${x},${y}`;
        if (this.map.has(key)) {
            return this.map.get(key);
        }

        const baseScale = 0.025;
        const islandScale = 0.12;
        const atollScale = 0.2;

        let elevation = 0.2;

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

        const biome = this.determineBiome(elevation, moisture, temperature);

        const tile = {
            x: x,
            y: y,
            biome: biome,
            elevation: elevation
        };

        this.map.set(key, tile);
        return tile;
    }

    getBiomeAt(x, y) {
        return this.generateChunkAt(x, y);
    }

    determineBiome(elevation, moisture, temperature) {
        if (elevation < 0.3) return 'ocean';
        else if (elevation < 0.4) return 'ocean';
        else if (elevation < 0.45) return 'beach';
        else if (elevation > 0.9) {
            if (temperature < 0.4) return 'snow';
            else return 'mountain';
        } else if (moisture < 0.15) {
            if (temperature > 0.75) return 'desert';
            else return 'savanna';
        } else if (moisture > 0.85) {
            if (temperature > 0.75) return 'jungle';
            else return 'swamp';
        } else if (temperature < 0.2) return 'taiga';
        else if (temperature > 0.8) return 'tropical';
        else return 'forest';
    }

    isWalkable(x, y, onShip = false) {
        const tile = this.getBiomeAt(x, y);
        if (!tile) return false;

        if (onShip) {
            return tile.biome === 'ocean';
        } else {
            const walkableBiomes = ['beach', 'desert', 'savanna', 'jungle', 'taiga', 'tropical', 'forest'];
            return walkableBiomes.includes(tile.biome);
        }
    }

    analyzeLandmass(startX, startY, maxSize = 500) {
        const tile = this.getBiomeAt(startX, startY);
        if (!tile || tile.biome === 'ocean') {
            return { size: 0, biomes: {}, diversity: 0, richness: 0 };
        }

        const visited = new Set();
        const biomeCount = {};
        const queue = [[startX, startY]];

        const biomeValue = {
            forest: 3, jungle: 3, tropical: 3,
            beach: 2, savanna: 2, taiga: 2,
            desert: 1, swamp: 1, mountain: 1, snow: 1
        };

        while (queue.length > 0 && visited.size < maxSize) {
            const [x, y] = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;

            const currentTile = this.getBiomeAt(x, y);
            if (!currentTile || currentTile.biome === 'ocean') continue;

            visited.add(key);

            const biome = currentTile.biome;
            biomeCount[biome] = (biomeCount[biome] || 0) + 1;

            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of directions) {
                const newKey = `${x + dx},${y + dy}`;
                if (!visited.has(newKey)) {
                    queue.push([x + dx, y + dy]);
                }
            }
        }

        const diversity = Object.keys(biomeCount).length;

        let richness = 0;
        for (const [biome, count] of Object.entries(biomeCount)) {
            richness += (biomeValue[biome] || 1) * count;
        }
        richness = richness / visited.size;

        return {
            size: visited.size,
            biomes: biomeCount,
            diversity: diversity,
            richness: richness
        };
    }
}

// Simplified EntityManager for testing
class TestEntityManager {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.entities = new Map();
        this.seededRandom = mapGenerator.seededRandom;
        this.nameGenerator = new NameGenerator(mapGenerator.getSeed());
        this.discoveredIslands = new Map();
    }

    addEntity(entity) {
        const key = `${entity.x},${entity.y}`;
        this.entities.set(key, entity);
    }

    isPositionOccupied(x, y) {
        return this.entities.has(`${x},${y}`);
    }

    spawnPorts(centerX, centerY, radius = 60) {
        console.log('Starting island-aware port spawning...');

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

        const processedTiles = new Set();
        let totalPortsSpawned = 0;
        let islandsProcessed = 0;
        const islandStats = [];

        for (const landTile of landTiles) {
            const key = `${landTile.x},${landTile.y}`;

            if (processedTiles.has(key)) continue;

            const island = this.discoverIsland(landTile.x, landTile.y, processedTiles);

            if (island && island.size >= 10) {
                islandsProcessed++;
                const portsSpawned = this.spawnPortsOnIsland(island);
                totalPortsSpawned += portsSpawned;

                islandStats.push({
                    name: island.name,
                    size: island.size,
                    portsSpawned: portsSpawned,
                    ports: this.getPortsOnIsland(island)
                });

                console.log(`Island "${island.name}" (${island.size} tiles): spawned ${portsSpawned} ports`);
            }
        }

        console.log(`Processed ${islandsProcessed} islands, spawned ${totalPortsSpawned} total ports`);
        return islandStats;
    }

    discoverIsland(startX, startY, globalProcessed = new Set()) {
        const tile = this.mapGenerator.getBiomeAt(startX, startY);
        if (!tile || tile.biome === 'ocean') return null;

        const landmassData = this.mapGenerator.analyzeLandmass(startX, startY, 500);

        if (landmassData.size === 0) return null;

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

            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of directions) {
                const newKey = `${x + dx},${y + dy}`;
                if (!visited.has(newKey) && !globalProcessed.has(newKey)) {
                    queue.push([x + dx, y + dy]);
                }
            }
        }

        const islandName = this.nameGenerator.generateIslandName(startX, startY, landmassData.size);

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

        this.discoveredIslands.set(`${startX},${startY}`, island);

        return island;
    }

    getPortCountForIsland(size) {
        if (size < 10) return 0;
        if (size < 30) return 1;
        if (size < 80) return 1 + Math.floor(Math.random() * 2);
        if (size < 150) return 2 + Math.floor(Math.random() * 3);
        if (size < 300) return 3 + Math.floor(Math.random() * 4);
        return 5 + Math.floor(Math.random() * 4);
    }

    spawnPortsOnIsland(island) {
        const portCount = this.getPortCountForIsland(island.size);
        if (portCount === 0) return 0;

        const coastalTiles = this.findCoastalTiles(island);

        if (coastalTiles.length === 0) {
            console.log(`Warning: Island "${island.name}" has no coastal tiles!`);
            return 0;
        }

        const portLocations = this.distributePortsAlongCoast(coastalTiles, portCount);

        let portsSpawned = 0;
        for (const location of portLocations) {
            if (this.isPositionOccupied(location.x, location.y)) continue;

            const portName = this.nameGenerator.generatePortName(location.x, location.y, island.name);

            const port = {
                type: 'port',
                x: location.x,
                y: location.y,
                islandName: island.name,
                portName: portName,
                islandSize: island.size
            };

            this.addEntity(port);
            portsSpawned++;
        }

        return portsSpawned;
    }

    findCoastalTiles(island) {
        const coastalTiles = [];
        const checkedTiles = new Set();

        for (const tile of island.tiles) {
            const key = `${tile.x},${tile.y}`;
            if (checkedTiles.has(key)) continue;
            checkedTiles.add(key);

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
                const isWalkable = this.mapGenerator.isWalkable(tile.x, tile.y, false);
                coastalTiles.push({
                    x: tile.x,
                    y: tile.y,
                    biome: tile.biome,
                    walkable: isWalkable
                });
            }
        }

        return coastalTiles.sort((a, b) => b.walkable - a.walkable);
    }

    distributePortsAlongCoast(coastalTiles, portCount) {
        if (coastalTiles.length === 0) return [];
        if (portCount >= coastalTiles.length) return coastalTiles;

        const portLocations = [];
        const step = Math.floor(coastalTiles.length / portCount);

        for (let i = 0; i < portCount; i++) {
            const index = (i * step) % coastalTiles.length;
            portLocations.push(coastalTiles[index]);
        }

        return portLocations;
    }

    getPortsOnIsland(island) {
        const ports = [];
        for (const [key, entity] of this.entities) {
            if (entity.type === 'port' && entity.islandName === island.name) {
                ports.push(entity);
            }
        }
        return ports;
    }

    getAllPorts() {
        const ports = [];
        for (const [key, entity] of this.entities) {
            if (entity.type === 'port') {
                ports.push(entity);
            }
        }
        return ports;
    }
}

// Run the test
console.log('='.repeat(70));
console.log('ISLAND-AWARE PORT SPAWNING SYSTEM TEST');
console.log('='.repeat(70));

const mapGen = new TestMapGenerator(12345);
const entityMgr = new TestEntityManager(mapGen);

console.log('\nSpawning ports using island-aware system...\n');
const islandStats = entityMgr.spawnPorts(0, 0, 60);

console.log('\n' + '='.repeat(70));
console.log('ISLAND SUMMARY');
console.log('='.repeat(70));

// Sort islands by size (largest first)
islandStats.sort((a, b) => b.size - a.size);

for (const island of islandStats) {
    const category =
        island.size < 30 ? 'Small' :
        island.size < 80 ? 'Medium' :
        island.size < 150 ? 'Large' :
        island.size < 300 ? 'Huge' : 'Massive';

    console.log(`\n${island.name} [${category} - ${island.size} tiles]`);
    console.log(`  Ports: ${island.portsSpawned}`);
    for (const port of island.ports) {
        console.log(`    • ${port.portName} (${port.x}, ${port.y})`);
    }
}

console.log('\n' + '='.repeat(70));
console.log('STATISTICS');
console.log('='.repeat(70));

const sizeCategories = {
    'Small (10-30)': 0,
    'Medium (30-80)': 0,
    'Large (80-150)': 0,
    'Huge (150-300)': 0,
    'Massive (>300)': 0
};

let totalPorts = 0;
for (const island of islandStats) {
    totalPorts += island.portsSpawned;
    if (island.size < 30) sizeCategories['Small (10-30)']++;
    else if (island.size < 80) sizeCategories['Medium (30-80)']++;
    else if (island.size < 150) sizeCategories['Large (80-150)']++;
    else if (island.size < 300) sizeCategories['Huge (150-300)']++;
    else sizeCategories['Massive (>300)']++;
}

console.log(`\nTotal islands processed: ${islandStats.length}`);
console.log(`Total ports spawned: ${totalPorts}`);
console.log(`Average ports per island: ${(totalPorts / islandStats.length).toFixed(1)}`);

console.log('\nIsland size distribution:');
for (const [category, count] of Object.entries(sizeCategories)) {
    console.log(`  ${category.padEnd(20)} ${count} islands`);
}

console.log('\n' + '='.repeat(70));
console.log('Test complete!');
console.log('='.repeat(70));
