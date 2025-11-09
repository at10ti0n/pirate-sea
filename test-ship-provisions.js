// Test the ship provisions system
const FoodSystem = require('./food-system.js');
const ShipProvisions = require('./ship-provisions.js');
const Player = require('./player.js');

// Mock MapGenerator for testing
class MockMapGenerator {
    isWalkable(x, y) {
        return true;
    }
}

// Mock EntityManager for testing
class MockEntityManager {
    constructor() {
        this.entities = new Map();
    }

    addEntity(entity) {
        const key = `${entity.x},${entity.y}`;
        this.entities.set(key, entity);
    }

    removeEntity(x, y) {
        const key = `${x},${y}`;
        this.entities.delete(key);
    }

    getEntityAt(x, y) {
        const key = `${x},${y}`;
        return this.entities.get(key);
    }

    createShipDurability(maxHP) {
        return {
            current: maxHP,
            max: maxHP,
            condition: 'good',
            lastDamage: Date.now()
        };
    }
}

console.log('='.repeat(70));
console.log('PIRATE SEA - SHIP PROVISIONS SYSTEM TEST');
console.log('='.repeat(70));

// Initialize systems
const foodSystem = new FoodSystem();
const shipProvisionsSystem = new ShipProvisions();
const mapGen = new MockMapGenerator();
const entityManager = new MockEntityManager();
const player = new Player(mapGen);

console.log('\n=== SHIP TYPE INFORMATION ===\n');
const shipTypes = ['dinghy', 'sloop', 'brigantine', 'frigate', 'galleon'];
shipTypes.forEach(type => {
    const info = shipProvisionsSystem.getShipTypeInfo(type);
    console.log(`${info.name}:`);
    console.log(`  - Max Provisions: ${info.maxProvisions}`);
    console.log(`  - Recovery Rate: ${info.restRecoveryPerHour} HP/hour`);
    console.log(`  - Consumption: ${info.provisionConsumptionRate} provisions/hour`);
    console.log(`  - Cargo Capacity: ${info.cargoCapacity}`);
    console.log(`  - ${info.description}`);
    console.log();
});

console.log('=== INITIALIZING SHIP PROVISIONS ===\n');

// Create a ship with provisions
console.log('Creating a Sloop with provisions...');
const shipProvisions = shipProvisionsSystem.initializeShipProvisions('sloop', 15);
console.log(`Ship Type: ${shipProvisions.shipType}`);
console.log(`Current Provisions: ${shipProvisions.currentProvisions}`);
console.log(`Max Provisions: ${shipProvisions.maxProvisions}`);
console.log(`Recovery Rate: ${shipProvisions.restRecoveryPerHour} HP/hour`);
console.log(`Consumption Rate: ${shipProvisions.provisionConsumptionRate} provisions/hour`);

const status1 = shipProvisionsSystem.getProvisionStatus(shipProvisions);
console.log(`Status: ${status1.status} (${status1.percent}%)`);

console.log('\n=== TESTING PROVISION ADDITION ===\n');

console.log('Adding 10 provisions...');
let result = shipProvisionsSystem.addProvisions(shipProvisions, 10);
console.log(`Added: ${result.added}`);
console.log(`Current: ${result.current}/${result.max}`);
console.log(`Overflow: ${result.overflow}`);

console.log('\nTrying to overfill (adding 20 more)...');
result = shipProvisionsSystem.addProvisions(shipProvisions, 20);
console.log(`Added: ${result.added}`);
console.log(`Current: ${result.current}/${result.max}`);
console.log(`Overflow: ${result.overflow} provisions couldn't fit`);

console.log('\n=== TESTING REST ON SHIP ===\n');

// Simulate damage
console.log('Player takes 40 damage...');
player.takeDamage(40);
console.log(`Health: ${player.getHealth().current}/${player.getHealth().max} HP`);

// Simulate hunger loss
console.log('Player loses 30% hunger...');
player.decreaseHunger(30);
console.log(`Hunger: ${player.getHunger()}%`);

// Manually set ship provisions on player for testing
player.mode = 'ship';
player.shipProvisions = shipProvisions;

console.log('\nResting on ship for 4 hours...');
result = player.restOnShip(4, foodSystem, shipProvisionsSystem);
if (result.success) {
    console.log(`✓ ${result.message}`);
    console.log(`  Health Restored: ${result.healthRestored} HP`);
    console.log(`  Hunger Restored: ${result.hungerRestored}%`);
    console.log(`  Provisions Consumed: ${result.provisionsConsumed}`);
    console.log(`  Provisions Remaining: ${result.provisionsRemaining}`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log(`\nCurrent Health: ${player.getHealth().current}/${player.getHealth().max} HP`);
console.log(`Current Hunger: ${player.getHunger()}%`);

console.log('\n=== TESTING PROVISION PURCHASE ===\n');

console.log(`Player Gold: ${player.getGold()}g`);
console.log(`Ship Provisions: ${shipProvisions.currentProvisions.toFixed(1)}/${shipProvisions.maxProvisions}`);

console.log('\nPurchasing 10 provisions at a medium port...');
const cost = shipProvisionsSystem.getProvisionCost(10, 'medium');
console.log(`Cost: ${cost}g`);

result = player.purchaseShipProvisions(10, 'medium', shipProvisionsSystem);
if (result.success) {
    console.log(`✓ ${result.message}`);
    console.log(`  Purchased: ${result.purchased}`);
    console.log(`  Cost: ${result.cost}g`);
    console.log(`  Provisions: ${result.current}/${result.max}`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log(`\nPlayer Gold: ${player.getGold()}g`);

console.log('\n=== TESTING DIFFERENT PORT TIERS ===\n');

const portTiers = ['small', 'medium', 'large', 'capital'];
portTiers.forEach(tier => {
    const cost = shipProvisionsSystem.getProvisionCost(10, tier);
    console.log(`${tier.charAt(0).toUpperCase() + tier.slice(1)} Port: ${cost}g for 10 provisions`);
});

console.log('\n=== TESTING MAX REST HOURS ===\n');

const maxHours = shipProvisionsSystem.getMaxRestHours(shipProvisions);
console.log(`Current Provisions: ${shipProvisions.currentProvisions.toFixed(1)}`);
console.log(`Max Rest Hours: ${maxHours} hours`);
console.log(`That's ${Math.floor(maxHours / 24)} days and ${maxHours % 24} hours`);

console.log('\n=== TESTING VOYAGE PLANNING ===\n');

console.log('Planning voyages for different ship types:');
const voyageDays = 7;
shipTypes.forEach(type => {
    const voyage = shipProvisionsSystem.calculateVoyageProvisions(voyageDays, type);
    console.log(`\n${voyage.shipType} - ${voyage.days} day voyage:`);
    console.log(`  Provisions Needed: ${voyage.provisionsNeeded}`);
    console.log(`  Recommended (with buffer): ${voyage.recommended}`);
});

console.log('\n=== TESTING COMBAT RESTRICTION ===\n');

console.log('Player enters combat...');
player.enterCombat();
console.log(`In Combat: ${player.isInCombat()}`);

console.log('\nTrying to rest while in combat...');
result = player.restOnShip(2, foodSystem, shipProvisionsSystem);
if (result.success) {
    console.log(`✓ ${result.message}`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log('\nPlayer exits combat...');
player.exitCombat();
console.log(`In Combat: ${player.isInCombat()}`);

console.log('\nTrying to rest again...');
result = player.restOnShip(2, foodSystem, shipProvisionsSystem);
if (result.success) {
    console.log(`✓ ${result.message}`);
    console.log(`  Health Restored: ${result.healthRestored} HP`);
    console.log(`  Provisions Remaining: ${result.provisionsRemaining.toFixed(1)}`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log('\n=== TESTING PROVISION DEPLETION ===\n');

console.log(`Current Provisions: ${shipProvisions.currentProvisions.toFixed(1)}`);
const maxRestHours = shipProvisionsSystem.getMaxRestHours(shipProvisions);
console.log(`Can rest for: ${maxRestHours} hours`);

console.log(`\nResting for ${maxRestHours + 2} hours (more than available)...`);
result = player.restOnShip(maxRestHours + 2, foodSystem, shipProvisionsSystem);
if (result.success) {
    console.log(`✓ ${result.message}`);
} else {
    console.log(`✗ ${result.message}`);
    console.log(`  Required: ${result.provisionsConsumed || 'N/A'}`);
}

console.log('\n=== TESTING PROVISION TRANSFER ===\n');

console.log('Creating a second ship...');
const ship2Provisions = shipProvisionsSystem.initializeShipProvisions('brigantine', 20);
console.log(`Ship 1 Provisions: ${shipProvisions.currentProvisions.toFixed(1)}`);
console.log(`Ship 2 Provisions: ${ship2Provisions.currentProvisions.toFixed(1)}`);

console.log('\nTransferring 10 provisions from Ship 2 to Ship 1...');
result = shipProvisionsSystem.transferProvisions(ship2Provisions, shipProvisions, 10);
if (result.success) {
    console.log(`✓ ${result.message}`);
    console.log(`  Transferred: ${result.transferred}`);
    console.log(`  Ship 1 Provisions: ${result.destRemaining.toFixed(1)}`);
    console.log(`  Ship 2 Provisions: ${result.sourceRemaining.toFixed(1)}`);
} else {
    console.log(`✗ ${result.message}`);
}

console.log('\n=== TESTING PROVISION STATUS DISPLAY ===\n');

// Test different provision levels
const testLevels = [
    { provisions: shipProvisions, label: 'Full Provisions' },
    { provisions: shipProvisionsSystem.initializeShipProvisions('sloop', 20), label: 'Moderate Provisions' },
    { provisions: shipProvisionsSystem.initializeShipProvisions('sloop', 10), label: 'Low Provisions' },
    { provisions: shipProvisionsSystem.initializeShipProvisions('sloop', 5), label: 'Critical Provisions' }
];

testLevels.forEach(test => {
    const status = shipProvisionsSystem.getProvisionStatus(test.provisions);
    console.log(`${test.label}:`);
    console.log(`  ${status.current}/${status.max} (${status.percent}%) - ${status.status}`);
    console.log(`  Recovery: ${status.recoveryRate}, Consumption: ${status.consumptionRate}`);
});

console.log('\n=== FINAL PLAYER STATUS ===\n');
const finalStatus = player.getStatusSummary(foodSystem);
console.log(`Health: ${finalStatus.health}`);
console.log(`Hunger: ${finalStatus.hunger}`);
console.log(`Gold: ${finalStatus.gold}`);
console.log(`Mode: ${finalStatus.mode}`);
console.log(`Game Time: ${finalStatus.gameTime}`);

if (player.hasShipProvisions()) {
    const provisionStatus = player.getShipProvisionStatus(shipProvisionsSystem);
    console.log(`\nShip: ${provisionStatus.shipType}`);
    console.log(`Provisions: ${provisionStatus.current}/${provisionStatus.max} (${provisionStatus.percent}%) - ${provisionStatus.status}`);
}

console.log('\n' + '='.repeat(70));
console.log('Ship provisions system test complete!');
console.log('='.repeat(70));
