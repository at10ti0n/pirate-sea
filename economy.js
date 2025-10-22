// Economy and Trading System
// Handles pricing, supply/demand, merchant gold, and trade transactions

class EconomyManager {
    constructor(seededRandom = null) {
        this.seededRandom = seededRandom || { random: () => Math.random() };
        this.initializeConstants();
    }

    initializeConstants() {
        // Base prices for all resources (in gold)
        this.BASE_PRICES = {
            wood: 10,
            berries: 8,
            stone: 12,
            sand: 6,
            ore: 20,
            hay: 7,
            reeds: 9
        };

        // Port tier configurations
        this.PORT_TIERS = {
            small: {
                goldPool: 300,
                goldRegen: 0.5,      // Gold per minute
                inventorySize: 50,
                priceVariance: 0.3   // ±30%
            },
            medium: {
                goldPool: 500,
                goldRegen: 1.0,
                inventorySize: 100,
                priceVariance: 0.2
            },
            large: {
                goldPool: 800,
                goldRegen: 2.0,
                inventorySize: 200,
                priceVariance: 0.15
            },
            capital: {
                goldPool: 1500,
                goldRegen: 4.0,
                inventorySize: 500,
                priceVariance: 0.1
            }
        };

        // Map biomes to resources they produce
        this.BIOME_RESOURCES = {
            forest: ['wood', 'berries'],
            jungle: ['wood', 'berries'],
            tropical: ['wood', 'berries'],
            taiga: ['wood', 'berries'],
            desert: ['stone', 'sand'],
            mountain: ['stone', 'ore'],
            beach: ['sand', 'wood'],
            savanna: ['hay', 'wood'],
            swamp: ['reeds', 'berries']
        };
    }

    /**
     * Determine port's economic profile based on nearby biomes
     * @param {Object} port - Port entity with x, y coordinates
     * @param {Object} mapGenerator - MapGenerator instance
     * @returns {Object} Economy configuration
     */
    determinePortEconomy(port, mapGenerator) {
        const radius = 10;
        const biomeCounts = {};

        // Count biomes in surrounding area
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const tile = mapGenerator.getTileAt(port.x + dx, port.y + dy);
                if (tile && tile.biome) {
                    const biome = tile.biome;
                    biomeCounts[biome] = (biomeCounts[biome] || 0) + 1;
                }
            }
        }

        // Count resource availability based on nearby biomes
        const resourceCounts = {};
        for (const [biome, count] of Object.entries(biomeCounts)) {
            const resources = this.BIOME_RESOURCES[biome] || [];
            resources.forEach(resource => {
                resourceCounts[resource] = (resourceCounts[resource] || 0) + count;
            });
        }

        // Sort resources by availability
        const sortedResources = Object.entries(resourceCounts)
            .sort((a, b) => b[1] - a[1]);

        // Determine what port produces (abundant) and consumes (scarce)
        const produces = [];
        const consumes = [];

        if (sortedResources.length >= 2) {
            // Top 2 resources = produces (cheap to buy here, expensive to sell)
            produces.push(...sortedResources.slice(0, 2).map(r => r[0]));
        }

        if (sortedResources.length >= 4) {
            // Bottom 2 resources = consumes (expensive to buy here, cheap to sell)
            consumes.push(...sortedResources.slice(-2).map(r => r[0]));
        }

        // Determine port tier based on distance from origin (0,0)
        const distanceFromCenter = Math.sqrt(port.x ** 2 + port.y ** 2);
        let tier = 'small';
        if (distanceFromCenter < 50) {
            tier = 'capital';
        } else if (distanceFromCenter < 100) {
            tier = 'large';
        } else if (distanceFromCenter < 200) {
            tier = 'medium';
        }

        const tierConfig = this.PORT_TIERS[tier];

        // Initialize supply levels (1.0 = equilibrium)
        const supplyLevels = {};
        Object.keys(this.BASE_PRICES).forEach(resource => {
            supplyLevels[resource] = 1.0;
        });

        return {
            produces: produces,
            consumes: consumes,
            neutral: Object.keys(this.BASE_PRICES).filter(
                r => !produces.includes(r) && !consumes.includes(r)
            ),
            gold: tierConfig.goldPool,
            maxGold: tierConfig.goldPool,
            goldRegenRate: tierConfig.goldRegen,
            supplyLevels: supplyLevels,
            tier: tier,
            lastTrade: Date.now(),
            totalTradesCount: 0
        };
    }

    /**
     * Calculate buy price (player buying from merchant)
     * @param {string} resource - Resource name
     * @param {Object} port - Port with economy data
     * @returns {number} Price per unit in gold
     */
    calculateBuyPrice(resource, port) {
        const basePrice = this.BASE_PRICES[resource] || 10;

        // 1. Geographic modifier
        let geoMod = 1.0;
        if (port.economy.produces.includes(resource)) {
            geoMod = 0.7;  // 30% cheaper if port produces it
        } else if (port.economy.consumes.includes(resource)) {
            geoMod = 1.3;  // 30% more expensive if port needs it
        }

        // 2. Supply level modifier
        const supply = port.economy.supplyLevels[resource] || 1.0;
        // High supply (>1.0) = more expensive to buy (scarcity for merchant)
        // Low supply (<1.0) = cheaper to buy (abundant for merchant)
        const supplyMod = Math.max(0.5, Math.min(1.5,
            0.8 + (supply - 1.0) * 0.7
        ));

        // 3. Port tier variance (random fluctuation)
        const tierConfig = this.PORT_TIERS[port.economy.tier];
        const variance = tierConfig.priceVariance;
        const randomMod = 1.0 + (this.seededRandom.random() - 0.5) * variance;

        // 4. Merchant markup
        const markup = 1.2;

        const finalPrice = Math.round(
            basePrice * geoMod * supplyMod * randomMod * markup
        );

        return Math.max(1, finalPrice);
    }

    /**
     * Calculate sell price (player selling to merchant)
     * @param {string} resource - Resource name
     * @param {Object} port - Port with economy data
     * @returns {number} Price per unit in gold
     */
    calculateSellPrice(resource, port) {
        const basePrice = this.BASE_PRICES[resource] || 10;

        // 1. Geographic modifier (inverse of buy)
        let geoMod = 1.0;
        if (port.economy.consumes.includes(resource)) {
            geoMod = 1.3;  // Port pays MORE for what it needs
        } else if (port.economy.produces.includes(resource)) {
            geoMod = 0.7;  // Port pays LESS for what it already has
        }

        // 2. Demand modifier (inverse of supply for buying)
        const supply = port.economy.supplyLevels[resource] || 1.0;
        // High supply (>1.0) = low demand = lower sell price
        // Low supply (<1.0) = high demand = higher sell price
        const demandMod = Math.max(0.5, Math.min(1.5,
            1.2 - (supply - 1.0) * 0.7
        ));

        // 3. Port tier variance
        const tierConfig = this.PORT_TIERS[port.economy.tier];
        const variance = tierConfig.priceVariance;
        const randomMod = 1.0 + (this.seededRandom.random() - 0.5) * variance;

        // 4. Merchant discount (they profit)
        const discount = 0.8;

        const finalPrice = Math.round(
            basePrice * geoMod * demandMod * randomMod * discount
        );

        return Math.max(1, finalPrice);
    }

    /**
     * Get price indicator for UI display
     * @param {number} currentPrice - Current price
     * @param {number} basePrice - Base price
     * @returns {string} '★' for high, '↓' for low, '' for normal
     */
    getPriceIndicator(currentPrice, basePrice) {
        const ratio = currentPrice / basePrice;
        if (ratio >= 1.3) return '★';  // High price
        if (ratio <= 0.7) return '↓';  // Low price
        return '';  // Normal
    }

    /**
     * Update supply when player sells to port
     * @param {Object} port - Port entity
     * @param {string} resource - Resource name
     * @param {number} quantity - Amount sold
     */
    updateSupplyOnSell(port, resource, quantity) {
        const currentSupply = port.economy.supplyLevels[resource] || 1.0;
        const supplyIncrease = quantity / 100; // 100 items = +1.0 supply

        port.economy.supplyLevels[resource] = Math.min(2.0,
            currentSupply + supplyIncrease
        );
    }

    /**
     * Update supply when player buys from port
     * @param {Object} port - Port entity
     * @param {string} resource - Resource name
     * @param {number} quantity - Amount bought
     */
    updateSupplyOnBuy(port, resource, quantity) {
        const currentSupply = port.economy.supplyLevels[resource] || 1.0;
        const supplyDecrease = quantity / 100;

        port.economy.supplyLevels[resource] = Math.max(0.0,
            currentSupply - supplyDecrease
        );
    }

    /**
     * Natural supply recovery toward equilibrium
     * Call this periodically (e.g., every minute)
     * @param {Object} port - Port entity
     */
    tickSupplyRecovery(port) {
        const recoveryRate = 0.05; // 5% recovery toward equilibrium per tick

        for (const resource in port.economy.supplyLevels) {
            const current = port.economy.supplyLevels[resource];
            const target = 1.0; // Equilibrium

            port.economy.supplyLevels[resource] =
                current + (target - current) * recoveryRate;
        }
    }

    /**
     * Regenerate merchant gold over time
     * @param {Object} port - Port entity
     * @param {number} deltaMinutes - Time elapsed in minutes
     */
    tickGoldRegeneration(port, deltaMinutes) {
        const regenAmount = port.economy.goldRegenRate * deltaMinutes;

        port.economy.gold = Math.min(
            port.economy.maxGold,
            port.economy.gold + regenAmount
        );
    }

    /**
     * Execute buy transaction (player buying from merchant)
     * @param {Object} player - Player object with gold and inventory
     * @param {Object} port - Port entity
     * @param {string} resource - Resource name
     * @param {number} quantity - Amount to buy
     * @returns {Object} Transaction result
     */
    executeBuyTransaction(player, port, resource, quantity) {
        const pricePerUnit = this.calculateBuyPrice(resource, port);
        const totalCost = pricePerUnit * quantity;

        // Validation
        if (player.gold < totalCost) {
            return {
                success: false,
                error: 'Not enough gold!',
                required: totalCost,
                available: player.gold
            };
        }

        if (player.inventory.getCurrentLoad() + quantity > player.inventory.capacity) {
            return {
                success: false,
                error: 'Not enough inventory space!',
                needed: quantity,
                available: player.inventory.capacity - player.inventory.getCurrentLoad()
            };
        }

        // Execute transaction
        player.gold -= totalCost;
        port.economy.gold += totalCost;
        player.inventory.addResource(resource, quantity);
        this.updateSupplyOnBuy(port, resource, quantity);

        port.economy.lastTrade = Date.now();
        port.economy.totalTradesCount++;

        return {
            success: true,
            spent: totalCost,
            pricePerUnit: pricePerUnit,
            quantity: quantity
        };
    }

    /**
     * Execute sell transaction (player selling to merchant)
     * @param {Object} player - Player object with gold and inventory
     * @param {Object} port - Port entity
     * @param {string} resource - Resource name
     * @param {number} quantity - Amount to sell
     * @returns {Object} Transaction result
     */
    executeSellTransaction(player, port, resource, quantity) {
        const pricePerUnit = this.calculateSellPrice(resource, port);
        const totalValue = pricePerUnit * quantity;

        // Validation
        const playerQuantity = player.inventory.getQuantity(resource);
        if (playerQuantity < quantity) {
            return {
                success: false,
                error: 'Not enough resources!',
                requested: quantity,
                available: playerQuantity
            };
        }

        // Check merchant gold
        if (port.economy.gold < totalValue) {
            // Calculate partial sale option
            const maxQuantity = Math.floor(port.economy.gold / pricePerUnit);
            if (maxQuantity === 0) {
                return {
                    success: false,
                    error: 'Merchant has no gold!',
                    suggestion: 'Try selling less valuable items first'
                };
            }
            return {
                success: false,
                error: `Merchant only has ${Math.floor(port.economy.gold)}g`,
                suggestion: `Can buy ${maxQuantity} units`,
                partialQuantity: maxQuantity
            };
        }

        // Execute transaction
        player.gold += totalValue;
        port.economy.gold -= totalValue;
        player.inventory.removeResource(resource, quantity);
        this.updateSupplyOnSell(port, resource, quantity);

        port.economy.lastTrade = Date.now();
        port.economy.totalTradesCount++;

        return {
            success: true,
            earned: totalValue,
            pricePerUnit: pricePerUnit,
            quantity: quantity
        };
    }

    /**
     * Tick all economic systems (call every game minute)
     * @param {Array} ports - All port entities
     * @param {number} deltaMinutes - Time elapsed in minutes
     */
    tickAllPorts(ports, deltaMinutes = 1) {
        ports.forEach(port => {
            if (port.economy) {
                this.tickSupplyRecovery(port);
                this.tickGoldRegeneration(port, deltaMinutes);
            }
        });
    }
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EconomyManager;
}
