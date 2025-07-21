# Pirate Sea - Seed System

The Pirate Sea game now supports deterministic world generation using seeds. This allows you to generate the same world layout every time by using the same seed value.

## How Seeds Work

Seeds are numeric values that control all random generation in the game:
- **Map generation**: Biome placement, island shapes, and terrain features
- **Entity spawning**: Location of ports, treasures, and ships
- **Random events**: Any procedural content uses the seed

## Using Seeds

### Web Version

1. **View Current Seed**: The current seed is displayed in the "World Seed" section
2. **Generate New World**: 
   - Enter a seed number in the input field (optional)
   - Click "Generate World" to create a new world
   - Leave empty to generate a random seed
3. **Copy Seed**: Click "Copy Seed" to copy the current seed to clipboard
4. **Share Seeds**: Share seed numbers with friends to play the same world

### Terminal Version

#### Run with Random Seed
```bash
npm run terminal
# or
node terminal-game.js
```

#### Run with Specific Seed
```bash
npm run terminal -- --seed 123456
# or
node terminal-game.js --seed 123456
```

#### Examples
```bash
# Generate world with seed 42
npm run terminal -- --seed 42

# Generate world with seed 999999
npm run terminal -- --seed 999999

# Random seed (default)
npm run terminal
```

## Seed Examples

Here are some interesting seeds to try:

- **Seed 12345**: Large central continent with scattered islands
- **Seed 42**: Classic archipelago layout with many small islands
- **Seed 777**: Balanced mix of land and water with good port distribution
- **Seed 100000**: Mostly ocean world with rare large landmasses
- **Seed 555555**: Dense island chains perfect for ship exploration

## Technical Details

- **Seed Range**: Any integer value (positive or negative)
- **Deterministic**: Same seed always generates identical worlds
- **Cross-Platform**: Seeds work the same in web and terminal versions
- **Regeneration**: Changing seed clears current world and generates new one

## Sharing Worlds

To share a world with someone:

1. Copy your current seed (using Copy Seed button or from terminal output)
2. Share the seed number
3. They can enter the seed and generate the same world
4. All islands, ports, treasures, and ships will be in identical locations

## Development

The seed system uses a Linear Congruential Generator (LCG) for deterministic random numbers:
- **Seeded Random Class**: `SeededRandom` provides consistent random generation
- **Noise Seeding**: ROT.js noise generators are seeded when possible
- **Entity Placement**: All entity spawning uses seeded random numbers
- **Position-Based**: Some randomness is tied to world coordinates for consistency

This ensures that the same seed will always produce the same world, regardless of when or where it's generated.