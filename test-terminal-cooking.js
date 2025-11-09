// Quick test of terminal game cooking integration
const FoodSystem = require('./food-system.js');
const Player = require('./player.js');

// Mock MapGenerator for testing
class MockMapGenerator {
    isWalkable(x, y) {
        return true;
    }
}

console.log('='.repeat(70));
console.log('TERMINAL GAME - COOKING INTEGRATION TEST');
console.log('='.repeat(70));

const foodSystem = new FoodSystem();
const mapGen = new MockMapGenerator();
const player = new Player(mapGen);

console.log('\n=== INITIAL STATE ===\n');
console.log('Player initialized with:');
console.log(`  Health: ${player.getHealth().current}/${player.getHealth().max} HP`);
console.log(`  Hunger: ${player.getHunger()}%`);
console.log(`  Food inventory: ${player.getFoodInventory().length} items`);

console.log('\n=== ADDING STARTING FOOD ===\n');
player.addFood('fish', 3);
player.addFood('berries', 2);
player.addFood('hardtack', 5);

console.log('Added starting food:');
player.getFoodInventory().forEach(item => {
    const info = foodSystem.getFoodInfo(item.type);
    console.log(`  - ${info.name} x${item.quantity}`);
});

console.log('\n=== TESTING COOKING (C KEY) ===\n');

// Simulate being on a ship
player.mode = 'ship';
console.log(`Player mode: ${player.mode}`);

const cookableItems = player.getCookableItems(foodSystem);
console.log(`\nCookable items found: ${cookableItems.length}`);
if (cookableItems.length > 0) {
    console.log(`  Will cook: ${cookableItems[0].name}`);

    const result = player.cookFood(cookableItems[0].type, foodSystem, 'ship');
    if (result.success) {
        console.log(`  ✓ ${result.message}`);
    } else {
        console.log(`  ✗ ${result.message}`);
    }
}

console.log('\nFood inventory after cooking:');
player.getFoodInventory().forEach(item => {
    const info = foodSystem.getFoodInfo(item.type);
    const cookable = foodSystem.canCook(item.type) ? ' (cookable)' : '';
    console.log(`  - ${info.name} x${item.quantity}${cookable}`);
});

console.log('\n=== TESTING EATING (E KEY) ===\n');

// Simulate damage and hunger
console.log('Simulating damage and hunger...');
player.takeDamage(30);
player.decreaseHunger(40);
console.log(`  Health: ${player.getHealth().current}/${player.getHealth().max} HP`);
console.log(`  Hunger: ${player.getHunger()}%`);

const foodInventory = player.getFoodInventory();
if (foodInventory.length > 0) {
    const foodItem = foodInventory[0];
    const foodInfo = foodSystem.getFoodInfo(foodItem.type);
    console.log(`\nEating: ${foodInfo.name}`);

    const result = player.eatFood(foodItem.type, foodSystem);
    if (result.success) {
        console.log(`  ✓ ${result.message}`);
        console.log(`  Health after: ${player.getHealth().current}/${player.getHealth().max} HP`);
        console.log(`  Hunger after: ${player.getHunger()}%`);
    } else {
        console.log(`  ✗ ${result.message}`);
    }
}

console.log('\n=== HUNGER STATUS TEST ===\n');

const hungerStatus = foodSystem.getHungerStatus(player.hunger);
console.log(`Current hunger: ${Math.floor(player.hunger)}%`);
console.log(`Status: ${hungerStatus.message}`);
console.log(`Recovery multiplier: ${hungerStatus.recoveryMultiplier}x`);

console.log('\n=== FOOD INVENTORY DISPLAY ===\n');

const finalInventory = player.getFoodInventory();
if (finalInventory.length > 0) {
    console.log('--- Food Inventory ---');
    finalInventory.forEach(item => {
        const info = foodSystem.getFoodInfo(item.type);
        const spoiled = foodSystem.isSpoiled(item, player.gameTime);
        const status = spoiled ? ' [SPOILED]' : '';
        const cookable = foodSystem.canCook(item.type) ? ' (cookable)' : '';
        console.log(`  ${info.name} x${item.quantity}${status}${cookable} - ${info.restores}HP, ${info.hungerRestore}% hunger`);
    });
} else {
    console.log('--- Food Inventory ---');
    console.log('  (no food)');
}

console.log('\n' + '='.repeat(70));
console.log('Terminal game cooking integration test complete!');
console.log('='.repeat(70));

console.log('\n📝 USAGE IN TERMINAL GAME:');
console.log('  C key - Cook food (auto-detects location: ship/port/campfire)');
console.log('  E key - Eat food (first item in inventory)');
console.log('  I key - View inventory (now shows food items)');
console.log('  Status bar shows: Health: XX/100 HP | Hunger: XX% (status)');
