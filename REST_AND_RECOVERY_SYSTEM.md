# Rest & Recovery System
## Health Restoration Through Sleep, Food, and Rest for Pirate Sea

---

## Table of Contents
1. [Overview](#overview)
2. [Player Health System](#player-health-system)
3. [Food & Supplies](#food--supplies)
4. [Rest Mechanics](#rest-mechanics)
5. [Inn System](#inn-system)
6. [NPC Rest & Recovery](#npc-rest--recovery)
7. [Combat vs Non-Combat States](#combat-vs-non-combat-states)
8. [Strategic Depth](#strategic-depth)
9. [Implementation Plan](#implementation-plan)

---

## Overview

**Rest & Recovery System** adds survival mechanics where health is restored through:
- **Sleep** - Rest in huts, inns, or ship cabins
- **Food** - Consume berries, fish, and provisions
- **Safe rest** - Recover when not in combat
- **Supplies** - Manage food stocks on ship voyages
- **Inns** - Pay for quality rest and meals

### Core Principles

**Player Recovery:**
- Health regenerates when **not in combat**
- **Faster recovery** when sleeping (inn, hut, ship cabin)
- **Food accelerates** recovery (berries, fish, provisions)
- **Ship supplies** needed for long voyages
- **Cannot rest** during combat or while being chased

**NPC Recovery:**
- NPCs **sleep in huts** at night (8 PM - 6 AM)
- NPCs **eat meals** during breaks (lunch, dinner)
- **Natural recovery** while resting
- **Food consumption** from settlement supplies
- **Injured NPCs** rest longer to recover

---

## Player Health System

### Player HP

```javascript
player: {
    hp: 100,          // Current HP
    maxHp: 100,       // Maximum HP
    hunger: 100,      // 0-100 (affects recovery)
    fatigue: 0,       // 0-100 (increases over time)
    lastRest: Date.now(),
    lastMeal: Date.now(),
    isInCombat: false,
    restingLocation: null
}
```

### Health States

| HP Range | State | Effects |
|----------|-------|---------|
| **90-100%** | Healthy | Normal movement, full abilities |
| **60-89%** | Wounded | -5% movement speed |
| **30-59%** | Injured | -15% movement speed, -10% combat effectiveness |
| **10-29%** | Critical | -30% movement speed, -25% combat effectiveness |
| **<10%** | Near Death | -50% movement speed, blurred vision, desperate |

### Damage Sources for Player

**Combat:**
- Enemy attacks: 10-30 HP per hit
- Ship combat: 5-15 HP (player on damaged ship)
- Boarding fights: 15-40 HP

**Environmental:**
- Storms: 2-5 HP per turn
- Starvation: 1 HP per hour if hunger = 0
- Fatigue: 0.5 HP per hour if fatigue > 80

**Falls/Accidents:**
- Fall from rigging: 10-20 HP
- Ship collision: 5-15 HP

---

## Food & Supplies

### Food Types

#### **Berries** 🫐 (Basic Food)
```javascript
{
    name: 'Berries',
    restores: 10 HP,
    hungerRestore: 20,
    cost: 8g,
    spoilTime: 48 hours,
    weight: 0.5,
    effects: 'Basic sustenance'
}
```
- **Common**, cheap, lightweight
- Gathered from forests
- Spoils quickly
- Good for short trips

---

#### **Fish** 🐟 (Good Food)
```javascript
{
    name: 'Fish',
    restores: 20 HP,
    hungerRestore: 40,
    cost: 15g,
    spoilTime: 24 hours,
    weight: 1,
    effects: 'Nutritious, spoils fast'
}
```
- **Moderate** price, good nutrition
- Caught by fishermen or player
- Spoils quickly (needs cooking)
- Best fresh

---

#### **Cooked Fish** 🍖 (Better Food)
```javascript
{
    name: 'Cooked Fish',
    restores: 30 HP,
    hungerRestore: 60,
    cost: 25g,
    spoilTime: 72 hours,
    weight: 1,
    effects: 'Cooked, lasts longer, very nutritious'
}
```
- Cooked at inns, taverns, or ship galley
- Lasts longer than raw fish
- Best nutrition

---

#### **Hardtack** 🍞 (Long Voyage Food)
```javascript
{
    name: 'Hardtack',
    restores: 5 HP,
    hungerRestore: 30,
    cost: 5g,
    spoilTime: 6 months,
    weight: 0.5,
    effects: 'Boring but never spoils'
}
```
- **Cheap**, long-lasting
- Standard sailor ration
- Minimal HP restore but prevents starvation
- Bought at ports

---

#### **Rum** 🍺 (Morale Boost)
```javascript
{
    name: 'Rum',
    restores: 5 HP,
    hungerRestore: 10,
    cost: 12g,
    spoilTime: Never,
    weight: 1,
    effects: '+10 morale, slight HP restore'
}
```
- Boosts crew morale
- Slight healing
- Never spoils
- Tradition!

---

#### **Provisions** 📦 (Ship Supplies)
```javascript
{
    name: 'Provisions',
    restores: 15 HP per serving,
    hungerRestore: 40 per serving,
    cost: 50g per bundle (10 servings),
    spoilTime: 1 month,
    weight: 5,
    effects: 'Mixed supplies for ship voyages'
}
```
- Bulk ship supplies
- Mix of hardtack, salted meat, water
- Cost-effective for long voyages
- 1 provision bundle = 10 meals

---

### Food Consumption

**Hunger Mechanic:**
```javascript
// Hunger decreases over time
player.hunger -= 1 per hour of gameplay

// Hunger effects on recovery
if (player.hunger > 70) {
    recoveryRate = 1.0; // Normal recovery
} else if (player.hunger > 40) {
    recoveryRate = 0.5; // Slow recovery
} else if (player.hunger > 0) {
    recoveryRate = 0.1; // Very slow recovery
} else {
    // Starvation! Lose HP instead of recovering
    player.hp -= 1 per hour;
}
```

**Eating Food:**
```javascript
function eatFood(foodType) {
    player.hp += foodType.restores;
    player.hunger = Math.min(100, player.hunger + foodType.hungerRestore);
    player.lastMeal = Date.now();

    // Bonus: Well-fed status (lasts 2 hours)
    if (player.hunger >= 80) {
        player.buffs.wellFed = {
            duration: 7200000, // 2 hours
            effects: {
                recoveryBonus: 0.25 // +25% HP recovery
            }
        };
    }
}
```

---

## Rest Mechanics

### Rest Conditions

**Can Rest When:**
- ✅ Not in combat
- ✅ Not being chased by enemies
- ✅ In safe location (inn, hut, ship cabin, settlement)
- ✅ Not in dangerous biome (hurricane zone)

**Cannot Rest When:**
- ❌ In active combat
- ❌ Enemy ships within 5 tiles
- ❌ In storm/hurricane
- ❌ Ship sinking
- ❌ On fire

---

### Rest Locations & Recovery Rates

#### **1. On Ship (Player's Ship)**

**Ship Cabin Rest:**
```javascript
{
    location: 'ship_cabin',
    recoveryRate: 3 HP/hour,
    requirements: [
        'Player owns ship',
        'Ship has cabin (Sloop or larger)',
        'Ship has provisions',
        'Not in combat',
        'Not in storm'
    ],
    cost: 1 provision per 4 hours,
    bonuses: {
        comfort: 'Moderate',
        safety: 'High (if anchored)'
    }
}
```

**How It Works:**
```
Player: "Rest in cabin"
Game checks:
  ✓ On player's ship
  ✓ Ship has cabin (Sloop)
  ✓ Provisions: 5/10
  ✓ Not in combat
  ✓ Anchored safely

Rest begins:
  Hour 1: 75 → 78 HP (+3)
  Hour 2: 78 → 81 HP (+3)
  Hour 3: 81 → 84 HP (+3)
  Hour 4: 84 → 87 HP (+3), consumed 1 provision (4/10 left)

Player wakes up:
  "You feel refreshed! +12 HP"
  Hunger: 85% (well-fed from provisions)
  Fatigue: 0% (fully rested)
```

**Ship Size Matters:**
- **Dinghy**: No cabin (can't rest comfortably, only 1 HP/hour)
- **Sloop**: Small cabin (3 HP/hour)
- **Brigantine**: Decent cabin (4 HP/hour)
- **Galleon**: Comfortable quarters (5 HP/hour)
- **War Frigate**: Officer quarters (6 HP/hour)

---

#### **2. At Inn (Settlement Building)**

**Inn Rest (Best Recovery):**
```javascript
{
    location: 'inn',
    recoveryRate: 8 HP/hour,
    requirements: [
        'At settlement with inn',
        'Pay inn fee'
    ],
    cost: {
        basic: 20g per night,
        quality: 50g per night,
        luxury: 100g per night
    },
    bonuses: {
        basic: {
            recovery: 8 HP/hour,
            meals: '2 meals included',
            comfort: 'Good'
        },
        quality: {
            recovery: 10 HP/hour,
            meals: '3 meals + rum',
            comfort: 'Excellent',
            buffs: 'Well-rested (+10% movement for 12 hours)'
        },
        luxury: {
            recovery: 15 HP/hour,
            meals: 'Unlimited fine dining',
            comfort: 'Luxurious',
            buffs: 'Well-rested (+15% movement, +5% combat for 24 hours)'
        }
    }
}
```

**Inn Services:**
```
Player enters "The Salty Anchor Inn" at Port Haven

╔════════════════════════════════════════════╗
║       THE SALTY ANCHOR INN                 ║
║         "Rest Ye Weary Sailor"             ║
╠════════════════════════════════════════════╣
║                                            ║
║  Innkeeper: "Welcome! How can I help?"     ║
║                                            ║
║  Your Health: 45/100 HP                    ║
║  Your Hunger: 25% (Hungry)                 ║
║  Your Fatigue: 70% (Exhausted)             ║
║                                            ║
║  [1] Basic Room - 20g                      ║
║      • Sleep for 8 hours                   ║
║      • 2 meals (berries, bread)            ║
║      • Recover ~65 HP (8 HP/hour)          ║
║                                            ║
║  [2] Quality Room - 50g                    ║
║      • Comfortable bed                     ║
║      • 3 meals (fish, rum, fruit)          ║
║      • Recover ~80 HP (10 HP/hour)         ║
║      • Bonus: Well-rested buff             ║
║                                            ║
║  [3] Luxury Suite - 100g                   ║
║      • Royal treatment                     ║
║      • Unlimited fine dining               ║
║      • Recover ~120 HP (15 HP/hour!)       ║
║      • Bonus: Well-rested + Combat buff    ║
║                                            ║
║  [4] Just a Meal - 10g                     ║
║      • Cooked fish (30 HP)                 ║
║      • No sleep                            ║
║                                            ║
║  [5] Drink at Bar - 5g                     ║
║      • Rum (5 HP + morale)                 ║
║                                            ║
║  [Q] Leave                                 ║
╚════════════════════════════════════════════╝

Player selects [2] Quality Room (50g)

"You sleep soundly in a comfortable bed..."
[8 hours pass - 48 turns]
"You wake up feeling refreshed!"

Results:
  HP: 45 → 100 (fully restored!)
  Hunger: 25% → 90% (3 meals)
  Fatigue: 70% → 0% (rested)
  Buffs: Well-rested (+10% movement for 12 hours)
  Gold: 450g → 400g
  Time: 8:00 AM (morning)
```

---

#### **3. In Settlement Hut (Villager)**

**Hut Rest:**
```javascript
{
    location: 'villager_hut',
    recoveryRate: 6 HP/hour,
    requirements: [
        'At settlement',
        'Has empty hut or friendly villager'
    ],
    cost: 10g per night (room rental),
    bonuses: {
        comfort: 'Modest',
        safety: 'High (guarded settlement)',
        food: 'Basic (berries, bread)'
    }
}
```

**How It Works:**
- Player can rent a hut in settlement
- Cheaper than inn (10g vs 20g)
- Lower recovery (6 HP/hour vs 8)
- Good for budget travelers

---

#### **4. On Foot in Wilderness**

**Camping / Wilderness Rest:**
```javascript
{
    location: 'wilderness',
    recoveryRate: 2 HP/hour,
    requirements: [
        'Not in combat',
        'Not in ocean',
        'Safe biome (forest, beach, savanna)'
    ],
    cost: 0g,
    bonuses: {
        comfort: 'Poor',
        safety: 'Low (can be ambushed)',
        food: 'Player must have food'
    },
    risks: [
        '10% chance of pirate ambush',
        '5% chance of wildlife encounter',
        'Weather can interrupt rest'
    ]
}
```

**Camping Mechanics:**
```
Player on foot in forest, HP: 60/100

Player: "Rest here"
Game: "Make camp? (2 HP/hour, risky)"
Player: "Yes"

Rest begins:
  Hour 1: 60 → 62 HP
  Hour 2: 62 → 64 HP
  Hour 3: INTERRUPTED! "Pirate scouts nearby!"
  Combat begins!

Or if lucky:
  Hour 1-8: 60 → 76 HP
  "You wake up. The forest is peaceful."
  Consumed: 2 berries (from inventory)
```

**Camping Safety:**
- **Safe biomes**: Forest, beach, savanna (low risk)
- **Dangerous biomes**: Swamp (50% interrupt), desert (weather)
- **Near settlement**: Lower ambush chance
- **Far from civilization**: Higher risk

---

#### **5. At Tavern (Quick Rest)**

**Tavern Rest (Short Duration):**
```javascript
{
    location: 'tavern',
    recoveryRate: 5 HP/hour,
    requirements: [
        'At settlement tavern',
        'Pay for drinks/food'
    ],
    cost: 5-15g,
    duration: 'Short (1-3 hours)',
    bonuses: {
        comfort: 'Moderate',
        social: 'Learn rumors, meet NPCs',
        food: 'Meals and drinks available'
    }
}
```

**Tavern Activities:**
- Eat meal: 10g, +30 HP instant
- Drink rum: 5g, +5 HP, morale boost
- Rest at table: 1-3 hours, 5 HP/hour
- Talk to NPCs: Get quests, rumors, info

---

### Rest Duration

**Full Rest (8 hours):**
- Best for full recovery
- Reduces fatigue to 0
- Restores hunger if meals included
- Time passes (affects world state)

**Quick Rest (2-4 hours):**
- Partial recovery
- Reduces fatigue moderately
- Must eat separately
- Less time lost

**Emergency Rest (1 hour):**
- Minimal recovery
- For critical situations
- "Power nap" to survive
- Still risky if enemies nearby

---

## Inn System

### Inn Building

```javascript
{
    type: 'inn',
    name: 'The Salty Anchor',
    tier: 'medium', // basic, medium, luxury
    x: 45,
    y: 23,
    services: {
        basic_room: {
            cost: 20,
            recovery: 8,
            meals: 2
        },
        quality_room: {
            cost: 50,
            recovery: 10,
            meals: 3,
            buffs: ['well_rested']
        },
        luxury_suite: {
            cost: 100,
            recovery: 15,
            meals: 'unlimited',
            buffs: ['well_rested', 'combat_ready']
        },
        meal: {
            cost: 10,
            hp: 30,
            hunger: 60
        },
        drink: {
            cost: 5,
            hp: 5,
            morale: 10
        }
    },
    char: 'I',
    color: '#DAA520'
}
```

### Inn Tiers

**Basic Inn** (Small Settlements):
- Basic rooms only (20g)
- 8 HP/hour recovery
- Simple meals (berries, bread)
- Found in hamlets and villages

**Medium Inn** (Towns):
- Basic + Quality rooms (20g, 50g)
- 8-10 HP/hour recovery
- Good meals (fish, rum)
- Common in towns

**Luxury Inn** (Cities):
- All rooms (20g, 50g, 100g)
- 8-15 HP/hour recovery
- Gourmet meals
- Exclusive buffs
- Only in capitals

---

### Inn NPCs & Interactions

**Innkeeper:**
```javascript
{
    type: 'innkeeper',
    name: 'Martha the Innkeeper',
    dialogue: {
        greeting: "Welcome to The Salty Anchor! You look weary, traveler.",
        rooms: "We have rooms from 20 to 100 gold. What's your pleasure?",
        rumors: "I hear pirates been active near Dead Man's Cove...",
        full: "Sorry, we're full tonight. Try the tavern."
    },
    services: [
        'rent_room',
        'buy_meal',
        'hear_rumors',
        'get_quests'
    ]
}
```

**Inn Quests:**
- "Clear rats from the cellar" (5g, free room)
- "Deliver letter to another inn" (50g)
- "Find missing guest" (100g)

---

## NPC Rest & Recovery

### Villager Sleep Cycle

**Night Sleep (8 PM - 6 AM):**
```javascript
villager: {
    schedule: {
        '6-12': 'work',
        '12-13': 'lunch_break',
        '13-18': 'work',
        '18-20': 'tavern',
        '20-6': 'sleep'
    }
}

// During sleep
if (currentTime >= 20 || currentTime < 6) {
    villager.state = 'sleeping';
    villager.visible = false; // Inside hut
    villager.hp += 5 per hour; // Natural recovery
    villager.hunger -= 0.5 per hour; // Slow hunger drain
    villager.fatigue = 0; // Fully rested
}
```

**Meals:**
```javascript
// Villager lunch break (12-1 PM)
if (currentTime === 12) {
    villager.eat('lunch'); // Berries or bread
    villager.hp += 10;
    villager.hunger += 40;
}

// Villager dinner (6-7 PM at tavern)
if (currentTime === 18 && villager.location === 'tavern') {
    villager.eat('dinner'); // Fish or stew
    villager.hp += 20;
    villager.hunger += 60;
}
```

---

### Merchant NPC Rest

**Merchants Rest at Ports:**
```javascript
merchant: {
    restStrategy: 'opportunistic',
    restLocations: ['inn', 'ship_cabin'],
    restTrigger: 'hp < 70% OR fatigue > 60%'
}

// Merchant evaluates rest
if (merchant.hp < 70 || merchant.fatigue > 60) {
    if (merchant.isAtPort()) {
        // Rest at inn if profitable
        const innCost = 50; // Quality room
        const profitMargin = merchant.gold - 300; // Keep 300g buffer

        if (profitMargin > innCost) {
            merchant.rentInnRoom('quality');
            merchant.rest(8); // 8 hours
            // Recovers ~80 HP
        } else {
            // Rest on ship (cheaper)
            merchant.restOnShip(4); // 4 hours
            // Recovers ~12 HP
        }
    }
}
```

---

### Pirate NPC Rest

**Pirates Rest at Hideouts:**
```javascript
pirate: {
    restStrategy: 'survival',
    restLocations: ['hideout', 'ship_cabin', 'wilderness'],
    restTrigger: 'hp < 50%'
}

// Pirate rest behavior
if (pirate.hp < 50) {
    const hideout = findNearestPirateHideout(pirate.x, pirate.y);

    pirate.setGoal('retreat_to_hideout', hideout);
    pirate.state = 'retreating';

    // At hideout
    if (pirate.isAtHideout()) {
        // Sleep in hideout hut
        pirate.rest(12); // 12 hours
        pirate.eat('hardtack'); // Basic rations

        // Slow but free recovery
        // 12 hours × 4 HP/hour = +48 HP
        pirate.hp += 48;
    }
}
```

---

### Navy NPC Rest

**Navy Rests at Bases:**
```javascript
navy: {
    restStrategy: 'scheduled',
    restLocations: ['naval_barracks', 'ship_quarters'],
    restTrigger: 'end_of_shift OR hp < 80%'
}

// Navy rest schedule
if (navy.shiftEnded() || navy.hp < 80) {
    navy.returnToBase();

    if (navy.isAtBase()) {
        // Sleep in barracks (free)
        navy.rest(8);
        navy.eat('navy_rations'); // Free meals

        // High quality rest
        // 8 hours × 7 HP/hour = +56 HP
        navy.hp += 56;
        navy.fatigue = 0;

        // Navy always well-rested
    }
}
```

---

## Combat vs Non-Combat States

### Combat State Detection

```javascript
// Player enters combat when:
function checkCombatState(player) {
    // Enemy within aggro range
    const nearbyEnemies = findEnemiesInRange(player, 5);
    if (nearbyEnemies.length > 0) {
        player.isInCombat = true;
        player.combatStart = Date.now();
    }

    // Recently attacked (within 30 seconds)
    const timeSinceLastAttack = Date.now() - player.lastAttacked;
    if (timeSinceLastAttack < 30000) {
        player.isInCombat = true;
    }

    // Otherwise, out of combat
    if (nearbyEnemies.length === 0 && timeSinceLastAttack > 30000) {
        player.isInCombat = false;
    }
}
```

### Out-of-Combat Recovery

**Passive HP Regeneration:**
```javascript
// Player regenerates HP when not in combat
if (!player.isInCombat && player.hp < player.maxHp) {
    const baseRegen = 0.5; // HP per turn
    let regenRate = baseRegen;

    // Hunger affects regen
    if (player.hunger > 70) regenRate *= 1.5;
    else if (player.hunger < 40) regenRate *= 0.5;
    else if (player.hunger === 0) regenRate = -0.5; // Starving!

    // Well-fed buff
    if (player.buffs.wellFed) regenRate *= 1.25;

    // Resting location bonus
    if (player.isResting) {
        regenRate += player.restLocation.recoveryRate;
    }

    player.hp = Math.min(player.maxHp, player.hp + regenRate);
}
```

**Example:**
```
Player on ship, not in combat, HP: 75/100
Hunger: 80% (well-fed)
Has provisions

Turn 1: 75.0 → 75.5 HP (+0.5 base)
Turn 2: 75.5 → 76.0 HP
Turn 3: 76.0 → 76.5 HP
...
Turn 50: 100 HP (fully healed over time)

If player rests in cabin:
Turn 1: 75 → 78 HP (+3 from cabin rest)
Turn 2: 78 → 81 HP
Turn 3: 81 → 84 HP
...
Turn 9: 100 HP (much faster!)
```

---

## Strategic Depth

### Resource Management

**Player Decisions:**
- **Cheap but slow**: Camp in wilderness (free, risky, slow)
- **Balanced**: Inn basic room (20g, safe, good recovery)
- **Expensive but fast**: Inn luxury suite (100g, very fast, buffs)
- **Self-sufficient**: Ship cabin (1 provision, moderate)

**Risk vs Reward:**
- Wilderness camping saves gold but risks ambush
- Inn is safe but costs gold
- Ship cabin requires provisions (supply management)

---

### Long Voyage Planning

**Before Long Voyage:**
```
Player planning 200-tile journey:
  Estimated time: 100 turns (6 hours game time)
  Provisions needed: 2 bundles (20 meals)
  Current provisions: 1 bundle (10 meals)

Player at port:
  "Buy 1 provisions bundle: 50g"
  Total cost: 50g
  Journey survival: Ensured

Mid-voyage:
  Turn 40: Consume 1 provision (9 left)
  Turn 80: Consume 1 provision (8 left)
  Turn 100: Arrive at destination (8 provisions left)

If player runs out:
  Hunger drops to 0
  Start losing 1 HP/hour
  Must find port or island to resupply
  Emergency decision: continue or turn back?
```

---

### Injury Recovery Strategy

**Scenario: Player at 30/100 HP**

**Option 1: Luxury Inn (Fast)**
- Cost: 100g
- Time: 8 hours (48 turns)
- Result: 30 → 100 HP (15 HP/hour)
- Best for: Emergencies, wealthy players

**Option 2: Basic Inn (Balanced)**
- Cost: 20g
- Time: 8 hours
- Result: 30 → 94 HP (8 HP/hour)
- Best for: Budget recovery

**Option 3: Ship Cabin (Slow but Free)**
- Cost: 1 provision
- Time: 24 hours (144 turns)
- Result: 30 → 102 HP (3 HP/hour)
- Best for: Time-rich, gold-poor

**Option 4: Wilderness Camp (Risky)**
- Cost: 2 berries
- Time: 16 hours + risk
- Result: 30 → 62 HP if not interrupted
- Best for: Desperate situations

---

## Implementation Plan

### **Phase 1: Food & Hunger** (Week 1)

#### Day 1-2: Food System
**File:** `food-system.js`

**Tasks:**
- [ ] Create food item types (berries, fish, provisions, etc.)
- [ ] Implement hunger mechanic (0-100 scale)
- [ ] Add eating food action
- [ ] Track hunger drain over time
- [ ] Starvation damage when hunger = 0

**Success Criteria:**
- Player can eat food items
- Hunger affects HP recovery
- Food restores HP + hunger
- Starvation causes damage

---

#### Day 3-4: Provisions & Ship Supplies
**File:** `ship-provisions.js`

**Tasks:**
- [ ] Add provisions inventory to ships
- [ ] Implement provision consumption on voyages
- [ ] Create "buy provisions" at ports
- [ ] Alert when provisions low
- [ ] Cannot rest on ship without provisions

**Success Criteria:**
- Ships have provision storage
- Long voyages consume provisions
- Player warned when running low
- Starvation if provisions depleted

---

### **Phase 2: Rest System** (Week 2)

#### Day 5-7: Basic Rest Mechanics
**Files:** `rest-system.js`, `player.js`

**Tasks:**
- [ ] Implement rest action (player can rest)
- [ ] Add fatigue tracking
- [ ] Create rest location types
- [ ] Implement recovery rates by location
- [ ] Block resting during combat

**Success Criteria:**
- Player can rest in various locations
- HP recovers over time while resting
- Different locations have different rates
- Cannot rest in combat

---

#### Day 8-10: Combat State Detection
**File:** `combat-state.js`

**Tasks:**
- [ ] Implement combat state tracking
- [ ] Detect enemy proximity
- [ ] Track recent attacks
- [ ] Passive regen when not in combat
- [ ] Stop regen when combat starts

**Success Criteria:**
- Player enters combat state near enemies
- Passive regen works out of combat
- Regen stops immediately in combat
- Clear UI indication of combat/rest state

---

### **Phase 3: Inn System** (Week 3)

#### Day 11-13: Inn Building & Services
**Files:** `inn.js`, `settlement-generator.js`

**Tasks:**
- [ ] Create Inn building type
- [ ] Add inns to settlement generation
- [ ] Implement inn service menu
- [ ] Add room rental system
- [ ] Create inn tiers (basic, medium, luxury)

**Success Criteria:**
- Inns appear in settlements
- Player can rent rooms
- Different room qualities
- Payment system works

---

#### Day 14-15: Inn Recovery & Buffs
**Tasks:**
- [ ] Implement sleep/rest at inn
- [ ] Add recovery rates for room types
- [ ] Create well-rested buff
- [ ] Add meal service at inns
- [ ] Innkeeper NPC dialogue

**Success Criteria:**
- Sleeping at inn restores HP
- Better rooms = faster recovery
- Buffs applied correctly
- Meals available for purchase

---

### **Phase 4: NPC Rest** (Week 4)

#### Day 16-18: NPC Sleep & Recovery
**Files:** `villager-rest.js`, `npc-rest.js`

**Tasks:**
- [ ] NPCs sleep in huts at night
- [ ] NPCs become invisible when sleeping
- [ ] NPC HP recovery during sleep
- [ ] NPC meal consumption
- [ ] Injured NPCs rest longer

**Success Criteria:**
- Villagers sleep 8 PM - 6 AM
- NPCs recover HP while sleeping
- Settlements look empty at night
- NPCs eat meals during day

---

#### Day 19-21: NPC Rest Behavior
**Tasks:**
- [ ] Merchant rest at inns/ships
- [ ] Pirate rest at hideouts
- [ ] Navy rest at barracks
- [ ] NPC provision management
- [ ] Injured NPCs seek rest

**Success Criteria:**
- NPCs actively seek rest when injured/tired
- Different NPC types use different rest locations
- NPCs manage food/provisions
- Rest behavior observable

---

## Example Scenarios

### Scenario 1: Player Long Voyage

```
Day 1 (Morning): Player at Port Royal
  HP: 100/100
  Hunger: 80%
  Provisions: 5/10
  Gold: 500g

Player: "Sail to Dead Man's Cove (150 tiles away)"
Estimated: 75 turns (4.5 hours)

Turn 20: HP: 100, Hunger: 70% (still good)
Turn 40: Consumed 1 provision, Hunger: 85% (ate)
Turn 60: HP: 98 (took 2 storm damage), Hunger: 75%
Turn 75: Arrived! HP: 98, Hunger: 70%, Provisions: 4/10

Player: "Rest in ship cabin before exploring"
Rest 4 hours:
  HP: 98 → 110 (wait, capped at 100)
  HP: 98 → 100 (fully healed)
  Hunger: 70% → 85% (consumed 1 provision)
  Provisions: 3/10

Player ready to explore island!
```

---

### Scenario 2: Player Injured, Needs Recovery

```
Turn 1: Player in combat with pirate
  Pirate deals 35 damage
  Player: 65/100 HP

Turn 15: Player defeats pirate
  Player: 52/100 HP (took more hits)
  Combat ends

Turn 16: Out of combat, passive regen starts
  52 → 52.5 HP (+0.5/turn)

Turn 20: Player finds settlement
  HP: 54/100 (slow natural recovery)

Player enters inn:
  [1] Basic room: 20g (8 hours, +64 HP)
  [2] Quality room: 50g (8 hours, +80 HP)
  [3] Just eat: 10g (+30 HP instant)

Player chooses [2] Quality room (50g)

8 hours later:
  HP: 54 → 100 (fully healed + bonus)
  Hunger: 40% → 90% (meals included)
  Fatigue: 60% → 0% (well-rested)
  Buffs: +10% movement for 12 hours
  Gold: 450g

Player: "Ready for more adventures!"
```

---

### Scenario 3: NPC Merchant Rest Cycle

```
Merchant "Captain Morgan" trading

Day 1 (Morning): Departs Port Royal
  HP: 100/100, Provisions: 10/20

Day 1 (Afternoon): Attacked by pirates!
  HP: 100 → 65 (took 35 damage)
  Escapes combat

Day 1 (Evening): Arrives at destination
  HP: 65/100 (passive regen: +8 HP during travel)
  Evaluates: "I'm injured, should I rest?"
  Profit from trade: 350g
  Inn quality room: 50g
  Decision: "Yes, rest at inn"

Morgan rents quality room:
  8 hours sleep
  HP: 65 → 100 (10 HP/hour × 3.5 hours = fully healed)
  Fatigue: 0%
  Gold: 300g (spent 50g)

Day 2 (Morning): Morgan fully recovered
  Starts new trade route at full strength
```

---

## Conclusion

**Rest & Recovery System** adds **survival depth** to your pirate game:

**Strategic Resource Management:**
- Manage gold (inn costs) vs time (slow recovery) vs risk (wilderness camping)
- Plan provisions for long voyages
- Balance hunger, HP, and fatigue

**Immersive World:**
- Inns feel useful (not just decoration)
- NPCs have realistic routines (sleep, eat, rest)
- Settlements have purpose (safe rest locations)

**Gameplay Loops:**
1. Explore/trade/fight (take damage, consume provisions)
2. Find safe location (port, settlement, ship)
3. Rest and recover (sleep, eat, heal)
4. Resupply (buy provisions, food)
5. Continue adventure (refreshed and ready)

**Perfect Integration:**
- **Settlements:** Inns, taverns provide rest services
- **Economy:** Food trade, provision sales
- **Crafting:** Cooked food at inns/taverns
- **Combat:** Rest needed after battles
- **Radiant AI:** NPCs use same rest system

This creates a **living, breathing world** where health isn't just a number - it's managed through sleep, food, and rest! 🛏️🍖⚓
