#!/usr/bin/env node

// Comprehensive unit tests for PlayerInventory class
console.log('=== PlayerInventory Unit Tests ===\n');

const PlayerInventory = require('./player-inventory');

let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFunction) {
    testsTotal++;
    try {
        console.log(`Running: ${testName}`);
        testFunction();
        testsPassed++;
        console.log(`✓ PASSED: ${testName}\n`);
    } catch (error) {
        console.log(`✗ FAILED: ${testName}`);
        console.log(`  Error: ${error.message}\n`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Test inventory initialization
runTest('Inventory initialization', () => {
    const inventory = new PlayerInventory();
    
    assert(inventory.capacity === 100, 'Default capacity should be 100');
    assert(inventory.totalItems === 0, 'Initial total items should be 0');
    assert(inventory.resources instanceof Map, 'Resources should be a Map');
    assert(inventory.isEmpty(), 'New inventory should be empty');
    assert(inventory.getResourceTypeCount() === 0, 'Should have 0 resource types');
    
    // Test custom capacity
    const customInventory = new PlayerInventory(50);
    assert(customInventory.capacity === 50, 'Custom capacity should be set');
});

// Test adding resources
runTest('Adding resources', () => {
    const inventory = new PlayerInventory(100);
    
    // Test adding valid resource
    const result1 = inventory.addResource('wood', 5);
    assert(result1.success, 'Should successfully add wood');
    assert(inventory.getResourceCount('wood') === 5, 'Should have 5 wood');
    assert(inventory.getTotalItems() === 5, 'Total items should be 5');
    assert(!inventory.isEmpty(), 'Inventory should not be empty');
    
    // Test stacking same resource
    const result2 = inventory.addResource('wood', 3);
    assert(result2.success, 'Should successfully stack wood');
    assert(inventory.getResourceCount('wood') === 8, 'Should have 8 wood total');
    assert(inventory.getTotalItems() === 8, 'Total items should be 8');
    
    // Test adding different resource
    const result3 = inventory.addResource('stone', 2);
    assert(result3.success, 'Should successfully add stone');
    assert(inventory.getResourceCount('stone') === 2, 'Should have 2 stone');
    assert(inventory.getTotalItems() === 10, 'Total items should be 10');
    assert(inventory.getResourceTypeCount() === 2, 'Should have 2 resource types');
    
    // Test invalid inputs
    const result4 = inventory.addResource('', 5);
    assert(!result4.success, 'Should fail with empty resource type');
    
    const result5 = inventory.addResource('wood', 0);
    assert(!result5.success, 'Should fail with zero quantity');
    
    const result6 = inventory.addResource('wood', -1);
    assert(!result6.success, 'Should fail with negative quantity');
    
    const result7 = inventory.addResource(null, 5);
    assert(!result7.success, 'Should fail with null resource type');
});

// Test removing resources
runTest('Removing resources', () => {
    const inventory = new PlayerInventory(100);
    
    // Add some resources first
    inventory.addResource('wood', 10);
    inventory.addResource('stone', 5);
    
    // Test removing partial quantity
    const result1 = inventory.removeResource('wood', 3);
    assert(result1.success, 'Should successfully remove 3 wood');
    assert(inventory.getResourceCount('wood') === 7, 'Should have 7 wood remaining');
    assert(inventory.getTotalItems() === 12, 'Total items should be 12');
    
    // Test removing all of a resource
    const result2 = inventory.removeResource('stone', 5);
    assert(result2.success, 'Should successfully remove all stone');
    assert(inventory.getResourceCount('stone') === 0, 'Should have 0 stone');
    assert(inventory.getTotalItems() === 7, 'Total items should be 7');
    assert(inventory.getResourceTypeCount() === 1, 'Should have 1 resource type');
    
    // Test removing non-existent resource
    const result3 = inventory.removeResource('berries', 1);
    assert(!result3.success, 'Should fail to remove non-existent resource');
    
    // Test removing more than available
    const result4 = inventory.removeResource('wood', 10);
    assert(!result4.success, 'Should fail to remove more than available');
    assert(inventory.getResourceCount('wood') === 7, 'Wood count should be unchanged');
    
    // Test invalid inputs
    const result5 = inventory.removeResource('', 1);
    assert(!result5.success, 'Should fail with empty resource type');
    
    const result6 = inventory.removeResource('wood', 0);
    assert(!result6.success, 'Should fail with zero quantity');
    
    const result7 = inventory.removeResource('wood', -1);
    assert(!result7.success, 'Should fail with negative quantity');
});

// Test capacity management
runTest('Capacity management', () => {
    const inventory = new PlayerInventory(10);
    
    // Test space checking
    assert(inventory.hasSpace(5), 'Should have space for 5 items');
    assert(inventory.hasSpace(10), 'Should have space for 10 items');
    assert(!inventory.hasSpace(11), 'Should not have space for 11 items');
    assert(inventory.getRemainingSpace() === 10, 'Should have 10 remaining space');
    
    // Add items to test capacity
    inventory.addResource('wood', 8);
    assert(inventory.hasSpace(2), 'Should have space for 2 more items');
    assert(!inventory.hasSpace(3), 'Should not have space for 3 more items');
    assert(inventory.getRemainingSpace() === 2, 'Should have 2 remaining space');
    
    // Test adding beyond capacity
    const result1 = inventory.addResource('stone', 5);
    assert(!result1.success, 'Should fail to add beyond capacity');
    assert(inventory.getResourceCount('stone') === 0, 'Stone should not be added');
    assert(inventory.getTotalItems() === 8, 'Total items should remain 8');
    
    // Test adding exactly to capacity
    const result2 = inventory.addResource('stone', 2);
    assert(result2.success, 'Should successfully add to exact capacity');
    assert(inventory.getTotalItems() === 10, 'Should be at full capacity');
    assert(!inventory.hasSpace(1), 'Should have no remaining space');
    
    // Test capacity modification
    const setResult1 = inventory.setCapacity(15);
    assert(setResult1.success, 'Should successfully increase capacity');
    assert(inventory.getCapacity() === 15, 'Capacity should be 15');
    assert(inventory.hasSpace(5), 'Should have space after capacity increase');
    
    const setResult2 = inventory.setCapacity(-1);
    assert(!setResult2.success, 'Should fail to set negative capacity');
    assert(inventory.getCapacity() === 15, 'Capacity should remain unchanged');
});

// Test inventory queries and display
runTest('Inventory queries and display', () => {
    const inventory = new PlayerInventory(100);
    
    // Test empty inventory
    assert(inventory.isEmpty(), 'New inventory should be empty');
    assert(inventory.getResourceTypes().length === 0, 'Should have no resource types');
    
    const allResourcesEmpty = inventory.getAllResources();
    assert(Object.keys(allResourcesEmpty).length === 0, 'Should have no resources');
    
    // Add some resources
    inventory.addResource('wood', 5);
    inventory.addResource('stone', 3);
    inventory.addResource('berries', 7);
    
    // Test queries
    assert(!inventory.isEmpty(), 'Inventory should not be empty');
    assert(inventory.getResourceTypeCount() === 3, 'Should have 3 resource types');
    
    const resourceTypes = inventory.getResourceTypes();
    assert(resourceTypes.includes('wood'), 'Should include wood');
    assert(resourceTypes.includes('stone'), 'Should include stone');
    assert(resourceTypes.includes('berries'), 'Should include berries');
    
    const allResources = inventory.getAllResources();
    assert(allResources.wood.quantity === 5, 'Should have 5 wood');
    assert(allResources.stone.quantity === 3, 'Should have 3 stone');
    assert(allResources.berries.quantity === 7, 'Should have 7 berries');
    assert(allResources.wood.lastUpdated, 'Should have lastUpdated timestamp');
    
    // Test display methods
    const display = inventory.getInventoryDisplay();
    assert(display.includes('wood'), 'Display should include wood');
    assert(display.includes('5'), 'Display should include wood quantity');
    assert(display.includes('15/100'), 'Display should show capacity');
    
    const terminalDisplay = inventory.getInventoryDisplayTerminal();
    assert(terminalDisplay.includes('wood'), 'Terminal display should include wood');
    assert(terminalDisplay.includes('15%'), 'Terminal display should show percentage');
    
    // Test empty inventory display
    inventory.clear();
    const emptyDisplay = inventory.getInventoryDisplay();
    assert(emptyDisplay.includes('empty'), 'Empty display should indicate empty');
    
    const emptyTerminalDisplay = inventory.getInventoryDisplayTerminal();
    assert(emptyTerminalDisplay.includes('empty'), 'Empty terminal display should indicate empty');
});

// Test serialization and deserialization
runTest('Serialization and deserialization', () => {
    const inventory = new PlayerInventory(50);
    
    // Add some resources
    inventory.addResource('wood', 10);
    inventory.addResource('stone', 5);
    inventory.addResource('berries', 3);
    
    // Test serialization
    const serialized = inventory.serialize();
    assert(serialized, 'Should serialize inventory');
    assert(typeof serialized === 'string', 'Serialized data should be string');
    
    // Test deserialization
    const newInventory = new PlayerInventory();
    const deserializeResult = newInventory.deserialize(serialized);
    assert(deserializeResult.success, `Deserialization failed: ${deserializeResult.message}`);
    
    // Verify data was restored
    assert(newInventory.getCapacity() === 50, 'Capacity should be restored');
    assert(newInventory.getTotalItems() === 18, 'Total items should be restored');
    assert(newInventory.getResourceCount('wood') === 10, 'Wood count should be restored');
    assert(newInventory.getResourceCount('stone') === 5, 'Stone count should be restored');
    assert(newInventory.getResourceCount('berries') === 3, 'Berries count should be restored');
    
    // Test deserialization with invalid data
    const invalidResult = newInventory.deserialize('invalid json');
    assert(!invalidResult.success, 'Invalid JSON should fail deserialization');
    
    // Test deserialization with empty data
    const emptyResult = newInventory.deserialize('{}');
    assert(emptyResult.success, 'Empty object should succeed');
});

// Test inventory validation
runTest('Inventory validation', () => {
    const inventory = new PlayerInventory(100);
    
    // Test valid inventory
    inventory.addResource('wood', 5);
    inventory.addResource('stone', 3);
    
    let validation = inventory.validateInventory();
    assert(validation.isValid, 'Valid inventory should pass validation');
    assert(validation.issues.length === 0, 'Valid inventory should have no issues');
    
    // Test inventory with corrupted data (simulate negative quantity)
    inventory.resources.set('berries', { quantity: -5, lastUpdated: Date.now() });
    inventory.updateTotalItems();
    
    validation = inventory.validateInventory();
    assert(!validation.isValid, 'Invalid inventory should fail validation');
    assert(validation.issues.length > 0, 'Invalid inventory should have issues');
    assert(validation.issues[0].includes('Negative quantity'), 'Should detect negative quantity');
    
    // Test inventory with incorrect total (simulate corruption)
    inventory.resources.set('berries', { quantity: 5, lastUpdated: Date.now() });
    inventory.totalItems = 999; // Incorrect total
    
    validation = inventory.validateInventory();
    assert(!validation.isValid, 'Inventory with wrong total should fail validation');
    assert(validation.issues.some(issue => issue.includes('Total items mismatch')), 'Should detect total mismatch');
    
    // Validation should fix the total
    assert(inventory.totalItems === 13, 'Validation should fix total items');
    
    // Test over-capacity inventory
    inventory.capacity = 5; // Set capacity below current items
    
    validation = inventory.validateInventory();
    assert(!validation.isValid, 'Over-capacity inventory should fail validation');
    assert(validation.issues.some(issue => issue.includes('over capacity')), 'Should detect over capacity');
});

// Test edge cases and error conditions
runTest('Edge cases and error conditions', () => {
    const inventory = new PlayerInventory(100);
    
    // Test with very large quantities
    const largeResult = inventory.addResource('wood', 999999);
    assert(!largeResult.success, 'Should fail to add quantity exceeding capacity');
    
    // Test with zero capacity inventory
    const zeroCapInventory = new PlayerInventory(0);
    const zeroResult = zeroCapInventory.addResource('wood', 1);
    assert(!zeroResult.success, 'Should fail to add to zero capacity inventory');
    
    // Test clearing inventory
    inventory.addResource('wood', 10);
    inventory.addResource('stone', 5);
    assert(!inventory.isEmpty(), 'Inventory should not be empty before clear');
    
    const clearResult = inventory.clear();
    assert(clearResult.success, 'Clear should succeed');
    assert(inventory.isEmpty(), 'Inventory should be empty after clear');
    assert(inventory.getTotalItems() === 0, 'Total items should be 0 after clear');
    assert(inventory.getResourceTypeCount() === 0, 'Resource count should be 0 after clear');
    
    // Test updateTotalItems method directly
    inventory.addResource('wood', 5);
    inventory.addResource('stone', 3);
    const originalTotal = inventory.getTotalItems();
    
    // Manually corrupt total and fix it
    inventory.totalItems = 999;
    inventory.updateTotalItems();
    assert(inventory.getTotalItems() === originalTotal, 'updateTotalItems should recalculate correctly');
    
    // Test resource count edge cases
    assert(inventory.getResourceCount('nonexistent') === 0, 'Non-existent resource should return 0 count');
    
    // Test hasSpace edge cases
    assert(inventory.hasSpace(0), 'Should have space for 0 items');
    assert(!inventory.hasSpace(-1), 'Should not have space for negative items');
});

// Test performance with large inventories
runTest('Performance with large inventories', () => {
    const inventory = new PlayerInventory(10000);
    
    // Add many different resource types
    const resourceTypes = [];
    for (let i = 0; i < 100; i++) {
        const resourceType = `resource_${i}`;
        resourceTypes.push(resourceType);
        inventory.addResource(resourceType, 10);
    }
    
    assert(inventory.getResourceTypeCount() === 100, 'Should have 100 resource types');
    assert(inventory.getTotalItems() === 1000, 'Should have 1000 total items');
    
    // Test performance of operations
    const startTime = Date.now();
    
    // Test getAllResources performance
    const allResources = inventory.getAllResources();
    assert(Object.keys(allResources).length === 100, 'Should return all resources');
    
    // Test getResourceTypes performance
    const types = inventory.getResourceTypes();
    assert(types.length === 100, 'Should return all resource types');
    
    // Test validation performance
    const validation = inventory.validateInventory();
    assert(validation.isValid, 'Large inventory should be valid');
    
    // Test serialization performance
    const serialized = inventory.serialize();
    assert(serialized.length > 1000, 'Serialized data should be substantial');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Performance should be reasonable (under 100ms for these operations)
    assert(duration < 1000, `Operations should be fast, took ${duration}ms`);
    
    console.log(`  Performance test completed in ${duration}ms`);
});

// Test concurrent operations simulation
runTest('Concurrent operations simulation', () => {
    const inventory = new PlayerInventory(1000);
    
    // Simulate rapid add/remove operations
    const operations = [];
    
    // Add resources rapidly
    for (let i = 0; i < 50; i++) {
        operations.push(() => inventory.addResource('wood', 1));
        operations.push(() => inventory.addResource('stone', 2));
    }
    
    // Remove resources rapidly
    for (let i = 0; i < 25; i++) {
        operations.push(() => inventory.removeResource('wood', 1));
        operations.push(() => inventory.removeResource('stone', 1));
    }
    
    // Execute all operations
    let successCount = 0;
    for (const operation of operations) {
        const result = operation();
        if (result && result.success) {
            successCount++;
        }
    }
    
    // Verify final state is consistent
    const validation = inventory.validateInventory();
    assert(validation.isValid, 'Inventory should be valid after rapid operations');
    
    const expectedWood = 50 - 25; // Added 50, removed 25
    const expectedStone = 100 - 25; // Added 100 (50*2), removed 25
    const expectedTotal = expectedWood + expectedStone;
    
    assert(inventory.getResourceCount('wood') === expectedWood, `Should have ${expectedWood} wood`);
    assert(inventory.getResourceCount('stone') === expectedStone, `Should have ${expectedStone} stone`);
    assert(inventory.getTotalItems() === expectedTotal, `Should have ${expectedTotal} total items`);
    
    console.log(`  Executed ${operations.length} operations, ${successCount} successful`);
});

// Print test results
console.log('=== Test Results ===');
console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
console.log(`Success rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);

if (testsPassed === testsTotal) {
    console.log('✓ All PlayerInventory unit tests passed!');
} else {
    console.log('✗ Some tests failed. Check output above for details.');
    process.exit(1);
}