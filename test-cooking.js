// Test the cooking system
const FoodSystem = require('./food-system.js');
const Player = require('./player.js');

// Mock MapGenerator for testing
class MockMapGenerator {
    isWalkable(x, y) {
        return true;
    }
}

console.log('='.repeat(70));
console.log('PIRATE SEA - COOKING SYSTEM TEST');
console.log('='.repeat(70));

// Initialize systems
const foodSystem = new FoodSystem();
const mapGen = new MockMapGenerator();
const player = new Player(mapGen);

console.log('\n=== COOKING LOCATIONS ===\n');

const locations = ['ship', 'port', 'campfire', 'settlement', 'tavern', 'wilderness'];
console.log('Valid cooking locations:');
locations.forEach(loc => {
    const check = player.canCookHere(loc);
    console.log(`  ${loc}: ${check.canCook ? '✓ Can cook' : '✗ ' + check.reason}`);
});

console.log('\n=== ADDING RAW FISH TO INVENTORY ===\n');

player.addFood('fish', 5);
player.addFood('berries', 3); // Can't be cooked
player.addFood('hardtack', 2); // Can't be cooked

console.log('Current inventory:');
player.getFoodInventory().forEach(item => {
    const info = foodSystem.getFoodInfo(item.type);
    console.log(`  - ${info.name} x${item.quantity}`);
});

console.log('\n=== CHECKING WHAT CAN BE COOKED ===\n');

const cookableItems = player.getCookableItems(foodSystem);
console.log(`Found ${cookableItems.length} cookable item(s):`);

cookableItems.forEach(item => {
    console.log(`\n${item.name} (x${item.quantity}) → ${item.becomesName}`);
    console.log(`  Improvements:`);
    console.log(`    HP: +${item.improvement.hp} (better healing)`);
    console.log(`    Hunger: +${item.improvement.hunger}% (more filling)`);
    console.log(`    Shelf Life: +${item.improvement.spoilTime}h (lasts longer)`);
});

console.log('\n=== TRYING TO COOK WITHOUT PROPER LOCATION ===\n');

console.log('Attempting to cook at "wilderness"...');
let result = player.cookFood('fish', foodSystem, 'wilderness');
if (result.success) {
    console.log(`✓ ${result.message}`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log('\n=== COOKING ON A SHIP ===\n');

// Put player on a ship
player.mode = 'ship';
console.log(`Player mode: ${player.mode}`);

console.log('\nCooking raw fish on ship galley...');
result = player.cookFood('fish', foodSystem, 'ship');
if (result.success) {
    console.log(`✓ ${result.message}`);
    console.log(`\nResult:`);
    console.log(`  - Removed: ${result.rawFood} x1`);
    console.log(`  - Added: ${result.cookedFood} x1`);
    console.log(`  - HP Restore: ${result.cookedFoodInfo.restores}`);
    console.log(`  - Hunger Restore: ${result.cookedFoodInfo.hungerRestore}%`);
    console.log(`  - Shelf Life: ${result.cookedFoodInfo.spoilTime}h`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log('\nInventory after cooking:');
player.getFoodInventory().forEach(item => {
    const info = foodSystem.getFoodInfo(item.type);
    console.log(`  - ${info.name} x${item.quantity}`);
});

console.log('\n=== COOKING AT A PORT ===\n');

console.log('Cooking another raw fish at port...');
result = player.cookFood('fish', foodSystem, 'port');
if (result.success) {
    console.log(`✓ ${result.message}`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log('\n=== COOKING AT A CAMPFIRE ===\n');

player.mode = 'foot'; // Change to foot mode
console.log(`Player mode: ${player.mode}`);

console.log('\nCooking raw fish at campfire...');
result = player.cookFood('fish', foodSystem, 'campfire');
if (result.success) {
    console.log(`✓ ${result.message}`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log('\n=== TRYING TO COOK FOOD THAT CAN\'T BE COOKED ===\n');

console.log('Attempting to cook berries...');
result = player.cookFood('berries', foodSystem, 'campfire');
if (result.success) {
    console.log(`✓ ${result.message}`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log('\nAttempting to cook hardtack...');
result = player.cookFood('hardtack', foodSystem, 'campfire');
if (result.success) {
    console.log(`✓ ${result.message}`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log('\n=== COOKING ALL REMAINING FISH ===\n');

const fishCount = player.getFoodQuantity('fish');
console.log(`Raw fish remaining: ${fishCount}`);

for (let i = 0; i < fishCount; i++) {
    result = player.cookFood('fish', foodSystem, 'campfire');
    if (result.success) {
        console.log(`  ${i + 1}. ✓ Cooked fish`);
    } else {
        console.log(`  ${i + 1}. ✗ ${result.message}`);
        break;
    }
}

console.log('\n=== FINAL INVENTORY ===\n');

const finalInventory = player.getFoodInventory();
console.log('All food items:');
finalInventory.forEach(item => {
    const info = foodSystem.getFoodInfo(item.type);
    const canCook = foodSystem.canCook(item.type);
    console.log(`  - ${info.name} x${item.quantity} ${canCook ? '(cookable)' : ''}`);
});

console.log('\n=== TESTING BENEFITS OF COOKING ===\n');

// Create a fresh player to test
const testPlayer = new Player(mapGen);
testPlayer.mode = 'ship';

// Scenario 1: Eat raw fish
testPlayer.addFood('fish', 1);
console.log('Scenario 1: Eating RAW fish');
console.log(`  Starting hunger: ${testPlayer.getHunger()}%`);
testPlayer.decreaseHunger(50); // Get hungry
console.log(`  After getting hungry: ${testPlayer.getHunger()}%`);

let eatResult = testPlayer.eatFood('fish', foodSystem);
console.log(`  ${eatResult.message}`);
console.log(`  Final hunger: ${testPlayer.getHunger()}%`);
console.log(`  HP restored: ${eatResult.healthRestored}`);

// Scenario 2: Eat cooked fish
const testPlayer2 = new Player(mapGen);
testPlayer2.mode = 'ship';
testPlayer2.addFood('fish', 1);
console.log('\nScenario 2: Eating COOKED fish');
console.log(`  Starting hunger: ${testPlayer2.getHunger()}%`);
testPlayer2.decreaseHunger(50); // Get hungry
console.log(`  After getting hungry: ${testPlayer2.getHunger()}%`);

// Cook it first
testPlayer2.cookFood('fish', foodSystem, 'ship');
console.log('  Cooked the fish first');

eatResult = testPlayer2.eatFood('cooked_fish', foodSystem);
console.log(`  ${eatResult.message}`);
console.log(`  Final hunger: ${testPlayer2.getHunger()}%`);
console.log(`  HP restored: ${eatResult.healthRestored}`);

console.log('\n📊 COMPARISON:');
console.log(`  Raw fish: 20 HP, 40% hunger`);
console.log(`  Cooked fish: 30 HP, 60% hunger`);
console.log(`  Improvement: +10 HP (+50%), +20% hunger (+50%)`);
console.log(`  Shelf life: 24h → 72h (3x longer)`);

console.log('\n' + '='.repeat(70));
console.log('Cooking system test complete!');
console.log('='.repeat(70));

console.log('\n💡 HOW TO COOK FOOD:');
console.log('  1. Obtain raw fish (catch, buy at port)');
console.log('  2. Go to a cooking location (ship, port, campfire, settlement)');
console.log('  3. Call: player.cookFood("fish", foodSystem, "ship")');
console.log('  4. Raw fish → Cooked fish in inventory');
console.log('  5. Enjoy better HP restore, hunger restore, and longer shelf life!');
