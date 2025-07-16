# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Running the Game
- `npm start` or `npm run web` - Start web server on port 5000 (configured for Oracle Cloud)
- `npm run terminal` or `npm run play` - Play game directly in terminal
- `npm run dev` - Start web server with nodemon for development

### Installation
- `npm install` - Install dependencies (express, rot-js, nodemon)

## Code Architecture

### Game Modes
The game supports two distinct play modes:
1. **Web Browser Mode** - Full-featured game with HTML/CSS UI and ROT.js display
2. **Terminal Mode** - ASCII version playable directly in terminal with ANSI colors

### Core System Architecture

#### Map Generation (`map.js`)
- **Infinite World System**: Uses sparse `Map` storage instead of fixed arrays
- **Procedural Generation**: Multiple noise layers (continent, island, atoll, chains) create 80% water coverage
- **Minimum Landmass Size**: Automatically converts landmasses smaller than 9 tiles to ocean
- **Biome Determination**: Elevation, moisture, and temperature determine biome types
- **Camera System**: Follows player with `updateCamera()` and `getVisibleTiles()`

#### Entity Management (`entities.js`)
- **Spatial Lookup**: Uses `Map` with `"x,y"` string keys for O(1) entity access
- **Interactive Ports**: Spawn ships when visited, track availability
- **Entity Spawning**: Balanced for 80% water world (15 ports, 30 treasure, 20 ships)
- **Coastal Ship Placement**: `findNearbyOceanTiles()` prioritizes navigable water

#### Player System (`player.js`)
- **Dual Mode System**: 'foot' and 'ship' modes with different movement rules
- **Embark/Disembark**: Complex logic for boarding ships and coastal embarking
- **Movement Validation**: Different walkability rules per mode
- **Spawn Logic**: Finds suitable land tiles in expanding radius

#### Fog of War (`fog.js`)
- **ROT.js Integration**: Uses PreciseShadowcasting FOV algorithm
- **Visibility States**: 'visible', 'explored', 'hidden' with brightness modifiers
- **Entity Rendering**: Only renders entities in visible/explored areas

#### UI Management (`ui.js`)
- **Dual Control System**: Keyboard and touch controls with overlay system
- **Context-Aware Buttons**: Board/unboard buttons appear based on player state
- **ROT.js Display**: 48x28 character display with color management
- **Touch Optimization**: Transparent overlay controls for mobile

### Key Technical Patterns

#### Infinite World Generation
- Map tiles generated on-demand via `generateChunkAt(x, y)`
- Camera system tracks player and loads visible area
- Sparse storage prevents memory issues with large worlds

#### Mode-Based Movement
- Player movement validation changes based on foot/ship mode
- Different biomes have different walkability for each mode
- Ship mechanics involve entity creation/removal

#### Noise-Based Terrain
- Multiple noise scales create realistic landmass distribution
- Elevation thresholds determine water vs land
- Moisture and temperature create biome variety

#### Entity Interaction System
- Position-based entity lookup for interactions
- Different interaction rules per player mode
- Dynamic entity spawning (ports spawn ships)

### Development Notes

#### World Generation Tuning
- Water coverage set to 80% (adjustable via biome thresholds in `determineBiome()`)
- Landmass size minimum prevents tiny unusable islands
- Multiple noise layers create natural-looking archipelagos

#### Mobile Optimization
- Touch controls overlay directly on game map
- Transparent buttons minimize screen real estate usage
- Responsive design works on iOS Safari and Android

#### Server Configuration
- Express server binds to '0.0.0.0' for external access
- Configured for Oracle Cloud deployment on port 5000
- Static file serving from project root