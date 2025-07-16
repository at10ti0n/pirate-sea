# Pirate Sea - Roguelike Adventure

A browser-based pirate-themed roguelike game featuring procedural biome generation, ship mechanics, and treasure hunting.

## Features

- 🗺️ **Procedural Map Generation**: Biome-based terrain using simplex noise
- 🏴‍☠️ **Dual Movement Modes**: Walk on land or sail the seas
- ⛵ **Ship Mechanics**: Board and unboard ships to navigate oceans
- 💰 **Treasure Hunting**: Find all 6 treasures scattered across the map
- 🏘️ **Pirate Ports**: Visit 4 ports for supplies and stories
- 🌫️ **Fog of War**: Explore and discover the world around you
- 📱 **Touch Controls**: Full mobile support with on-screen controls
- ⌨️ **Keyboard Controls**: Classic roguelike keyboard navigation

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open your browser** and go to:
   ```
   http://localhost:3001
   ```

## Game Controls

### Keyboard Controls
- **Arrow Keys**: Move your character
- **B**: Board a nearby ship (when on land)
- **U**: Unboard ship onto nearby land (when on ship)

### Touch Controls
- **Direction Pad**: Move your character
- **Board Ship**: Appears when you're next to a ship
- **Unboard**: Appears when you're on a ship near land

## Game Mechanics

### Movement Modes
- **On Foot (@)**: Walk on land biomes (forest, beach, desert, etc.)
- **On Ship (⛵)**: Sail on ocean biomes

### Biomes
- **~ Ocean**: Navigable only by ship
- **. Beach**: Transition between land and sea
- **♠ Forest**: Common walkable terrain
- **# Jungle**: Dense walkable terrain
- **: Desert**: Arid walkable terrain
- **" Savanna**: Grassland walkable terrain
- **T Taiga**: Cold forest walkable terrain
- **t Tropical**: Hot walkable terrain
- **^ Mountain**: Impassable terrain
- **\* Snow**: Impassable cold terrain
- **% Swamp**: Impassable wetland

### Entities
- **S Ship**: Board to sail the oceans
- **P Port**: Visit for pirate tales
- **$ Treasure**: Collect all 6 to win!

### Objectives
- Explore the procedurally generated world
- Find and collect all 6 treasures
- Visit pirate ports for stories
- Master the art of sailing and walking

## Development

### File Structure
```
pirate-sea/
├── index.html          # Main HTML structure
├── styles.css          # Game styling and responsive design
├── game.js             # Main game loop and initialization
├── map.js              # Map generation and biome system
├── player.js           # Player movement and mode management
├── entities.js         # Entity management (ships, ports, treasure)
├── fog.js              # Fog of war implementation
├── ui.js               # UI controls and input handling
├── server.js           # Express server for local hosting
├── package.json        # Project configuration
└── README.md           # This file
```

### Alternative Running Methods

If you don't have Node.js installed:

**Using Python 3**:
```bash
python -m http.server 3001
```

**Using Python 2**:
```bash
python -m SimpleHTTPServer 3001
```

**Using live-server**:
```bash
npx live-server --port=3001
```

## Technical Details

- **Framework**: Vanilla JavaScript with rot.js library
- **Map Generation**: Simplex noise for elevation, moisture, and temperature
- **Rendering**: rot.js Display with ASCII characters
- **FOV**: rot.js PreciseShadowcasting algorithm
- **Responsive Design**: Mobile-first CSS with touch controls
- **Server**: Express.js for local development

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Contributing

This is a single-file implementation focused on learning roguelike development. Feel free to fork and experiment!

## License

MIT License - Feel free to use and modify as needed.

---

**Ahoy, matey! Set sail and find those treasures! 🏴‍☠️**