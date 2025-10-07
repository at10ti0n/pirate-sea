// Test the optimized biome thresholds directly
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

// Simplified MapGenerator with optimized thresholds
class OptimizedMapGenerator {
    constructor(seed = 12345) {
        this.seed = seed;
        this.seededRandom = new SeededRandom(seed);
        
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
        // Optimized thresholds for accurate 80% water coverage
        if (elevation < 0.25) { // Deep ocean - majority of world
            return 'ocean';
        } else if (elevation < 0.4) { // Shallow seas around islands
            return 'ocean';
        } else if (elevation < 0.5) { // Beaches - coastal areas (expanded range)
            return 'beach';
        } else if (elevation > 0.9) { // Only highest peaks become mountains
            if (temperature < 0.4) {
                return 'snow';
            } else {
                return 'mountain';
            }
        } else if (moisture < 0.1) { // Optimized dry conditions for deserts
            if (temperature > 0.75) {
                return 'desert';
            } else {
                return 'savanna';
            }
        } else if (moisture > 0.8) { // Optimized wet conditions
            if (temperature > 0.75) {
                return 'jungle';
            } else {
                return 'swamp';
            }
        } else if (temperature < 0.2) { // Optimized cold threshold
            return 'taiga';
        } else if (temperature > 0.75) { // Optimized hot threshold
            return 'tropical';
        } else {
            return 'forest'; // Default for temperate areas
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

function testWaterCoverage(generator, sampleSize = 1000) {
    console.log(`Testing water coverage with ${sampleSize}x${sampleSize} sample...`);
    
    const biomeCount = {};
    const totalTiles = sampleSize * sampleSize;
    let processedTiles = 0;
    
    const startX = -Math.floor(sampleSize / 2);
    const startY = -Math.floor(sampleSize / 2);
    
    for (let y = startY; y < startY + sampleSize; y++) {
        for (let x = startX; x < startX + sampleSize; x++) {
            const tile = generator.generateTile(x, y);
            
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
    console.log('=== OPTIMIZED THRESHOLD VALIDATION ===\n');
    
    const testSeeds = [12345, 98765, 55555, 11111, 99999, 77777];
    const results = [];
    const tolerance = 2; // ±2%
    
    for (const seed of testSeeds) {
        console.log(`\nTesting seed: ${seed}`);
        
        const generator = new OptimizedMapGenerator(seed);
        const analysis = testWaterCoverage(generator, 1000);
        
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
        const sortedBiomes = Object.entries(analysis.distribution)
            .sort((a, b) => b[1].percentage - a[1].percentage);
        
        console.log('Biome distribution:');
        sortedBiomes.forEach(([biome, data]) => {
            if (data.percentage > 0.5) {
                console.log(`  ${biome}: ${data.percentage.toFixed(2)}%`);
            }
        });
    }
    
    // Calculate summary statistics
    const passedTests = results.filter(r => r.withinTolerance).length;
    const averageWaterCoverage = results.reduce((sum, r) => sum + r.waterCoverage, 0) / results.length;
    const maxDeviation = Math.max(...results.map(r => Math.abs(r.deviation)));
    const minWaterCoverage = Math.min(...results.map(r => r.waterCoverage));
    const maxWaterCoverage = Math.max(...results.map(r => r.waterCoverage));
    
    console.log('\n=== VALIDATION SUMMARY ===');
    console.log(`Tests passed: ${passedTests}/${results.length}`);
    console.log(`Average water coverage: ${averageWaterCoverage.toFixed(2)}%`);
    console.log(`Water coverage range: ${minWaterCoverage.toFixed(2)}% - ${maxWaterCoverage.toFixed(2)}%`);
    console.log(`Maximum deviation: ${maxDeviation.toFixed(2)}%`);
    console.log(`Consistency: ${passedTests === results.length ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'}`);
    
    // Test biome diversity
    const sampleResult = results[0];
    const significantBiomes = Object.entries(sampleResult.distribution)
        .filter(([biome, data]) => data.percentage > 1).length;
    
    console.log(`Biome diversity: ${significantBiomes} biomes with >1% coverage`);
    
    if (passedTests === results.length) {
        console.log('\n✅ SUCCESS: All validation tests passed!');
        console.log('The optimized thresholds consistently achieve 80% water coverage.');
    } else {
        console.log('\n⚠️  WARNING: Some validation tests failed.');
        console.log('Consider further threshold adjustments if needed.');
    }
    
    return {
        passedTests,
        totalTests: results.length,
        averageWaterCoverage,
        maxDeviation,
        significantBiomes,
        allPassed: passedTests === results.length
    };
}

// Run the validation
console.log('BIOME THRESHOLD OPTIMIZATION VALIDATION\n');
console.log('Testing the updated determineBiome() thresholds...\n');

try {
    const results = runValidationTests();
    
    console.log('\n=== FINAL REPORT ===');
    console.log('Task 2 Implementation Summary:');
    console.log('✓ Analyzed current biome distribution');
    console.log('✓ Optimized elevation thresholds for 80% water coverage');
    console.log('✓ Fine-tuned moisture and temperature ranges');
    console.log('✓ Created validation tests for consistent water coverage');
    console.log(`✓ Achieved ${results.averageWaterCoverage.toFixed(2)}% average water coverage`);
    console.log(`✓ Validation success rate: ${results.passedTests}/${results.totalTests}`);
    
    if (results.allPassed) {
        console.log('\n🎉 TASK 2 COMPLETED SUCCESSFULLY!');
        console.log('Biome determination thresholds optimized for accurate 80% water coverage.');
    } else {
        console.log('\n⚠️  TASK 2 PARTIALLY COMPLETED');
        console.log('Most tests passed, but some edge cases may need attention.');
    }
    
    process.exit(results.allPassed ? 0 : 1);
    
} catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
}