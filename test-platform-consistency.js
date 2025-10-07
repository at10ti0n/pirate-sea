#!/usr/bin/env node

// Simple cross-platform consistency test
const ResourceManager = require('./resource-manager.js');
const SeededRandom = require('./seeded-random.js');

// Mock map generator
const mockMapGenerator = {
    getBiomeAt: (x, y) => ({ biome: 'forest' }),
    generateResourceGlyph: null
};

const seededRandom = new SeededRandom(12345);
const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);

console.log('=== Cross-Platform Resource Glyph Test ===');
const resourceTypes = ['stone', 'sand', 'wood', 'hay', 'ore', 'berries', 'reeds'];

resourceTypes.forEach(type => {
    const webGlyph = resourceManager.getResourceGlyph(type, 'web');
    const terminalGlyph = resourceManager.getResourceGlyph(type, 'terminal');
    const webDepleted = resourceManager.getResourceGlyph(type, 'web', true);
    const terminalDepleted = resourceManager.getResourceGlyph(type, 'terminal', true);
    
    console.log(`${type}:`);
    console.log(`  Web: ${webGlyph} (normal) | ${webDepleted} (depleted)`);
    console.log(`  Terminal: ${terminalGlyph} (normal) | ${terminalDepleted} (depleted)`);
});

console.log('\n=== Resource Color Test ===');
resourceTypes.forEach(type => {
    const normalColor = resourceManager.getResourceColor(type, false);
    const depletedColor = resourceManager.getResourceColor(type, true);
    console.log(`${type}: ${normalColor} (normal) | ${depletedColor} (depleted)`);
});

console.log('\n=== Biome Resource Configuration Test ===');
const biomes = ['forest', 'desert', 'mountain'];
biomes.forEach(biome => {
    const config = resourceManager.getBiomeResources(biome);
    if (config) {
        console.log(`${biome}:`);
        config.resources.forEach(resource => {
            console.log(`  ${resource.type}: weight=${resource.weight}, qty=[${resource.baseQuantity[0]}-${resource.baseQuantity[1]}]`);
        });
    }
});

console.log('\nTest completed successfully!');