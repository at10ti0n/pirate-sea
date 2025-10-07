# Resource Gathering System - Developer Guide

## Architecture Overview

The Resource Gathering System is built around several core components that work together to provide a seamless resource collection experience across both web and terminal platforms.

### Core Components

```
ResourceManager (resource-manager.js)
├── BiomeResourceConfig (embedded configuration)
├── PlayerInventory (player-inventory.js)
├── Glyph System (visual representation)
└── Depletion/Regeneration Logic
```

## Adding New Resources

### Step 1: Define Resource Properties

Add new resource definitions to the `RESOURCE_TYPES` object in `resource-manager.js`:

```javascript
const RESOURCE_TYPES = {
    // Existing resources...
    
    crystal: {
        name: 'Crystal',
        description: 'Magical crystalline formations',
        category: 'rare',
        stackable: true,
        maxStack: 50,
        rarity: 'rare',
        baseValue: 25
    }
};
```

### Step 2: Create Visual Glyphs

Add glyph definitions to the `RESOURCE_GLYPHS` object:

```javascript
const RESOURCE_GLYPHS = {
    // Existing glyphs...
    
    crystal: {
        web: '💎',
        terminal: '◊',
        color: '#9b59b6',
        depleted: {
            web: '💎',  // Dimmed version
            terminal: '◦',
            color: '#6c3483'
        }
    }
};
```

### Step 3: Update Biome Configuration

Modify existing biomes or create new ones in `BIOME_RESOURCES`:

```javascript
const BIOME_RESOURCES = {
    // Existing biomes...
    
    crystal_cave: {
        resources: [
            { type: 'crystal', weight: 80, baseQuantity: [1, 2] },
            { type: 'stone', weight: 20, baseQuantity: [1, 1] }
        ],
        glyphDistribution: [
            { glyph: 'crystal', weight: 60 },
            { glyph: 'stone', weight: 20 },
            { glyph: 'biome_fallback', weight: 20 }
        ],
        baseSuccessRate: 0.4,  // Lower for rare resources
        depletionRate: 0.3,    // Higher depletion
        regenerationTime: 1800000  // 30 minutes
    }
};
```

## Adding New Biomes

### Complete Biome Definition Template

```javascript
new_biome: {
    // Resource availability
    resources: [
        { 
            type: 'primary_resource', 
            weight: 60,  // Percentage chance
            baseQuantity: [1, 3]  // Min, max quantity
        },
        { 
            type: 'secondary_resource', 
            weight: 40, 
            baseQuantity: [1, 2] 
        }
    ],
    
    // Visual representation
    glyphDistribution: [
        { glyph: 'primary_resource', weight: 45 },
        { glyph: 'secondary_resource', weight: 25 },
        { glyph: 'biome_fallback', weight: 30 }
    ],
    
    // Gathering mechanics
    baseSuccessRate: 0.65,     // 0.0 to 1.0
    depletionRate: 0.15,       // How fast it depletes
    regenerationTime: 600000,  // Milliseconds to regenerate
    
    // Optional: Special modifiers
    gatheringModifiers: {
        timeOfDay: { night: 1.2, day: 1.0 },  // Future feature
        weather: { rain: 0.8, clear: 1.0 }    // Future feature
    }
}
```

## Extending Gathering Mechanics

### Custom Success Rate Calculations

Override the default success calculation by modifying `calculateGatherSuccess()`:

```javascript
calculateGatherSuccess(biome, location, timeSinceLastGather) {
    const config = this.biomeResources[biome];
    if (!config) return 0;
    
    // Base calculation
    let successRate = config.baseSuccessRate;
    
    // Apply depletion
    const depletionLevel = this.getLocationDepletion(location.x, location.y);
    successRate *= (1 - depletionLevel);
    
    // Custom modifiers
    if (config.gatheringModifiers) {
        // Add your custom logic here
        successRate *= this.applyCustomModifiers(config.gatheringModifiers);
    }
    
    return Math.max(0, Math.min(1, successRate));
}
```

### Adding Gathering Tools

Extend the gathering system to support tools:

```javascript
// In ResourceManager
attemptGatherWithTool(x, y, playerInventory, tool = null) {
    const baseResult = this.attemptGather(x, y, playerInventory);
    
    if (tool && baseResult.success) {
        // Apply tool bonuses
        const toolBonus = this.getToolBonus(tool, baseResult.resourceType);
        baseResult.quantity *= toolBonus.quantityMultiplier;
        baseResult.bonusResources = toolBonus.bonusResources || [];
    }
    
    return baseResult;
}

getToolBonus(tool, resourceType) {
    const toolBonuses = {
        pickaxe: {
            stone: { quantityMultiplier: 1.5 },
            ore: { quantityMultiplier: 2.0 }
        },
        axe: {
            wood: { quantityMultiplier: 1.8 }
        }
    };
    
    return toolBonuses[tool.type]?.[resourceType] || { quantityMultiplier: 1.0 };
}
```

## Cross-Platform Considerations

### Glyph Rendering

Always provide both web and terminal versions:

```javascript
renderResourceGlyph(resourceType, platform, isDepleated = false) {
    const glyph = RESOURCE_GLYPHS[resourceType];
    if (!glyph) return platform === 'web' ? '❓' : '?';
    
    const glyphData = isDepleated ? glyph.depleted : glyph;
    return platform === 'web' ? glyphData.web : glyphData.terminal;
}
```

### Input Handling

Ensure consistent behavior across platforms:

```javascript
// In game.js or terminal-game.js
handleGatherInput(key) {
    if (key.toLowerCase() === 'g') {
        const result = this.resourceManager.attemptGather(
            this.player.x, 
            this.player.y, 
            this.player.inventory
        );
        
        // Platform-specific feedback
        if (this.platform === 'web') {
            this.ui.showGatheringResult(result);
        } else {
            this.terminal.displayMessage(result.message);
        }
    }
}
```

## Performance Optimization

### Location State Management

Implement efficient cleanup for old location data:

```javascript
// In ResourceManager
cleanupOldLocations() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, location] of this.locationStates.entries()) {
        if (now - location.lastGathered > maxAge && location.depletionLevel === 0) {
            this.locationStates.delete(key);
        }
    }
}
```

### Batch Operations

For large inventories, use batch operations:

```javascript
// In PlayerInventory
addResourcesBatch(resources) {
    const results = [];
    
    for (const { type, quantity } of resources) {
        results.push(this.addResource(type, quantity));
    }
    
    this.notifyInventoryChanged();
    return results;
}
```

## Testing New Features

### Unit Test Template

```javascript
// test-new-resource.js
import { ResourceManager } from './resource-manager.js';
import { SeededRandom } from './seeded-random.js';

describe('New Resource Tests', () => {
    let resourceManager;
    
    beforeEach(() => {
        const seededRandom = new SeededRandom('test-seed');
        resourceManager = new ResourceManager(null, seededRandom);
    });
    
    test('should gather new resource type', () => {
        const result = resourceManager.attemptGather(0, 0, mockInventory);
        expect(result.resourceType).toBe('crystal');
        expect(result.quantity).toBeGreaterThan(0);
    });
    
    test('should render new resource glyph', () => {
        const webGlyph = resourceManager.getResourceGlyph('crystal', 'web');
        const terminalGlyph = resourceManager.getResourceGlyph('crystal', 'terminal');
        
        expect(webGlyph).toBe('💎');
        expect(terminalGlyph).toBe('◊');
    });
});
```

### Integration Testing

```javascript
// Test biome-resource integration
test('new biome provides expected resources', () => {
    const biomeConfig = resourceManager.getBiomeResources('crystal_cave');
    expect(biomeConfig.resources).toContainEqual({
        type: 'crystal',
        weight: 80,
        baseQuantity: [1, 2]
    });
});
```

## Configuration Management

### Environment-Specific Settings

```javascript
const CONFIG = {
    development: {
        gatheringCooldown: 1000,      // 1 second for testing
        regenerationSpeed: 0.1,       // Fast regeneration
        debugMode: true
    },
    production: {
        gatheringCooldown: 5000,      // 5 seconds
        regenerationSpeed: 1.0,       // Normal speed
        debugMode: false
    }
};
```

### Feature Flags

```javascript
const FEATURES = {
    toolSystem: false,
    weatherEffects: false,
    seasonalResources: false,
    tradingSystem: false
};

// Use in code
if (FEATURES.toolSystem) {
    // Tool-related logic
}
```

## Common Patterns

### Resource Validation

```javascript
validateResourceOperation(resourceType, quantity) {
    if (!RESOURCE_TYPES[resourceType]) {
        throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    if (quantity < 0) {
        throw new Error('Quantity cannot be negative');
    }
    
    if (quantity > RESOURCE_TYPES[resourceType].maxStack) {
        throw new Error(`Quantity exceeds max stack size`);
    }
    
    return true;
}
```

### Event System Integration

```javascript
// Emit events for other systems to listen to
gatherResource(resourceType, quantity) {
    const success = this.inventory.addResource(resourceType, quantity);
    
    if (success) {
        this.eventEmitter.emit('resourceGathered', {
            type: resourceType,
            quantity: quantity,
            timestamp: Date.now()
        });
    }
    
    return success;
}
```

## Debugging Tools

### Debug Console Commands

```javascript
// Add to game console
window.debugResources = {
    giveResource: (type, quantity) => {
        game.player.inventory.addResource(type, quantity);
    },
    
    clearInventory: () => {
        game.player.inventory.clear();
    },
    
    setDepletion: (x, y, level) => {
        game.resourceManager.setLocationDepletion(x, y, level);
    },
    
    showLocationStates: () => {
        console.table(Array.from(game.resourceManager.locationStates.entries()));
    }
};
```

### Performance Monitoring

```javascript
// Add performance tracking
const performanceTracker = {
    gatherAttempts: 0,
    totalGatherTime: 0,
    
    trackGather: (fn) => {
        return (...args) => {
            const start = performance.now();
            const result = fn.apply(this, args);
            const end = performance.now();
            
            this.gatherAttempts++;
            this.totalGatherTime += (end - start);
            
            return result;
        };
    }
};
```

## Best Practices

1. **Always validate inputs** - Check resource types, quantities, and coordinates
2. **Handle edge cases** - Null values, negative numbers, invalid biomes
3. **Maintain cross-platform compatibility** - Test on both web and terminal
4. **Use consistent naming** - Follow existing conventions for variables and methods
5. **Document configuration changes** - Update this guide when adding new features
6. **Test thoroughly** - Unit tests, integration tests, and manual testing
7. **Consider performance** - Large inventories and many locations can impact performance
8. **Plan for extensibility** - Design new features to be easily extended later

## Migration Guide

When updating existing systems:

1. **Backup save data** - Ensure player inventories are preserved
2. **Version configuration** - Add version numbers to save data
3. **Graceful degradation** - Handle unknown resource types in old saves
4. **Migration scripts** - Convert old data formats to new ones

```javascript
// Example migration
migrateInventoryData(oldData, version) {
    if (version < 2.0) {
        // Convert old resource format to new format
        return oldData.map(item => ({
            ...item,
            category: RESOURCE_TYPES[item.type]?.category || 'material'
        }));
    }
    return oldData;
}
```

This guide should help you extend and maintain the resource gathering system effectively. Remember to update documentation when making changes!