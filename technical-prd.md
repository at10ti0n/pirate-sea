# Technical Product Requirements Document (PRD)
## Pirate Roguelike Biome Map with Ships, Boarding, and Touch Controls

### Goal

Implement a browser-based roguelike game with:
• Procedural biome-based map generation
• Player movement and fog of war
• Entities: ships, ports, treasure
• Boarding/unboarding ships mechanic
• Keyboard and touchscreen controls
• Local development server on port 3001

**Deliverable:** A modular web application with separate HTML, CSS, and JavaScript files for better maintainability and organization, plus local hosting setup.

---

## File Structure

### Core Files
• **index.html** - Main HTML structure and game container
• **styles.css** - All game styling, responsive design, and visual themes
• **game.js** - Main game logic and initialization
• **map.js** - Map generation, biome logic, and terrain rendering
• **player.js** - Player movement, state management, and mode switching
• **entities.js** - Entity management (ships, ports, treasure)
• **ui.js** - UI controls, touch interface, and responsive elements
• **fog.js** - Fog of war implementation using rot.js FOV

### Development Files
• **package.json** - Dependencies and scripts for local development
• **server.js** - Simple Express server for local hosting
• **README.md** - Setup and running instructions

### Dependencies
• **rot.js** - External library for display, FOV, and noise functions (CDN or local)
• **express** - Local development server
• **live-server** - Alternative lightweight server option

---

## Local Development Setup

### Installation & Running
• **Install dependencies:**
  ```bash
  npm install
  ```
• **Start development server:**
  ```bash
  npm start
  ```
  - Runs on http://localhost:3001
  - Serves static files from project root
  - Auto-refreshes on file changes (if using live-server)

### Alternative Running Methods
• **Using Node.js/Express:**
  ```bash
  node server.js
  ```
• **Using Python (if Node.js not available):**
  ```bash
  python -m http.server 3001
  ```
• **Using live-server:**
  ```bash
  npx live-server --port=3001
  ```

### Package.json Scripts
• **"start"** - Start development server on port 3001
• **"dev"** - Start with live reload
• **"build"** - Optional build step for production (if needed)

---

## Functional Requirements

### 1. Map Generation (map.js)
• Generate a 2D grid map with dimensions (default: 48 columns x 28 rows)
• For each cell, generate three values using simplex/perlin noise:
  - elevation (float [0,1])
  - moisture (float [0,1])
  - temperature (float [0,1])
• Assign a biome per cell by evaluating:
  - If elevation < 0.3: "ocean"
  - Else if elevation < 0.32: "beach"
  - Else if elevation > 0.85: If temperature < 0.4, "snow", else "mountain"
  - Else if moisture < 0.22: If temperature > 0.68, "desert", else "savanna"
  - Else if moisture > 0.8: If temperature > 0.7, "jungle", else "swamp"
  - Else if temperature < 0.27: "taiga"
  - Else if temperature > 0.75: "tropical"
  - Else: "forest"
• Assign each biome a character and color for display
• Export biome configuration and map generation functions

### 2. Entities (entities.js)
• **Ports ("P")**
  - Place 4 ports on random walkable land tiles (excluding ocean, mountain, swamp)
  - No two entities occupy the same tile
• **Treasure ("$")**
  - Place 6 treasure on random walkable land tiles (as above)
• **Ships ("S")**
  - Place 5 ships on random ocean tiles
• Entities stored in a lookup structure keyed by position
• Export entity management functions (spawn, remove, interact)

### 3. Player (player.js)
• **Initial state:**
  - Placed on a random walkable land tile (not ocean, mountain, swamp)
  - Player symbol is "@" (on land), "⛵" (on ship)
• **Two possible modes:**
  - "foot" (default, can walk on walkable land biomes)
  - "ship" (after boarding, can move on ocean biomes)
• **Player state variables:**
  - position: [x, y]
  - mode: "foot" or "ship"
• Export player state management and movement validation functions

### 4. Movement (player.js)
• Movement allowed using arrow keys or on-screen touch buttons
• **When "foot":**
  - Can move to adjacent (orthogonal) walkable land biomes (not ocean or mountain)
  - If standing next to a ship entity, show "Board" action
• **When "ship":**
  - Can move to adjacent ocean biomes
  - If adjacent to walkable land, show "Unboard" action

### 5. Boarding/Unboarding (player.js)
• **Boarding:**
  - Player on land, adjacent (orthogonally) to a ship tile
  - When "Board" command issued (keyboard: "b", touch: action button):
    - Player mode becomes "ship"
    - Player icon changes to "⛵"
    - Player position becomes that of the ship tile
    - Remove ship entity from map
• **Unboarding:**
  - Player in "ship" mode, adjacent to a walkable land tile
  - When "Unboard" command issued (keyboard: "u", touch: action button):
    - Player mode becomes "foot"
    - Player icon changes to "@"
    - Player moves onto chosen adjacent walkable land tile
    - Create ship entity at previous player position (now on ocean)

### 6. Interactions (entities.js)
• **Treasure:**
  - Moving onto a tile with treasure removes the treasure entity and displays a message ("You found treasure!")
• **Port:**
  - Moving onto a port tile displays a message ("You visit a pirate port!")
• Treasure and port collection only possible in "foot" mode

### 7. Fog of War (fog.js)
• Implement using rot.js FOV:
  - Player can see up to radius 7 tiles from their position
  - Tiles previously seen but not currently visible are dimmed
  - Unexplored tiles are hidden
• Export FOV calculation and rendering functions

### 8. UI and Controls (ui.js)
• **Keyboard:**
  - Arrow keys for movement
  - "b" key to board when eligible
  - "u" key to unboard when eligible
• **Touch:**
  - On-screen directional (up/down/left/right) buttons
  - Context-aware "Board" and "Unboard" action buttons, visible only when eligible
• **Display:**
  - Render map using rot.js, with color and character for each biome and entity
  - Render player with appropriate icon depending on mode
  - Show entity legend and control instructions below the map
  - Display last action/result messages (pickup, port visit, boarding, unboarding, errors)

### 9. Styling (styles.css)
• **Responsive Design:**
  - Mobile-first approach with breakpoints for tablet and desktop
  - Flexible grid layout for game map
  - Touch-friendly button sizing (minimum 44px tap targets)
• **Visual Themes:**
  - Pirate/nautical color scheme
  - Biome-specific colors and visual styling
  - Smooth animations for player movement and state changes
• **UI Components:**
  - Styled control buttons with hover and active states
  - Message display area with scrolling for multiple messages
  - Legend/help panel with collapsible sections
  - Loading states and transitions

### 10. Main Game Loop (game.js)
• Initialize all game systems
• Handle game state updates
• Coordinate between all modules
• Manage render loop and input handling
• Export main game initialization function

### 11. Server Setup (server.js)
• **Express Server Configuration:**
  - Serve static files from project root
  - Configure CORS for development
  - Set up port 3001 with fallback options
  - Add basic error handling
• **Features:**
  - Automatic browser opening on start
  - Console logging for requests
  - Hot reload support (if using nodemon)

---

## File Dependencies

### HTML Structure (index.html)
• Game container div for rot.js display
• Touch control container
• Message display area
• Legend/help sections
• Load all JavaScript modules in correct order

### CSS Organization (styles.css)
• **Reset and Base Styles**
• **Layout and Grid System**
• **Component Styles** (buttons, panels, messages)
• **Responsive Breakpoints**
• **Game-Specific Styles** (biome colors, player icons)
• **Animations and Transitions**

### JavaScript Modules
• **Module Loading Order:**
  1. External dependencies (rot.js)
  2. Core modules (map.js, entities.js, player.js, fog.js)
  3. UI module (ui.js)
  4. Main game initialization (game.js)

### Development Dependencies
• **package.json** - Project configuration and scripts
• **server.js** - Local development server
• **README.md** - Setup and running instructions

---

## Acceptance Criteria
• Map displays all biomes with correct visual styling
• Entities (ports, treasure, ships) spawn on correct tiles and never overlap
• Player spawns on land; cannot move onto ocean or mountain when on foot
• Player can board ships only when adjacent, switching to ship mode, with icon change
• Player can unboard only when adjacent to valid land, switching to foot mode, with icon change and ship placed in previous location
• Player cannot interact with treasure or ports while in ship mode
• All movement and actions possible via keyboard and touch UI
• Fog of war operates as described
• On mobile, controls are touch-friendly and map is visible
• CSS provides responsive design that works on mobile, tablet, and desktop
• Code is modular and well-organized across separate files
• Local server runs on port 3001 and serves the game correctly
• Development setup is documented and easy to follow
• No runtime errors or softlocks in major browsers

---

## Non-Functional Requirements
• Use rot.js for display, FOV, and noise functions
• Modular JavaScript with clear separation of concerns
• CSS follows modern best practices (flexbox/grid, CSS variables)
• Code is commented and documented for future extension
• Performance optimized for smooth gameplay on mobile devices
• Accessibility considerations for keyboard navigation
• Local development server with hot reload capabilities
• Cross-platform compatibility (Windows, macOS, Linux)

---

**END OF TECHNICAL PRD**