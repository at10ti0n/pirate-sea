// Biome Distribution Analysis and Optimization Tool
// This script analyzes current biome distribution and optimizes thresholds for 80% water coverage

// Import required modules
const ROT = require('rot-js');

// Include SeededRandom class
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
        this.m = 0x80000000; // 2**31
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

// Include the MapGenerator class directly (since it's not exported)
// We'll load it by evaluating the map.js file
const fs = require('fs');
const path = require('path');

// Read and evaluate map.js to get the MapGenerator class
const mapJsContent = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
eval(mapJsContent);

class BiomeDistributionAnalyzer {
    constructor() {
        this.sampleSize = 1000; // 1000x1000 tiles as specified in task
        this.targetWaterCoverage = 0.8; // 80% water coverage target
        this.tolerance = 0.02; // ±2% tolerance for water coverage
    }

    // Analyze current biome distribution over a large sample area
    analyzeBiomeDistribution(mapGenerator, centerX = 0, centerY = 0, size = this.sampleSize) {
        console.log(`Analyzing biome distribution over ${size}x${size} tiles...`);
        
        const biomeCount = {};
        const totalTiles = size * size;
        let processedTiles = 0;
        
        // Initialize biome counters
        const biomes = ['ocean', 'beach', 'forest', 'jungle', 'desert', 'savanna', 'taiga', 'tropical', 'mountain', 'snow', 'swamp'];
        biomes.forEach(biome => biomeCount[biome] = 0);
        
        // Sample tiles in a grid pattern
        const startX = centerX - Math.floor(size / 2);
        const startY = centerY - Math.floor(size / 2);
        
        for (let y = startY; y < startY + size; y++) {
            for (let x = startX; x < startX + size; x++) {
                const tile = mapGenerator.generateChunkAt(x, y);
                if (tile && biomeCount.hasOwnProperty(tile.biome)) {
                    biomeCount[tile.biome]++;
                } else if (tile) {
                    // Handle unknown biomes
                    if (!biomeCount[tile.biome]) {
                        biomeCount[tile.biome] = 0;
                    }
                    biomeCount[tile.biome]++;
                }
                processedTiles++;
                
                // Progress reporting for large samples
                if (processedTiles % 10000 === 0) {
                    console.log(`Progress: ${processedTiles}/${totalTiles} tiles (${(processedTiles/totalTiles*100).toFixed(1)}%)`);
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
        
        // Calculate water coverage (ocean + any other water biomes)
        const waterCoverage = distribution.ocean ? distribution.ocean.percentage : 0;
        
        return {
            totalTiles,
            distribution,
            waterCoverage,
            targetWaterCoverage: this.targetWaterCoverage * 100,
            deviation: waterCoverage - (this.targetWaterCoverage * 100)
        };
    }

    // Test different elevation thresholds to find optimal water coverage
    optimizeElevationThresholds(seed = 12345) {
        console.log('Starting elevation threshold optimization...');
        
        const results = [];
        
        // Test different ocean elevation thresholds
        const oceanThresholds = [0.25, 0.3, 0.35, 0.4, 0.45, 0.5];
        const beachThresholds = [0.4, 0.42, 0.45, 0.47, 0.5];
        
        for (const oceanThreshold of oceanThresholds) {
            for (const beachThreshold of beachThresholds) {
                if (beachThreshold <= oceanThreshold) continue; // Beach must be higher than ocean
                
                console.log(`Testing ocean threshold: ${oceanThreshold}, beach threshold: ${beachThreshold}`);
                
                // Create a modified map generator with test thresholds
                const testGenerator = new TestMapGenerator(48, 28, seed, oceanThreshold, beachThreshold);
                testGenerator.generateMap();
                
                // Analyze distribution with smaller sample for optimization
                const analysis = this.analyzeBiomeDistribution(testGenerator, 0, 0, 200);
                
                results.push({
                    oceanThreshold,
                    beachThreshold,
                    waterCoverage: analysis.waterCoverage,
                    deviation: Math.abs(analysis.deviation),
                    distribution: analysis.distribution
                });
                
                console.log(`  Water coverage: ${analysis.waterCoverage.toFixed(2)}% (deviation: ${analysis.deviation.toFixed(2)}%)`);
            }
        }
        
        // Sort by smallest deviation from target
        results.sort((a, b) => a.deviation - b.deviation);
        
        return results;
    }

    // Fine-tune moisture and temperature ranges for realistic biome transitions
    optimizeBiomeTransitions(seed = 12345, oceanThreshold = 0.4, beachThreshold = 0.45) {
        console.log('Optimizing biome transition thresholds...');
        
        const results = [];
        
        // Test different moisture/temperature thresholds for biome variety
        const moistureThresholds = {
            dry: [0.1, 0.15, 0.2],
            wet: [0.8, 0.85, 0.9]
        };
        
        const temperatureThresholds = {
            cold: [0.15, 0.2, 0.25],
            hot: [0.75, 0.8, 0.85]
        };
        
        for (const dryThreshold of moistureThresholds.dry) {
            for (const wetThreshold of moistureThresholds.wet) {
                for (const coldThreshold of temperatureThresholds.cold) {
                    for (const hotThreshold of temperatureThresholds.hot) {
                        if (wetThreshold <= dryThreshold || hotThreshold <= coldThreshold) continue;
                        
                        console.log(`Testing moisture: dry<${dryThreshold}, wet>${wetThreshold}, temp: cold<${coldThreshold}, hot>${hotThreshold}`);
                        
                        const testGenerator = new TestMapGenerator(
                            48, 28, seed, oceanThreshold, beachThreshold,
                            dryThreshold, wetThreshold, coldThreshold, hotThreshold
                        );
                        testGenerator.generateMap();
                        
                        const analysis = this.analyzeBiomeDistribution(testGenerator, 0, 0, 100);
                        
                        // Calculate biome diversity (number of biomes with >1% coverage)
                        const diverseBiomes = Object.values(analysis.distribution)
                            .filter(biome => biome.percentage > 1).length;
                        
                        results.push({
                            dryThreshold,
                            wetThreshold,
                            coldThreshold,
                            hotThreshold,
                            waterCoverage: analysis.waterCoverage,
                            diverseBiomes,
                            distribution: analysis.distribution
                        });
                    }
                }
            }
        }
        
        // Sort by water coverage closeness to target and biome diversity
        results.sort((a, b) => {
            const aDeviation = Math.abs(a.waterCoverage - 80);
            const bDeviation = Math.abs(b.waterCoverage - 80);
            if (Math.abs(aDeviation - bDeviation) < 1) {
                return b.diverseBiomes - a.diverseBiomes; // Prefer more diverse biomes
            }
            return aDeviation - bDeviation;
        });
        
        return results;
    }

    // Create comprehensive validation tests
    createValidationTests(optimalThresholds) {
        console.log('Creating biome distribution validation tests...');
        
        const testCases = [
            { seed: 12345, name: 'Standard Test Seed' },
            { seed: 98765, name: 'Alternative Seed 1' },
            { seed: 55555, name: 'Alternative Seed 2' },
            { seed: Date.now(), name: 'Random Current Time Seed' }
        ];
        
        const validationResults = [];
        
        for (const testCase of testCases) {
            console.log(`Validating with ${testCase.name} (seed: ${testCase.seed})`);
            
            const testGenerator = new TestMapGenerator(
                48, 28, testCase.seed,
                optimalThresholds.oceanThreshold,
                optimalThresholds.beachThreshold,
                optimalThresholds.dryThreshold,
                optimalThresholds.wetThreshold,
                optimalThresholds.coldThreshold,
                optimalThresholds.hotThreshold
            );
            testGenerator.generateMap();
            
            const analysis = this.analyzeBiomeDistribution(testGenerator, 0, 0, 500);
            
            validationResults.push({
                ...testCase,
                waterCoverage: analysis.waterCoverage,
                deviation: analysis.deviation,
                withinTolerance: Math.abs(analysis.deviation) <= (this.tolerance * 100),
                distribution: analysis.distribution
            });
            
            console.log(`  Water coverage: ${analysis.waterCoverage.toFixed(2)}% (${analysis.withinTolerance ? 'PASS' : 'FAIL'})`);
        }
        
        return validationResults;
    }

    // Generate comprehensive report
    generateOptimizationReport(elevationResults, transitionResults, validationResults) {
        console.log('\n=== BIOME DISTRIBUTION OPTIMIZATION REPORT ===\n');
        
        // Best elevation thresholds
        const bestElevation = elevationResults[0];
        console.log('OPTIMAL ELEVATION THRESHOLDS:');
        console.log(`  Ocean threshold: ${bestElevation.oceanThreshold}`);
        console.log(`  Beach threshold: ${bestElevation.beachThreshold}`);
        console.log(`  Achieved water coverage: ${bestElevation.waterCoverage.toFixed(2)}%`);
        console.log(`  Deviation from target: ${bestElevation.deviation.toFixed(2)}%\n`);
        
        // Best biome transitions
        const bestTransition = transitionResults[0];
        console.log('OPTIMAL BIOME TRANSITION THRESHOLDS:');
        console.log(`  Dry moisture threshold: ${bestTransition.dryThreshold}`);
        console.log(`  Wet moisture threshold: ${bestTransition.wetThreshold}`);
        console.log(`  Cold temperature threshold: ${bestTransition.coldThreshold}`);
        console.log(`  Hot temperature threshold: ${bestTransition.hotThreshold}`);
        console.log(`  Biome diversity: ${bestTransition.diverseBiomes} biomes with >1% coverage\n`);
        
        // Validation results
        console.log('VALIDATION TEST RESULTS:');
        const passedTests = validationResults.filter(r => r.withinTolerance).length;
        console.log(`  Tests passed: ${passedTests}/${validationResults.length}`);
        
        validationResults.forEach(result => {
            console.log(`  ${result.name}: ${result.waterCoverage.toFixed(2)}% (${result.withinTolerance ? 'PASS' : 'FAIL'})`);
        });
        
        // Recommended code changes
        console.log('\nRECOMMENDED CODE CHANGES FOR map.js:');
        console.log('In the determineBiome() method, update thresholds to:');
        console.log(`  if (elevation < ${bestElevation.oceanThreshold}) return 'ocean';`);
        console.log(`  else if (elevation < ${bestElevation.beachThreshold}) return 'beach';`);
        console.log(`  // Update moisture thresholds:`);
        console.log(`  else if (moisture < ${bestTransition.dryThreshold}) // dry conditions`);
        console.log(`  else if (moisture > ${bestTransition.wetThreshold}) // wet conditions`);
        console.log(`  // Update temperature thresholds:`);
        console.log(`  else if (temperature < ${bestTransition.coldThreshold}) // cold conditions`);
        console.log(`  else if (temperature > ${bestTransition.hotThreshold}) // hot conditions`);
        
        return {
            optimalThresholds: {
                oceanThreshold: bestElevation.oceanThreshold,
                beachThreshold: bestElevation.beachThreshold,
                dryThreshold: bestTransition.dryThreshold,
                wetThreshold: bestTransition.wetThreshold,
                coldThreshold: bestTransition.coldThreshold,
                hotThreshold: bestTransition.hotThreshold
            },
            validationPassed: passedTests === validationResults.length,
            report: {
                elevationResults: elevationResults.slice(0, 5), // Top 5 results
                transitionResults: transitionResults.slice(0, 5),
                validationResults
            }
        };
    }
}

// Test MapGenerator class with configurable thresholds
class TestMapGenerator extends MapGenerator {
    constructor(width, height, seed, oceanThreshold = 0.4, beachThreshold = 0.45, 
                dryThreshold = 0.15, wetThreshold = 0.85, coldThreshold = 0.2, hotThreshold = 0.8) {
        super(width, height, seed);
        this.oceanThreshold = oceanThreshold;
        this.beachThreshold = beachThreshold;
        this.dryThreshold = dryThreshold;
        this.wetThreshold = wetThreshold;
        this.coldThreshold = coldThreshold;
        this.hotThreshold = hotThreshold;
    }

    determineBiome(elevation, moisture, temperature) {
        // Use configurable thresholds for testing
        if (elevation < this.oceanThreshold) {
            return 'ocean';
        } else if (elevation < this.beachThreshold) {
            return 'beach';
        } else if (elevation > 0.9) {
            if (temperature < 0.4) {
                return 'snow';
            } else {
                return 'mountain';
            }
        } else if (moisture < this.dryThreshold) {
            if (temperature > this.hotThreshold) {
                return 'desert';
            } else {
                return 'savanna';
            }
        } else if (moisture > this.wetThreshold) {
            if (temperature > this.hotThreshold) {
                return 'jungle';
            } else {
                return 'swamp';
            }
        } else if (temperature < this.coldThreshold) {
            return 'taiga';
        } else if (temperature > this.hotThreshold) {
            return 'tropical';
        } else {
            return 'forest';
        }
    }
}

// Main execution function
async function runBiomeOptimization() {
    console.log('Starting Biome Distribution Optimization...\n');
    
    const analyzer = new BiomeDistributionAnalyzer();
    
    try {
        // Step 1: Analyze current distribution
        console.log('=== STEP 1: ANALYZING CURRENT DISTRIBUTION ===');
        const currentGenerator = new MapGenerator(48, 28, 12345);
        currentGenerator.generateMap();
        const currentAnalysis = analyzer.analyzeBiomeDistribution(currentGenerator, 0, 0, 200);
        
        console.log('Current biome distribution:');
        Object.entries(currentAnalysis.distribution).forEach(([biome, data]) => {
            if (data.percentage > 0.1) {
                console.log(`  ${biome}: ${data.percentage.toFixed(2)}%`);
            }
        });
        console.log(`Current water coverage: ${currentAnalysis.waterCoverage.toFixed(2)}% (target: 80%)\n`);
        
        // Step 2: Optimize elevation thresholds
        console.log('=== STEP 2: OPTIMIZING ELEVATION THRESHOLDS ===');
        const elevationResults = analyzer.optimizeElevationThresholds(12345);
        
        // Step 3: Optimize biome transitions
        console.log('\n=== STEP 3: OPTIMIZING BIOME TRANSITIONS ===');
        const bestElevation = elevationResults[0];
        const transitionResults = analyzer.optimizeBiomeTransitions(
            12345, bestElevation.oceanThreshold, bestElevation.beachThreshold
        );
        
        // Step 4: Validate with multiple seeds
        console.log('\n=== STEP 4: VALIDATION TESTING ===');
        const optimalThresholds = {
            oceanThreshold: bestElevation.oceanThreshold,
            beachThreshold: bestElevation.beachThreshold,
            dryThreshold: transitionResults[0].dryThreshold,
            wetThreshold: transitionResults[0].wetThreshold,
            coldThreshold: transitionResults[0].coldThreshold,
            hotThreshold: transitionResults[0].hotThreshold
        };
        
        const validationResults = analyzer.createValidationTests(optimalThresholds);
        
        // Step 5: Generate final report
        console.log('\n=== STEP 5: GENERATING FINAL REPORT ===');
        const finalReport = analyzer.generateOptimizationReport(elevationResults, transitionResults, validationResults);
        
        return finalReport;
        
    } catch (error) {
        console.error('Error during biome optimization:', error);
        throw error;
    }
}

// Export for testing
module.exports = {
    BiomeDistributionAnalyzer,
    TestMapGenerator,
    runBiomeOptimization
};

// Run if called directly
if (require.main === module) {
    runBiomeOptimization()
        .then(report => {
            console.log('\nOptimization completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Optimization failed:', error);
            process.exit(1);
        });
}