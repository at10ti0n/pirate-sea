# Ship Durability & Weather Events - Design Document

## Overview
Two interconnected systems that add risk and resource management to seafaring:
1. **Ship Durability** - Ships take damage and require repairs
2. **Weather Events** - Dynamic storm system that creates navigational challenges and damages ships

## Ship Durability System

### Core Mechanics

#### Ship Properties
```javascript
ship = {
    type: 'ship',
    x: 10,
    y: 20,
    durability: {
        current: 100,      // Current hull points
        max: 100,          // Maximum hull points
        condition: 'good', // 'excellent', 'good', 'damaged', 'critical'
        lastDamage: Date.now()
    }
}
```

#### Condition States
- **Excellent** (90-100%): Ship at full strength, ⛵
- **Good** (60-89%): Minor wear, ⛵
- **Damaged** (30-59%): Significant damage, slower movement?, ⚓
- **Critical** (1-29%): Severe damage, risk of sinking, 🚢
- **Destroyed** (0%): Ship sinks and is removed

### Damage Sources

1. **Weather Events** (primary)
   - Storms: 5-15 damage per turn in storm
   - Heavy seas: 1-5 damage per turn

2. **Natural Hazards** (future)
   - Rocky coastlines: damage when sailing too close to shore
   - Shallow water: scraping on reefs

3. **Combat** (future expansion)
   - Cannon fire
   - Ramming

### Repair Mechanics

#### Port Repairs
- **Location**: Only at ports (safe harbor required)
- **Cost Formula**: `(maxHull - currentHull) × repairCostPerPoint × portTierMultiplier`
  - Base repair cost: 2g per hull point
  - Small port: 1.5× multiplier (3g/point)
  - Medium port: 1.2× multiplier (2.4g/point)
  - Large port: 1.0× multiplier (2g/point)
  - Capital port: 0.8× multiplier (1.6g/point)

#### Resource-Based Repairs (Phase 2)
- **Required Resources**:
  - Wood: 1 per 10 hull points
  - Reeds (for caulking): 1 per 20 hull points
- **DIY Repair**: Can repair at sea using inventory (50% efficiency)
- **Port Repair with Resources**: Discount if you provide materials (30% cost reduction)

#### Repair Commands
- **Web**: 'R' key at port, shows repair modal
- **Terminal**: `repair` or `repair <amount>` command at port

### UI/UX

#### Visual Feedback
- Ship icon changes based on condition
- Health bar in ship info panel
- Color coding: green → yellow → red
- Warning messages when taking damage

#### Information Display
```
Ship Status: Damaged (45/100 HP) ⚓
Last damaged: 2 minutes ago
Estimated repair cost: 110g at this port
```

### Integration Points

1. **Entity System** (`entities.js`)
   - Add durability to ship spawn
   - Update ship icons based on condition
   - Handle ship destruction

2. **Player System** (`player.js`)
   - Track current ship when embarked
   - Show warnings for low durability
   - Prevent embarking on destroyed ships

3. **Economy System** (`economy.js`)
   - Add repair transaction type
   - Resource requirements for repairs
   - Port tier pricing multipliers

4. **UI System** (`ui.js`)
   - Ship condition display
   - Repair interface
   - Damage notifications

---

## Weather Events System

### Core Mechanics

#### Weather Types
```javascript
weather = {
    type: 'storm',      // 'clear', 'fog', 'rain', 'storm', 'hurricane'
    intensity: 0.8,     // 0.0-1.0 severity
    x: 50,              // Center position
    y: -20,
    radius: 15,         // Affected area
    moveX: -0.5,        // Movement per turn
    moveY: 0.3,
    duration: 100,      // Turns remaining
    startTime: Date.now()
}
```

#### Weather Categories

1. **Clear** (60% of map)
   - No effects
   - Safe sailing

2. **Fog** (15% of map)
   - Reduced visibility (Phase 2)
   - No damage
   - Navigation challenge

3. **Rain** (15% of map)
   - Light damage: 1-2 HP per turn
   - Slightly reduced visibility

4. **Storm** (8% of map)
   - Moderate damage: 5-10 HP per turn
   - Significantly reduced visibility
   - Warning messages

5. **Hurricane** (2% of map, rare)
   - Heavy damage: 10-20 HP per turn
   - Extreme danger
   - Should be avoided at all costs

### Weather Generation

#### Procedural Generation
- Use Simplex noise for natural weather patterns
- Multiple weather cells move across the map
- 3-5 active weather systems at any time
- Weather patterns persist across sessions (seeded)

#### Movement System
- Weather moves gradually (0.3-1.0 tiles per turn)
- Direction influenced by "prevailing winds" (generally west to east)
- Weather systems can merge or dissipate
- New weather spawns at map edges

### Visual Representation

#### Map Display
- **Clear**: Normal terrain colors
- **Fog**: Lighter/greyscale overlay, ≋ character
- **Rain**: Blue tint, ' ' or ` character overlay
- **Storm**: Dark overlay, ⚡ or ※ character
- **Hurricane**: Very dark, 🌀 or ⚇ character

#### Terminal Symbols
```
~  Ocean (clear)
≋  Foggy ocean
'  Rainy ocean
※  Stormy ocean
⚇  Hurricane waters
```

#### Web Display
- Weather overlay layer above terrain
- Animated effects for storms
- Warning borders for dangerous weather

### Weather Warnings

#### Detection Range
- Can see weather 10 tiles away
- Warnings appear in message log
- UI indicator shows nearest storm

#### Warning Messages
```
"Dark clouds gathering to the north!"
"A storm approaches from the west!"
"You are entering a storm system - seek shelter!"
"DANGER: Hurricane detected nearby!"
```

### Damage Application

#### Timing
- Damage applied at end of each turn while in ship mode
- Only affects ships at sea (not docked at ports)
- Ports provide complete protection from weather

#### Calculation
```javascript
function applyWeatherDamage(ship, weather) {
    const intensity = weather.intensity;
    const baseDamage = WEATHER_DAMAGE[weather.type];
    const actualDamage = baseDamage * intensity * (0.8 + Math.random() * 0.4);
    ship.durability.current -= Math.floor(actualDamage);
}
```

### Integration Points

1. **Map Generation** (`map.js`)
   - Add weather layer to map system
   - Weather noise generation
   - Weather update on each turn

2. **Entity Management** (`entities.js`)
   - Check ship positions against weather
   - Apply damage to ships in bad weather

3. **Player System** (`player.js`)
   - Weather warnings when approaching storms
   - Damage feedback messages
   - Emergency port seeking behavior hints

4. **UI System** (`ui.js`)
   - Weather overlay rendering
   - Storm proximity warnings
   - Weather forecast info panel

5. **Game Loop** (`game.js`, `terminal-game.js`)
   - Update weather positions each turn
   - Process weather damage
   - Spawn/despawn weather systems

---

## Implementation Plan

### Phase 1: Ship Durability (Core)
**Time: ~1 hour**

1. ✓ Design data structures
2. Add durability to ship entities
3. Create repair system (port-based, gold only)
4. Implement visual feedback
5. Add repair UI/commands
6. Test repair mechanics

### Phase 2: Weather Events (Core)
**Time: ~1 hour**

1. ✓ Design weather system
2. Create weather generation (simple, static storms)
3. Add weather visualization
4. Implement damage application
5. Add warning system
6. Test storm damage

### Phase 3: Polish & Integration
**Time: ~30 minutes**

1. Balance damage/repair costs
2. Add weather movement (if time)
3. Integrate with existing messages
4. Add tutorial hints
5. Final testing

### Phase 4: Advanced Features (Future)
- Resource-based repairs
- Weather movement and persistence
- Fog visibility effects
- Multiple simultaneous storms
- Seasonal weather patterns
- Ship upgrades (better hulls)

---

## Balance Considerations

### Risk vs Reward
- Storms create interesting navigation choices
- Repair costs should be significant but not punishing
- Weather should be avoidable with skill
- Ports become valuable safe havens

### Economic Impact
- Repair costs: 50-200g typical (moderate expense)
- Bad storm damage: ~50-100 HP lost (expensive but survivable)
- Forces players to trade more to maintain ship
- Creates resource sink for economy

### Difficulty Curve
- Early game: Few storms, cheap repairs
- Mid game: More frequent weather, moderate costs
- Late game: Hurricanes, expensive but affordable repairs

---

## Testing Checklist

### Ship Durability
- [ ] Ships spawn with full durability
- [ ] Damage reduces current HP
- [ ] Condition states update correctly
- [ ] Ship icons change with condition
- [ ] Repairs work at all port tiers
- [ ] Repair costs scale properly
- [ ] Ships sink at 0 HP
- [ ] Player receives warnings at critical HP

### Weather Events
- [ ] Weather generates on map
- [ ] Weather is visible to player
- [ ] Damage applies only to ships at sea
- [ ] Ports protect from weather damage
- [ ] Warnings appear before entering storms
- [ ] Different weather types have correct damage
- [ ] Weather visualization works in both modes

### Integration
- [ ] Economy handles repair transactions
- [ ] UI shows ship condition clearly
- [ ] Messages are informative and timely
- [ ] Performance is acceptable with weather updates
- [ ] Both web and terminal versions work

---

## Files to Modify/Create

### New Files
- `weather.js` - Weather system core
- `ship-durability.js` - Ship health management (or integrate into entities.js)
- `test-durability.js` - Test suite for ship systems
- `test-weather.js` - Test suite for weather

### Modified Files
- `entities.js` - Add durability to ships
- `map.js` - Add weather layer (or keep in game.js)
- `game.js` - Weather updates, damage application
- `terminal-game.js` - Same as game.js
- `ui.js` - Ship condition display, repair UI
- `player.js` - Ship tracking, warnings
- `economy.js` - Repair transactions (optional, could be separate)

---

## API Design

### ShipDurability Class
```javascript
class ShipDurability {
    constructor(maxHull = 100) {
        this.max = maxHull;
        this.current = maxHull;
    }

    damage(amount) {
        this.current = Math.max(0, this.current - amount);
        return this.current;
    }

    repair(amount) {
        this.current = Math.min(this.max, this.current + amount);
        return this.current;
    }

    getCondition() {
        const percent = this.current / this.max;
        if (percent >= 0.9) return 'excellent';
        if (percent >= 0.6) return 'good';
        if (percent >= 0.3) return 'damaged';
        if (percent > 0) return 'critical';
        return 'destroyed';
    }

    getIcon() {
        const condition = this.getCondition();
        return SHIP_ICONS[condition] || '⛵';
    }
}
```

### WeatherManager Class
```javascript
class WeatherManager {
    constructor(seededRandom) {
        this.seededRandom = seededRandom;
        this.weatherSystems = [];
        this.weatherNoise = new ROT.Noise.Simplex();
    }

    generateWeather() {
        // Create initial weather patterns
    }

    updateWeather() {
        // Move weather, spawn/despawn systems
    }

    getWeatherAt(x, y) {
        // Return weather at position
    }

    applyWeatherDamage(ship) {
        const weather = this.getWeatherAt(ship.x, ship.y);
        if (!weather || weather.type === 'clear') return 0;

        const damage = this.calculateDamage(weather);
        return damage;
    }
}
```

---

## Summary

These two systems work together to create meaningful risk in seafaring:

1. **Ships are valuable assets** that require maintenance
2. **Weather creates dynamic challenges** that must be navigated
3. **Ports become safe havens** and necessary stops
4. **Economy gains depth** through repair costs
5. **Player skill matters** in avoiding storms and managing resources

The systems integrate naturally with existing mechanics (trading, ports, economy) and set the stage for future features (combat, ship upgrades, crew management).
