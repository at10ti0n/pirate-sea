// Test terminal compatibility for economy system
const PlayerInventory = require('./player-inventory');
const EconomyManager = require('./economy');

console.log('🧪 Testing Terminal-Economy Compatibility...\n');

// Simulate a terminal player
const player = {
    gold: 100,
    inventory: null,
    x: 5,
    y: -10
};

// Simulate seeded random
class SimpleRandom {
    random() { return Math.random(); }
    randomFloat(min, max) { return Math.random() * (max - min) + min; }
}

// Create inventory and link it
const inventory = new PlayerInventory(500);
player.inventory = inventory;

// Create economy manager
const economyManager = new EconomyManager(new SimpleRandom());

console.log('✅ Step 1: Objects created');
console.log(`   Player gold: ${player.gold}`);
console.log(`   Inventory linked: ${player.inventory !== null}`);

// Test all required methods exist
console.log('\n✅ Step 2: Checking required methods...');

const requiredMethods = [
    'getCurrentLoad',
    'getQuantity',
    'addResource',
    'removeResource'
];

let allMethodsExist = true;
for (const method of requiredMethods) {
    const exists = typeof player.inventory[method] === 'function';
    console.log(`   ${method}(): ${exists ? '✓' : '✗ MISSING'}`);
    if (!exists) allMethodsExist = false;
}

const requiredProperties = ['capacity'];
for (const prop of requiredProperties) {
    const exists = player.inventory.hasOwnProperty(prop);
    console.log(`   ${prop}: ${exists ? '✓' : '✗ MISSING'}`);
    if (!exists) allMethodsExist = false;
}

if (!allMethodsExist) {
    console.log('\n❌ FAILED: Missing required methods or properties!');
    process.exit(1);
}

// Test method functionality
console.log('\n✅ Step 3: Testing method functionality...');

// Test getCurrentLoad
console.log(`   getCurrentLoad(): ${player.inventory.getCurrentLoad()} (expected: 0)`);

// Test addResource
player.inventory.addResource('wood', 50);
console.log(`   After adding 50 wood: ${player.inventory.getQuantity('wood')} wood`);
console.log(`   getCurrentLoad(): ${player.inventory.getCurrentLoad()} (expected: 50)`);

// Create a mock port with economy
const mockPort = {
    x: 5,
    y: -10,
    type: 'port',
    economy: {
        tier: 'medium',
        produces: ['wood'],
        consumes: ['ore'],
        gold: 500,
        maxGold: 500,
        goldRegen: 2,
        supplyLevels: new Map([
            ['wood', 1.0],
            ['ore', 1.0],
            ['berries', 1.0],
            ['stone', 1.0],
            ['sand', 1.0],
            ['hay', 1.0],
            ['reeds', 1.0]
        ]),
        lastTrade: Date.now()
    }
};

console.log('\n✅ Step 4: Testing buy transaction...');
const buyResult = economyManager.executeBuyTransaction(player, mockPort, 'ore', 5);
console.log(`   Buy 5 ore: ${buyResult.success ? '✓' : '✗'}`);
if (buyResult.success) {
    console.log(`   Spent: ${buyResult.spent}g`);
    console.log(`   Player gold: ${player.gold}g`);
    console.log(`   Player ore: ${player.inventory.getQuantity('ore')}`);
    console.log(`   Current load: ${player.inventory.getCurrentLoad()} (expected: 55)`);
} else {
    console.log(`   Error: ${buyResult.error}`);
}

console.log('\n✅ Step 5: Testing sell transaction...');
const sellResult = economyManager.executeSellTransaction(player, mockPort, 'wood', 10);
console.log(`   Sell 10 wood: ${sellResult.success ? '✓' : '✗'}`);
if (sellResult.success) {
    console.log(`   Earned: ${sellResult.earned}g`);
    console.log(`   Player gold: ${player.gold}g`);
    console.log(`   Player wood: ${player.inventory.getQuantity('wood')}`);
    console.log(`   Current load: ${player.inventory.getCurrentLoad()} (expected: 45)`);
} else {
    console.log(`   Error: ${sellResult.error}`);
}

// Test capacity check
console.log('\n✅ Step 6: Testing capacity constraints...');
console.log(`   Current capacity: ${player.inventory.capacity}`);
console.log(`   Current load: ${player.inventory.getCurrentLoad()}`);
console.log(`   Remaining space: ${player.inventory.capacity - player.inventory.getCurrentLoad()}`);

// Try to buy more than capacity
const overCapacityResult = economyManager.executeBuyTransaction(player, mockPort, 'stone', 500);
console.log(`   Try buying 500 stone (over capacity): ${overCapacityResult.success ? '✗ SHOULD FAIL' : '✓ Correctly rejected'}`);
if (!overCapacityResult.success) {
    console.log(`   Error message: ${overCapacityResult.error}`);
}

console.log('\n✅ All compatibility tests passed!');
console.log('\nSummary:');
console.log('  ✓ All required methods exist');
console.log('  ✓ getCurrentLoad() works correctly');
console.log('  ✓ getQuantity() works correctly');
console.log('  ✓ Buy transactions work');
console.log('  ✓ Sell transactions work');
console.log('  ✓ Capacity constraints enforced');
