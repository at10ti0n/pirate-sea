# Biome Resource Gathering System - Implementation Tasks

## Task Overview

Convert the biome resource gathering design into a series of implementation steps that build incrementally toward a complete resource collection system.

## Implementation Tasks

- [x] 1. Create core resource system foundation
  - Implement ResourceManager class with basic structure
  - Define resource data models and interfaces
  - Create BiomeResourceConfig with all biome-resource mappings
  - Set up resource type definitions with properties (name, description, rarity, etc.)
  - Define resource glyph mappings for web and terminal versions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 2. Implement PlayerInventory system
  - Create PlayerInventory class with add/remove/query methods
  - Implement resource stacking and quantity management
  - Add inventory capacity limits and space checking
  - Create inventory serialization for save/load functionality
  - Write unit tests for inventory operations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Implement visual glyph system
  - Create tile glyph selection algorithm using seeded random
  - Implement glyph distribution percentages for each biome
  - Add position-based deterministic glyph generation
  - Create glyph-to-resource mapping for gathering bonuses
  - Update map rendering to display resource glyphs instead of plain biome tiles
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12_

- [x] 4. Build gathering mechanics core logic
  - Implement attemptGather method with success rate calculations
  - Create biome resource lookup and selection logic
  - Add seeded random integration for deterministic gathering
  - Implement resource gathering bias based on tile glyphs
  - Write unit tests for gathering probability calculations
  - _Requirements: 2.1, 2.2, 2.3, 7.3_

- [x] 5. Add resource depletion and regeneration system
  - Create location state tracking for gathering history
  - Implement depletion calculation based on gathering frequency
  - Add time-based regeneration mechanics
  - Create cleanup system for old location data
  - Write tests for depletion and regeneration logic
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Integrate gathering controls and input handling
  - Add 'G' key binding for gathering in both web and terminal versions
  - Implement gathering prevention while on ship
  - Add gathering attempt validation (valid biome, not on water, etc.)
  - Create gathering feedback message system
  - Test cross-platform input consistency
  - _Requirements: 2.1, 2.4, 2.5, 6.1, 6.2, 6.3_

- [x] 7. Implement depleted tile visual states
  - Add depleted glyph variants for all resource types (dimmed colors, different characters)
  - Modify generateResourceGlyph method to check location depletion state
  - Implement depleted state detection in both web and terminal versions
  - Create visual distinction between normal, partially depleted, and fully depleted tiles
  - Test depleted state visualization across all biome types
  - _Requirements: 6.12_

- [ ] 8. Create inventory UI components
  - Design and implement inventory display for web version
  - Create terminal-based inventory display
  - Add inventory toggle key binding ('I' key)
  - Implement resource icons/symbols for both platforms
  - Create inventory capacity indicator
  - _Requirements: 4.2, 4.5, 6.1, 6.2, 6.4_

- [ ] 9. Add resource information and examination system
  - Implement biome resource preview when examining terrain
  - Create resource description and information display
  - Add gathering success rate hints based on location state
  - Implement resource rarity and value indicators
  - Create help system for resource gathering mechanics
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10. Enhance UI integration and feedback
  - Add gathering attempt feedback messages
  - Create resource gathering animation/effects (web version)
  - Implement inventory full warnings
  - Add resource gathering statistics tracking
  - Create gathering tutorial/help text
  - _Requirements: 5.1, 5.2, 5.3, 6.5, 7.5_

- [ ] 11. Implement cross-platform consistency
  - Ensure identical resource types and quantities across platforms
  - Standardize gathering mechanics between web and terminal
  - Create platform-specific resource display symbols
  - Test seeded determinism across both versions
  - Validate UI consistency and usability
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 12. Add system integration and polish
  - Integrate resource system with existing game state management
  - Ensure compatibility with ship boarding/unboarding
  - Add resource system to game save/load functionality
  - Create resource gathering performance optimizations
  - Implement error handling and edge case management
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [ ] 13. Create comprehensive testing suite
  - Write unit tests for all ResourceManager methods
  - Create integration tests for gathering workflow
  - Test inventory management under various conditions
  - Validate biome-resource mapping accuracy
  - Test performance with large inventories and many locations
  - _Requirements: All requirements validation_

- [ ] 14. Add documentation and examples
  - Create player guide for resource gathering mechanics
  - Document resource types and their uses
  - Add developer documentation for extending the system
  - Create example gathering scenarios and strategies
  - Update game help system with resource information
  - _Requirements: 5.5, 6.5_

## Testing Priorities

### Critical Path Testing
1. Basic gathering functionality (gather resources from biomes)
2. Inventory management (add, remove, display resources)
3. Cross-platform consistency (web and terminal versions work identically)
4. Integration with existing systems (doesn't break movement/ship mechanics)

### Performance Testing
1. Large inventory handling (100+ different resource types)
2. Many location states (1000+ previously gathered locations)
3. Rapid gathering attempts (spam prevention and rate limiting)
4. Memory usage with extended gameplay sessions

### Edge Case Testing
1. Gathering from invalid biomes (ocean, etc.)
2. Inventory overflow scenarios
3. Negative resource quantities
4. Corrupted save data recovery
5. Concurrent gathering attempts

## Implementation Notes

- **Incremental Development**: Each task builds on previous tasks and can be tested independently
- **Cross-Platform Priority**: Ensure web and terminal versions stay in sync throughout development
- **Performance Focus**: Consider memory and CPU usage from the start, especially for location tracking
- **Extensibility**: Design system to easily add new resources, biomes, and mechanics
- **User Experience**: Prioritize clear feedback and intuitive controls throughout implementation