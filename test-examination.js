// Test script for resource examination system
const ResourceManager = require('./resource-manager');
const SeededRandom = require('./seeded-random');

// Mock map generator for testing
class MockMapGenerator {
    constructor() {
        this.seed = 12345;
    }
    
    getBiomeAt(x, y) {
        // Return different biomes for testing
        if (x === 0 && y === 0) return { biome: 'forest' };
        if (x === 1 && y === 0) return { biome: 'desert' };
        if (x === 2 && y === 0) return { biome: 'mountain' };
        if (x === 3 && y === 0) return { biome: 'ocean' };
        return { biome: 'forest' };
    }
}

// Test the examination system
function testExaminationSystem() {
    console.log('Testing Resource Examination System...\n');
    
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    // Test examining different biomes
    const testLocations = [
        { x: 0, y: 0, name: 'Forest' },
        { x: 1, y: 0, name: 'Desert' },
        { x: 2, y: 0, name: 'Mountain' },
        { x: 3, y: 0, name: 'Ocean' }
    ];
    
    testLocations.forEach(location => {
        console.log(`=== Examining ${location.name} at (${location.x}, ${location.y}) ===`);
        
        const result = resourceManager.examineLocation(location.x, location.y);
        
        if (result.success) {
            console.log(`Biome: ${result.biomeName}`);
            console.log(`Message: ${result.message}`);
            
            if (result.resources.length > 0) {
                console.log('Available Resources:');
                result.resources.forEach(resource => {
                    console.log(`  - ${resource.name} (${resource.type})`);
                    console.log(`    Description: ${resource.description}`);
                    console.log(`    Rarity: ${resource.rarity}`);
                    console.log(`    Probability: ${resource.probability}%`);
                    console.log(`    Quantity: ${resource.baseQuantity[0]}-${resource.baseQuantity[1]}`);
                });
                
                if (result.gatheringInfo) {
                    const info = result.gatheringInfo;
                    console.log('Gathering Information:');
                    console.log(`  Success Rate: ${info.successRate}%`);
                    console.log(`  Base Success Rate: ${info.baseSuccessRate}%`);
                    console.log(`  Depletion Level: ${info.depletionLevel}%`);
                    console.log(`  Difficulty: ${info.difficultyHint}`);
                    console.log(`  Regeneration Time: ${info.regenerationTime} minutes`);
                }
            } else {
                console.log('No resources available');
            }
        } else {
            console.log(`Error: ${result.message}`);
        }
        
        console.log('');
    });
    
    // Test gathering help
    console.log('=== Testing Gathering Help ===');
    const helpInfo = resourceManager.getGatheringHelp();
    console.log(`Title: ${helpInfo.title}`);
    console.log('Sections:');
    helpInfo.sections.forEach(section => {
        console.log(`  ${section.title}:`);
        section.content.forEach(item => {
            console.log(`    - ${item}`);
        });
    });
    console.log('');
    
    // Test detailed resource info
    console.log('=== Testing Detailed Resource Info ===');
    const resourceTypes = ['wood', 'stone', 'ore', 'berries'];
    resourceTypes.forEach(resourceType => {
        const resourceInfo = resourceManager.getDetailedResourceInfo(resourceType);
        if (resourceInfo) {
            console.log(`${resourceInfo.name} (${resourceType}):`);
            console.log(`  Description: ${resourceInfo.description}`);
            console.log(`  Rarity: ${resourceInfo.rarityInfo.name} - ${resourceInfo.rarityInfo.description}`);
            console.log(`  Found in ${resourceInfo.foundIn.length} biomes:`);
            resourceInfo.foundIn.forEach(biome => {
                console.log(`    - ${biome.biomeName}: ${biome.probability}% chance, ${biome.baseSuccessRate}% success`);
            });
            console.log(`  Uses: ${resourceInfo.uses.join(', ')}`);
        }
        console.log('');
    });
    
    console.log('Examination system test completed!');
}

// Run the test
if (require.main === module) {
    testExaminationSystem();
}

module.exports = { testExaminationSystem };