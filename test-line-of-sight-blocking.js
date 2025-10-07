#!/usr/bin/env node

// Focused test for line-of-sight blocking by mountains and snow tiles
const TerminalGame = require('./terminal-game');

class LineOfSightBlockingTest {
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
        this.log('Starting line-of-sight blocking test');
        
        try {
            // Try different seeds to find one with mountains/snow near spawn
            const testSeeds = [12345, 54321, 98765, 11111, 22222, 33333, 44444, 55555];
            
            for (const seed of testSeeds) {
                this.log(`Testing with seed: ${seed}`);
                
                this.game = new TerminalGame(seed);
                this.game.initialize();
                
                await this.sleep(50);
                
                const blockingTilesFound = await this.findAndTestBlockingTiles();
                
                if (blockingTilesFound > 0) {
                    this.log(`Found ${blockingTilesFound} blocking tiles with seed ${seed} - conducting detailed test`);
                    await this.detailedLineOfSightTest();
                    break;
                } else {
                    this.log(`No blocking tiles found with seed ${seed}, trying next seed`);
                }
                
                if (this.game && this.game.rl) {
                    this.game.rl.close();
                }
            }
            
            // If no blocking tiles found in any seed, create a synthetic test
            if (!this.hasFoundBlockingTiles()) {
                await this.syntheticBlockingTest();
            }
            
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

    async findAndTestBlockingTiles() {
        if (!this.game.fogOfWar) {
            this.log('Fog of war not initialized', 'warning');
            return 0;
        }

        const playerX = this.game.player.x;
        const playerY = this.game.player.y;
        const viewRadius = this.game.fogOfWar.getViewRadius();
        
        let blockingTilesFound = 0;
        
        // Search in a larger area around the player
        for (let dx = -viewRadius * 2; dx <= viewRadius * 2; dx++) {
            for (let dy = -viewRadius * 2; dy <= viewRadius * 2; dy++) {
                const testX = playerX + dx;
                const testY = playerY + dy;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= viewRadius) {
                    const tile = this.game.mapGenerator.getBiomeAt(testX, testY);
                    if (tile && (tile.biome === 'mountain' || tile.biome === 'snow')) {
                        blockingTilesFound++;
                        this.log(`Found ${tile.biome} at (${testX}, ${testY}), distance: ${distance.toFixed(2)}`);
                    }
                }
            }
        }
        
        return blockingTilesFound;
    }

    async detailedLineOfSightTest() {
        this.log('=== Detailed Line-of-Sight Blocking Test ===');
        
        const playerX = this.game.player.x;
        const playerY = this.game.player.y;
        const viewRadius = this.game.fogOfWar.getViewRadius();
        
        // Update visibility from player position
        this.game.fogOfWar.updateVisibility(playerX, playerY);
        
        let totalBlockingTiles = 0;
        let correctlyBlockedTiles = 0;
        let incorrectlyVisibleTiles = 0;
        
        // Find all blocking tiles within view radius
        const blockingTiles = [];
        for (let dx = -viewRadius; dx <= viewRadius; dx++) {
            for (let dy = -viewRadius; dy <= viewRadius; dy++) {
                const testX = playerX + dx;
                const testY = playerY + dy;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= viewRadius) {
                    const tile = this.game.mapGenerator.getBiomeAt(testX, testY);
                    if (tile && (tile.biome === 'mountain' || tile.biome === 'snow')) {
                        blockingTiles.push({ x: testX, y: testY, biome: tile.biome, distance });
                        totalBlockingTiles++;
                    }
                }
            }
        }
        
        this.log(`Found ${totalBlockingTiles} blocking tiles within view radius`);
        
        // For each blocking tile, test if it properly blocks vision
        for (const blockingTile of blockingTiles) {
            this.log(`Testing blocking by ${blockingTile.biome} at (${blockingTile.x}, ${blockingTile.y})`);
            
            // Test the lightPassesCallback directly
            const blocksLight = !this.game.fogOfWar.lightPassesCallback(blockingTile.x, blockingTile.y);
            this.log(`  Light blocked by ${blockingTile.biome}: ${blocksLight}`, blocksLight ? 'success' : 'error');
            
            // Calculate direction from player to blocking tile
            const dx = blockingTile.x - playerX;
            const dy = blockingTile.y - playerY;
            
            // Normalize direction
            const length = Math.sqrt(dx * dx + dy * dy);
            const dirX = dx / length;
            const dirY = dy / length;
            
            // Test tiles in the shadow of the blocking tile
            for (let shadowDist = 1; shadowDist <= 3; shadowDist++) {
                const shadowX = Math.round(blockingTile.x + (dirX * shadowDist));
                const shadowY = Math.round(blockingTile.y + (dirY * shadowDist));
                const shadowDistance = Math.sqrt((shadowX - playerX) ** 2 + (shadowY - playerY) ** 2);
                
                // Only test tiles within view radius
                if (shadowDistance <= viewRadius) {
                    const isVisible = this.game.fogOfWar.isVisible(shadowX, shadowY);
                    const shadowTile = this.game.mapGenerator.getBiomeAt(shadowX, shadowY);
                    
                    if (!isVisible) {
                        correctlyBlockedTiles++;
                        this.log(`    Shadow tile at (${shadowX}, ${shadowY}) correctly blocked (${shadowTile ? shadowTile.biome : 'unknown'})`);
                    } else {
                        incorrectlyVisibleTiles++;
                        this.log(`    Shadow tile at (${shadowX}, ${shadowY}) incorrectly visible (${shadowTile ? shadowTile.biome : 'unknown'})`, 'warning');
                    }
                }
            }
        }
        
        this.log(`Total blocking tiles: ${totalBlockingTiles}`);
        this.log(`Correctly blocked shadow tiles: ${correctlyBlockedTiles}`);
        this.log(`Incorrectly visible shadow tiles: ${incorrectlyVisibleTiles}`);
        
        // Test specific biome blocking
        await this.testBiomeBlocking();
        
        if (totalBlockingTiles > 0 && incorrectlyVisibleTiles === 0) {
            this.log('✓ Line-of-sight blocking test PASSED', 'success');
        } else if (totalBlockingTiles === 0) {
            this.log('⚠ Line-of-sight blocking test INCONCLUSIVE - no blocking terrain found', 'warning');
        } else {
            this.log('✗ Line-of-sight blocking test FAILED - some tiles not properly blocked', 'error');
        }
    }

    async testBiomeBlocking() {
        this.log('--- Testing Biome-Specific Blocking ---');
        
        // Test lightPassesCallback for different biomes
        const testBiomes = ['mountain', 'snow', 'ocean', 'forest', 'beach'];
        
        for (const biome of testBiomes) {
            // Find a tile of this biome type
            const playerX = this.game.player.x;
            const playerY = this.game.player.y;
            
            let foundTile = null;
            for (let dx = -10; dx <= 10 && !foundTile; dx++) {
                for (let dy = -10; dy <= 10 && !foundTile; dy++) {
                    const tile = this.game.mapGenerator.getBiomeAt(playerX + dx, playerY + dy);
                    if (tile && tile.biome === biome) {
                        foundTile = { x: playerX + dx, y: playerY + dy, biome };
                    }
                }
            }
            
            if (foundTile) {
                const blocksLight = !this.game.fogOfWar.lightPassesCallback(foundTile.x, foundTile.y);
                const shouldBlock = biome === 'mountain' || biome === 'snow';
                
                this.log(`  ${biome} at (${foundTile.x}, ${foundTile.y}) blocks light: ${blocksLight} (expected: ${shouldBlock})`, 
                    blocksLight === shouldBlock ? 'success' : 'error');
            } else {
                this.log(`  No ${biome} tile found for testing`, 'warning');
            }
        }
    }

    async syntheticBlockingTest() {
        this.log('=== Synthetic Line-of-Sight Blocking Test ===');
        this.log('No natural blocking terrain found, testing lightPassesCallback directly');
        
        if (!this.game || !this.game.fogOfWar) {
            this.log('Cannot perform synthetic test - no fog of war system', 'error');
            return;
        }
        
        // Create a mock map generator with known blocking tiles
        const originalGetBiomeAt = this.game.mapGenerator.getBiomeAt.bind(this.game.mapGenerator);
        
        // Override getBiomeAt to return specific biomes for testing
        this.game.mapGenerator.getBiomeAt = (x, y) => {
            // Create a test pattern with mountains
            if (x === 5 && y === 5) {
                return { biome: 'mountain', x, y, visible: false, explored: false };
            } else if (x === 3 && y === 3) {
                return { biome: 'snow', x, y, visible: false, explored: false };
            } else {
                return originalGetBiomeAt(x, y);
            }
        };
        
        // Test the lightPassesCallback with known blocking tiles
        const mountainBlocks = !this.game.fogOfWar.lightPassesCallback(5, 5);
        const snowBlocks = !this.game.fogOfWar.lightPassesCallback(3, 3);
        const oceanPasses = this.game.fogOfWar.lightPassesCallback(0, 0);
        
        this.log(`Mountain blocks light: ${mountainBlocks}`, mountainBlocks ? 'success' : 'error');
        this.log(`Snow blocks light: ${snowBlocks}`, snowBlocks ? 'success' : 'error');
        this.log(`Ocean allows light: ${oceanPasses}`, oceanPasses ? 'success' : 'error');
        
        // Restore original function
        this.game.mapGenerator.getBiomeAt = originalGetBiomeAt;
        
        if (mountainBlocks && snowBlocks && oceanPasses) {
            this.log('✓ Synthetic line-of-sight blocking test PASSED', 'success');
        } else {
            this.log('✗ Synthetic line-of-sight blocking test FAILED', 'error');
        }
    }

    hasFoundBlockingTiles() {
        return this.testResults.some(result => 
            result.message.includes('Found') && 
            (result.message.includes('mountain') || result.message.includes('snow'))
        );
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateReport() {
        this.log('=== LINE-OF-SIGHT BLOCKING TEST REPORT ===');
        
        const successCount = this.testResults.filter(r => r.type === 'success').length;
        const errorCount = this.testResults.filter(r => r.type === 'error').length;
        const warningCount = this.testResults.filter(r => r.type === 'warning').length;
        
        this.log(`Successful tests: ${successCount}`);
        this.log(`Failed tests: ${errorCount}`);
        this.log(`Warnings: ${warningCount}`);
        
        if (errorCount === 0) {
            this.log('🎉 LINE-OF-SIGHT BLOCKING TESTS PASSED! 🎉', 'success');
        } else {
            this.log(`❌ ${errorCount} tests failed.`, 'error');
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new LineOfSightBlockingTest();
    test.runTest().then(() => {
        console.log('\nLine-of-sight blocking test completed.');
        process.exit(0);
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = LineOfSightBlockingTest;