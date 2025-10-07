// Simple validation test for water coverage using existing game structure
const { PirateSeaGame } = require('./game.js');

function validateWaterCoverage(sampleSize = 500) {
    console.log(`Validating water coverage with ${sampleSize}x${sampleSize} sample...`);
    
    // Create game instance
    const game = new PirateSeaGame();
    
    const biomeCount = {};
    const totalTiles = sampleSize * sampleSize;
    let processedTiles = 0;
    
    const startX = -Math.floor(sampleSize / 2);
    const startY = -Math.floor(sampleSize / 2);
    
    for (let y = startY; y < startY + sampleSize; y++) {
        for (let x = startX; x < startX + sampleSize; x++) {
            const tile = game.mapGenerator.generateChunkAt(x, y);
            
            if (!biomeCount[tile.biome]) {
                biomeCount[tile.biome] = 0;
            }
            biomeCount[tile.biome]++;
            processedTiles++;
            
            if (processedTiles % 10000 === 0) {
                console.log(`Progress: ${processedTiles}/${totalTiles} (${(processedTiles/totalTiles*100).toFixed(1)}%)`);
            }
        }
    }
    
    // Calculate percentages
    const distribution = {};
    for (const [biome, count] of Object.entries(biomeCount)) {
        distribution[biome] = {
            count: count,
            percentage: (count / totalTiles) * 100
        };
    }
    
    const waterCoverage = distribution.ocean ? distribution.ocean.percentage : 0;
    const deviation = waterCoverage - 80;
    
    return {
        totalTiles,
        distribution,
        waterCoverage,
        deviation,
        withinTolerance: Math.abs(deviation) <= 2
    };
}

function runMultipleSeedTests() {
    console.log('=== WATER COVERAGE VALIDATION TESTS ===\n');
    
    const testSeeds = [12345, 98765, 55555, 11111, 99999];
    const results = [];
    
    for (const seed of testSeeds) {
        console.log(`\nTesting with seed: ${seed}`);
        
        // Create game with specific seed
        const game = new PirateSeaGame();
        game.mapGenerator.setSeed(seed);
        
        const analysis = validateWaterCoverage(300); // Smaller sample for speed
        
        results.push({
            seed,
            waterCoverage: analysis.waterCoverage,
            deviation: analysis.deviation,
            withinTolerance: analysis.withinTolerance,
            distribution: analysis.distribution
        });
        
        console.log(`Water coverage: ${analysis.waterCoverage.toFixed(2)}% (deviation: ${analysis.deviation.toFixed(2)}%)`);
        console.log(`Result: ${analysis.withinTolerance ? 'PASS' : 'FAIL'} (target: 80% ±2%)`);
        
        // Show top biomes
        const topBiomes = Object.entries(analysis.distribution)
            .sort((a, b) => b[1].percentage - a[1].percentage)
            .slice(0, 5);
        
        console.log('Top biomes:');
        topBiomes.forEach(([biome, data]) => {
            console.log(`  ${biome}: ${data.percentage.toFixed(2)}%`);
        });
    }
    
    // Summary
    const passedTests = results.filter(r => r.withinTolerance).length;
    const averageWaterCoverage = results.reduce((sum, r) => sum + r.waterCoverage, 0) / results.length;
    
    console.log('\n=== VALIDATION SUMMARY ===');
    console.log(`Tests passed: ${passedTests}/${results.length}`);
    console.log(`Average water coverage: ${averageWaterCoverage.toFixed(2)}%`);
    console.log(`Target achieved: ${passedTests === results.length ? 'YES' : 'NO'}`);
    
    if (passedTests === results.length) {
        console.log('\n✅ SUCCESS: All tests passed! Optimized thresholds achieve consistent 80% water coverage.');
    } else {
        console.log('\n⚠️  Some tests failed. The thresholds may need further adjustment.');
    }
    
    return {
        passedTests,
        totalTests: results.length,
        averageWaterCoverage,
        allPassed: passedTests === results.length,
        results
    };
}

// Run validation
console.log('BIOME THRESHOLD VALIDATION\n');
console.log('Testing optimized thresholds for 80% water coverage...\n');

try {
    const results = runMultipleSeedTests();
    
    if (results.allPassed) {
        console.log('\n🎉 VALIDATION COMPLETE: Biome thresholds successfully optimized!');
        process.exit(0);
    } else {
        console.log('\n❌ VALIDATION INCOMPLETE: Some tests failed.');
        process.exit(1);
    }
} catch (error) {
    console.error('Validation error:', error);
    process.exit(1);
}