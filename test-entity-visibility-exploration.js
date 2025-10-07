#!/usr/bin/env node

// Test for entity visibility changes during exploration
const TerminalGame = require('./terminal-game');

class EntityVisibilityExplorationTest {
    constructor() {
        this.testResults = [];
        this.game = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(logEntry);
        this.testResults.push({ timestamp, type, message });
    }

    async runTest() {
        this.log('Starting entity visibility exploration test');
        
        try {
            // Initialize game with fixed seed
            this.game = new TerminalGame(12345);
            this.game.initialize();
            
            await this.sleep(100);
            
            // Add some test entities at known positions
            await this.setupTestEntities();
            
            // Test entity visibility during exploration
            await this.testEntityVisibilityDuringExploration();
            
            // Test ship-specific visibility rules
            await this.testShipVisibilityRules();
            
            // Test entity rendering logic
            await this.testEntityRenderingLogic();
            
            this.generateReport();
            
        } catch (error) {
            this.log(`Test failed with error: ${error.message}`, 'error');
            console.error(error);
        } finally {
            if (this.game && this.game.rl) {
                this.game.rl.close();
            }
        }
    }

    async setupTestEntities() {
        this.log('=== Setting Up Test Entities ===');
        
        const playerX = this.game.player.x;
        const playerY = this.game.player.y;
        
        // Add entities at various distances from the player
        const testEntities = [
            { type: 'treasure', x: playerX + 3, y: playerY + 2, char: '$', color: '\x1b[93m' },
            { type: 'treasure', x: playerX - 4, y: playerY + 1, char: '$', color: '\x1b[93m' },
            { type: 'treasure', x: playerX + 1, y: playerY - 5, char: '$', color: '\x1b[93m' },
            { type: 'port', x: playerX + 6, y: playerY + 3, char: 'P', color: '\x1b[31m' },
            { type: 'port', x: playerX - 2, y: playerY - 3, char: 'P', color: '\x1b[31m' }
        ];
        
        // Add entities to the game
        for (const entity of testEntities) {
            // Check if the position is valid (on land for ports, any for treasures)
            const tile = this.game.mapGenerator.getBiomeAt(entity.x, entity.y);
            if (tile) {
                if (entity.type === 'port' && tile.biome === 'ocean') {
                    // Skip ports in ocean
                    this.log(`Skipping port at (${entity.x}, ${entity.y}) - in ocean`);
                    continue;
                }
                
                this.game.entityManager.addEntity(entity);
                this.log(`Added ${entity.type} at (${entity.x}, ${entity.y})`);
            }
        }
        
        const totalEntities = this.game.entityManager.getAllEntities().length;
        this.log(`Total entities in game: ${totalEntities}`);
    }

    async testEntityVisibilityDuringExploration() {
        this.log('=== Testing Entity Visibility During Exploration ===');
        
        if (!this.game.fogOfWar) {
            this.log('Fog of war not initialized - skipping exploration test', 'warning');
            return;
        }

        const playerX = this.game.player.x;
        const playerY = this.game.player.y;
        
        // Record initial state
        this.game.fogOfWar.updateVisibility(playerX, playerY);
        const initialVisibleEntities = this.getVisibleEntities();
        const initialExploredEntities = this.getExploredEntities();
        
        this.log(`Initial visible entities: ${initialVisibleEntities.length}`);
        this.log(`Initial explored entities: ${initialExploredEntities.length}`);
        
        // Move in a pattern to explore different areas
        const explorationPattern = [
            { dx: 2, dy: 0, name: 'east' },
            { dx: 0, dy: 2, name: 'south' },
            { dx: -4, dy: 0, name: 'west' },
            { dx: 0, dy: -4, name: 'north' },
            { dx: 3, dy: 1, name: 'northeast' },
            { dx: -2, dy: 2, name: 'southwest' }
        ];
        
        let entitiesDiscovered = 0;
        let entitiesLost = 0;
        let entitiesRemainExplored = 0;
        
        for (const move of explorationPattern) {
            const newX = this.game.player.x + move.dx;
            const newY = this.game.player.y + move.dy;
            
            // Check if movement is possible
            if (this.game.player.canMoveTo(newX, newY)) {
                const preVisibleEntities = this.getVisibleEntities();
                
                // Move player
                this.game.player.move(move.dx, move.dy);
                this.game.fogOfWar.updateVisibility(this.game.player.x, this.game.player.y);
                
                const postVisibleEntities = this.getVisibleEntities();
                const postExploredEntities = this.getExploredEntities();
                
                // Check for newly discovered entities
                const newlyVisible = postVisibleEntities.filter(entity =>
                    !preVisibleEntities.some(pre => pre.x === entity.x && pre.y === entity.y)
                );
                
                // Check for entities that lost visibility but remain explored
                const lostVisibility = preVisibleEntities.filter(entity =>
                    !postVisibleEntities.some(post => post.x === entity.x && post.y === entity.y)
                );
                
                const remainExplored = lostVisibility.filter(entity =>
                    postExploredEntities.some(explored => explored.x === entity.x && explored.y === entity.y)
                );
                
                if (newlyVisible.length > 0) {
                    entitiesDiscovered += newlyVisible.length;
                    this.log(`Moved ${move.name} to (${this.game.player.x}, ${this.game.player.y}) - discovered ${newlyVisible.length} entities`);
                    for (const entity of newlyVisible) {
                        this.log(`  Discovered ${entity.type} at (${entity.x}, ${entity.y})`);
                    }
                }
                
                if (lostVisibility.length > 0) {
                    entitiesLost += lostVisibility.length;
                    this.log(`Lost visibility of ${lostVisibility.length} entities`);
                }
                
                if (remainExplored.length > 0) {
                    entitiesRemainExplored += remainExplored.length;
                    this.log(`${remainExplored.length} entities remain in explored areas`);
                }
                
                this.log(`Current state: ${postVisibleEntities.length} visible, ${postExploredEntities.length} explored`);
                
            } else {
                this.log(`Cannot move ${move.name} - blocked by terrain`);
            }
            
            await this.sleep(50);
        }
        
        this.log(`Total entities discovered during exploration: ${entitiesDiscovered}`);
        this.log(`Total entities that lost visibility: ${entitiesLost}`);
        this.log(`Total entities remaining in explored areas: ${entitiesRemainExplored}`);
        
        if (entitiesDiscovered > 0) {
            this.log('✓ Entity visibility exploration test PASSED', 'success');
        } else {
            this.log('⚠ Entity visibility exploration test INCONCLUSIVE - no entities discovered', 'warning');
        }
    }

    async testShipVisibilityRules() {
        this.log('=== Testing Ship-Specific Visibility Rules ===');
        
        if (!this.game.fogOfWar) {
            this.log('Fog of war not initialized - skipping ship visibility test', 'warning');
            return;
        }

        // Find existing ships or add test ships
        const allEntities = this.game.entityManager.getAllEntities();
        let ships = allEntities.filter(entity => entity.type === 'ship');
        
        if (ships.length === 0) {
            // Add test ships at various positions
            const playerX = this.game.player.x;
            const playerY = this.game.player.y;
            
            const testShips = [
                { type: 'ship', x: playerX + 5, y: playerY + 2, char: 'S', color: '\x1b[33m' },
                { type: 'ship', x: playerX - 3, y: playerY - 4, char: 'S', color: '\x1b[33m' }
            ];
            
            for (const ship of testShips) {
                const tile = this.game.mapGenerator.getBiomeAt(ship.x, ship.y);
                if (tile && tile.biome === 'ocean') {
                    this.game.entityManager.addEntity(ship);
                    this.log(`Added test ship at (${ship.x}, ${ship.y})`);
                }
            }
            
            ships = this.game.entityManager.getAllEntities().filter(entity => entity.type === 'ship');
        }
        
        this.log(`Testing ${ships.length} ships for visibility rules`);
        
        // Test ship visibility rules
        for (const ship of ships) {
            const isVisible = this.game.fogOfWar.isVisible(ship.x, ship.y);
            const isExplored = this.game.fogOfWar.isExplored(ship.x, ship.y);
            const shouldRender = this.game.fogOfWar.shouldRenderEntity(ship.x, ship.y, 'ship');
            
            this.log(`Ship at (${ship.x}, ${ship.y}): visible=${isVisible}, explored=${isExplored}, shouldRender=${shouldRender}`);
            
            // Ships should render in explored areas (special rule)
            const expectedRender = isExplored;
            if (shouldRender === expectedRender) {
                this.log(`  ✓ Ship visibility rule correct`, 'success');
            } else {
                this.log(`  ✗ Ship visibility rule incorrect: expected ${expectedRender}, got ${shouldRender}`, 'error');
            }
        }
        
        // Test by moving away from ships and back
        if (ships.length > 0) {
            const testShip = ships[0];
            this.log(`Testing ship persistence with ship at (${testShip.x}, ${testShip.y})`);
            
            // Move to ship to make it visible/explored
            await this.moveTowardsPosition(testShip.x, testShip.y);
            
            // Update visibility and check ship state
            this.game.fogOfWar.updateVisibility(this.game.player.x, this.game.player.y);
            const shipExplored = this.game.fogOfWar.isExplored(testShip.x, testShip.y);
            
            if (shipExplored) {
                this.log(`Ship area explored, moving away to test persistence`);
                
                // Move away from ship
                await this.moveAwayFromPosition(testShip.x, testShip.y);
                
                // Check if ship should still render in explored area
                this.game.fogOfWar.updateVisibility(this.game.player.x, this.game.player.y);
                const shipStillVisible = this.game.fogOfWar.isVisible(testShip.x, testShip.y);
                const shipStillExplored = this.game.fogOfWar.isExplored(testShip.x, testShip.y);
                const shipShouldRender = this.game.fogOfWar.shouldRenderEntity(testShip.x, testShip.y, 'ship');
                
                this.log(`After moving away: visible=${shipStillVisible}, explored=${shipStillExplored}, shouldRender=${shipShouldRender}`);
                
                if (!shipStillVisible && shipStillExplored && shipShouldRender) {
                    this.log('✓ Ship persistence in explored areas PASSED', 'success');
                } else {
                    this.log('✗ Ship persistence in explored areas FAILED', 'error');
                }
            }
        }
    }

    async testEntityRenderingLogic() {
        this.log('=== Testing Entity Rendering Logic ===');
        
        if (!this.game.fogOfWar) {
            this.log('Fog of war not initialized - skipping rendering logic test', 'warning');
            return;
        }

        const allEntities = this.game.entityManager.getAllEntities();
        this.log(`Testing rendering logic for ${allEntities.length} entities`);
        
        // Update visibility from current position
        this.game.fogOfWar.updateVisibility(this.game.player.x, this.game.player.y);
        
        let correctRenderingDecisions = 0;
        let incorrectRenderingDecisions = 0;
        
        for (const entity of allEntities) {
            const isVisible = this.game.fogOfWar.isVisible(entity.x, entity.y);
            const isExplored = this.game.fogOfWar.isExplored(entity.x, entity.y);
            const shouldRender = this.game.fogOfWar.shouldRenderEntity(entity.x, entity.y, entity.type);
            
            let expectedRender;
            if (entity.type === 'ship') {
                // Ships should render in explored areas
                expectedRender = isExplored;
            } else {
                // Other entities should only render when visible
                expectedRender = isVisible;
            }
            
            if (shouldRender === expectedRender) {
                correctRenderingDecisions++;
                this.log(`  ✓ ${entity.type} at (${entity.x}, ${entity.y}): correct rendering decision`);
            } else {
                incorrectRenderingDecisions++;
                this.log(`  ✗ ${entity.type} at (${entity.x}, ${entity.y}): incorrect rendering decision (expected ${expectedRender}, got ${shouldRender})`, 'error');
            }
        }
        
        this.log(`Correct rendering decisions: ${correctRenderingDecisions}`);
        this.log(`Incorrect rendering decisions: ${incorrectRenderingDecisions}`);
        
        if (incorrectRenderingDecisions === 0) {
            this.log('✓ Entity rendering logic test PASSED', 'success');
        } else {
            this.log('✗ Entity rendering logic test FAILED', 'error');
        }
    }

    // Helper methods
    getVisibleEntities() {
        if (!this.game.fogOfWar) return [];
        
        const allEntities = this.game.entityManager.getAllEntities();
        return allEntities.filter(entity => this.game.fogOfWar.isVisible(entity.x, entity.y));
    }

    getExploredEntities() {
        if (!this.game.fogOfWar) return [];
        
        const allEntities = this.game.entityManager.getAllEntities();
        return allEntities.filter(entity => this.game.fogOfWar.isExplored(entity.x, entity.y));
    }

    async moveTowardsPosition(targetX, targetY) {
        const maxMoves = 10;
        let moves = 0;
        
        while (moves < maxMoves) {
            const dx = targetX - this.game.player.x;
            const dy = targetY - this.game.player.y;
            
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                // Close enough
                break;
            }
            
            const moveX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
            const moveY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
            
            if (this.game.player.canMoveTo(this.game.player.x + moveX, this.game.player.y + moveY)) {
                this.game.player.move(moveX, moveY);
                moves++;
                await this.sleep(25);
            } else {
                // Try alternative movement
                if (moveX !== 0 && this.game.player.canMoveTo(this.game.player.x + moveX, this.game.player.y)) {
                    this.game.player.move(moveX, 0);
                    moves++;
                } else if (moveY !== 0 && this.game.player.canMoveTo(this.game.player.x, this.game.player.y + moveY)) {
                    this.game.player.move(0, moveY);
                    moves++;
                } else {
                    break; // Can't move closer
                }
                await this.sleep(25);
            }
        }
    }

    async moveAwayFromPosition(targetX, targetY) {
        const maxMoves = 5;
        let moves = 0;
        
        while (moves < maxMoves) {
            const dx = this.game.player.x - targetX;
            const dy = this.game.player.y - targetY;
            
            // Move in the direction away from target
            const moveX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
            const moveY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
            
            if (this.game.player.canMoveTo(this.game.player.x + moveX, this.game.player.y + moveY)) {
                this.game.player.move(moveX, moveY);
                moves++;
                await this.sleep(25);
            } else {
                // Try alternative movement
                if (moveX !== 0 && this.game.player.canMoveTo(this.game.player.x + moveX, this.game.player.y)) {
                    this.game.player.move(moveX, 0);
                    moves++;
                } else if (moveY !== 0 && this.game.player.canMoveTo(this.game.player.x, this.game.player.y + moveY)) {
                    this.game.player.move(0, moveY);
                    moves++;
                } else {
                    break; // Can't move away
                }
                await this.sleep(25);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateReport() {
        this.log('=== ENTITY VISIBILITY EXPLORATION TEST REPORT ===');
        
        const successCount = this.testResults.filter(r => r.type === 'success').length;
        const errorCount = this.testResults.filter(r => r.type === 'error').length;
        const warningCount = this.testResults.filter(r => r.type === 'warning').length;
        
        this.log(`Successful tests: ${successCount}`);
        this.log(`Failed tests: ${errorCount}`);
        this.log(`Warnings: ${warningCount}`);
        
        if (errorCount === 0) {
            this.log('🎉 ENTITY VISIBILITY EXPLORATION TESTS PASSED! 🎉', 'success');
        } else {
            this.log(`❌ ${errorCount} tests failed.`, 'error');
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new EntityVisibilityExplorationTest();
    test.runTest().then(() => {
        console.log('\nEntity visibility exploration test completed.');
        process.exit(0);
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = EntityVisibilityExplorationTest;