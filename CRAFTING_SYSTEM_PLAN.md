# Crafting & Ship Building System
## Resource-Based Manufacturing for Pirate Sea

---

## Table of Contents
1. [Overview](#overview)
2. [Current Resources](#current-resources)
3. [Ship Building](#ship-building)
4. [Shipyard System](#shipyard-system)
5. [Craftable Items](#craftable-items)
6. [Crafting Mechanics](#crafting-mechanics)
7. [Recipe System](#recipe-system)
8. [Implementation Plan](#implementation-plan)

---

## Overview

**Crafting System** transforms raw resources into useful items, ships, and upgrades. Players can:
- **Build ships** at shipyards using wood, ore, and cloth
- **Craft tools** to improve gathering efficiency
- **Create weapons** for combat advantages
- **Upgrade ships** with better sails, hulls, cannons
- **Repair equipment** at reduced cost

### Why Crafting is Perfect for Your Game

✅ **Existing Resources**: Wood, stone, ore, reeds, etc.
✅ **Economy System**: Supply/demand pricing
✅ **Settlement System**: Shipyards and blacksmiths planned
✅ **Inventory System**: Player can carry resources

**Crafting Creates:**
- **Resource sinks** - Give resources value beyond trading
- **Player progression** - Build better ships over time
- **Strategic depth** - Should I sell ore or craft a cannon?
- **Self-sufficiency** - Less reliance on port merchants

---

## Current Resources

### Raw Materials (Already Implemented)

| Resource | Base Price | Source Biome | Use |
|----------|-----------|--------------|-----|
| **Wood** 🪵 | 10g | Forest, Jungle, Taiga | Ship hulls, tools, buildings |
| **Stone** 🪨 | 12g | Mountain, Desert | Ballast, cannonballs, buildings |
| **Ore** ⛏️ | 20g | Mountain | Metal parts, weapons, cannons |
| **Sand** 🏖️ | 6g | Beach, Desert | Glass (for lanterns, bottles) |
| **Berries** 🫐 | 8g | Forest, Jungle | Food, dye (sails) |
| **Hay** 🌾 | 7g | Savanna, Farm | Rope (when twisted into twine) |
| **Reeds** 🎋 | 9g | Swamp | Rope, baskets, cloth |

### New Processed Materials (To Add)

| Material | Recipe | Price | Use |
|----------|--------|-------|-----|
| **Rope** 🪢 | 5 hay + 5 reeds | 25g | Sails, rigging, nets |
| **Cloth** 🧵 | 10 reeds + 5 berries (dye) | 40g | Sails, flags |
| **Iron** 🔩 | 3 ore (smelted) | 70g | Cannons, anchors, nails |
| **Planks** 🪚 | 2 wood (processed) | 25g | Quality ship parts |
| **Cannonball** 💣 | 2 stone + 1 iron | 80g | Ammunition |
| **Glass** 🪟 | 5 sand (melted) | 20g | Lanterns, bottles |

---

## Ship Building

### Ship Types & Recipes

#### 1. **Dinghy** (Starter Ship)
**Stats:**
- Hull: 50 HP
- Speed: Fast (3 tiles/turn)
- Cargo: 50 units
- Cannons: 0

**Recipe:**
- 20 wood
- 5 rope
- 2 cloth (small sail)

**Cost to Craft:** ~300g (resources) vs ~500g (buy from port)
**Build Time:** 2 hours (120 turns)
**Built at:** Any shipyard

**Good for:** Early exploration, fishing, coastal trading

---

#### 2. **Sloop** (Small Merchant)
**Stats:**
- Hull: 100 HP
- Speed: Medium (2 tiles/turn)
- Cargo: 150 units
- Cannons: 2

**Recipe:**
- 50 wood
- 15 planks
- 10 rope
- 5 cloth
- 2 iron (fittings)

**Cost to Craft:** ~800g vs ~1500g (buy)
**Build Time:** 6 hours (360 turns)
**Built at:** Medium+ shipyard

**Good for:** Trading routes, light combat, general use

---

#### 3. **Brigantine** (Balanced Ship)
**Stats:**
- Hull: 150 HP
- Speed: Medium (2 tiles/turn)
- Cargo: 200 units
- Cannons: 6

**Recipe:**
- 80 wood
- 30 planks
- 20 rope
- 10 cloth
- 5 iron
- 4 cannonballs (cannons)

**Cost to Craft:** ~1800g vs ~3000g (buy)
**Build Time:** 12 hours (720 turns)
**Built at:** Large+ shipyard

**Good for:** Combat, large trades, pirate hunting

---

#### 4. **Galleon** (Heavy Merchant)
**Stats:**
- Hull: 250 HP
- Speed: Slow (1 tile/turn)
- Cargo: 500 units
- Cannons: 12

**Recipe:**
- 150 wood
- 50 planks
- 40 rope
- 20 cloth
- 15 iron
- 10 cannonballs

**Cost to Craft:** ~4500g vs ~8000g (buy)
**Build Time:** 24 hours (1440 turns)
**Built at:** Capital shipyard only

**Good for:** Bulk trading, fortress on water, end-game

---

#### 5. **War Frigate** (Combat Specialist)
**Stats:**
- Hull: 200 HP
- Speed: Fast (3 tiles/turn)
- Cargo: 100 units
- Cannons: 20

**Recipe:**
- 100 wood
- 40 planks
- 30 rope
- 15 cloth
- 25 iron (armor)
- 20 cannonballs

**Cost to Craft:** ~5000g vs ~10000g (buy)
**Build Time:** 30 hours (1800 turns)
**Built at:** Capital shipyard with naval contract

**Good for:** Pirate hunting, naval battles, faction wars

---

### Ship Comparison Table

| Ship | HP | Speed | Cargo | Cannons | Cost | Build Time |
|------|-----|-------|-------|---------|------|------------|
| Dinghy | 50 | 3 | 50 | 0 | 300g | 2h |
| Sloop | 100 | 2 | 150 | 2 | 800g | 6h |
| Brigantine | 150 | 2 | 200 | 6 | 1800g | 12h |
| Galleon | 250 | 1 | 500 | 12 | 4500g | 24h |
| War Frigate | 200 | 3 | 100 | 20 | 5000g | 30h |

---

## Shipyard System

### Shipyard Building

```javascript
{
    type: 'shipyard',
    tier: 'medium', // small, medium, large, capital
    x: 45,
    y: 23,
    workers: [
        {type: 'shipwright', skill: 85},
        {type: 'shipwright', skill: 72},
        {type: 'apprentice', skill: 45}
    ],
    currentProjects: [],
    availableBlueprints: ['dinghy', 'sloop', 'brigantine'],
    char: 'Y',
    color: '#8B4513'
}
```

### Shipyard Tiers

#### **Small Shipyard** (Hamlet/Village)
- **Workers:** 1 shipwright
- **Can Build:** Dinghy, Sloop
- **Build Speed:** 1.0x (normal)
- **Quality:** Standard (ships start at 90% HP)
- **Found on:** Small islands (30-80 tiles)

---

#### **Medium Shipyard** (Town)
- **Workers:** 2 shipwrights
- **Can Build:** Dinghy, Sloop, Brigantine
- **Build Speed:** 1.2x (20% faster)
- **Quality:** Good (ships start at 95% HP)
- **Found on:** Medium islands (80-150 tiles)

---

#### **Large Shipyard** (City)
- **Workers:** 3-4 shipwrights
- **Can Build:** Dinghy, Sloop, Brigantine, Galleon
- **Build Speed:** 1.5x (50% faster)
- **Quality:** Excellent (ships start at 100% HP)
- **Found on:** Large islands (150-300 tiles)

---

#### **Capital Shipyard** (Metropolis)
- **Workers:** 5-8 shipwrights
- **Can Build:** All ships including War Frigate
- **Build Speed:** 2.0x (double speed!)
- **Quality:** Masterwork (ships start at 110% HP + bonuses)
- **Special:** Can commission custom ships
- **Found on:** Huge islands (>300 tiles)

---

### Shipyard UI & Interaction

**Player at Shipyard:**
```
╔════════════════════════════════════════════╗
║     HAVEN'S REST SHIPYARD (Medium Tier)    ║
╠════════════════════════════════════════════╣
║                                            ║
║  Available Ships:                          ║
║                                            ║
║  [1] Dinghy                                ║
║      Resources: 20 wood, 5 rope, 2 cloth   ║
║      Cost: 300g (or provide materials)     ║
║      Build Time: 2 hours                   ║
║      You have: ✓ wood, ✗ rope, ✗ cloth    ║
║                                            ║
║  [2] Sloop                                 ║
║      Resources: 50 wood, 15 planks, ...    ║
║      Cost: 800g (or provide materials)     ║
║      Build Time: 6 hours (5h with bonus)   ║
║      You have: ✓ wood, ✗ planks, ✗ rope   ║
║                                            ║
║  [3] Brigantine                            ║
║      Resources: 80 wood, 30 planks, ...    ║
║      Cost: 1800g (or provide materials)    ║
║      Build Time: 12 hours (10h with bonus) ║
║      You have: ✗ Insufficient materials    ║
║                                            ║
║  Current Projects:                         ║
║  • Sloop for Merchant John - 3h remaining ║
║                                            ║
║  [B]uild  [R]epair  [U]pgrade  [Q]uit      ║
╚════════════════════════════════════════════╝
```

---

### Crafting Options

**Option 1: Pay Gold (Expensive)**
```
Player: "Build me a sloop"
Shipyard: "That will be 800g. Deal?"
Player: [Pays 800g]
Shipyard: "Come back in 5 hours!" (Build time with bonus)
```

**Option 2: Provide Materials (Cheaper)**
```
Player: "I have materials for a sloop"
Shipyard: "Let me see... You have:
  50 wood ✓
  15 planks ✗ (you have 0)
  10 rope ✗ (you have 3)
  5 cloth ✗ (you have 0)
  2 iron ✗ (you have 0)

Missing items will cost 300g. Deal?"
Player: [Pays 300g + provides 50 wood + 3 rope]
Shipyard: "Come back in 5 hours!"
```

**Option 3: Craft Materials First**
```
Player: "Can I make planks here?"
Shipyard: "Yes! Planks cost 2 wood each. You have 100 wood.
  How many planks? [Enter number]"
Player: "15"
Shipyard: "Here are 15 planks! (used 30 wood)"
Player: "Now build me a sloop with these planks"
[Proceeds with reduced cost since player has more materials]
```

---

### Ship Quality & Bonuses

**Shipyard Tier Affects Quality:**

**Small Shipyard:**
- Ships start at 90% max HP
- Example: Sloop built = 90 HP instead of 100 HP
- Cheaper but lower quality

**Medium Shipyard:**
- Ships start at 95% max HP
- Sloop = 95 HP
- Standard quality

**Large Shipyard:**
- Ships start at 100% max HP
- Sloop = 100 HP
- High quality

**Capital Shipyard:**
- Ships start at 110% max HP
- Sloop = 110 HP!
- Bonus stats:
  - +10% cargo capacity
  - +1 cannon slot
  - Better armor (take 5% less damage)

**Player Choice:**
- Build cheap at small shipyard = weaker ship
- Travel to capital shipyard = expensive but powerful ship

---

## Craftable Items

### Tools (Improve Gathering)

#### **Axe** 🪓
**Recipe:**
- 5 wood (handle)
- 2 iron (head)

**Effect:** +50% wood gathering speed
**Durability:** 100 uses
**Cost:** ~160g

---

#### **Pickaxe** ⛏️
**Recipe:**
- 5 wood
- 3 iron

**Effect:** +50% stone/ore gathering speed
**Durability:** 100 uses
**Cost:** ~220g

---

#### **Fishing Rod** 🎣
**Recipe:**
- 3 wood
- 2 rope

**Effect:** Can fish from ship (gain food resource)
**Durability:** Unlimited (doesn't break)
**Cost:** ~80g

---

#### **Scythe** 🌾
**Recipe:**
- 3 wood
- 2 iron

**Effect:** +50% berries/hay gathering
**Durability:** 100 uses
**Cost:** ~160g

---

### Weapons (Combat Bonuses)

#### **Cutlass** ⚔️
**Recipe:**
- 1 wood (handle)
- 3 iron (blade)

**Effect:** +20% boarding attack damage
**Durability:** 50 combats
**Cost:** ~220g

---

#### **Pistol** 🔫
**Recipe:**
- 5 iron (mechanism)
- 2 wood (grip)
- 3 cannonballs (ammo)

**Effect:** +30% ranged attack, can fire before boarding
**Durability:** 30 shots
**Cost:** ~450g

---

#### **Cannon** 🔥
**Recipe:**
- 10 iron (barrel)
- 5 wood (mount)
- 10 cannonballs (ammo)

**Effect:** Add 1 cannon to ship (if space available)
**Durability:** Permanent (ammo consumed)
**Cost:** ~1000g

---

### Ship Upgrades (Permanent Improvements)

#### **Reinforced Hull** 🛡️
**Recipe:**
- 30 planks
- 10 iron (plating)

**Effect:** +25% max HP to current ship
**Installation Time:** 4 hours at shipyard
**Cost:** ~1200g

---

#### **Speed Sails** 🏃
**Recipe:**
- 20 cloth (silk sails)
- 15 rope (rigging)

**Effect:** +1 movement speed
**Installation Time:** 3 hours at shipyard
**Cost:** ~900g

---

#### **Cargo Hold Expansion** 📦
**Recipe:**
- 40 wood (deck expansion)
- 20 planks (supports)

**Effect:** +50% cargo capacity
**Installation Time:** 6 hours at shipyard
**Cost:** ~1000g

---

#### **Gun Deck** 💥
**Recipe:**
- 50 iron (reinforcement)
- 30 planks (deck)
- 20 cannonballs (test ammo)

**Effect:** +4 cannon slots
**Installation Time:** 12 hours at large+ shipyard
**Cost:** ~2500g

---

### Consumables (Single Use)

#### **Repair Kit** 🔧
**Recipe:**
- 10 wood
- 5 planks
- 3 rope
- 2 iron (nails)

**Effect:** Repairs 30 HP anywhere (no shipyard needed!)
**Uses:** 1
**Cost:** ~300g (vs ~600g at port repair)

---

#### **Speed Boost Potion** ⚡
**Recipe:**
- 5 berries (rum base)
- 3 reeds (fermentation)
- 1 glass bottle

**Effect:** +2 movement speed for 10 turns
**Uses:** 1
**Cost:** ~120g

---

#### **Treasure Map** 🗺️
**Recipe:**
- 1 glass bottle
- 5 sand (ink)
- 3 reeds (paper)

**Effect:** Reveals location of nearest treasure
**Uses:** 1
**Cost:** ~80g

---

## Crafting Mechanics

### Crafting Stations

Different items require different stations:

| Station | Items Craftable | Found At |
|---------|----------------|----------|
| **Shipyard** | Ships, ship upgrades, repair kits | Settlements |
| **Blacksmith** | Tools, weapons, iron, cannonballs | Towns/Cities |
| **Weaver** | Cloth, rope, sails | Villages+ |
| **Carpenter** | Planks, furniture, barrels | All settlements |
| **Alchemist** | Potions, dyes, glass | Towns+ |
| **Anywhere** | Basic items (rope from hay+reeds) | Player inventory |

---

### Crafting UI

**At Blacksmith:**
```
╔════════════════════════════════════════════╗
║         BLACKSMITH - IRON WORKS            ║
╠════════════════════════════════════════════╣
║  What would you like to craft?             ║
║                                            ║
║  TOOLS:                                    ║
║  [1] Axe (5 wood, 2 iron) - 160g          ║
║      You have: ✓ wood, ✗ iron             ║
║                                            ║
║  [2] Pickaxe (5 wood, 3 iron) - 220g      ║
║      You have: ✓ wood, ✗ iron             ║
║                                            ║
║  WEAPONS:                                  ║
║  [3] Cutlass (1 wood, 3 iron) - 220g      ║
║      You have: ✓ wood, ✗ iron             ║
║                                            ║
║  [4] Cannon (10 iron, 5 wood, 10 balls)   ║
║      You have: ✗ Insufficient materials    ║
║                                            ║
║  MATERIALS:                                ║
║  [5] Smelt Iron (3 ore → 1 iron) - 20g    ║
║      You have: ✓ ore (15 units)            ║
║                                            ║
║  [6] Forge Cannonballs (2 stone, 1 iron)  ║
║      You have: ✓ stone, ✗ iron            ║
║                                            ║
║  [Q]uit                                    ║
╚════════════════════════════════════════════╝
```

**Selection:**
```
You selected: Axe
Required: 5 wood, 2 iron
You have: 50 wood, 0 iron

Missing: 2 iron (costs 140g to buy)

Options:
[1] Buy missing materials for 140g and craft
[2] Smelt ore first (3 ore → 1 iron, 20g fee)
[3] Cancel

Your choice: 2

Smelting 6 ore → 2 iron (cost: 40g)
Crafting Axe (cost: 0g, using your materials)
Total cost: 40g

Axe crafted! Added to inventory.
```

---

### Crafting Speed & Quality

**Base Crafting Time:**
- Simple items (rope, planks): Instant
- Tools/weapons: 30 minutes (180 turns)
- Ships: 2-30 hours (depends on type)
- Ship upgrades: 3-12 hours

**Station Quality Affects Results:**
- **Makeshift** (player crafting): -10% quality
- **Basic** (small settlement): Normal quality
- **Advanced** (town): +10% quality, 20% faster
- **Master** (capital): +25% quality, 50% faster

**Example:**
- Axe crafted by player: 90 uses (instead of 100)
- Axe at basic blacksmith: 100 uses
- Axe at master blacksmith: 125 uses

---

## Recipe System

### Recipe Discovery

**How Players Learn Recipes:**

1. **Starting Recipes** (Known from beginning)
   - Rope (hay + reeds)
   - Basic repair kit
   - Dinghy (if at shipyard)

2. **NPC Teaching** (Talk to specialists)
   - Blacksmith teaches tool/weapon recipes
   - Shipwright teaches ship recipes
   - Alchemist teaches potion recipes

3. **Books/Scrolls** (Find in treasure)
   - "Advanced Shipbuilding" → Learn Galleon recipe
   - "Weapon Crafting Manual" → Learn Cannon recipe
   - "Alchemy Guide" → Learn Speed Potion recipe

4. **Experimentation** (Try combinations)
   - Mix wood + iron = random chance to discover axe
   - Mix ore + furnace = discover smelting
   - Rare chance of discovering unknown recipe

---

### Recipe Book

```javascript
const RECIPES = {
    // PROCESSED MATERIALS
    rope: {
        name: 'Rope',
        category: 'materials',
        station: 'anywhere',
        ingredients: {
            hay: 5,
            reeds: 5
        },
        output: { rope: 1 },
        time: 0, // Instant
        skill: 0,
        value: 25
    },

    cloth: {
        name: 'Cloth',
        category: 'materials',
        station: 'weaver',
        ingredients: {
            reeds: 10,
            berries: 5 // For dye
        },
        output: { cloth: 1 },
        time: 300, // 30 minutes
        skill: 20,
        value: 40
    },

    iron: {
        name: 'Iron Bar',
        category: 'materials',
        station: 'blacksmith',
        ingredients: {
            ore: 3
        },
        output: { iron: 1 },
        time: 120, // 12 minutes
        skill: 30,
        value: 70
    },

    planks: {
        name: 'Wooden Planks',
        category: 'materials',
        station: 'carpenter',
        ingredients: {
            wood: 2
        },
        output: { planks: 1 },
        time: 60, // 6 minutes
        skill: 10,
        value: 25
    },

    // SHIPS
    dinghy: {
        name: 'Dinghy',
        category: 'ships',
        station: 'shipyard',
        ingredients: {
            wood: 20,
            rope: 5,
            cloth: 2
        },
        output: {
            ship: {
                type: 'dinghy',
                hp: 50,
                maxHp: 50,
                speed: 3,
                cargo: 50,
                cannons: 0
            }
        },
        time: 7200, // 2 hours
        skill: 40,
        value: 300
    },

    sloop: {
        name: 'Sloop',
        category: 'ships',
        station: 'shipyard',
        tierRequired: 'medium',
        ingredients: {
            wood: 50,
            planks: 15,
            rope: 10,
            cloth: 5,
            iron: 2
        },
        output: {
            ship: {
                type: 'sloop',
                hp: 100,
                maxHp: 100,
                speed: 2,
                cargo: 150,
                cannons: 2
            }
        },
        time: 21600, // 6 hours
        skill: 60,
        value: 800
    },

    // TOOLS
    axe: {
        name: 'Axe',
        category: 'tools',
        station: 'blacksmith',
        ingredients: {
            wood: 5,
            iron: 2
        },
        output: {
            axe: {
                gatherBonus: 0.5, // +50% wood gathering
                durability: 100
            }
        },
        time: 1800, // 30 minutes
        skill: 25,
        value: 160
    },

    // UPGRADES
    reinforced_hull: {
        name: 'Reinforced Hull',
        category: 'upgrades',
        station: 'shipyard',
        tierRequired: 'medium',
        ingredients: {
            planks: 30,
            iron: 10
        },
        output: {
            upgrade: {
                type: 'hull',
                hpBonus: 0.25 // +25% max HP
            }
        },
        time: 14400, // 4 hours
        skill: 70,
        value: 1200
    }
};
```

---

## Implementation Plan

### **Phase 1: Recipe & Crafting Core** (Week 1)

#### Day 1-2: Recipe System
**File:** `crafting.js`

**Tasks:**
- [ ] Create `Recipe` class
- [ ] Define all recipes in data structure
- [ ] Implement recipe validation (has ingredients?)
- [ ] Add recipe discovery system

**Success Criteria:**
- Recipe data loaded
- Can check if player can craft item
- Recipe book accessible

---

#### Day 3-4: Basic Crafting
**File:** `crafting.js`, `crafting-ui.js`

**Tasks:**
- [ ] Implement crafting logic (consume resources, produce item)
- [ ] Add crafting UI (list recipes, select, confirm)
- [ ] Integrate with player inventory
- [ ] Add crafting stations check

**Success Criteria:**
- Player can craft rope, planks, iron
- Crafting UI shows available recipes
- Resources consumed, items produced

---

### **Phase 2: Shipyard & Ship Building** (Week 2)

#### Day 5-7: Shipyard Implementation
**Files:** `shipyard.js`, `ship-builder.js`

**Tasks:**
- [ ] Create `Shipyard` building class
- [ ] Add shipyard to settlement generation
- [ ] Implement ship building queue
- [ ] Add build time tracking (hours → turns)
- [ ] Create ship building UI

**Success Criteria:**
- Shipyards appear in settlements
- Player can order ship construction
- Ships built over time
- Player notified when ship complete

---

#### Day 8-9: Ship Crafting
**Tasks:**
- [ ] Implement 5 ship types (dinghy → war frigate)
- [ ] Add ship quality based on shipyard tier
- [ ] Create ship delivery system
- [ ] Add ship spawning when built

**Success Criteria:**
- All 5 ship types craftable
- Ships spawn with correct stats
- Quality bonuses apply

---

### **Phase 3: Tools, Weapons, Upgrades** (Week 3)

#### Day 10-12: Tools & Weapons
**Files:** `tools.js`, `weapons.js`

**Tasks:**
- [ ] Implement tool crafting (axe, pickaxe, fishing rod, scythe)
- [ ] Add tool effects (gathering bonuses)
- [ ] Create weapon crafting (cutlass, pistol, cannon)
- [ ] Add weapon effects to combat
- [ ] Implement durability system

**Success Criteria:**
- Tools improve gathering (observable)
- Weapons improve combat
- Durability tracked and items break

---

#### Day 13-14: Ship Upgrades
**Files:** `ship-upgrades.js`

**Tasks:**
- [ ] Implement 4 upgrade types
- [ ] Add upgrade installation (takes time)
- [ ] Apply upgrade bonuses to ships
- [ ] Prevent duplicate upgrades
- [ ] Add upgrade UI at shipyard

**Success Criteria:**
- Upgrades installable
- Ship stats improve
- Bonuses persist

---

### **Phase 4: Advanced Crafting** (Week 4+)

#### Day 15+: Polish & Features
**Tasks:**
- [ ] Add consumables (repair kits, potions, maps)
- [ ] Implement crafting skills (improve with use)
- [ ] Add bulk crafting ("Make 10 rope")
- [ ] Create crafting achievements
- [ ] Add custom ship commissioning

---

## Integration Examples

### Example 1: Player Builds First Ship

```
Turn 1: Player arrives at Haven's Rest (medium village)
Turn 2: Player enters shipyard
        Sees: Dinghy (300g), Sloop (800g), Brigantine (1800g)
Turn 3: Player checks inventory
        Has: 50 wood, 15 ore, 200g
Turn 4: Player: "I want to build a dinghy"
        Shipyard: "You need: 20 wood ✓, 5 rope ✗, 2 cloth ✗"
Turn 5: Player goes to weaver
        Weaver: "Cloth costs 10 reeds + 5 berries"
        Player: "I don't have those"
Turn 6: Player decides to gather reeds at nearby swamp
Turn 7-20: Player gathers 15 reeds, 10 berries
Turn 21: Player returns to weaver
         Weaver crafts: 1 cloth (used 10 reeds, 5 berries)
Turn 22: Player: "I still need 1 more cloth and 5 rope"
Turn 23: Player gathers more resources...
Turn 30: Player finally has: 2 cloth, 5 rope, 20 wood
Turn 31: Player returns to shipyard
         Shipyard: "You have all materials! Labor fee: 100g"
         Player pays 100g
Turn 32: Shipyard: "Come back in 2 hours!" (120 turns)
Turn 152: Player returns
          Shipyard: "Your dinghy is ready!"
          New ship spawned in harbor
Turn 153: Player boards ship, sets sail!

Result: Player built ship for 100g + time instead of 300g
        Learned value of resource gathering and crafting
```

---

### Example 2: Merchant NPC Commissions Ship

```
Turn 1: Merchant "Captain Morgan" arrives at Port Royal
Turn 2: Morgan has 2000g profit from recent trades
Turn 3: Morgan decides to expand fleet
Turn 4: Morgan visits shipyard
        Shipyard: "Sloop costs 800g and 6 hours"
Turn 5: Morgan: "Build me a sloop" (pays 800g)
Turn 6: Shipyard adds to queue
        Queue: [Sloop for Morgan - 6h remaining]
Turn 360: Sloop completed
Turn 361: Morgan notified, picks up ship
Turn 362: Morgan now has 2 ships!
          Can run 2 trade routes simultaneously
          Economy becomes more dynamic

Result: NPCs use shipyards too!
        Creates living economy
        Player can observe NPC ships being built
```

---

## Conclusion

**Crafting & Ship Building** transforms your game from simple trading into a **production economy** where:
- Players can build instead of buy (cheaper, more rewarding)
- Resources have value beyond trading (craft or sell decision)
- Progression feels earned (build better ships over time)
- Settlements have functional buildings (shipyards, blacksmiths)
- NPCs participate in economy (merchants commission ships)

**Perfect Synergy with Other Systems:**
- **Settlements:** Shipyards, blacksmiths, weavers provide crafting
- **Radiant AI:** Merchants commission ships, pirates steal materials
- **Economy:** Resource demand increases (villages need wood for ships)
- **Progression:** Better ships unlock new gameplay (faster trade, combat)

**Next Step:** Start with `crafting.js` - implement recipe system and basic crafting (rope, planks, iron). Then add shipyard system.

This creates a **satisfying gameplay loop:**
1. Gather resources
2. Craft materials
3. Build better ship
4. Access new areas/opportunities
5. Repeat with even better ships!

🛠️⚓
