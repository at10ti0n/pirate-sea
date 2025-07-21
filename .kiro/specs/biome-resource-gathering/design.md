# Biome Resource Gathering System - Design Document

## Overview

The Biome Resource Gathering System adds a layer of resource collection and management to the Pirate Sea game. Players can gather biome-specific resources from different terrain types, creating opportunities for crafting, trading, and survival gameplay. The system integrates seamlessly with existing game mechanics while providing new strategic depth.

## Architecture

### Core Components

1. **ResourceManager**: Central system managing resource definitions, gathering logic, and inventory
2. **BiomeResources**: Configuration defining what resources are available in each biome
3. **PlayerInventory**: Storage system for collected resources
4. **GatheringMechanics**: Logic for resource collection, success rates, and depletion
5. **UI Integration**: Display components for inventory and gathering feedback

### System Flow

```
Player Input (G key) → ResourceManager.attemptGather() → 
Check Biome → Calculate Success → Update Inventory → 
Provide Feedback → Update UI
```

## Components and Interfaces

### ResourceManager Class

```javascript
class ResourceManager {
    constructor(mapGenerator, seededRandom)
    
    // Core Methods
    attemptGather(x, y, playerInventory)
    getBiomeResources(biomeType)
    calculateGatherSuccess(biome, location, timeSinceLastGather)
    
    // Resource Management
    getResourceInfo(resourceType)
    isLocationDepleted(x, y)
    regenerateLocation(x, y)
}
```

### PlayerInventory Class

```javascript
class PlayerInventory {
    constructor()
    
    // Inventory Management
    addResource(resourceType, quantity)
    removeResource(resourceType, quantity)
    getResourceCount(resourceType)
    getAllResources()
    
    // Capacity Management
    getTotalItems()
    getCapacity()
    hasSpace(quantity)
}
```

### BiomeResourceConfig with Glyph System

```javascript
const BIOME_RESOURCES = {
    forest: {
        resources: [
            { type: 'wood', weight: 60, baseQuantity: [1, 3] },
            { type: 'berries', weight: 40, baseQuantity: [1, 2] }
        ],
        glyphDistribution: [
            { glyph: 'wood', weight: 45 },
            { glyph: 'berries', weight: 25 },
            { glyph: 'biome_fallback', weight: 30 }
        ],
        baseSuccessRate: 0.7,
        depletionRate: 0.1,
        regenerationTime: 300000 // 5 minutes
    },
    desert: {
        resources: [
            { type: 'stone', weight: 60, baseQuantity: [1, 2] },
            { type: 'sand', weight: 40, baseQuantity: [1, 3] }
        ],
        glyphDistribution: [
            { glyph: 'stone', weight: 40 },
            { glyph: 'sand', weight: 35 },
            { glyph: 'biome_fallback', weight: 25 }
        ],
        baseSuccessRate: 0.6,
        depletionRate: 0.15,
        regenerationTime: 600000 // 10 minutes
    },
    // ... other biomes follow same pattern
}

const RESOURCE_GLYPHS = {
    stone: { web: '🪨', terminal: '◆', color: '#7f8c8d' },
    sand: { web: '🏖️', terminal: '∴', color: '#f39c12' },
    wood: { web: '🌳', terminal: '♠', color: '#27ae60' },
    hay: { web: '🌾', terminal: '"', color: '#f1c40f' },
    ore: { web: '⛏️', terminal: '▲', color: '#34495e' },
    berries: { web: '🫐', terminal: '*', color: '#e74c3c' },
    reeds: { web: '🌿', terminal: '|', color: '#16a085' }
};
```

## Data Models

### Resource Definition

```javascript
{
    type: 'wood',
    name: 'Wood',
    description: 'Sturdy timber from forest trees',
    category: 'material',
    stackable: true,
    maxStack: 99,
    rarity: 'common',
    icon: '🪵', // Web version
    char: 'W'   // Terminal version
}
```

### Gathering Location State

```javascript
{
    x: number,
    y: number,
    lastGathered: timestamp,
    depletionLevel: 0.0-1.0,
    totalGathers: number,
    regenerationTimer: timestamp
}
```

### Player Inventory Entry

```javascript
{
    resourceType: 'wood',
    quantity: 15,
    lastUpdated: timestamp
}
```

## Simplified Resource Types

### Core Resources (7 types total)
1. **Stone** - Building and tool material
2. **Sand** - Glass-making and construction
3. **Wood** - Primary building and fuel material
4. **Hay** - Animal feed and thatching material
5. **Ore** - Metal crafting material
6. **Berries** - Food and preservation
7. **Reeds** - Rope-making and weaving material

## Visual Glyph System

### Resource Glyph Representation

Instead of uniform biome tiles, individual tiles display as resource glyphs based on distribution percentages:

| Resource | Web Glyph | Terminal | Color | Usage |
|----------|-----------|----------|-------|-------|
| Stone | 🪨 | ◆ | Gray | Rocky outcroppings |
| Sand | 🏖️ | ∴ | Orange | Sandy patches |
| Wood | 🌳 | ♠ | Green | Trees and timber |
| Hay | 🌾 | " | Yellow | Grass areas |
| Ore | ⛏️ | ▲ | Dark Gray | Mineral deposits |
| Berries | 🫐 | * | Red | Berry bushes |
| Reeds | 🌿 | \| | Teal | Marsh plants |

### Glyph Distribution by Biome

#### Forest Biome
- **Wood Glyph** (🌳): 45% - Tree tiles
- **Berry Glyph** (🫐): 25% - Berry bushes
- **Forest Fallback** (🌲): 30% - General forest
- *Resources: Wood (60%), Berries (40%)*

#### Desert Biome
- **Stone Glyph** (🪨): 40% - Rocky outcrops
- **Sand Glyph** (🏖️): 35% - Sandy areas
- **Desert Fallback** (🏜️): 25% - General desert
- *Resources: Stone (60%), Sand (40%)*

#### Mountain Biome
- **Stone Glyph** (🪨): 35% - Rocky surfaces
- **Ore Glyph** (⛏️): 25% - Mineral deposits
- **Mountain Fallback** (⛰️): 40% - General mountain
- *Resources: Stone (50%), Ore (50%)*

#### Beach Biome
- **Wood Glyph** (🌳): 30% - Driftwood
- **Sand Glyph** (🏖️): 40% - Beach sand
- **Beach Fallback** (🏖️): 30% - General beach
- *Resources: Wood (50%), Sand (50%)*

#### Jungle Biome
- **Wood Glyph** (🌳): 40% - Dense trees
- **Berry Glyph** (🫐): 30% - Fruit areas
- **Jungle Fallback** (🌴): 30% - General jungle
- *Resources: Wood (60%), Berries (40%)*

#### Savanna Biome
- **Hay Glyph** (🌾): 45% - Grasslands
- **Wood Glyph** (🌳): 25% - Scattered trees
- **Savanna Fallback** (🌾): 30% - General savanna
- *Resources: Hay (60%), Wood (40%)*

#### Taiga Biome
- **Wood Glyph** (🌳): 45% - Coniferous trees
- **Berry Glyph** (🫐): 25% - Berry patches
- **Taiga Fallback** (🌲): 30% - General taiga
- *Resources: Wood (60%), Berries (40%)*

#### Tropical Biome
- **Wood Glyph** (🌳): 40% - Tropical trees
- **Berry Glyph** (🫐): 30% - Tropical fruits
- **Tropical Fallback** (🌺): 30% - General tropical
- *Resources: Wood (60%), Berries (40%)*

#### Swamp Biome
- **Reed Glyph** (🌿): 45% - Marsh reeds
- **Berry Glyph** (🫐): 25% - Bog berries
- **Swamp Fallback** (🐸): 30% - General swamp
- *Resources: Reeds (60%), Berries (40%)*

## Gathering Mechanics

### Success Rate Calculation

```javascript
successRate = baseSuccessRate * (1 - depletionLevel) * biomeModifier * timeModifier
```

Where:
- `baseSuccessRate`: Biome-specific base chance (0.5-0.8)
- `depletionLevel`: How depleted the location is (0.0-1.0)
- `biomeModifier`: Player skill/tool modifiers (future expansion)
- `timeModifier`: Bonus for waiting between gathers

### Depletion System

- Each successful gather increases depletion by `depletionRate`
- Depletion reduces success rate and resource quantity
- Locations regenerate over time when not being gathered
- Complete regeneration takes 5-15 minutes depending on biome

### Quantity Determination

```javascript
quantity = baseQuantity + Math.floor(seededRandom.random() * varianceRange)
```

## Error Handling

### Gathering Failures
- **No Resources**: "Nothing to gather here"
- **Depleted Location**: "This area has been picked clean. Try again later."
- **On Ship**: "Cannot gather resources while on ship"
- **Inventory Full**: "Inventory full! Cannot gather more resources."

### Invalid Operations
- Graceful handling of invalid biome types
- Protection against negative resource quantities
- Validation of inventory operations

## Testing Strategy

### Unit Tests
- Resource definition validation
- Gathering success rate calculations
- Inventory management operations
- Depletion and regeneration logic

### Integration Tests
- Biome-resource mapping accuracy
- Cross-platform UI consistency
- Seeded random determinism
- Save/load inventory state

### User Experience Tests
- Gathering feedback clarity
- Inventory management usability
- Resource information accessibility
- Performance with large inventories

## Performance Considerations

### Memory Management
- Lazy loading of gathering location states
- Periodic cleanup of old location data
- Efficient inventory storage and retrieval

### Computational Efficiency
- Cached biome resource lookups
- Optimized success rate calculations
- Minimal UI update frequency

### Scalability
- Support for hundreds of resource types
- Efficient handling of large inventories
- Performant location state tracking

## Future Expansion Opportunities

### Crafting System
- Combine resources to create tools/items
- Recipe discovery and progression
- Quality tiers for crafted goods

### Trading System
- NPC merchants at ports
- Resource-based economy
- Supply and demand mechanics

### Tool System
- Gathering tools improve success rates
- Tool durability and maintenance
- Specialized tools for different biomes

### Skill Progression
- Player gathering skills improve over time
- Biome-specific expertise development
- Unlock rare resource gathering abilities