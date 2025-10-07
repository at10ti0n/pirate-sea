console.log('Testing examination system...');

try {
    const ResourceManager = require('./resource-manager');
    console.log('ResourceManager loaded successfully');
    
    const SeededRandom = require('./seeded-random');
    console.log('SeededRandom loaded successfully');
    
    // Mock map generator
    class MockMapGenerator {
        constructor() {
            this.seed = 12345;
        }
        
        getBiomeAt(x, y) {
            return { biome: 'forest' };
        }
    }
    
    const mockMapGenerator = new MockMapGenerator();
    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);
    
    console.log('ResourceManager created successfully');
    
    // Test examination
    const result = resourceManager.examineLocation(0, 0);
    console.log('Examination result:', JSON.stringify(result, null, 2));
    
} catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
}