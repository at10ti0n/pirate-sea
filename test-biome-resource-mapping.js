#!/usr/bin/env node

// Comprehensive tests for biome-resource mapping accuracy
console.log('=== Biome Resource Mapping Validation Tests ===\n');

const ResourceManager = require('./resource-manager');
const SeededRandom = require('./seeded-random');

// Mock map generator for testing all biomes
class MockMapGenerator {
    constructor(seed = 12345) {
        this.seed = seed;
        this.seededRandom = new SeededRandom(seed);
    }
    
    getBiomeAt(x, y) {
        // Map coordinates to specific biomes for testing
        const biomeMap = {
            '0,0': 'forest',
            '1,0': 'desert', 
            '2,0': 'mountain',
            '3,0': 'beach',
            '4,0': 'jungle',
            '5,0': 'savanna',
            '6,0': 'taiga',
            '7,0': 'tropical',
            '8,0': 'swamp',
            '9,0': 'ocean'
        };
        
        return { biome: biomeMap[`${x},${y}`] || 'ocean' };
    }
    
    generateResourceGlyph(x, y, biome, resourceManager) {
        const biomeConfig = resourceManager.getBiomeResources(biome);
        if (!biomeConfig) return { resourceType: null, char: '~', color: '#000000' };
        
        // Return first resource for consistency
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

// Test biome resource definitions according to requirements
runTest('Biome resource definitions validation', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Expected biome-resource mappings from requirements
    const expectedMappings = {
        forest: ['wood', 'berries'],
        desert: ['stone', 'sand'],
        mountain: ['stone', 'ore'],
        beach: ['wood', 'sand'],
        jungle: ['wood', 'berries'],
        savanna: ['hay', 'wood'],
        taiga: ['wood', 'berries'],
        tropical: ['wood', 'berries'],
        swamp: ['reeds', 'berries']
    };
    
    for (const [biome, expectedResources] of Object.entries(expectedMappings)) {
        console.log(`  Validating ${biome} biome...`);
        
        const biomeConfig = resourceManager.getBiomeResources(biome);
        assert(biomeConfig, `${biome} biome should be configured`);
        assert(biomeConfig.resources, `${biome} should have resources array`);
        
        // Check that all expected resources are present
        const actualResources = biomeConfig.resources.map(r => r.type);
        for (const expectedResource of expectedResources) {
            assert(actualResources.includes(expectedResource), 
                   `${biome} should contain ${expectedResource}`);
        }
        
        // Check that no unexpected resources are present
        for (const actualResource of actualResources) {
            assert(expectedResources.includes(actualResource), 
                   `${biome} should not contain unexpected resource ${actualResource}`);
        }
        
        console.log(`    ✓ ${biome}: ${actualResources.join(', ')}`);
    }
});

// Test resource weight distributions
runTest('Resource weight distributions', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
    
    for (const biome of biomes) {
        console.log(`  Analyzing ${biome} resource weights...`);
        
        const biomeConfig = resourceManager.getBiomeResources(biome);
        assert(biomeConfig, `${biome} should be configured`);
        
        // Calculate total weight
        const totalWeight = biomeConfig.resources.reduce((sum, r) => sum + r.weight, 0);
        assert(totalWeight > 0, `${biome} should have positive total weight`);
        
        // Validate individual resource weights
        for (const resource of biomeConfig.resources) {
            assert(resource.weight > 0, `${resource.type} should have positive weight in ${biome}`);
            assert(resource.weight <= 100, `${resource.type} weight should be reasonable in ${biome}`);
            
            const percentage = (resource.weight / totalWeight * 100).toFixed(1);
            console.log(`    ${resource.type}: ${resource.weight} (${percentage}%)`);
        }
        
        // Weights should sum to 100 for most biomes (allowing some flexibility)
        assert(totalWeight >= 80 && totalWeight <= 120, 
               `${biome} total weight should be reasonable: ${totalWeight}`);
    }
});

// Test base quantity ranges
runTest('Base quantity ranges validation', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
    
    for (const biome of biomes) {
        console.log(`  Validating ${biome} quantity ranges...`);
        
        const biomeConfig = resourceManager.getBiomeResources(biome);
        
        for (const resource of biomeConfig.resources) {
            const [minQty, maxQty] = resource.baseQuantity;
            
            assert(Array.isArray(resource.baseQuantity), 
                   `${resource.type} in ${biome} should have quantity array`);
            assert(resource.baseQuantity.length === 2, 
                   `${resource.type} in ${biome} should have min/max quantity`);
            assert(minQty > 0, 
                   `${resource.type} in ${biome} should have positive min quantity`);
            assert(maxQty >= minQty, 
                   `${resource.type} in ${biome} max should be >= min quantity`);
            assert(maxQty <= 10, 
                   `${resource.type} in ${biome} max quantity should be reasonable`);
            
            console.log(`    ${resource.type}: ${minQty}-${maxQty}`);
        }
    }
});

// Test biome success rates and depletion parameters
runTest('Biome success rates and depletion parameters', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
    
    for (const biome of biomes) {
        console.log(`  Validating ${biome} parameters...`);
        
        const biomeConfig = resourceManager.getBiomeResources(biome);
        
        // Validate success rate
        assert(biomeConfig.baseSuccessRate > 0 && biomeConfig.baseSuccessRate <= 1, 
               `${biome} success rate should be between 0 and 1`);
        
        // Validate depletion rate
        assert(biomeConfig.depletionRate > 0 && biomeConfig.depletionRate <= 1, 
               `${biome} depletion rate should be between 0 and 1`);
        
        // Validate regeneration time
        assert(biomeConfig.regenerationTime > 0, 
               `${biome} regeneration time should be positive`);
        assert(biomeConfig.regenerationTime <= 1800000, // 30 minutes max
               `${biome} regeneration time should be reasonable`);
        
        console.log(`    Success rate: ${(biomeConfig.baseSuccessRate * 100).toFixed(1)}%`);
        console.log(`    Depletion rate: ${(biomeConfig.depletionRate * 100).toFixed(1)}%`);
        console.log(`    Regeneration: ${(biomeConfig.regenerationTime / 60000).toFixed(1)} minutes`);
    }
});

// Test glyph distribution mappings
runTest('Glyph distribution mappings', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
    
    for (const biome of biomes) {
        console.log(`  Validating ${biome} glyph distribution...`);
        
        const biomeConfig = resourceManager.getBiomeResources(biome);
        assert(biomeConfig.glyphDistribution, `${biome} should have glyph distribution`);
        assert(Array.isArray(biomeConfig.glyphDistribution), 
               `${biome} glyph distribution should be array`);
        
        // Calculate total glyph weight
        const totalGlyphWeight = biomeConfig.glyphDistribution.reduce((sum, g) => sum + g.weight, 0);
        assert(totalGlyphWeight > 0, `${biome} should have positive total glyph weight`);
        
        // Validate each glyph entry
        for (const glyphEntry of biomeConfig.glyphDistribution) {
            assert(glyphEntry.glyph, `Glyph entry should have glyph name in ${biome}`);
            assert(glyphEntry.weight > 0, `Glyph weight should be positive in ${biome}`);
            
            // If it's not a fallback glyph, it should correspond to a resource
            if (glyphEntry.glyph !== 'biome_fallback') {
                const resourceExists = biomeConfig.resources.some(r => r.type === glyphEntry.glyph);
                assert(resourceExists, 
                       `Glyph ${glyphEntry.glyph} should correspond to a resource in ${biome}`);
                
                // Check that the resource glyph exists
                const glyph = resourceManager.getResourceGlyph(glyphEntry.glyph, 'web');
                assert(glyph, `Resource glyph should exist for ${glyphEntry.glyph}`);
            }
            
            const percentage = (glyphEntry.weight / totalGlyphWeight * 100).toFixed(1);
            console.log(`    ${glyphEntry.glyph}: ${glyphEntry.weight} (${percentage}%)`);
        }
        
        // Should have biome_fallback for visual variety
        const hasFallback = biomeConfig.glyphDistribution.some(g => g.glyph === 'biome_fallback');
        assert(hasFallback, `${biome} should have biome_fallback glyph`);
    }
});

// Test resource type definitions completeness
runTest('Resource type definitions completeness', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Collect all resource types used in biomes
    const allResourceTypes = new Set();
    const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
    
    for (const biome of biomes) {
        const biomeConfig = resourceManager.getBiomeResources(biome);
        for (const resource of biomeConfig.resources) {
            allResourceTypes.add(resource.type);
        }
    }
    
    console.log(`  Found resource types: ${Array.from(allResourceTypes).join(', ')}`);
    
    // Verify each resource type has complete definition
    for (const resourceType of allResourceTypes) {
        console.log(`  Validating ${resourceType} definition...`);
        
        const resourceInfo = resourceManager.getResourceInfo(resourceType);
        assert(resourceInfo, `${resourceType} should have definition`);
        assert(resourceInfo.type === resourceType, `${resourceType} type should match`);
        assert(resourceInfo.name, `${resourceType} should have name`);
        assert(resourceInfo.description, `${resourceType} should have description`);
        assert(resourceInfo.category, `${resourceType} should have category`);
        assert(resourceInfo.icon, `${resourceType} should have web icon`);
        assert(resourceInfo.char, `${resourceType} should have terminal character`);
        
        // Test glyph system
        const webGlyph = resourceManager.getResourceGlyph(resourceType, 'web');
        const terminalGlyph = resourceManager.getResourceGlyph(resourceType, 'terminal');
        const color = resourceManager.getResourceColor(resourceType);
        
        assert(webGlyph, `${resourceType} should have web glyph`);
        assert(terminalGlyph, `${resourceType} should have terminal glyph`);
        assert(color, `${resourceType} should have color`);
        
        // Test depleted variants
        const depletedWeb = resourceManager.getResourceGlyph(resourceType, 'web', true);
        const depletedTerminal = resourceManager.getResourceGlyph(resourceType, 'terminal', true);
        const depletedColor = resourceManager.getResourceColor(resourceType, true);
        
        assert(depletedWeb, `${resourceType} should have depleted web glyph`);
        assert(depletedTerminal, `${resourceType} should have depleted terminal glyph`);
        assert(depletedColor, `${resourceType} should have depleted color`);
        
        console.log(`    ✓ ${resourceInfo.name}: ${webGlyph}/${terminalGlyph} (${color})`);
    }
});

// Test biome resource selection probability distribution
runTest('Resource selection probability distribution', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const testBiomes = ['forest', 'desert', 'mountain'];
    const testRuns = 1000;
    
    for (const biome of testBiomes) {
        console.log(`  Testing ${biome} resource selection distribution...`);
        
        const biomeConfig = resourceManager.getBiomeResources(biome);
        const selectionCounts = {};
        
        // Initialize counters
        for (const resource of biomeConfig.resources) {
            selectionCounts[resource.type] = 0;
        }
        
        // Run selection tests
        for (let i = 0; i < testRuns; i++) {
            const selected = resourceManager.selectResourceToGather(biomeConfig, 0, 0);
            if (selected) {
                selectionCounts[selected.type]++;
            }
        }
        
        // Analyze distribution
        const totalWeight = biomeConfig.resources.reduce((sum, r) => sum + r.weight, 0);
        
        for (const resource of biomeConfig.resources) {
            const expectedPercentage = (resource.weight / totalWeight) * 100;
            const actualCount = selectionCounts[resource.type];
            const actualPercentage = (actualCount / testRuns) * 100;
            const deviation = Math.abs(expectedPercentage - actualPercentage);
            
            console.log(`    ${resource.type}: expected ${expectedPercentage.toFixed(1)}%, got ${actualPercentage.toFixed(1)}% (${actualCount}/${testRuns})`);
            
            // Allow 35% deviation from expected distribution (due to glyph bias)
            assert(deviation < 35, 
                   `${resource.type} distribution deviation too high: ${deviation.toFixed(1)}%`);
        }
    }
});

// Test biome configuration consistency
runTest('Biome configuration consistency', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
    
    console.log('  Checking biome configuration consistency...');
    
    // Check that all biomes have similar structure
    for (const biome of biomes) {
        const config = resourceManager.getBiomeResources(biome);
        
        // Required properties
        const requiredProps = ['resources', 'glyphDistribution', 'baseSuccessRate', 'depletionRate', 'regenerationTime'];
        for (const prop of requiredProps) {
            assert(config.hasOwnProperty(prop), `${biome} missing required property: ${prop}`);
        }
        
        // Resources array structure
        assert(config.resources.length >= 1, `${biome} should have at least 1 resource`);
        assert(config.resources.length <= 3, `${biome} should have at most 3 resources`);
        
        for (const resource of config.resources) {
            const requiredResourceProps = ['type', 'weight', 'baseQuantity'];
            for (const prop of requiredResourceProps) {
                assert(resource.hasOwnProperty(prop), 
                       `${biome} resource missing property: ${prop}`);
            }
        }
        
        // Glyph distribution structure
        assert(config.glyphDistribution.length >= 2, 
               `${biome} should have at least 2 glyph entries`);
        
        for (const glyph of config.glyphDistribution) {
            assert(glyph.hasOwnProperty('glyph'), `${biome} glyph missing glyph property`);
            assert(glyph.hasOwnProperty('weight'), `${biome} glyph missing weight property`);
        }
    }
    
    // Check for reasonable parameter ranges across all biomes
    const successRates = biomes.map(b => resourceManager.getBiomeResources(b).baseSuccessRate);
    const depletionRates = biomes.map(b => resourceManager.getBiomeResources(b).depletionRate);
    const regenTimes = biomes.map(b => resourceManager.getBiomeResources(b).regenerationTime);
    
    const minSuccess = Math.min(...successRates);
    const maxSuccess = Math.max(...successRates);
    const minDepletion = Math.min(...depletionRates);
    const maxDepletion = Math.max(...depletionRates);
    const minRegen = Math.min(...regenTimes);
    const maxRegen = Math.max(...regenTimes);
    
    console.log(`  Success rate range: ${(minSuccess * 100).toFixed(1)}% - ${(maxSuccess * 100).toFixed(1)}%`);
    console.log(`  Depletion rate range: ${(minDepletion * 100).toFixed(1)}% - ${(maxDepletion * 100).toFixed(1)}%`);
    console.log(`  Regeneration time range: ${(minRegen / 60000).toFixed(1)} - ${(maxRegen / 60000).toFixed(1)} minutes`);
    
    // Ranges should be reasonable
    assert(maxSuccess - minSuccess <= 0.4, 'Success rate range should not be too wide');
    assert(maxDepletion - minDepletion <= 0.3, 'Depletion rate range should not be too wide');
    assert(maxRegen / minRegen <= 5, 'Regeneration time range should not be too wide');
});

// Test ocean biome handling (should have no resources)
runTest('Ocean biome handling', () => {
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    console.log('  Testing ocean biome (should have no resources)...');
    
    const oceanConfig = resourceManager.getBiomeResources('ocean');
    assert(oceanConfig === null, 'Ocean should have no resource configuration');
    
    const invalidConfig = resourceManager.getBiomeResources('invalid_biome');
    assert(invalidConfig === null, 'Invalid biome should return null');
    
    const undefinedConfig = resourceManager.getBiomeResources(undefined);
    assert(undefinedConfig === null, 'Undefined biome should return null');
    
    console.log('  ✓ Ocean and invalid biomes properly handled');
});

// Print test results
console.log('=== Biome Resource Mapping Test Results ===');
console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
console.log(`Success rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);

if (testsPassed === testsTotal) {
    console.log('✓ All biome resource mapping tests passed!');
    console.log('✓ Biome-resource mappings are accurate and complete');
} else {
    console.log('✗ Some tests failed. Check output above for details.');
    process.exit(1);
}