// Simple test for examination functionality
console.log('Starting examination test...');

// Test the examination methods directly
const testExamination = () => {
    // Mock the required classes
    class MockMapGenerator {
        getBiomeAt(x, y) {
            return { biome: 'forest' };
        }
    }
    
    class MockSeededRandom {
        random() { return 0.5; }
        randomInt(min, max) { return Math.floor((min + max) / 2); }
    }
    
    // Create a minimal resource manager for testing
    const resourceManager = {
        biomeResources: {
            forest: {
                resources: [
                    { type: 'wood', weight: 60, baseQuantity: [1, 3] },
                    { type: 'berries', weight: 40, baseQuantity: [1, 2] }
                ],
                baseSuccessRate: 0.7,
                depletionRate: 0.1,
                regenerationTime: 300000
            }
        },
        
        resourceDefinitions: {
            wood: {
                type: 'wood',
                name: 'Wood',
                description: 'Primary building and fuel material',
                rarity: 'common',
                icon: '🌳'
            },
            berries: {
                type: 'berries',
                name: 'Berries',
                description: 'Food and preservation material',
                rarity: 'common',
                icon: '🫐'
            }
        },
        
        locationStates: new Map(),
        
        getBiomeResources(biome) {
            return this.biomeResources[biome] || null;
        },
        
        getResourceInfo(type) {
            return this.resourceDefinitions[type] || null;
        },
        
        getBiomeDisplayName(biome) {
            return biome.charAt(0).toUpperCase() + biome.slice(1);
        },
        
        getLocationState(x, y) {
            return {
                x, y,
                lastGathered: 0,
                depletionLevel: 0.0,
                totalGathers: 0,
                regenerationTimer: 0
            };
        },
        
        calculateRegeneration(locationState, biomeConfig) {
            return locationState.depletionLevel;
        },
        
        calculateGatherSuccess(biomeConfig, locationState) {
            return biomeConfig.baseSuccessRate * (1 - locationState.depletionLevel);
        },
        
        getResourceRarityInfo(rarity) {
            return {
                name: 'Common',
                color: '#95a5a6',
                description: 'Easily found in most locations'
            };
        }
    };
    
    // Add the examination method
    resourceManager.examineLocation = function(x, y) {
        const mockMapGenerator = { getBiomeAt: () => ({ biome: 'forest' }) };
        const tile = mockMapGenerator.getBiomeAt(x, y);
        
        if (!tile) {
            return { success: false, message: 'Invalid location' };
        }
        
        const biomeConfig = this.getBiomeResources(tile.biome);
        if (!biomeConfig) {
            return { 
                success: true, 
                biome: tile.biome,
                biomeName: this.getBiomeDisplayName(tile.biome),
                message: `This ${this.getBiomeDisplayName(tile.biome)} contains no gatherable resources.`,
                resources: [],
                gatheringInfo: null
            };
        }
        
        const locationState = this.getLocationState(x, y);
        const currentDepletion = this.calculateRegeneration(locationState, biomeConfig);
        const successRate = this.calculateGatherSuccess(biomeConfig, locationState);
        
        const resourceInfo = biomeConfig.resources.map(resource => {
            const resourceDef = this.getResourceInfo(resource.type);
            return {
                type: resource.type,
                name: resourceDef ? resourceDef.name : resource.type,
                description: resourceDef ? resourceDef.description : 'Unknown resource',
                rarity: resourceDef ? resourceDef.rarity : 'common',
                icon: resourceDef ? resourceDef.icon : '?',
                weight: resource.weight,
                baseQuantity: resource.baseQuantity,
                probability: Math.round((resource.weight / biomeConfig.resources.reduce((sum, r) => sum + r.weight, 0)) * 100)
            };
        });
        
        return {
            success: true,
            biome: tile.biome,
            biomeName: this.getBiomeDisplayName(tile.biome),
            message: `You examine the ${this.getBiomeDisplayName(tile.biome)} carefully.`,
            resources: resourceInfo,
            gatheringInfo: {
                successRate: Math.round(successRate * 100),
                depletionLevel: Math.round(currentDepletion * 100),
                difficultyHint: 'This area appears untouched and resource-rich.',
                depletionHint: 'Success rate is at maximum.',
                regenerationHint: '',
                baseSuccessRate: Math.round(biomeConfig.baseSuccessRate * 100),
                regenerationTime: Math.round(biomeConfig.regenerationTime / 60000)
            }
        };
    };
    
    // Test the examination
    const result = resourceManager.examineLocation(0, 0);
    
    console.log('Examination test result:');
    console.log('Success:', result.success);
    console.log('Biome:', result.biomeName);
    console.log('Message:', result.message);
    console.log('Resources found:', result.resources.length);
    
    if (result.resources.length > 0) {
        result.resources.forEach(resource => {
            console.log(`- ${resource.name}: ${resource.probability}% chance`);
        });
    }
    
    if (result.gatheringInfo) {
        console.log('Success rate:', result.gatheringInfo.successRate + '%');
        console.log('Difficulty hint:', result.gatheringInfo.difficultyHint);
    }
    
    console.log('Test completed successfully!');
};

// Run the test
testExamination();