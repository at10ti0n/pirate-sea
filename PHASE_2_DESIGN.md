# Phase 2: Risk & Stakes Design

## Overview
Add meaningful consequences and tension to the gameplay loop. Players must balance risk (venturing far for treasure) vs reward (making it home safely).

## Core Concept
**Distance from home = Danger**
- Close to home port = Safe, mild weather
- Far from home = Storms, hull damage, risk of death
- Better ships = Can venture farther safely

---

## 1. Distance-Based Storm System

### Current Weather System
Already implemented in `weather.js`:
- Weather types: clear, fog, rain, storm, hurricane
- Damage values: 0, 0, 2, 8, 15
- Random weather systems spawn around player

### New: Distance-Based Storm Scaling

**Storm Danger Formula:**
```javascript
distanceFromHome = Math.sqrt((x - homeX)^2 + (y - homeY)^2)
dangerRatio = distanceFromHome / shipRange

if (dangerRatio < 0.5) {
    // SAFE ZONE - Clear weather only
    stormChance = 0
} else if (dangerRatio < 0.8) {
    // MODERATE - Light weather
    stormChance = 0.1 // 10% chance of rain/fog per turn
} else if (dangerRatio < 1.2) {
    // DANGEROUS - Storms appear
    stormChance = 0.25 // 25% chance of storm per turn
} else {
    // EXTREME - Hurricanes
    stormChance = 0.5 // 50% chance of hurricane per turn
}
```

**Ship Range Reference:**
- Dinghy: 100 tiles (safe zone: 50 tiles)
- Sloop: 200 tiles (safe zone: 100 tiles)
- Brigantine: 400 tiles
- Frigate: 800 tiles
- Galleon: Unlimited

### Implementation

**Add to player.js:**
```javascript
getDangerLevel() {
    if (!this.homePort || !this.shipSystem) return 'unknown';

    const distance = this.getDistanceToHome();
    const shipStats = this.shipSystem.getShipStats(this.currentShip);
    const dangerRatio = distance / shipStats.range;

    if (dangerRatio < 0.5) return 'safe';
    if (dangerRatio < 0.8) return 'moderate';
    if (dangerRatio < 1.2) return 'dangerous';
    return 'extreme';
}
```

**Add to weather.js:**
```javascript
getStormChanceForDistance(distance, shipRange) {
    const dangerRatio = distance / shipRange;

    if (dangerRatio < 0.5) return 0;
    if (dangerRatio < 0.8) return 0.1;
    if (dangerRatio < 1.2) return 0.25;
    return 0.5;
}

generateWeatherForDanger(dangerLevel) {
    switch(dangerLevel) {
        case 'safe': return 'clear';
        case 'moderate':
            return Math.random() < 0.7 ? 'clear' : 'fog';
        case 'dangerous':
            const roll = Math.random();
            if (roll < 0.4) return 'clear';
            if (roll < 0.7) return 'rain';
            return 'storm';
        case 'extreme':
            const extremeRoll = Math.random();
            if (extremeRoll < 0.2) return 'storm';
            return 'hurricane';
        default:
            return 'clear';
    }
}
```

---

## 2. Storm Hull Damage System

### Damage Application

**When damage occurs:**
- Every turn while in storm/hurricane
- Damage applies to ship hull
- Better ships have more hull = survive longer

**Damage Formula:**
```javascript
baseDamage = WEATHER_TYPES[weatherType].damage
// Dinghy takes full damage, galleon takes less
shipResistance = {
    dinghy: 1.0,      // 100% damage
    sloop: 0.9,       // 90% damage
    brigantine: 0.75, // 75% damage
    frigate: 0.6,     // 60% damage
    galleon: 0.5      // 50% damage
}
actualDamage = baseDamage * shipResistance[currentShip]
```

**Example:**
- Hurricane (15 damage) hits dinghy = 15 HP lost
- Hurricane (15 damage) hits galleon = 7.5 HP lost

### Implementation

**Add to player.js:**
```javascript
applyStormDamage(weatherType, shipSystem) {
    const weather = WEATHER_TYPES[weatherType];
    if (!weather || weather.damage === 0) return 0;

    const resistance = {
        dinghy: 1.0,
        sloop: 0.9,
        brigantine: 0.75,
        frigate: 0.6,
        galleon: 0.5
    }[this.currentShip] || 1.0;

    const damage = Math.ceil(weather.damage * resistance);
    this.damageShip(damage);

    return damage;
}
```

**Add to terminal-game.js:**
```javascript
applyWeatherEffects() {
    // Only apply damage if on ship
    if (this.player.mode !== 'ship') return;

    const weather = this.weatherManager.getWeatherAt(this.player.x, this.player.y);
    if (!weather || weather.type === 'clear') return;

    const damage = this.player.applyStormDamage(weather.type, this.entityManager.shipSystem);

    if (damage > 0) {
        this.addMessage(`⚠️ ${weather.type.toUpperCase()} damages ship! -${damage} HP (${this.player.shipHull}/${this.player.maxShipHull})`);

        // Check for death
        if (this.player.isShipDestroyed()) {
            this.handleDeath('shipwreck');
        }
    }
}
```

---

## 3. Death & Respawn System

### Death Triggers

1. **Shipwreck** - Hull reaches 0
2. **Starvation** - Health reaches 0 (already implemented)

### Death Consequences

**What you LOSE:**
- ❌ Current ship (revert to dinghy)
- ❌ All cargo in hold
- ❌ Current position

**What you KEEP:**
- ✅ Gold (stored at home port safely)
- ✅ Home port
- ✅ Game progress

### Shipwreck Entity

**Created at death location:**
```javascript
{
    type: 'shipwreck',
    x: deathX,
    y: deathY,
    cargo: [...player.cargoHold], // Copy of cargo
    shipType: player.currentShip,
    deathTime: gameTime,
    despawnTime: gameTime + 24, // 24 game hours
    char: '☠',
    color: '#8b4513'
}
```

**Shipwreck Interaction:**
- Stand on shipwreck (on foot)
- Press 'S' to salvage
- Retrieve all cargo (if you have space)
- Shipwreck disappears

### Implementation

**Add to player.js:**
```javascript
createDeathData() {
    return {
        location: { x: this.x, y: this.y },
        cargo: [...this.cargoHold],
        shipType: this.currentShip,
        goldLost: 0 // Keep gold
    };
}

respawnAtHome() {
    if (!this.homePort) {
        // No home port, respawn at origin
        this.x = 0;
        this.y = 0;
    } else {
        this.x = this.homePortX;
        this.y = this.homePortY;
    }

    // Reset to dinghy
    this.currentShip = 'dinghy';
    this.maxCargoSpace = 5;
    this.shipHull = 50;
    this.maxShipHull = 50;

    // Clear cargo
    this.cargoHold = [];

    // Reset health
    this.currentHealth = this.maxHealth;
    this.hunger = 100;

    // Reset mode to foot
    this.mode = 'foot';
}
```

**Add to entities.js:**
```javascript
createShipwreck(x, y, cargo, shipType, gameTime) {
    const shipwreck = {
        type: 'shipwreck',
        x: x,
        y: y,
        cargo: cargo,
        shipType: shipType,
        deathTime: gameTime,
        despawnTime: gameTime + 24,
        char: '☠',
        color: '#8b4513'
    };

    this.addEntity(shipwreck);
    return shipwreck;
}

salvageShipwreck(shipwreck, player) {
    if (!shipwreck.cargo || shipwreck.cargo.length === 0) {
        return {
            success: false,
            message: 'Shipwreck is empty.'
        };
    }

    let salvaged = 0;
    let totalValue = 0;

    // Try to add each cargo item
    for (const item of shipwreck.cargo) {
        const result = player.addToCargo(item);
        if (result.success) {
            salvaged++;
            totalValue += item.value || 0;
        } else {
            break; // Cargo full
        }
    }

    // Remove shipwreck
    this.removeEntity(shipwreck.x, shipwreck.y);

    return {
        success: true,
        message: `Salvaged ${salvaged} items worth ${totalValue}g from shipwreck!`,
        itemsSalvaged: salvaged
    };
}
```

**Add to terminal-game.js:**
```javascript
handleDeath(cause) {
    const deathData = this.player.createDeathData();

    // Create shipwreck at death location
    if (cause === 'shipwreck') {
        this.entityManager.createShipwreck(
            deathData.location.x,
            deathData.location.y,
            deathData.cargo,
            deathData.shipType,
            this.player.gameTime
        );

        this.addMessage('💀 YOUR SHIP HAS SUNK!');
        this.addMessage(`Lost ${deathData.cargo.length} cargo items at (${deathData.location.x}, ${deathData.location.y})`);
    } else {
        this.addMessage('💀 YOU HAVE DIED!');
    }

    // Respawn at home
    this.player.respawnAtHome();
    this.addMessage(`Respawned at home port with dinghy. Gold safe: ${this.player.gold}g`);

    // Update camera and visibility
    this.mapGenerator.updateCamera(this.player.x, this.player.y);
    this.fogOfWar.updateVisibility(this.player.x, this.player.y);
}
```

---

## 4. UI Indicators

### Danger Level Display

**Status bar shows:**
```
Distance: 150 tiles | Danger: MODERATE (☁️)
Distance: 250 tiles | Danger: DANGEROUS (⚠️)
Distance: 450 tiles | Danger: EXTREME (☠️)
```

### Warning Messages

**Trigger warnings at danger thresholds:**
- Entering MODERATE: "⚠️ Weather worsening - storms possible"
- Entering DANGEROUS: "🌊 DANGEROUS WATERS! Storms likely - return to port!"
- Entering EXTREME: "☠️ EXTREME DANGER! Hurricane risk! Turn back now!"

### Hull Damage Warnings

**When hull drops below thresholds:**
- < 50%: "⚠️ Hull damaged - repair at port recommended"
- < 25%: "🚨 CRITICAL DAMAGE! Return to port immediately!"
- < 10%: "☠️ HULL FAILING! You are about to sink!"

---

## Implementation Order

### Step 1: Storm Hull Damage (2-3 hours)
1. Add `applyStormDamage()` to player.js
2. Integrate into terminal-game.js `applyWeatherEffects()`
3. Add hull damage warnings
4. Test: venture into storm, watch hull decrease

### Step 2: Distance-Based Weather (2-3 hours)
1. Add `getDangerLevel()` to player.js
2. Add storm chance scaling to weather.js
3. Modify weather generation based on distance
4. Add danger level to UI
5. Test: sail far from home, storms increase

### Step 3: Death & Respawn (2-3 hours)
1. Add `respawnAtHome()` to player.js
2. Add `handleDeath()` to terminal-game.js
3. Create shipwreck entity system
4. Add salvage interaction
5. Test: die in storm, respawn at home, return to salvage

### Step 4: Polish & Balance (1-2 hours)
1. Tune damage values
2. Tune storm spawn rates
3. Add warning messages
4. Add danger indicators to UI
5. Test full loop: venture → storm → damage → retreat → repair

---

## Success Metrics

Phase 2 is successful when:
1. ✅ Venturing far feels risky (storms appear, hull damage)
2. ✅ Death has consequences (lose ship/cargo) but isn't game-ending (keep gold, can recover)
3. ✅ Players make meaningful choices (push luck vs play safe)
4. ✅ Ship progression matters (better ships = safer exploration)
5. ✅ Warnings give players agency (can see danger coming, choose to retreat)

---

## Testing Scenarios

### Scenario 1: Safe Exploration
- Stay within ship's safe range
- Should see clear weather mostly
- Can explore, collect treasure, return safely

### Scenario 2: Risky Treasure Run
- Venture beyond safe range
- Storms appear, hull takes damage
- Successfully retreat to port, repair, sell treasure
- Profit > repair cost = rewarding

### Scenario 3: Death & Recovery
- Venture too far with full cargo
- Hurricane hits, hull destroyed
- Respawn at home with dinghy
- Salvage cargo from shipwreck (if can afford ship to get there)

### Scenario 4: Ship Progression Impact
- Compare dinghy vs galleon at same distance
- Dinghy: storms at 150 tiles, high damage
- Galleon: clear at 150 tiles, storms at 800+
- Progression feels powerful

---

## Balance Notes

**Initial Values (will tune after testing):**

**Storm Spawn Rates:**
- Safe (< 50% range): 0% storm chance
- Moderate (50-80%): 10% storm chance per turn
- Dangerous (80-120%): 25% storm chance
- Extreme (> 120%): 50% storm chance

**Hull Damage:**
- Rain: 2 HP/turn
- Storm: 8 HP/turn
- Hurricane: 15 HP/turn

**Ship Resistance:**
- Dinghy: 100% damage (fragile)
- Sloop: 90% damage
- Brigantine: 75% damage
- Frigate: 60% damage
- Galleon: 50% damage (sturdy)

**Example Death Scenarios:**
- Dinghy (50 HP) in hurricane = 3 turns to death
- Sloop (100 HP) in storm = 12 turns to death
- Galleon (400 HP) in hurricane = 53 turns to death

This creates clear progression: better ships = survive longer in danger zones.
