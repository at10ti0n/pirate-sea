# Radiant AI System - Implementation Plan
## Pirate Sea Roguelike

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [What is Radiant AI?](#what-is-radiant-ai)
3. [Current System Analysis](#current-system-analysis)
4. [Radiant AI Scope for Pirate Sea](#radiant-ai-scope)
5. [Prerequisites & Dependencies](#prerequisites--dependencies)
6. [Architecture Design](#architecture-design)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Example Scenarios](#example-scenarios)
9. [Performance Considerations](#performance-considerations)

---

## Executive Summary

**Radiant AI** for Pirate Sea will transform static ports into living, breathing economies with autonomous NPC merchants, pirates, and sailors who:
- Have goals, needs, and memories
- Trade autonomously between ports
- React to player actions and economic conditions
- Generate dynamic quests and events
- Create emergent gameplay through interactions

**Timeline Estimate:** 4-6 weeks for full implementation (MVP in 2-3 weeks)

**Current Readiness:** ~60% - Strong foundation with economy, islands, and entities

---

## What is Radiant AI?

Radiant AI (popularized by Elder Scrolls games) creates the illusion of a living world through:

### Core Principles
1. **Autonomous Behavior** - NPCs act independently based on goals and needs
2. **Dynamic Schedules** - NPCs have daily routines that adapt to conditions
3. **Memory & Persistence** - NPCs remember interactions and events
4. **Emergent Gameplay** - Complex behaviors arise from simple rules
5. **Reactive World** - NPCs respond to player actions and world state

### Pirate-Themed Adaptation
In Pirate Sea, this means:
- **Merchant NPCs** sail between ports, buying low and selling high
- **Pirate NPCs** hunt for treasure and prey on merchant ships
- **Navy NPCs** patrol trade routes and hunt pirates
- **Fisher NPCs** gather resources and sell to ports
- **Port Governors** adjust prices, hire guards, post bounties

---

## Current System Analysis

### ✅ What We Have (Strong Foundation)

#### 1. **Economy System** (`economy.js`)
- ✅ Dynamic supply/demand pricing
- ✅ Port tiers (small, medium, large, capital)
- ✅ Resource production based on island biomes
- ✅ Inventory management with capacity limits
- ✅ Gold regeneration system
- ✅ Trade transaction system

**AI Readiness:** 90% - Perfect foundation for NPC trading behavior

#### 2. **Island & Port System** (`entities.js`, `nameGenerator.js`)
- ✅ Island-aware port spawning
- ✅ Named islands and ports (procedural)
- ✅ Island size classification (tiny → massive)
- ✅ Geographic resource distribution
- ✅ Port economy tied to island resources

**AI Readiness:** 85% - Excellent foundation for NPC navigation and trade routes

#### 3. **Entity Management** (`entities.js`)
- ✅ Spatial entity lookup (O(1) with Map)
- ✅ Ship entities with durability
- ✅ Dynamic entity spawning
- ✅ Position-based entity queries

**AI Readiness:** 70% - Needs NPC types and behavior systems

#### 4. **Map & Navigation** (`map.js`)
- ✅ Infinite procedural world
- ✅ Biome-based terrain
- ✅ Coastal detection
- ✅ Pathfinding-friendly data structures

**AI Readiness:** 75% - Needs A* pathfinding for NPCs

#### 5. **Turn/Time System** (`game.js`)
- ✅ Turn-based updates
- ✅ Time of day system (6 min/turn)
- ✅ Weather updates per turn
- ✅ Game state management

**AI Readiness:** 80% - Good for scheduling NPC actions

### ❌ What's Missing (Core Gaps)

#### 1. **NPC Entity Types**
- ❌ Merchant ships with inventories
- ❌ Pirate ships with aggression
- ❌ Navy patrol ships
- ❌ Fisher boats
- ❌ Port governors/authorities

#### 2. **Behavior System**
- ❌ State machines for NPC actions
- ❌ Goal-oriented action planning (GOAP)
- ❌ Decision trees
- ❌ Utility AI scoring

#### 3. **NPC Memory**
- ❌ Event history tracking
- ❌ Visited ports log
- ❌ Price memory
- ❌ Player interaction history

#### 4. **Pathfinding**
- ❌ A* algorithm for ship navigation
- ❌ Trade route calculation
- ❌ Obstacle avoidance

#### 5. **Quest System**
- ❌ Dynamic quest generation
- ❌ Quest objectives and rewards
- ❌ Quest state tracking

#### 6. **Faction & Reputation**
- ❌ Faction definitions (Merchants Guild, Pirates, Navy)
- ❌ Reputation scores
- ❌ Faction relationships

---

## Radiant AI Scope

### Phase 1: Autonomous Merchants (MVP)
**Goal:** Merchant NPCs that trade between ports autonomously

**Features:**
- Merchant ships spawn at ports
- AI analyzes port prices and picks profitable routes
- Merchants sail to destination ports
- Merchants execute trades (buy low, sell high)
- Merchants return profits to home port
- Player can observe and intercept merchants

**Emergent Behaviors:**
- Trade routes form based on supply/demand
- Prices stabilize as merchants balance markets
- Profitable routes attract more merchants

### Phase 2: Pirates & Conflict
**Goal:** Hostile NPCs that create danger and opportunity

**Features:**
- Pirate ships spawn on islands
- Pirates hunt merchant ships and player
- Combat system (turn-based)
- Loot system when defeating pirates
- Pirates flee when outmatched
- Pirate reputation affects spawn rates

**Emergent Behaviors:**
- Pirates congregate near profitable trade routes
- Merchants avoid dangerous waters
- Player can become pirate hunter for rewards

### Phase 3: Dynamic Quest Generation
**Goal:** NPCs generate quests based on needs

**Features:**
- Port governors post bounties on pirates
- Merchants request cargo deliveries
- Explorers hire player for expeditions
- Rescue missions for stranded sailors
- Quest rewards scale with difficulty

**Emergent Behaviors:**
- Quest availability depends on world state
- Completing quests affects reputation
- NPCs remember player reliability

### Phase 4: Advanced AI & Factions
**Goal:** Complex social dynamics

**Features:**
- Faction system (Merchants Guild, Pirates, Navy)
- Reputation with each faction
- NPC-to-NPC social interactions
- Alliance and betrayal mechanics
- Port control and territory

**Emergent Behaviors:**
- Factions war over control of trade routes
- Player can ally with or betray factions
- Ports change hands based on faction strength

---

## Prerequisites & Dependencies

### Immediate Prerequisites (Before Starting)

#### 1. **Pathfinding System**
- **File:** `pathfinding.js`
- **Algorithm:** A* for ship navigation
- **Features:**
  - Ocean-only pathfinding for ships
  - Land pathfinding for on-foot NPCs
  - Cost function for weather/distance
  - Path caching for performance

**Complexity:** Medium (2-3 days)
**Priority:** Critical - NPCs can't navigate without this

#### 2. **NPC Base Class**
- **File:** `npc.js`
- **Features:**
  - Position, inventory, gold
  - State machine (idle, traveling, trading, fleeing)
  - Memory system (events, prices, interactions)
  - Update method (called each turn)

**Complexity:** Low-Medium (1-2 days)
**Priority:** Critical - Foundation for all NPCs

#### 3. **Behavior System**
- **File:** `behavior.js`
- **Architecture:** Utility AI or GOAP
- **Features:**
  - Goal evaluation (profitability, safety, survival)
  - Action selection (trade, travel, flee, attack)
  - Decision scoring based on context

**Complexity:** High (3-5 days)
**Priority:** High - Determines NPC intelligence

### Secondary Prerequisites (Can Build Alongside)

#### 4. **Quest System**
- **File:** `quest.js`
- **Features:**
  - Quest templates
  - Dynamic quest generation
  - Objective tracking
  - Reward calculation

**Complexity:** Medium (2-3 days)
**Priority:** Medium - Enhances gameplay but not core

#### 5. **Faction System**
- **File:** `faction.js`
- **Features:**
  - Faction definitions
  - Reputation tracking
  - Relationship matrices
  - Faction events

**Complexity:** Medium (2-3 days)
**Priority:** Medium - Adds depth but not essential

#### 6. **Combat System**
- **File:** `combat.js`
- **Features:**
  - Turn-based ship combat
  - Damage calculation
  - Boarding mechanics
  - Loot drops

**Complexity:** Medium-High (3-4 days)
**Priority:** High - Needed for pirate interactions

---

## Architecture Design

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     RADIANT AI SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   NPC Types  │    │  Behavior    │    │   Memory     │  │
│  │              │    │   System     │    │   System     │  │
│  │ - Merchant   │───▶│              │───▶│              │  │
│  │ - Pirate     │    │ - Utility AI │    │ - Events     │  │
│  │ - Navy       │    │ - GOAP       │    │ - Prices     │  │
│  │ - Fisher     │    │ - State FSM  │    │ - Relations  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │         │
│         └────────────────────┴────────────────────┘         │
│                              │                              │
│                    ┌─────────▼─────────┐                    │
│                    │  NPC Manager      │                    │
│                    │                   │                    │
│                    │ - Update all NPCs │                    │
│                    │ - Spawn/despawn   │                    │
│                    │ - Interactions    │                    │
│                    └─────────┬─────────┘                    │
│                              │                              │
├──────────────────────────────┴──────────────────────────────┤
│                     EXISTING SYSTEMS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Economy    │    │  Entities    │    │   Map Gen    │  │
│  │   Manager    │    │   Manager    │    │              │  │
│  │              │    │              │    │              │  │
│  │ - Pricing    │    │ - Ports      │    │ - Islands    │  │
│  │ - Trading    │    │ - Ships      │    │ - Navigation │  │
│  │ - Inventory  │    │ - Treasure   │    │ - Biomes     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Core Classes

#### 1. `NPCManager` (Central Coordinator)
```javascript
class NPCManager {
    constructor(mapGenerator, economyManager, entityManager) {
        this.npcs = new Map(); // All active NPCs
        this.spawnedThisTurn = 0;
        this.maxActiveNPCs = 50;
    }

    update(playerX, playerY) {
        // Update all NPCs within active radius
        // Spawn new NPCs if needed
        // Despawn distant NPCs
        // Handle NPC-NPC interactions
    }

    spawnMerchant(port) { /* ... */ }
    spawnPirate(island) { /* ... */ }
    spawnNavy(port) { /* ... */ }
}
```

#### 2. `NPC` (Base Class)
```javascript
class NPC {
    constructor(type, x, y) {
        this.id = generateId();
        this.type = type; // 'merchant', 'pirate', 'navy', 'fisher'
        this.x = x;
        this.y = y;
        this.state = 'idle';
        this.gold = 0;
        this.inventory = new Map();
        this.memory = new NPCMemory();
        this.behavior = null; // Assigned by subclass
        this.path = null; // Current path
        this.targetPort = null;
        this.homePort = null;
    }

    update(gameState) {
        // Execute behavior AI
        // Move along path
        // Update state
    }
}
```

#### 3. `MerchantNPC` (Autonomous Trader)
```javascript
class MerchantNPC extends NPC {
    constructor(homePort) {
        super('merchant', homePort.x, homePort.y);
        this.homePort = homePort;
        this.behavior = new MerchantBehavior(this);
        this.gold = 500;
        this.inventory = new Map();
        this.capacity = 100;
    }

    selectTradeRoute(allPorts, economyManager) {
        // Analyze prices across all ports
        // Calculate potential profit
        // Pick most profitable route
        // Return {targetPort, buyResource, sellResource, profit}
    }

    executeTradeAtPort(port, economyManager) {
        // Buy resources the port produces (cheap)
        // Sell resources the port needs (expensive)
        // Update inventory and gold
    }
}
```

#### 4. `BehaviorSystem` (Utility AI)
```javascript
class UtilityAI {
    constructor(npc) {
        this.npc = npc;
        this.actions = [
            new TradeAction(),
            new TravelAction(),
            new FleeAction(),
            new AttackAction(),
            new RestAction()
        ];
    }

    evaluateActions(gameState) {
        // Score each action based on context
        // Return highest-scoring action
    }
}

class TradeAction {
    score(npc, gameState) {
        // Calculate utility based on:
        // - Current gold
        // - Nearby port prices
        // - Inventory space
        // - Safety level
        return utilityScore;
    }

    execute(npc, gameState) {
        // Find best trade route
        // Set path to port
        // Change state to 'traveling'
    }
}
```

#### 5. `Pathfinding` (A* Algorithm)
```javascript
class Pathfinder {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.cache = new Map(); // Cache common routes
    }

    findPath(startX, startY, endX, endY, isShip = true) {
        // A* algorithm
        // Ocean-only for ships
        // Return array of {x, y} positions
    }

    isWalkable(x, y, isShip) {
        // Check if tile is navigable
    }

    heuristic(x1, y1, x2, y2) {
        // Manhattan distance
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }
}
```

#### 6. `NPCMemory` (Event Tracking)
```javascript
class NPCMemory {
    constructor() {
        this.visitedPorts = new Map(); // port -> {lastVisit, lastPrices}
        this.interactions = []; // {type, target, outcome, timestamp}
        this.knownPrices = new Map(); // resource -> {port, price, timestamp}
        this.reputation = new Map(); // faction -> score
    }

    rememberPortVisit(port, prices) {
        this.visitedPorts.set(port.id, {
            lastVisit: Date.now(),
            lastPrices: {...prices}
        });
    }

    getBestPriceMemory(resource) {
        // Return port with best remembered price for resource
    }
}
```

---

## Implementation Roadmap

### **Phase 1: Foundation** (Week 1)

#### Day 1-2: Pathfinding System
**File:** `pathfinding.js`

**Tasks:**
- [ ] Implement A* algorithm
- [ ] Ocean-only pathfinding for ships
- [ ] Path caching for performance
- [ ] Test with existing ship entities

**Success Criteria:**
- Ships can navigate from any ocean tile to any other
- Path avoids land obstacles
- Performance: <10ms for 100-tile paths

---

#### Day 3-4: NPC Base Class
**File:** `npc.js`

**Tasks:**
- [ ] Create `NPC` base class
- [ ] Implement state machine (idle, traveling, trading)
- [ ] Add inventory management
- [ ] Create `NPCMemory` class
- [ ] Add update loop integration

**Success Criteria:**
- NPCs can be spawned and updated each turn
- NPCs can move along paths
- NPCs track memory of events

---

#### Day 5-7: Merchant NPC Implementation
**Files:** `merchant-npc.js`, `npc-manager.js`

**Tasks:**
- [ ] Create `MerchantNPC` subclass
- [ ] Implement trade route selection algorithm
- [ ] Add port-to-port navigation
- [ ] Integrate with economy system
- [ ] Create `NPCManager` coordinator
- [ ] Add merchant spawning at ports

**Success Criteria:**
- Merchants spawn at capital/large ports
- Merchants analyze prices and select profitable routes
- Merchants sail to destination ports
- Merchants execute trades and return home
- Player can observe merchant ships on map

---

### **Phase 2: Behavior & Intelligence** (Week 2)

#### Day 8-10: Utility AI System
**File:** `behavior.js`

**Tasks:**
- [ ] Design utility AI framework
- [ ] Implement action scoring system
- [ ] Create merchant actions (trade, travel, rest)
- [ ] Add context awareness (safety, profit, resources)
- [ ] Integrate with NPC update loop

**Success Criteria:**
- Merchants make intelligent trade decisions
- NPCs adapt behavior based on world state
- Observable emergent behaviors (trade routes)

---

#### Day 11-12: Pirate NPC
**File:** `pirate-npc.js`

**Tasks:**
- [ ] Create `PirateNPC` subclass
- [ ] Implement hunt behavior (seek merchants/player)
- [ ] Add combat state machine
- [ ] Create loot system
- [ ] Add pirate spawning on remote islands

**Success Criteria:**
- Pirates hunt merchant ships
- Pirates attack player if encountered
- Pirates flee when damaged
- Pirates drop loot when defeated

---

#### Day 13-14: Combat System
**File:** `combat.js`

**Tasks:**
- [ ] Design turn-based ship combat
- [ ] Implement damage calculation
- [ ] Add boarding mechanics
- [ ] Create combat UI
- [ ] Integrate with existing durability system

**Success Criteria:**
- Player can engage in ship combat
- Combat is balanced and engaging
- Winning combat yields rewards
- Ship damage persists after combat

---

### **Phase 3: Dynamic Quests** (Week 3)

#### Day 15-17: Quest System
**File:** `quest.js`

**Tasks:**
- [ ] Design quest data structure
- [ ] Create quest templates (delivery, bounty, escort)
- [ ] Implement dynamic generation based on NPCs
- [ ] Add quest tracking UI
- [ ] Integrate rewards with economy

**Success Criteria:**
- Quests generate based on NPC needs
- Player can accept/complete quests
- Quest rewards scale appropriately
- Quest availability reflects world state

---

#### Day 18-19: Quest Types Implementation

**Delivery Quests:**
- Merchant NPC needs cargo delivered
- Quest generated when merchant's route is blocked by pirates
- Reward based on distance and danger

**Bounty Quests:**
- Port governor posts bounty on pirate
- Quest generated when pirates attack frequently near port
- Reward based on pirate threat level

**Escort Quests:**
- Merchant hires player for protection
- Quest generated when profitable but dangerous route exists
- Reward based on route value and risk

---

#### Day 20-21: NPC Quest Interaction
**Tasks:**
- [ ] NPCs generate quests based on needs
- [ ] Port governors post quests at ports
- [ ] Quest UI shows active quests
- [ ] Reputation system integration
- [ ] Quest completion affects NPC behavior

---

### **Phase 4: Factions & Advanced AI** (Week 4+)

#### Day 22-24: Faction System
**File:** `faction.js`

**Tasks:**
- [ ] Define factions (Merchants Guild, Pirates, Navy)
- [ ] Implement reputation tracking
- [ ] Create faction relationship matrices
- [ ] Add faction-specific behaviors
- [ ] Faction UI indicators

**Success Criteria:**
- Player has reputation with each faction
- Actions affect faction standing
- Factions have distinct behaviors
- Faction relationships create conflict

---

#### Day 25-28: Advanced AI Features

**Tasks:**
- [ ] NPC-to-NPC interactions (merchants trade with each other)
- [ ] Faction territory control
- [ ] Alliance/betrayal mechanics
- [ ] Port sieges and capture
- [ ] Dynamic economy shifts based on faction control

---

## Example Scenarios

### Scenario 1: Merchant Trading Loop
```
Turn 1: Merchant "Captain Morgan" spawns at Port Royal (capital tier)
Turn 2: Morgan analyzes prices across known ports
        - Port Royal: Wood = 7g (produces), Stone = 18g (consumes)
        - Dead Man's Cove: Wood = 13g (consumes), Stone = 8g (produces)
Turn 3: Morgan decides: Buy stone at Dead Man's Cove, sell at Port Royal
        - Potential profit: (18-8) * 50 units = 500g
Turn 4: Morgan starts sailing to Dead Man's Cove (20 tiles away)
Turn 5-24: Morgan travels along calculated path
Turn 25: Morgan arrives at Dead Man's Cove
Turn 26: Morgan buys 50 stone for 400g
Turn 27: Morgan starts return journey
Turn 28-47: Morgan travels back to Port Royal
Turn 48: Morgan arrives at Port Royal
Turn 49: Morgan sells 50 stone for 900g
        - Profit: 500g (minus travel costs)
Turn 50: Morgan updates price memory
        - Marks this route as profitable
        - Plans to repeat or find new route
```

**Emergent Behavior:**
- Multiple merchants discover this route
- Stone supply at Dead Man's Cove drops (price rises)
- Stone supply at Port Royal rises (price drops)
- Route becomes less profitable over time
- Merchants find new arbitrage opportunities

---

### Scenario 2: Pirate Attack
```
Turn 1: Pirate "Blackbeard" spawns on remote island
Turn 2: Blackbeard enters "hunt" state
Turn 3: Blackbeard scans nearby ocean for targets
        - Detects merchant "Morgan" 15 tiles away
Turn 4: Blackbeard calculates intercept path
Turn 5-10: Blackbeard pursues Morgan
Turn 11: Blackbeard intercepts Morgan
Turn 12: Combat initiated
        - Blackbeard: 100 HP, 20 attack
        - Morgan: 80 HP, 10 attack (merchant ship)
Turn 13-15: Combat resolution
        - Morgan defeated (HP → 0)
Turn 16: Blackbeard loots Morgan's cargo
        - Gains 50 stone + 400g
Turn 17: Blackbeard returns to island to sell loot
Turn 18: Port Royal notices missing merchant
        - Governor generates bounty quest: "Defeat Blackbeard - Reward: 800g"
```

**Emergent Behavior:**
- Player sees bounty quest and accepts
- Player hunts Blackbeard
- Defeating Blackbeard makes route safer
- More merchants use the route
- Economy balances through trade

---

### Scenario 3: Dynamic Quest Generation
```
Turn 1: Port "Haven's Rest" has high demand for wood
        - Current stock: 5/100 (very low)
        - Price: 25g (2.5x base price)
Turn 2: Port governor evaluates situation
        - Production rate: 2 wood/hour (insufficient)
        - Needs: 50 wood urgently
Turn 3: Governor generates quest
        - "Deliver 50 wood to Haven's Rest"
        - Reward: 1500g (1.2x market value)
Turn 4: Player sees quest at port
Turn 5: Player travels to forest island
Turn 6-10: Player gathers 50 wood
Turn 11: Player travels to Haven's Rest
Turn 12: Player delivers wood, receives 1500g
Turn 13: Haven's Rest stock increases
        - New stock: 55/100 (healthy)
        - Price drops to 12g (normal)
Turn 14: Quest marked complete
        - Player reputation with Haven's Rest +50
        - Future quests from this port more valuable
```

**Emergent Behavior:**
- Quest appeared because economy needed it
- Player action directly affected port economy
- Reputation system encourages helpful behavior
- Ports remember reliable traders

---

## Performance Considerations

### Optimization Strategies

#### 1. **Active Area Simulation**
Only update NPCs within active radius of player (e.g., 100 tiles)
- NPCs outside radius freeze state
- Reactivate when player approaches
- Extrapolate position based on last known path

**Performance Gain:** ~80% reduction in NPC updates

---

#### 2. **Path Caching**
Cache common paths between major ports
- Key: `${startPort.id}-${endPort.id}`
- Cache invalidation: every 1000 turns
- Reuse paths for multiple NPCs

**Performance Gain:** ~90% reduction in pathfinding calculations

---

#### 3. **Staggered Updates**
Update NPCs in batches across turns
- 10 NPCs per turn instead of all 50
- Each NPC updates every 5 turns
- Still appears continuous to player

**Performance Gain:** ~80% reduction in per-turn calculations

---

#### 4. **Spatial Partitioning**
Use grid-based spatial hashing for NPC queries
- Divide world into 50x50 tile chunks
- Quick lookup: "What NPCs are near position X,Y?"
- O(1) instead of O(n) for proximity checks

**Performance Gain:** ~95% faster NPC collision/interaction checks

---

#### 5. **Memory Limits**
Limit NPC memory size
- Max 20 visited ports in memory
- Max 100 price records
- Oldest entries evicted first
- Prevents memory leaks

**Performance Gain:** Stable memory usage regardless of playtime

---

## Success Metrics

### Phase 1 Success Criteria
- [ ] 10+ autonomous merchants actively trading
- [ ] Observable trade routes forming organically
- [ ] Port prices stabilizing due to merchant activity
- [ ] Player can intercept and observe merchant behavior

### Phase 2 Success Criteria
- [ ] 5+ pirates hunting merchants and player
- [ ] Merchants avoiding dangerous routes
- [ ] Combat system engaging and balanced
- [ ] Emergent risk/reward around pirate zones

### Phase 3 Success Criteria
- [ ] 5+ dynamic quests available at any time
- [ ] Quests generated based on actual world needs
- [ ] Quest completion affects world state
- [ ] Reputation system influencing NPC behavior

### Phase 4 Success Criteria
- [ ] 3 factions with distinct personalities
- [ ] Faction wars creating dynamic gameplay
- [ ] Player choices meaningfully affecting faction balance
- [ ] NPC-to-NPC interactions visible and impactful

---

## Conclusion

**Radiant AI for Pirate Sea is achievable** with the strong economic and island systems already in place. The roadmap prioritizes:

1. **Quick MVP** (Week 1) - Autonomous merchants prove the concept
2. **Conflict & Danger** (Week 2) - Pirates create tension and opportunity
3. **Player Engagement** (Week 3) - Quests give purpose and rewards
4. **Depth & Replayability** (Week 4+) - Factions create complex dynamics

The key to success is **starting simple** (merchants trading) and **building incrementally** rather than trying to implement everything at once.

**Next Step:** Start with `pathfinding.js` - everything else builds on NPCs being able to navigate the world.
