# Simplified Biome Resource System

## Core Resource Types (7 Total)

1. **Stone** - Building and construction material
2. **Sand** - Glass-making and fine construction
3. **Wood** - Primary building, fuel, and crafting material
4. **Hay** - Animal feed, thatching, and rope material
5. **Ore** - Metal crafting and tool material
6. **Berries** - Food, preservation, and sustenance
7. **Reeds** - Rope-making, weaving, and binding material

## Biome → Resource Mapping

| Biome | Primary Resource (60%) | Secondary Resource (40%) |
|-------|----------------------|-------------------------|
| **Forest** | Wood | Berries |
| **Desert** | Stone | Sand |
| **Mountain** | Stone | Ore |
| **Beach** | Wood (driftwood) | Sand |
| **Jungle** | Wood | Berries |
| **Savanna** | Hay | Wood |
| **Taiga** | Wood | Berries |
| **Tropical** | Wood | Berries |
| **Swamp** | Reeds | Berries |

## Resource Uses & Value

### Building Materials
- **Wood**: Basic construction, fuel, tools
- **Stone**: Sturdy construction, foundations
- **Sand**: Glass, mortar, fine construction

### Crafting Materials
- **Ore**: Metal tools, weapons, advanced items
- **Reeds**: Rope, nets, binding materials
- **Hay**: Thatching, animal feed, insulation

### Consumables
- **Berries**: Food, health restoration, preservation

## Gathering Strategy

### High Wood Areas
- Forest, Jungle, Taiga, Tropical (60% chance)
- Beach (50% chance, driftwood)

### Stone Sources
- Desert, Mountain (50-60% chance)

### Specialized Resources
- **Ore**: Only from Mountains (50% chance)
- **Reeds**: Only from Swamps (60% chance)  
- **Hay**: Primarily from Savanna (60% chance)
- **Sand**: Desert (40%) and Beach (50%)

### Food Sources (Berries)
- Forest, Jungle, Taiga, Tropical, Swamp (40% chance each)

## Implementation Benefits

✅ **Simple & Clear**: Only 7 resource types, easy to understand  
✅ **Balanced Distribution**: Each biome offers 2 resources  
✅ **Strategic Choices**: Some resources only from specific biomes  
✅ **Logical Mapping**: Resources make sense for their biomes  
✅ **Future-Proof**: Easy to expand with crafting recipes  

This simplified system maintains strategic depth while being much more manageable for both players and developers!