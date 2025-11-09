// Ship provisions and rest system
class ShipProvisions {
    constructor() {
        // Ship sizes and their provision capacities
        this.shipTypes = {
            dinghy: {
                name: 'Dinghy',
                maxProvisions: 10,
                restRecoveryPerHour: 3,
                provisionConsumptionRate: 0.25,  // Per hour while resting
                cargoCapacity: 5,
                description: 'Small boat, minimal provisions'
            },
            sloop: {
                name: 'Sloop',
                maxProvisions: 30,
                restRecoveryPerHour: 4,
                provisionConsumptionRate: 0.25,
                cargoCapacity: 20,
                description: 'Light ship with basic accommodations'
            },
            brigantine: {
                name: 'Brigantine',
                maxProvisions: 60,
                restRecoveryPerHour: 5,
                provisionConsumptionRate: 0.25,
                cargoCapacity: 40,
                description: 'Medium ship with comfortable cabin'
            },
            frigate: {
                name: 'Frigate',
                maxProvisions: 100,
                restRecoveryPerHour: 6,
                provisionConsumptionRate: 0.25,
                cargoCapacity: 60,
                description: 'Large warship with spacious quarters'
            },
            galleon: {
                name: 'Galleon',
                maxProvisions: 150,
                restRecoveryPerHour: 7,
                provisionConsumptionRate: 0.25,
                cargoCapacity: 100,
                description: 'Massive ship with luxurious captain quarters'
            }
        };

        // Default ship type if not specified
        this.defaultShipType = 'sloop';
    }

    // Initialize provisions for a ship
    initializeShipProvisions(shipType = 'sloop', startingProvisions = null) {
        const type = this.shipTypes[shipType] || this.shipTypes[this.defaultShipType];

        return {
            shipType: shipType,
            currentProvisions: startingProvisions !== null ? startingProvisions : Math.floor(type.maxProvisions * 0.5),
            maxProvisions: type.maxProvisions,
            restRecoveryPerHour: type.restRecoveryPerHour,
            provisionConsumptionRate: type.provisionConsumptionRate,
            cargoCapacity: type.cargoCapacity,
            cargoWeight: 0
        };
    }

    // Get ship type information
    getShipTypeInfo(shipType) {
        return this.shipTypes[shipType] || this.shipTypes[this.defaultShipType];
    }

    // Add provisions to ship
    addProvisions(shipProvisionsData, amount) {
        const newTotal = shipProvisionsData.currentProvisions + amount;
        const added = Math.min(newTotal, shipProvisionsData.maxProvisions) - shipProvisionsData.currentProvisions;

        shipProvisionsData.currentProvisions = Math.min(newTotal, shipProvisionsData.maxProvisions);

        return {
            success: true,
            added: added,
            current: shipProvisionsData.currentProvisions,
            max: shipProvisionsData.maxProvisions,
            overflow: amount - added
        };
    }

    // Remove provisions from ship
    consumeProvisions(shipProvisionsData, amount) {
        if (shipProvisionsData.currentProvisions < amount) {
            return {
                success: false,
                message: 'Not enough provisions on ship!',
                current: shipProvisionsData.currentProvisions,
                required: amount
            };
        }

        shipProvisionsData.currentProvisions -= amount;

        return {
            success: true,
            consumed: amount,
            current: shipProvisionsData.currentProvisions,
            max: shipProvisionsData.maxProvisions
        };
    }

    // Calculate rest on ship
    restOnShip(player, shipProvisionsData, hoursRested, foodSystem) {
        // Check if player is in combat
        if (player.isInCombat()) {
            return {
                success: false,
                message: 'Cannot rest while in combat!',
                healthRestored: 0,
                provisionsConsumed: 0
            };
        }

        // Calculate provisions needed
        const provisionsNeeded = hoursRested * shipProvisionsData.provisionConsumptionRate;

        // Check if ship has enough provisions
        if (shipProvisionsData.currentProvisions < provisionsNeeded) {
            return {
                success: false,
                message: `Not enough provisions! Need ${provisionsNeeded.toFixed(1)}, have ${shipProvisionsData.currentProvisions.toFixed(1)}`,
                healthRestored: 0,
                provisionsConsumed: 0
            };
        }

        // Consume provisions
        const consumeResult = this.consumeProvisions(shipProvisionsData, provisionsNeeded);

        if (!consumeResult.success) {
            return {
                success: false,
                message: consumeResult.message,
                healthRestored: 0,
                provisionsConsumed: 0
            };
        }

        // Calculate health restoration
        const baseRecovery = shipProvisionsData.restRecoveryPerHour * hoursRested;

        // Apply hunger modifier
        const hungerStatus = foodSystem.getHungerStatus(player.hunger);
        const modifiedRecovery = Math.floor(baseRecovery * hungerStatus.recoveryMultiplier);

        // Apply healing to player
        const healthBefore = player.currentHealth;
        player.heal(modifiedRecovery);
        const actualHealthRestored = player.currentHealth - healthBefore;

        // Also restore some hunger from provisions
        const hungerRestored = hoursRested * 5; // 5% hunger per hour
        player.increaseHunger(hungerRestored);

        return {
            success: true,
            message: `You rest in the ship's cabin. +${actualHealthRestored} HP, +${hungerRestored}% hunger`,
            healthRestored: actualHealthRestored,
            provisionsConsumed: provisionsNeeded,
            hungerRestored: hungerRestored,
            hoursRested: hoursRested,
            provisionsRemaining: shipProvisionsData.currentProvisions
        };
    }

    // Calculate provision cost at port
    getProvisionCost(amount, portTier = 'medium') {
        const tierMultipliers = {
            small: 1.3,
            medium: 1.0,
            large: 0.9,
            capital: 0.8
        };

        const baseCost = 5; // 5 gold per provision
        const multiplier = tierMultipliers[portTier] || 1.0;

        return Math.floor(amount * baseCost * multiplier);
    }

    // Purchase provisions at port
    purchaseProvisions(player, shipProvisionsData, amount, portTier = 'medium') {
        const cost = this.getProvisionCost(amount, portTier);

        // Check if player can afford
        if (!player.canAfford(cost)) {
            return {
                success: false,
                message: `Cannot afford ${amount} provisions! Cost: ${cost}g, Have: ${player.getGold()}g`,
                cost: cost
            };
        }

        // Add provisions to ship
        const addResult = this.addProvisions(shipProvisionsData, amount);

        if (addResult.overflow > 0) {
            // Adjust cost for what was actually added
            const actualCost = this.getProvisionCost(addResult.added, portTier);
            player.removeGold(actualCost);

            return {
                success: true,
                message: `Purchased ${addResult.added} provisions for ${actualCost}g. Ship full! (${addResult.overflow} overflow)`,
                purchased: addResult.added,
                cost: actualCost,
                overflow: addResult.overflow,
                current: addResult.current,
                max: addResult.max
            };
        }

        // Charge full amount
        player.removeGold(cost);

        return {
            success: true,
            message: `Purchased ${amount} provisions for ${cost}g`,
            purchased: amount,
            cost: cost,
            current: addResult.current,
            max: addResult.max
        };
    }

    // Get provision status for display
    getProvisionStatus(shipProvisionsData) {
        const percent = Math.floor((shipProvisionsData.currentProvisions / shipProvisionsData.maxProvisions) * 100);
        const shipInfo = this.getShipTypeInfo(shipProvisionsData.shipType);

        let status = 'Full';
        let color = '#00ff00';

        if (percent < 25) {
            status = 'Critical';
            color = '#ff0000';
        } else if (percent < 50) {
            status = 'Low';
            color = '#ff8800';
        } else if (percent < 75) {
            status = 'Moderate';
            color = '#ffff00';
        }

        return {
            current: shipProvisionsData.currentProvisions.toFixed(1),
            max: shipProvisionsData.maxProvisions,
            percent: percent,
            status: status,
            color: color,
            shipType: shipInfo.name,
            recoveryRate: `${shipProvisionsData.restRecoveryPerHour} HP/hour`,
            consumptionRate: `${shipProvisionsData.provisionConsumptionRate} provisions/hour`
        };
    }

    // Calculate how many hours can rest with current provisions
    getMaxRestHours(shipProvisionsData) {
        if (shipProvisionsData.provisionConsumptionRate === 0) {
            return Infinity;
        }

        return Math.floor(shipProvisionsData.currentProvisions / shipProvisionsData.provisionConsumptionRate);
    }

    // Transfer provisions between ships
    transferProvisions(fromShip, toShip, amount) {
        if (fromShip.currentProvisions < amount) {
            return {
                success: false,
                message: `Source ship only has ${fromShip.currentProvisions.toFixed(1)} provisions`,
                transferred: 0
            };
        }

        // Remove from source
        const consumeResult = this.consumeProvisions(fromShip, amount);

        if (!consumeResult.success) {
            return {
                success: false,
                message: consumeResult.message,
                transferred: 0
            };
        }

        // Add to destination
        const addResult = this.addProvisions(toShip, amount);

        // If overflow, return provisions to source
        if (addResult.overflow > 0) {
            this.addProvisions(fromShip, addResult.overflow);
        }

        return {
            success: true,
            message: `Transferred ${addResult.added} provisions`,
            transferred: addResult.added,
            overflow: addResult.overflow,
            sourceRemaining: fromShip.currentProvisions,
            destRemaining: toShip.currentProvisions
        };
    }

    // Calculate daily provision consumption for voyage
    calculateVoyageProvisions(days, shipType = 'sloop') {
        const shipInfo = this.getShipTypeInfo(shipType);
        const hoursPerDay = 24;
        const totalHours = days * hoursPerDay;

        // Assume resting 8 hours per day
        const restHoursPerDay = 8;
        const totalRestHours = days * restHoursPerDay;

        const provisionsNeeded = totalRestHours * shipInfo.provisionConsumptionRate;

        return {
            days: days,
            provisionsNeeded: Math.ceil(provisionsNeeded),
            shipType: shipInfo.name,
            canRest: Math.floor(provisionsNeeded),
            recommended: Math.ceil(provisionsNeeded * 1.2) // 20% buffer
        };
    }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShipProvisions;
}
