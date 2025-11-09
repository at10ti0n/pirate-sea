// Crew Management System
class CrewManager {
    constructor(seededRandom) {
        this.seededRandom = seededRandom;

        // Crew skill types
        this.skillTypes = ['navigation', 'combat', 'repair', 'sailing'];

        // Crew member name pool (procedurally expanded)
        this.firstNames = ['Jack', 'William', 'Anne', 'Mary', 'Edward', 'Charles', 'Henry', 'James', 'Thomas', 'Robert'];
        this.lastNames = ['Blackbeard', 'Bones', 'Flint', 'Morgan', 'Kidd', 'Drake', 'Rackham', 'Teach', 'Vane', 'Roberts'];
    }

    /**
     * Initialize crew for a new ship
     * @param {string} shipType - Type of ship
     * @returns {Object} - Crew data
     */
    initializeCrew(shipType = 'dinghy') {
        const crewSizes = {
            dinghy: { min: 1, max: 3 },
            sloop: { min: 3, max: 8 },
            brigantine: { min: 8, max: 15 },
            frigate: { min: 15, max: 25 },
            galleon: { min: 25, max: 40 }
        };

        const size = crewSizes[shipType] || crewSizes.dinghy;
        const startingCrew = Math.floor((size.min + size.max) / 2);

        return {
            members: this.generateCrewMembers(startingCrew),
            maxSize: size.max,
            morale: 75, // 0-100
            wages: this.calculateWages(startingCrew),
            lastPaid: Date.now(),
            daysSincePay: 0
        };
    }

    /**
     * Generate individual crew members
     * @param {number} count - Number of crew to generate
     * @returns {Array} - Array of crew member objects
     */
    generateCrewMembers(count) {
        const members = [];

        for (let i = 0; i < count; i++) {
            const member = {
                id: this.generateId(),
                name: this.generateName(),
                skills: this.generateSkills(),
                morale: 70 + Math.floor(this.seededRandom.random() * 30),
                experience: Math.floor(this.seededRandom.random() * 100),
                hired: Date.now()
            };
            members.push(member);
        }

        return members;
    }

    /**
     * Generate a random crew member name
     */
    generateName() {
        const first = this.firstNames[Math.floor(this.seededRandom.random() * this.firstNames.length)];
        const last = this.lastNames[Math.floor(this.seededRandom.random() * this.lastNames.length)];
        return `${first} ${last}`;
    }

    /**
     * Generate random skills for a crew member
     */
    generateSkills() {
        const skills = {};
        this.skillTypes.forEach(skill => {
            skills[skill] = Math.floor(this.seededRandom.random() * 50) + 25; // 25-75 starting skill
        });
        return skills;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `crew_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }

    /**
     * Calculate total crew wages
     * @param {number} crewSize - Number of crew members
     * @returns {number} - Gold per day
     */
    calculateWages(crewSize) {
        return crewSize * 2; // 2 gold per crew member per day
    }

    /**
     * Hire a new crew member at port
     * @param {Object} crew - Current crew data
     * @param {number} playerGold - Player's current gold
     * @param {string} portTier - Port tier (affects crew quality)
     * @returns {Object} - Result of hiring
     */
    hireCrew(crew, playerGold, portTier = 'small') {
        if (crew.members.length >= crew.maxSize) {
            return {
                success: false,
                message: 'Crew is already at maximum capacity!'
            };
        }

        // Hiring cost based on port tier
        const hiringCosts = {
            small: 20,
            medium: 30,
            large: 50,
            capital: 80
        };

        const cost = hiringCosts[portTier] || 20;

        if (playerGold < cost) {
            return {
                success: false,
                message: `Not enough gold to hire crew! Need ${cost}g, have ${playerGold}g`
            };
        }

        // Generate new crew member with better stats at better ports
        const qualityBonus = {
            small: 0,
            medium: 10,
            large: 20,
            capital: 30
        }[portTier] || 0;

        const newMember = {
            id: this.generateId(),
            name: this.generateName(),
            skills: this.generateSkills(),
            morale: 80 + Math.floor(this.seededRandom.random() * 20),
            experience: qualityBonus + Math.floor(this.seededRandom.random() * 50),
            hired: Date.now()
        };

        // Apply quality bonus to skills
        Object.keys(newMember.skills).forEach(skill => {
            newMember.skills[skill] = Math.min(100, newMember.skills[skill] + qualityBonus);
        });

        crew.members.push(newMember);
        crew.wages = this.calculateWages(crew.members.length);

        return {
            success: true,
            message: `Hired ${newMember.name} for ${cost}g! New crew size: ${crew.members.length}/${crew.maxSize}`,
            member: newMember,
            cost: cost
        };
    }

    /**
     * Pay crew wages
     * @param {Object} crew - Crew data
     * @param {number} playerGold - Player's current gold
     * @returns {Object} - Payment result
     */
    payWages(crew, playerGold) {
        const totalWages = crew.wages;

        if (playerGold < totalWages) {
            // Can't pay - morale decreases significantly
            crew.morale = Math.max(0, crew.morale - 20);
            crew.daysSincePay++;

            return {
                success: false,
                message: `Cannot pay crew wages (${totalWages}g needed)! Morale drops to ${crew.morale}%`,
                moraleChange: -20
            };
        }

        // Pay crew
        crew.lastPaid = Date.now();
        crew.daysSincePay = 0;
        crew.morale = Math.min(100, crew.morale + 10); // Boost morale when paid

        return {
            success: true,
            message: `Paid crew ${totalWages}g. Morale increased to ${crew.morale}%`,
            cost: totalWages,
            moraleChange: 10
        };
    }

    /**
     * Update crew morale based on conditions
     * @param {Object} crew - Crew data
     * @param {Object} conditions - Ship conditions (food, water, combat, etc.)
     * @returns {Object} - Morale update result
     */
    updateMorale(crew, conditions = {}) {
        let moraleChange = 0;
        const messages = [];

        // Food and water
        if (conditions.hasFood === false) {
            moraleChange -= 10;
            messages.push('No food: -10 morale');
        }
        if (conditions.hasWater === false) {
            moraleChange -= 15;
            messages.push('No water: -15 morale');
        }

        // Wages
        if (crew.daysSincePay > 7) {
            moraleChange -= 20;
            messages.push('Wages overdue: -20 morale');
        } else if (crew.daysSincePay > 3) {
            moraleChange -= 5;
            messages.push('Wages due soon: -5 morale');
        }

        // Combat
        if (conditions.wonCombat) {
            moraleChange += 15;
            messages.push('Victory in combat: +15 morale');
        }
        if (conditions.lostCombat) {
            moraleChange -= 25;
            messages.push('Defeat in combat: -25 morale');
        }

        // Ship condition
        if (conditions.shipDamaged) {
            moraleChange -= 5;
            messages.push('Ship damaged: -5 morale');
        }

        // Rest at port
        if (conditions.atPort) {
            moraleChange += 5;
            messages.push('Resting at port: +5 morale');
        }

        // Apply morale change
        crew.morale = Math.max(0, Math.min(100, crew.morale + moraleChange));

        // Update individual crew member morale
        crew.members.forEach(member => {
            member.morale = Math.max(0, Math.min(100, member.morale + moraleChange));
        });

        return {
            moraleChange: moraleChange,
            newMorale: crew.morale,
            messages: messages,
            mutinyRisk: this.checkMutinyRisk(crew)
        };
    }

    /**
     * Check if crew might mutiny
     * @param {Object} crew - Crew data
     * @returns {boolean} - True if mutiny is imminent
     */
    checkMutinyRisk(crew) {
        if (crew.morale < 20) {
            return 'imminent';
        } else if (crew.morale < 40) {
            return 'high';
        } else if (crew.morale < 60) {
            return 'moderate';
        }
        return 'low';
    }

    /**
     * Handle potential mutiny
     * @param {Object} crew - Crew data
     * @returns {Object} - Mutiny result
     */
    attemptMutiny(crew) {
        const risk = this.checkMutinyRisk(crew);

        if (risk === 'imminent' && this.seededRandom.random() < 0.5) {
            // Mutiny occurs!
            return {
                mutiny: true,
                message: '💀 MUTINY! Your crew has abandoned you!',
                crewLost: crew.members.length
            };
        } else if (risk === 'high' && this.seededRandom.random() < 0.2) {
            // Some crew desert
            const deserted = Math.floor(crew.members.length * 0.3);
            crew.members = crew.members.slice(deserted);
            crew.wages = this.calculateWages(crew.members.length);

            return {
                mutiny: false,
                deserted: deserted,
                message: `⚠️ ${deserted} crew members deserted due to low morale!`
            };
        }

        return {
            mutiny: false,
            deserted: 0
        };
    }

    /**
     * Get crew bonuses based on skills
     * @param {Object} crew - Crew data
     * @returns {Object} - Bonuses to ship stats
     */
    getCrewBonuses(crew) {
        if (!crew.members || crew.members.length === 0) {
            return {
                navigation: 0,
                combat: 0,
                repair: 0,
                sailing: 0,
                speedBonus: 0,
                combatBonus: 0
            };
        }

        // Calculate average skills
        const avgSkills = {
            navigation: 0,
            combat: 0,
            repair: 0,
            sailing: 0
        };

        crew.members.forEach(member => {
            Object.keys(avgSkills).forEach(skill => {
                avgSkills[skill] += member.skills[skill] || 0;
            });
        });

        Object.keys(avgSkills).forEach(skill => {
            avgSkills[skill] = Math.floor(avgSkills[skill] / crew.members.length);
        });

        // Morale affects effectiveness
        const moraleMultiplier = crew.morale / 100;

        // Calculate bonuses
        return {
            navigation: Math.floor(avgSkills.navigation * moraleMultiplier),
            combat: Math.floor(avgSkills.combat * moraleMultiplier),
            repair: Math.floor(avgSkills.repair * moraleMultiplier),
            sailing: Math.floor(avgSkills.sailing * moraleMultiplier),
            speedBonus: Math.floor((avgSkills.sailing / 100) * moraleMultiplier * 10), // 0-10% speed
            combatBonus: Math.floor((avgSkills.combat / 100) * moraleMultiplier * 20) // 0-20% combat
        };
    }

    /**
     * Train crew skills (at port or during voyage)
     * @param {Object} crew - Crew data
     * @param {string} skill - Skill to train
     * @param {number} cost - Cost in gold
     * @returns {Object} - Training result
     */
    trainCrew(crew, skill, cost) {
        if (!this.skillTypes.includes(skill)) {
            return {
                success: false,
                message: `Invalid skill type! Choose from: ${this.skillTypes.join(', ')}`
            };
        }

        // Improve all crew members in this skill
        let totalImprovement = 0;
        crew.members.forEach(member => {
            const current = member.skills[skill] || 0;
            const improvement = Math.floor(5 + this.seededRandom.random() * 10); // 5-15 points
            member.skills[skill] = Math.min(100, current + improvement);
            totalImprovement += improvement;
        });

        const avgImprovement = Math.floor(totalImprovement / crew.members.length);

        return {
            success: true,
            message: `Trained ${crew.members.length} crew in ${skill}! Average improvement: +${avgImprovement}`,
            skill: skill,
            improvement: avgImprovement
        };
    }

    /**
     * Get crew status summary
     * @param {Object} crew - Crew data
     * @returns {Object} - Status information
     */
    getCrewStatus(crew) {
        const bonuses = this.getCrewBonuses(crew);
        const mutinyRisk = this.checkMutinyRisk(crew);

        return {
            size: crew.members.length,
            maxSize: crew.maxSize,
            morale: crew.morale,
            moraleStatus: this.getMoraleStatus(crew.morale),
            wages: crew.wages,
            daysSincePay: crew.daysSincePay,
            mutinyRisk: mutinyRisk,
            bonuses: bonuses,
            avgSkills: {
                navigation: Math.floor(crew.members.reduce((sum, m) => sum + (m.skills.navigation || 0), 0) / crew.members.length),
                combat: Math.floor(crew.members.reduce((sum, m) => sum + (m.skills.combat || 0), 0) / crew.members.length),
                repair: Math.floor(crew.members.reduce((sum, m) => sum + (m.skills.repair || 0), 0) / crew.members.length),
                sailing: Math.floor(crew.members.reduce((sum, m) => sum + (m.skills.sailing || 0), 0) / crew.members.length)
            }
        };
    }

    /**
     * Get morale status text
     */
    getMoraleStatus(morale) {
        if (morale >= 80) return 'Excellent';
        if (morale >= 60) return 'Good';
        if (morale >= 40) return 'Fair';
        if (morale >= 20) return 'Poor';
        return 'Mutinous';
    }

    /**
     * Consume crew supplies (food/water per day)
     * @param {Object} crew - Crew data
     * @returns {Object} - Supply consumption
     */
    getSupplyConsumption(crew) {
        const crewSize = crew.members.length;
        return {
            food: crewSize * 1, // 1 food per crew per day
            water: crewSize * 1, // 1 water per crew per day
            gold: crew.wages // Daily wages
        };
    }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrewManager;
}
