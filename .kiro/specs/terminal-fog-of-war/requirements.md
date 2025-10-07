# Requirements Document

## Introduction

The terminal version of the pirate roguelike game currently lacks fog of war functionality, despite having a fog of war system available in `fog.js`. Players can see the entire map without any visibility restrictions, which reduces the exploration and discovery aspects of the game. This feature will integrate the existing fog of war system into the terminal game to provide proper line-of-sight mechanics and exploration gameplay.

## Requirements

### Requirement 1

**User Story:** As a player, I want to only see areas within my line of sight, so that exploration feels more immersive and strategic.

#### Acceptance Criteria

1. WHEN the game starts THEN the player SHALL only see tiles within their view radius
2. WHEN the player moves THEN the fog of war SHALL update to reveal new areas within line of sight
3. WHEN tiles are no longer in line of sight THEN they SHALL remain visible but dimmed to show they were previously explored
4. WHEN tiles have never been seen THEN they SHALL be completely hidden from view

### Requirement 2

**User Story:** As a player, I want line of sight to be blocked by terrain features like mountains, so that tactical positioning matters.

#### Acceptance Criteria

1. WHEN there are mountains or snow tiles between the player and a target tile THEN the target tile SHALL be hidden from view
2. WHEN the player moves to a position with clear line of sight THEN previously blocked tiles SHALL become visible
3. WHEN calculating line of sight THEN the system SHALL use the existing `lightPassesCallback` logic from the fog of war system

### Requirement 3

**User Story:** As a player, I want entities (ships, treasures) to only be visible when in my line of sight, so that discovery feels rewarding.

#### Acceptance Criteria

1. WHEN entities are in visible tiles THEN they SHALL be rendered normally
2. WHEN entities are in explored but not currently visible tiles THEN they SHALL NOT be rendered
3. WHEN entities are in hidden tiles THEN they SHALL NOT be rendered
4. WHEN the player moves and reveals new areas THEN any entities in those areas SHALL become visible

### Requirement 4

**User Story:** As a player, I want the fog of war to work consistently with the existing terminal game mechanics, so that gameplay remains smooth.

#### Acceptance Criteria

1. WHEN the player boards or disembarks from a ship THEN the fog of war SHALL update from the new position
2. WHEN gathering resources THEN the visibility system SHALL not interfere with resource gathering mechanics
3. WHEN examining locations THEN the player SHALL only be able to examine visible tiles
4. WHEN the inventory is toggled THEN the fog of war display SHALL remain consistent

### Requirement 5

**User Story:** As a player, I want visual feedback to distinguish between visible, explored, and hidden areas, so that I can understand what I can and cannot see.

#### Acceptance Criteria

1. WHEN tiles are currently visible THEN they SHALL be rendered at full brightness with normal colors
2. WHEN tiles are explored but not currently visible THEN they SHALL be rendered dimmed or with reduced contrast
3. WHEN tiles are hidden THEN they SHALL not be rendered at all
4. WHEN the player position is rendered THEN it SHALL always be visible regardless of fog of war state