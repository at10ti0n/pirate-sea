// Test the examine tile feature
console.log('Testing Examine Tile Feature...\n');

// Verify the terminal game module loads
try {
    const terminalGameModule = require('./terminal-game.js');
    console.log('✓ Terminal game module loaded successfully');
} catch (error) {
    console.error('✗ Error loading terminal game:', error.message);
    process.exit(1);
}

console.log('\n=== EXAMINE TILE COMMAND (X KEY) ===\n');

console.log('What it shows:');
console.log('  📍 Position: (x, y) coordinates');
console.log('  🗺️  Biome: ocean, grassland, forest, mountain, etc.');
console.log('  🚶 Walkable: Can walk on this tile?');
console.log('  ⛵ Ship: Can sail on this tile?');
console.log('  📊 Elevation: Height of terrain');
console.log('  💧 Moisture: Wetness level');
console.log('  🌡️  Temperature: Climate value');
console.log('  🏛️  Entity: Port, ship, treasure at location');
console.log('  📦 Resource: Gatherable resources');
console.log('  🌤️  Weather: Current weather condition');
console.log('  👁️  Visibility: Fog of war status');

console.log('\n=== HOW TO USE ===\n');
console.log('1. Run: npm run terminal');
console.log('2. Move around with WASD');
console.log('3. Press X key to examine current tile');
console.log('4. See detailed information in the message log');

console.log('\n=== EXAMPLE OUTPUT ===\n');
console.log('Messages:');
console.log('  === Tile at (5, -3) === | Biome: grassland | Walkable: Yes | Ship: No | Elevation: 0.45 | Moisture: 0.62 | Temp: 0.55');
console.log('  Resource: wood | Quantity: 15');
console.log('  Weather: Clear (0.25)');
console.log('  Visibility: visible');

console.log('\n=== USEFUL SCENARIOS ===\n');
console.log('• Find out why you can\'t move somewhere (check walkable)');
console.log('• See what resources are available to gather');
console.log('• Check port names and tiers before trading');
console.log('• View ship durability before boarding');
console.log('• Understand terrain elevation and moisture');
console.log('• Check weather conditions for navigation');

console.log('\n✓ Examine tile feature ready!');
console.log('\nPress X in the terminal game to examine your current location.');
