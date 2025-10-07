#!/usr/bin/env node

// Test terminal game fog of war integration with resource gathering and examination
const FogOfWar = require('./fog');
const ResourceManager = require('./resource-manager');
const PlayerInventory = require('./player-inventory');

// Mock terminal game class for testing
class MockTerminalGame {
    constructor() {
        this.messageLog = [];
        this.player = { x: 0, y: 0, mode: 'foot' };
        this.showInventory = false;
        
        // Mock map generator
        this.mapGenerator = {
            map: new Map(),
            seededRandom: {
                random: () => Math.random(),
                randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
            },
            getBiomeAt: function(x, y) {
                const key = `${x},${y}`;
                if (!this.map.has(key)) {
                    this.map.set(key, {
                        x, y,
                        biome: 'forest',
                        visible: false,
                        explored: false
                    });
                }
                return this.map.get(key);
            },
            clearVisibility: function() {
                for (const [key, tile] of this.map) {
                    if (tile.visible) {
                        tile.explored = true;
                        tile.visible = false;
                    }
                }
            },
            setVisibility: function(x, y, visible) {
                const tile = this.getBiomeAt(x, y);
                tile.visible = visible;
                if (visible) {
                    tile.explored = true;
                }
            }
        };
        
        // Initialize systems
        this.fogOfWar = new FogOfWar(this.mapGenerator);
        this.resourceManager = new ResourceManager(this.mapGenerator, this.mapGenerator.seededRandom);
        this.playerInventory = new PlayerInventory(500);
        
        // Update initial visibility
        this.fogOfWar.updateVisibility(this.player.x, this.player.y);
    }
    
    addMessage(message) {
        this.messageLog.push(message);
    }
    
    // Copy the modified methods from terminal-game.js
    attemptGather() {
        try {
            // Validate system initialization
            if (!this.resourceManager || !this.playerInventory) {
                this.addMessage('Resource system not initialized');
                return;
            }
            
            // Check if player is on ship
            if (this.player.mode === 'ship') {
                this.addMessage('Cannot gather resources while on ship');
                return;
            }
            
            // Validate player position
            if (typeof this.player.x !== 'number' || typeof this.player.y !== 'number') {
                this.addMessage('Invalid player position');
                return;
            }

            // Check fog of war visibility - player can only gather at their current position
            // which should always be visible, but let's verify for consistency
            if (this.fogOfWar && !this.fogOfWar.isVisible(this.player.x, this.player.y)) {
                this.addMessage('You cannot gather resources in areas you cannot see clearly');
                return;
            }

            // Attempt to gather at current position
            const result = this.resourceManager.attemptGather(
                this.player.x, 
                this.player.y, 
                this.playerInventory
            );
            
            // Validate result
            if (!result || typeof result.success !== 'boolean') {
                this.addMessage('Gathering system error');
                return;
            }

            // Use standardized cross-platform feedback messages
            const feedbackMessage = this.resourceManager.getGatheringFeedbackMessage(result, 'terminal');
            this.addMessage(feedbackMessage);
            
        } catch (error) {
            console.error('Error during resource gathering:', error);
            this.addMessage('Gathering system error occurred');
        }
    }

    examineLocation() {
        // Check fog of war visibility - player can only examine their current position
        // which should always be visible, but let's verify for consistency
        if (this.fogOfWar && !this.fogOfWar.isVisible(this.player.x, this.player.y)) {
            this.addMessage('You cannot examine areas you cannot see clearly');
            return;
        }

        // Examine current location
        const result = this.resourceManager.examineLocation(this.player.x, this.player.y);
        
        if (!result.success) {
            this.addMessage(result.message);
            return;
        }
        
        // Use standardized examination display
        const formattedResults = this.resourceManager.formatExaminationResults(result, 'terminal');
        formattedResults.forEach(line => {
            if (line.trim()) {
                this.addMessage(line);
            }
        });
    }

    toggleInventory() {
        // Inventory operations should work regardless of fog of war state
        // as they don't depend on environmental visibility
        this.showInventory = !this.showInventory;
        if (this.showInventory) {
            this.addMessage('Inventory opened');
        } else {
            this.addMessage('Inventory closed');
        }
    }
}

function testTerminalFogIntegration() {
    console.log('Testing terminal game fog of war integration...\n');
    
    let testsPassed = 0;
    let totalTests = 0;
    
    function runTest(testName, testFn) {
        totalTests++;
        try {
            console.log(`Running: ${testName}`);
            const result = testFn();
            if (result) {
                console.log(`✓ PASSED: ${testName}`);
                testsPassed++;
            } else {
                console.log(`✗ FAILED: ${testName}`);
            }
        } catch (error) {
            console.log(`✗ ERROR: ${testName} - ${error.message}`);
        }
        console.log('');
    }
    
    // Test 1: Resource gathering works when player position is visible
    runTest('Resource gathering works when player position is visible', () => {
        const game = new MockTerminalGame();
        
        // Ensure player position is visible
        game.fogOfWar.updateVisibility(game.player.x, game.player.y);
        
        const messagesBefore = game.messageLog.length;
        game.attemptGather();
        const messagesAfter = game.messageLog.length;
        
        // Should have added a message (either success or failure, but not visibility error)
        const hasNewMessage = messagesAfter > messagesBefore;
        const lastMessage = game.messageLog[game.messageLog.length - 1];
        const isVisibilityError = lastMessage && lastMessage.includes('cannot see clearly');
        
        console.log(`  Messages added: ${messagesAfter - messagesBefore}`);
        console.log(`  Last message: ${lastMessage}`);
        console.log(`  Is visibility error: ${isVisibilityError}`);
        
        return hasNewMessage && !isVisibilityError;
    });
    
    // Test 2: Examination works when player position is visible
    runTest('Examination works when player position is visible', () => {
        const game = new MockTerminalGame();
        
        // Ensure player position is visible
        game.fogOfWar.updateVisibility(game.player.x, game.player.y);
        
        const messagesBefore = game.messageLog.length;
        game.examineLocation();
        const messagesAfter = game.messageLog.length;
        
        // Should have added messages (examination results)
        const hasNewMessages = messagesAfter > messagesBefore;
        const lastMessage = game.messageLog[game.messageLog.length - 1];
        const isVisibilityError = lastMessage && lastMessage.includes('cannot see clearly');
        
        console.log(`  Messages added: ${messagesAfter - messagesBefore}`);
        console.log(`  Last message: ${lastMessage}`);
        console.log(`  Is visibility error: ${isVisibilityError}`);
        
        return hasNewMessages && !isVisibilityError;
    });
    
    // Test 3: Resource gathering blocked when position not visible (simulated)
    runTest('Resource gathering blocked when position not visible', () => {
        const game = new MockTerminalGame();
        
        // Manually set player position as not visible (simulate fog of war blocking)
        game.mapGenerator.setVisibility(game.player.x, game.player.y, false);
        
        const messagesBefore = game.messageLog.length;
        game.attemptGather();
        const messagesAfter = game.messageLog.length;
        
        // Should have added a visibility error message
        const hasNewMessage = messagesAfter > messagesBefore;
        const lastMessage = game.messageLog[game.messageLog.length - 1];
        const isVisibilityError = lastMessage && lastMessage.includes('cannot see clearly');
        
        console.log(`  Messages added: ${messagesAfter - messagesBefore}`);
        console.log(`  Last message: ${lastMessage}`);
        console.log(`  Is visibility error: ${isVisibilityError}`);
        
        return hasNewMessage && isVisibilityError;
    });
    
    // Test 4: Examination blocked when position not visible (simulated)
    runTest('Examination blocked when position not visible', () => {
        const game = new MockTerminalGame();
        
        // Manually set player position as not visible (simulate fog of war blocking)
        game.mapGenerator.setVisibility(game.player.x, game.player.y, false);
        
        const messagesBefore = game.messageLog.length;
        game.examineLocation();
        const messagesAfter = game.messageLog.length;
        
        // Should have added a visibility error message
        const hasNewMessage = messagesAfter > messagesBefore;
        const lastMessage = game.messageLog[game.messageLog.length - 1];
        const isVisibilityError = lastMessage && lastMessage.includes('cannot see clearly');
        
        console.log(`  Messages added: ${messagesAfter - messagesBefore}`);
        console.log(`  Last message: ${lastMessage}`);
        console.log(`  Is visibility error: ${isVisibilityError}`);
        
        return hasNewMessage && isVisibilityError;
    });
    
    // Test 5: Inventory operations work regardless of visibility
    runTest('Inventory operations work regardless of visibility', () => {
        const game = new MockTerminalGame();
        
        // Set player position as not visible
        game.mapGenerator.setVisibility(game.player.x, game.player.y, false);
        
        const initialShowInventory = game.showInventory;
        const messagesBefore = game.messageLog.length;
        
        game.toggleInventory();
        
        const messagesAfter = game.messageLog.length;
        const inventoryToggled = game.showInventory !== initialShowInventory;
        const hasInventoryMessage = messagesAfter > messagesBefore;
        const lastMessage = game.messageLog[game.messageLog.length - 1];
        const isInventoryMessage = lastMessage && (lastMessage.includes('Inventory opened') || lastMessage.includes('Inventory closed'));
        
        console.log(`  Inventory toggled: ${inventoryToggled}`);
        console.log(`  Messages added: ${messagesAfter - messagesBefore}`);
        console.log(`  Last message: ${lastMessage}`);
        console.log(`  Is inventory message: ${isInventoryMessage}`);
        
        return inventoryToggled && hasInventoryMessage && isInventoryMessage;
    });
    
    // Test 6: Gathering blocked when on ship
    runTest('Gathering blocked when on ship', () => {
        const game = new MockTerminalGame();
        
        // Set player on ship
        game.player.mode = 'ship';
        
        const messagesBefore = game.messageLog.length;
        game.attemptGather();
        const messagesAfter = game.messageLog.length;
        
        const hasNewMessage = messagesAfter > messagesBefore;
        const lastMessage = game.messageLog[game.messageLog.length - 1];
        const isShipMessage = lastMessage && lastMessage.includes('while on ship');
        
        console.log(`  Messages added: ${messagesAfter - messagesBefore}`);
        console.log(`  Last message: ${lastMessage}`);
        console.log(`  Is ship message: ${isShipMessage}`);
        
        return hasNewMessage && isShipMessage;
    });
    
    // Summary
    console.log(`\n=== Test Results ===`);
    console.log(`Tests passed: ${testsPassed}/${totalTests}`);
    console.log(`Success rate: ${Math.round((testsPassed / totalTests) * 100)}%`);
    
    if (testsPassed === totalTests) {
        console.log('✓ All terminal fog of war integration tests passed!');
        return true;
    } else {
        console.log('✗ Some tests failed. Check implementation.');
        return false;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testTerminalFogIntegration();
}

module.exports = { testTerminalFogIntegration };