# Improved Terrain Generation Plan

## Current System Analysis

### What Works Well
- ✅ Multiple noise scales create varied island sizes (continent, island, atoll, chains)
- ✅ 80% ocean coverage maintains pirate/sailing theme
- ✅ Minimum landmass size (9 tiles) prevents tiny unusable islands
- ✅ Elevation, moisture, temperature already stored in tiles
- ✅ Sparse map storage allows infinite world

### Current Limitations
1. **No heightmap visualization** - elevation stored but not displayed
2. **Unrealistic climate** - temperature/moisture independent of geography
3. **Simple biome logic** - hard thresholds, no smooth transitions
4. **Island shapes** - purely noise-based, no geographic realism
5. **No elevation effects** - height doesn't affect local climate
6. **Missing features** - no volcanic peaks, atolls are just small islands

## Proposed Improvements

### 1. Heightmap System

**Current**: Elevation stored (0.0-1.0) but not visualized
**Proposed**: Multi-tier height system with visualization

```
Height Tiers (0.0 - 1.0):
├─ 0.00 - 0.30: Deep Ocean (-500m to -50m)
├─ 0.30 - 0.40: Shallow Ocean (-50m to 0m)
├─ 0.40 - 0.45: Beach/Coast (0m to 5m)
├─ 0.45 - 0.60: Lowlands (5m to 50m)
├─ 0.60 - 0.75: Hills (50m to 200m)
├─ 0.75 - 0.90: Mountains (200m to 1000m)
└─ 0.90 - 1.00: Peaks (1000m to 2000m)
```

**Visualization Options**:
- **Option A**: Shade existing biome colors by elevation (darker = lower)
- **Option B**: Show elevation contour lines on higher ground
- **Option C**: Different characters for elevation (., -, =, ^, ▲)
- **Recommended**: Option A (subtle and doesn't clutter display)

**Implementation**:
```javascript
// In map.js - generateChunkAt()
tile.heightMeters = this.elevationToMeters(elevation);
tile.heightTier = this.getHeightTier(elevation);

// In resource rendering
const shadeFactor = this.getElevationShade(elevation);
color = this.darkenColor(baseColor, shadeFactor);
```

### 2. Realistic Climate System

**Current**: Random noise for temperature and moisture everywhere
**Proposed**: Geography-based climate with realistic patterns

#### A. Latitude-Based Temperature
```javascript
// Temperature decreases away from equator
// World center (0,0) = equator
const distanceFromEquator = Math.abs(y) / 100; // Normalize
const latitudeTemp = 1.0 - (distanceFromEquator * 0.6); // 0°=hot, poles=cold

// Combine with noise for variation
const temperatureNoise = (this.tempNoise.get(x*0.07, y*0.07) + 1) / 2;
temperature = (latitudeTemp * 0.7) + (temperatureNoise * 0.3);
```

#### B. Elevation Temperature Lapse
```javascript
// Temperature drops ~6.5°C per 1000m elevation
// At sea level: use base temperature
// At 1000m peak: -30% temperature
const elevationEffect = elevation > 0.45 ? (elevation - 0.45) * 0.8 : 0;
temperature = temperature * (1.0 - elevationEffect);
```

#### C. Coastal vs Inland Temperature
```javascript
// Coasts are more moderate (less extreme)
const distanceToOcean = this.getDistanceToOcean(x, y);
const coastalModeration = Math.max(0, 1.0 - (distanceToOcean / 10));
// Makes coastal areas less extreme hot/cold
```

#### D. Rain Shadow Effect
```javascript
// Mountains block moisture from prevailing winds
// Check if mountain is upwind (west side gets rain, east is dry)
const prevailingWind = { dx: 1, dy: 0 }; // West to East
const mountainUpwind = this.checkMountainUpwind(x, y, prevailingWind);
if (mountainUpwind) {
    moisture *= 0.3; // Dry rain shadow
}
```

### 3. Improved Biome Generation

**Current**: Hard thresholds (if elevation > 0.9 then mountain)
**Proposed**: Contextual biomes with smooth transitions

#### A. Elevation-Based Biomes
```
Ocean (< 0.40) → Beach (0.40-0.45) → Lowland Biomes (0.45-0.75) → Hills (0.75-0.90) → Mountains/Peaks (> 0.90)
```

#### B. Climate-Based Lowland Biomes
```
Temperature (Cold → Hot) + Moisture (Dry → Wet):

            DRY         MODERATE      WET
COLD     | Taiga    | Taiga/Forest | Swamp
MODERATE | Savanna  | Grassland    | Forest
HOT      | Desert   | Savanna      | Jungle/Tropical
```

#### C. Coastal Biomes
```
- Mangrove (tropical + coastal + wet)
- Salt marsh (temperate + coastal + wet)
- Dunes (coastal + dry)
- Cliffs (coastal + high elevation change)
```

#### D. Special Biomes
```
- Volcanic (single peak > 0.95 elevation)
- Coral reef (shallow ocean near land)
- Ice cap (elevation > 0.85 + temperature < 0.2)
```

### 4. Realistic Island Generation

**Current**: Pure noise creates organic but unrealistic shapes
**Proposed**: Island archetypes with realistic formation

#### A. Volcanic Islands
```javascript
// Central peak with gradual slopes
// Common in oceanic settings
function generateVolcanicIsland(centerX, centerY, radius) {
    // Peak at center, slopes down radially
    const distFromCenter = Math.sqrt(dx*dx + dy*dy) / radius;
    elevation = 0.95 * (1.0 - distFromCenter); // Cone shape
    // Add noise for natural variation
}
```

#### B. Atoll Islands
```javascript
// Ring-shaped coral islands around lagoon
function generateAtoll(centerX, centerY, radius) {
    const distFromCenter = Math.sqrt(dx*dx + dy*dy);
    // High elevation at ring, low in center (lagoon)
    if (distFromCenter > radius * 0.8 && distFromCenter < radius * 1.2) {
        elevation = 0.5; // Ring of land
    } else if (distFromCenter < radius * 0.8) {
        elevation = 0.35; // Lagoon (shallow water)
    }
}
```

#### C. Continental Islands
```javascript
// Irregular shapes with varied terrain
// Keep current noise-based generation
// Add coastal shelves (gradual depth increase)
```

#### D. Island Chains
```javascript
// Linear sequences following tectonic patterns
// Already exists but could be enhanced
const chainAngle = Math.atan2(chainY, chainX);
// Islands spaced along angle with size variation
```

### 5. Height-Based Features

#### A. Elevation Affects Resources
```javascript
// Mountains: stone, ore, gems (high elevation)
// Hills: wood, stone (medium elevation)
// Lowlands: berries, hay, reeds (low elevation)
// Coast: sand, shells (coastal)

resourceProbability = getResourceByElevation(elevation, biome);
```

#### B. Elevation Affects Visibility
```javascript
// Higher ground = better visibility range
const elevationBonus = Math.floor(elevation * 5); // 0-5 extra tiles
visibilityRange = baseRange + elevationBonus;
```

#### C. Elevation Affects Movement Cost
```javascript
// Moving uphill is slower/costs more hunger
const elevationChange = Math.abs(targetElevation - currentElevation);
if (elevationChange > 0.1) {
    hungerCost *= (1.0 + elevationChange * 2);
}
```

## Implementation Phases

### Phase 1: Heightmap Visualization (Low complexity)
- [ ] Add elevation shading to existing biome colors
- [ ] Display elevation in examine tile (X key)
- [ ] Test visibility with different shade intensities
- **Estimated effort**: 2 hours
- **Files**: map.js, terminal-game.js, ui.js

### Phase 2: Latitude-Based Temperature (Medium complexity)
- [ ] Implement latitude temperature calculation
- [ ] Adjust biome thresholds to work with new temperatures
- [ ] Test that biomes still generate reasonably
- **Estimated effort**: 3 hours
- **Files**: map.js

### Phase 3: Elevation Climate Effects (Medium complexity)
- [ ] Add elevation temperature lapse
- [ ] Add rain shadow calculations
- [ ] Add coastal moisture effects
- **Estimated effort**: 4 hours
- **Files**: map.js

### Phase 4: Improved Biome Logic (Medium complexity)
- [ ] Refactor determineBiome() with new logic
- [ ] Add grassland biome
- [ ] Add elevation-contextual biome selection
- [ ] Test biome distribution looks natural
- **Estimated effort**: 4 hours
- **Files**: map.js

### Phase 5: Island Archetypes (High complexity)
- [ ] Add volcanic island generator
- [ ] Add atoll generator
- [ ] Integrate with existing noise-based generation
- [ ] Add island type to tile metadata
- **Estimated effort**: 6 hours
- **Files**: map.js, entities.js

### Phase 6: Height-Based Gameplay (Medium complexity)
- [ ] Elevation-based resource distribution
- [ ] Elevation-based visibility
- [ ] Elevation-based movement cost
- **Estimated effort**: 4 hours
- **Files**: resource-manager.js, fog.js, player.js

## Testing Plan

### Visual Testing
1. Generate multiple seeds and verify:
   - Islands have realistic shapes
   - Biomes transition naturally
   - Climate makes geographic sense
   - Elevation shading is visible but not overwhelming

### Gameplay Testing
1. Walk around islands to verify:
   - All terrain still accessible
   - Resources spawn appropriately
   - Movement feels responsive
   - Elevation effects are noticeable but not frustrating

### Performance Testing
1. Measure generation speed:
   - Target: < 100ms for 48x28 visible area
   - Profile noise calculations if slow
   - Consider caching climate data

## Open Questions

1. **Grassland biome**: Add new biome or keep forest as general green?
   - Recommendation: Add grassland for variety

2. **Elevation shading**: How dark should shading go?
   - Recommendation: 50% darkening max for deep ocean/valleys

3. **Volcanic islands**: How common should they be?
   - Recommendation: 10% of large islands

4. **Movement cost**: Should uphill movement take longer?
   - Recommendation: Yes, but subtle (1.5x max)

5. **Web vs Terminal**: Different features for each?
   - Recommendation: Same terrain, terminal may simplify visualization

## Success Criteria

✅ **Visual**: Terrain looks more realistic and varied
✅ **Gameplay**: Elevation adds strategic depth without frustration
✅ **Performance**: No noticeable slowdown in generation
✅ **Compatibility**: Works in both web and terminal modes
✅ **Maintainability**: Code remains clear and well-documented

## Notes

- Keep 80% ocean coverage - core to pirate theme
- Don't add rivers - too complex for small islands
- Maintain infinite world generation
- Preserve existing save compatibility if possible
