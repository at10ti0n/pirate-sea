// Quest System
class QuestManager {
    constructor(seededRandom) {
        this.seededRandom = seededRandom;
        this.activeQuests = [];
        this.completedQuests = [];
        this.questIdCounter = 0;

        // Quest templates
        this.questTypes = {
            delivery: {
                name: 'Cargo Delivery',
                description: 'Deliver cargo to a destination port',
                baseReward: 100,
                difficulty: 'easy'
            },
            bounty: {
                name: 'Bounty Hunt',
                description: 'Hunt down a wanted pirate ship',
                baseReward: 200,
                difficulty: 'hard'
            },
            escort: {
                name: 'Escort Mission',
                description: 'Escort a merchant ship safely',
                baseReward: 150,
                difficulty: 'medium'
            },
            treasure_hunt: {
                name: 'Treasure Hunt',
                description: 'Find hidden treasure at specific coordinates',
                baseReward: 250,
                difficulty: 'medium'
            },
            exploration: {
                name: 'Exploration',
                description: 'Explore and map uncharted waters',
                baseReward: 120,
                difficulty: 'easy'
            },
            rescue: {
                name: 'Rescue Mission',
                description: 'Rescue stranded sailors',
                baseReward: 180,
                difficulty: 'medium'
            }
        };
    }

    /**
     * Generate a quest at a port
     * @param {Object} port - Port entity
     * @param {Object} player - Player object
     * @returns {Object} - Generated quest
     */
    generateQuest(port, player) {
        // Select random quest type
        const questTypeKeys = Object.keys(this.questTypes);
        const questType = questTypeKeys[Math.floor(this.seededRandom.random() * questTypeKeys.length)];
        const template = this.questTypes[questType];

        // Generate quest based on type
        let quest = {
            id: ++this.questIdCounter,
            type: questType,
            name: template.name,
            description: template.description,
            reward: this.calculateReward(template.baseReward, player),
            sourcePort: {
                name: port.portName || 'Port',
                x: port.x,
                y: port.y
            },
            status: 'available',
            timeLimit: null,
            progress: 0,
            required: 100,
            accepted: null
        };

        // Customize quest based on type
        switch (questType) {
            case 'delivery':
                quest = this.generateDeliveryQuest(quest, port, player);
                break;
            case 'bounty':
                quest = this.generateBountyQuest(quest, port, player);
                break;
            case 'escort':
                quest = this.generateEscortQuest(quest, port, player);
                break;
            case 'treasure_hunt':
                quest = this.generateTreasureHuntQuest(quest, port, player);
                break;
            case 'exploration':
                quest = this.generateExplorationQuest(quest, port, player);
                break;
            case 'rescue':
                quest = this.generateRescueQuest(quest, port, player);
                break;
        }

        return quest;
    }

    /**
     * Generate delivery quest
     */
    generateDeliveryQuest(quest, port, player) {
        // Find a destination port (50-150 tiles away)
        const distance = 50 + Math.floor(this.seededRandom.random() * 100);
        const angle = this.seededRandom.random() * Math.PI * 2;
        const targetX = Math.round(port.x + Math.cos(angle) * distance);
        const targetY = Math.round(port.y + Math.sin(angle) * distance);

        quest.destination = {
            x: targetX,
            y: targetY,
            name: `Port ${Math.floor(this.seededRandom.random() * 1000)}`
        };
        quest.cargo = {
            name: this.getRandomCargo(),
            weight: 2 + Math.floor(this.seededRandom.random() * 5)
        };
        quest.timeLimit = Math.floor(distance / 2); // Time limit based on distance
        quest.description = `Deliver ${quest.cargo.name} to ${quest.destination.name} at (${targetX}, ${targetY})`;
        quest.detailedDesc = `The port master needs ${quest.cargo.name} delivered to ${quest.destination.name}. Distance: ${distance} tiles. Time limit: ${quest.timeLimit} turns.`;

        return quest;
    }

    /**
     * Generate bounty quest
     */
    generateBountyQuest(quest, port, player) {
        const pirateNames = ['Blackheart', 'Redbeard', 'Ironhook', 'Stormblade', 'Savage Sam'];
        const pirateName = pirateNames[Math.floor(this.seededRandom.random() * pirateNames.length)];

        const distance = 30 + Math.floor(this.seededRandom.random() * 80);
        const angle = this.seededRandom.random() * Math.PI * 2;
        const targetX = Math.round(port.x + Math.cos(angle) * distance);
        const targetY = Math.round(port.y + Math.sin(angle) * distance);

        quest.target = {
            name: `Captain ${pirateName}`,
            type: 'pirate_brig', // Will spawn this enemy
            x: targetX,
            y: targetY,
            radius: 20 // Search area
        };
        quest.description = `Hunt down ${quest.target.name} near (${targetX}, ${targetY})`;
        quest.detailedDesc = `The Navy has placed a bounty on ${quest.target.name}, a notorious pirate. Last seen near coordinates (${targetX}, ${targetY}). Reward: ${quest.reward}g`;
        quest.spawned = false;

        return quest;
    }

    /**
     * Generate escort quest
     */
    generateEscortQuest(quest, port, player) {
        const distance = 40 + Math.floor(this.seededRandom.random() * 60);
        const angle = this.seededRandom.random() * Math.PI * 2;
        const targetX = Math.round(port.x + Math.cos(angle) * distance);
        const targetY = Math.round(port.y + Math.sin(angle) * distance);

        quest.destination = {
            x: targetX,
            y: targetY,
            name: `Port ${Math.floor(this.seededRandom.random() * 1000)}`
        };
        quest.escort = {
            name: 'Merchant Vessel',
            hull: 50,
            maxHull: 50,
            protected: false
        };
        quest.description = `Escort merchant to ${quest.destination.name} at (${targetX}, ${targetY})`;
        quest.detailedDesc = `A merchant needs safe passage to ${quest.destination.name}. Keep them safe from pirates! If the merchant's ship is destroyed, the quest fails.`;
        quest.timeLimit = Math.floor(distance / 2);

        return quest;
    }

    /**
     * Generate treasure hunt quest
     */
    generateTreasureHuntQuest(quest, port, player) {
        const distance = 60 + Math.floor(this.seededRandom.random() * 120);
        const angle = this.seededRandom.random() * Math.PI * 2;
        const targetX = Math.round(port.x + Math.cos(angle) * distance);
        const targetY = Math.round(port.y + Math.sin(angle) * distance);

        quest.treasure = {
            x: targetX,
            y: targetY,
            value: 150 + Math.floor(this.seededRandom.random() * 200),
            radius: 5 // Search area
        };
        quest.description = `Find treasure near (${targetX}, ${targetY})`;
        quest.detailedDesc = `An old map shows treasure buried near coordinates (${targetX}, ${targetY}). The treasure is worth approximately ${quest.treasure.value}g. Distance: ${distance} tiles.`;
        quest.spawned = false;

        return quest;
    }

    /**
     * Generate exploration quest
     */
    generateExplorationQuest(quest, port, player) {
        const distance = 70 + Math.floor(this.seededRandom.random() * 100);
        const angle = this.seededRandom.random() * Math.PI * 2;
        const targetX = Math.round(port.x + Math.cos(angle) * distance);
        const targetY = Math.round(port.y + Math.sin(angle) * distance);

        quest.exploration = {
            x: targetX,
            y: targetY,
            radius: 10,
            tilesRequired: 20,
            tilesExplored: 0
        };
        quest.description = `Explore uncharted waters at (${targetX}, ${targetY})`;
        quest.detailedDesc = `The Cartographer's Guild needs maps of the region around (${targetX}, ${targetY}). Explore at least ${quest.exploration.tilesRequired} tiles in the area.`;
        quest.timeLimit = Math.floor(distance / 1.5);

        return quest;
    }

    /**
     * Generate rescue quest
     */
    generateRescueQuest(quest, port, player) {
        const distance = 40 + Math.floor(this.seededRandom.random() * 80);
        const angle = this.seededRandom.random() * Math.PI * 2;
        const targetX = Math.round(port.x + Math.cos(angle) * distance);
        const targetY = Math.round(port.y + Math.sin(angle) * distance);

        quest.rescue = {
            x: targetX,
            y: targetY,
            survivors: 3 + Math.floor(this.seededRandom.random() * 5),
            rescued: false
        };
        quest.description = `Rescue ${quest.rescue.survivors} sailors at (${targetX}, ${targetY})`;
        quest.detailedDesc = `A ship was wrecked near (${targetX}, ${targetY}). ${quest.rescue.survivors} sailors are stranded. Rescue them and bring them back to port.`;
        quest.timeLimit = Math.floor(distance / 3); // Urgent!

        return quest;
    }

    /**
     * Accept a quest
     */
    acceptQuest(quest) {
        if (quest.status !== 'available') {
            return {
                success: false,
                message: 'Quest is not available!'
            };
        }

        quest.status = 'active';
        quest.accepted = Date.now();
        this.activeQuests.push(quest);

        return {
            success: true,
            message: `Quest accepted: ${quest.name}`,
            quest: quest
        };
    }

    /**
     * Update quest progress
     * @param {Object} player - Player object
     * @param {Object} entityManager - Entity manager
     * @returns {Array} - Messages about quest updates
     */
    updateQuests(player, entityManager) {
        const messages = [];

        this.activeQuests.forEach(quest => {
            if (quest.status !== 'active') return;

            // Check time limit
            if (quest.timeLimit && quest.turnCount >= quest.timeLimit) {
                quest.status = 'failed';
                messages.push(`❌ Quest failed: ${quest.name} (time limit exceeded)`);
                return;
            }

            quest.turnCount = (quest.turnCount || 0) + 1;

            // Check quest completion based on type
            switch (quest.type) {
                case 'delivery':
                    if (this.checkDeliveryProgress(quest, player)) {
                        messages.push(`📦 Arrived at delivery location! Visit the port to complete the quest.`);
                    }
                    break;

                case 'treasure_hunt':
                    if (this.checkTreasureHuntProgress(quest, player, entityManager)) {
                        messages.push(`💰 Treasure found! Return to the quest giver to claim your reward.`);
                    }
                    break;

                case 'exploration':
                    const explorationUpdate = this.checkExplorationProgress(quest, player);
                    if (explorationUpdate) {
                        messages.push(explorationUpdate);
                    }
                    break;

                case 'rescue':
                    if (this.checkRescueProgress(quest, player)) {
                        messages.push(`⛑️ Survivors rescued! Return them to port.`);
                    }
                    break;
            }
        });

        return messages;
    }

    /**
     * Check delivery quest progress
     */
    checkDeliveryProgress(quest, player) {
        const dx = player.x - quest.destination.x;
        const dy = player.y - quest.destination.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= 3) {
            quest.progress = 100;
            quest.atDestination = true;
            return true;
        }
        return false;
    }

    /**
     * Check treasure hunt progress
     */
    checkTreasureHuntProgress(quest, player, entityManager) {
        const dx = player.x - quest.treasure.x;
        const dy = player.y - quest.treasure.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= quest.treasure.radius && !quest.spawned) {
            // Spawn treasure at location
            const treasure = {
                type: 'treasure',
                x: quest.treasure.x,
                y: quest.treasure.y,
                char: '$',
                color: '#f39c12',
                questTreasure: true,
                questId: quest.id,
                treasureData: {
                    type: 'treasure',
                    name: 'Quest Treasure',
                    value: quest.treasure.value,
                    weight: 3,
                    rarity: 'rare'
                }
            };
            entityManager.addEntity(treasure);
            quest.spawned = true;
            return true;
        }
        return false;
    }

    /**
     * Check exploration progress
     */
    checkExplorationProgress(quest, player) {
        const dx = player.x - quest.exploration.x;
        const dy = player.y - quest.exploration.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= quest.exploration.radius) {
            quest.exploration.tilesExplored++;

            if (quest.exploration.tilesExplored >= quest.exploration.tilesRequired) {
                quest.progress = 100;
                quest.status = 'completed';
                return `🗺️ Exploration complete! Return to port to claim reward.`;
            } else {
                quest.progress = Math.floor((quest.exploration.tilesExplored / quest.exploration.tilesRequired) * 100);
                return `🗺️ Explored ${quest.exploration.tilesExplored}/${quest.exploration.tilesRequired} tiles`;
            }
        }
        return null;
    }

    /**
     * Check rescue progress
     */
    checkRescueProgress(quest, player) {
        const dx = player.x - quest.rescue.x;
        const dy = player.y - quest.rescue.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= 3 && !quest.rescue.rescued) {
            quest.rescue.rescued = true;
            quest.progress = 50; // Halfway - need to return to port
            return true;
        }
        return false;
    }

    /**
     * Complete a quest
     * @param {Object} quest - Quest to complete
     * @param {Object} player - Player object
     * @returns {Object} - Completion result
     */
    completeQuest(quest, player) {
        if (quest.status !== 'active' && quest.status !== 'completed') {
            return {
                success: false,
                message: 'Quest cannot be completed!'
            };
        }

        // Give rewards
        player.addGold(quest.reward);

        // Reputation bonus (if system exists)
        const reputationGain = Math.floor(quest.reward / 20);

        quest.status = 'completed';
        this.completedQuests.push(quest);

        // Remove from active quests
        const index = this.activeQuests.indexOf(quest);
        if (index > -1) {
            this.activeQuests.splice(index, 1);
        }

        return {
            success: true,
            message: `Quest completed: ${quest.name}! Earned ${quest.reward}g`,
            reward: quest.reward,
            reputation: reputationGain
        };
    }

    /**
     * Calculate quest reward based on difficulty and player level
     */
    calculateReward(baseReward, player) {
        // Scale reward based on player's gold (rough approximation of level)
        const scaleFactor = 1 + Math.floor(player.gold / 1000) * 0.2;
        return Math.floor(baseReward * scaleFactor);
    }

    /**
     * Get random cargo type
     */
    getRandomCargo() {
        const cargoTypes = [
            'Rum Barrels',
            'Spices',
            'Silk',
            'Tea',
            'Sugar',
            'Tobacco',
            'Gunpowder',
            'Medicine',
            'Tools',
            'Lumber'
        ];
        return cargoTypes[Math.floor(this.seededRandom.random() * cargoTypes.length)];
    }

    /**
     * Get available quests at port
     * @param {Object} port - Port entity
     * @param {Object} player - Player object
     * @param {number} count - Number of quests to generate
     * @returns {Array} - Array of available quests
     */
    getPortQuests(port, player, count = 3) {
        const quests = [];
        for (let i = 0; i < count; i++) {
            quests.push(this.generateQuest(port, player));
        }
        return quests;
    }

    /**
     * Get active quest summary
     */
    getActiveQuestsSummary() {
        return this.activeQuests.map(quest => ({
            id: quest.id,
            name: quest.name,
            description: quest.description,
            progress: quest.progress,
            timeRemaining: quest.timeLimit ? quest.timeLimit - (quest.turnCount || 0) : null
        }));
    }

    /**
     * Get quest by ID
     */
    getQuest(questId) {
        return this.activeQuests.find(q => q.id === questId) ||
               this.completedQuests.find(q => q.id === questId);
    }

    /**
     * Abandon quest
     */
    abandonQuest(questId) {
        const index = this.activeQuests.findIndex(q => q.id === questId);
        if (index > -1) {
            const quest = this.activeQuests[index];
            quest.status = 'abandoned';
            this.activeQuests.splice(index, 1);
            return {
                success: true,
                message: `Quest abandoned: ${quest.name}`
            };
        }
        return {
            success: false,
            message: 'Quest not found!'
        };
    }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestManager;
}
