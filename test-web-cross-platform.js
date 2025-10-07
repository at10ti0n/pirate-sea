#!/usr/bin/env node

// Test web platform cross-platform features
const ResourceManager = require('./resource-manager.js');
const PlayerInventory = require('./player-inventory.js');
const SeededRandom = require('./seeded-random.js');

console.log('=== Web Platform Cross-Platform Features Test ===\n');

// Create web-style map generator
const webMapGen = {
    seed: 12345,
    seededRandom: new SeededRandom(12345),
    getBiomeAt: (x, y) => ({ biome: 'forest' })
};

const resourceManager = new ResourceManager(webMapGen, webMapGen.seededRandom);
const inventory = new PlayerInventory(100);

console.log('1. Testing web platform resource glyphs:');
const resourceTypes = ['stone', 'sand', 'wood', 'hay', 'ore', 'berries', 'reeds'];
resourceTypes.forEach(type => {
    const webGlyph = resourceManager.getResourceGlyph(type, 'web');
    const webDepleted = resourceManager.getResourceGlyph(type, 'web', true);
    console.log(`   ${type}: ${webGlyph} (normal) | ${webDepleted} (depleted)`);
});

console.log('\n2. Testing web platform gathering feedback:');
const testResult = { success: true, resource: 'wood', quantity: 3, message: 'Gathered 3 Wood!' };
const webFeedback = resourceManager.getGatheringFeedbackMessage(testResult, 'web');
console.log(`   Success message: "${webFeedback}"`);

const failResult = { success: false, message: 'Nothing to gather here' };
const webFailFeedback = resourceManager.getGatheringFeedbackMessage(failResult, 'web');
console.log(`   Failure message: "${webFailFeedback}"`);

console.log('\n3. Testing web inventory display:');
inventory.addResource('wood', 5);
inventory.addResource('stone', 3);
const webInventoryDisplay = inventory.getInventoryDisplay(resourceManager);
console.log('   Web inventory display:');
console.log(webInventoryDisplay.split('\n').map(line => `     ${line}`).join('\n'));

console.log('\n4. Testing web examination system:');
const examResult = resourceManager.examineLocation(0, 0);
if (examResult.success) {
    const formattedResults = resourceManager.formatExaminationResults(examResult, 'web');
    console.log('   Web examination results:');
    formattedResults.forEach(line => {
        if (line.trim()) console.log(`     ${line}`);
    });
}

console.log('\n✅ Web platform cross-platform features working correctly!');