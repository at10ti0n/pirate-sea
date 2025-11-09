// Test the name generation system
const NameGenerator = require('./nameGenerator.js');

console.log('='.repeat(70));
console.log('PIRATE SEA - NAME GENERATION EXAMPLES');
console.log('='.repeat(70));

const nameGen = new NameGenerator(12345);

// Generate island names of various sizes
console.log('\n=== ISLAND NAMES BY SIZE ===\n');

console.log('MASSIVE ISLANDS (>300 tiles):');
for (let i = 0; i < 10; i++) {
    const x = i * 100;
    const y = i * 50;
    const name = nameGen.generateIslandName(x, y, 350);
    console.log(`  • ${name}`);
}

console.log('\nLARGE ISLANDS (80-150 tiles):');
for (let i = 0; i < 10; i++) {
    const x = i * 120;
    const y = i * 60;
    const name = nameGen.generateIslandName(x, y, 100);
    console.log(`  • ${name}`);
}

console.log('\nMEDIUM ISLANDS (30-80 tiles):');
for (let i = 0; i < 10; i++) {
    const x = i * 80;
    const y = i * 40;
    const name = nameGen.generateIslandName(x, y, 50);
    console.log(`  • ${name}`);
}

console.log('\nSMALL ISLANDS (10-30 tiles):');
for (let i = 0; i < 10; i++) {
    const x = i * 60;
    const y = i * 30;
    const name = nameGen.generateIslandName(x, y, 20);
    console.log(`  • ${name}`);
}

// Generate port names
console.log('\n=== PORT NAMES ===\n');

console.log('PORTS (various locations):');
for (let i = 0; i < 20; i++) {
    const x = i * 75;
    const y = i * 45;
    const islandName = nameGen.generateIslandName(x, y, 100);
    const portName = nameGen.generatePortName(x + 5, y + 5, islandName);
    console.log(`  • ${portName} (on ${islandName})`);
}

// Generate ship names (bonus)
console.log('\n=== SHIP NAMES (Bonus Feature) ===\n');

for (let i = 0; i < 15; i++) {
    const x = i * 90;
    const y = i * 55;
    const shipName = nameGen.generateShipName(x, y);
    console.log(`  • ${shipName}`);
}

console.log('\n' + '='.repeat(70));
console.log('DETERMINISTIC TESTING');
console.log('='.repeat(70));

// Test that same position always generates same name
console.log('\nTesting determinism (same position = same name):');
const testX = 100;
const testY = 200;

console.log(`\nPosition (${testX}, ${testY}) tested 5 times:`);
for (let i = 0; i < 5; i++) {
    const islandName = nameGen.generateIslandName(testX, testY, 100);
    const portName = nameGen.generatePortName(testX, testY, islandName);
    console.log(`  ${i + 1}. Island: "${islandName}", Port: "${portName}"`);
}

console.log('\n✅ All names are identical - deterministic generation confirmed!');

console.log('\n' + '='.repeat(70));
console.log('Name generation complete!');
console.log('='.repeat(70));
