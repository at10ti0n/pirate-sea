#!/usr/bin/env node

// Performance and stress tests for resource gathering system
console.log('=== Performance and Stress Tests ===\n');

const ResourceManager = require('./resource-manager');
const PlayerInventory = require('./player-inventory');
const SeededRandom = require('./seeded-random');

// Mock map generator for performance testing
class MockMapGenerator {
    constructor(seed = 12345) {
        this.seed = seed;
        this.seededRandom = new SeededRandom(seed);
        this.biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
    }
    
    getBiomeAt(x, y) {
        // Use deterministic biome selection for consistent testing
        const biomeIndex = Math.abs((x * 7 + y * 11) % this.biomes.length);
        return { biome: this.biomes[biomeIndex] };
    }
    
    generateResourceGlyph(x, y, biome, resourceManager) {
        const biomeConfig = resourceManager.getBiomeResources(biome);
        if (!biomeConfig) return { resourceType: null, char: '~', color: '#000000' };
        
        // Simple glyph generation for performance testing
        const firstResource = biomeConfig.resources[0];
        return {
            resourceType: firstResource.type,
            char: resourceManager.getResourceGlyph(firstResource.type, 'terminal'),
            color: resourceManager.getResourceColor(firstResource.type)
        };
    }
}

let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFunction) {
    testsTotal++;
    try {
        console.log(`Running: ${testName}`);
        const startTime = Date.now();
        testFunction();
        const endTime = Date.now();
        testsPassed++;
        console.log(`✓ PASSED: ${testName} (${endTime - startTime}ms)\n`);
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

function measurePerformance(operation, iterations = 1000) {
    const startTime = process.hrtime.bigint();
    
    for (let i = 0; i < iterations; i++) {
        operation(i);
    }
    
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    return {
        totalTime: durationMs,
        averageTime: durationMs / iterations,
        operationsPerSecond: iterations / (durationMs / 1000)
    };
}

// Test large inventory performance
runTest('Large inventory performance', () => {
    console.log('  Testing inventory with 1000+ different resource types...');
    
    const inventory = new PlayerInventory(100000);
    
    // Add many different resource types
    const addPerf = measurePerformance((i) => {
        inventory.addResource(`resource_${i}`, Math.floor(Math.random() * 10) + 1);
    }, 1000);
    
    console.log(`  Added 1000 resource types in ${addPerf.totalTime.toFixed(2)}ms`);
    console.log(`  Average add time: ${addPerf.averageTime.toFixed(4)}ms`);
    console.log(`  Add operations per second: ${addPerf.operationsPerSecond.toFixed(0)}`);
    
    assert(inventory.getResourceCount() === 1000, 'Should have 1000 resource types');
    assert(addPerf.averageTime < 1, 'Add operations should be fast');
    
    // Test retrieval performance
    const getPerf = measurePerformance((i) => {
        inventory.getResourceCount(`resource_${i % 1000}`);
    }, 10000);
    
    console.log(`  Retrieved resource counts 10000 times in ${getPerf.totalTime.toFixed(2)}ms`);
    console.log(`  Average get time: ${getPerf.averageTime.toFixed(4)}ms`);
    console.log(`  Get operations per second: ${getPerf.operationsPerSecond.toFixed(0)}`);
    
    assert(getPerf.averageTime < 0.1, 'Get operations should be very fast');
    
    // Test serialization performance
    const serializeStart = Date.now();
    const serialized = inventory.serialize();
    const serializeEnd = Date.now();
    
    console.log(`  Serialized large inventory in ${serializeEnd - serializeStart}ms`);
    console.log(`  Serialized data size: ${serialized.length} characters`);
    
    assert(serializeEnd - serializeStart < 1000, 'Serialization should be fast');
    
    // Test deserialization performance
    const newInventory = new PlayerInventory();
    const deserializeStart = Date.now();
    const result = newInventory.deserialize(serialized);
    const deserializeEnd = Date.now();
    
    console.log(`  Deserialized large inventory in ${deserializeEnd - deserializeStart}ms`);
    
    assert(result.success, 'Deserialization should succeed');
    assert(deserializeEnd - deserializeStart < 1000, 'Deserialization should be fast');
    assert(newInventory.getResourceCount() === 1000, 'Should restore all resource types');
});

// Test many location states performance
runTest('Many location states performance', () => {
    console.log('  Testing resource manager with 10000+ location states...');
    
    const mockMapGenerator = new MockMapGenerator(54321);
    const seededRandom = new SeededRandom(54321);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const inventory = new PlayerInventory(100000);
    
    // Set high limits to test performance
    resourceManager.maxLocationStates = 20000;
    
    // Create many location states through gathering
    const gatherPerf = measurePerformance((i) => {
        const x = i % 100;
        const y = Math.floor(i / 100);
        resourceManager.attemptGather(x, y, inventory);
    }, 10000);
    
    console.log(`  Performed 10000 gather operations in ${gatherPerf.totalTime.toFixed(2)}ms`);
    console.log(`  Average gather time: ${gatherPerf.averageTime.toFixed(4)}ms`);
    console.log(`  Gather operations per second: ${gatherPerf.operationsPerSecond.toFixed(0)}`);
    console.log(`  Location states created: ${resourceManager.locationStates.size}`);
    
    assert(gatherPerf.averageTime < 5, 'Gather operations should be reasonably fast');
    assert(resourceManager.locationStates.size > 1000, 'Should create many location states');
    
    // Test location state retrieval performance
    const getStatePerf = measurePerformance((i) => {
        const x = i % 100;
        const y = Math.floor(i / 100);
        resourceManager.getLocationState(x, y);
    }, 10000);
    
    console.log(`  Retrieved location states 10000 times in ${getStatePerf.totalTime.toFixed(2)}ms`);
    console.log(`  Average get state time: ${getStatePerf.averageTime.toFixed(4)}ms`);
    
    assert(getStatePerf.averageTime < 0.1, 'Location state retrieval should be very fast');
    
    // Test cleanup performance
    const cleanupStart = Date.now();
    resourceManager.forceCleanup();
    const cleanupEnd = Date.now();
    
    console.log(`  Cleanup completed in ${cleanupEnd - cleanupStart}ms`);
    console.log(`  Location states after cleanup: ${resourceManager.locationStates.size}`);
    
    assert(cleanupEnd - cleanupStart < 1000, 'Cleanup should be fast');
    
    // Test serialization performance with many states
    const serializeStart = Date.now();
    const serialized = resourceManager.serializeLocationStates();
    const serializeEnd = Date.now();
    
    console.log(`  Serialized location states in ${serializeEnd - serializeStart}ms`);
    console.log(`  Serialized data size: ${serialized.length} characters`);
    
    assert(serializeEnd - serializeStart < 2000, 'Location state serialization should be reasonably fast');
});

// Test rapid gathering operations
runTest('Rapid gathering operations stress test', () => {
    console.log('  Testing rapid gathering operations...');
    
    const mockMapGenerator = new MockMapGenerator(98765);
    const seededRandom = new SeededRandom(98765);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const inventory = new PlayerInventory(50000);
    
    let successfulGathers = 0;
    let failedGathers = 0;
    
    // Perform rapid gathering operations
    const rapidGatherPerf = measurePerformance((i) => {
        const x = (i % 20) - 10; // Range from -10 to 9
        const y = Math.floor(i / 20) % 20 - 10; // Range from -10 to 9
        
        const result = resourceManager.attemptGather(x, y, inventory);
        if (result.success) {
            successfulGathers++;
        } else {
            failedGathers++;
        }
    }, 5000);
    
    console.log(`  Performed 5000 rapid gathers in ${rapidGatherPerf.totalTime.toFixed(2)}ms`);
    console.log(`  Average gather time: ${rapidGatherPerf.averageTime.toFixed(4)}ms`);
    console.log(`  Successful gathers: ${successfulGathers}`);
    console.log(`  Failed gathers: ${failedGathers}`);
    console.log(`  Success rate: ${(successfulGathers / 5000 * 100).toFixed(1)}%`);
    
    assert(rapidGatherPerf.averageTime < 2, 'Rapid gather operations should be fast');
    assert(successfulGathers > 0, 'Should have some successful gathers');
    
    // Verify inventory integrity after rapid operations
    const validation = inventory.validateInventory();
    assert(validation.isValid, 'Inventory should remain valid after rapid operations');
    
    console.log(`  Final inventory: ${inventory.getTotalItems()} items, ${inventory.getResourceCount()} types`);
});

// Test memory usage with large datasets
runTest('Memory usage with large datasets', () => {
    console.log('  Testing memory usage patterns...');
    
    const mockMapGenerator = new MockMapGenerator(11111);
    const seededRandom = new SeededRandom(11111);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const inventory = new PlayerInventory(100000);
    
    // Get initial memory usage
    const initialMemory = process.memoryUsage();
    console.log(`  Initial memory usage: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    // Create large dataset
    for (let i = 0; i < 5000; i++) {
        const x = i % 100;
        const y = Math.floor(i / 100);
        resourceManager.attemptGather(x, y, inventory);
        
        // Add variety to inventory
        if (i % 10 === 0) {
            inventory.addResource(`test_resource_${i}`, 1);
        }
    }
    
    // Get memory usage after operations
    const afterMemory = process.memoryUsage();
    console.log(`  Memory after operations: ${(afterMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    const memoryIncrease = afterMemory.heapUsed - initialMemory.heapUsed;
    console.log(`  Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    
    // Memory increase should be reasonable (less than 50MB for this test)
    assert(memoryIncrease < 50 * 1024 * 1024, 'Memory increase should be reasonable');
    
    // Test performance metrics
    const metrics = resourceManager.getPerformanceMetrics();
    console.log(`  Location states: ${metrics.totalLocationStates}`);
    console.log(`  Active locations: ${metrics.activeLocations}`);
    console.log(`  Memory estimate: ${(metrics.memoryUsageEstimate / 1024).toFixed(2)} KB`);
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
        const afterGC = process.memoryUsage();
        console.log(`  Memory after GC: ${(afterGC.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    }
});

// Test concurrent-like operations simulation
runTest('Concurrent operations simulation', () => {
    console.log('  Simulating concurrent operations...');
    
    const mockMapGenerator = new MockMapGenerator(22222);
    const seededRandom = new SeededRandom(22222);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const inventory = new PlayerInventory(10000);
    
    // Simulate multiple "players" operating on the same system
    const players = [];
    for (let i = 0; i < 10; i++) {
        players.push({
            id: i,
            inventory: new PlayerInventory(1000),
            x: i * 5,
            y: i * 3,
            operations: 0,
            successes: 0
        });
    }
    
    // Simulate concurrent operations
    const concurrentPerf = measurePerformance((iteration) => {
        const player = players[iteration % players.length];
        
        // Move player slightly
        player.x += (iteration % 3) - 1;
        player.y += Math.floor(iteration / 3) % 3 - 1;
        
        // Attempt gather
        const result = resourceManager.attemptGather(player.x, player.y, player.inventory);
        player.operations++;
        
        if (result.success) {
            player.successes++;
        }
        
        // Occasionally perform inventory operations
        if (iteration % 50 === 0) {
            player.inventory.validateInventory();
        }
    }, 2000);
    
    console.log(`  Simulated 2000 concurrent operations in ${concurrentPerf.totalTime.toFixed(2)}ms`);
    console.log(`  Average operation time: ${concurrentPerf.averageTime.toFixed(4)}ms`);
    
    // Report per-player statistics
    let totalOperations = 0;
    let totalSuccesses = 0;
    
    for (const player of players) {
        totalOperations += player.operations;
        totalSuccesses += player.successes;
        console.log(`    Player ${player.id}: ${player.successes}/${player.operations} successes (${player.inventory.getTotalItems()} items)`);
    }
    
    console.log(`  Total: ${totalSuccesses}/${totalOperations} successes`);
    console.log(`  Overall success rate: ${(totalSuccesses / totalOperations * 100).toFixed(1)}%`);
    
    assert(concurrentPerf.averageTime < 1, 'Concurrent operations should be fast');
    assert(totalSuccesses > 0, 'Should have some successful operations');
    
    // Verify system integrity
    const finalMetrics = resourceManager.getPerformanceMetrics();
    console.log(`  Final location states: ${finalMetrics.totalLocationStates}`);
    
    for (const player of players) {
        const validation = player.inventory.validateInventory();
        assert(validation.isValid, `Player ${player.id} inventory should be valid`);
    }
});

// Test edge case performance
runTest('Edge case performance', () => {
    console.log('  Testing performance with edge cases...');
    
    const mockMapGenerator = new MockMapGenerator(33333);
    const seededRandom = new SeededRandom(33333);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Test with very small inventory
    const tinyInventory = new PlayerInventory(1);
    
    const tinyPerf = measurePerformance((i) => {
        resourceManager.attemptGather(0, 0, tinyInventory);
    }, 1000);
    
    console.log(`  Tiny inventory operations: ${tinyPerf.averageTime.toFixed(4)}ms average`);
    assert(tinyPerf.averageTime < 1, 'Tiny inventory operations should be fast');
    
    // Test with zero capacity inventory
    const zeroInventory = new PlayerInventory(0);
    
    const zeroPerf = measurePerformance((i) => {
        resourceManager.attemptGather(0, 0, zeroInventory);
    }, 1000);
    
    console.log(`  Zero capacity operations: ${zeroPerf.averageTime.toFixed(4)}ms average`);
    assert(zeroPerf.averageTime < 1, 'Zero capacity operations should be fast');
    
    // Test with same location repeatedly
    const sameLocationPerf = measurePerformance((i) => {
        resourceManager.attemptGather(0, 0, new PlayerInventory(1000));
    }, 1000);
    
    console.log(`  Same location operations: ${sameLocationPerf.averageTime.toFixed(4)}ms average`);
    assert(sameLocationPerf.averageTime < 2, 'Same location operations should be reasonably fast');
    
    // Test with extreme coordinates
    const extremePerf = measurePerformance((i) => {
        const x = i % 2 === 0 ? 999999 : -999999;
        const y = i % 2 === 0 ? -999999 : 999999;
        resourceManager.attemptGather(x, y, new PlayerInventory(1000));
    }, 100);
    
    console.log(`  Extreme coordinate operations: ${extremePerf.averageTime.toFixed(4)}ms average`);
    assert(extremePerf.averageTime < 5, 'Extreme coordinate operations should be reasonably fast');
});

// Test cleanup system performance
runTest('Cleanup system performance', () => {
    console.log('  Testing cleanup system performance...');
    
    const mockMapGenerator = new MockMapGenerator(44444);
    const seededRandom = new SeededRandom(44444);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Set aggressive cleanup parameters for testing
    resourceManager.maxLocationStates = 100;
    resourceManager.locationExpiryTime = 1000; // 1 second
    
    const inventory = new PlayerInventory(10000);
    
    // Create many location states
    for (let i = 0; i < 500; i++) {
        const x = i % 50;
        const y = Math.floor(i / 50);
        resourceManager.attemptGather(x, y, inventory);
    }
    
    console.log(`  Created ${resourceManager.locationStates.size} location states`);
    
    // Test cleanup performance
    const cleanupPerf = measurePerformance(() => {
        resourceManager.forceCleanup();
    }, 10);
    
    console.log(`  Cleanup operations: ${cleanupPerf.averageTime.toFixed(2)}ms average`);
    console.log(`  Location states after cleanup: ${resourceManager.locationStates.size}`);
    
    assert(cleanupPerf.averageTime < 100, 'Cleanup should be fast');
    assert(resourceManager.locationStates.size <= resourceManager.maxLocationStates, 
           'Cleanup should respect max limit');
    
    // Test optimization performance
    const optimizePerf = measurePerformance(() => {
        resourceManager.optimizeLocationStates();
    }, 10);
    
    console.log(`  Optimization operations: ${optimizePerf.averageTime.toFixed(2)}ms average`);
    assert(optimizePerf.averageTime < 50, 'Optimization should be fast');
});

// Print performance test results
console.log('=== Performance Test Results ===');
console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
console.log(`Success rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);

if (testsPassed === testsTotal) {
    console.log('✓ All performance tests passed!');
    console.log('✓ System performs well under stress conditions');
    console.log('✓ Memory usage is within acceptable limits');
    console.log('✓ Operations scale well with large datasets');
} else {
    console.log('✗ Some performance tests failed. Check output above for details.');
    process.exit(1);
}