# MVP Engagement Loop Design

## Goal
Create a compelling gameplay loop where players:
1. Explore the infinite ocean
2. Find treasure (maps and direct finds)
3. Return to home port to sell treasure
4. Upgrade their ship to venture farther
5. Face increasing challenges (storms, hunger, distance)
6. Build wealth and ship progression over time

## Core Systems to Implement

### 1. Home Port System

**Concept:** The first port you visit becomes your permanent "home base"

**Player Properties:**
```javascript
this.homePort = null; // Set on first port visit
this.homePortX = null;
this.homePortY = null;
```

**Port Properties (add to ports):**
```javascript
{
    type: 'port',
    isHomePort: false, // Set to true when player claims it
    portName: 'Port Royal', // Procedurally generated name
    ...existing properties
}
```

**Mechanics:**
- First port visited = auto-claimed as home
- UI shows "Welcome to [Port Name] - This is now your home port!"
- Home port marked with special icon (🏰 or H)
- Can see distance to home port in UI
- Home port NEVER despawns (store in special permanent entities list)

**Implementation Priority:** HIGH - Foundation for entire loop

---

### 2. Cargo Hold System

**Concept:** Player has limited cargo space, must choose what to carry

**Player Properties:**
```javascript
this.cargoHold = []; // Array of items in cargo
this.maxCargoSpace = 10; // Depends on ship tier
this.currentCargoWeight = 0;
```

**Cargo Item Structure:**
```javascript
{
    type: 'treasure', // or 'resource', 'special'
    name: 'Gold Doubloons',
    value: 50, // Gold value when sold
    weight: 1,
    foundAt: { x: 123, y: 456 } // Track where found
}
```

**Mechanics:**
- Picking up treasure adds to cargo (doesn't auto-sell)
- Cargo has weight limit based on ship tier
- Can view cargo inventory (I key)
- Must return to port to sell
- Resources (berries, fish) also take cargo space

**Implementation Priority:** HIGH - Core to loop

---

### 3. Treasure System Overhaul

**Current:** Treasure just disappears when collected
**New:** Treasure has types and values

**Treasure Types:**
```javascript
TREASURE_TYPES = {
    common: {
        value: 20-50,
        weight: 1,
        names: ['Gold Coins', 'Silver Pieces', 'Pearl Necklace'],
        spawnChance: 60%
    },
    uncommon: {
        value: 80-150,
        weight: 2,
        names: ['Jeweled Goblet', 'Emerald Ring', 'Gold Statue'],
        spawnChance: 30%
    },
    rare: {
        value: 200-400,
        weight: 3,
        names: ['Ancient Crown', 'Diamond Chest', 'Cursed Idol'],
        spawnChance: 8%
    },
    legendary: {
        value: 500-1000,
        weight: 5,
        names: ['Aztec Gold', 'Poseidon\'s Trident', 'Blackbeard\'s Treasure'],
        spawnChance: 2%
    }
}
```

**Mechanics:**
- Collect treasure → added to cargo hold
- Treasure shows value estimate in description
- At port, can "Sell All Treasure" or select individual items
- Selling converts to gold
- Gold used to buy ships/upgrades

**Implementation Priority:** HIGH - Core motivation

---

### 4. Ship Progression System

**Concept:** Better ships = more cargo, faster travel, survive farther from port

**Ship Tiers:**
```javascript
SHIP_TYPES = {
    dinghy: {
        name: 'Dinghy',
        cost: 0, // Starting ship
        maxCargo: 5,
        speed: 0.8, // Movement modifier
        maxHull: 50,
        range: 100, // Tiles from port before storms become deadly
        icon: '⛵'
    },
    sloop: {
        name: 'Sloop',
        cost: 300,
        maxCargo: 15,
        speed: 1.0,
        maxHull: 100,
        range: 200,
        icon: '⛵'
    },
    brigantine: {
        name: 'Brigantine',
        cost: 800,
        maxCargo: 30,
        speed: 1.2,
        maxHull: 150,
        range: 400,
        icon: '⛵'
    },
    frigate: {
        name: 'Frigate',
        cost: 2000,
        maxCargo: 50,
        speed: 1.0,
        maxHull: 250,
        range: 800,
        icon: '⛵'
    },
    galleon: {
        name: 'Galleon',
        cost: 5000,
        maxCargo: 100,
        speed: 0.9,
        maxHull: 400,
        range: 99999, // Can go anywhere
        icon: '⛵'
    }
}
```

**Player Properties:**
```javascript
this.currentShip = 'dinghy'; // Ship type key
this.shipHull = 50; // Current hull HP
```

**Mechanics:**
- Start with dinghy (weakest ship)
- At ports, can view available ships in shipyard
- Purchase new ship (lose old one, transfer cargo)
- Ship stats affect gameplay:
  - Cargo = how much treasure you can haul
  - Hull = how much damage before sinking
  - Range = how far you can safely venture
  - Speed = movement modifier (future: faster ships move 2 tiles?)

**Implementation Priority:** HIGH - Core progression

---

### 5. Treasure Map System

**Concept:** Find treasure maps that lead to buried treasure at specific coordinates

**Map Item Structure:**
```javascript
{
    type: 'treasure_map',
    targetX: 234,
    targetY: -567,
    treasureType: 'rare', // Determines what you find
    distanceFromHome: 345, // Calculated when generated
    description: 'Torn map showing an X on a tropical island'
}
```

**How Maps Spawn:**
1. **Floating Bottles** - New entity type, spawns in ocean
2. **Random Treasure** - 20% chance treasure is actually a map
3. **Port Rumors** - Can buy maps from tavern (future)

**Map Usage:**
1. Find map → added to cargo/special inventory
2. Map shows coordinates and rough direction
3. Navigate to coordinates
4. At location, use "Dig" command (D key)
5. Find treasure chest (better than normal treasure)

**Digging Mechanic:**
- Only works on land (beach, forest, etc.)
- If map coordinates match, find treasure
- If no map, small chance to find common treasure (scavenging)
- Digging takes time/energy (hunger cost)

**Implementation Priority:** MEDIUM - Adds depth, not essential for loop

---

### 6. Weather & Storm System

**Concept:** Distance from home port increases storm danger, creates risk/reward

**Weather States:**
```javascript
WEATHER_TYPES = {
    calm: { damage: 0, foodCost: 1, icon: '☀️' },
    cloudy: { damage: 0, foodCost: 1, icon: '☁️' },
    rain: { damage: 1, foodCost: 1, icon: '🌧️' },
    storm: { damage: 5, foodCost: 2, icon: '⛈️' },
    hurricane: { damage: 15, foodCost: 3, icon: '🌀' }
}
```

**Mechanics:**
- Weather changes periodically (every 20-50 turns)
- Storm chance increases with:
  - Distance from home port
  - Ship tier (better ships handle better)
  - Random bad luck
- Storm damage applies to ship hull each turn
- Must seek shelter at port or island
- Can wait out storm at port (W key)

**Storm Calculation:**
```javascript
distanceFromHome = Math.sqrt((x - homeX)^2 + (y - homeY)^2)
baseStormChance = distanceFromHome / shipRange
stormChance = baseStormChance * 0.1 // 10% per turn beyond safe range
```

**Implementation Priority:** MEDIUM - Adds tension, not required for basic loop

---

### 7. Death & Respawn System

**Concept:** Death has consequences but isn't game-ending

**Death Triggers:**
- Hull reaches 0 (shipwreck)
- Health reaches 0 (starvation, future: combat)

**Death Penalties:**
```javascript
DEATH_PENALTY = {
    loseShip: true, // Revert to dinghy
    loseCargo: true, // All cargo dropped at death location
    loseGold: false, // Keep gold (stored at home port)
    respawnLocation: 'home_port',
    shipwreckDuration: 24 // Game hours before wreck despawns
}
```

**Shipwreck Mechanic:**
1. Player dies at (x, y)
2. Create "shipwreck" entity at death location
3. Shipwreck contains all cargo from death
4. Player respawns at home port with dinghy
5. Can sail back to retrieve cargo (if you can afford/find a ship)
6. Shipwreck despawns after 24 game hours

**Permadeath Mode (Optional):**
- Hardcore mode: death = game over
- Track stats: "Best run: 5000 gold, 23 treasures"

**Implementation Priority:** MEDIUM-HIGH - Adds stakes

---

### 8. Port Services Expansion

**Current:** Ports spawn ships
**New:** Ports have multiple services

**Port Menu:**
```
Port Royal (Home Port ★)
-----------------------
1. Shipyard - Buy/Repair Ships
2. Merchant - Sell Treasure & Resources
3. Tavern - Rumors & Quests (future)
4. Storage - Manage Cargo (future)
5. Depart
```

**Shipyard:**
- View available ships
- Purchase if you have gold
- Repair current ship (2g per hull point)
- View ship stats comparison

**Merchant:**
- Sell individual treasures
- Sell all treasures (quick option)
- Sell resources (berries, fish, wood)
- View current gold

**Implementation Priority:** HIGH - Core to loop

---

## Gameplay Loop Flow

```
START
  ↓
Spawn at home port with dinghy (5 cargo space)
  ↓
Explore nearby ocean (low storm risk)
  ↓
Find treasure islands/floating bottles
  ↓
Collect treasure (fills cargo: 5/5)
  ↓
Return to home port (navigate back)
  ↓
Sell treasure → gain gold (300g total)
  ↓
Buy sloop (300g) → now have 15 cargo space
  ↓
Venture farther from home (more risk)
  ↓
Find treasure map in bottle
  ↓
Navigate to map coordinates (200 tiles away)
  ↓
Dig up rare treasure worth 400g
  ↓
Cargo full (15/15) → head home
  ↓
Storm hits! Hull damage (90/100 hull)
  ↓
Make it to port barely alive
  ↓
Sell treasure (2000g total now)
  ↓
Repair ship (20g)
  ↓
Buy brigantine (800g) → 30 cargo, better storm resistance
  ↓
Repeat with increasing risk/reward...
  ↓
Eventually: Galleon, venture to poles, legendary treasures
```

## Implementation Order

### Phase 1: Core Loop (10-12 hours)
1. **Cargo Hold System** - Add player cargo array and weight tracking
2. **Treasure Values** - Make treasure worth gold with types/values
3. **Home Port** - First port becomes permanent home
4. **Port Merchant** - Sell treasure for gold at ports
5. **Ship Progression** - Define ship tiers and stats
6. **Shipyard** - Buy ships at ports

**Result:** Can explore → collect → return → sell → upgrade → repeat

### Phase 2: Risk & Stakes (6-8 hours)
7. **Weather System** - Basic storms with hull damage
8. **Death/Respawn** - Lose ship/cargo, respawn at home
9. **Shipwreck Recovery** - Can retrieve cargo from death location

**Result:** Risk/reward balance, death has consequences

### Phase 3: Depth & Content (8-10 hours)
10. **Treasure Maps** - Find maps, dig for buried treasure
11. **Floating Bottles** - New entity type in ocean
12. **Port Improvements** - Better UI for services
13. **Ship Repair** - Hull damage persistence and repair

**Result:** More varied gameplay, treasure hunting depth

## Success Metrics

The MVP loop is successful if:
1. ✅ Players have a clear goal (get rich, upgrade ship)
2. ✅ Exploration has purpose (find treasure to sell)
3. ✅ Progression is tangible (ship upgrades unlock new areas)
4. ✅ Risk/reward creates tension (venture far = better treasure but more danger)
5. ✅ Death has consequences (lose progress, but not everything)
6. ✅ Home port creates attachment (your base, your safe haven)
7. ✅ "Just one more trip" compulsion (incremental progress)

## Future Expansion Hooks

Once MVP loop is proven fun:
- NPC ships (merchants, pirates, navy)
- Combat system
- Faction reputation
- Quest system
- Crew management
- Multiple ports (fast travel network)
- Settlement growth
- Plantations & passive income
- Legendary pirate questline

---

## Technical Notes

### Data Persistence
For now, all state in memory (game session).
Future: Save/load system for runs.

### UI Requirements
- Cargo inventory screen (I key)
- Port service menu
- Ship stats display
- Distance to home indicator
- Weather display
- Hull/health bars

### Performance
- Home port never despawns (add to permanent entities)
- Shipwrecks despawn after timer
- Treasure maps stored separately from cargo (special inventory)

### Balance Tuning
These values will need playtesting:
- Treasure spawn rates
- Ship costs
- Storm damage
- Distance scaling
- Cargo space per ship tier
