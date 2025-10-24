// Test the food and hunger system
const FoodSystem = require('./food-system.js');
const Player = require('./player.js');

// Mock MapGenerator for testing
class MockMapGenerator {
    isWalkable(x, y) {
        return true;
    }
}

console.log('='.repeat(70));
console.log('PIRATE SEA - FOOD & HUNGER SYSTEM TEST');
console.log('='.repeat(70));

// Initialize systems
const foodSystem = new FoodSystem();
const mapGen = new MockMapGenerator();
const player = new Player(mapGen);

console.log('\n=== INITIAL PLAYER STATUS ===\n');
const initialStatus = player.getStatusSummary(foodSystem);
console.log(`Health: ${initialStatus.health}`);
console.log(`Hunger: ${initialStatus.hunger}`);
console.log(`Gold: ${initialStatus.gold}`);
console.log(`Game Time: ${initialStatus.gameTime}`);

console.log('\n=== AVAILABLE FOOD TYPES ===\n');
const foodTypes = foodSystem.getAllFoodTypes();
foodTypes.forEach(foodType => {
    const info = foodSystem.getFoodInfo(foodType);
    console.log(`${info.name}:`);
    console.log(`  - Restores: ${info.restores} HP`);
    console.log(`  - Hunger Restore: ${info.hungerRestore}%`);
    console.log(`  - Cost: ${info.cost}g`);
    console.log(`  - Spoil Time: ${info.spoilTime ? info.spoilTime + 'h' : 'Never'}`);
    console.log(`  - Weight: ${info.weight}`);
    console.log();
});

console.log('=== TESTING FOOD INVENTORY ===\n');

// Add some food to inventory
console.log('Adding food to inventory...');
player.addFood('berries', 5);
player.addFood('fish', 3);
player.addFood('hardtack', 10);
player.addFood('rum', 2);

console.log('\nCurrent inventory:');
const inventory = player.getFoodInventory();
inventory.forEach(item => {
    const info = foodSystem.getFoodInfo(item.type);
    console.log(`  - ${info.name} x${item.quantity}`);
});

console.log('\n=== TESTING EATING FOOD ===\n');

// Simulate some damage and hunger
console.log('Taking 30 damage...');
player.takeDamage(30);
console.log('Decreasing hunger by 40%...');
player.decreaseHunger(40);

console.log('\nStatus before eating:');
let status = player.getStatusSummary(foodSystem);
console.log(`  Health: ${status.health}`);
console.log(`  Hunger: ${status.hunger}`);

console.log('\nEating berries...');
let eatResult = player.eatFood('berries', foodSystem);
console.log(`  ${eatResult.message}`);

status = player.getStatusSummary(foodSystem);
console.log(`  Health after: ${status.health}`);
console.log(`  Hunger after: ${status.hunger}`);

console.log('\nEating fish...');
eatResult = player.eatFood('fish', foodSystem);
console.log(`  ${eatResult.message}`);

status = player.getStatusSummary(foodSystem);
console.log(`  Health after: ${status.health}`);
console.log(`  Hunger after: ${status.hunger}`);

console.log('\n=== TESTING HUNGER OVER TIME ===\n');

console.log('Advancing time by 5 hours...');
let timeResult = player.advanceTime(5, foodSystem);
status = player.getStatusSummary(foodSystem);
console.log(`  Hunger: ${status.hunger}`);
console.log(`  Status: ${timeResult.hungerStatus.message}`);

console.log('\nAdvancing time by 10 more hours...');
timeResult = player.advanceTime(10, foodSystem);
status = player.getStatusSummary(foodSystem);
console.log(`  Hunger: ${status.hunger}`);
console.log(`  Status: ${timeResult.hungerStatus.message}`);

console.log('\nAdvancing time by 30 more hours...');
timeResult = player.advanceTime(30, foodSystem);
status = player.getStatusSummary(foodSystem);
console.log(`  Hunger: ${status.hunger}`);
console.log(`  Status: ${timeResult.hungerStatus.message}`);

console.log('\n=== TESTING STARVATION ===\n');

console.log('Advancing time by 50 hours without eating...');
timeResult = player.advanceTime(50, foodSystem);
status = player.getStatusSummary(foodSystem);
console.log(`  Hunger: ${status.hunger}`);
console.log(`  Status: ${timeResult.hungerStatus.message}`);
console.log(`  Starvation Damage: ${timeResult.starvationDamage} HP`);
console.log(`  Health: ${status.health}`);

if (timeResult.starvationDamage > 0) {
    console.log('\n⚠️  Player is starving! Eating hardtack to survive...');
    eatResult = player.eatFood('hardtack', foodSystem);
    console.log(`  ${eatResult.message}`);
    status = player.getStatusSummary(foodSystem);
    console.log(`  Health: ${status.health}`);
    console.log(`  Hunger: ${status.hunger}`);
}

console.log('\n=== TESTING FOOD SPOILAGE ===\n');

// Add fresh fish
player.addFood('fish', 1);
console.log('Added fresh fish to inventory');
console.log(`Current game time: ${player.getGameTime()}h`);

// Advance time past spoil time for fish (24 hours)
console.log('\nAdvancing time by 30 hours...');
player.advanceTime(30, foodSystem);
console.log(`Current game time: ${player.getGameTime()}h`);

const fishInInventory = player.getFoodInventory().find(item => item.type === 'fish');
if (fishInInventory) {
    const isSpoiled = foodSystem.isSpoiled(fishInInventory, player.getGameTime());
    console.log(`Fish spoiled: ${isSpoiled ? 'Yes' : 'No'}`);

    if (isSpoiled) {
        console.log('\nTrying to eat spoiled fish...');
        eatResult = player.eatFood('fish', foodSystem);
        console.log(`  ${eatResult.message}`);
    }
}

console.log('\n=== TESTING COOKING SYSTEM ===\n');

// Add raw fish
player.addFood('fish', 1);
const rawFish = player.getFoodInventory().find(item => item.type === 'fish');
// Set it to fresh by updating purchase time
rawFish.purchasedAt = player.getGameTime();

console.log('Checking if fish can be cooked...');
const canCook = foodSystem.canCook('fish');
console.log(`Can cook fish: ${canCook ? 'Yes' : 'No'}`);

if (canCook) {
    console.log('\nCooking fish...');
    const cookResult = foodSystem.cookFood('fish');
    console.log(`  ${cookResult.message}`);

    if (cookResult.success) {
        // Remove raw fish, add cooked fish
        player.removeFood('fish', 1);
        player.addFood(cookResult.cookedFood, 1);

        console.log('\nComparing raw vs cooked fish:');
        const rawInfo = foodSystem.getFoodInfo('fish');
        const cookedInfo = foodSystem.getFoodInfo('cooked_fish');
        console.log(`  Raw Fish: ${rawInfo.restores} HP, ${rawInfo.hungerRestore}% hunger, ${rawInfo.spoilTime}h shelf life`);
        console.log(`  Cooked Fish: ${cookedInfo.restores} HP, ${cookedInfo.hungerRestore}% hunger, ${cookedInfo.spoilTime}h shelf life`);
    }
}

console.log('\n=== TESTING PORT FOOD AVAILABILITY ===\n');

const portTiers = ['small', 'medium', 'large', 'capital'];
portTiers.forEach(tier => {
    const available = foodSystem.getAvailableFoodAtPort(tier);
    console.log(`${tier.charAt(0).toUpperCase() + tier.slice(1)} Port:`);
    console.log(`  Available: ${available.map(f => foodSystem.getFoodInfo(f).name).join(', ')}`);
});

console.log('\n=== TESTING HUNGER STATUS EFFECTS ===\n');

const hungerLevels = [100, 80, 60, 40, 20, 0];
console.log('Hunger status at different levels:');
hungerLevels.forEach(level => {
    const status = foodSystem.getHungerStatus(level);
    console.log(`  ${level}%: ${status.message} (${status.recoveryMultiplier}x recovery)`);
});

console.log('\n=== FINAL PLAYER STATUS ===\n');
const finalStatus = player.getStatusSummary(foodSystem);
console.log(`Health: ${finalStatus.health}`);
console.log(`Hunger: ${finalStatus.hunger}`);
console.log(`Gold: ${finalStatus.gold}`);
console.log(`Game Time: ${finalStatus.gameTime}`);
console.log(`In Combat: ${finalStatus.inCombat}`);

console.log('\nFinal inventory:');
const finalInventory = player.getFoodInventory();
if (finalInventory.length > 0) {
    finalInventory.forEach(item => {
        const info = foodSystem.getFoodInfo(item.type);
        console.log(`  - ${info.name} x${item.quantity}`);
    });
} else {
    console.log('  (empty)');
}

console.log('\n' + '='.repeat(70));
console.log('Food system test complete!');
console.log('='.repeat(70));
