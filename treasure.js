// Treasure System (Phase 1: MVP Loop)
// Manages treasure types, values, and generation

class TreasureSystem {
    constructor(seededRandom = null) {
        this.seededRandom = seededRandom || { random: () => Math.random() };
        this.initializeTreasureTypes();
    }

    initializeTreasureTypes() {
        // Define treasure rarities with spawn chances and value ranges
        this.TREASURE_TYPES = {
            common: {
                rarity: 'common',
                valueMin: 20,
                valueMax: 50,
                weight: 1,
                spawnChance: 0.60, // 60%
                names: [
                    'Gold Coins',
                    'Silver Pieces',
                    'Pearl Necklace',
                    'Brass Compass',
                    'Silver Candlestick',
                    'Jade Figurine'
                ]
            },
            uncommon: {
                rarity: 'uncommon',
                valueMin: 80,
                valueMax: 150,
                weight: 2,
                spawnChance: 0.30, // 30%
                names: [
                    'Jeweled Goblet',
                    'Emerald Ring',
                    'Gold Statue',
                    'Ruby Pendant',
                    'Sapphire Brooch',
                    'Diamond Earrings'
                ]
            },
            rare: {
                rarity: 'rare',
                valueMin: 200,
                valueMax: 400,
                weight: 3,
                spawnChance: 0.08, // 8%
                names: [
                    'Ancient Crown',
                    'Diamond Chest',
                    'Cursed Idol',
                    'Golden Scepter',
                    'Enchanted Amulet',
                    'Jeweled Chalice'
                ]
            },
            legendary: {
                rarity: 'legendary',
                valueMin: 500,
                valueMax: 1000,
                weight: 5,
                spawnChance: 0.02, // 2%
                names: [
                    'Aztec Gold',
                    'Poseidon\'s Trident',
                    'Blackbeard\'s Treasure',
                    'Lost Crown of Atlantis',
                    'Eye of the Kraken',
                    'Heart of the Ocean'
                ]
            }
        };
    }

    /**
     * Generate a random treasure item
     * @param {Object} options - Generation options (rarity override, position)
     * @returns {Object} - Treasure cargo item
     */
    generateTreasure(options = {}) {
        // Determine rarity
        let rarity = options.rarity || this.rollRarity();
        const treasureType = this.TREASURE_TYPES[rarity];

        // Pick a random name
        const nameIndex = Math.floor(this.seededRandom.random() * treasureType.names.length);
        const name = treasureType.names[nameIndex];

        // Generate value within range
        const valueRange = treasureType.valueMax - treasureType.valueMin;
        const value = treasureType.valueMin + Math.floor(this.seededRandom.random() * valueRange);

        // Create treasure item
        return {
            type: 'treasure',
            rarity: rarity,
            name: name,
            value: value,
            weight: treasureType.weight,
            foundAt: options.position ? { x: options.position.x, y: options.position.y } : null,
            description: this.getTreasureDescription(rarity, name, value)
        };
    }

    /**
     * Roll for treasure rarity based on spawn chances
     * @returns {string} - Rarity tier
     */
    rollRarity() {
        const roll = this.seededRandom.random();
        let cumulative = 0;

        // Check from rarest to most common
        const rarities = ['legendary', 'rare', 'uncommon', 'common'];
        for (const rarity of rarities) {
            cumulative += this.TREASURE_TYPES[rarity].spawnChance;
            if (roll < cumulative) {
                return rarity;
            }
        }

        return 'common'; // Fallback
    }

    /**
     * Generate description for treasure
     * @param {string} rarity - Treasure rarity
     * @param {string} name - Treasure name
     * @param {number} value - Treasure value
     * @returns {string} - Description text
     */
    getTreasureDescription(rarity, name, value) {
        const rarityDescriptions = {
            common: 'A modest treasure',
            uncommon: 'A valuable find',
            rare: 'An extraordinary treasure',
            legendary: 'A legendary artifact'
        };

        return `${rarityDescriptions[rarity]}: ${name} (Worth ~${value}g)`;
    }

    /**
     * Get treasure icon/color based on rarity
     * @param {string} rarity - Treasure rarity
     * @returns {Object} - Icon and color
     */
    getTreasureDisplay(rarity) {
        const displays = {
            common: { icon: '$', color: '#f1c40f' },      // Yellow
            uncommon: { icon: '$', color: '#3498db' },    // Blue
            rare: { icon: '$', color: '#9b59b6' },        // Purple
            legendary: { icon: '$', color: '#e74c3c' }    // Red
        };

        return displays[rarity] || displays.common;
    }

    /**
     * Generate buried treasure from map (higher quality)
     * @param {string} mapRarity - Rarity of the treasure map
     * @param {Object} position - Position where dug up
     * @returns {Object} - Treasure item
     */
    generateBuriedTreasure(mapRarity, position) {
        // Buried treasure is always better quality
        const rarityBoost = {
            common: 'uncommon',
            uncommon: 'rare',
            rare: 'legendary',
            legendary: 'legendary'
        };

        const boostedRarity = rarityBoost[mapRarity] || 'rare';
        return this.generateTreasure({
            rarity: boostedRarity,
            position: position
        });
    }

    /**
     * Calculate total value of treasure array
     * @param {Array} treasures - Array of treasure items
     * @returns {number} - Total gold value
     */
    getTotalValue(treasures) {
        return treasures.reduce((sum, treasure) => sum + (treasure.value || 0), 0);
    }

    /**
     * Get statistics about treasure collection
     * @param {Array} treasures - Array of treasure items
     * @returns {Object} - Statistics
     */
    getTreasureStats(treasures) {
        const stats = {
            total: treasures.length,
            totalValue: this.getTotalValue(treasures),
            byRarity: {
                common: 0,
                uncommon: 0,
                rare: 0,
                legendary: 0
            }
        };

        treasures.forEach(treasure => {
            if (treasure.rarity) {
                stats.byRarity[treasure.rarity]++;
            }
        });

        return stats;
    }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TreasureSystem;
}
