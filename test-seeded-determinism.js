#!/usr/bin/env node

// Test seeded determinism across platforms
const ResourceManager = require('./resource-manager.js');
const PlayerInventory = require('./player-inventory.js');
const SeededRandom = require('./seeded-random.js');

// Mock map generator that mimics both web and terminal behavior
class MockMapGenerator {
    constructor(seed) {
        this.seed = seed;
        this.seededRandom = new SeededRandom(seed);
    }
    
    getBiomeAt(x, y) {
        // Simple deterministic biome mapping
        const hash = (x * 73856093 + y * 19349663 + this.seed) % 1000;
        if (hash < 300) return { biome: 'forest' };
        if (hash < 500) return { biome: 'desert' };
        if (hash < 700) return { biome: 'mountain' };
        if (hash < 850) return { biome: 'beach' };
        return { biome: 'jungle' };
    }
}

function testSeededDeterminism() {
    console.log('=== Seeded Determinism Test ===\n');
    
    const seed = 54321;
    const testPositions = [[0, 0], [1, 0], [0, 1], [5, 5], [10, 10]];
    
    // Create two identical instances (simulating web and terminal)
    const mapGen1 = new MockMapGenerator(seed);
    const resourceManager1 = new ResourceManager(mapGen1, mapGen1.seededRandom);
    const inventory1 = new PlayerInventory(1000);
    
    const mapGen2 = new MockMapGenerator(seed);
    const resourceManager2 = new ResourceManager(mapGen2, mapGen2.seededRandom);
    const inventory2 = new PlayerInventory(1000);
    
    let totalTests = 0;
    let consistentResults = 0;
    
    console.log('Testing gathering consistency with same seed...\n');
    
    testPositions.forEach(([x, y]) => {
        const biome1 = mapGen1.getBiomeAt(x, y);
        const biome2 = mapGen2.getBiomeAt(x, y);
        
        console.log(`Position (${x}, ${y}) - Biome: ${biome1.biome}`);
        
        // Test multiple gathering attempts at same location
        for (let attempt = 0; attempt < 3; attempt++) {
            const result1 = resourceManager1.attemptGather(x, y, inventory1);
            const result2 = resourceManager2.attemptGather(x, y, inventory2);
            
            totalTests++;
            
            const isConsistent = (
                result1.success === result2.success &&
                result1.resource === result2.resource &&
                result1.quantity === result2.quantity
            );
            
            if (isConsistent) {
                consistentResults++;
            }
            
            console.log(`  Attempt ${attempt + 1}:`);
            console.log(`    Instance 1: ${result1.success ? 'SUCCESS' : 'FAIL'} - ${result1.message}`);
            console.log(`    Instance 2: ${result2.success ? 'SUCCESS' : 'FAIL'} - ${result2.message}`);
            console.log(`    Consistent: ${isConsistent ? 'YES' : 'NO'}`);
        }
        console.log('');
    });
    
    const consistencyRate = Math.round((consistentResults / totalTests) * 100);
    console.log(`Overall Consistency: ${consistentResults}/${totalTests} (${consistencyRate}%)\n`);
    
    // Test inventory state consistency
    console.log('=== Inventory State Consistency ===');
    const inv1Resources = inventory1.getAllResources();
    const inv2Resources = inventory2.getAllResources();
    
    console.log('Instance 1 inventory:', inv1Resources);
    console.log('Instance 2 inventory:', inv2Resources);
    
    const inventoryMatch = JSON.stringify(inv1Resources) === JSON.stringify(inv2Resources);
    console.log(`Inventory consistency: ${inventoryMatch ? 'PASS' : 'FAIL'}\n`);
    
    return {
        gatheringConsistency: consistencyRate,
        inventoryConsistency: inventoryMatch,
        totalTests: totalTests,
        consistentResults: consistentResults
    };
}

function testResourceGlyphDeterminism() {
    console.log('=== Resource Glyph Determinism Test ===\n');
    
    const seed = 12345;
    const mapGen = new MockMapGenerator(seed);
    const resourceManager = new ResourceManager(mapGen, mapGen.seededRandom);
    
    // Test that resource glyphs are deterministic for same positions
    const testPositions = [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]];
    
    testPositions.forEach(([x, y]) => {
        const biome = mapGen.getBiomeAt(x, y);
        console.log(`Position (${x}, ${y}) - Biome: ${biome.biome}`);
        
        // Test multiple calls to same position should return same glyph
        if (mapGen.generateResourceGlyph) {
            const glyph1 = mapGen.generateResourceGlyph(x, y, biome.biome, resourceManager);
            const glyph2 = mapGen.generateResourceGlyph(x, y, biome.biome, resourceManager);
            
            const glyphMatch = JSON.stringify(glyph1) === JSON.stringify(glyph2);
            console.log(`  Glyph consistency: ${glyphMatch ? 'PASS' : 'FAIL'}`);
            if (glyph1.resourceType) {
                console.log(`  Resource type: ${glyph1.resourceType}`);
            }
        }
    });
    console.log('');
}

// Run tests
const results = testSeededDeterminism();
testResourceGlyphDeterminism();

console.log('=== Test Summary ===');
console.log(`Gathering Consistency: ${results.gatheringConsistency}%`);
console.log(`Inventory Consistency: ${results.inventoryConsistency ? 'PASS' : 'FAIL'}`);
console.log(`Total Tests: ${results.totalTests}`);
console.log(`Consistent Results: ${results.consistentResults}`);

if (results.gatheringConsistency >= 95 && results.inventoryConsistency) {
    console.log('\n✅ Cross-platform determinism test PASSED');
} else {
    console.log('\n❌ Cross-platform determinism test FAILED');
    console.log('Issues detected that need to be addressed for cross-platform consistency');
}