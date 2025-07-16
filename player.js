// Player system with movement and mode management
class Player {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.x = 0;
        this.y = 0;
        this.mode = 'foot'; // 'foot' or 'ship'
        this.lastShipPosition = null;
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
        
        // Check if player is on a coastal tile (land next to water)
        const adjacentPositions = this.getAdjacentPositions();
        const nearbyWater = adjacentPositions.filter(pos => {
            const tile = this.mapGenerator.getBiomeAt(pos.x, pos.y);
            return tile && tile.biome === 'ocean';
        });
        
        if (nearbyWater.length > 0) {
            // Check if any nearby water tile is available for ship placement
            const availableWaterTiles = nearbyWater.filter(pos => 
                !entityManager.isPositionOccupied(pos.x, pos.y)
            );
            
            if (availableWaterTiles.length > 0) {
                return { canEmbark: true, waterTiles: availableWaterTiles };
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
        
        // Use the first available water tile
        const waterTile = embarkInfo.waterTiles[0];
        
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
        
        // Move player to ship position and change mode
        this.x = waterTile.x;
        this.y = waterTile.y;
        this.mode = 'ship';
        
        return { success: true, message: 'You launch a small boat and set sail!' };
    }
    
    canUnboard() {
        if (this.mode !== 'ship') return false;
        
        // Check if there's walkable land in any adjacent tile
        const adjacentPositions = this.getAdjacentPositions();
        const landTiles = [];
        
        for (const pos of adjacentPositions) {
            if (this.mapGenerator.isWalkable(pos.x, pos.y, false)) {
                const tile = this.mapGenerator.getBiomeAt(pos.x, pos.y);
                landTiles.push({ 
                    ...pos, 
                    biome: tile.biome,
                    isBeach: tile.biome === 'beach'
                });
            }
        }
        
        if (landTiles.length > 0) {
            // Prefer beach tiles for disembarking
            const beachTiles = landTiles.filter(tile => tile.isBeach);
            const preferredTiles = beachTiles.length > 0 ? beachTiles : landTiles;
            
            return { canUnboard: true, landTiles: preferredTiles, position: preferredTiles[0] };
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
            // Find the first available land tile
            this.x = unboardInfo.position.x;
            this.y = unboardInfo.position.y;
        }
        
        this.mode = 'foot';
        
        // Create ship entity at previous position
        entityManager.addEntity({
            type: 'ship',
            x: shipX,
            y: shipY,
            char: 'S',
            color: '#8b4513'
        });
        
        return { success: true, message: 'You unboard onto land!' };
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
}