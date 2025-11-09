# Settlement Simulation System
## Living Villages for Pirate Sea

---

## Table of Contents
1. [Overview](#overview)
2. [Current System Integration](#current-system-integration)
3. [Building Types](#building-types)
4. [Villager NPCs](#villager-npcs)
5. [Daily Schedules](#daily-schedules)
6. [Settlement Generation](#settlement-generation)
7. [Integration with Economy](#integration-with-economy)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

**Settlement Simulation** transforms static ports into living villages where NPCs:
- **Gather resources** during the day (mining, chopping, fishing, harvesting)
- **Sleep in huts** at night
- **Supply the port economy** with resources they gather
- **Follow daily schedules** based on time of day
- **React to player** presence and actions

### Why This is Perfect for Your Game

✅ **You Already Have:**
- Time of day system (0-24 hours, 6 min/turn)
- Day/night periods (Dawn, Morning, Afternoon, Dusk, Night)
- Resource types and biome-based distribution
- Port economy with production rates
- Named islands and ports

**This System Explains:**
- Where port resources come from (villagers gather them!)
- Why ports produce certain resources (based on villager activity)
- Why islands feel alive (visible NPCs working)

---

## Current System Integration

### ✅ Time System (Already Exists!)

Your `fog.js` has a perfect time-of-day system:
```javascript
timeOfDay: 0-24 (hours)
Periods:
- Dawn: 5-8 AM
- Morning: 8-12 AM
- Afternoon: 12-6 PM
- Dusk: 6-10 PM
- Night: 10 PM - 5 AM
```

**Perfect for villager schedules:**
- **6 AM - 6 PM:** Work (gathering, crafting, trading)
- **6 PM - 8 PM:** Leisure (tavern, docks)
- **8 PM - 6 AM:** Sleep (in huts)

### ✅ Resource System (Already Exists!)

Your `economy.js` and `resource-manager.js` already have:
- Resource types: wood, berries, stone, sand, ore, hay, reeds
- Biome-based resources (forest→wood, mountain→ore)
- Production rates (units per hour)

**Villagers will:**
- Gather these resources from biome tiles
- Deliver them to port warehouse
- Port inventory fills from villager labor (not magic regeneration!)

---

## Building Types

### Core Buildings (Essential for MVP)

#### 1. **Residential Huts** 🏠
**Purpose:** Where villagers sleep

**Variants:**
- **Thatch Hut** (small islands) - 1 villager
- **Wood Cabin** (medium islands) - 2 villagers
- **Stone House** (large islands) - 3 villagers

**Functionality:**
- Villagers pathfind here at night (8 PM - 6 AM)
- Villagers are "hidden" inside (don't render)
- Morning spawns villagers outside

**Placement:** Near port, on beach/forest tiles

---

#### 2. **Resource Buildings** ⛏️

**Lumber Camp** (forest biome)
- **Workers:** 2-4 lumberjacks
- **Activity:** Chop trees, collect wood
- **Production:** 5-10 wood/hour
- **Glyph:** `L` (brown)

**Quarry** (mountain/desert biome)
- **Workers:** 2-3 miners
- **Activity:** Mine stone/ore
- **Production:** 3-7 stone/hour, 1-3 ore/hour
- **Glyph:** `Q` (gray)

**Farm** (savanna/grassland biome)
- **Workers:** 2-4 farmers
- **Activity:** Harvest crops
- **Production:** 8-12 berries/hay per hour
- **Glyph:** `F` (green)

**Fishing Dock** (coastal ocean)
- **Workers:** 1-3 fishermen
- **Activity:** Fish from dock
- **Production:** 5-8 fish/hour (new resource!)
- **Glyph:** `D` (blue)

---

#### 3. **Port Warehouse** 📦
**Purpose:** Central storage for gathered resources

**Functionality:**
- Villagers deliver resources here
- Port's inventory stored here
- Player can trade here
- Larger islands = bigger warehouse

**Capacity:**
- Small island: 50 units
- Medium: 100 units
- Large: 200 units
- Huge: 500 units

**Glyph:** `W` (orange)
**Placement:** Adjacent to port (P)

---

#### 4. **Tavern** 🍺
**Purpose:** Social hub, leisure activity

**Functionality:**
- Villagers visit during dusk (6-8 PM)
- Merchants rest here
- Player can get quests here
- Rumors and information

**Activities:**
- Villagers drink and socialize
- Merchants share trade info
- Quest givers post missions

**Glyph:** `T` (red)
**Placement:** Near port, central location

---

### Advanced Buildings (Future Expansion)

#### 5. **Shipyard** ⚓
**Purpose:** Build and repair ships

**Functionality:**
- Repairs ships (cheaper than port)
- NPCs can commission ships
- Employment for shipwrights

**Workers:** 2-3 shipwrights
**Glyph:** `Y` (brown)

---

#### 6. **Market Square** 🏪
**Purpose:** Trading and bartering

**Functionality:**
- Villagers trade with each other
- Player can buy/sell directly to villagers (no port fee)
- Dynamic prices based on local supply

**Glyph:** `M` (yellow)

---

#### 7. **Guard Tower** 🗼
**Purpose:** Defense against pirates

**Functionality:**
- Guards patrol settlement
- Warn of approaching pirate ships
- Increase settlement safety

**Workers:** 1-2 guards
**Glyph:** `G` (red)

---

#### 8. **Blacksmith** ⚒️
**Purpose:** Craft tools and weapons

**Functionality:**
- Converts ore → tools
- Repair equipment
- Employment for blacksmiths

**Workers:** 1-2 blacksmiths
**Glyph:** `B` (dark gray)

---

## Villager NPCs

### Villager Types

#### 1. **Lumberjack** 🪓
```javascript
{
    type: 'lumberjack',
    homeBuilding: 'hut_01',
    workBuilding: 'lumber_camp_01',
    schedule: {
        '6-12': 'work',    // Morning: chop trees
        '12-13': 'break',  // Lunch at tavern
        '13-18': 'work',   // Afternoon: chop trees
        '18-20': 'leisure', // Tavern
        '20-6': 'sleep'    // Home
    },
    inventory: {
        wood: 0,
        maxCapacity: 20
    },
    gatherRate: 2, // wood per hour
    glyph: '♣', // When working
    color: '#8B4513'
}
```

**Behavior:**
- 6 AM: Leave hut, pathfind to lumber camp
- 6-12 AM: Chop nearby forest tiles (animated)
- 12 PM: Walk to tavern for lunch
- 1 PM: Return to lumber camp
- 1-6 PM: Chop more trees
- 6 PM: Deliver wood to warehouse
- 6-8 PM: Socialize at tavern
- 8 PM: Return home, sleep

---

#### 2. **Miner** ⛏️
```javascript
{
    type: 'miner',
    workBuilding: 'quarry_01',
    gatherRate: 1.5, // stone/ore per hour
    resources: ['stone', 'ore'],
    glyph: '▲',
    color: '#808080'
}
```

**Behavior:**
- Works at quarry near mountains
- Mines stone and ore
- Delivers to warehouse at end of shift

---

#### 3. **Farmer** 🌾
```javascript
{
    type: 'farmer',
    workBuilding: 'farm_01',
    gatherRate: 3, // berries/hay per hour
    resources: ['berries', 'hay'],
    glyph: '♠',
    color: '#228B22'
}
```

**Behavior:**
- Works on farm tiles
- Harvests crops
- Delivers to warehouse

---

#### 4. **Fisherman** 🎣
```javascript
{
    type: 'fisherman',
    workBuilding: 'fishing_dock_01',
    gatherRate: 2, // fish per hour
    resources: ['fish'],
    glyph: '~',
    color: '#4682B4'
}
```

**Behavior:**
- Stands on dock
- Fishes from ocean
- Delivers to warehouse

---

## Daily Schedules

### Schedule System

```javascript
class VillagerSchedule {
    constructor(villager) {
        this.villager = villager;
        this.currentActivity = 'sleep';
        this.currentLocation = villager.homeBuilding;
    }

    update(timeOfDay) {
        const hour = Math.floor(timeOfDay);

        // Determine current activity based on time
        if (hour >= 6 && hour < 12) {
            this.setActivity('work_morning');
        } else if (hour >= 12 && hour < 13) {
            this.setActivity('lunch');
        } else if (hour >= 13 && hour < 18) {
            this.setActivity('work_afternoon');
        } else if (hour >= 18 && hour < 20) {
            this.setActivity('leisure');
        } else {
            this.setActivity('sleep');
        }
    }

    setActivity(activity) {
        if (this.currentActivity === activity) return;

        this.currentActivity = activity;

        // Pathfind to appropriate location
        switch(activity) {
            case 'work_morning':
            case 'work_afternoon':
                this.villager.pathfindTo(this.villager.workBuilding);
                break;
            case 'lunch':
            case 'leisure':
                this.villager.pathfindTo(settlement.tavern);
                break;
            case 'sleep':
                this.villager.pathfindTo(this.villager.homeBuilding);
                this.villager.visible = false; // Hide inside
                break;
        }
    }
}
```

### Example Day in the Life

**"Jack the Lumberjack" on a Medium Island:**

```
5:00 AM - Still sleeping in hut (invisible)
6:00 AM - Wakes up, exits hut, appears on map
6:15 AM - Walks to lumber camp (5 tiles away)
6:30 AM - Arrives, starts chopping trees
7:00 AM - Inventory: 1 wood
8:00 AM - Inventory: 3 wood
9:00 AM - Inventory: 5 wood
10:00 AM - Inventory: 7 wood
11:00 AM - Inventory: 9 wood
12:00 PM - Walks to tavern for lunch
12:30 PM - Eating at tavern (social interaction)
1:00 PM - Returns to lumber camp
2:00 PM - Inventory: 11 wood
3:00 PM - Inventory: 13 wood
4:00 PM - Inventory: 15 wood
5:00 PM - Inventory: 17 wood
6:00 PM - Delivers 17 wood to warehouse
        - Warehouse: wood +17
        - Port economy: wood stock increases
6:15 PM - Walks to tavern
6:30 PM - Drinks and socializes
8:00 PM - Walks home to hut
8:30 PM - Enters hut, disappears from map (sleeping)
```

**Result:** Port gains 17 wood per day from Jack alone. 4 lumberjacks = 68 wood/day!

---

## Settlement Generation

### Procedural Settlement Placement

```javascript
class SettlementGenerator {
    constructor(mapGenerator, economyManager) {
        this.mapGenerator = mapGenerator;
        this.economyManager = economyManager;
    }

    generateSettlementForPort(port, island) {
        // Determine settlement size based on island size
        const settlementSize = this.getSettlementSize(island.size);

        // Find suitable building locations near port
        const buildingLocations = this.findBuildingLocations(
            port.x, port.y, island, settlementSize
        );

        // Create buildings based on island resources
        const buildings = this.createBuildings(
            island, buildingLocations, settlementSize
        );

        // Spawn villagers for each building
        const villagers = this.spawnVillagers(buildings, island);

        return {
            port: port,
            island: island,
            buildings: buildings,
            villagers: villagers,
            size: settlementSize
        };
    }

    getSettlementSize(islandSize) {
        if (islandSize < 30) return 'hamlet';      // 2-3 huts, 1 resource building
        if (islandSize < 80) return 'village';     // 5-8 huts, 2-3 resource buildings
        if (islandSize < 150) return 'town';       // 10-15 huts, 4-6 resource buildings
        if (islandSize < 300) return 'city';       // 20-30 huts, 8-12 resource buildings
        return 'metropolis';                       // 40+ huts, 15+ resource buildings
    }

    createBuildings(island, locations, size) {
        const buildings = [];

        // Always create: Port, Warehouse, Tavern
        buildings.push(this.createWarehouse(locations.shift()));
        buildings.push(this.createTavern(locations.shift()));

        // Create resource buildings based on island biomes
        for (const [biome, count] of Object.entries(island.biomes)) {
            if (biome === 'forest' && count > 10) {
                buildings.push(this.createLumberCamp(locations.shift(), biome));
            }
            if (biome === 'mountain' && count > 5) {
                buildings.push(this.createQuarry(locations.shift(), biome));
            }
            if (biome === 'savanna' && count > 15) {
                buildings.push(this.createFarm(locations.shift(), biome));
            }
        }

        // Create fishing docks if coastal
        if (this.hasOceanAccess(island)) {
            buildings.push(this.createFishingDock(locations.shift()));
        }

        // Create huts for workers
        const workerCount = this.calculateWorkerCount(buildings);
        const hutCount = Math.ceil(workerCount / 2); // 2 villagers per hut

        for (let i = 0; i < hutCount; i++) {
            buildings.push(this.createHut(locations.shift()));
        }

        return buildings;
    }

    spawnVillagers(buildings, island) {
        const villagers = [];

        // Spawn workers for each resource building
        for (const building of buildings) {
            if (building.type === 'lumber_camp') {
                const workerCount = 2 + Math.floor(Math.random() * 3); // 2-4
                for (let i = 0; i < workerCount; i++) {
                    villagers.push(this.createLumberjack(building, island));
                }
            }
            // Similar for miners, farmers, fishermen...
        }

        return villagers;
    }
}
```

### Settlement Layout Examples

#### **Small Island (20 tiles) - Hamlet**
```
    ~~~~~
   ~~🏠🏠~
  ~~P W T~    P = Port
  ~~~ L ~~    W = Warehouse
   ~~~~~      T = Tavern
              L = Lumber Camp
              🏠 = Huts (2)

Workers: 2 lumberjacks
Daily Production: ~10 wood
```

#### **Medium Island (60 tiles) - Village**
```
   ~~~~~~~~~~
  ~~🏠🏠🏠🏠~~
 ~~F F L L ~~   F = Farm
 ~~P W T Q ~~   L = Lumber Camp
  ~~🏠🏠D~~~    Q = Quarry
   ~~~~~~~~     D = Fishing Dock
                🏠 = Huts (6)

Workers: 2 farmers, 2 lumberjacks, 2 miners, 1 fisherman
Daily Production: 15 berries, 12 wood, 8 stone, 10 fish
```

#### **Large Island (120 tiles) - Town**
```
     ~~~~~~~~~~~~~
    ~~🏠🏠🏠🏠🏠🏠~~
   ~~F F F L L L~~
  ~~G P W T M Q Q~   G = Guard Tower
  ~~🏠🏠🏠🏠Y D D~   M = Market
   ~~~~~~~~~~~~~~     Y = Shipyard

Workers: 15+ villagers across multiple professions
Daily Production: 40+ resources per day
```

---

## Integration with Economy

### How Settlements Supply Ports

**Current System (Magic):**
```javascript
// Port inventory magically regenerates
port.economy.inventory[resource] += productionRate * deltaHours;
```

**New System (Villager Labor):**
```javascript
// Villagers gather resources
villager.gather(); // Adds to villager inventory

// Villagers deliver to warehouse
villager.deliverToWarehouse(); // Transfers to warehouse

// Warehouse supplies port
warehouse.transferToPort(); // Port inventory updated
```

### Resource Flow

```
┌──────────────┐
│  Forest/     │
│  Mountain/   │──gather──▶ ┌──────────┐
│  Farm Tiles  │            │ Villager │
└──────────────┘            │ (20 wood)│
                            └─────┬────┘
                                  │
                            deliver
                                  │
                                  ▼
                            ┌──────────┐
                            │Warehouse │
                            │(500 wood)│
                            └─────┬────┘
                                  │
                            transfer
                                  │
                                  ▼
                            ┌──────────┐
                            │   Port   │
                            │ Economy  │──trade──▶ Player/Merchants
                            │(200 wood)│
                            └──────────┘
```

### Dynamic Economy Effects

**More Workers = More Production:**
- 2 lumberjacks: 10 wood/day
- 4 lumberjacks: 20 wood/day
- Large town: 50+ wood/day

**Player Can Affect Production:**
- Help villagers (bonus reputation)
- Hire villagers for quests (reduces production)
- Attack settlement (stops production, negative reputation)

**Pirate Raids:**
- Pirates can attack settlements
- Villagers flee/hide
- Production halts
- Port offers bounty quest to clear pirates

---

## Implementation Roadmap

### **Phase 1: Basic Buildings** (Week 1)

#### Day 1-2: Building System
**File:** `building.js`

**Tasks:**
- [ ] Create `Building` base class
- [ ] Implement building types (hut, warehouse, lumber camp)
- [ ] Add building placement system
- [ ] Integrate with entity manager

**Success Criteria:**
- Buildings can be placed on map
- Buildings render with unique glyphs
- Buildings stored and tracked

---

#### Day 3-4: Settlement Generation
**File:** `settlement-generator.js`

**Tasks:**
- [ ] Create settlement generation algorithm
- [ ] Implement size-based building counts
- [ ] Add biome-based building selection
- [ ] Generate settlements for existing ports

**Success Criteria:**
- Each port has a settlement
- Building placement makes sense (lumber camps near forests)
- Settlement size matches island size

---

### **Phase 2: Villager NPCs** (Week 2)

#### Day 5-7: Villager Base Class
**File:** `villager-npc.js`

**Tasks:**
- [ ] Extend NPC class for villagers
- [ ] Implement schedule system
- [ ] Add gathering behavior
- [ ] Create delivery system

**Success Criteria:**
- Villagers spawn at buildings
- Villagers follow daily schedules
- Villagers visible during day, hidden at night

---

#### Day 8-10: Resource Gathering
**File:** `gathering-behavior.js`

**Tasks:**
- [ ] Implement gathering actions (chop, mine, farm, fish)
- [ ] Add resource collection to villager inventory
- [ ] Create warehouse delivery system
- [ ] Integrate with port economy

**Success Criteria:**
- Villagers gather resources from biome tiles
- Resources accumulate in warehouse
- Port inventory fills from warehouse
- Production observable and realistic

---

### **Phase 3: Advanced Features** (Week 3+)

#### Day 11-14: Social Behaviors
**Tasks:**
- [ ] Tavern socializing
- [ ] Villager conversations (flavor text)
- [ ] Player interaction (talk, hire, quest)
- [ ] Reputation system with settlement

**Success Criteria:**
- Villagers have personality
- Player can interact meaningfully
- Settlement feels alive

---

#### Day 15+: Advanced Buildings
**Tasks:**
- [ ] Implement shipyard (repair, build ships)
- [ ] Add market square (villager trading)
- [ ] Create guard towers (defense)
- [ ] Build blacksmith (crafting)

---

## Example Scenarios

### Scenario 1: Player Visits Village in Morning

```
Time: 8:00 AM (Morning)

Player arrives at "Port Haven" (medium village)

Visible NPCs:
- Lumberjack "Tom" chopping trees near lumber camp
- Lumberjack "Jack" chopping trees near lumber camp
- Miner "Sarah" walking to quarry
- Farmer "Bob" working on farm
- Fisherman "Pete" standing on dock

Player observes:
- Tom chops tree tile, gains 1 wood
- Jack chops tree tile, gains 1 wood
- Sarah arrives at quarry, starts mining
- Bob harvests berries from farm
- Pete catches fish

Player can:
- Trade with port (inventory supplied by these workers)
- Talk to villagers (flavor text, quests)
- Help villagers (bonus gathering, reputation++)
```

### Scenario 2: Player Visits at Night

```
Time: 10:00 PM (Night)

Player arrives at same village

Visible NPCs:
- None! All villagers sleeping in huts

Visible Buildings:
- 🏠 Hut (villagers inside)
- 🏠 Hut (villagers inside)
- P Port
- W Warehouse
- T Tavern (closed, dark)
- L Lumber Camp (empty)

Player can:
- Trade with port (still available)
- Rest at tavern
- Wait until morning to see villagers
```

### Scenario 3: Pirate Attack on Settlement

```
Time: 2:00 PM (Afternoon)

Pirate ship approaches village

Event triggers:
- Guard tower detects pirate
- Message: "Warning! Pirate ship spotted!"
- Villagers flee to huts
- Production halts
- Port prices spike (low supply)

Player options:
1. Defend village (fight pirates, gain reputation)
2. Ignore (pirates raid, villagers die, production stops)
3. Help pirates (negative reputation, loot)

If player defends:
- Combat with pirate ship
- Victory: Villagers return, production resumes
- Port offers reward quest
- Reputation: +100

If pirates win:
- Some villagers killed (fewer workers)
- Some buildings damaged
- Production reduced by 50%
- Rebuilding takes 3 days
```

---

## Performance Considerations

### Optimization Strategies

#### 1. **Active Settlement Only**
- Only update settlement near player (<100 tiles)
- Settlements far away freeze
- Extrapolate production (simple math)

**Performance Gain:** ~90% reduction

---

#### 2. **Batch Gathering**
- Villagers gather in hourly batches
- Not every 6-minute turn
- Calculate: `gatherRate * hours`

**Performance Gain:** ~80% reduction

---

#### 3. **Simplified Pathfinding**
- Villagers use pre-calculated paths
- Home → Work, Work → Tavern, Tavern → Home
- No dynamic recalculation

**Performance Gain:** ~95% reduction in pathfinding

---

#### 4. **Visibility Culling**
- Don't render villagers outside FOV
- Only update visible villagers
- Background villagers simulated abstractly

**Performance Gain:** ~70% reduction in rendering

---

## Building Glyphs & Colors

```javascript
const BUILDING_TYPES = {
    hut: { char: 'h', color: '#8B4513', name: 'Hut' },
    warehouse: { char: 'W', color: '#FF8C00', name: 'Warehouse' },
    tavern: { char: 'T', color: '#DC143C', name: 'Tavern' },
    lumber_camp: { char: 'L', color: '#8B4513', name: 'Lumber Camp' },
    quarry: { char: 'Q', color: '#808080', name: 'Quarry' },
    farm: { char: 'F', color: '#9ACD32', name: 'Farm' },
    fishing_dock: { char: 'D', color: '#4682B4', name: 'Fishing Dock' },
    shipyard: { char: 'Y', color: '#8B4513', name: 'Shipyard' },
    market: { char: 'M', color: '#FFD700', name: 'Market' },
    guard_tower: { char: 'G', color: '#B22222', name: 'Guard Tower' },
    blacksmith: { char: 'B', color: '#2F4F4F', name: 'Blacksmith' }
};

const VILLAGER_TYPES = {
    lumberjack: { char: '♣', color: '#8B4513', name: 'Lumberjack' },
    miner: { char: '▲', color: '#808080', name: 'Miner' },
    farmer: { char: '♠', color: '#228B22', name: 'Farmer' },
    fisherman: { char: '~', color: '#4682B4', name: 'Fisherman' },
    guard: { char: '!', color: '#B22222', name: 'Guard' },
    merchant: { char: '$', color: '#FFD700', name: 'Merchant' },
    shipwright: { char: '&', color: '#8B4513', name: 'Shipwright' }
};
```

---

## Conclusion

**Settlement Simulation** transforms your ports from static trade points into **living, breathing communities** where:
- Resources come from actual labor (not magic)
- NPCs follow realistic schedules
- Player actions have visible consequences
- Islands feel alive and inhabited

**Perfect Synergy with Radiant AI:**
- Merchant NPCs visit these settlements to trade
- Pirates raid these settlements for loot
- Quests involve helping/protecting villages
- Economy is driven by visible production

**Next Step:** Start with `building.js` and `settlement-generator.js` - create static settlements first, then add villager behavior.

This system creates a **simulation layer** that makes your procedural world feel hand-crafted and alive! 🏝️⚓
