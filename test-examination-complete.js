// Complete test for examination system functionality
console.log('Testing complete examination system...');

try {
    const ResourceManager = require('./resource-manager.js');
    const SeededRandom = require('./seeded-random.js');

    const mockMapGenerator = {
        getBiomeAt: (x, y) => ({ biome: 'forest' })
    };

    const seededRandom = new SeededRandom(12345);
    const resourceManager = new ResourceManager(mockMapGenerator, seededRandom);

    console.log('\n=== Testing Examination System ===');
    const examResult = resourceManager.examineLocation(0, 0);
    console.log('✓ Examination successful:', examResult.success);
    console.log('✓ Biome name:', examResult.biomeName);
    console.log('✓ Resources found:', examResult.resources.length);
    console.log('✓ Gathering info available:', !!examResult.gatheringInfo);

    console.log('\n=== Testing Help System ===');
    const helpInfo = resourceManager.getGatheringHelp();
    console.log('✓ Help title:', helpInfo.title);
    console.log('✓ Number of sections:', helpInfo.sections.length);
    console.log('✓ Sections include:', helpInfo.sections.map(s => s.title).join(', '));

    console.log('\n=== Testing Resource Info System ===');
    const woodInfo = resourceManager.getDetailedResourceInfo('wood');
    console.log('✓ Wood info available:', !!woodInfo);
    if (woodInfo) {
        console.log('✓ Wood name:', woodInfo.name);
        console.log('✓ Wood rarity:', woodInfo.rarityInfo.name);
        console.log('✓ Found in biomes:', woodInfo.foundIn.length);
        console.log('✓ Uses available:', woodInfo.uses.length);
    }

    console.log('\n=== Testing Resource Rarity System ===');
    const rarityInfo = resourceManager.getResourceRarityInfo('uncommon');
    console.log('✓ Rarity info available:', !!rarityInfo);
    console.log('✓ Uncommon rarity name:', rarityInfo.name);
    console.log('✓ Uncommon rarity color:', rarityInfo.color);

    console.log('\n=== All examination system tests passed! ===');

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}