#!/usr/bin/env node

// Test the ship visibility fix under fog of war
const FogOfWar = require('./fog');

// Mock map generator for testing
class MockMapGenerator {
    constructor() {
        this.map = new Map();
        this.seededRandom = {
            random: () => Math.random(),
            randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
        };
    }
    
    getBiomeAt(x, y) {
        const key = `${x},${y}`;
        if (!this.map.has(key)) {
            this.map.set(key, {
                x, y,
                biome: 'ocean',
                visible: false,
                explored: false
            });
        }
        return this.map.get(key);
    }
    
    clearVisibility() {
        for (const [key, tile] of this.map) {
            if (tile.visible) {
                tile.explored = true;
                tile.visible = false;
            }
        }
    }
    
    setVisibility(x, y, visible) {
        const tile = this.getBiomeAt(x, y);
        tile.visible = visible;
        if (visible) {
            tile.explored = true;
        }
    }
}

function testShipVisibilityFix() {
    console.log('Testing ship visibility fix under fog of war...\n');
    
    let testsPassed = 0;
    let totalTests = 0;
    
    function runTest(testName, testFn) {
        totalTests++;
        try {
            console.log(`Running: ${testName}`);
            const result = testFn();
            if (result) {
                console.log(`✓ PASSED: ${testName}`);
                testsPassed++;
            } else {
                console.log(`✗ FAILED: ${testName}`);
            }
        } catch (error) {
            console.log(`✗ ERROR: ${testName} - ${error.message}`);
        }
        console.log('');
    }
    
    // Test 1: Ships remain visible in explored areas
    runTest('Ships remain visible in explored areas', () => {
        const mapGen = new MockMapGenerator();
        const fogOfWar = new FogOfWar(mapGen);
        
        const playerX = 0, playerY = 0;
        const shipX = 5, shipY = 5;
        
        // Player sees ship
        fogOfWar.updateVisibility(shipX, shipY);
        const shipVisibleWhenSeen = fogOfWar.shouldRenderEntity(shipX, shipY, 'ship');
        
        // Player moves away
        fogOfWar.updateVisibility(playerX, playerY);
        const shipVisibleAfterMoving = fogOfWar.shouldRenderEntity(shipX, shipY, 'ship');
        const shipAreaExplored = fogOfWar.isExplored(shipX, shipY);
        
        console.log(`  Ship visible when seen: ${shipVisibleWhenSeen}`);
        console.log(`  Ship area explored: ${shipAreaExplored}`);
        console.log(`  Ship visible after moving away: ${shipVisibleAfterMoving}`);
        
        return shipVisibleWhenSeen && shipAreaExplored && shipVisibleAfterMoving;
    });
    
    // Test 2: Ships not visible in unexplored areas
    runTest('Ships not visible in unexplored areas', () => {
        const mapGen = new MockMapGenerator();
        const fogOfWar = new FogOfWar(mapGen);
        
        const playerX = 0, playerY = 0;
        const shipX = 15, shipY = 15; // Far away, never seen
        
        fogOfWar.updateVisibility(playerX, playerY);
        const shipVisible = fogOfWar.shouldRenderEntity(shipX, shipY, 'ship');
        const shipAreaExplored = fogOfWar.isExplored(shipX, shipY);
        
        console.log(`  Ship area explored: ${shipAreaExplored}`);
        console.log(`  Ship visible: ${shipVisible}`);
        
        return !shipAreaExplored && !shipVisible;
    });
    
    // Test 3: Other entities still follow strict visibility rules
    runTest('Other entities follow strict visibility rules', () => {
        const mapGen = new MockMapGenerator();
        const fogOfWar = new FogOfWar(mapGen);
        
        const playerX = 0, playerY = 0;
        const treasureX = 5, treasureY = 5;
        
        // Player sees treasure
        fogOfWar.updateVisibility(treasureX, treasureY);
        const treasureVisibleWhenSeen = fogOfWar.shouldRenderEntity(treasureX, treasureY, 'treasure');
        
        // Player moves away
        fogOfWar.updateVisibility(playerX, playerY);
        const treasureVisibleAfterMoving = fogOfWar.shouldRenderEntity(treasureX, treasureY, 'treasure');
        const treasureAreaExplored = fogOfWar.isExplored(treasureX, treasureY);
        
        console.log(`  Treasure visible when seen: ${treasureVisibleWhenSeen}`);
        console.log(`  Treasure area explored: ${treasureAreaExplored}`);
        console.log(`  Treasure visible after moving away: ${treasureVisibleAfterMoving}`);
        
        // Treasure should disappear when not in line of sight (unlike ships)
        return treasureVisibleWhenSeen && treasureAreaExplored && !treasureVisibleAfterMoving;
    });
    
    // Test 4: Ships visible in currently visible areas (normal case)
    runTest('Ships visible in currently visible areas', () => {
        const mapGen = new MockMapGenerator();
        const fogOfWar = new FogOfWar(mapGen);
        
        const playerX = 5, playerY = 5;
        const shipX = 5, shipY = 5; // Same position as player
        
        fogOfWar.updateVisibility(playerX, playerY);
        const shipVisible = fogOfWar.shouldRenderEntity(shipX, shipY, 'ship');
        const shipAreaVisible = fogOfWar.isVisible(shipX, shipY);
        
        console.log(`  Ship area visible: ${shipAreaVisible}`);
        console.log(`  Ship should render: ${shipVisible}`);
        
        return shipAreaVisible && shipVisible;
    });
    
    // Test 5: Backward compatibility - no entity type specified
    runTest('Backward compatibility - no entity type specified', () => {
        const mapGen = new MockMapGenerator();
        const fogOfWar = new FogOfWar(mapGen);
        
        const playerX = 0, playerY = 0;
        const entityX = 5, entityY = 5;
        
        // Entity seen then player moves away
        fogOfWar.updateVisibility(entityX, entityY);
        fogOfWar.updateVisibility(playerX, playerY);
        
        // Without entity type, should follow old behavior (only visible in line of sight)
        const entityVisible = fogOfWar.shouldRenderEntity(entityX, entityY);
        const entityAreaExplored = fogOfWar.isExplored(entityX, entityY);
        
        console.log(`  Entity area explored: ${entityAreaExplored}`);
        console.log(`  Entity visible without type: ${entityVisible}`);
        
        return entityAreaExplored && !entityVisible;
    });
    
    // Summary
    console.log(`\n=== Test Results ===`);
    console.log(`Tests passed: ${testsPassed}/${totalTests}`);
    console.log(`Success rate: ${Math.round((testsPassed / totalTests) * 100)}%`);
    
    if (testsPassed === totalTests) {
        console.log('✓ All ship visibility fix tests passed!');
        console.log('\nThe fix successfully:');
        console.log('- Keeps ships visible in explored areas');
        console.log('- Maintains strict visibility for other entities');
        console.log('- Preserves backward compatibility');
        return true;
    } else {
        console.log('✗ Some tests failed. Check implementation.');
        return false;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testShipVisibilityFix();
}

module.exports = { testShipVisibilityFix };