# Resource Glyph System Design

## Overview

Instead of showing plain biome glyphs, individual tiles within biomes will display as resource glyphs based on the resource distribution percentages. This creates a more varied and informative visual representation while maintaining the underlying biome structure.

## Resource Glyph Definitions

### Core Resource Glyphs

| Resource | Web Glyph | Terminal Char | Color | Description |
|----------|-----------|---------------|-------|-------------|
| **Stone** | 🪨 | `◆` | `#7f8c8d` (Gray) | Rocky outcroppings |
| **Sand** | 🏖️ | `∴` | `#f39c12` (Orange) | Sandy patches |
| **Wood** | 🌳 | `♠` | `#27ae60` (Green) | Trees and timber |
| **Hay** | 🌾 | `"` | `#f1c40f` (Yellow) | Grass and dried vegetation |
| **Ore** | ⛏️ | `▲` | `#34495e` (Dark Gray) | Mineral deposits |
| **Berries** | 🫐 | `*` | `#e74c3c` (Red) | Berry bushes and fruit |
| **Reeds** | 🌿 | `|` | `#16a085` (Teal) | Tall marsh plants |

### Fallback Biome Glyphs

When no resource glyph is selected, use original biome glyph:

| Biome | Original Glyph | Terminal Char | Color |
|-------|----------------|---------------|-------|
| Forest | 🌲 | `♠` | `#229954` |
| Desert | 🏜️ | `:` | `#e67e22` |
| Mountain | ⛰️ | `^` | `#7f8c8d` |
| Beach | 🏖️ | `.` | `#f39c12` |
| Jungle | 🌴 | `#` | `#27ae60` |
| Savanna | 🌾 | `"` | `#d35400` |
| Taiga | 🌲 | `T` | `#2c3e50` |
| Tropical | 🌺 | `t` | `#e74c3c` |
| Swamp | 🐸 | `%` | `#16a085` |

## Glyph Distribution System

### Tile Glyph Selection Algorithm

```javascript
function getTileGlyph(biome, x, y, seededRandom) {
    const biomeConfig = BIOME_RESOURCES[biome];
    if (!biomeConfig) return getBiomeFallbackGlyph(biome);
    
    // Use position-based seeded random for consistency
    const tileRandom = seededRandom.getSeededRandomAt(x, y, 1000);
    
    // Calculate glyph distribution percentages
    const glyphDistribution = calculateGlyphDistribution(biomeConfig);
    
    // Select glyph based on weighted random
    const selectedGlyph = weightedRandomSelect(glyphDistribution, tileRandom);
    
    return selectedGlyph || getBiomeFallbackGlyph(biome);
}
```

### Glyph Distribution Percentages

Based on resource availability, but adjusted for visual variety:

#### Forest Biome
- **Wood Glyph** (🌳): 45% - Tree tiles
- **Berry Glyph** (🫐): 25% - Berry bush tiles  
- **Biome Fallback** (🌲): 30% - General forest tiles

#### Desert Biome
- **Stone Glyph** (🪨): 40% - Rocky outcrops
- **Sand Glyph** (🏖️): 35% - Sandy areas
- **Biome Fallback** (🏜️): 25% - General desert tiles

#### Mountain Biome
- **Stone Glyph** (🪨): 35% - Rocky surfaces
- **Ore Glyph** (⛏️): 25% - Mineral deposits
- **Biome Fallback** (⛰️): 40% - General mountain tiles

#### Beach Biome
- **Wood Glyph** (🌳): 30% - Driftwood areas
- **Sand Glyph** (🏖️): 40% - Sandy beach
- **Biome Fallback** (🏖️): 30% - General beach tiles

#### Jungle Biome
- **Wood Glyph** (🌳): 40% - Dense trees
- **Berry Glyph** (🫐): 30% - Fruit areas
- **Biome Fallback** (🌴): 30% - General jungle tiles

#### Savanna Biome
- **Hay Glyph** (🌾): 45% - Grassland areas
- **Wood Glyph** (🌳): 25% - Scattered trees
- **Biome Fallback** (🌾): 30% - General savanna tiles

#### Taiga Biome
- **Wood Glyph** (🌳): 45% - Coniferous trees
- **Berry Glyph** (🫐): 25% - Berry patches
- **Biome Fallback** (🌲): 30% - General taiga tiles

#### Tropical Biome
- **Wood Glyph** (🌳): 40% - Tropical trees
- **Berry Glyph** (🫐): 30% - Tropical fruits
- **Biome Fallback** (🌺): 30% - General tropical tiles

#### Swamp Biome
- **Reed Glyph** (🌿): 45% - Marsh reeds
- **Berry Glyph** (🫐): 25% - Bog berries
- **Biome Fallback** (🐸): 30% - General swamp tiles

## Implementation Details

### Glyph Selection Logic

```javascript
const GLYPH_DISTRIBUTIONS = {
    forest: [
        { glyph: 'wood', weight: 45 },
        { glyph: 'berries', weight: 25 },
        { glyph: 'biome_fallback', weight: 30 }
    ],
    desert: [
        { glyph: 'stone', weight: 40 },
        { glyph: 'sand', weight: 35 },
        { glyph: 'biome_fallback', weight: 25 }
    ],
    // ... other biomes
};

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

### Gathering Integration

```javascript
function attemptGather(x, y) {
    const tileGlyph = getTileGlyph(biome, x, y, seededRandom);
    
    // If tile shows resource glyph, higher chance of that resource
    if (isResourceGlyph(tileGlyph)) {
        const resourceType = getResourceFromGlyph(tileGlyph);
        // 80% chance of getting the displayed resource
        // 20% chance of getting other biome resources
        return gatherWithBias(resourceType, 0.8);
    } else {
        // Normal random gathering from biome resources
        return gatherNormally();
    }
}
```

## Visual Benefits

### Enhanced World Variety
- **Rich Visual Texture**: Each biome shows diverse tile types
- **Resource Hints**: Players can see what resources are likely available
- **Exploration Incentive**: Visually interesting areas suggest good gathering spots

### Gameplay Information
- **Resource Density**: Areas with many resource glyphs = good gathering
- **Resource Types**: Immediate visual feedback about available materials
- **Biome Identification**: Still recognizable as specific biome types

### Cross-Platform Consistency
- **Web Version**: Rich emoji glyphs for modern visual appeal
- **Terminal Version**: ASCII characters that work in any terminal
- **Color Coding**: Consistent colors across both platforms

## Implementation Considerations

### Performance
- **Cached Glyph Generation**: Store glyph decisions to avoid recalculation
- **Deterministic Selection**: Same seed = same glyph pattern
- **Efficient Lookup**: Fast glyph-to-resource mapping

### Memory Usage
- **Sparse Storage**: Only store glyph data for visible/visited tiles
- **Cleanup**: Remove old glyph data for distant tiles

### User Experience
- **Clear Distinction**: Resource glyphs clearly different from biome glyphs
- **Intuitive Mapping**: Glyphs visually represent their resources
- **Accessibility**: Terminal characters work without special fonts

This system transforms the world from uniform biome tiles into a rich, varied landscape that provides both visual appeal and gameplay information!