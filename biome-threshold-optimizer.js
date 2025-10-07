// Biome Distribution Analysis and Threshold Optimization
// Standalone script to analyze and optimize biome thresholds for 80% water coverage

const ROT = require('rot-js');

// SeededRandom implementation
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

// Simplified MapGenerator for testing different thresholds
class ThresholdTestGenerator {
    constructor(seed = 12345, thresholds = {}) {
        this.seed = seed;
        this.seededRandom = new SeededRandom(seed);
        
        // Default thresholds (current values from map.js)
        this.oceanThreshold1 = thresholds.oceanThreshold1 || 0.3;
        this.oceanThreshold2 = thresholds.oceanThreshold2 || 0.4;
        this.beachThreshold = thresholds.beachThreshold || 0.45;
        this.dryMoisture = thresholds.dryMoisture || 0.15;
        this.wetMoisture = thresholds.wetMoisture || 0.85;
        this.coldTemp = thresholds.coldTemp || 0.2;
        this.hotTemp = thresholds.hotTemp || 0.8;
        
        // Initialize noise generators
        this.elevationNoise = new ROT.Noise.Simplex();
        this.moistureNoise = new ROT.Noise.Simplex();
        this.temperatureNoise = new ROT.Noise.Simplex();
        
        // Seed the noise generators
        if (this.elevationNoise.setSeed) {
            this.elevationNoise.setSeed(this.seed);
            this.moistureNoise.setSeed(this.seed + 1000);
            this.temperatureNoise.setSeed(this.seed + 2000);
        }
    }
    
    generateElevation(x, y) {
        const baseScale = 0.025;
        const islandScale = 0.12;
        const atollScale = 0.2;
        
        let elevation = 0.2; // Base ocean level
        
        // Large landmasses
        const continentNoise = (this.elevationNoise.get(x * baseScale, y * baseScale) + 1) / 2;
        if (continentNoise > 0.75) {
            elevation += (continentNoise - 0.75) * 1.8;
        }
        
        // Medium islands
        const islandNoise = (this.elevationNoise.get(x * islandScale + 500, y * islandScale + 500) + 1) / 2;
        if (islandNoise > 0.7) {
            elevation += (islandNoise - 0.7) * 1.3;
        }
        
        // Small atolls
        const atollNoise = (this.elevationNoise.get(x * atollScale + 1000, y * atollScale + 1000) + 1) / 2;
        if (atollNoise > 0.75) {
            elevation += (atollNoise - 0.75) * 1.0;
        }
        
        // Island chains
        const chainScale = 0.06;
        const chain1 = (this.elevationNoise.get(x * chainScale + 1500, y * chainScale + 1500) + 1) / 2;
        const chain2 = (this.elevationNoise.get(x * chainScale + 2500, y * chainScale + 2500) + 1) / 2;
        const chain3 = (this.elevationNoise.get(x * chainScale + 3500, y * chainScale + 3500) + 1) / 2;
        
        if (chain1 > 0.8) elevation += (chain1 - 0.8) * 1.5;
        if (chain2 > 0.85) elevation += (chain2 - 0.85) * 1.2;
        if (chain3 > 0.82) elevation += (chain3 - 0.82) * 1.0;
        
        return Math.max(0, Math.min(1, elevation));
    }
    
    determineBiome(elevation, moisture, temperature) {
        // Test different ocean thresholds
        if (elevation < this.oceanThreshold1) {
            return 'ocean';
        } else if (elevation < this.oceanThreshold2) {
            return 'ocean';
        } else if (elevation < this.beachThreshold) {
            return 'beach';
        } else if (elevation > 0.9) {
            if (temperature < 0.4) {
                return 'snow';
            } else {
                return 'mountain';
            }
        } else if (moisture < this.dryMoisture) {
            if (temperature > this.hotTemp) {
                return 'desert';
            } else {
                return 'savanna';
            }
        } else if (moisture > this.wetMoisture) {
            if (temperature > this.hotTemp) {
                return 'jungle';
            } else {
                return 'swamp';
            }
        } else if (temperature < this.coldTemp) {
            return 'taiga';
        } else if (temperature > this.hotTemp) {
            return 'tropical';
        } else {
            return 'forest';
        }
    }
    
    generateTile(x, y) {
        const elevation = this.generateElevation(x, y);
        const moisture = (this.moistureNoise.get(x * 0.09 + 100, y * 0.09 + 100) + 1) / 2;
        const temperature = (this.temperatureNoise.get(x * 0.07 + 200, y * 0.07 + 200) + 1) / 2;
        
        const biome = this.determineBiome(elevation, moisture, temperature);
        
        return {
            x, y, biome, elevation, moisture, temperature
        };
    }
}

// Analysis functions
function analyzeBiomeDistribution(generator, sampleSize = 1000, centerX = 0, centerY = 0) {
    console.log(`Analyzing ${sampleSize}x${sampleSize} tiles...`);
    
    const biomeCount = {};
    const totalTiles = sampleSize * sampleSize;
    let processedTiles = 0;
    
    const startX = centerX - Math.floor(sampleSize / 2);
    const startY = centerY - Math.floor(sampleSize / 2);
    
    for (let y = startY; y < startY + sampleSize; y++) {
        for (let x = startX; x < startX + sampleSize; x++) {
            const tile = generator.generateTile(x, y);
            
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
    
    return {
        totalTiles,
        distribution,
        waterCoverage,
        deviation: waterCoverage - 80
    };
}

function optimizeOceanThresholds() {
    console.log('=== OPTIMIZING OCEAN THRESHOLDS ===\n');
    
    const results = [];
    const seed = 12345;
    
    // Test different combinations of ocean thresholds
    const threshold1Options = [0.25, 0.3, 0.35, 0.4];
    const threshold2Options = [0.35, 0.4, 0.45, 0.5];
    const beachOptions = [0.4, 0.42, 0.45, 0.47, 0.5];
    
    for (const t1 of threshold1Options) {
        for (const t2 of threshold2Options) {
            for (const beach of beachOptions) {
                if (t2 <= t1 || beach <= t2) continue;
                
                console.log(`Testing: ocean1=${t1}, ocean2=${t2}, beach=${beach}`);
                
                const generator = new ThresholdTestGenerator(seed, {
                    oceanThreshold1: t1,
                    oceanThreshold2: t2,
                    beachThreshold: beach
                });
                
                const analysis = analyzeBiomeDistribution(generator, 200);
                
                results.push({
                    oceanThreshold1: t1,
                    oceanThreshold2: t2,
                    beachThreshold: beach,
                    waterCoverage: analysis.waterCoverage,
                    deviation: Math.abs(analysis.deviation),
                    distribution: analysis.distribution
                });
                
                console.log(`  Water coverage: ${analysis.waterCoverage.toFixed(2)}% (deviation: ${analysis.deviation.toFixed(2)}%)\n`);
            }
        }
    }
    
    // Sort by smallest deviation from 80%
    results.sort((a, b) => a.deviation - b.deviation);
    
    return results;
}

function optimizeBiomeThresholds(bestOceanConfig) {
    console.log('=== OPTIMIZING BIOME THRESHOLDS ===\n');
    
    const results = [];
    const seed = 12345;
    
    // Test different moisture and temperature thresholds
    const dryOptions = [0.1, 0.15, 0.2];
    const wetOptions = [0.8, 0.85, 0.9];
    const coldOptions = [0.15, 0.2, 0.25];
    const hotOptions = [0.75, 0.8, 0.85];
    
    for (const dry of dryOptions) {
        for (const wet of wetOptions) {
            for (const cold of coldOptions) {
                for (const hot of hotOptions) {
                    if (wet <= dry || hot <= cold) continue;
                    
                    console.log(`Testing: dry<${dry}, wet>${wet}, cold<${cold}, hot>${hot}`);
                    
                    const generator = new ThresholdTestGenerator(seed, {
                        ...bestOceanConfig,
                        dryMoisture: dry,
                        wetMoisture: wet,
                        coldTemp: cold,
                        hotTemp: hot
                    });
                    
                    const analysis = analyzeBiomeDistribution(generator, 100);
                    
                    // Count diverse biomes (>1% coverage)
                    const diverseBiomes = Object.values(analysis.distribution)
                        .filter(biome => biome.percentage > 1).length;
                    
                    results.push({
                        dryMoisture: dry,
                        wetMoisture: wet,
                        coldTemp: cold,
                        hotTemp: hot,
                        waterCoverage: analysis.waterCoverage,
                        diverseBiomes,
                        distribution: analysis.distribution
                    });
                    
                    console.log(`  Water: ${analysis.waterCoverage.toFixed(2)}%, Diverse biomes: ${diverseBiomes}\n`);
                }
            }
        }
    }
    
    // Sort by water coverage closeness to 80% and biome diversity
    results.sort((a, b) => {
        const aDeviation = Math.abs(a.waterCoverage - 80);
        const bDeviation = Math.abs(b.waterCoverage - 80);
        if (Math.abs(aDeviation - bDeviation) < 1) {
            return b.diverseBiomes - a.diverseBiomes;
        }
        return aDeviation - bDeviation;
    });
    
    return results;
}

function validateOptimalThresholds(optimalConfig) {
    console.log('=== VALIDATION TESTING ===\n');
    
    const testSeeds = [12345, 98765, 55555, Date.now()];
    const results = [];
    
    for (const seed of testSeeds) {
        console.log(`Validating with seed: ${seed}`);
        
        const generator = new ThresholdTestGenerator(seed, optimalConfig);
        const analysis = analyzeBiomeDistribution(generator, 500);
        
        const withinTolerance = Math.abs(analysis.deviation) <= 2; // ±2%
        
        results.push({
            seed,
            waterCoverage: analysis.waterCoverage,
            deviation: analysis.deviation,
            withinTolerance,
            distribution: analysis.distribution
        });
        
        console.log(`  Water coverage: ${analysis.waterCoverage.toFixed(2)}% (${withinTolerance ? 'PASS' : 'FAIL'})\n`);
    }
    
    return results;
}

function generateReport(oceanResults, biomeResults, validationResults) {
    console.log('\n=== OPTIMIZATION REPORT ===\n');
    
    const bestOcean = oceanResults[0];
    const bestBiome = biomeResults[0];
    
    console.log('OPTIMAL THRESHOLDS:');
    console.log(`  Ocean threshold 1: ${bestOcean.oceanThreshold1}`);
    console.log(`  Ocean threshold 2: ${bestOcean.oceanThreshold2}`);
    console.log(`  Beach threshold: ${bestOcean.beachThreshold}`);
    console.log(`  Dry moisture: ${bestBiome.dryMoisture}`);
    console.log(`  Wet moisture: ${bestBiome.wetMoisture}`);
    console.log(`  Cold temperature: ${bestBiome.coldTemp}`);
    console.log(`  Hot temperature: ${bestBiome.hotTemp}`);
    console.log(`  Achieved water coverage: ${bestOcean.waterCoverage.toFixed(2)}%`);
    console.log(`  Biome diversity: ${bestBiome.diverseBiomes} biomes\n`);
    
    const passedTests = validationResults.filter(r => r.withinTolerance).length;
    console.log(`VALIDATION: ${passedTests}/${validationResults.length} tests passed\n`);
    
    console.log('RECOMMENDED CODE CHANGES:');
    console.log('Update determineBiome() method in map.js:');
    console.log(`  if (elevation < ${bestOcean.oceanThreshold1}) return 'ocean';`);
    console.log(`  else if (elevation < ${bestOcean.oceanThreshold2}) return 'ocean';`);
    console.log(`  else if (elevation < ${bestOcean.beachThreshold}) return 'beach';`);
    console.log(`  // Update moisture thresholds:`);
    console.log(`  else if (moisture < ${bestBiome.dryMoisture}) // dry conditions`);
    console.log(`  else if (moisture > ${bestBiome.wetMoisture}) // wet conditions`);
    console.log(`  // Update temperature thresholds:`);
    console.log(`  else if (temperature < ${bestBiome.coldTemp}) // cold conditions`);
    console.log(`  else if (temperature > ${bestBiome.hotTemp}) // hot conditions`);
    
    return {
        optimalThresholds: {
            oceanThreshold1: bestOcean.oceanThreshold1,
            oceanThreshold2: bestOcean.oceanThreshold2,
            beachThreshold: bestOcean.beachThreshold,
            dryMoisture: bestBiome.dryMoisture,
            wetMoisture: bestBiome.wetMoisture,
            coldTemp: bestBiome.coldTemp,
            hotTemp: bestBiome.hotTemp
        },
        validationPassed: passedTests === validationResults.length
    };
}

// Main execution
async function runOptimization() {
    console.log('BIOME THRESHOLD OPTIMIZATION\n');
    
    try {
        // Step 1: Optimize ocean thresholds
        const oceanResults = optimizeOceanThresholds();
        
        // Step 2: Optimize biome thresholds using best ocean config
        const bestOceanConfig = {
            oceanThreshold1: oceanResults[0].oceanThreshold1,
            oceanThreshold2: oceanResults[0].oceanThreshold2,
            beachThreshold: oceanResults[0].beachThreshold
        };
        
        const biomeResults = optimizeBiomeThresholds(bestOceanConfig);
        
        // Step 3: Validate optimal configuration
        const optimalConfig = {
            ...bestOceanConfig,
            dryMoisture: biomeResults[0].dryMoisture,
            wetMoisture: biomeResults[0].wetMoisture,
            coldTemp: biomeResults[0].coldTemp,
            hotTemp: biomeResults[0].hotTemp
        };
        
        const validationResults = validateOptimalThresholds(optimalConfig);
        
        // Step 4: Generate final report
        const report = generateReport(oceanResults, biomeResults, validationResults);
        
        console.log('\nOptimization completed successfully!');
        return report;
        
    } catch (error) {
        console.error('Optimization failed:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    runOptimization()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = {
    ThresholdTestGenerator,
    analyzeBiomeDistribution,
    runOptimization
};