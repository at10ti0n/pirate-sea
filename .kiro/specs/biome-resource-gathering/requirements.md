# Biome Resource Gathering System - Requirements Document

## Introduction

This feature adds a resource gathering system where players can collect biome-specific resources from different terrain types. Each biome will offer unique resources that can be gathered through player interaction, creating opportunities for crafting, trading, and survival mechanics.

## Requirements

### Requirement 1: Biome Resource Definition

**User Story:** As a player, I want different biomes to contain specific harvestable resources, so that I can gather materials for crafting and survival.

#### Acceptance Criteria

1. WHEN the player is on a forest biome THEN the system SHALL offer wood and berries as gatherable resources
2. WHEN the player is on a desert biome THEN the system SHALL offer stone and sand as gatherable resources  
3. WHEN the player is on a mountain biome THEN the system SHALL offer stone and ore as gatherable resources
4. WHEN the player is on a beach biome THEN the system SHALL offer wood and sand as gatherable resources
5. WHEN the player is on a jungle biome THEN the system SHALL offer wood and berries as gatherable resources
6. WHEN the player is on a savanna biome THEN the system SHALL offer hay and wood as gatherable resources
7. WHEN the player is on a taiga biome THEN the system SHALL offer wood and berries as gatherable resources
8. WHEN the player is on a tropical biome THEN the system SHALL offer wood and berries as gatherable resources
9. WHEN the player is on a swamp biome THEN the system SHALL offer reeds and berries as gatherable resources

### Requirement 2: Resource Gathering Mechanics

**User Story:** As a player, I want to actively gather resources from biomes, so that I can collect materials through gameplay interaction.

#### Acceptance Criteria

1. WHEN the player presses the gather key (G) on a resource-bearing biome THEN the system SHALL attempt to gather resources from that location
2. WHEN a gather attempt is successful THEN the system SHALL add the gathered resource to the player's inventory
3. WHEN a gather attempt is successful THEN the system SHALL display a message indicating what was gathered
4. WHEN a biome has no gatherable resources THEN the system SHALL display "Nothing to gather here"
5. WHEN the player is on a ship THEN the system SHALL prevent resource gathering and display "Cannot gather resources while on ship"

### Requirement 3: Resource Availability and Depletion

**User Story:** As a player, I want resource gathering to have realistic limitations, so that the game maintains balance and encourages exploration.

#### Acceptance Criteria

1. WHEN a player gathers from a location THEN the system SHALL have a chance-based success rate for finding resources
2. WHEN a location has been recently gathered from THEN the system SHALL reduce the success rate for subsequent gathering attempts
3. WHEN a location has been heavily depleted THEN the system SHALL require a cooldown period before resources regenerate
4. WHEN sufficient time has passed THEN the system SHALL restore resource availability to normal levels
5. WHEN calculating gather success THEN the system SHALL use biome-specific base success rates

### Requirement 4: Player Inventory System

**User Story:** As a player, I want to store and manage gathered resources, so that I can accumulate materials for future use.

#### Acceptance Criteria

1. WHEN the player gathers a resource THEN the system SHALL add it to the player's inventory with appropriate quantity
2. WHEN the player opens their inventory THEN the system SHALL display all gathered resources with quantities
3. WHEN the player has multiple of the same resource THEN the system SHALL stack them and show the total count
4. WHEN the player's inventory reaches capacity THEN the system SHALL prevent further gathering until space is available
5. WHEN displaying inventory THEN the system SHALL show resource names, quantities, and brief descriptions

### Requirement 5: Resource Information and Feedback

**User Story:** As a player, I want clear information about available resources and gathering results, so that I can make informed decisions about where to gather.

#### Acceptance Criteria

1. WHEN the player examines a biome THEN the system SHALL display what types of resources are potentially available
2. WHEN a gather attempt fails THEN the system SHALL provide feedback about why (depleted, bad luck, etc.)
3. WHEN the player gathers a resource THEN the system SHALL display the resource name and quantity obtained
4. WHEN the player is in a biome with no resources THEN the system SHALL clearly indicate this
5. WHEN displaying resource information THEN the system SHALL use consistent naming and descriptions

### Requirement 6: Resource Visual Representation

**User Story:** As a player, I want to see visual indicators of resources within biomes, so that I can identify resource-rich areas and plan my gathering strategy.

#### Acceptance Criteria

1. WHEN a biome tile contains gatherable resources THEN the system SHALL display resource-specific glyphs mixed within the biome
2. WHEN displaying forest biomes THEN the system SHALL show wood glyphs (🌲, 🪵) and berry glyphs (🫐, 🍓) based on resource distribution
3. WHEN displaying desert biomes THEN the system SHALL show stone glyphs (🪨, ⛰️) and sand glyphs (🏜️, ⏳) based on resource distribution
4. WHEN displaying mountain biomes THEN the system SHALL show stone glyphs (🪨, ⛰️) and ore glyphs (⚒️, 💎) based on resource distribution
5. WHEN displaying beach biomes THEN the system SHALL show driftwood glyphs (🪵, 🌴) and sand glyphs (🏖️, ⏳) based on resource distribution
6. WHEN displaying jungle biomes THEN the system SHALL show tropical wood glyphs (🌴, 🎋) and exotic berry glyphs (🥥, 🍌) based on resource distribution
7. WHEN displaying savanna biomes THEN the system SHALL show hay glyphs (🌾, 🌿) and scattered wood glyphs (🌳, 🪵) based on resource distribution
8. WHEN displaying taiga biomes THEN the system SHALL show coniferous wood glyphs (🌲, 🌲) and cold berry glyphs (🫐, 🍇) based on resource distribution
9. WHEN displaying tropical biomes THEN the system SHALL show bamboo glyphs (🎋, 🌴) and tropical fruit glyphs (🥭, 🍍) based on resource distribution
10. WHEN displaying swamp biomes THEN the system SHALL show reed glyphs (🌾, 🪴) and bog berry glyphs (🫐, 🍄) based on resource distribution
11. WHEN calculating glyph distribution THEN the system SHALL use resource weight percentages to determine visual representation frequency
12. WHEN a tile has been recently gathered THEN the system SHALL temporarily show depleted variants of resource glyphs

### Requirement 7: Cross-Platform Compatibility

**User Story:** As a player, I want the resource gathering system to work consistently across web and terminal versions, so that I have the same experience regardless of platform.

#### Acceptance Criteria

1. WHEN playing the web version THEN the system SHALL support resource gathering with keyboard and touch controls
2. WHEN playing the terminal version THEN the system SHALL support resource gathering with keyboard controls and ASCII resource symbols
3. WHEN switching between platforms THEN the system SHALL maintain consistent resource types and gathering mechanics
4. WHEN displaying resources THEN the system SHALL use appropriate symbols/icons for each platform (emoji for web, ASCII for terminal)
5. WHEN gathering resources THEN the system SHALL provide equivalent feedback across both platforms
6. WHEN displaying resource glyphs in terminal THEN the system SHALL use ASCII characters (W for wood, S for stone, B for berries, etc.)
7. WHEN displaying resource glyphs on web THEN the system SHALL use emoji symbols for visual appeal

### Requirement 8: Integration with Existing Systems

**User Story:** As a player, I want resource gathering to integrate seamlessly with existing game mechanics, so that it feels like a natural part of the game.

#### Acceptance Criteria

1. WHEN the player is exploring THEN the system SHALL not interfere with existing movement and ship mechanics
2. WHEN the player boards/unboards ships THEN the system SHALL maintain inventory state
3. WHEN the game uses seeded generation THEN the system SHALL ensure resource availability is deterministic
4. WHEN the player moves between biomes THEN the system SHALL update available resources accordingly
5. WHEN displaying the game UI THEN the system SHALL integrate resource information without cluttering the interface