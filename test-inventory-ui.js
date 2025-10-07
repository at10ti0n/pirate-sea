#!/usr/bin/env node

// Test script for inventory UI functionality
const PlayerInventory = require('./player-inventory');
const ResourceManager = require('./resource-manager');

// Mock map generator for testing
class MockMapGenerator {
    constructor() {
        this.seed = 12345;
    }
    
    getBiomeAt(x, y) {
        return { biome: 'forest' };
    }
}

// Mock seeded random for testing
class MockSeededRandom {
    random() {
        return 0.5;
    }
    
    randomInt(min, max) {
        return Math.floor((min + max) / 2);
    }
}

console.log('Testing Inventory UI Components...\n');

// Test 1: Basic inventory functionality
console.log('=== Test 1: Basic Inventory ===');
const inventory = new PlayerInventory(100);
const mapGen = new MockMapGenerator();
const seededRandom = new MockSeededRandom();
const resourceManager = new ResourceManager(mapGen, seededRandom);

// Add some test resources
inventory.addResource('wood', 15);
inventory.addResource('stone', 8);
inventory.addResource('berries', 23);
inventory.addResource('ore', 3);

console.log('Web Display:');
console.log(inventory.getInventoryDisplay(resourceManager));
console.log('\nTerminal Display:');
console.log(inventory.getInventoryDisplayTerminal(resourceManager));

// Test 2: Capacity management
console.log('\n=== Test 2: Capacity Management ===');
console.log(`Total items: ${inventory.getTotalItems()}`);
console.log(`Capacity: ${inventory.getCapacity()}`);
console.log(`Remaining space: ${inventory.getRemainingSpace()}`);
console.log(`Has space for 10 more: ${inventory.hasSpace(10)}`);

// Test 3: Resource info display
console.log('\n=== Test 3: Resource Information ===');
const resourceTypes = ['wood', 'stone', 'berries', 'ore', 'sand', 'hay', 'reeds'];
resourceTypes.forEach(type => {
    const info = resourceManager.getResourceInfo(type);
    if (info) {
        console.log(`${info.icon} ${info.name}: ${info.description}`);
    }
});

// Test 4: Empty inventory
console.log('\n=== Test 4: Empty Inventory ===');
const emptyInventory = new PlayerInventory(50);
console.log('Empty inventory display:');
console.log(emptyInventory.getInventoryDisplay(resourceManager));

console.log('\n✅ All inventory UI tests completed successfully!');