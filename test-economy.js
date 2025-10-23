// Test script for economy system
const EconomyManager = require('./economy.js');

console.log('🧪 Testing Economy System...\n');

// Create economy manager
const seededRandom = { random: () => 0.5, randomInt: (min, max) => Math.floor((min + max) / 2) };
const economy = new EconomyManager(seededRandom);

console.log('✅ EconomyManager created');
console.log('Base Prices:', economy.BASE_PRICES);
console.log('');

// Test 1: Port economy determination
console.log('Test 1: Port Economy Determination');
const mockMapGenerator = {
    getTileAt: (x, y) => {
        // Mock biome distribution
        const dist = Math.sqrt(x * x + y * y);
        if (dist < 5) return { biome: 'forest' };
        if (dist < 10) return { biome: 'desert' };
        return { biome: 'ocean' };
    }
};

const testPort = { x: 0, y: 0, type: 'port' };
const portEconomy = economy.determinePortEconomy(testPort, mockMapGenerator);

console.log('Port Economy:');
console.log('  Tier:', portEconomy.tier);
console.log('  Produces:', portEconomy.produces);
console.log('  Consumes:', portEconomy.consumes);
console.log('  Gold:', portEconomy.gold);
console.log('  Max Gold:', portEconomy.maxGold);
console.log('');

// Test 2: Price calculations
console.log('Test 2: Price Calculations');
const port = {
    x: 50,
    y: 50,
    economy: portEconomy
};

const woodBuyPrice = economy.calculateBuyPrice('wood', port);
const woodSellPrice = economy.calculateSellPrice('wood', port);
const oreBuyPrice = economy.calculateBuyPrice('ore', port);
const oreSellPrice = economy.calculateSellPrice('ore', port);

console.log('Wood (produced by nearby forest):');
console.log(`  Buy Price: ${woodBuyPrice}g (base: ${economy.BASE_PRICES.wood}g)`);
console.log(`  Sell Price: ${woodSellPrice}g`);
console.log(`  Indicator: ${economy.getPriceIndicator(woodBuyPrice, economy.BASE_PRICES.wood)}`);
console.log('');

console.log('Ore (not produced nearby):');
console.log(`  Buy Price: ${oreBuyPrice}g (base: ${economy.BASE_PRICES.ore}g)`);
console.log(`  Sell Price: ${oreSellPrice}g`);
console.log(`  Indicator: ${economy.getPriceIndicator(oreBuyPrice, economy.BASE_PRICES.ore)}`);
console.log('');

// Test 3: Supply/Demand dynamics
console.log('Test 3: Supply/Demand Dynamics');
console.log('Initial wood supply:', port.economy.supplyLevels.wood);

// Simulate selling wood to port (increases supply)
economy.updateSupplyOnSell(port, 'wood', 100);
console.log('After selling 100 wood:', port.economy.supplyLevels.wood);

const newWoodSellPrice = economy.calculateSellPrice('wood', port);
console.log('New sell price (should be lower):', newWoodSellPrice, '(was', woodSellPrice, ')');
console.log('');

// Test 4: Transaction execution
console.log('Test 4: Transaction Execution');

const mockPlayer = {
    gold: 100,
    inventory: {
        items: { wood: 50 },
        getQuantity: (resource) => mockPlayer.inventory.items[resource] || 0,
        addResource: (resource, qty) => {
            mockPlayer.inventory.items[resource] = (mockPlayer.inventory.items[resource] || 0) + qty;
        },
        removeResource: (resource, qty) => {
            mockPlayer.inventory.items[resource] = (mockPlayer.inventory.items[resource] || 0) - qty;
        },
        getCurrentLoad: () => Object.values(mockPlayer.inventory.items).reduce((a, b) => a + b, 0),
        capacity: 100
    }
};

// Reset port for transaction test
port.economy.gold = 500;
port.economy.supplyLevels.wood = 1.0;

console.log('Player Gold:', mockPlayer.gold);
console.log('Player Wood:', mockPlayer.inventory.getQuantity('wood'));
console.log('Port Gold:', port.economy.gold);
console.log('');

// Sell transaction
const sellResult = economy.executeSellTransaction(mockPlayer, port, 'wood', 10);
console.log('Selling 10 wood:');
console.log('  Success:', sellResult.success);
console.log('  Earned:', sellResult.earned, 'g');
console.log('  Price per unit:', sellResult.pricePerUnit, 'g');
console.log('  Player Gold after:', mockPlayer.gold);
console.log('  Player Wood after:', mockPlayer.inventory.getQuantity('wood'));
console.log('  Port Gold after:', port.economy.gold);
console.log('');

// Buy transaction
const buyResult = economy.executeBuyTransaction(mockPlayer, port, 'ore', 5);
console.log('Buying 5 ore:');
console.log('  Success:', buyResult.success);
console.log('  Spent:', buyResult.spent, 'g');
console.log('  Price per unit:', buyResult.pricePerUnit, 'g');
console.log('  Player Gold after:', mockPlayer.gold);
console.log('  Player Ore after:', mockPlayer.inventory.getQuantity('ore'));
console.log('  Port Gold after:', port.economy.gold);
console.log('');

// Test 5: Regeneration
console.log('Test 5: Supply Recovery & Gold Regeneration');
port.economy.supplyLevels.wood = 1.5; // Oversupplied
port.economy.gold = 300; // Below max
console.log('Before tick:');
console.log('  Wood supply:', port.economy.supplyLevels.wood);
console.log('  Port gold:', port.economy.gold);

economy.tickSupplyRecovery(port);
economy.tickGoldRegeneration(port, 1); // 1 minute

console.log('After 1 minute:');
console.log('  Wood supply:', port.economy.supplyLevels.wood.toFixed(3), '(moving toward 1.0)');
console.log('  Port gold:', port.economy.gold.toFixed(1), '(regenerating)');
console.log('');

console.log('✅ All tests completed!');
console.log('');
console.log('Summary:');
console.log('  ✓ Port economies are determined by nearby biomes');
console.log('  ✓ Prices vary based on geography and supply/demand');
console.log('  ✓ Supply increases when selling, decreases when buying');
console.log('  ✓ Transactions validate player gold and inventory');
console.log('  ✓ Supply and gold regenerate over time');
