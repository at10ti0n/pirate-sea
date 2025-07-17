#!/usr/bin/env node

// Terminal-based pirate roguelike game
const readline = require('readline');
const ROT = require('rot-js');

// Import game modules (adapted for Node.js)
class TerminalMapGenerator {
    constructor(width = 48, height = 28) {
        this.displayWidth = width;
        this.displayHeight = height;
        this.worldSize = 200;
        this.map = new Map();
        this.biomes = {};
        this.cameraX = 0;
        this.cameraY = 0;
        this.initializeBiomes();
    }

    initializeBiomes() {
        this.biomes = {
            ocean: { char: '~', color: '\x1b[34m', walkable: false, shipWalkable: true },
            beach: { char: '.', color: '\x1b[33m', walkable: true, shipWalkable: false },
            mountain: { char: '^', color: '\x1b[37m', walkable: false, shipWalkable: false },
            snow: { char: '*', color: '\x1b[97m', walkable: false, shipWalkable: false },
            desert: { char: ':', color: '\x1b[31m', walkable: true, shipWalkable: false },
            savanna: { char: '"', color: '\x1b[91m', walkable: true, shipWalkable: false },
            jungle: { char: '#', color: '\x1b[32m', walkable: true, shipWalkable: false },
            swamp: { char: '%', color: '\x1b[36m', walkable: false, shipWalkable: false },
            taiga: { char: 'T', color: '\x1b[90m', walkable: true, shipWalkable: false },
            tropical: { char: 't', color: '\x1b[35m', walkable: true, shipWalkable: false },
            forest: { char: '♠', color: '\x1b[92m', walkable: true, shipWalkable: false }
        };
    }

    generateMap() {
        console.log('Generating infinite map system...');

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

        let biome = this.determineBiome(elevation, moisture, temperature);

        if (biome !== 'ocean') {
            const landmassSize = this.getLandmassSize(x, y, biome);
            if (landmassSize < 9) {
                biome = 'ocean';
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

    getLandmassSize(x, y, targetBiome, visited = new Set(), maxSize = 20) {
        const key = `${x},${y}`;
        if (visited.has(key) || visited.size >= maxSize) return visited.size >= maxSize ? maxSize : 0;

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

        const tempBiome = this.determineBiome(elevation, moisture, temperature);
        if (tempBiome === 'ocean') return 0;

        visited.add(key);
        let size = 1;

        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of directions) {
            if (visited.size < maxSize) {
                size += this.getLandmassSize(x + dx, y + dy, targetBiome, visited, maxSize);
            }
        }

        return size;
    }

    updateCamera(playerX, playerY) {
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

    getBiomeAt(x, y) {
        return this.generateChunkAt(x, y);
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
}

class TerminalPlayer {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.x = 0;
        this.y = 0;
        this.mode = 'foot';
        this.initialize();
    }

    initialize() {
        this.x = 0;
        this.y = 0;

        for (let radius = 0; radius < 20; radius++) {
            for (let angle = 0; angle < 360; angle += 45) {
                const testX = Math.round(this.x + radius * Math.cos(angle * Math.PI / 180));
                const testY = Math.round(this.y + radius * Math.sin(angle * Math.PI / 180));

                if (this.mapGenerator.isWalkable(testX, testY, false)) {
                    this.x = testX;
                    this.y = testY;
                    return;
                }
            }
        }
    }

    getIcon() {
        return this.mode === 'ship' ? '⛵' : '@';
    }

    canMoveTo(x, y) {
        return this.mapGenerator.isWalkable(x, y, this.mode === 'ship');
    }

    move(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        if (this.canMoveTo(newX, newY)) {
            this.x = newX;
            this.y = newY;
            return true;
        }

        return false;
    }
}

class TerminalEntityManager {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.entities = new Map();
        this.entityTypes = {
            ship: { char: 'S', color: '\x1b[33m' },
            port: { char: 'P', color: '\x1b[31m' },
            treasure: { char: '$', color: '\x1b[93m' }
        
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

isPositionOccupied(x, y) {
    return this.entities.has(`${x},${y}`);
}

spawnPlayerStartingShip(playerX, playerY) {
    console.log('Spawning starting ship near player...');

    // Look for nearby water within expanding radius
    for (let radius = 2; radius <= 10; radius++) {
        for (let angle = 0; angle < 360; angle += 45) {
            const testX = Math.round(playerX + radius * Math.cos(angle * Math.PI / 180));
            const testY = Math.round(playerY + radius * Math.sin(angle * Math.PI / 180));

            const tile = this.mapGenerator.getBiomeAt(testX, testY);
            if (tile && tile.biome === 'ocean' && !this.isPositionOccupied(testX, testY)) {
                // Check if it has enough water neighbors to be navigable
                let waterNeighbors = 0;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const neighbor = this.mapGenerator.getBiomeAt(testX + dx, testY + dy);
                        if (neighbor && neighbor.biome === 'ocean') {
                            waterNeighbors++;
                        }
                    }
                }

                if (waterNeighbors >= 3) {
                    const startingShip = {
                        type: 'ship',
                        x: testX,
                        y: testY,
                        char: 'S',
                        color: '\x1b[33m',
                        isStartingShip: true
                    };

                    this.addEntity(startingShip);
                    console.log(`Starting ship spawned at (${testX}, ${testY})`);
                    return true;
                }
            }
        }
    }

    console.log('Could not find suitable location for starting ship');
    return false;
}

getAllEntities() {
    return Array.from(this.entities.values());
}
}

class TerminalGame {
    constructor() {
        this.mapGenerator = new TerminalMapGenerator(60, 20);
        this.entityManager = new TerminalEntityManager(this.mapGenerator);
        this.player = null;
        this.running = false;
        this.messageLog = [];
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

        process.stdin.on('keypress', (str, key) => {
            this.handleKeyPress(key);
        });
    }

    initialize() {
        console.clear();
        console.log('Initializing Pirate Sea Terminal Edition...');

        this.mapGenerator.generateMap();
        this.player = new TerminalPlayer(this.mapGenerator);

        // Spawn the starting ship near the player
        this.entityManager.spawnPlayerStartingShip(this.player.x, this.player.y);

        this.running = true;
        this.addMessage('Welcome to Pirate Sea! Use WASD to move, B to board/disembark, Q to quit.');
        this.addMessage('A ship has been placed nearby for you to use!');
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
        }

        this.render();
    }

    toggleMode() {
        if (this.player.mode === 'foot') {
            // Check if there's a ship at the current position or adjacent
            const currentEntity = this.entityManager.getEntityAt(this.player.x, this.player.y);
            if (currentEntity && currentEntity.type === 'ship') {
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
                    // Leave ship at current position
                    const ship = {
                        type: 'ship',
                        x: this.player.x,
                        y: this.player.y,
                        char: 'S',
                        color: '\x1b[33m'
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
                    const biomeInfo = this.mapGenerator.getBiomeInfo(tileData.tile.biome);

                    // Check if player is at this position
                    if (tileData.worldX === this.player.x && tileData.worldY === this.player.y) {
                        line += `\x1b[91m${this.player.getIcon()}\x1b[0m`;
                    } else {
                        // Check if there's an entity at this position
                        const entity = this.entityManager.getEntityAt(tileData.worldX, tileData.worldY);
                        if (entity) {
                            const entityInfo = this.entityManager.entityTypes[entity.type];
                            line += `${entityInfo.color}${entityInfo.char}\x1b[0m`;
                        } else {
                            line += `${biomeInfo.color}${biomeInfo.char}\x1b[0m`;
                        }
                    }
                } else {
                    line += ' ';
                }
            }
            display += line + '\n';
        }

        console.log(display);
        console.log(`\nPosition: (${this.player.x}, ${this.player.y}) | Mode: ${this.player.mode}`);
        console.log('Controls: WASD=Move, B=Board/Disembark, Q=Quit');

        // Display recent messages
        if (this.messageLog.length > 0) {
            console.log('\nMessages:');
            this.messageLog.slice(-3).forEach(msg => console.log(`  ${msg}`));
        }
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
    const game = new TerminalGame();
    game.initialize();
}