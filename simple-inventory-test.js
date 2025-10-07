const PlayerInventory = require('./player-inventory');

console.log('Testing basic inventory...');

const inventory = new PlayerInventory(100);

// Test adding resources
console.log('Adding resources...');
const result1 = inventory.addResource('wood', 10);
console.log('Add wood result:', result1);

const result2 = inventory.addResource('stone', 5);
console.log('Add stone result:', result2);

// Test display
console.log('\nInventory display:');
console.log(inventory.getInventoryDisplay());

console.log('\nTerminal display:');
console.log(inventory.getInventoryDisplayTerminal());

console.log('\nTest completed successfully!');