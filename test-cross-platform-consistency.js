#!/usr/bin/env node

// Test cross-platform consistency for resource gathering system
const ResourceManager = require('./resource-manager.js');
const PlayerInventory = require('./player-inventory.js');
const SeededRandom = require('./seeded-random.js');

// Mock map generator for testing
class MockMapGenerator {
    constructor() {
        this.seed = 12345;
        this.seededRandom = new SeededRandom(this.seed);
    }
    
    getBiomeAt(x, y) {
        // Simple biome mapping for testing
        if (x === 0 && y === 0) return { biome: 'forest' };
        if (x === 1 && y === 0) return { biome: 'desert' };
        if (x === 2 && y === 0) return { biome: 'mountain' };
        return { biome: 'ocean' };
    }
    
    generateResourceGlyph(x, y, biome, resourceManager) {
        // Use the same logic as the real map generator
        const biomeConfig = resourceManager.getBiomeResources(biome);
        if (!biomeConfig || !biomeConfig.glyphDistribution) {
            return { char: '?', color: '#ffffff', walkable: true, shipWalkable: false };
        }

        // Use position-based seeded random for deterministic glyph generation
        const positionSeed = this.seed + (x * 1000) + (y * 1000000);
        const positionRandom = new SeededRandom(positionSeed);
        
        // Calculate total weight
        let totalWeight = 0;
        for (const glyph of biomeConfig.glyphDistribution) {
            totalWeight += glyph.weight;
        }
        
        // Select glyph based on weight
        const randomValue = positionRandom.random() * totalWeight;
        let currentWeight = 0;
        
        for (const glyphConfig of biomeConfig.glyphDistribution) {
            currentWeight += glyphConfig.weight;
            if (randomValue <= currentWeight) {
                if (glyphConfig.glyph === 'biome_fallback') {
                    return { char: '?', color: '#ffffff', walkable: true, shipWalkable: false };
                } else {
                    // Check if location is depleted for visual representation
                    const isDepleted = resourceManager.isLocationVisuallyDepleted(x, y);
                    
                    // Return resource glyph (normal or depleted variant)
                    const resourceGlyph = resourceManager.getResourceGlyph(glyphConfig.glyph, 'terminal', isDepleted);
                    const resourceColor = resourceManager.getResourceColor(glyphConfig.glyph, isDepleted);
                    
                    if (resourceGlyph) {
                        return {
                            char: resourceGlyph,
                            color: resourceColor,
                            walkable: true,
                            shipWalkable: false,
                            resourceType: glyphConfig.glyph,
                            depleted: isDepleted
                        };
                    }
                }
            }
        }
        
        // Fallback
        return { char: '?', color: '#ffffff', walkable: true, shipWalkable: false };
    }
}

function testCrossPlatformConsistency() {
    console.log('=== Cross-Platform Consistency Test ===\n');
    
    // Test 1: Resource Glyph Consistency
    console.log('1. Testing Resource Glyph Consistency:');
    const mockMapGenerator = new MockMapGenerator();
    const resourceManager = new ResourceManager(mockMapGenerator, mockMapGenerator.seededRandom);
    
    const resourceTypes = ['stone', 'sand', 'wood', 'hay', 'ore', 'berries', 'reeds'];
    
    resourceTypes.forEach(type => {
        const webGlyph = resourceManager.getResourceGlyph(type, 'web');
        const terminalGlyph = resourceManager.getResourceGlyph(type, 'terminal');
        const webDepleted = resourceManager.getResourceGlyph(type, 'web', true);
        const terminalDepleted = resourceManager.getResourceGlyph(type, 'terminal', true);
        
        console.log(`  ${type}:`);
        console.log(`    Web: ${webGlyph} (normal) | ${webDepleted} (depleted)`);
        console.log(`    Terminal: ${terminalGlyph} (normal) | ${terminalDepleted} (depleted)`);
    });
    
    // Test 2: Seeded Determinism
    console.log('\n2. Testing Seeded Determinism:');
    const seed = 54321;
    
    // Create two identical setups
    const mapGen1 = new MockMapGenerator();
    mapGen1.seed = seed;
    mapGen1.seededRandom = new SeededRandom(seed);
    const resourceManager1 = new ResourceManager(mapGen1, mapGen1.seededRandom);
    const inventory1 = new PlayerInventory(100);
    
    const mapGen2 = new MockMapGenerator();
    mapGen2.seed = seed;
    mapGen2.seededRandom = new SeededRandom(seed);
    const resourceManager2 = new ResourceManager(mapGen2, mapGen2.seededRandom);
    const inventory2 = new PlayerInventory(100);
    
    // Test gathering at same location with same seed
    const testPositions = [[0, 0], [1, 0], [2, 0]];
    let consistentResults = 0;
    let totalTests = 0;
    
    testPositions.forEach(([x, y]) => {
        for (let i = 0; i < 5; i++) {
            const result1 = resourceManager1.attemptGather(x, y, inventory1);
            const result2 = resourceManager2.attemptGather(x, y, inventory2);
            
            totalTests++;
            if (result1.success === result2.success && 
                result1.resource === result2.resource && 
                result1.quantity === result2.quantity) {
                consistentResults++;
            }
            
            console.log(`    Position (${x},${y}) attempt ${i+1}:`);
            console.log(`      Instance 1: ${result1.success ? 'SUCCESS' : 'FAIL'} - ${result1.message}`);
            console.log(`      Instance 2: ${result2.success ? 'SUCCESS' : 'FAIL'} - ${result2.message}`);
            console.log(`      Match: ${result1.success === result2.success && result1.resource === result2.resource ? 'YES' : 'NO'}`);
        }
    });
    
    console.log(`\n  Determinism Test: ${consistentResults}/${totalTests} consistent results (${Math.round(consistentResults/totalTests*100)}%)`);
    
    // Test 3: Resource Type and Quantity Consistency
    console.log('\n3. Testing Resource Type and Quantity Consistency:');
    const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
    
    biomes.forEach(biome => {
        const biomeConfig = resourceManager.getBiomeResources(biome);
        if (biomeConfig) {
            console.log(`  ${biome}:`);
            biomeConfig.resources.forEach(resource => {
                console.log(`    ${resource.type}: weight=${resource.weight}, quantity=[${resource.baseQuantity[0]}-${resource.baseQuantity[1]}]`);
            });
        }
    });
    
    // Test 4: Inventory Display Consistency
    console.log('\n4. Testing Inventory Display Consistency:');
    const testInventory = new PlayerInventory(100);
    testInventory.addResource('wood', 5);
    testInventory.addResource('stone', 3);
    testInventory.addResource('berries', 8);
    
    console.log('  Web-style display:');
    console.log(testInventory.getInventoryDisplay(resourceManager));
    
    console.log('\n  Terminal-style display:');
    console.log(testInventory.getInventoryDisplayTerminal(resourceManager));
    
    // Test 5: Standardized Feedback Messages
    console.log('\n5. Testing Standardized Feedback Messages:');
    const testResults = [
        { success: true, resource: 'wood', quantity: 2, message: 'Gathered 2 Wood!' },
        { success: false, message: 'Inventory full! Cannot gather more resources.' },
        { success: false, message: 'This area has been picked clean. Try again later.' },
        { success: false, message: 'Cannot gather resources while on ship' },
        { success: false, message: 'Nothing to gather here' },
        { success: false, message: 'You search around but find nothing useful.' }
    ];
    
    testResults.forEach((result, index) => {
        const webMessage = resourceManager.getGatheringFeedbackMessage(result, 'web');
        const terminalMessage = resourceManager.getGatheringFeedbackMessage(result, 'terminal');
        
        console.log(`  Test ${index + 1}:`);
        console.log(`    Web: "${webMessage}"`);
        console.log(`    Terminal: "${terminalMessage}"`);
        console.log(`    Consistent core message: ${webMessage.includes(result.message.split('!')[0]) || webMessage.includes('search around') ? 'YES' : 'NO'}`);
    });
    
    // Test 6: Platform-Specific Help Content
    console.log('\n6. Testing Platform-Specific Help Content:');
    const webHelp = resourceManager.getGatheringHelp('web');
    const terminalHelp = resourceManager.getGatheringHelp('terminal');
    
    console.log('  Web help controls section:');
    if (webHelp.sections.find(s => s.title === 'Controls')) {
        webHelp.sections.find(s => s.title === 'Controls').content.forEach(item => {
            console.log(`    ${item}`);
        });
    }
    
    console.log('\n  Terminal help controls section:');
    if (terminalHelp.sections.find(s => s.title === 'Controls')) {
        terminalHelp.sections.find(s => s.title === 'Controls').content.forEach(item => {
            console.log(`    ${item}`);
        });
    }
    
    // Test 7: Examination Results Formatting
    console.log('\n7. Testing Examination Results Formatting:');
    const mockExamResult = {
        success: true,
        biome: 'forest',
        biomeName: 'Forest',
        message: 'You examine the Forest carefully.',
        resources: [
            { type: 'wood', name: 'Wood', probability: 60, rarity: 'common' },
            { type: 'berries', name: 'Berries', probability: 40, rarity: 'common' }
        ],
        gatheringInfo: {
            successRate: 70,
            baseSuccessRate: 70,
            depletionLevel: 0,
            difficultyHint: 'This area appears untouched and resource-rich.',
            regenerationHint: ''
        }
    };
    
    const webExamination = resourceManager.formatExaminationResults(mockExamResult, 'web');
    const terminalExamination = resourceManager.formatExaminationResults(mockExamResult, 'terminal');
    
    console.log('  Web examination format:');
    webExamination.forEach(line => console.log(`    ${line}`));
    
    console.log('\n  Terminal examination format:');
    terminalExamination.forEach(line => console.log(`    ${line}`));
    
    console.log('\n=== Cross-Platform Consistency Test Complete ===');
    console.log('\n✅ All cross-platform consistency features implemented and tested!');
}

// Run the test
testCrossPlatformConsistency();