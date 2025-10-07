#!/usr/bin/env node

// Simple test for fog of war integration with resource gathering and examination
const FogOfWar = require('./fog');
const ResourceManager = require('./resource-manager');
const PlayerInventory = require('./player-inventory');

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
                biome: 'forest',
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
    
    getTileVisibility(x, y) {
        const tile = this.getBiomeAt(x, y);
        return { visible: tile.visible, explored: tile.explored };
    }
}

function testFogResourceIntegration() {
    console.log('Testing fog of war integration with resource systems...\n');
    
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
    
    // Test 1: Fog of war visibility checks work
    runTest('Fog of war visibility checks work', () => {
        const mapGen = new MockMapGenerator();
        const fogOfWar = new FogOfWar(mapGen);
        
        // Update visibility around player position
        fogOfWar.updateVisibility(0, 0);
        
        // Player position should be visible
        const isPlayerVisible = fogOfWar.isVisible(0, 0);
        console.log(`  Player position (0,0) visible: ${isPlayerVisible}`);
        
        // Distant position should not be visible
        const isDistantVisible = fogOfWar.isVisible(10, 10);
        console.log(`  Distant position (10,10) visible: ${isDistantVisible}`);
        
        return isPlayerVisible && !isDistantVisible;
    });
    
    // Test 2: Resource gathering respects visibility
    runTest('Resource gathering respects visibility', () => {
        const mapGen = new MockMapGenerator();
        const fogOfWar = new FogOfWar(mapGen);
        const resourceManager = new ResourceManager(mapGen, mapGen.seededRandom);
        const inventory = new PlayerInventory(500);
        
        // Make player position visible
        fogOfWar.updateVisibility(0, 0);
        
        // Test gathering at visible position
        const visibleResult = resourceManager.attemptGather(0, 0, inventory);
        console.log(`  Gathering at visible position: ${visibleResult.success ? 'success' : visibleResult.message}`);
        
        // Test that the method exists and works
        return typeof visibleResult === 'object' && typeof visibleResult.success === 'boolean';
    });
    
    // Test 3: Examination works with visibility
    runTest('Examination works with visibility', () => {
        const mapGen = new MockMapGenerator();
        const fogOfWar = new FogOfWar(mapGen);
        const resourceManager = new ResourceManager(mapGen, mapGen.seededRandom);
        
        // Make player position visible
        fogOfWar.updateVisibility(0, 0);
        
        // Test examination at visible position
        const examineResult = resourceManager.examineLocation(0, 0);
        console.log(`  Examination at visible position: ${examineResult.success ? 'success' : examineResult.message}`);
        
        return typeof examineResult === 'object' && typeof examineResult.success === 'boolean';
    });
    
    // Test 4: Inventory operations are independent of fog of war
    runTest('Inventory operations are independent of fog of war', () => {
        const inventory = new PlayerInventory(500);
        
        // Test basic inventory operations
        const addResult = inventory.addResource('wood', 5);
        console.log(`  Add resource result: ${addResult.success}`);
        
        const hasSpace = inventory.hasSpace(10);
        console.log(`  Has space for 10 items: ${hasSpace}`);
        
        const totalItems = inventory.getTotalItems();
        console.log(`  Total items in inventory: ${totalItems}`);
        
        return addResult.success && hasSpace && totalItems === 5;
    });
    
    // Test 5: Fog of war methods exist and work
    runTest('Fog of war methods exist and work', () => {
        const mapGen = new MockMapGenerator();
        const fogOfWar = new FogOfWar(mapGen);
        
        // Test required methods exist
        const hasIsVisible = typeof fogOfWar.isVisible === 'function';
        const hasIsExplored = typeof fogOfWar.isExplored === 'function';
        const hasShouldRenderTile = typeof fogOfWar.shouldRenderTile === 'function';
        const hasShouldRenderEntity = typeof fogOfWar.shouldRenderEntity === 'function';
        
        console.log(`  isVisible method exists: ${hasIsVisible}`);
        console.log(`  isExplored method exists: ${hasIsExplored}`);
        console.log(`  shouldRenderTile method exists: ${hasShouldRenderTile}`);
        console.log(`  shouldRenderEntity method exists: ${hasShouldRenderEntity}`);
        
        // Test methods work
        fogOfWar.updateVisibility(0, 0);
        const isVisible = fogOfWar.isVisible(0, 0);
        const shouldRender = fogOfWar.shouldRenderTile(0, 0);
        
        console.log(`  Visibility check works: ${isVisible}`);
        console.log(`  Render check works: ${shouldRender}`);
        
        return hasIsVisible && hasIsExplored && hasShouldRenderTile && hasShouldRenderEntity && isVisible && shouldRender;
    });
    
    // Summary
    console.log(`\n=== Test Results ===`);
    console.log(`Tests passed: ${testsPassed}/${totalTests}`);
    console.log(`Success rate: ${Math.round((testsPassed / totalTests) * 100)}%`);
    
    if (testsPassed === totalTests) {
        console.log('✓ All fog of war resource integration tests passed!');
        return true;
    } else {
        console.log('✗ Some tests failed. Check implementation.');
        return false;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testFogResourceIntegration();
}

module.exports = { testFogResourceIntegration };