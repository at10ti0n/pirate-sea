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

        // Cargo hold system (Phase 1: MVP Loop)
        this.cargoHold = []; // Array of cargo items
        this.maxCargoSpace = 5; // Starting capacity (dinghy)

        // Ship progression system
        this.currentShip = 'dinghy'; // Ship type
        this.shipHull = 50; // Current hull HP
        this.maxShipHull = 50; // Max hull for current ship

        // Home port system
        this.homePort = null; // Set when first port is visited
        this.homePortX = null;
        this.homePortY = null;

        // Crew system
        this.crew = null; // Will be initialized when player gets a ship

        // Reputation system
        this.reputation = 0; // Positive = good, negative = pirate

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

    // ===== COOKING SYSTEM =====

    canCookHere(location = 'none') {
        // Can cook at: ports, on ship (galley), campfire, or settlement
        const validLocations = ['port', 'ship', 'campfire', 'settlement', 'tavern'];

        if (location === 'ship' && this.mode !== 'ship') {
            return {
                canCook: false,
                reason: 'Not on a ship!'
            };
        }

        if (validLocations.includes(location)) {
            return {
                canCook: true,
                location: location
            };
        }

        return {
            canCook: false,
            reason: 'No cooking facilities available. You need a campfire, ship galley, port, or settlement.'
        };
    }

    cookFood(foodType, foodSystem, location = 'ship') {
        // Check if we can cook at this location
        const locationCheck = this.canCookHere(location);
        if (!locationCheck.canCook) {
            return {
                success: false,
                message: locationCheck.reason
            };
        }

        // Check if food type exists in inventory
        if (!this.hasFoodType(foodType)) {
            return {
                success: false,
                message: `No ${foodType} in inventory to cook!`
            };
        }

        // Check if this food can be cooked
        if (!foodSystem.canCook(foodType)) {
            const foodInfo = foodSystem.getFoodInfo(foodType);
            return {
                success: false,
                message: `${foodInfo.name} cannot be cooked.`
            };
        }

        // Get the cooking result
        const cookResult = foodSystem.cookFood(foodType);

        if (!cookResult.success) {
            return cookResult;
        }

        // Remove raw food from inventory
        const removeResult = this.removeFood(foodType, 1);
        if (!removeResult.success) {
            return {
                success: false,
                message: removeResult.message
            };
        }

        // Add cooked food to inventory
        this.addFood(cookResult.cookedFood, 1);

        return {
            success: true,
            message: `${cookResult.message} (at ${location})`,
            rawFood: foodType,
            cookedFood: cookResult.cookedFood,
            cookedFoodInfo: cookResult.cookedFoodInfo
        };
    }

    // Get list of cookable items in inventory
    getCookableItems(foodSystem) {
        const cookable = [];

        for (const item of this.foodInventory) {
            if (foodSystem.canCook(item.type)) {
                const foodInfo = foodSystem.getFoodInfo(item.type);
                const cookedInfo = foodSystem.getFoodInfo(foodInfo.canCookInto);

                cookable.push({
                    type: item.type,
                    name: foodInfo.name,
                    quantity: item.quantity,
                    becomesType: foodInfo.canCookInto,
                    becomesName: cookedInfo.name,
                    improvement: {
                        hp: cookedInfo.restores - foodInfo.restores,
                        hunger: cookedInfo.hungerRestore - foodInfo.hungerRestore,
                        spoilTime: cookedInfo.spoilTime - foodInfo.spoilTime
                    }
                });
            }
        }

        return cookable;
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

    // ===== CARGO HOLD MANAGEMENT (Phase 1: MVP Loop) =====

    /**
     * Add an item to the cargo hold
     * @param {Object} item - Cargo item to add
     * @returns {Object} - { success: boolean, message: string }
     */
    addToCargo(item) {
        const currentWeight = this.getCargoWeight();
        const newWeight = currentWeight + (item.weight || 1);

        if (newWeight > this.maxCargoSpace) {
            return {
                success: false,
                message: `Cargo hold full! (${currentWeight}/${this.maxCargoSpace})`
            };
        }

        this.cargoHold.push(item);
        return {
            success: true,
            message: `Added ${item.name} to cargo (${newWeight}/${this.maxCargoSpace})`
        };
    }

    /**
     * Remove an item from cargo by index
     * @param {number} index - Index of item to remove
     * @returns {Object|null} - Removed item or null
     */
    removeFromCargo(index) {
        if (index >= 0 && index < this.cargoHold.length) {
            return this.cargoHold.splice(index, 1)[0];
        }
        return null;
    }

    /**
     * Get total weight of cargo
     * @returns {number} - Total cargo weight
     */
    getCargoWeight() {
        return this.cargoHold.reduce((total, item) => total + (item.weight || 1), 0);
    }

    /**
     * Check if an item can be added to cargo
     * @param {Object} item - Item to check
     * @returns {boolean} - True if item can be added
     */
    canAddToCargo(item) {
        const currentWeight = this.getCargoWeight();
        const itemWeight = item.weight || 1;
        return (currentWeight + itemWeight) <= this.maxCargoSpace;
    }

    /**
     * Get cargo hold summary
     * @returns {Object} - Cargo information
     */
    getCargoSummary() {
        const weight = this.getCargoWeight();
        return {
            items: this.cargoHold,
            count: this.cargoHold.length,
            weight: weight,
            maxWeight: this.maxCargoSpace,
            free: this.maxCargoSpace - weight,
            isFull: weight >= this.maxCargoSpace
        };
    }

    /**
     * Clear all cargo (for death/selling)
     * @returns {Array} - Items that were in cargo
     */
    clearCargo() {
        const items = [...this.cargoHold];
        this.cargoHold = [];
        return items;
    }

    /**
     * Get total value of cargo
     * @returns {number} - Total gold value of all cargo
     */
    getCargoValue() {
        return this.cargoHold.reduce((total, item) => total + (item.value || 0), 0);
    }

    // ===== HOME PORT MANAGEMENT =====

    /**
     * Set home port (first port visited)
     * @param {Object} port - Port entity
     */
    setHomePort(port) {
        if (!this.homePort) {
            this.homePort = port;
            this.homePortX = port.x;
            this.homePortY = port.y;
            return true;
        }
        return false;
    }

    /**
     * Get distance to home port
     * @returns {number|null} - Distance or null if no home port
     */
    getDistanceToHome() {
        if (this.homePort) {
            const dx = this.x - this.homePortX;
            const dy = this.y - this.homePortY;
            return Math.sqrt(dx * dx + dy * dy);
        }
        return null;
    }

    /**
     * Check if at home port
     * @returns {boolean} - True if at home port location
     */
    isAtHomePort() {
        return this.homePort && this.x === this.homePortX && this.y === this.homePortY;
    }

    // ===== SHIP MANAGEMENT =====

    /**
     * Get current ship stats
     * @returns {Object} - Ship information
     */
    getShipStats() {
        return {
            type: this.currentShip,
            hull: this.shipHull,
            maxHull: this.maxShipHull,
            cargoSpace: this.maxCargoSpace,
            hullPercent: Math.floor((this.shipHull / this.maxShipHull) * 100)
        };
    }

    /**
     * Damage the ship hull
     * @param {number} damage - Amount of damage to apply
     * @returns {number} - Current hull HP
     */
    damageShip(damage) {
        this.shipHull = Math.max(0, this.shipHull - damage);
        return this.shipHull;
    }

    /**
     * Repair ship hull
     * @param {number} amount - Amount of HP to restore
     * @returns {number} - Current hull HP
     */
    repairShip(amount) {
        this.shipHull = Math.min(this.maxShipHull, this.shipHull + amount);
        return this.shipHull;
    }

    /**
     * Check if ship is destroyed
     * @returns {boolean} - True if hull is 0
     */
    isShipDestroyed() {
        return this.shipHull <= 0;
    }

    // ===== PHASE 2: STORM DAMAGE SYSTEM =====

    /**
     * Apply storm damage to ship hull (Phase 2: Risk & Stakes)
     * @param {string} weatherType - Weather type (rain, storm, hurricane)
     * @param {number} baseDamage - Base damage from weather
     * @returns {number} - Actual damage applied
     */
    applyStormDamage(weatherType, baseDamage) {
        if (this.mode !== 'ship' || baseDamage === 0) return 0;

        // Ship resistance - better ships take less damage
        const resistance = {
            dinghy: 1.0,      // 100% damage (fragile)
            sloop: 0.9,       // 90% damage
            brigantine: 0.75, // 75% damage
            frigate: 0.6,     // 60% damage
            galleon: 0.5      // 50% damage (sturdy)
        }[this.currentShip] || 1.0;

        const actualDamage = Math.ceil(baseDamage * resistance);
        this.damageShip(actualDamage);

        return actualDamage;
    }

    /**
     * Get danger level based on distance from home (Phase 2)
     * @returns {Object} - Danger level and info
     */
    getDangerLevel() {
        if (!this.homePort) {
            return {
                level: 'unknown',
                ratio: 0,
                inSafeZone: true
            };
        }

        const distance = this.getDistanceToHome();
        const shipRange = this.getShipRange();
        const dangerRatio = distance / shipRange;

        let level;
        if (dangerRatio < 0.5) {
            level = 'safe';
        } else if (dangerRatio < 0.8) {
            level = 'moderate';
        } else if (dangerRatio < 1.2) {
            level = 'dangerous';
        } else {
            level = 'extreme';
        }

        return {
            level: level,
            ratio: dangerRatio,
            distance: Math.floor(distance),
            shipRange: shipRange,
            inSafeZone: dangerRatio < 0.5
        };
    }

    /**
     * Get ship's safe range
     * @returns {number} - Safe range in tiles
     */
    getShipRange() {
        const ranges = {
            dinghy: 100,
            sloop: 200,
            brigantine: 400,
            frigate: 800,
            galleon: 99999
        };

        return ranges[this.currentShip] || 100;
    }

    // ===== CREW MANAGEMENT =====

    /**
     * Initialize crew for player's ship
     * @param {Object} crewManager - Crew manager instance
     */
    initializeCrew(crewManager) {
        if (!this.crew) {
            this.crew = crewManager.initializeCrew(this.currentShip);
        }
    }

    /**
     * Get crew bonuses
     * @param {Object} crewManager - Crew manager instance
     */
    getCrewBonuses(crewManager) {
        if (!this.crew || !crewManager) {
            return null;
        }
        return crewManager.getCrewBonuses(this.crew);
    }

    /**
     * Update crew morale
     * @param {Object} crewManager - Crew manager instance
     * @param {Object} conditions - Current conditions
     */
    updateCrewMorale(crewManager, conditions) {
        if (!this.crew || !crewManager) {
            return null;
        }
        return crewManager.updateMorale(this.crew, conditions);
    }

    /**
     * Check for mutiny
     * @param {Object} crewManager - Crew manager instance
     */
    checkMutiny(crewManager) {
        if (!this.crew || !crewManager) {
            return { mutiny: false };
        }
        return crewManager.attemptMutiny(this.crew);
    }

    /**
     * Pay crew wages
     * @param {Object} crewManager - Crew manager instance
     */
    payCrewWages(crewManager) {
        if (!this.crew || !crewManager) {
            return { success: false, message: 'No crew to pay!' };
        }

        const result = crewManager.payWages(this.crew, this.gold);
        if (result.success) {
            this.gold -= result.cost;
        }
        return result;
    }

    /**
     * Hire crew member
     * @param {Object} crewManager - Crew manager instance
     * @param {string} portTier - Port tier
     */
    hireCrew(crewManager, portTier = 'small') {
        if (!this.crew) {
            return { success: false, message: 'No crew system initialized!' };
        }

        const result = crewManager.hireCrew(this.crew, this.gold, portTier);
        if (result.success) {
            this.gold -= result.cost;
        }
        return result;
    }

    /**
     * Get crew status
     * @param {Object} crewManager - Crew manager instance
     */
    getCrewStatus(crewManager) {
        if (!this.crew || !crewManager) {
            return null;
        }
        return crewManager.getCrewStatus(this.crew);
    }

    // ===== REPUTATION MANAGEMENT =====

    /**
     * Add reputation
     */
    addReputation(amount) {
        this.reputation += amount;
        return this.reputation;
    }

    /**
     * Get reputation status
     */
    getReputationStatus() {
        if (this.reputation >= 100) return 'Hero of the Seas';
        if (this.reputation >= 50) return 'Respected Captain';
        if (this.reputation >= 10) return 'Known Sailor';
        if (this.reputation >= -10) return 'Neutral';
        if (this.reputation >= -50) return 'Scoundrel';
        if (this.reputation >= -100) return 'Pirate';
        return 'Notorious Pirate';
    }

    /**
     * Spend gold (with check)
     */
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}