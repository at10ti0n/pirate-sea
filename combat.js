// Naval Combat System
class CombatManager {
    constructor(seededRandom) {
        this.seededRandom = seededRandom;
        this.activeCombats = new Map(); // Track ongoing combats

        // Enemy ship types
        this.enemyTypes = {
            merchant: {
                name: 'Merchant Ship',
                char: 'M',
                color: '#95a5a6',
                hull: 40,
                damage: 5,
                loot: { min: 50, max: 150 },
                aggressive: false,
                speed: 1
            },
            pirate_sloop: {
                name: 'Pirate Sloop',
                char: 'p',
                color: '#e74c3c',
                hull: 60,
                damage: 15,
                loot: { min: 30, max: 80 },
                aggressive: true,
                speed: 1.5
            },
            pirate_brig: {
                name: 'Pirate Brigantine',
                char: 'P',
                color: '#c0392b',
                hull: 100,
                damage: 25,
                loot: { min: 80, max: 200 },
                aggressive: true,
                speed: 1.3
            },
            navy_patrol: {
                name: 'Navy Patrol',
                char: 'N',
                color: '#3498db',
                hull: 80,
                damage: 20,
                loot: { min: 20, max: 50 },
                aggressive: false, // Only attacks if player is wanted
                speed: 1.4
            },
            pirate_flagship: {
                name: 'Pirate Flagship',
                char: '☠',
                color: '#8e44ad',
                hull: 150,
                damage: 40,
                loot: { min: 200, max: 500 },
                aggressive: true,
                speed: 1.2
            }
        };
    }

    /**
     * Spawn enemy ships in the world
     * @param {Object} entityManager - Entity manager
     * @param {number} centerX - Center X position
     * @param {number} centerY - Center Y position
     * @param {number} radius - Spawn radius
     * @param {number} count - Number of enemies to spawn
     */
    spawnEnemyShips(entityManager, centerX, centerY, radius = 60, count = 10) {
        const oceanTiles = [];

        // Find ocean tiles
        for (let y = centerY - radius; y < centerY + radius; y++) {
            for (let x = centerX - radius; x < centerX + radius; x++) {
                const tile = entityManager.mapGenerator.getBiomeAt(x, y);
                if (tile && tile.biome === 'ocean') {
                    if (!entityManager.isPositionOccupied(x, y)) {
                        oceanTiles.push({ x, y });
                    }
                }
            }
        }

        let spawned = 0;
        for (let i = 0; i < count && oceanTiles.length > 0; i++) {
            const randomIndex = Math.floor(this.seededRandom.random() * oceanTiles.length);
            const tile = oceanTiles[randomIndex];

            // Determine enemy type based on distance from center (difficulty scaling)
            const distance = Math.sqrt((tile.x - centerX) ** 2 + (tile.y - centerY) ** 2);
            const enemyType = this.selectEnemyType(distance);

            const enemyData = this.enemyTypes[enemyType];
            const enemy = {
                type: 'enemy_ship',
                enemyType: enemyType,
                x: tile.x,
                y: tile.y,
                char: enemyData.char,
                color: enemyData.color,
                hull: enemyData.hull,
                maxHull: enemyData.hull,
                damage: enemyData.damage,
                loot: enemyData.loot,
                aggressive: enemyData.aggressive,
                speed: enemyData.speed,
                name: enemyData.name,
                lastMove: Date.now(),
                targetX: null,
                targetY: null,
                chasing: false
            };

            entityManager.addEntity(enemy);
            oceanTiles.splice(randomIndex, 1);
            spawned++;
        }

        console.log(`Spawned ${spawned} enemy ships`);
        return spawned;
    }

    /**
     * Select enemy type based on distance (difficulty scaling)
     */
    selectEnemyType(distance) {
        if (distance < 30) {
            // Close to safe areas - weak enemies
            return this.seededRandom.random() < 0.7 ? 'merchant' : 'pirate_sloop';
        } else if (distance < 60) {
            // Medium distance - mixed threats
            const roll = this.seededRandom.random();
            if (roll < 0.3) return 'merchant';
            if (roll < 0.7) return 'pirate_sloop';
            return 'pirate_brig';
        } else if (distance < 100) {
            // Far from safe areas - dangerous
            const roll = this.seededRandom.random();
            if (roll < 0.2) return 'pirate_sloop';
            if (roll < 0.7) return 'pirate_brig';
            return 'navy_patrol';
        } else {
            // Very far - deadly
            const roll = this.seededRandom.random();
            if (roll < 0.4) return 'pirate_brig';
            if (roll < 0.8) return 'navy_patrol';
            return 'pirate_flagship';
        }
    }

    /**
     * Update enemy AI (called each turn)
     * @param {Object} entityManager - Entity manager
     * @param {Object} player - Player object
     */
    updateEnemyAI(entityManager, player) {
        const enemies = entityManager.getEntitiesByType('enemy_ship');
        const messages = [];

        enemies.forEach(enemy => {
            // Skip if player is not on ship
            if (player.mode !== 'ship') return;

            // Check distance to player
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Aggressive enemies chase player if within detection range
            if (enemy.aggressive && distance < 15) {
                enemy.chasing = true;
                enemy.targetX = player.x;
                enemy.targetY = player.y;

                // Move towards player
                if (Date.now() - enemy.lastMove > 1000 / enemy.speed) {
                    this.moveEnemyTowards(enemy, player.x, player.y, entityManager);
                    enemy.lastMove = Date.now();

                    if (distance < 10 && !enemy.warnedPlayer) {
                        messages.push(`⚠️ ${enemy.name} spotted! They're pursuing!`);
                        enemy.warnedPlayer = true;
                    }
                }

                // Initiate combat if close enough
                if (distance <= 2) {
                    const combatKey = `${player.x},${player.y}`;
                    if (!this.activeCombats.has(combatKey)) {
                        messages.push(`💥 ${enemy.name} engages in combat!`);
                        this.startCombat(player, enemy);
                    }
                }
            } else {
                enemy.chasing = false;
                enemy.warnedPlayer = false;

                // Patrol - random movement
                if (Date.now() - enemy.lastMove > 2000) {
                    this.moveEnemyRandom(enemy, entityManager);
                    enemy.lastMove = Date.now();
                }
            }
        });

        return messages;
    }

    /**
     * Move enemy towards a target
     */
    moveEnemyTowards(enemy, targetX, targetY, entityManager) {
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;

        // Simple pathfinding - move closer on dominant axis
        let moveX = 0;
        let moveY = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else {
            moveY = dy > 0 ? 1 : -1;
        }

        const newX = enemy.x + moveX;
        const newY = enemy.y + moveY;

        // Check if new position is valid ocean and not occupied
        const tile = entityManager.mapGenerator.getBiomeAt(newX, newY);
        if (tile && tile.biome === 'ocean' && !entityManager.isPositionOccupied(newX, newY)) {
            entityManager.removeEntity(enemy.x, enemy.y);
            enemy.x = newX;
            enemy.y = newY;
            entityManager.addEntity(enemy);
        }
    }

    /**
     * Move enemy randomly (patrol)
     */
    moveEnemyRandom(enemy, entityManager) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        const dir = directions[Math.floor(this.seededRandom.random() * directions.length)];
        const newX = enemy.x + dir.dx;
        const newY = enemy.y + dir.dy;

        const tile = entityManager.mapGenerator.getBiomeAt(newX, newY);
        if (tile && tile.biome === 'ocean' && !entityManager.isPositionOccupied(newX, newY)) {
            entityManager.removeEntity(enemy.x, enemy.y);
            enemy.x = newX;
            enemy.y = newY;
            entityManager.addEntity(enemy);
        }
    }

    /**
     * Start combat between player and enemy
     */
    startCombat(player, enemy) {
        const combatKey = `${player.x},${player.y}`;
        this.activeCombats.set(combatKey, {
            player: player,
            enemy: enemy,
            turn: 0,
            playerFled: false,
            started: Date.now()
        });
    }

    /**
     * Execute combat turn
     * @param {Object} player - Player object
     * @param {Object} enemy - Enemy ship
     * @param {string} action - Player action ('attack', 'defend', 'flee', 'board')
     * @param {Object} crewBonuses - Crew combat bonuses
     * @returns {Object} - Combat result
     */
    executeCombatTurn(player, enemy, action = 'attack', crewBonuses = null) {
        const messages = [];
        let combatOver = false;
        let playerVictory = false;

        // Player action
        if (action === 'attack') {
            // Calculate player damage
            const baseDamage = this.getShipDamage(player.currentShip);
            const crewBonus = crewBonuses ? crewBonuses.combatBonus : 0;
            const totalDamage = baseDamage + Math.floor(baseDamage * crewBonus / 100);
            const actualDamage = Math.floor(totalDamage * (0.8 + this.seededRandom.random() * 0.4)); // 80-120%

            enemy.hull -= actualDamage;
            messages.push(`🎯 You fire cannons! ${actualDamage} damage to ${enemy.name}`);

            if (enemy.hull <= 0) {
                combatOver = true;
                playerVictory = true;
                messages.push(`💀 ${enemy.name} destroyed!`);
            }
        } else if (action === 'defend') {
            messages.push(`🛡️ You brace for impact! Damage reduced this turn.`);
        } else if (action === 'flee') {
            const fleeChance = 0.5 + (player.currentShip === 'sloop' ? 0.2 : 0);
            if (this.seededRandom.random() < fleeChance) {
                combatOver = true;
                messages.push(`💨 You successfully fled from ${enemy.name}!`);
                return {
                    combatOver: true,
                    fled: true,
                    messages: messages
                };
            } else {
                messages.push(`⚠️ Failed to flee! ${enemy.name} cuts off your escape!`);
            }
        } else if (action === 'board') {
            // Boarding action - high risk, high reward
            const boardingChance = 0.3 + (crewBonuses ? crewBonuses.combat / 200 : 0);
            if (this.seededRandom.random() < boardingChance) {
                combatOver = true;
                playerVictory = true;
                messages.push(`⚔️ Boarding successful! You capture ${enemy.name}!`);
                return {
                    combatOver: true,
                    victory: true,
                    boarded: true,
                    loot: this.generateLoot(enemy, true), // Bonus loot for boarding
                    messages: messages
                };
            } else {
                messages.push(`⚔️ Boarding failed! Your crew is repelled!`);
                // Take extra damage for failed boarding
                const boardingDamage = Math.floor(enemy.damage * 1.5);
                player.shipHull -= boardingDamage;
                messages.push(`💥 Counter-attack! ${boardingDamage} damage to your ship!`);
            }
        }

        // Enemy action (if combat not over and player didn't flee)
        if (!combatOver) {
            const enemyDamage = Math.floor(enemy.damage * (0.8 + this.seededRandom.random() * 0.4));
            const actualDamage = action === 'defend' ? Math.floor(enemyDamage * 0.5) : enemyDamage;

            player.shipHull -= actualDamage;
            messages.push(`💥 ${enemy.name} fires! ${actualDamage} damage to your ship!`);

            if (player.shipHull <= 0) {
                combatOver = true;
                messages.push(`💀 YOUR SHIP IS DESTROYED!`);
                return {
                    combatOver: true,
                    victory: false,
                    shipDestroyed: true,
                    messages: messages
                };
            }
        }

        // Check if combat over
        if (combatOver && playerVictory) {
            const loot = this.generateLoot(enemy);
            return {
                combatOver: true,
                victory: true,
                loot: loot,
                messages: messages
            };
        }

        return {
            combatOver: combatOver,
            messages: messages,
            playerHull: player.shipHull,
            enemyHull: enemy.hull
        };
    }

    /**
     * Get base ship damage
     */
    getShipDamage(shipType) {
        const damages = {
            dinghy: 10,
            sloop: 20,
            brigantine: 35,
            frigate: 50,
            galleon: 70
        };
        return damages[shipType] || 10;
    }

    /**
     * Generate loot from defeated enemy
     */
    generateLoot(enemy, bonusLoot = false) {
        const multiplier = bonusLoot ? 1.5 : 1.0;
        const goldAmount = Math.floor((enemy.loot.min + this.seededRandom.random() * (enemy.loot.max - enemy.loot.min)) * multiplier);

        const loot = {
            gold: goldAmount,
            items: []
        };

        // Chance for special items
        if (this.seededRandom.random() < 0.3) {
            loot.items.push({
                type: 'treasure',
                name: 'Plundered Goods',
                value: Math.floor(goldAmount * 0.5),
                weight: 3,
                rarity: 'uncommon'
            });
        }

        // Rare chance for map or special item
        if (this.seededRandom.random() < 0.1) {
            loot.items.push({
                type: 'treasure',
                name: 'Captured Sea Chart',
                value: 100,
                weight: 1,
                rarity: 'rare'
            });
        }

        return loot;
    }

    /**
     * End combat and clean up
     */
    endCombat(combatKey, entityManager, enemy) {
        this.activeCombats.delete(combatKey);

        // Remove enemy ship from map
        if (enemy) {
            entityManager.removeEntity(enemy.x, enemy.y);
        }
    }

    /**
     * Get combat status
     */
    getCombatStatus(player) {
        const combatKey = `${player.x},${player.y}`;
        return this.activeCombats.get(combatKey) || null;
    }

    /**
     * Check if player is in combat
     */
    isInCombat(player) {
        const combatKey = `${player.x},${player.y}`;
        return this.activeCombats.has(combatKey);
    }

    /**
     * Get nearby enemies
     */
    getNearbyEnemies(entityManager, x, y, radius = 15) {
        const enemies = entityManager.getEntitiesByType('enemy_ship');
        return enemies.filter(enemy => {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        }).map(enemy => {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            return {
                enemy: enemy,
                distance: Math.sqrt(dx * dx + dy * dy),
                direction: this.getDirection(dx, dy)
            };
        }).sort((a, b) => a.distance - b.distance);
    }

    /**
     * Get direction from offset
     */
    getDirection(dx, dy) {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        if (angle >= -45 && angle < 45) return 'E';
        if (angle >= 45 && angle < 135) return 'S';
        if (angle >= -135 && angle < -45) return 'N';
        return 'W';
    }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatManager;
}
