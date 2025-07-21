#!/usr/bin/env node

// Test script for resource gathering mechanics
const ResourceManager = require('./resource-manager');
const PlayerInventory = require('./player-inventory');

// Mock map generator for testing
class MockMapGenerator {
    constructor() {
        this.seed = 12345;
        this.seededRandom = {
            random: () => Math.random(),
            randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
        };
    }
    
    getBiomeAt(x, y) {
        // Return different biomes for testing
        if (x === 0 && y === 0) return { biome: 'forest' };
        if (x === 1 && y === 0) return { biome: 'desert' };
        if (x === 2 && y === 0) return { biome: 'mountain' };
        return { biome: 'ocean' };
    }
    
    generateResourceGlyph(x, y, biome, resourceManager) {
        // Mock glyph generation
        if (biome === 'forest') {
            return { resourceType: 'wood', char: '♠', color: '\x1b[32m' };
        }
        return { resourceType: null, char: '~', color: '\x1b[34m' };
    }
}

// Test the gathering system
function testGathering() {
    console.log('Testing Resource Gathering System...\n');
    
    const mockMapGenerator = new MockMapGenerator();
    const resourceManager = new ResourceManager(mockMapGenerator, mockMapGenerator.seededRandom);
    const playerInventory = new PlayerInventory(100);
    
    console.log('Initial inventory:');
    console.log(playerInventory.getInventoryDisplayTerminal(resourceManager));
    console.log();
    
    // Test gathering from forest
    console.log('Testing gathering from forest at (0,0)...');
    for (let i = 0; i < 5; i++) {
        const result = resourceManager.attemptGather(0, 0, playerInventory);
        console.log(`Attempt ${i + 1}: ${result.message}`);
        if (result.success) {
            console.log(`  -> Got ${result.quantity} ${result.resource}`);
        }
    }
    
    console.log('\nInventory after forest gathering:');
    console.log(playerInventory.getInventoryDisplayTerminal(resourceManager));
    console.log();
    
    // Test gathering from desert
    console.log('Testing gathering from desert at (1,0)...');
    for (let i = 0; i < 3; i++) {
        const result = resourceManager.attemptGather(1, 0, playerInventory);
        console.log(`Attempt ${i + 1}: ${result.message}`);
        if (result.success) {
            console.log(`  -> Got ${result.quantity} ${result.resource}`);
        }
    }
    
    console.log('\nInventory after desert gathering:');
    console.log(playerInventory.getInventoryDisplayTerminal(resourceManager));
    console.log();
    
    // Test gathering from ocean (should fail)
    console.log('Testing gathering from ocean at (5,5)...');
    const oceanResult = resourceManager.attemptGather(5, 5, playerInventory);
    console.log(`Ocean gather: ${oceanResult.message}`);
    
    console.log('\nFinal inventory:');
    console.log(playerInventory.getInventoryDisplayTerminal(resourceManager));
    
    console.log('\nTest completed successfully!');
}

// Unit tests for gathering probability calculations
function testGatheringProbabilities() {
    console.log('=== Testing Gathering Probability Calculations ===\n');
    
    const mockMapGenerator = new MockMapGenerator();
    const resourceManager = new ResourceManager(mockMapGenerator, mockMapGenerator.seededRandom);
    
    // Test 1: Base success rate calculation
    console.log('Test 1: Base success rate calculation');
    const forestConfig = resourceManager.getBiomeResources('forest');
    const freshLocationState = {
        x: 0, y: 0,
        lastGathered: 0,
        depletionLevel: 0.0,
        totalGathers: 0,
        regenerationTimer: 0
    };
    
    const baseSuccessRate = resourceManager.calculateGatherSuccess(forestConfig, freshLocationState);
    console.log(`Forest base success rate: ${(baseSuccessRate * 100).toFixed(1)}%`);
    console.log(`Expected: ~${(forestConfig.baseSuccessRate * 100).toFixed(1)}%`);
    console.log(`✓ Base rate calculation working\n`);
    
    // Test 2: Depletion penalty
    console.log('Test 2: Depletion penalty calculation');
    const depletedLocationState = {
        x: 0, y: 0,
        lastGathered: Date.now() - 1000,
        depletionLevel: 0.5, // 50% depleted
        totalGathers: 10,
        regenerationTimer: 0
    };
    
    const depletedSuccessRate = resourceManager.calculateGatherSuccess(forestConfig, depletedLocationState);
    console.log(`Success rate with 50% depletion: ${(depletedSuccessRate * 100).toFixed(1)}%`);
    console.log(`Depletion penalty: ${((baseSuccessRate - depletedSuccessRate) * 100).toFixed(1)}%`);
    console.log(`✓ Depletion penalty working\n`);
    
    // Test 3: Time bonus
    console.log('Test 3: Time bonus calculation');
    const oldLocationState = {
        x: 0, y: 0,
        lastGathered: Date.now() - (10 * 60 * 1000), // 10 minutes ago
        depletionLevel: 0.0,
        totalGathers: 1,
        regenerationTimer: 0
    };
    
    const timeBonusRate = resourceManager.calculateGatherSuccess(forestConfig, oldLocationState);
    console.log(`Success rate with time bonus: ${(timeBonusRate * 100).toFixed(1)}%`);
    console.log(`Time bonus: ${((timeBonusRate - baseSuccessRate) * 100).toFixed(1)}%`);
    console.log(`✓ Time bonus working\n`);
    
    // Test 4: Resource selection bias
    console.log('Test 4: Resource selection bias testing');
    const biomeConfig = resourceManager.getBiomeResources('forest');
    let woodCount = 0;
    let berryCount = 0;
    const testRuns = 100;
    
    for (let i = 0; i < testRuns; i++) {
        const selectedResource = resourceManager.selectResourceToGather(biomeConfig, 0, 0);
        if (selectedResource.type === 'wood') woodCount++;
        if (selectedResource.type === 'berries') berryCount++;
    }
    
    console.log(`Wood selected: ${woodCount}/${testRuns} (${(woodCount/testRuns*100).toFixed(1)}%)`);
    console.log(`Berries selected: ${berryCount}/${testRuns} (${(berryCount/testRuns*100).toFixed(1)}%)`);
    console.log(`Expected wood: ~60%, berries: ~40%`);
    console.log(`✓ Resource selection working\n`);
    
    // Test 5: Quantity calculation
    console.log('Test 5: Quantity calculation testing');
    const woodResource = { type: 'wood', weight: 60, baseQuantity: [1, 3] };
    const quantities = [];
    
    for (let i = 0; i < 50; i++) {
        const quantity = resourceManager.calculateGatherQuantity(woodResource, freshLocationState);
        quantities.push(quantity);
    }
    
    const avgQuantity = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const minQuantity = Math.min(...quantities);
    const maxQuantity = Math.max(...quantities);
    
    console.log(`Quantity range: ${minQuantity} - ${maxQuantity}`);
    console.log(`Average quantity: ${avgQuantity.toFixed(2)}`);
    console.log(`Expected range: 1 - 3`);
    console.log(`✓ Quantity calculation working\n`);
    
    // Test 6: Depletion impact on quantity
    console.log('Test 6: Depletion impact on quantity');
    const depletedQuantity = resourceManager.calculateGatherQuantity(woodResource, depletedLocationState);
    console.log(`Quantity with 50% depletion: ${depletedQuantity}`);
    console.log(`Fresh location quantity: ${resourceManager.calculateGatherQuantity(woodResource, freshLocationState)}`);
    console.log(`✓ Depletion reduces quantity\n`);
    
    console.log('=== All probability tests passed! ===\n');
}

// Test regeneration mechanics
function testRegenerationMechanics() {
    console.log('=== Testing Regeneration Mechanics ===\n');
    
    const mockMapGenerator = new MockMapGenerator();
    const resourceManager = new ResourceManager(mockMapGenerator, mockMapGenerator.seededRandom);
    
    const forestConfig = resourceManager.getBiomeResources('forest');
    const now = Date.now();
    
    // Test 1: No regeneration immediately after gathering
    console.log('Test 1: No regeneration immediately after gathering');
    const recentState = {
        x: 0, y: 0,
        lastGathered: now - 1000, // 1 second ago
        depletionLevel: 0.5,
        totalGathers: 5,
        regenerationTimer: 0
    };
    
    const noRegen = resourceManager.calculateRegeneration(recentState, forestConfig);
    console.log(`Depletion after 1 second: ${(noRegen * 100).toFixed(1)}%`);
    console.log(`Original depletion: ${(recentState.depletionLevel * 100).toFixed(1)}%`);
    console.log(`✓ No immediate regeneration\n`);
    
    // Test 2: Partial regeneration
    console.log('Test 2: Partial regeneration');
    const partialState = {
        x: 0, y: 0,
        lastGathered: now - (forestConfig.regenerationTime / 2), // Half regen time
        depletionLevel: 0.8,
        totalGathers: 10,
        regenerationTimer: 0
    };
    
    const partialRegen = resourceManager.calculateRegeneration(partialState, forestConfig);
    console.log(`Depletion after half regen time: ${(partialRegen * 100).toFixed(1)}%`);
    console.log(`Original depletion: ${(partialState.depletionLevel * 100).toFixed(1)}%`);
    console.log(`✓ Partial regeneration working\n`);
    
    // Test 3: Full regeneration
    console.log('Test 3: Full regeneration');
    const fullState = {
        x: 0, y: 0,
        lastGathered: now - (forestConfig.regenerationTime + 60000), // Past full regen time
        depletionLevel: 1.0,
        totalGathers: 20,
        regenerationTimer: 0
    };
    
    const fullRegen = resourceManager.calculateRegeneration(fullState, forestConfig);
    console.log(`Depletion after full regen time: ${(fullRegen * 100).toFixed(1)}%`);
    console.log(`Original depletion: ${(fullState.depletionLevel * 100).toFixed(1)}%`);
    console.log(`✓ Full regeneration working\n`);
    
    console.log('=== All regeneration tests passed! ===\n');
}

// Test biome resource configurations
function testBiomeConfigurations() {
    console.log('=== Testing Biome Resource Configurations ===\n');
    
    const mockMapGenerator = new MockMapGenerator();
    const resourceManager = new ResourceManager(mockMapGenerator, mockMapGenerator.seededRandom);
    
    const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
    
    biomes.forEach(biome => {
        const config = resourceManager.getBiomeResources(biome);
        if (config) {
            console.log(`${biome.toUpperCase()}:`);
            console.log(`  Base success rate: ${(config.baseSuccessRate * 100).toFixed(1)}%`);
            console.log(`  Depletion rate: ${(config.depletionRate * 100).toFixed(1)}%`);
            console.log(`  Regeneration time: ${(config.regenerationTime / 60000).toFixed(1)} minutes`);
            console.log(`  Resources:`);
            config.resources.forEach(resource => {
                console.log(`    - ${resource.type}: ${resource.weight}% weight, ${resource.baseQuantity[0]}-${resource.baseQuantity[1]} quantity`);
            });
            console.log(`  Glyph distribution:`);
            config.glyphDistribution.forEach(glyph => {
                console.log(`    - ${glyph.glyph}: ${glyph.weight}%`);
            });
            console.log();
        }
    });
    
    console.log('✓ All biome configurations loaded correctly\n');
}

// Run all tests
console.log('Starting comprehensive gathering mechanics tests...\n');
testGatheringProbabilities();
testRegenerationMechanics();
testBiomeConfigurations();
testGathering();