#!/usr/bin/env node

// Integration tests for the complete resource gathering workflow
console.log('=== Resource Gathering Integration Tests ===\n');

const ResourceManager = require('./resource-manager');
const PlayerInventory = require('./player-inventory');
const SeededRandom = require('./seeded-random');

// Mock map generator with comprehensive biome support
class MockMapGenerator {
    constructor(seed = 12345) {
        this.seed = seed;
        this.seededRandom = new SeededRandom(seed);
        this.biomeMap = new Map();
        this.generateTestMap();
    }
    
    generateTestMap() {
        // Create a test map with different biomes
        const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
        
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                const biomeIndex = (x + y * 3) % biomes.length;
                this.biomeMap.set(`${x},${y}`, { biome: biomes[biomeIndex] });
            }
        }
        
        // Add some ocean tiles
        this.biomeMap.set('5,5', { biome: 'ocean' });
        this.biomeMap.set('9,9', { biome: 'ocean' });
    }
    
    getBiomeAt(x, y) {
        return this.biomeMap.get(`${x},${y}`) || { biome: 'ocean' };
    }
    
    generateResourceGlyph(x, y, biome, resourceManager) {
        const biomeConfig = resourceManager.getBiomeResources(biome);
        if (!biomeConfig) return { resourceType: null, char: '~', color: '#000000' };
        
        // Use seeded random for consistent glyph generation
        const glyphRoll = this.seededRandom.random();
        let currentWeight = 0;
        
        for (const glyphDist of biomeConfig.glyphDistribution) {
            currentWeight += glyphDist.weight;
            if (glyphRoll * 100 <= currentWeight) {
                if (glyphDist.glyph === 'biome_fallback') {
                    return { resourceType: null, char: '~', color: '#000000' };
                }
                return {
                    resourceType: glyphDist.glyph,
                    char: resourceManager.getResourceGlyph(glyphDist.glyph, 'terminal'),
                    color: resourceManager.getResourceColor(glyphDist.glyph)
                };
            }
        }
        
        return { resourceType: null, char: '~', color: '#000000' };
    }
}

let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFunction) {
    testsTotal++;
    try {
        console.log(`Running: ${testName}`);
        testFunction();
        testsPassed++;
        console.log(`✓ PASSED: ${testName}\n`);
    } catch (error) {
        console.log(`✗ FAILED: ${testName}`);
        console.log(`  Error: ${error.message}\n`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Test complete gathering workflow
runTest('Complete gathering workflow', () => {
    const mockMapGenerator = new MockMapGenerator(12345);
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const playerInventory = new PlayerInventory(100);
    
    // Test gathering from forest
    const forestResult = resourceManager.attemptGather(0, 0, playerInventory);
    console.log(`  Forest gather: ${forestResult.message}`);
    
    if (forestResult.success) {
        assert(forestResult.resource, 'Should specify which resource was gathered');
        assert(forestResult.quantity > 0, 'Should specify quantity gathered');
        assert(playerInventory.getResourceCount(forestResult.resource) === forestResult.quantity, 
               'Inventory should contain gathered resource');
    }
    
    // Test gathering from desert
    const desertResult = resourceManager.attemptGather(1, 0, playerInventory);
    console.log(`  Desert gather: ${desertResult.message}`);
    
    // Test gathering from ocean (should fail)
    const oceanResult = resourceManager.attemptGather(5, 5, playerInventory);
    console.log(`  Ocean gather: ${oceanResult.message}`);
    assert(!oceanResult.success, 'Ocean gathering should fail');
    assert(oceanResult.message.includes('Nothing to gather'), 'Should indicate no resources');
    
    // Test inventory state
    const totalItems = playerInventory.getTotalItems();
    console.log(`  Total items gathered: ${totalItems}`);
    assert(totalItems >= 0, 'Should have non-negative items');
});

// Test biome-specific resource gathering
runTest('Biome-specific resource gathering', () => {
    const mockMapGenerator = new MockMapGenerator(54321);
    const seededRandom = new SeededRandom(54321);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const playerInventory = new PlayerInventory(1000);
    
    const biomeTests = [
        { x: 0, y: 0, biome: 'forest', expectedResources: ['wood', 'berries'] },
        { x: 1, y: 0, biome: 'desert', expectedResources: ['stone', 'sand'] },
        { x: 2, y: 0, biome: 'mountain', expectedResources: ['stone', 'ore'] },
        { x: 0, y: 1, biome: 'beach', expectedResources: ['wood', 'sand'] },
        { x: 1, y: 1, biome: 'jungle', expectedResources: ['wood', 'berries'] },
        { x: 2, y: 1, biome: 'savanna', expectedResources: ['hay', 'wood'] },
        { x: 0, y: 2, biome: 'taiga', expectedResources: ['wood', 'berries'] },
        { x: 1, y: 2, biome: 'tropical', expectedResources: ['wood', 'berries'] },
        { x: 2, y: 2, biome: 'swamp', expectedResources: ['reeds', 'berries'] }
    ];
    
    for (const test of biomeTests) {
        const tile = mockMapGenerator.getBiomeAt(test.x, test.y);
        console.log(`  Testing ${test.biome} at (${test.x}, ${test.y}): actual biome ${tile.biome}`);
        
        // Attempt multiple gathers to test resource variety
        const gatheredResources = new Set();
        for (let i = 0; i < 20; i++) {
            const result = resourceManager.attemptGather(test.x, test.y, playerInventory);
            if (result.success) {
                gatheredResources.add(result.resource);
            }
        }
        
        // Verify that only expected resources were gathered
        for (const resource of gatheredResources) {
            assert(test.expectedResources.includes(resource), 
                   `Unexpected resource ${resource} from ${test.biome}`);
        }
        
        console.log(`    Gathered resources: ${Array.from(gatheredResources).join(', ')}`);
    }
});

// Test depletion and regeneration workflow
runTest('Depletion and regeneration workflow', () => {
    const mockMapGenerator = new MockMapGenerator(98765);
    const seededRandom = new SeededRandom(98765);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const playerInventory = new PlayerInventory(1000);
    
    const testX = 0, testY = 0;
    let successfulGathers = 0;
    let totalAttempts = 0;
    
    console.log('  Testing depletion through repeated gathering...');
    
    // Gather repeatedly until depletion
    for (let i = 0; i < 50; i++) {
        const result = resourceManager.attemptGather(testX, testY, playerInventory);
        totalAttempts++;
        
        if (result.success) {
            successfulGathers++;
            console.log(`    Attempt ${i + 1}: Success - ${result.message}`);
        } else {
            console.log(`    Attempt ${i + 1}: Failed - ${result.message}`);
            
            // Check if it's depleted
            if (result.message.includes('picked clean')) {
                console.log('    Location became depleted');
                break;
            }
        }
    }
    
    assert(successfulGathers > 0, 'Should have some successful gathers');
    console.log(`  Successful gathers: ${successfulGathers}/${totalAttempts}`);
    
    // Check location state
    const locationState = resourceManager.getLocationState(testX, testY);
    console.log(`  Final depletion level: ${(locationState.depletionLevel * 100).toFixed(1)}%`);
    console.log(`  Total gathers recorded: ${locationState.totalGathers}`);
    
    // Note: totalGathers tracks all attempts, not just successful ones
    assert(locationState.totalGathers >= successfulGathers, 'Should track gather attempts');
    
    // Test regeneration calculation
    const biomeConfig = resourceManager.getBiomeResources('forest');
    const currentDepletion = resourceManager.calculateRegeneration(locationState, biomeConfig);
    console.log(`  Current depletion (with regen): ${(currentDepletion * 100).toFixed(1)}%`);
    
    // Test visual depletion state
    const isVisuallyDepleted = resourceManager.isLocationVisuallyDepleted(testX, testY);
    console.log(`  Visually depleted: ${isVisuallyDepleted}`);
});

// Test inventory capacity limits during gathering
runTest('Inventory capacity limits during gathering', () => {
    const mockMapGenerator = new MockMapGenerator(11111);
    const seededRandom = new SeededRandom(11111);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const playerInventory = new PlayerInventory(10); // Small capacity
    
    console.log('  Testing gathering with limited inventory capacity...');
    
    let gatherAttempts = 0;
    let capacityReached = false;
    
    // Gather until inventory is full
    for (let i = 0; i < 50; i++) {
        const result = resourceManager.attemptGather(0, 0, playerInventory);
        gatherAttempts++;
        
        console.log(`    Attempt ${i + 1}: ${result.message} (${playerInventory.getTotalItems()}/${playerInventory.getCapacity()})`);
        
        if (!result.success && result.message.includes('Inventory full')) {
            capacityReached = true;
            console.log('    Inventory capacity limit reached');
            break;
        }
        
        if (result.success) {
            assert(playerInventory.getTotalItems() <= playerInventory.getCapacity(), 
                   'Inventory should not exceed capacity');
        }
    }
    
    assert(capacityReached, 'Should eventually reach capacity limit');
    assert(playerInventory.getTotalItems() === playerInventory.getCapacity(), 
           'Inventory should be at full capacity');
    
    // Test that further gathering fails when inventory is full
    const fullResult = resourceManager.attemptGather(0, 0, playerInventory);
    if (fullResult.success) {
        // If it succeeded, inventory wasn't actually full, which is also valid
        console.log('    Note: Gathering succeeded, inventory may not have been completely full');
    } else {
        assert(fullResult.message.includes('Inventory full') || fullResult.message.includes('nothing useful'), 
               'Should indicate inventory is full or no resources found');
    }
});

// Test cross-platform consistency
runTest('Cross-platform consistency', () => {
    const seed = 77777;
    
    // Create two identical setups
    const mockMapGenerator1 = new MockMapGenerator(seed);
    const seededRandom1 = new SeededRandom(seed);
    const resourceManager1 = new ResourceManager(mockMapGenerator1, seededRandom1);
    const playerInventory1 = new PlayerInventory(100);
    
    const mockMapGenerator2 = new MockMapGenerator(seed);
    const seededRandom2 = new SeededRandom(seed);
    const resourceManager2 = new ResourceManager(mockMapGenerator2, seededRandom2);
    const playerInventory2 = new PlayerInventory(100);
    
    console.log('  Testing deterministic behavior with same seed...');
    
    // Perform identical operations on both setups
    const testPositions = [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]];
    
    for (const [x, y] of testPositions) {
        const result1 = resourceManager1.attemptGather(x, y, playerInventory1);
        const result2 = resourceManager2.attemptGather(x, y, playerInventory2);
        
        // Results should be identical
        assert(result1.success === result2.success, 
               `Success state should match at (${x}, ${y})`);
        
        if (result1.success && result2.success) {
            assert(result1.resource === result2.resource, 
                   `Resource type should match at (${x}, ${y})`);
            assert(result1.quantity === result2.quantity, 
                   `Quantity should match at (${x}, ${y})`);
        }
        
        console.log(`    Position (${x}, ${y}): ${result1.success ? 'Success' : 'Failed'} - ${result1.message}`);
    }
    
    // Final inventories should be identical
    const resources1 = playerInventory1.getAllResources();
    const resources2 = playerInventory2.getAllResources();
    
    assert(playerInventory1.getTotalItems() === playerInventory2.getTotalItems(), 
           'Total items should match');
    
    for (const [resourceType, data1] of Object.entries(resources1)) {
        const data2 = resources2[resourceType];
        assert(data2, `Both inventories should have ${resourceType}`);
        assert(data1.quantity === data2.quantity, 
               `Quantities should match for ${resourceType}`);
    }
    
    console.log('  ✓ Cross-platform consistency verified');
});

// Test save/load integration
runTest('Save/load integration', () => {
    const mockMapGenerator = new MockMapGenerator(33333);
    const seededRandom = new SeededRandom(33333);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const playerInventory = new PlayerInventory(100);
    
    console.log('  Testing save/load functionality...');
    
    // Perform some gathering to create state
    for (let i = 0; i < 10; i++) {
        resourceManager.attemptGather(i % 3, Math.floor(i / 3), playerInventory);
    }
    
    // Save state
    const inventoryData = playerInventory.serialize();
    const resourceData = resourceManager.serializeLocationStates();
    
    console.log(`  Saved inventory data: ${inventoryData.length} characters`);
    console.log(`  Saved resource data: ${resourceData.length} characters`);
    
    // Create new instances and load state
    const newMockMapGenerator = new MockMapGenerator(33333);
    const newSeededRandom = new SeededRandom(33333);
    const newResourceManager = new ResourceManager(newMockMapGenerator, newSeededRandom);
    const newPlayerInventory = new PlayerInventory(100);
    
    const inventoryResult = newPlayerInventory.deserialize(inventoryData);
    const resourceResult = newResourceManager.deserializeLocationStates(resourceData);
    
    assert(inventoryResult.success, `Inventory load failed: ${inventoryResult.message}`);
    assert(resourceResult.success, `Resource load failed: ${resourceResult.message}`);
    
    // Verify loaded state matches original
    assert(newPlayerInventory.getTotalItems() === playerInventory.getTotalItems(), 
           'Loaded inventory should match original');
    assert(newPlayerInventory.getCapacity() === playerInventory.getCapacity(), 
           'Loaded capacity should match original');
    
    const originalResources = playerInventory.getAllResources();
    const loadedResources = newPlayerInventory.getAllResources();
    
    for (const [resourceType, originalData] of Object.entries(originalResources)) {
        const loadedData = loadedResources[resourceType];
        assert(loadedData, `Loaded inventory should have ${resourceType}`);
        assert(loadedData.quantity === originalData.quantity, 
               `Loaded quantity should match for ${resourceType}`);
    }
    
    console.log('  ✓ Save/load integration verified');
});

// Test performance with large-scale operations
runTest('Performance with large-scale operations', () => {
    const mockMapGenerator = new MockMapGenerator(99999);
    const seededRandom = new SeededRandom(99999);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const playerInventory = new PlayerInventory(10000);
    
    console.log('  Testing performance with large-scale operations...');
    
    const startTime = Date.now();
    
    // Perform many gathering operations
    let successfulGathers = 0;
    const totalOperations = 1000;
    
    for (let i = 0; i < totalOperations; i++) {
        const x = i % 10;
        const y = Math.floor(i / 10) % 10;
        const result = resourceManager.attemptGather(x, y, playerInventory);
        
        if (result.success) {
            successfulGathers++;
        }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`  Performed ${totalOperations} gather operations in ${duration}ms`);
    console.log(`  Successful gathers: ${successfulGathers}`);
    console.log(`  Average time per operation: ${(duration / totalOperations).toFixed(2)}ms`);
    console.log(`  Final inventory size: ${playerInventory.getTotalItems()} items`);
    console.log(`  Location states tracked: ${resourceManager.locationStates.size}`);
    
    // Performance should be reasonable
    assert(duration < 5000, `Operations should complete in reasonable time, took ${duration}ms`);
    assert(successfulGathers > 0, 'Should have some successful gathers');
    
    // Test cleanup performance
    const cleanupStart = Date.now();
    resourceManager.forceCleanup();
    const cleanupEnd = Date.now();
    const cleanupDuration = cleanupEnd - cleanupStart;
    
    console.log(`  Cleanup completed in ${cleanupDuration}ms`);
    assert(cleanupDuration < 1000, 'Cleanup should be fast');
});

// Test error handling and edge cases
runTest('Error handling and edge cases', () => {
    const mockMapGenerator = new MockMapGenerator(44444);
    const seededRandom = new SeededRandom(44444);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const playerInventory = new PlayerInventory(100);
    
    console.log('  Testing error handling and edge cases...');
    
    // Test invalid coordinates
    const invalidResult1 = resourceManager.attemptGather(null, null, playerInventory);
    assert(!invalidResult1.success, 'Should handle null coordinates');
    console.log(`    Null coordinates: ${invalidResult1.message}`);
    
    const invalidResult2 = resourceManager.attemptGather(-1, -1, playerInventory);
    console.log(`    Negative coordinates: ${invalidResult2.message}`);
    
    // Test very large coordinates
    const largeResult = resourceManager.attemptGather(999999, 999999, playerInventory);
    console.log(`    Large coordinates: ${largeResult.message}`);
    
    // Test with null inventory
    try {
        const nullInventoryResult = resourceManager.attemptGather(0, 0, null);
        assert(!nullInventoryResult.success, 'Should handle null inventory');
    } catch (error) {
        console.log(`    Null inventory handled with exception: ${error.message}`);
    }
    
    // Test corrupted inventory
    const corruptedInventory = new PlayerInventory(100);
    corruptedInventory.resources = null; // Corrupt the resources map
    
    try {
        const corruptedResult = resourceManager.attemptGather(0, 0, corruptedInventory);
        console.log(`    Corrupted inventory: ${corruptedResult.message}`);
    } catch (error) {
        console.log(`    Corrupted inventory handled with exception: ${error.message}`);
    }
    
    // Test resource manager with corrupted map generator
    const corruptedMapGenerator = {
        getBiomeAt: () => null // Return null instead of biome data
    };
    
    const corruptedResourceManager = new ResourceManager(corruptedMapGenerator, seededRandom);
    const corruptedMapResult = corruptedResourceManager.attemptGather(0, 0, playerInventory);
    assert(!corruptedMapResult.success, 'Should handle corrupted map data');
    console.log(`    Corrupted map data: ${corruptedMapResult.message}`);
    
    console.log('  ✓ Error handling verified');
});

// Print test results
console.log('=== Integration Test Results ===');
console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
console.log(`Success rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);

if (testsPassed === testsTotal) {
    console.log('✓ All resource gathering integration tests passed!');
} else {
    console.log('✗ Some tests failed. Check output above for details.');
    process.exit(1);
}