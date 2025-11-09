# Shared Modules Refactoring Plan

## Goal
Eliminate code duplication between web game and terminal game by using shared modules for core game logic.

## Current Status

### ✅ Phase 1: Completed
- **TerminalDisplayAdapter** created (`terminal-display-adapter.js`)
  - Converts hex colors to ANSI terminal colors
  - Provides methods for converting biomes, entities, and text
  - Enables code sharing while maintaining different display formats

- **SeededRandom** deduplicated
  - Removed 45-line duplicate from `terminal-game.js`
  - Now imports from shared `seeded-random.js`
  - Both games use identical random number generation

### 📋 Phase 2: Map Generator (Pending)

**Current State:**
- Web uses: `MapGenerator` from `map.js` (677 lines)
- Terminal uses: `TerminalMapGenerator` in `terminal-game.js` (lines 18-409, ~390 lines)

**Duplicate Methods:** ~95% similar
- `constructor`, `initializeBiomes`, `generateMap`, `getBiomeAt`
- `determineBiome`, `getLandmassSize`, `analyzeLandmass`
- `isWalkable`, `getVisibleTiles`, `updateCamera`

**Key Differences:**
- Colors: Web uses hex `#2980b9`, Terminal uses ANSI `\x1b[34m`
- `TerminalMapGenerator` has `convertColorToTerminal()` method
- **Solution**: Use `TerminalDisplayAdapter.convertBiomes()` after initialization

**Implementation:**
```javascript
// In terminal-game.js
const MapGenerator = require('./map');
const displayAdapter = new TerminalDisplayAdapter();

// Initialize map generator
this.mapGenerator = new MapGenerator(60, 20, seed);

// Convert biomes for terminal display
this.mapGenerator.biomes = displayAdapter.convertBiomes(this.mapGenerator.biomes);
```

**Files to Change:**
- `terminal-game.js`: Import `MapGenerator`, remove `TerminalMapGenerator` class
- Lines to remove: ~390 lines (18-409)

### 📋 Phase 3: Player Class (Pending)

**Current State:**
- Web uses: `Player` from `player.js` (520 lines)
- Terminal uses: `TerminalPlayer` in `terminal-game.js` (lines 410-652, ~240 lines)

**Current Differences:**
- `player.js` has full food system, hunger, health, cooking, provisions
- `TerminalPlayer` has the same features (we added them earlier)
- **They're now identical!**

**Implementation:**
```javascript
// In terminal-game.js
const Player = require('./player');

// Just use it directly
this.player = new Player(this.mapGenerator);
```

**Files to Change:**
- `terminal-game.js`: Import `Player`, remove `TerminalPlayer` class
- Lines to remove: ~240 lines (410-652)

### 📋 Phase 4: Entity Manager (Pending) - **MOST IMPORTANT**

**Current State:**
- Web uses: `EntityManager` from `entities.js` (620 lines)
  - ✅ Has **island-aware port spawning**
  - ✅ Spawns ports based on island size
  - ✅ Uses flood-fill to discover islands
  - ✅ Procedural port names

- Terminal uses: `TerminalEntityManager` in `terminal-game.js` (lines 653-969, ~315 lines)
  - ❌ Uses old **chunk-based spawning**
  - ❌ No island awareness
  - ❌ Inconsistent port distribution

**Island-Aware Spawning Benefits:**
- Tiny islands (< 10 tiles): 0 ports
- Small islands (10-30 tiles): 1 port
- Medium islands (30-80 tiles): 1-2 ports
- Large islands (80-150 tiles): 2-4 ports
- Huge islands (150-300 tiles): 3-6 ports
- Massive islands (> 300 tiles): 5-8 ports

**Key Methods in EntityManager (entities.js):**
- `spawnPorts()` - Island-aware spawning
- `discoverIsland()` - Flood-fill island discovery
- `getPortCountForIsland()` - Size-based port count
- `spawnPortsOnIsland()` - Distribute ports on coastline
- `findCoastalTiles()` - Find land adjacent to ocean
- `distributePortsAlongCoast()` - Evenly space ports

**Implementation:**
```javascript
// In terminal-game.js
const EntityManager = require('./entities');
const displayAdapter = new TerminalDisplayAdapter();

// Initialize with display adapter
this.entityManager = new EntityManager(this.mapGenerator, this.economyManager);

// Convert entity type colors for terminal
for (const [key, entityType] of Object.entries(this.entityManager.entityTypes)) {
    this.entityManager.entityTypes[key] = displayAdapter.convertEntityType(entityType);
}

// Entities will automatically use island-aware spawning!
```

**Files to Change:**
- `terminal-game.js`: Import `EntityManager`, remove `TerminalEntityManager` class
- Lines to remove: ~315 lines (653-969)
- Remove chunk-based spawning methods: `generatePortsInChunk`, `updateNearbyChunks`

### 📊 Impact Summary

| Module | Before | After | Savings | Status |
|--------|--------|-------|---------|--------|
| SeededRandom | 2 copies (60 lines each) | 1 shared (85 lines) | 35 lines | ✅ Done |
| MapGenerator | 2 copies (~677 + 390 lines) | 1 shared (677 lines) | 390 lines | ⏳ Pending |
| Player | 2 copies (~520 + 240 lines) | 1 shared (520 lines) | 240 lines | ⏳ Pending |
| EntityManager | 2 copies (~620 + 315 lines) | 1 shared (620 lines) | 315 lines | ⏳ Pending |
| **Total** | **~2882 duplicate lines** | **~1902 shared lines** | **~980 lines** | **34% reduction** |

### 🎯 Benefits

1. **Code Maintainability**
   - Fix bugs once, applies to both games
   - Add features once, works everywhere
   - Easier to understand codebase

2. **Consistency**
   - Same game mechanics in web and terminal
   - Island-aware port spawning in both
   - Identical food/hunger/cooking systems

3. **Island-Aware Spawning**
   - Terminal game gets proper port distribution
   - Ports spawn based on actual island geography
   - No more empty worlds or overcrowded tiny islands

4. **Testing**
   - Test shared logic once
   - Fewer places for bugs to hide
   - Easier to add new features

### 🚀 Next Steps

1. **Phase 2**: Replace `TerminalMapGenerator` with shared `MapGenerator`
2. **Phase 3**: Replace `TerminalPlayer` with shared `Player`
3. **Phase 4**: Replace `TerminalEntityManager` with shared `EntityManager`
4. **Testing**: Verify both games work identically
5. **Documentation**: Update README with module architecture

### 📁 Module Structure (After Refactoring)

```
pirate-sea/
├── Core Modules (Shared)
│   ├── seeded-random.js ✅
│   ├── map.js
│   ├── player.js
│   ├── entities.js
│   ├── economy.js
│   ├── weather.js
│   ├── fog.js
│   ├── food-system.js ✅
│   ├── ship-provisions.js ✅
│   ├── nameGenerator.js ✅
│   ├── resource-manager.js
│   └── player-inventory.js
│
├── Display Adapters
│   └── terminal-display-adapter.js ✅
│
├── Game Runners
│   ├── game.js (Web UI + ROT.js display)
│   └── terminal-game.js (Terminal ANSI display)
│
└── Web Assets
    ├── index.html
    ├── ui.js
    └── styles.css
```

### ⚠️ Considerations

1. **Color Handling**: Display adapter handles all color conversions
2. **Display Differences**: Only rendering code stays separate
3. **ROT.js**: Both games use it (web for display, terminal for noise)
4. **Node.js Exports**: All modules support both browser and Node.js
5. **Backwards Compatibility**: Existing save files should still work

### 🧪 Testing Plan

After each phase:
1. Run `npm run terminal` - Verify terminal game works
2. Run `npm start` - Verify web game works
3. Test specific features:
   - Map generation and biomes
   - Port spawning and island distribution
   - Player movement and mode switching
   - Food system and cooking
   - Combat and ship durability
   - Trading and economy

### 📝 Notes

- All shared modules use `if (typeof module !== 'undefined')` for dual export
- TerminalDisplayAdapter is terminal-specific and stays separate
- Game runners (game.js, terminal-game.js) stay separate for different UIs
- All game logic moves to shared modules
