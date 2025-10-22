// Player system with movement and mode management
class Player {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.x = 0;
        this.y = 0;
        this.mode = 'foot'; // 'foot' or 'ship'
        this.lastShipPosition = null;
        this.gold = 100; // Starting gold for trading
        this.shipDurability = null; // Track player's ship durability
        this.initialize();
    }

    initialize() {
        // Start player at origin and find a suitable spawn location
        this.x = 0;
        this.y = 0;

        // Find a nearby walkable tile
        for (let radius = 0; radius < 20; radius++) {
            for (let angle = 0; angle < 360; angle += 45) {
                const testX = Math.round(this.x + radius * Math.cos(angle * Math.PI / 180));
                const testY = Math.round(this.y + radius * Math.sin(angle * Math.PI / 180));

                if (this.mapGenerator.isWalkable(testX, testY, false)) {
                    this.x = testX;
                    this.y = testY;
                    console.log(`Player spawned at (${this.x}, ${this.y})`);
                    return;
                }
            }
        }

        console.log(`Player spawned at origin (${this.x}, ${this.y})`);
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getMode() {
        return this.mode;
    }

    getIcon() {
        return this.mode === 'ship' ? '⛵' : '@';
    }

    canMoveTo(x, y) {
        // No bounds checking for infinite world
        // Check if tile is walkable based on current mode
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

    moveUp() {
        return this.move(0, -1);
    }

    moveDown() {
        return this.move(0, 1);
    }

    moveLeft() {
        return this.move(-1, 0);
    }

    moveRight() {
        return this.move(1, 0);
    }

    getAdjacentPositions() {
        return [
            { x: this.x, y: this.y - 1, direction: 'north' },
            { x: this.x, y: this.y + 1, direction: 'south' },
            { x: this.x - 1, y: this.y, direction: 'west' },
            { x: this.x + 1, y: this.y, direction: 'east' }
        ];
    }

    canBoardShip(entityManager) {
        if (this.mode !== 'foot') return false;

        // Check if there's a ship in any adjacent tile
        const adjacentPositions = this.getAdjacentPositions();
        for (const pos of adjacentPositions) {
            const entity = entityManager.getEntityAt(pos.x, pos.y);
            if (entity && entity.type === 'ship') {
                return { canBoard: true, ship: entity, position: pos };
            }
        }

        return { canBoard: false };
    }

    canEmbarkFromCoast(entityManager) {
        if (this.mode !== 'foot') return false;

        // Use the coastal analysis to find suitable embark points
        const coastalInfo = this.mapGenerator.analyzeCoastalArea(this.x, this.y, 3);

        if (coastalInfo.isCoastal) {
            // Filter out occupied water tiles
            const availableEmbarkPoints = coastalInfo.bestEmbarkPoints.filter(pos =>
                !entityManager.isPositionOccupied(pos.x, pos.y)
            );

            if (availableEmbarkPoints.length > 0) {
                return {
                    canEmbark: true,
                    waterTiles: availableEmbarkPoints,
                    bestTile: availableEmbarkPoints[0] // Already sorted by navigability and distance
                };
            }

            // If no ideal embark points, check any navigable water
            const navigableWater = coastalInfo.waterTiles.filter(tile =>
                tile.navigable && !entityManager.isPositionOccupied(tile.x, tile.y)
            );

            if (navigableWater.length > 0) {
                // Sort by distance
                navigableWater.sort((a, b) => a.distance - b.distance);
                return {
                    canEmbark: true,
                    waterTiles: navigableWater,
                    bestTile: navigableWater[0]
                };
            }
        }

        return { canEmbark: false };
    }

    embarkFromCoast(entityManager) {
        if (this.mode !== 'foot') {
            return { success: false, message: 'Already on a ship!' };
        }

        const embarkInfo = this.canEmbarkFromCoast(entityManager);
        if (!embarkInfo.canEmbark) {
            return { success: false, message: 'No suitable water nearby to launch a ship!' };
        }

        // Use the best available water tile
        const waterTile = embarkInfo.bestTile;

        // Create a new ship at the water position
        const newShip = {
            type: 'ship',
            x: waterTile.x,
            y: waterTile.y,
            char: 'S',
            color: '#8b4513',
            fromCoast: true,
            coastX: this.x,
            coastY: this.y
        };

        // Add the ship to the entity manager
        entityManager.addEntity(newShip);

        // Move player to ship position and change mode
        this.x = waterTile.x;
        this.y = waterTile.y;
        this.mode = 'ship';

        return { success: true, message: 'You launch a small boat and set sail!' };
    }

    canUnboard() {
        if (this.mode !== 'ship') return false;

        // Use the coastal analysis to find suitable disembark points
        const disembarkInfo = this.mapGenerator.findBestDisembarkLocation(this.x, this.y, 3);

        if (disembarkInfo) {
            // Get all possible disembark locations for more options
            const coastalInfo = this.mapGenerator.analyzeCoastalArea(this.x, this.y, 3);

            return {
                canUnboard: true,
                landTiles: coastalInfo.bestDisembarkPoints,
                position: disembarkInfo, // Best position (beach preferred)
                isBeach: disembarkInfo.biome === 'beach'
            };
        }

        return { canUnboard: false };
    }

    boardShip(shipPosition, entityManager) {
        if (this.mode !== 'foot') {
            return { success: false, message: 'Already on a ship!' };
        }

        const boardInfo = this.canBoardShip(entityManager);
        if (!boardInfo.canBoard) {
            return { success: false, message: 'No ship nearby to board!' };
        }

        // Store ship's durability before boarding
        this.shipDurability = boardInfo.ship.durability || entityManager.createShipDurability(100);

        // Remove ship entity from map
        entityManager.removeEntity(boardInfo.ship.x, boardInfo.ship.y);

        // Move player to ship position and change mode
        this.x = boardInfo.ship.x;
        this.y = boardInfo.ship.y;
        this.mode = 'ship';

        return { success: true, message: 'You board the ship!' };
    }

    unboard(targetPosition, entityManager) {
        if (this.mode !== 'ship') {
            return { success: false, message: 'Not on a ship!' };
        }

        const unboardInfo = this.canUnboard();
        if (!unboardInfo.canUnboard) {
            return { success: false, message: 'No land nearby to unboard!' };
        }

        // Store current ship position
        const shipX = this.x;
        const shipY = this.y;

        // Move player to land and change mode
        if (targetPosition && this.mapGenerator.isWalkable(targetPosition.x, targetPosition.y, false)) {
            this.x = targetPosition.x;
            this.y = targetPosition.y;
        } else {
            // Use the best disembark location (beach preferred)
            this.x = unboardInfo.position.x;
            this.y = unboardInfo.position.y;
        }

        this.mode = 'foot';

        // Create ship entity at previous position with preserved durability
        entityManager.addEntity({
            type: 'ship',
            x: shipX,
            y: shipY,
            char: 'S',
            color: '#8b4513',
            durability: this.shipDurability || entityManager.createShipDurability(100)
        });

        // Customize message based on landing on beach or other terrain
        const landingMessage = unboardInfo.isBeach ?
            'You disembark onto a sandy beach!' :
            'You unboard onto land!';

        return { success: true, message: landingMessage };
    }

    getValidMoves() {
        const validMoves = [];
        const directions = [
            { dx: 0, dy: -1, name: 'up' },
            { dx: 0, dy: 1, name: 'down' },
            { dx: -1, dy: 0, name: 'left' },
            { dx: 1, dy: 0, name: 'right' }
        ];

        for (const dir of directions) {
            if (this.canMoveTo(this.x + dir.dx, this.y + dir.dy)) {
                validMoves.push(dir);
            }
        }

        return validMoves;
    }

    // Gold management methods for trading system
    getGold() {
        return this.gold;
    }

    addGold(amount) {
        this.gold += amount;
        return this.gold;
    }

    removeGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    canAfford(cost) {
        return this.gold >= cost;
    }
}