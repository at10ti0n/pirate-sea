#!/usr/bin/env node

// Test ship visibility under fog of war
const FogOfWar = require('./fog');

// Mock map generator for testing
class MockMapGenerator {
    constructor() {
        this.map = new Map();
        this.seededRandom = {
            random: () => Math.random(),
            randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
        };
    }
    
    getBiomeAt(x, y) {
        const key = `${x},${y}`;
        if (!this.map.has(key)) {
            this.map.set(key, {
                x, y,
                biome: 'ocean',
                visible: false,
                explored: false
            });
        }
        return this.map.get(key);
    }
    
    clearVisibility() {
        for (const [key, tile] of this.map) {
            if (tile.visible) {
                tile.explored = true;
                tile.visible = false;
            }
        }
    }
    
    setVisibility(x, y, visible) {
        const tile = this.getBiomeAt(x, y);
        tile.visible = visible;
        if (visible) {
            tile.explored = true;
        }
    }
}

// Mock entity manager
class MockEntityManager {
    constructor() {
        this.entities = new Map();
    }
    
    addEntity(entity) {
        const key = `${entity.x},${entity.y}`;
        this.entities.set(key, entity);
    }
    
    getEntityAt(x, y) {
        const key = `${x},${y}`;
        return this.entities.get(key);
    }
    
    getAllEntities() {
        return Array.from(this.entities.values());
    }
}

function testShipVisibility() {
    console.log('Testing ship visibility under fog of war...\n');
    
    const mapGen = new MockMapGenerator();
    const fogOfWar = new FogOfWar(mapGen);
    const entityManager = new MockEntityManager();
    
    // Place player at origin
    const playerX = 0, playerY = 0;
    
    // Place ship nearby but outside view radius
    const shipX = 10, shipY = 10;
    const ship = {
        type: 'ship',
        x: shipX,
        y: shipY,
        char: 'S',
        color: '\x1b[33m'
    };
    entityManager.addEntity(ship);
    
    // Update fog of war from player position
    fogOfWar.updateVisibility(playerX, playerY);
    
    console.log('=== Ship Visibility Test ===');
    console.log(`Player position: (${playerX}, ${playerY})`);
    console.log(`Ship position: (${shipX}, ${shipY})`);
    console.log(`View radius: ${fogOfWar.getViewRadius()}`);
    
    // Check if ship position is visible
    const isShipVisible = fogOfWar.isVisible(shipX, shipY);
    const isShipExplored = fogOfWar.isExplored(shipX, shipY);
    const shouldRenderShip = fogOfWar.shouldRenderEntity(shipX, shipY, 'ship');
    
    console.log(`\nShip visibility status:`);
    console.log(`  Is visible: ${isShipVisible}`);
    console.log(`  Is explored: ${isShipExplored}`);
    console.log(`  Should render: ${shouldRenderShip}`);
    
    // Test scenario: Player moves closer to ship (within view radius)
    console.log(`\n=== Player Moves Closer ===`);
    const closerX = 7, closerY = 7; // Within view radius of ship
    fogOfWar.updateVisibility(closerX, closerY);
    
    const isShipVisibleNow = fogOfWar.isVisible(shipX, shipY);
    const isShipExploredNow = fogOfWar.isExplored(shipX, shipY);
    const shouldRenderShipNow = fogOfWar.shouldRenderEntity(shipX, shipY, 'ship');
    
    console.log(`Player moved to: (${closerX}, ${closerY})`);
    console.log(`Ship visibility status:`);
    console.log(`  Is visible: ${isShipVisibleNow}`);
    console.log(`  Is explored: ${isShipExploredNow}`);
    console.log(`  Should render: ${shouldRenderShipNow}`);
    
    // Test scenario: Player moves away after seeing ship
    console.log(`\n=== Player Moves Away After Seeing Ship ===`);
    fogOfWar.updateVisibility(playerX, playerY); // Back to origin
    
    const isShipVisibleAfter = fogOfWar.isVisible(shipX, shipY);
    const isShipExploredAfter = fogOfWar.isExplored(shipX, shipY);
    const shouldRenderShipAfter = fogOfWar.shouldRenderEntity(shipX, shipY, 'ship');
    
    console.log(`Player moved back to: (${playerX}, ${playerY})`);
    console.log(`Ship visibility status:`);
    console.log(`  Is visible: ${isShipVisibleAfter}`);
    console.log(`  Is explored: ${isShipExploredAfter}`);
    console.log(`  Should render: ${shouldRenderShipAfter}`);
    
    // Analysis
    console.log(`\n=== Analysis ===`);
    console.log(`Current behavior: Ships disappear when not in line of sight`);
    console.log(`This means players can lose track of their ships`);
    
    if (isShipExploredAfter && !shouldRenderShipAfter) {
        console.log(`Issue: Ship was explored but is not rendered when out of sight`);
        console.log(`This could be problematic for gameplay`);
    }
    
    // Proposed solution test
    console.log(`\n=== Proposed Solution Test ===`);
    console.log(`Alternative: Render important entities (ships) in explored areas with dimmed appearance`);
    
    // Mock alternative rendering logic
    function shouldRenderImportantEntity(x, y, entityType) {
        if (entityType === 'ship') {
            // Ships should be visible in explored areas (dimmed)
            return fogOfWar.isExplored(x, y);
        } else {
            // Other entities only visible in current line of sight
            return fogOfWar.isVisible(x, y);
        }
    }
    
    const shouldRenderShipAlternative = shouldRenderImportantEntity(shipX, shipY, 'ship');
    console.log(`With alternative logic, ship should render: ${shouldRenderShipAlternative}`);
    
    return {
        currentBehavior: {
            shipDisappearsWhenNotVisible: !shouldRenderShipAfter && isShipExploredAfter
        },
        proposedSolution: {
            shipVisibleInExploredAreas: shouldRenderShipAlternative
        }
    };
}

// Run the test if this file is executed directly
if (require.main === module) {
    testShipVisibility();
}

module.exports = { testShipVisibility };