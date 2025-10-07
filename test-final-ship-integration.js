#!/usr/bin/env node

// Final integration test for ship visibility fix
const FogOfWar = require('./fog');

// Mock terminal game components
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

class MockEntityManager {
    constructor() {
        this.entities = new Map();
        this.entityTypes = {
            ship: { char: 'S', color: '\x1b[33m' },
            treasure: { char: '$', color: '\x1b[93m' }
        };
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

function testFinalShipIntegration() {
    console.log('Final integration test for ship visibility fix...\n');
    
    const mapGen = new MockMapGenerator();
    const fogOfWar = new FogOfWar(mapGen);
    const entityManager = new MockEntityManager();
    
    // Set up scenario
    const playerStartX = 0, playerStartY = 0;
    const shipX = 6, shipY = 6;
    const treasureX = 8, treasureY = 8;
    
    // Add entities
    const ship = { type: 'ship', x: shipX, y: shipY, char: 'S', color: '\x1b[33m' };
    const treasure = { type: 'treasure', x: treasureX, y: treasureY, char: '$', color: '\x1b[93m' };
    
    entityManager.addEntity(ship);
    entityManager.addEntity(treasure);
    
    console.log('=== Scenario Setup ===');
    console.log(`Player starts at: (${playerStartX}, ${playerStartY})`);
    console.log(`Ship at: (${shipX}, ${shipY})`);
    console.log(`Treasure at: (${treasureX}, ${treasureY})`);
    console.log(`View radius: ${fogOfWar.getViewRadius()}`);
    
    // Phase 1: Player at start position
    console.log('\n=== Phase 1: Player at start position ===');
    fogOfWar.updateVisibility(playerStartX, playerStartY);
    
    const entities = entityManager.getAllEntities();
    console.log('Entity visibility:');
    for (const entity of entities) {
        const shouldRender = fogOfWar.shouldRenderEntity(entity.x, entity.y, entity.type);
        const isVisible = fogOfWar.isVisible(entity.x, entity.y);
        const isExplored = fogOfWar.isExplored(entity.x, entity.y);
        
        console.log(`  ${entity.type} at (${entity.x}, ${entity.y}): render=${shouldRender}, visible=${isVisible}, explored=${isExplored}`);
    }
    
    // Phase 2: Player moves to see both entities
    console.log('\n=== Phase 2: Player moves to see entities ===');
    const exploreX = 7, exploreY = 7;
    fogOfWar.updateVisibility(exploreX, exploreY);
    
    console.log(`Player moved to: (${exploreX}, ${exploreY})`);
    console.log('Entity visibility:');
    for (const entity of entities) {
        const shouldRender = fogOfWar.shouldRenderEntity(entity.x, entity.y, entity.type);
        const isVisible = fogOfWar.isVisible(entity.x, entity.y);
        const isExplored = fogOfWar.isExplored(entity.x, entity.y);
        
        console.log(`  ${entity.type} at (${entity.x}, ${entity.y}): render=${shouldRender}, visible=${isVisible}, explored=${isExplored}`);
    }
    
    // Phase 3: Player moves away
    console.log('\n=== Phase 3: Player moves away ===');
    fogOfWar.updateVisibility(playerStartX, playerStartY);
    
    console.log(`Player moved back to: (${playerStartX}, ${playerStartY})`);
    console.log('Entity visibility:');
    for (const entity of entities) {
        const shouldRender = fogOfWar.shouldRenderEntity(entity.x, entity.y, entity.type);
        const isVisible = fogOfWar.isVisible(entity.x, entity.y);
        const isExplored = fogOfWar.isExplored(entity.x, entity.y);
        
        console.log(`  ${entity.type} at (${entity.x}, ${entity.y}): render=${shouldRender}, visible=${isVisible}, explored=${isExplored}`);
    }
    
    // Verify expected behavior
    console.log('\n=== Verification ===');
    const shipShouldRender = fogOfWar.shouldRenderEntity(shipX, shipY, 'ship');
    const treasureShouldRender = fogOfWar.shouldRenderEntity(treasureX, treasureY, 'treasure');
    const shipExplored = fogOfWar.isExplored(shipX, shipY);
    const treasureExplored = fogOfWar.isExplored(treasureX, treasureY);
    
    console.log('Expected behavior verification:');
    console.log(`✓ Ship should remain visible in explored areas: ${shipShouldRender && shipExplored}`);
    console.log(`✓ Treasure should disappear when not in line of sight: ${!treasureShouldRender && treasureExplored}`);
    
    // Test rendering logic simulation
    console.log('\n=== Rendering Simulation ===');
    console.log('Entities that would be rendered:');
    
    for (const entity of entities) {
        const shouldRender = fogOfWar.shouldRenderEntity(entity.x, entity.y, entity.type);
        if (shouldRender) {
            const isCurrentlyVisible = fogOfWar.isVisible(entity.x, entity.y);
            const visibilityModifier = fogOfWar.getVisibilityModifier(entity.x, entity.y);
            const appearance = isCurrentlyVisible ? 'normal' : 'dimmed';
            
            console.log(`  ${entity.type} at (${entity.x}, ${entity.y}) - ${appearance} (modifier: ${visibilityModifier})`);
        }
    }
    
    const success = shipShouldRender && shipExplored && !treasureShouldRender && treasureExplored;
    
    if (success) {
        console.log('\n✓ Integration test PASSED! Ship visibility fix working correctly.');
    } else {
        console.log('\n✗ Integration test FAILED! Check implementation.');
    }
    
    return success;
}

// Run the test if this file is executed directly
if (require.main === module) {
    testFinalShipIntegration();
}

module.exports = { testFinalShipIntegration };