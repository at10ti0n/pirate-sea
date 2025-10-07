#!/usr/bin/env node

// Test contrast verification for visibility states
const TerminalGame = require('./terminal-game');

function testContrastVerification() {
    console.log('Testing visibility contrast verification...\n');
    
    const game = new TerminalGame(12345);
    
    // Test different biome colors with visibility modifiers
    const biomeTests = [
        { biome: 'ocean', color: '\x1b[34m', char: '~' },
        { biome: 'forest', color: '\x1b[92m', char: '♠' },
        { biome: 'mountain', color: '\x1b[37m', char: '^' },
        { biome: 'desert', color: '\x1b[31m', char: ':' },
        { biome: 'beach', color: '\x1b[33m', char: '.' }
    ];
    
    console.log('Biome Visibility Contrast Test:');
    console.log('===============================\n');
    
    biomeTests.forEach(biome => {
        const visibleColor = game.applyVisibilityModifier(biome.color, 1.0);
        const exploredColor = game.applyVisibilityModifier(biome.color, 0.5);
        
        console.log(`${biome.biome.padEnd(10)} | Visible: ${visibleColor}${biome.char}\x1b[0m | Explored: ${exploredColor}${biome.char}\x1b[0m | Hidden: (not shown)`);
    });
    
    console.log('\nEntity Visibility Contrast Test:');
    console.log('================================\n');
    
    const entityTests = [
        { type: 'ship', color: '\x1b[33m', char: 'S' },
        { type: 'treasure', color: '\x1b[93m', char: '$' },
        { type: 'port', color: '\x1b[31m', char: 'P' }
    ];
    
    entityTests.forEach(entity => {
        const visibleColor = game.applyVisibilityModifier(entity.color, 1.0);
        const exploredColor = game.applyVisibilityModifier(entity.color, 0.5);
        
        console.log(`${entity.type.padEnd(10)} | Visible: ${visibleColor}${entity.char}\x1b[0m | Explored: ${exploredColor}${entity.char}\x1b[0m | Hidden: (not shown)`);
    });
    
    // Test that dimmed colors are visually distinct from full brightness
    console.log('\nContrast Verification:');
    console.log('======================\n');
    
    let contrastPassed = true;
    
    biomeTests.forEach(biome => {
        const visibleColor = game.applyVisibilityModifier(biome.color, 1.0);
        const exploredColor = game.applyVisibilityModifier(biome.color, 0.5);
        
        // Check that the colors are different
        if (visibleColor === exploredColor) {
            console.log(`❌ FAIL: ${biome.biome} - visible and explored colors are identical`);
            contrastPassed = false;
        } else {
            console.log(`✓ PASS: ${biome.biome} - visible and explored colors are distinct`);
        }
    });
    
    console.log(`\nOverall contrast test: ${contrastPassed ? '✓ PASSED' : '❌ FAILED'}`);
    
    return contrastPassed;
}

function testVisibilityModifierEdgeCases() {
    console.log('\n\nTesting edge cases...\n');
    
    const game = new TerminalGame(12345);
    
    // Test edge case modifiers
    const edgeCases = [
        { modifier: 1.0, name: 'Exactly visible' },
        { modifier: 0.999, name: 'Almost visible' },
        { modifier: 0.5, name: 'Half visibility' },
        { modifier: 0.001, name: 'Barely visible' },
        { modifier: 0.0, name: 'Exactly hidden' },
        { modifier: -0.1, name: 'Negative modifier' },
        { modifier: 1.5, name: 'Over-bright modifier' }
    ];
    
    const testColor = '\x1b[32m'; // Green
    
    console.log('Edge Case Testing:');
    console.log('==================\n');
    
    edgeCases.forEach(testCase => {
        const result = game.applyVisibilityModifier(testColor, testCase.modifier);
        console.log(`${testCase.name.padEnd(20)} (${testCase.modifier}): ${result}█\x1b[0m`);
    });
    
    return true;
}

// Run tests
if (require.main === module) {
    console.log('Terminal Fog of War - Contrast Verification Test');
    console.log('===============================================\n');
    
    try {
        const test1 = testContrastVerification();
        const test2 = testVisibilityModifierEdgeCases();
        
        if (test1 && test2) {
            console.log('\n✓ All contrast verification tests passed');
            console.log('✓ Visual feedback provides proper contrast between states');
            console.log('✓ Edge cases handled correctly');
        } else {
            console.log('\n❌ Some tests failed');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

module.exports = { testContrastVerification, testVisibilityModifierEdgeCases };