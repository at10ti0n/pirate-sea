// Ship Progression System (Phase 1: MVP Loop)
// Defines ship types, stats, and upgrade paths

class ShipSystem {
    constructor() {
        this.initializeShipTypes();
    }

    initializeShipTypes() {
        // Ship progression tiers
        this.SHIP_TYPES = {
            dinghy: {
                name: 'Dinghy',
                cost: 0, // Starting ship
                maxCargo: 5,
                speed: 0.8,
                maxHull: 50,
                range: 100, // Safe range from home port in tiles
                icon: '⛵',
                description: 'A tiny rowing boat. Barely seaworthy.',
                tier: 0
            },
            sloop: {
                name: 'Sloop',
                cost: 300,
                maxCargo: 15,
                speed: 1.0,
                maxHull: 100,
                range: 200,
                icon: '⛵',
                description: 'A small single-masted vessel. Fast and maneuverable.',
                tier: 1
            },
            brigantine: {
                name: 'Brigantine',
                cost: 800,
                maxCargo: 30,
                speed: 1.2,
                maxHull: 150,
                range: 400,
                icon: '⛵',
                description: 'A two-masted merchant ship. Good cargo capacity.',
                tier: 2
            },
            frigate: {
                name: 'Frigate',
                cost: 2000,
                maxCargo: 50,
                speed: 1.0,
                maxHull: 250,
                range: 800,
                icon: '⛵',
                description: 'A powerful warship. Strong and spacious.',
                tier: 3
            },
            galleon: {
                name: 'Galleon',
                cost: 5000,
                maxCargo: 100,
                speed: 0.9,
                maxHull: 400,
                range: 99999, // Essentially unlimited
                icon: '⛵',
                description: 'The ultimate treasure ship. Can sail anywhere.',
                tier: 4
            }
        };
    }

    /**
     * Get ship stats by type
     * @param {string} shipType - Ship type key
     * @returns {Object|null} - Ship stats or null
     */
    getShipStats(shipType) {
        return this.SHIP_TYPES[shipType] || null;
    }

    /**
     * Get all available ships for purchase
     * @param {number} playerGold - Player's current gold
     * @returns {Array} - Array of purchasable ships
     */
    getAvailableShips(playerGold) {
        return Object.keys(this.SHIP_TYPES)
            .map(key => ({
                key: key,
                ...this.SHIP_TYPES[key],
                canAfford: playerGold >= this.SHIP_TYPES[key].cost
            }))
            .filter(ship => ship.cost > 0) // Exclude dinghy (free starting ship)
            .sort((a, b) => a.cost - b.cost); // Sort by cost
    }

    /**
     * Get next tier ship (upgrade path)
     * @param {string} currentShip - Current ship type
     * @returns {Object|null} - Next ship or null if at max
     */
    getNextTierShip(currentShip) {
        const current = this.SHIP_TYPES[currentShip];
        if (!current) return null;

        const nextTier = current.tier + 1;
        for (const key in this.SHIP_TYPES) {
            if (this.SHIP_TYPES[key].tier === nextTier) {
                return {
                    key: key,
                    ...this.SHIP_TYPES[key]
                };
            }
        }

        return null; // Already at max tier
    }

    /**
     * Compare two ships
     * @param {string} shipA - First ship type
     * @param {string} shipB - Second ship type
     * @returns {Object} - Comparison stats
     */
    compareShips(shipA, shipB) {
        const statsA = this.SHIP_TYPES[shipA];
        const statsB = this.SHIP_TYPES[shipB];

        if (!statsA || !statsB) return null;

        return {
            cargo: {
                current: statsA.maxCargo,
                new: statsB.maxCargo,
                diff: statsB.maxCargo - statsA.maxCargo
            },
            hull: {
                current: statsA.maxHull,
                new: statsB.maxHull,
                diff: statsB.maxHull - statsA.maxHull
            },
            speed: {
                current: statsA.speed,
                new: statsB.speed,
                diff: statsB.speed - statsA.speed
            },
            range: {
                current: statsA.range,
                new: statsB.range,
                diff: statsB.range - statsA.range
            }
        };
    }

    /**
     * Calculate repair cost
     * @param {string} shipType - Ship type
     * @param {number} currentHull - Current hull HP
     * @param {number} maxHull - Max hull HP
     * @param {number} costPerHP - Cost per hull point (from economy)
     * @returns {Object} - Repair info
     */
    calculateRepairCost(shipType, currentHull, maxHull, costPerHP = 2) {
        const damage = maxHull - currentHull;
        const totalCost = damage * costPerHP;

        return {
            damage: damage,
            cost: totalCost,
            currentHull: currentHull,
            maxHull: maxHull,
            costPerHP: costPerHP
        };
    }

    /**
     * Get ship display info for UI
     * @param {string} shipType - Ship type
     * @param {number} currentHull - Current hull HP (optional)
     * @returns {Object} - Display information
     */
    getShipDisplayInfo(shipType, currentHull = null) {
        const ship = this.SHIP_TYPES[shipType];
        if (!ship) return null;

        const info = {
            name: ship.name,
            icon: ship.icon,
            description: ship.description,
            stats: [
                `Cargo: ${ship.maxCargo} units`,
                `Hull: ${ship.maxHull} HP`,
                `Speed: ${ship.speed}x`,
                `Range: ${ship.range === 99999 ? 'Unlimited' : ship.range + ' tiles'}`
            ]
        };

        if (currentHull !== null) {
            const hullPercent = Math.floor((currentHull / ship.maxHull) * 100);
            info.currentHull = `${currentHull}/${ship.maxHull} (${hullPercent}%)`;
        }

        return info;
    }

    /**
     * Check if ship is in dangerous territory (beyond safe range)
     * @param {string} shipType - Ship type
     * @param {number} distanceFromHome - Distance from home port
     * @returns {Object} - Danger assessment
     */
    checkDangerLevel(shipType, distanceFromHome) {
        const ship = this.SHIP_TYPES[shipType];
        if (!ship) return { safe: false, dangerLevel: 'unknown' };

        const dangerRatio = distanceFromHome / ship.range;

        let dangerLevel = 'safe';
        if (dangerRatio > 1.5) {
            dangerLevel = 'extreme';
        } else if (dangerRatio > 1.0) {
            dangerLevel = 'high';
        } else if (dangerRatio > 0.7) {
            dangerLevel = 'moderate';
        }

        return {
            safe: dangerRatio <= 0.7,
            dangerLevel: dangerLevel,
            distanceFromHome: distanceFromHome,
            safeRange: ship.range,
            ratio: dangerRatio
        };
    }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShipSystem;
}
