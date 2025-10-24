// Food and hunger system for Rest & Recovery
class FoodSystem {
    constructor() {
        // Food type definitions
        this.foodTypes = {
            berries: {
                name: 'Berries',
                restores: 10,              // HP restored
                hungerRestore: 20,         // Hunger % restored
                cost: 8,                   // Gold cost
                spoilTime: 48,             // Hours until spoiled
                weight: 0.5,               // Inventory weight
                description: 'Fresh berries gathered from bushes',
                canCookInto: null
            },
            fish: {
                name: 'Raw Fish',
                restores: 20,
                hungerRestore: 40,
                cost: 15,
                spoilTime: 24,
                weight: 1.0,
                description: 'Freshly caught fish, should be cooked soon',
                canCookInto: 'cooked_fish'
            },
            cooked_fish: {
                name: 'Cooked Fish',
                restores: 30,
                hungerRestore: 60,
                cost: 25,
                spoilTime: 72,
                weight: 1.0,
                description: 'Delicious cooked fish, nutritious and filling',
                canCookInto: null
            },
            hardtack: {
                name: 'Hardtack',
                restores: 5,
                hungerRestore: 30,
                cost: 5,
                spoilTime: 4320,           // 6 months (180 days * 24 hours)
                weight: 0.8,
                description: 'Hard, dry biscuit that lasts forever',
                canCookInto: null
            },
            provisions: {
                name: 'Provisions Bundle',
                restores: 15,              // Per serving
                hungerRestore: 50,
                cost: 50,                  // For 10 servings
                servingsPerBundle: 10,
                spoilTime: 168,            // 1 week
                weight: 5.0,               // For full bundle
                description: 'Mixed rations for long voyages',
                canCookInto: null
            },
            rum: {
                name: 'Rum',
                restores: 5,
                hungerRestore: 10,
                cost: 12,
                spoilTime: null,           // Never spoils
                weight: 1.5,
                description: 'Strong spirits, boosts morale',
                moraleBonus: 10,
                canCookInto: null
            },
            coconut: {
                name: 'Coconut',
                restores: 15,
                hungerRestore: 35,
                cost: 10,
                spoilTime: 240,            // 10 days
                weight: 1.2,
                description: 'Tropical fruit with water and meat',
                canCookInto: null
            }
        };

        // Hunger thresholds and effects
        this.hungerThresholds = {
            wellFed: { min: 70, max: 100, recoveryMultiplier: 1.0, message: 'Well Fed' },
            satisfied: { min: 40, max: 70, recoveryMultiplier: 0.5, message: 'Satisfied' },
            hungry: { min: 20, max: 40, recoveryMultiplier: 0.1, message: 'Hungry' },
            starving: { min: 0, max: 20, recoveryMultiplier: 0.0, message: 'Starving' }
        };

        // Hunger decay rate (% per hour of game time)
        this.hungerDecayRate = 1.0;
    }

    // Get food type information
    getFoodInfo(foodType) {
        return this.foodTypes[foodType] || null;
    }

    // Get all available food types
    getAllFoodTypes() {
        return Object.keys(this.foodTypes);
    }

    // Calculate hunger status and effects
    getHungerStatus(hungerPercent) {
        for (const [key, threshold] of Object.entries(this.hungerThresholds)) {
            if (hungerPercent >= threshold.min && hungerPercent <= threshold.max) {
                return {
                    status: key,
                    message: threshold.message,
                    recoveryMultiplier: threshold.recoveryMultiplier,
                    color: this.getHungerColor(key)
                };
            }
        }
        return {
            status: 'starving',
            message: 'Starving',
            recoveryMultiplier: 0.0,
            color: '#ff0000'
        };
    }

    // Get color code for hunger status
    getHungerColor(status) {
        const colors = {
            wellFed: '#00ff00',      // Green
            satisfied: '#ffff00',    // Yellow
            hungry: '#ff8800',       // Orange
            starving: '#ff0000'      // Red
        };
        return colors[status] || '#ffffff';
    }

    // Calculate if food has spoiled
    isSpoiled(foodItem, currentGameTime) {
        const foodInfo = this.getFoodInfo(foodItem.type);

        // Some food never spoils
        if (!foodInfo || foodInfo.spoilTime === null) {
            return false;
        }

        // Check if food has exceeded spoil time
        const timeSincePurchase = currentGameTime - (foodItem.purchasedAt || 0);
        return timeSincePurchase >= foodInfo.spoilTime;
    }

    // Calculate HP restoration with hunger modifier
    calculateHPRestoration(foodType, hungerPercent) {
        const foodInfo = this.getFoodInfo(foodType);
        if (!foodInfo) return 0;

        const hungerStatus = this.getHungerStatus(hungerPercent);
        const baseRestore = foodInfo.restores;

        // When hungry, food is more effective at restoring HP
        let hungerBonus = 1.0;
        if (hungerPercent < 30) {
            hungerBonus = 1.5; // 50% bonus when starving
        } else if (hungerPercent < 60) {
            hungerBonus = 1.2; // 20% bonus when hungry
        }

        return Math.floor(baseRestore * hungerBonus);
    }

    // Calculate hunger restoration
    calculateHungerRestoration(foodType) {
        const foodInfo = this.getFoodInfo(foodType);
        if (!foodInfo) return 0;
        return foodInfo.hungerRestore;
    }

    // Eat food and return results
    eatFood(player, foodItem, currentGameTime) {
        const foodInfo = this.getFoodInfo(foodItem.type);

        if (!foodInfo) {
            return {
                success: false,
                message: 'Unknown food type!',
                healthRestored: 0,
                hungerRestored: 0
            };
        }

        // Check if food is spoiled
        if (this.isSpoiled(foodItem, currentGameTime)) {
            return {
                success: false,
                message: `The ${foodInfo.name} has spoiled and is inedible!`,
                healthRestored: 0,
                hungerRestored: 0
            };
        }

        // Calculate restorations
        const healthRestored = this.calculateHPRestoration(foodItem.type, player.hunger || 50);
        const hungerRestored = this.calculateHungerRestoration(foodItem.type);

        // Apply morale bonus if applicable (for future morale system)
        const moraleBonus = foodInfo.moraleBonus || 0;

        // Format message based on food type
        let message = `You eat the ${foodInfo.name}.`;
        if (healthRestored > 0) {
            message += ` +${healthRestored} HP`;
        }
        if (hungerRestored > 0) {
            message += ` +${hungerRestored}% Hunger`;
        }
        if (moraleBonus > 0) {
            message += ` +${moraleBonus} Morale`;
        }

        return {
            success: true,
            message: message,
            healthRestored: healthRestored,
            hungerRestored: hungerRestored,
            moraleBonus: moraleBonus,
            foodInfo: foodInfo
        };
    }

    // Update hunger over time (called each game turn)
    updateHunger(currentHunger, timeElapsed) {
        // timeElapsed is in game hours
        const hungerLoss = this.hungerDecayRate * timeElapsed;
        const newHunger = Math.max(0, currentHunger - hungerLoss);

        return {
            newHunger: newHunger,
            hungerLost: currentHunger - newHunger,
            status: this.getHungerStatus(newHunger)
        };
    }

    // Calculate starvation damage
    calculateStarvationDamage(hungerPercent, hoursElapsed) {
        // Only apply starvation damage if hunger is 0
        if (hungerPercent > 0) return 0;

        // 1 HP loss per hour when starving
        return Math.floor(hoursElapsed * 1.0);
    }

    // Check if player can cook food
    canCook(foodType) {
        const foodInfo = this.getFoodInfo(foodType);
        return foodInfo && foodInfo.canCookInto !== null;
    }

    // Cook raw food into cooked version
    cookFood(foodType) {
        const foodInfo = this.getFoodInfo(foodType);

        if (!foodInfo || !foodInfo.canCookInto) {
            return {
                success: false,
                message: `Cannot cook ${foodInfo ? foodInfo.name : 'this item'}.`,
                cookedFood: null
            };
        }

        const cookedFoodInfo = this.getFoodInfo(foodInfo.canCookInto);

        return {
            success: true,
            message: `You cook the ${foodInfo.name} into ${cookedFoodInfo.name}.`,
            cookedFood: foodInfo.canCookInto,
            cookedFoodInfo: cookedFoodInfo
        };
    }

    // Get food purchase options for a port
    getAvailableFoodAtPort(portTier) {
        const availability = {
            small: ['berries', 'hardtack', 'fish'],
            medium: ['berries', 'hardtack', 'fish', 'cooked_fish', 'rum', 'coconut'],
            large: ['berries', 'hardtack', 'fish', 'cooked_fish', 'rum', 'coconut', 'provisions'],
            capital: ['berries', 'hardtack', 'fish', 'cooked_fish', 'rum', 'coconut', 'provisions']
        };

        return availability[portTier] || availability.small;
    }

    // Format food inventory display
    formatFoodInventory(inventory, currentGameTime) {
        const lines = [];

        for (const item of inventory) {
            const foodInfo = this.getFoodInfo(item.type);
            if (!foodInfo) continue;

            const spoiled = this.isSpoiled(item, currentGameTime);
            const quantity = item.quantity || 1;

            let line = `${foodInfo.name}`;
            if (quantity > 1) {
                line += ` x${quantity}`;
            }

            if (spoiled) {
                line += ' [SPOILED]';
            } else if (foodInfo.spoilTime && foodInfo.spoilTime < 168) {
                // Show time remaining for perishable items (less than 1 week shelf life)
                const timeRemaining = foodInfo.spoilTime - (currentGameTime - (item.purchasedAt || 0));
                if (timeRemaining < 24) {
                    line += ` [${Math.floor(timeRemaining)}h left]`;
                }
            }

            line += ` (${foodInfo.restores} HP, ${foodInfo.hungerRestore}% hunger)`;
            lines.push(line);
        }

        return lines;
    }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoodSystem;
}
