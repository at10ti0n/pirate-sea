#!/usr/bin/env node

// Comprehensive cross-platform consistency validator
const ResourceManager = require('./resource-manager.js');
const PlayerInventory = require('./player-inventory.js');
const SeededRandom = require('./seeded-random.js');

class CrossPlatformValidator {
    constructor() {
        this.testResults = {
            resourceTypes: { passed: 0, failed: 0, details: [] },
            resourceQuantities: { passed: 0, failed: 0, details: [] },
            gatheringMechanics: { passed: 0, failed: 0, details: [] },
            displaySymbols: { passed: 0, failed: 0, details: [] },
            seededDeterminism: { passed: 0, failed: 0, details: [] },
            uiConsistency: { passed: 0, failed: 0, details: [] }
        };
    }

    // Mock map generator for testing
    createMockMapGenerator(seed) {
        return {
            seed: seed,
            seededRandom: new SeededRandom(seed),
            getBiomeAt: (x, y) => {
                const hash = (x * 73856093 + y * 19349663 + seed) % 1000;
                if (hash < 200) return { biome: 'forest' };
                if (hash < 350) return { biome: 'desert' };
                if (hash < 450) return { biome: 'mountain' };
                if (hash < 550) return { biome: 'beach' };
                if (hash < 650) return { biome: 'jungle' };
                if (hash < 750) return { biome: 'savanna' };
                if (hash < 850) return { biome: 'taiga' };
                if (hash < 950) return { biome: 'tropical' };
                return { biome: 'swamp' };
            },
            generateResourceGlyph: (x, y, biome, resourceManager) => {
                const biomeConfig = resourceManager.getBiomeResources(biome);
                if (!biomeConfig || !biomeConfig.glyphDistribution) {
                    return { char: '?', color: '#ffffff', walkable: true, shipWalkable: false };
                }

                const positionSeed = seed + (x * 1000) + (y * 1000000);
                const positionRandom = new SeededRandom(positionSeed);
                
                let totalWeight = 0;
                for (const glyph of biomeConfig.glyphDistribution) {
                    totalWeight += glyph.weight;
                }
                
                const randomValue = positionRandom.random() * totalWeight;
                let currentWeight = 0;
                
                for (const glyphConfig of biomeConfig.glyphDistribution) {
                    currentWeight += glyphConfig.weight;
                    if (randomValue <= currentWeight) {
                        if (glyphConfig.glyph === 'biome_fallback') {
                            return { char: '?', color: '#ffffff', walkable: true, shipWalkable: false };
                        } else {
                            const isDepleted = resourceManager.isLocationVisuallyDepleted(x, y);
                            const resourceGlyph = resourceManager.getResourceGlyph(glyphConfig.glyph, 'terminal', isDepleted);
                            const resourceColor = resourceManager.getResourceColor(glyphConfig.glyph, isDepleted);
                            
                            if (resourceGlyph) {
                                return {
                                    char: resourceGlyph,
                                    color: resourceColor,
                                    walkable: true,
                                    shipWalkable: false,
                                    resourceType: glyphConfig.glyph,
                                    depleted: isDepleted
                                };
                            }
                        }
                    }
                }
                
                return { char: '?', color: '#ffffff', walkable: true, shipWalkable: false };
            }
        };
    }

    // Test 1: Ensure identical resource types across platforms
    testResourceTypes() {
        console.log('Testing resource types consistency...');
        
        const mapGen = this.createMockMapGenerator(12345);
        const resourceManager = new ResourceManager(mapGen, mapGen.seededRandom);
        
        const expectedResourceTypes = ['stone', 'sand', 'wood', 'hay', 'ore', 'berries', 'reeds'];
        const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
        
        let allResourcesFound = new Set();
        
        biomes.forEach(biome => {
            const biomeConfig = resourceManager.getBiomeResources(biome);
            if (biomeConfig) {
                biomeConfig.resources.forEach(resource => {
                    allResourcesFound.add(resource.type);
                });
            }
        });
        
        expectedResourceTypes.forEach(resourceType => {
            if (allResourcesFound.has(resourceType)) {
                this.testResults.resourceTypes.passed++;
                this.testResults.resourceTypes.details.push(`✅ ${resourceType} found in biome configurations`);
            } else {
                this.testResults.resourceTypes.failed++;
                this.testResults.resourceTypes.details.push(`❌ ${resourceType} missing from biome configurations`);
            }
        });
        
        // Test resource definitions exist
        expectedResourceTypes.forEach(resourceType => {
            const resourceInfo = resourceManager.getResourceInfo(resourceType);
            if (resourceInfo) {
                this.testResults.resourceTypes.passed++;
                this.testResults.resourceTypes.details.push(`✅ ${resourceType} definition exists`);
            } else {
                this.testResults.resourceTypes.failed++;
                this.testResults.resourceTypes.details.push(`❌ ${resourceType} definition missing`);
            }
        });
    }

    // Test 2: Ensure identical resource quantities across platforms
    testResourceQuantities() {
        console.log('Testing resource quantities consistency...');
        
        const mapGen = this.createMockMapGenerator(54321);
        const resourceManager = new ResourceManager(mapGen, mapGen.seededRandom);
        
        const biomes = ['forest', 'desert', 'mountain', 'beach', 'jungle', 'savanna', 'taiga', 'tropical', 'swamp'];
        
        biomes.forEach(biome => {
            const biomeConfig = resourceManager.getBiomeResources(biome);
            if (biomeConfig) {
                biomeConfig.resources.forEach(resource => {
                    // Check quantity ranges are valid
                    const [min, max] = resource.baseQuantity;
                    if (min > 0 && max >= min && max <= 10) {
                        this.testResults.resourceQuantities.passed++;
                        this.testResults.resourceQuantities.details.push(`✅ ${biome}.${resource.type}: [${min}-${max}] valid range`);
                    } else {
                        this.testResults.resourceQuantities.failed++;
                        this.testResults.resourceQuantities.details.push(`❌ ${biome}.${resource.type}: [${min}-${max}] invalid range`);
                    }
                    
                    // Check weights are reasonable
                    if (resource.weight > 0 && resource.weight <= 100) {
                        this.testResults.resourceQuantities.passed++;
                        this.testResults.resourceQuantities.details.push(`✅ ${biome}.${resource.type}: weight=${resource.weight} valid`);
                    } else {
                        this.testResults.resourceQuantities.failed++;
                        this.testResults.resourceQuantities.details.push(`❌ ${biome}.${resource.type}: weight=${resource.weight} invalid`);
                    }
                });
            }
        });
    }

    // Test 3: Standardize gathering mechanics between web and terminal
    testGatheringMechanics() {
        console.log('Testing gathering mechanics consistency...');
        
        const seed = 98765;
        const testPositions = [[0, 0], [1, 1], [2, 2], [5, 5], [10, 10]];
        
        // Create two instances to simulate web and terminal
        const mapGen1 = this.createMockMapGenerator(seed);
        const resourceManager1 = new ResourceManager(mapGen1, mapGen1.seededRandom);
        const inventory1 = new PlayerInventory(1000);
        
        const mapGen2 = this.createMockMapGenerator(seed);
        const resourceManager2 = new ResourceManager(mapGen2, mapGen2.seededRandom);
        const inventory2 = new PlayerInventory(1000);
        
        testPositions.forEach(([x, y]) => {
            for (let attempt = 0; attempt < 5; attempt++) {
                const result1 = resourceManager1.attemptGather(x, y, inventory1);
                const result2 = resourceManager2.attemptGather(x, y, inventory2);
                
                if (result1.success === result2.success && 
                    result1.resource === result2.resource && 
                    result1.quantity === result2.quantity) {
                    this.testResults.gatheringMechanics.passed++;
                    this.testResults.gatheringMechanics.details.push(`✅ (${x},${y}) attempt ${attempt+1}: consistent results`);
                } else {
                    this.testResults.gatheringMechanics.failed++;
                    this.testResults.gatheringMechanics.details.push(`❌ (${x},${y}) attempt ${attempt+1}: inconsistent results`);
                }
            }
        });
    }

    // Test 4: Create platform-specific resource display symbols
    testDisplaySymbols() {
        console.log('Testing display symbols consistency...');
        
        const mapGen = this.createMockMapGenerator(11111);
        const resourceManager = new ResourceManager(mapGen, mapGen.seededRandom);
        
        const resourceTypes = ['stone', 'sand', 'wood', 'hay', 'ore', 'berries', 'reeds'];
        
        resourceTypes.forEach(resourceType => {
            // Test web glyphs
            const webNormal = resourceManager.getResourceGlyph(resourceType, 'web', false);
            const webDepleted = resourceManager.getResourceGlyph(resourceType, 'web', true);
            
            if (webNormal && webDepleted) {
                this.testResults.displaySymbols.passed++;
                this.testResults.displaySymbols.details.push(`✅ ${resourceType}: web glyphs exist (${webNormal}/${webDepleted})`);
            } else {
                this.testResults.displaySymbols.failed++;
                this.testResults.displaySymbols.details.push(`❌ ${resourceType}: web glyphs missing`);
            }
            
            // Test terminal glyphs
            const terminalNormal = resourceManager.getResourceGlyph(resourceType, 'terminal', false);
            const terminalDepleted = resourceManager.getResourceGlyph(resourceType, 'terminal', true);
            
            if (terminalNormal && terminalDepleted) {
                this.testResults.displaySymbols.passed++;
                this.testResults.displaySymbols.details.push(`✅ ${resourceType}: terminal glyphs exist (${terminalNormal}/${terminalDepleted})`);
            } else {
                this.testResults.displaySymbols.failed++;
                this.testResults.displaySymbols.details.push(`❌ ${resourceType}: terminal glyphs missing`);
            }
            
            // Test colors
            const normalColor = resourceManager.getResourceColor(resourceType, false);
            const depletedColor = resourceManager.getResourceColor(resourceType, true);
            
            if (normalColor && depletedColor) {
                this.testResults.displaySymbols.passed++;
                this.testResults.displaySymbols.details.push(`✅ ${resourceType}: colors exist (${normalColor}/${depletedColor})`);
            } else {
                this.testResults.displaySymbols.failed++;
                this.testResults.displaySymbols.details.push(`❌ ${resourceType}: colors missing`);
            }
        });
    }

    // Test 5: Test seeded determinism across both versions
    testSeededDeterminism() {
        console.log('Testing seeded determinism...');
        
        const seeds = [12345, 54321, 98765];
        
        seeds.forEach(seed => {
            // Test SeededRandom consistency
            const random1 = new SeededRandom(seed);
            const random2 = new SeededRandom(seed);
            
            let consistentValues = 0;
            const totalValues = 10;
            
            for (let i = 0; i < totalValues; i++) {
                const val1 = random1.random();
                const val2 = random2.random();
                
                if (Math.abs(val1 - val2) < 0.0001) {
                    consistentValues++;
                }
            }
            
            if (consistentValues === totalValues) {
                this.testResults.seededDeterminism.passed++;
                this.testResults.seededDeterminism.details.push(`✅ Seed ${seed}: SeededRandom consistent`);
            } else {
                this.testResults.seededDeterminism.failed++;
                this.testResults.seededDeterminism.details.push(`❌ Seed ${seed}: SeededRandom inconsistent (${consistentValues}/${totalValues})`);
            }
            
            // Test resource generation consistency
            const mapGen1 = this.createMockMapGenerator(seed);
            const resourceManager1 = new ResourceManager(mapGen1, mapGen1.seededRandom);
            
            const mapGen2 = this.createMockMapGenerator(seed);
            const resourceManager2 = new ResourceManager(mapGen2, mapGen2.seededRandom);
            
            const testPositions = [[0, 0], [1, 1], [2, 2]];
            let consistentGlyphs = 0;
            
            testPositions.forEach(([x, y]) => {
                const biome = mapGen1.getBiomeAt(x, y);
                const glyph1 = mapGen1.generateResourceGlyph(x, y, biome.biome, resourceManager1);
                const glyph2 = mapGen2.generateResourceGlyph(x, y, biome.biome, resourceManager2);
                
                if (JSON.stringify(glyph1) === JSON.stringify(glyph2)) {
                    consistentGlyphs++;
                }
            });
            
            if (consistentGlyphs === testPositions.length) {
                this.testResults.seededDeterminism.passed++;
                this.testResults.seededDeterminism.details.push(`✅ Seed ${seed}: Resource glyphs consistent`);
            } else {
                this.testResults.seededDeterminism.failed++;
                this.testResults.seededDeterminism.details.push(`❌ Seed ${seed}: Resource glyphs inconsistent (${consistentGlyphs}/${testPositions.length})`);
            }
        });
    }

    // Test 6: Validate UI consistency and usability
    testUIConsistency() {
        console.log('Testing UI consistency...');
        
        const mapGen = this.createMockMapGenerator(22222);
        const resourceManager = new ResourceManager(mapGen, mapGen.seededRandom);
        const inventory = new PlayerInventory(100);
        
        // Add test resources
        inventory.addResource('wood', 5);
        inventory.addResource('stone', 3);
        inventory.addResource('berries', 8);
        
        // Test inventory display methods exist and work
        try {
            const webDisplay = inventory.getInventoryDisplay(resourceManager);
            const terminalDisplay = inventory.getInventoryDisplayTerminal(resourceManager);
            
            if (webDisplay && terminalDisplay) {
                this.testResults.uiConsistency.passed++;
                this.testResults.uiConsistency.details.push(`✅ Inventory display methods work for both platforms`);
            } else {
                this.testResults.uiConsistency.failed++;
                this.testResults.uiConsistency.details.push(`❌ Inventory display methods missing or broken`);
            }
            
            // Test that both displays contain resource information
            const hasResourceInfo = (webDisplay.includes('Wood') || webDisplay.includes('wood')) && 
                                   (terminalDisplay.includes('Wood') || terminalDisplay.includes('wood'));
            if (hasResourceInfo) {
                this.testResults.uiConsistency.passed++;
                this.testResults.uiConsistency.details.push(`✅ Both displays contain resource information`);
            } else {
                this.testResults.uiConsistency.failed++;
                this.testResults.uiConsistency.details.push(`❌ Displays missing resource information`);
            }
            
        } catch (error) {
            this.testResults.uiConsistency.failed++;
            this.testResults.uiConsistency.details.push(`❌ UI consistency test failed: ${error.message}`);
        }
        
        // Test examination system
        try {
            const examResult = resourceManager.examineLocation(0, 0);
            if (examResult && examResult.success !== undefined) {
                this.testResults.uiConsistency.passed++;
                this.testResults.uiConsistency.details.push(`✅ Examination system works`);
            } else {
                this.testResults.uiConsistency.failed++;
                this.testResults.uiConsistency.details.push(`❌ Examination system broken`);
            }
        } catch (error) {
            this.testResults.uiConsistency.failed++;
            this.testResults.uiConsistency.details.push(`❌ Examination system failed: ${error.message}`);
        }
    }

    // Run all tests
    runAllTests() {
        console.log('=== Cross-Platform Consistency Validation ===\n');
        
        this.testResourceTypes();
        this.testResourceQuantities();
        this.testGatheringMechanics();
        this.testDisplaySymbols();
        this.testSeededDeterminism();
        this.testUIConsistency();
        
        return this.generateReport();
    }

    // Generate comprehensive report
    generateReport() {
        console.log('\n=== VALIDATION REPORT ===\n');
        
        const categories = Object.keys(this.testResults);
        let totalPassed = 0;
        let totalFailed = 0;
        
        categories.forEach(category => {
            const result = this.testResults[category];
            totalPassed += result.passed;
            totalFailed += result.failed;
            
            const total = result.passed + result.failed;
            const percentage = total > 0 ? Math.round((result.passed / total) * 100) : 0;
            
            console.log(`${category.toUpperCase()}:`);
            console.log(`  Passed: ${result.passed}/${total} (${percentage}%)`);
            
            if (result.failed > 0) {
                console.log(`  Failed tests:`);
                result.details.filter(detail => detail.startsWith('❌')).forEach(detail => {
                    console.log(`    ${detail}`);
                });
            }
            console.log('');
        });
        
        const overallTotal = totalPassed + totalFailed;
        const overallPercentage = overallTotal > 0 ? Math.round((totalPassed / overallTotal) * 100) : 0;
        
        console.log(`OVERALL RESULT: ${totalPassed}/${overallTotal} tests passed (${overallPercentage}%)`);
        
        if (overallPercentage >= 95) {
            console.log('✅ CROSS-PLATFORM CONSISTENCY: EXCELLENT');
        } else if (overallPercentage >= 85) {
            console.log('⚠️  CROSS-PLATFORM CONSISTENCY: GOOD (minor issues)');
        } else {
            console.log('❌ CROSS-PLATFORM CONSISTENCY: NEEDS IMPROVEMENT');
        }
        
        return {
            passed: totalPassed,
            failed: totalFailed,
            percentage: overallPercentage,
            details: this.testResults
        };
    }
}

// Run the validation
const validator = new CrossPlatformValidator();
const results = validator.runAllTests();

// Exit with appropriate code
process.exit(results.percentage >= 95 ? 0 : 1);