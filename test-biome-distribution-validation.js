// Biome Distribution Validation Test
// Tests the updated map.js thresholds to ensure consistent 80% water coverage

const ROT = require('rot-js');

// Include SeededRandom class
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
        this.m = 0x80000000;
        this.a = 1103515245;
        this.c = 12345;
        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    }
    
    setSeed(seed) {
        this.seed = seed;
        this.state = seed;
    }
    
    random() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state / (this.m - 1);
    }
}

// Load the updated MapGenerator class
const fs = require('fs');
const path = require('path');
const mapJsContent = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
eval(mapJsContent);

function analyzeBiomeDistribution(mapGenerator, sampleSize = 1000, centerX = 0, centerY = 0) {
    console.log(`Analyzing ${sampleSize}x${sampleSize} tiles with updated thresholds...`);
    
    const biomeCount = {};
    const totalTiles = sampleSize * sampleSize;
    let processedTiles = 0;
    
    const startX = centerX - Math.floor(sampleSize / 2);
    const startY = centerY - Math.floor(sampleSize / 2);
    
    for (let y = startY; y < startY + sampleSize; y++) {
        for (let x = startX; x < startX + sampleSize; x++) {
            const tile = mapGenerator.generateChunkAt(x, y);
            
            if (!biomeCount[tile.biome]) {
                biomeCount[tile.biome] = 0;
            }
            biomeCount[tile.biome]++;
            processedTiles++;
            
            if (processedTiles % 25000 === 0) {
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
    
    return {
        totalTiles,
        distribution,
        waterCoverage,
        deviation: waterCoverage - 80
    };
}

function runValidationTests() {
    console.log('=== BIOME DISTRIBUTION VALIDATION TESTS ===\n');
    
    const testSeeds = [12345, 98765, 55555, 11111, 99999];
    const results = [];
    const targetWaterCoverage = 80;
    const tolerance = 2; // ±2%
    
    for (const seed of testSeeds) {
        console.log(`\nTesting with seed: ${seed}`);
        
        const mapGenerator = new MapGenerator(48, 28, seed);
        mapGenerator.generateMap();
        
        const analysis = analyzeBiomeDistribution(mapGenerator, 1000);
        
        const withinTolerance = Math.abs(analysis.deviation) <= tolerance;
        
        results.push({
            seed,
            waterCoverage: analysis.waterCoverage,
            deviation: analysis.deviation,
            withinTolerance,
            distribution: analysis.distribution
        });
        
        console.log(`Water coverage: ${analysis.waterCoverage.toFixed(2)}% (deviation: ${analysis.deviation.toFixed(2)}%)`);
        console.log(`Result: ${withinTolerance ? 'PASS' : 'FAIL'} (target: 80% ±${tolerance}%)`);
        
        // Show biome distribution
        console.log('Biome distribution:');
        Object.entries(analysis.distribution)
            .sort((a, b) => b[1].percentage - a[1].percentage)
            .forEach(([biome, data]) => {
                if (data.percentage > 0.1) {
                    console.log(`  ${biome}: ${data.percentage.toFixed(2)}%`);
                }
            });
    }
    
    // Summary
    const passedTests = results.filter(r => r.withinTolerance).length;
    const averageWaterCoverage = results.reduce((sum, r) => sum + r.waterCoverage, 0) / results.length;
    const maxDeviation = Math.max(...results.map(r => Math.abs(r.deviation)));
    
    console.log('\n=== VALIDATION SUMMARY ===');
    console.log(`Tests passed: ${passedTests}/${results.length}`);
    console.log(`Average water coverage: ${averageWaterCoverage.toFixed(2)}%`);
    console.log(`Maximum deviation: ${maxDeviation.toFixed(2)}%`);
    console.log(`Target achieved: ${passedTests === results.length ? 'YES' : 'NO'}`);
    
    if (passedTests === results.length) {
        console.log('\n✓ All validation tests passed! The optimized thresholds consistently achieve 80% water coverage.');
    } else {
        console.log('\n✗ Some validation tests failed. Consider further threshold adjustments.');
    }
    
    return {
        passedTests,
        totalTests: results.length,
        averageWaterCoverage,
        maxDeviation,
        allPassed: passedTests === results.length,
        results
    };
}

// Test biome diversity and realistic transitions
function testBiomeDiversity() {
    console.log('\n=== BIOME DIVERSITY AND TRANSITION TESTS ===\n');
    
    const mapGenerator = new MapGenerator(48, 28, 12345);
    mapGenerator.generateMap();
    
    const analysis = analyzeBiomeDistribution(mapGenerator, 500);
    
    // Count biomes with significant presence (>1%)
    const significantBiomes = Object.entries(analysis.distribution)
        .filter(([biome, data]) => data.percentage > 1)
        .sort((a, b) => b[1].percentage - a[1].percentage);
    
    console.log('Biomes with >1% coverage:');
    significantBiomes.forEach(([biome, data]) => {
        console.log(`  ${biome}: ${data.percentage.toFixed(2)}%`);
    });
    
    console.log(`\nBiome diversity: ${significantBiomes.length} biomes with significant presence`);
    
    // Test for realistic biome transitions by sampling adjacent tiles
    console.log('\nTesting biome transition realism...');
    let transitionTests = 0;
    let realisticTransitions = 0;
    
    for (let i = 0; i < 1000; i++) {
        const x = Math.floor(Math.random() * 100) - 50;
        const y = Math.floor(Math.random() * 100) - 50;
        
        const centerTile = mapGenerator.generateChunkAt(x, y);
        const rightTile = mapGenerator.generateChunkAt(x + 1, y);
        
        transitionTests++;
        
        // Check for realistic transitions (e.g., ocean->beach, beach->land)
        if ((centerTile.biome === 'ocean' && rightTile.biome === 'beach') ||
            (centerTile.biome === 'beach' && rightTile.biome !== 'ocean') ||
            (centerTile.biome === rightTile.biome)) {
            realisticTransitions++;
        }
    }
    
    const transitionRealism = (realisticTransitions / transitionTests) * 100;
    console.log(`Realistic transitions: ${transitionRealism.toFixed(1)}% (${realisticTransitions}/${transitionTests})`);
    
    return {
        significantBiomes: significantBiomes.length,
        transitionRealism,
        distribution: analysis.distribution
    };
}

// Main execution
async function runAllValidationTests() {
    console.log('BIOME DISTRIBUTION VALIDATION\n');
    console.log('Testing updated thresholds in map.js for consistent 80% water coverage...\n');
    
    try {
        // Run water coverage validation
        const validationResults = runValidationTests();
        
        // Run biome diversity tests
        const diversityResults = testBiomeDiversity();
        
        console.log('\n=== FINAL VALIDATION REPORT ===');
        console.log(`Water coverage validation: ${validationResults.allPassed ? 'PASSED' : 'FAILED'}`);
        console.log(`Average water coverage: ${validationResults.averageWaterCoverage.toFixed(2)}%`);
        console.log(`Biome diversity: ${diversityResults.significantBiomes} significant biomes`);
        console.log(`Transition realism: ${diversityResults.transitionRealism.toFixed(1)}%`);
        
        if (validationResults.allPassed && diversityResults.significantBiomes >= 5) {
            console.log('\n✅ VALIDATION SUCCESSFUL: Optimized thresholds achieve target water coverage with good biome diversity!');
        } else {
            console.log('\n❌ VALIDATION ISSUES: Further optimization may be needed.');
        }
        
        return {
            validationResults,
            diversityResults,
            success: validationResults.allPassed && diversityResults.significantBiomes >= 5
        };
        
    } catch (error) {
        console.error('Validation failed:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    runAllValidationTests()
        .then(results => {
            process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = {
    analyzeBiomeDistribution,
    runValidationTests,
    testBiomeDiversity,
    runAllValidationTests
};