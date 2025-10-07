# Implementation Plan

- [x] 1. Add fog of war import and initialization to terminal game
  - Import the FogOfWar class from fog.js into terminal-game.js
  - Add fogOfWar property to TerminalGame constructor
  - Initialize fog of war instance in the initialize() method with error handling
  - _Requirements: 1.1, 4.1_

- [x] 2. Extend TerminalMapGenerator with visibility management methods
  - Add clearVisibility() method to clear visibility state for all loaded tiles
  - Add setVisibility() method to set visibility state for specific coordinates
  - Add getTileVisibility() method to query visibility state of tiles
  - Ensure visibility state persists correctly with explored flag when tiles lose visibility
  - _Requirements: 1.2, 1.4_

- [x] 3. Update fog of war on player movement and mode changes
  - Call fogOfWar.updateVisibility() in handleKeyPress() after successful player movement
  - Update fog of war when player boards or disembarks from ship
  - Add error handling for fog of war updates to prevent game crashes
  - _Requirements: 1.2, 4.1_

- [x] 4. Modify rendering pipeline to respect fog of war visibility
  - Update render() method to call fog of war update before rendering
  - Filter tile rendering based on shouldRenderTile() from fog of war
  - Apply visibility modifiers for dimming explored but not currently visible tiles
  - Render hidden tiles as empty spaces
  - _Requirements: 1.1, 1.3, 5.1, 5.2, 5.3_

- [x] 5. Implement entity visibility filtering
  - Modify entity rendering loop to check shouldRenderEntity() from fog of war
  - Skip rendering entities that are not in currently visible tiles
  - Ensure player is always rendered regardless of fog of war state
  - _Requirements: 3.1, 3.2, 3.3, 5.4_

- [x] 6. Add visual feedback for different visibility states
  - Implement dimming for explored but not visible tiles using terminal color codes
  - Ensure visible tiles render at full brightness with normal colors
  - Test visibility modifier application for proper contrast between states
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Integrate fog of war with resource gathering and examination
  - Ensure resource gathering works correctly with fog of war active
  - Verify examination functionality respects visibility constraints
  - Test that fog of war doesn't interfere with inventory operations
  - _Requirements: 4.2, 4.3_

- [x] 8. Add graceful degradation for fog of war failures
  - Implement try-catch blocks around fog of war operations
  - Ensure game continues normally if fog of war fails to initialize
  - Add console warnings for fog of war errors without breaking gameplay
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9. Test fog of war integration with terminal game mechanics
  - Create test to verify circular visibility area around player
  - Test line-of-sight blocking by mountains and snow tiles
  - Verify fog of war updates correctly on player movement
  - Test entity visibility changes as player explores
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1_

- [x] 10. Verify cross-platform terminal compatibility
  - Test fog of war rendering on different terminal types
  - Ensure color codes work correctly for visibility states
  - Verify performance is acceptable on various terminal environments
  - _Requirements: 5.1, 5.2, 5.3_