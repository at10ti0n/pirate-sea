# Requirements Document

## Introduction

The procedural map generation system creates infinite, explorable worlds for the pirate-themed roguelike game using noise-based terrain generation. The system must generate diverse biomes with realistic 80% water coverage to support the game's dual movement mechanics (walking on land, sailing on water). The system depends on the ROT.js library (rot-js npm package v2.2.0+) for Simplex noise generation and uses JavaScript's native Map data structure for sparse tile storage. The implementation combines multiple noise scales to create natural-looking archipelagos, continents, and island chains while maintaining optimal performance through on-demand chunk generation.

## Requirements

### Requirement 1

**User Story:** As a player, I want to explore an infinite procedurally generated world with 11 distinct biomes, so that each exploration session offers unique terrain combinations and strategic navigation challenges.

#### Acceptance Criteria

1. WHEN the game initializes THEN the system SHALL create a MapGenerator with configurable display dimensions (default 48x28 tiles)
2. WHEN generating terrain THEN the system SHALL use ROT.Noise.Simplex() from the rot-js library for elevation, moisture, and temperature generation
3. WHEN creating landmasses THEN the system SHALL combine 4 noise scales: continental (0.025), island (0.12), atoll (0.2), and chain (0.06)
4. WHEN assigning biomes THEN the system SHALL support 11 biome types: ocean (~), beach (.), forest (♠), jungle (#), desert (:), savanna ("), taiga (T), tropical (t), mountain (^), snow (*), swamp (%)
5. WHEN displaying biomes THEN each biome SHALL have unique ASCII character and hex color code (e.g., ocean: #2980b9, forest: #229954) for visual distinction

### Requirement 2

**User Story:** As a player, I want biomes that logically affect my movement based on whether I'm on foot or sailing, so that I must strategically choose between land and sea routes.

#### Acceptance Criteria

1. WHEN elevation is below 0.4 THEN the system SHALL assign ocean biome navigable only by ship
2. WHEN elevation is between 0.4-0.45 THEN the system SHALL assign beach biome as coastal transition zones walkable on foot
3. WHEN elevation exceeds 0.9 AND temperature below 0.4 THEN the system SHALL assign snow biome impassable to both modes
4. WHEN elevation exceeds 0.9 AND temperature above 0.4 THEN the system SHALL assign mountain biome impassable to both modes
5. WHEN moisture below 0.15 AND temperature above 0.75 THEN the system SHALL assign desert biome walkable on foot only
6. WHEN moisture above 0.85 AND temperature above 0.75 THEN the system SHALL assign jungle biome walkable on foot only
7. WHEN moisture above 0.85 AND temperature below 0.75 THEN the system SHALL assign swamp biome impassable to both modes

### Requirement 3

**User Story:** As a player, I want seamless world exploration without loading screens or performance hitches, so that I can focus on navigation and discovery rather than technical limitations.

#### Acceptance Criteria

1. WHEN exploring the world THEN the system SHALL use JavaScript's native Map data structure with string keys ("x,y") for O(1) tile access
2. WHEN new areas are needed THEN the system SHALL generate chunks on-demand via generateChunkAt(x, y) method
3. WHEN the player moves THEN the system SHALL update camera position and generate only visible tiles (48x28 viewport)
4. WHEN managing memory THEN the system SHALL store only accessed tiles to prevent memory exhaustion
5. WHEN accessing tiles THEN the system SHALL return cached tiles immediately without regeneration

### Requirement 4

**User Story:** As a player, I want realistic terrain that creates natural-looking landmasses with proper 80% water coverage, so that the world feels believable and supports the pirate theme.

#### Acceptance Criteria

1. WHEN generating elevation THEN the system SHALL start with base ocean level (0.2) and add noise layers conditionally
2. WHEN creating continents THEN large landmass noise (>0.75 threshold) SHALL add significant elevation (1.8 multiplier)
3. WHEN forming islands THEN medium island noise (>0.7 threshold) SHALL add moderate elevation (1.3 multiplier)
4. WHEN placing atolls THEN small atoll noise (>0.75 threshold) SHALL add minor elevation (1.0 multiplier)
5. WHEN generating chains THEN three chain patterns with different thresholds SHALL create archipelago formations

### Requirement 5

**User Story:** As a player, I want small unusable landmasses automatically converted to ocean, so that I don't encounter tiny isolated islands that break gameplay flow.

#### Acceptance Criteria

1. WHEN a landmass is generated THEN the system SHALL calculate its size using flood-fill algorithm
2. WHEN landmass size is below 9 tiles THEN the system SHALL convert the entire landmass to ocean biome
3. WHEN calculating landmass size THEN the system SHALL use visited set tracking to prevent infinite recursion
4. WHEN size calculation reaches 20 tiles THEN the system SHALL terminate early for performance
5. WHEN converting to ocean THEN the system SHALL update the tile's biome property before storage

### Requirement 6

**User Story:** As a game system, I need efficient movement validation and entity placement support, so that players and entities can interact properly with the generated terrain.

#### Acceptance Criteria

1. WHEN validating movement THEN the system SHALL provide isWalkable(x, y, onShip) method supporting both movement modes
2. WHEN placing entities THEN the system SHALL provide getWalkableTiles() method for finding suitable spawn locations
3. WHEN ships need placement THEN the system SHALL provide isNavigableWater() method checking water neighbor count
4. WHEN analyzing water bodies THEN the system SHALL provide getWaterBodySize() method with configurable limits
5. WHEN accessing biome data THEN the system SHALL provide getBiomeAt(x, y) method returning complete tile information

### Requirement 7

**User Story:** As a game system, I need fog of war integration support, so that player exploration can be properly tracked and visualized.

#### Acceptance Criteria

1. WHEN managing visibility THEN each tile SHALL have visible and explored boolean properties
2. WHEN updating fog of war THEN the system SHALL provide setVisibility(x, y, visible) method
3. WHEN clearing visibility THEN the system SHALL provide clearVisibility() method for all loaded tiles
4. WHEN a tile becomes visible THEN the system SHALL automatically mark it as explored
5. WHEN accessing tiles THEN visibility state SHALL persist until explicitly cleared

### Requirement 8

**User Story:** As a player, I want to board and unboard ships at ports and coastal areas, so that I can transition between land and sea exploration seamlessly.

#### Acceptance Criteria

1. WHEN at a port THEN the system SHALL provide coastal access with adjacent ocean tiles for ship boarding
2. WHEN on any coastal tile THEN the system SHALL allow embarking by creating ships in adjacent navigable ocean tiles
3. WHEN on a ship near land THEN the system SHALL allow disembarking onto adjacent walkable land tiles (preferring beach biomes)
4. WHEN validating ship placement THEN the system SHALL ensure ocean tiles have sufficient water neighbors (≥3) for navigation
5. WHEN transitioning between modes THEN the system SHALL support entity creation/removal for ship mechanics

### Requirement 9

**User Story:** As a developer, I want a robust and extensible map generation system, so that I can modify generation parameters and add new features without breaking existing functionality.

#### Acceptance Criteria

1. WHEN initializing the system THEN it SHALL provide clear constructor parameters for display dimensions
2. WHEN extending biomes THEN the system SHALL support adding new biome types through configuration objects
3. WHEN debugging generation THEN the system SHALL provide console logging for initialization and entity spawning
4. WHEN integrating with other systems THEN the system SHALL export MapGenerator class with documented public methods
5. WHEN handling errors THEN the system SHALL gracefully handle invalid coordinates and missing ROT.js library availability