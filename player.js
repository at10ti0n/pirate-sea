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

        // Health and survival stats
        this.maxHealth = 100;
        this.currentHealth = 100;
        this.hunger = 100; // 0-100%, starts full
        this.inCombat = false; // Combat state

        // Food inventory
        this.foodInventory = [];

        // Time tracking for food spoilage
        this.gameTime = 0; // Hours elapsed in game

        // Ship provisions (when on ship)
        this.shipProvisions = null;

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

    embarkFromCoast(entityManager, shipProvisionsSystem = null) {
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

        // Initialize provisions for newly launched ship
        if (shipProvisionsSystem) {
            this.shipProvisions = shipProvisionsSystem.initializeShipProvisions('dinghy', 5); // Small boat starts with minimal provisions
        }

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

    boardShip(shipPosition, entityManager, shipProvisionsSystem = null) {
        if (this.mode !== 'foot') {
            return { success: false, message: 'Already on a ship!' };
        }

        const boardInfo = this.canBoardShip(entityManager);
        if (!boardInfo.canBoard) {
            return { success: false, message: 'No ship nearby to board!' };
        }

        // Store ship's durability before boarding
        this.shipDurability = boardInfo.ship.durability || entityManager.createShipDurability(100);

        // Store ship's provisions before boarding (or initialize if not present)
        if (shipProvisionsSystem) {
            this.shipProvisions = boardInfo.ship.provisions || shipProvisionsSystem.initializeShipProvisions('sloop');
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
            // Use the best disembark location (beach preferred)
            this.x = unboardInfo.position.x;
            this.y = unboardInfo.position.y;
        }

        this.mode = 'foot';

        // Create ship entity at previous position with preserved durability and provisions
        entityManager.addEntity({
            type: 'ship',
            x: shipX,
            y: shipY,
            char: 'S',
            color: '#8b4513',
            durability: this.shipDurability || entityManager.createShipDurability(100),
            provisions: this.shipProvisions // Preserve provisions
        });

        // Clear player's ship provisions reference
        this.shipProvisions = null;

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

    // ===== HEALTH & HUNGER MANAGEMENT =====

    getHealth() {
        return {
            current: this.currentHealth,
            max: this.maxHealth,
            percent: Math.floor((this.currentHealth / this.maxHealth) * 100)
        };
    }

    getHunger() {
        return Math.floor(this.hunger);
    }

    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        return this.currentHealth;
    }

    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        return this.currentHealth;
    }

    isDead() {
        return this.currentHealth <= 0;
    }

    // Combat state management
    enterCombat() {
        this.inCombat = true;
    }

    exitCombat() {
        this.inCombat = false;
    }

    isInCombat() {
        return this.inCombat;
    }

    // ===== HUNGER SYSTEM =====

    decreaseHunger(amount) {
        this.hunger = Math.max(0, this.hunger - amount);

        // Apply starvation damage if hunger reaches 0
        if (this.hunger === 0) {
            this.takeDamage(1); // 1 HP per hunger update when starving
            return {
                hunger: this.hunger,
                starving: true,
                message: 'You are starving! (-1 HP)'
            };
        }

        return {
            hunger: this.hunger,
            starving: false
        };
    }

    increaseHunger(amount) {
        this.hunger = Math.min(100, this.hunger + amount);
        return this.hunger;
    }

    // ===== FOOD INVENTORY MANAGEMENT =====

    addFood(foodType, quantity = 1) {
        // Check if food already exists in inventory
        const existingFood = this.foodInventory.find(item => item.type === foodType);

        if (existingFood) {
            existingFood.quantity += quantity;
        } else {
            this.foodInventory.push({
                type: foodType,
                quantity: quantity,
                purchasedAt: this.gameTime
            });
        }

        return this.foodInventory;
    }

    removeFood(foodType, quantity = 1) {
        const foodIndex = this.foodInventory.findIndex(item => item.type === foodType);

        if (foodIndex === -1) {
            return { success: false, message: `No ${foodType} in inventory!` };
        }

        const foodItem = this.foodInventory[foodIndex];

        if (foodItem.quantity < quantity) {
            return { success: false, message: `Not enough ${foodType}! (Have ${foodItem.quantity})` };
        }

        foodItem.quantity -= quantity;

        // Remove from inventory if quantity reaches 0
        if (foodItem.quantity === 0) {
            this.foodInventory.splice(foodIndex, 1);
        }

        return { success: true, foodItem: foodItem };
    }

    eatFood(foodType, foodSystem) {
        const foodIndex = this.foodInventory.findIndex(item => item.type === foodType);

        if (foodIndex === -1) {
            return {
                success: false,
                message: `No ${foodType} in inventory!`
            };
        }

        const foodItem = this.foodInventory[foodIndex];

        // Use FoodSystem to eat the food
        const result = foodSystem.eatFood(this, foodItem, this.gameTime);

        if (result.success) {
            // Apply health and hunger restoration
            this.heal(result.healthRestored);
            this.increaseHunger(result.hungerRestored);

            // Remove one unit from inventory
            this.removeFood(foodType, 1);
        }

        return result;
    }

    getFoodInventory() {
        return this.foodInventory;
    }

    hasFoodType(foodType) {
        return this.foodInventory.some(item => item.type === foodType);
    }

    getFoodQuantity(foodType) {
        const foodItem = this.foodInventory.find(item => item.type === foodType);
        return foodItem ? foodItem.quantity : 0;
    }

    // ===== SHIP PROVISIONS =====

    hasShipProvisions() {
        return this.shipProvisions !== null && this.mode === 'ship';
    }

    getShipProvisions() {
        return this.shipProvisions;
    }

    restOnShip(hours, foodSystem, shipProvisionsSystem) {
        if (!this.hasShipProvisions()) {
            return {
                success: false,
                message: 'Not on a ship with provisions!'
            };
        }

        return shipProvisionsSystem.restOnShip(this, this.shipProvisions, hours, foodSystem);
    }

    purchaseShipProvisions(amount, portTier, shipProvisionsSystem) {
        if (!this.hasShipProvisions()) {
            return {
                success: false,
                message: 'Not on a ship!'
            };
        }

        return shipProvisionsSystem.purchaseProvisions(this, this.shipProvisions, amount, portTier);
    }

    getShipProvisionStatus(shipProvisionsSystem) {
        if (!this.hasShipProvisions()) {
            return null;
        }

        return shipProvisionsSystem.getProvisionStatus(this.shipProvisions);
    }

    // ===== TIME PROGRESSION =====

    advanceTime(hours, foodSystem) {
        this.gameTime += hours;

        // Decrease hunger over time
        const hungerUpdate = foodSystem.updateHunger(this.hunger, hours);
        this.hunger = hungerUpdate.newHunger;

        // Apply starvation damage if hunger is 0
        const starvationDamage = foodSystem.calculateStarvationDamage(this.hunger, hours);
        if (starvationDamage > 0) {
            this.takeDamage(starvationDamage);
        }

        return {
            gameTime: this.gameTime,
            hungerStatus: hungerUpdate.status,
            starvationDamage: starvationDamage
        };
    }

    getGameTime() {
        return this.gameTime;
    }

    // ===== STATUS DISPLAY =====

    getStatusSummary(foodSystem) {
        const health = this.getHealth();
        const hungerStatus = foodSystem.getHungerStatus(this.hunger);

        return {
            health: `${health.current}/${health.max} HP (${health.percent}%)`,
            hunger: `${Math.floor(this.hunger)}% (${hungerStatus.message})`,
            gold: `${this.gold}g`,
            mode: this.mode,
            position: `(${this.x}, ${this.y})`,
            inCombat: this.inCombat,
            gameTime: `${Math.floor(this.gameTime)}h`
        };
    }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}