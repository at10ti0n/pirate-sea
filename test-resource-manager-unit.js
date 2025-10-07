#!/usr/bin/env node

// Comprehensive unit tests for ResourceManager class
console.log('=== ResourceManager Unit Tests ===\n');

const ResourceManager = require('./resource-manager');
const PlayerInventory = require('./player-inventory');
const SeededRandom = require('./seeded-random');

// Mock map generator for consistent testing
class MockMapGenerator {
    constructor(seed = 12345) {
        this.seed = seed;
        this.seededRandom = new SeededRandom(seed);
    }
    
    getBiomeAt(x, y) {
        // Deterministic biome mapping for testing
        const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
        const index = Math.abs((x * 7 + y * 11) % biomes.length);
        return { biome: biomes[index] };
    }
    
    generateResourceGlyph(x, y, biome, resourceManager) {
        // Mock glyph generation for testing
        const biomeConfig = resourceManager.getBiomeResources(biome);
        if (!biomeConfig) return { resourceType: null, char: '~', color: '#000000' };
        
        // Return first resource type for consistency
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

function assertApproxEqual(actual, expected, tolerance = 0.01, message) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(message || `Expected ${expected} ± ${tolerance}, got ${actual}`);
    }
}

// Test ResourceManager initialization
runTest('ResourceManager initialization', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    assert(resourceManager.mapGenerator === mockMapGenerator, 'Map generator not set');
    assert(resourceManager.seededRandom === seededRandom, 'Seeded random not set');
    assert(resourceManager.locationStates instanceof Map, 'Location states not initialized');
    assert(resourceManager.resourceDefinitions, 'Resource definitions not initialized');
    assert(resourceManager.biomeResources, 'Biome resources not initialized');
    assert(resourceManager.resourceGlyphs, 'Resource glyphs not initialized');
});

// Test resource definitions
runTest('Resource definitions validation', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const expectedResources = ['stone', 'sand', 'wood', 'hay', 'ore', 'berries', 'reeds'];
    
    for (const resourceType of expectedResources) {
        const resourceInfo = resourceManager.getResourceInfo(resourceType);
        assert(resourceInfo, `Resource ${resourceType} not defined`);
        assert(resourceInfo.type === resourceType, `Resource type mismatch for ${resourceType}`);
        assert(resourceInfo.name, `Resource ${resourceType} missing name`);
        assert(resourceInfo.description, `Resource ${resourceType} missing description`);
        assert(resourceInfo.icon, `Resource ${resourceType} missing icon`);
        assert(resourceInfo.char, `Resource ${resourceType} missing terminal character`);
    }
});

// Test biome resource configurations
runTest('Biome resource configurations validation', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const expectedBiomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
    
    for (const biome of expectedBiomes) {
        const biomeConfig = resourceManager.getBiomeResources(biome);
        assert(biomeConfig, `Biome ${biome} not configured`);
        assert(biomeConfig.resources && biomeConfig.resources.length > 0, `Biome ${biome} has no resources`);
        assert(biomeConfig.baseSuccessRate > 0 && biomeConfig.baseSuccessRate <= 1, `Invalid success rate for ${biome}`);
        assert(biomeConfig.depletionRate > 0 && biomeConfig.depletionRate <= 1, `Invalid depletion rate for ${biome}`);
        assert(biomeConfig.regenerationTime > 0, `Invalid regeneration time for ${biome}`);
        
        // Validate resource weights sum to reasonable total
        const totalWeight = biomeConfig.resources.reduce((sum, r) => sum + r.weight, 0);
        assert(totalWeight > 0, `No resource weights for ${biome}`);
        
        // Validate glyph distribution
        assert(biomeConfig.glyphDistribution && biomeConfig.glyphDistribution.length > 0, `No glyph distribution for ${biome}`);
        const totalGlyphWeight = biomeConfig.glyphDistribution.reduce((sum, g) => sum + g.weight, 0);
        assert(totalGlyphWeight > 0, `No glyph weights for ${biome}`);
    }
});

// Test resource glyph system
runTest('Resource glyph system validation', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const resourceTypes = ['stone', 'sand', 'wood', 'hay', 'ore', 'berries', 'reeds'];
    
    for (const resourceType of resourceTypes) {
        // Test web glyphs
        const webGlyph = resourceManager.getResourceGlyph(resourceType, 'web');
        assert(webGlyph, `No web glyph for ${resourceType}`);
        
        // Test terminal glyphs
        const terminalGlyph = resourceManager.getResourceGlyph(resourceType, 'terminal');
        assert(terminalGlyph, `No terminal glyph for ${resourceType}`);
        
        // Test depleted glyphs
        const depletedWebGlyph = resourceManager.getResourceGlyph(resourceType, 'web', true);
        const depletedTerminalGlyph = resourceManager.getResourceGlyph(resourceType, 'terminal', true);
        assert(depletedWebGlyph, `No depleted web glyph for ${resourceType}`);
        assert(depletedTerminalGlyph, `No depleted terminal glyph for ${resourceType}`);
        
        // Test colors
        const color = resourceManager.getResourceColor(resourceType);
        const depletedColor = resourceManager.getResourceColor(resourceType, true);
        assert(color, `No color for ${resourceType}`);
        assert(depletedColor, `No depleted color for ${resourceType}`);
    }
});

// Test location state management
runTest('Location state management', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Test initial location state
    const initialState = resourceManager.getLocationState(0, 0);
    assert(initialState.x === 0, 'Wrong x coordinate');
    assert(initialState.y === 0, 'Wrong y coordinate');
    assert(initialState.depletionLevel === 0.0, 'Initial depletion should be 0');
    assert(initialState.totalGathers === 0, 'Initial gathers should be 0');
    
    // Test location state update
    const newState = {
        x: 0, y: 0,
        lastGathered: Date.now(),
        depletionLevel: 0.3,
        totalGathers: 5,
        regenerationTimer: 0
    };
    
    resourceManager.updateLocationState(0, 0, newState);
    const updatedState = resourceManager.getLocationState(0, 0);
    assert(updatedState.depletionLevel === 0.3, 'Depletion level not updated');
    assert(updatedState.totalGathers === 5, 'Total gathers not updated');
    
    // Test location key generation
    const key1 = resourceManager.getLocationKey(0, 0);
    const key2 = resourceManager.getLocationKey(1, 1);
    const key3 = resourceManager.getLocationKey(0, 0);
    assert(key1 === key3, 'Same coordinates should generate same key');
    assert(key1 !== key2, 'Different coordinates should generate different keys');
});

// Test depletion detection
runTest('Depletion detection', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Test non-depleted location
    const freshState = {
        x: 0, y: 0,
        lastGathered: Date.now(),
        depletionLevel: 0.5,
        totalGathers: 3,
        regenerationTimer: 0
    };
    resourceManager.updateLocationState(0, 0, freshState);
    assert(!resourceManager.isLocationDepleted(0, 0), 'Location should not be depleted at 50%');
    
    // Test depleted location
    const depletedState = {
        x: 1, y: 1,
        lastGathered: Date.now(),
        depletionLevel: 0.9,
        totalGathers: 15,
        regenerationTimer: 0
    };
    resourceManager.updateLocationState(1, 1, depletedState);
    assert(resourceManager.isLocationDepleted(1, 1), 'Location should be depleted at 90%');
});

// Test regeneration calculations
runTest('Regeneration calculations', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const forestConfig = resourceManager.getBiomeResources('forest');
    const now = Date.now();
    
    // Test no regeneration (recent gather)
    const recentState = {
        x: 0, y: 0,
        lastGathered: now - 1000, // 1 second ago
        depletionLevel: 0.8,
        totalGathers: 10,
        regenerationTimer: 0
    };
    
    const noRegen = resourceManager.calculateRegeneration(recentState, forestConfig);
    assertApproxEqual(noRegen, 0.8, 0.1, 'Should have minimal regeneration after 1 second');
    
    // Test full regeneration (past regeneration time)
    const oldState = {
        x: 0, y: 0,
        lastGathered: now - (forestConfig.regenerationTime + 60000), // Past regen time
        depletionLevel: 1.0,
        totalGathers: 20,
        regenerationTimer: 0
    };
    
    const fullRegen = resourceManager.calculateRegeneration(oldState, forestConfig);
    assert(fullRegen === 0.0, 'Should have full regeneration after regeneration time');
    
    // Test partial regeneration (half regeneration time)
    const partialState = {
        x: 0, y: 0,
        lastGathered: now - (forestConfig.regenerationTime / 2), // Half regen time
        depletionLevel: 0.8,
        totalGathers: 10,
        regenerationTimer: 0
    };
    
    const partialRegen = resourceManager.calculateRegeneration(partialState, forestConfig);
    assert(partialRegen < 0.8 && partialRegen > 0.0, 'Should have partial regeneration');
});

// Test success rate calculations
runTest('Success rate calculations', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const forestConfig = resourceManager.getBiomeResources('forest');
    const now = Date.now();
    
    // Test base success rate (fresh location)
    const freshState = {
        x: 0, y: 0,
        lastGathered: 0,
        depletionLevel: 0.0,
        totalGathers: 0,
        regenerationTimer: 0
    };
    
    const baseRate = resourceManager.calculateGatherSuccess(forestConfig, freshState);
    assertApproxEqual(baseRate, forestConfig.baseSuccessRate, 0.3, 'Base success rate should match config');
    
    // Test depletion penalty
    const depletedState = {
        x: 0, y: 0,
        lastGathered: now - 1000,
        depletionLevel: 0.5,
        totalGathers: 10,
        regenerationTimer: 0
    };
    
    const depletedRate = resourceManager.calculateGatherSuccess(forestConfig, depletedState);
    assert(depletedRate < baseRate, 'Depleted location should have lower success rate');
    
    // Test time bonus
    const oldState = {
        x: 0, y: 0,
        lastGathered: now - (10 * 60 * 1000), // 10 minutes ago
        depletionLevel: 0.0,
        totalGathers: 1,
        regenerationTimer: 0
    };
    
    const timeBonusRate = resourceManager.calculateGatherSuccess(forestConfig, oldState);
    assert(timeBonusRate >= baseRate, 'Old location should have time bonus');
    
    // Test rate bounds (should never be below 0.1 or above 0.95)
    assert(baseRate >= 0.1 && baseRate <= 0.95, 'Success rate should be within bounds');
    assert(depletedRate >= 0.1 && depletedRate <= 0.95, 'Depleted rate should be within bounds');
    assert(timeBonusRate >= 0.1 && timeBonusRate <= 0.95, 'Time bonus rate should be within bounds');
});

// Test resource selection
runTest('Resource selection logic', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const forestConfig = resourceManager.getBiomeResources('forest');
    
    // Test multiple selections to verify distribution
    const selections = {};
    const testRuns = 100;
    
    for (let i = 0; i < testRuns; i++) {
        const selected = resourceManager.selectResourceToGather(forestConfig, 0, 0);
        assert(selected, 'Should select a resource');
        assert(selected.type, 'Selected resource should have type');
        
        selections[selected.type] = (selections[selected.type] || 0) + 1;
    }
    
    // Verify that both wood and berries are selected
    assert(selections.wood > 0, 'Wood should be selected sometimes');
    assert(selections.berries > 0, 'Berries should be selected sometimes');
    
    // Verify wood is selected more often (60% vs 40% weight)
    assert(selections.wood > selections.berries, 'Wood should be selected more often than berries');
});

// Test quantity calculations
runTest('Quantity calculations', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const woodResource = { type: 'wood', weight: 60, baseQuantity: [1, 3] };
    
    // Test fresh location quantities
    const freshState = {
        x: 0, y: 0,
        lastGathered: 0,
        depletionLevel: 0.0,
        totalGathers: 0,
        regenerationTimer: 0
    };
    
    const quantities = [];
    for (let i = 0; i < 50; i++) {
        const quantity = resourceManager.calculateGatherQuantity(woodResource, freshState);
        quantities.push(quantity);
        assert(quantity >= 1, 'Quantity should be at least 1');
        assert(quantity <= 3, 'Quantity should not exceed max');
    }
    
    // Test depleted location quantities (should be reduced)
    const depletedState = {
        x: 0, y: 0,
        lastGathered: Date.now(),
        depletionLevel: 0.8,
        totalGathers: 15,
        regenerationTimer: 0
    };
    
    const depletedQuantity = resourceManager.calculateGatherQuantity(woodResource, depletedState);
    assert(depletedQuantity >= 1, 'Depleted quantity should still be at least 1');
    
    // Test that depletion generally reduces quantity
    const avgFreshQuantity = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const depletedQuantities = [];
    for (let i = 0; i < 20; i++) {
        depletedQuantities.push(resourceManager.calculateGatherQuantity(woodResource, depletedState));
    }
    const avgDepletedQuantity = depletedQuantities.reduce((a, b) => a + b, 0) / depletedQuantities.length;
    
    assert(avgDepletedQuantity <= avgFreshQuantity, 'Depletion should generally reduce quantity');
});

// Test serialization and deserialization
runTest('Serialization and deserialization', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Create some location states
    const state1 = {
        x: 0, y: 0,
        lastGathered: Date.now(),
        depletionLevel: 0.3,
        totalGathers: 5,
        regenerationTimer: 0
    };
    
    const state2 = {
        x: 1, y: 1,
        lastGathered: Date.now() - 60000,
        depletionLevel: 0.7,
        totalGathers: 12,
        regenerationTimer: 0
    };
    
    resourceManager.updateLocationState(0, 0, state1);
    resourceManager.updateLocationState(1, 1, state2);
    
    // Test serialization
    const serialized = resourceManager.serializeLocationStates();
    assert(serialized, 'Should serialize location states');
    assert(typeof serialized === 'string', 'Serialized data should be string');
    
    // Test deserialization
    const newResourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    const deserializeResult = newResourceManager.deserializeLocationStates(serialized);
    assert(deserializeResult.success, `Deserialization failed: ${deserializeResult.message}`);
    
    // Verify states were restored
    const restoredState1 = newResourceManager.getLocationState(0, 0);
    const restoredState2 = newResourceManager.getLocationState(1, 1);
    
    assert(restoredState1.depletionLevel === 0.3, 'State 1 depletion not restored');
    assert(restoredState1.totalGathers === 5, 'State 1 gathers not restored');
    assert(restoredState2.depletionLevel === 0.7, 'State 2 depletion not restored');
    assert(restoredState2.totalGathers === 12, 'State 2 gathers not restored');
});

// Test cleanup system
runTest('Cleanup system', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Set low limits for testing
    resourceManager.maxLocationStates = 5;
    resourceManager.locationExpiryTime = 1000; // 1 second
    
    // Add many location states
    for (let i = 0; i < 10; i++) {
        const state = {
            x: i, y: i,
            lastGathered: Date.now() - (i * 200), // Stagger times
            depletionLevel: 0.1 * i,
            totalGathers: i,
            regenerationTimer: 0
        };
        resourceManager.updateLocationState(i, i, state);
    }
    
    assert(resourceManager.locationStates.size === 10, 'Should have 10 location states');
    
    // Force cleanup
    resourceManager.forceCleanup();
    
    assert(resourceManager.locationStates.size <= resourceManager.maxLocationStates, 
           'Cleanup should reduce location states to max limit');
    
    // Test cleanup stats
    const stats = resourceManager.getCleanupStats();
    assert(stats.totalLocationStates >= 0, 'Stats should show location count');
    assert(stats.maxLocationStates === 5, 'Stats should show max limit');
});

// Test performance metrics
runTest('Performance metrics', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Add some location states
    for (let i = 0; i < 5; i++) {
        const state = {
            x: i, y: i,
            lastGathered: Date.now() - (i * 60000), // Different times
            depletionLevel: 0.2 * i,
            totalGathers: i + 1,
            regenerationTimer: 0
        };
        resourceManager.updateLocationState(i, i, state);
    }
    
    const metrics = resourceManager.getPerformanceMetrics();
    assert(metrics.totalLocationStates === 5, 'Should report correct total states');
    assert(metrics.activeLocations >= 0, 'Should report active locations');
    assert(metrics.depletedLocations >= 0, 'Should report depleted locations');
    assert(metrics.recentlyAccessed >= 0, 'Should report recently accessed');
    assert(metrics.memoryUsageEstimate > 0, 'Should estimate memory usage');
});

// Test invalid inputs and edge cases
runTest('Invalid inputs and edge cases', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Test invalid resource type
    const invalidResource = resourceManager.getResourceInfo('invalid');
    assert(invalidResource === null, 'Invalid resource should return null');
    
    // Test invalid biome type
    const invalidBiome = resourceManager.getBiomeResources('invalid');
    assert(invalidBiome === null, 'Invalid biome should return null');
    
    // Test invalid glyph
    const invalidGlyph = resourceManager.getResourceGlyph('invalid');
    assert(invalidGlyph === null, 'Invalid glyph should return null');
    
    // Test invalid color
    const invalidColor = resourceManager.getResourceColor('invalid');
    assert(invalidColor === null, 'Invalid color should return null');
    
    // Test deserialization with invalid data
    const invalidResult = resourceManager.deserializeLocationStates('invalid json');
    assert(!invalidResult.success, 'Invalid JSON should fail deserialization');
    
    // Test deserialization with null data
    const nullResult = resourceManager.deserializeLocationStates(null);
    assert(nullResult.success, 'Null data should succeed with no-op');
});

// Print test results
console.log('=== Test Results ===');
console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
console.log(`Success rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);

if (testsPassed === testsTotal) {
    console.log('✓ All ResourceManager unit tests passed!');
} else {
    console.log('✗ Some tests failed. Check output above for details.');
    process.exit(1);
}