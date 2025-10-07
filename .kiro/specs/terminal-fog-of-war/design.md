# Design Document

## Overview

This design integrates the existing `FogOfWar` class from `fog.js` into the terminal game (`terminal-game.js`) to provide line-of-sight mechanics and exploration gameplay. The integration will leverage the existing fog of war system while adapting it to work with the terminal game's infinite map generation and camera system.

## Architecture

### Core Components

1. **FogOfWar Integration**: Import and instantiate the existing `FogOfWar` class within `TerminalGame`
2. **Map Generator Extensions**: Add visibility management methods to `TerminalMapGenerator`
3. **Rendering Pipeline Updates**: Modify the terminal rendering system to respect fog of war visibility states
4. **Entity Visibility**: Update entity rendering to only show entities in visible areas

### Component Relationships

```
TerminalGame
├── FogOfWar (new integration)
│   ├── Uses TerminalMapGenerator for tile queries
│   ├── Creates circular visibility area using PreciseShadowcasting
│   └── Manages visibility calculations within view radius
├── TerminalMapGenerator (extended)
│   ├── Adds clearVisibility() method
│   ├── Adds setVisibility() method
│   └── Maintains tile visibility state
└── Rendering System (modified)
    ├── Checks fog of war before rendering tiles
    ├── Applies visibility modifiers for dimming
    └── Filters entity rendering by visibility
```

## Components and Interfaces

### FogOfWar Class Integration

The existing `FogOfWar` class will be imported and integrated with minimal modifications. The ROT.js PreciseShadowcasting algorithm naturally creates a circular field of view:

```javascript
const FogOfWar = require('./fog');

class TerminalGame {
    constructor(seed = null) {
        // ... existing initialization
        this.fogOfWar = null; // Initialize after map generator
    }
    
    initialize() {
        // ... existing initialization
        this.fogOfWar = new FogOfWar(this.mapGenerator);
        // The PreciseShadowcasting algorithm creates a circular visibility area
        this.fogOfWar.updateVisibility(this.player.x, this.player.y);
    }
}
```

### TerminalMapGenerator Extensions

Add visibility management methods to support the fog of war system:

```javascript
class TerminalMapGenerator {
    // Add visibility management methods
    clearVisibility() {
        // Clear visibility for all loaded tiles
        for (const [key, tile] of this.map) {
            if (tile.visible) {
                tile.explored = true; // Mark as explored when losing visibility
                tile.visible = false;
            }
        }
    }
    
    setVisibility(x, y, visible) {
        const tile = this.generateChunkAt(x, y);
        if (tile) {
            tile.visible = visible;
            if (visible) {
                tile.explored = true;
            }
        }
    }
    
    getTileVisibility(x, y) {
        const tile = this.getBiomeAt(x, y);
        return tile ? { visible: tile.visible, explored: tile.explored } : { visible: false, explored: false };
    }
}
```

### Rendering Pipeline Modifications

Update the `render()` method to respect fog of war visibility:

```javascript
render() {
    // Update fog of war before rendering
    if (this.fogOfWar) {
        this.fogOfWar.updateVisibility(this.player.x, this.player.y);
    }
    
    // ... existing camera update
    
    // Modified tile rendering with visibility checks
    for (let y = 0; y < this.mapGenerator.displayHeight; y++) {
        let line = '';
        for (let x = 0; x < this.mapGenerator.displayWidth; x++) {
            const worldX = this.mapGenerator.cameraX + x;
            const worldY = this.mapGenerator.cameraY + y;
            
            // Check if tile should be rendered
            if (this.fogOfWar && !this.fogOfWar.shouldRenderTile(worldX, worldY)) {
                line += ' '; // Hidden tile
                continue;
            }
            
            // Apply visibility modifier for dimming
            const visibilityModifier = this.fogOfWar ? this.fogOfWar.getVisibilityModifier(worldX, worldY) : 1.0;
            
            // ... existing tile rendering with visibility modifier applied
        }
    }
}
```

### Entity Visibility System

Modify entity rendering to respect fog of war:

```javascript
// In render method, when rendering entities
const entities = this.entityManager.getAllEntities();
for (const entity of entities) {
    // Check if entity is in visible area
    if (this.fogOfWar && !this.fogOfWar.shouldRenderEntity(entity.x, entity.y)) {
        continue; // Skip rendering hidden entities
    }
    
    // ... existing entity rendering
}
```

## Data Models

### Tile Visibility State

Each tile maintains visibility state through existing properties:
- `visible`: Boolean indicating if tile is currently in line of sight
- `explored`: Boolean indicating if tile has been seen before

### Fog of War Configuration

The fog of war system uses these configuration parameters:
- `viewRadius`: 7 tiles (existing default)
- **Visibility Shape**: Circular/oval area around the player position
- Line-of-sight blocking: Mountains and snow tiles block vision within the circular area
- Visibility calculation: Uses ROT.js PreciseShadowcasting algorithm for circular field of view

## Error Handling

### Fog of War Initialization Failures

```javascript
initialize() {
    try {
        this.fogOfWar = new FogOfWar(this.mapGenerator);
        this.fogOfWar.updateVisibility(this.player.x, this.player.y);
    } catch (error) {
        console.warn('Failed to initialize fog of war:', error);
        this.fogOfWar = null; // Graceful degradation
    }
}
```

### Visibility Update Errors

```javascript
handleKeyPress(key) {
    // ... existing movement handling
    
    // Update fog of war with error handling
    if (this.fogOfWar) {
        try {
            this.fogOfWar.updateVisibility(this.player.x, this.player.y);
        } catch (error) {
            console.warn('Fog of war update failed:', error);
        }
    }
    
    this.render();
}
```

### Graceful Degradation

If fog of war fails to initialize or encounters errors:
- Game continues to function normally without fog of war
- All tiles remain visible (current behavior)
- Warning messages logged to console
- No impact on core gameplay mechanics

## Testing Strategy

### Unit Tests

1. **Fog of War Integration Tests**
   - Test fog of war initialization with map generator
   - Verify visibility updates on player movement
   - Test line-of-sight calculations with terrain blocking

2. **Map Generator Extension Tests**
   - Test `clearVisibility()` method functionality
   - Test `setVisibility()` method with various coordinates
   - Verify tile state persistence across visibility changes

3. **Rendering Pipeline Tests**
   - Test tile visibility filtering
   - Test entity visibility filtering
   - Test visibility modifier application for dimming

### Integration Tests

1. **Player Movement and Visibility**
   - Test fog of war updates when player moves
   - Verify explored areas remain dimly visible
   - Test visibility changes when boarding/disembarking ships

2. **Terrain Interaction**
   - Test line-of-sight blocking by mountains and snow
   - Verify visibility around terrain obstacles
   - Test edge cases with complex terrain layouts

3. **Entity Discovery**
   - Test entity visibility in fog of war
   - Verify entities become visible when areas are explored
   - Test entity hiding when areas become unexplored

### Performance Tests

1. **Visibility Calculation Performance**
   - Measure fog of war update time on player movement
   - Test performance with large view radius
   - Verify no significant impact on rendering frame rate

2. **Memory Usage**
   - Monitor tile visibility state memory usage
   - Test memory cleanup when tiles are unloaded
   - Verify no memory leaks in visibility system