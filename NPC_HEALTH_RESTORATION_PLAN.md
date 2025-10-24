# NPC Health Restoration System
## Ship Durability & Repair AI for Pirate Sea

---

## Table of Contents
1. [Overview](#overview)
2. [Current Ship Health System](#current-ship-health-system)
3. [NPC Repair Needs](#npc-repair-needs)
4. [Repair Methods](#repair-methods)
5. [AI Repair Behavior](#ai-repair-behavior)
6. [Emergency Repairs](#emergency-repairs)
7. [Repair Economics](#repair-economics)
8. [Implementation Plan](#implementation-plan)

---

## Overview

**NPC Health Restoration** ensures autonomous NPCs can maintain their ships through:
- **Port repairs** - Visit ports to pay for professional repairs
- **Shipyard repairs** - Better prices at dedicated shipyards
- **Repair kits** - Emergency field repairs
- **Resting** - Slow natural recovery (for small damage)
- **Fleeing combat** - Avoid destruction when critically damaged

### Why NPCs Need Health Restoration

**Without Repairs:**
- ❌ Merchant ships accumulate damage from storms/pirates
- ❌ Damaged merchants eventually sink → economy stagnates
- ❌ Pirate ships damaged in combat never recover
- ❌ No risk/reward for NPCs (they die permanently)
- ❌ World becomes less dynamic over time

**With Repairs:**
- ✅ Merchants repair between trade routes (realistic behavior)
- ✅ Pirates retreat to hideouts to repair (adds strategy)
- ✅ NPCs manage gold budgets (repair vs trade vs flee)
- ✅ Damaged NPCs create opportunities (easy targets)
- ✅ World stays populated and dynamic

---

## Current Ship Health System

### Ship Durability (Already Implemented)

```javascript
{
    durability: {
        current: 85,  // Current HP
        max: 100,     // Maximum HP
        lastDamage: 1625847260000  // Timestamp
    }
}
```

### Health Conditions

| Condition | HP % | Icon | Behavior |
|-----------|------|------|----------|
| **Excellent** | 90-100% | S | Full performance |
| **Good** | 60-89% | S | Normal operation |
| **Damaged** | 30-59% | s | Reduced speed (-10%) |
| **Critical** | 1-29% | s | Severely limited (-25% speed) |
| **Destroyed** | 0% | x | Sunk, removed from game |

### Existing Repair System (Players)

**Port Repairs:**
```javascript
economy.calculateRepairCost(ship, port);
economy.executeRepairTransaction(player, ship, port);
```

**Repair Costs:**
- Base: 2g per HP
- Small port: 3g per HP (1.5x multiplier)
- Medium port: 2.4g per HP (1.2x)
- Large port: 2g per HP (1.0x)
- Capital port: 1.6g per HP (0.8x)

**Example:**
- Ship at 60/100 HP needs 40 HP repaired
- At large port: 40 HP × 2g = 80g
- At capital port: 40 HP × 1.6g = 64g

---

## NPC Repair Needs

### Damage Sources

**Environmental:**
- **Storms** - Ships in hurricanes take 1-5 HP damage per turn
- **Fog navigation** - 10% chance of 2 HP damage hitting unseen obstacles
- **Ocean hazards** - Random events (reefs, debris)

**Combat:**
- **Pirate attacks** - Merchants lose 10-30 HP per encounter
- **Player attacks** - Variable damage based on player ship/weapons
- **NPC-to-NPC combat** - Pirates vs Navy, merchant vs pirate

**Wear & Tear:**
- **Long voyages** - 0.1 HP per 100 tiles traveled
- **Heavy cargo** - Overloaded ships (>90% capacity) lose 0.5 HP per 10 turns

### Repair Thresholds for Different NPC Types

**Merchant NPCs:**
- **Excellent (90-100%):** Continue trading normally
- **Good (60-89%):** Continue but consider repairs after next delivery
- **Damaged (30-59%):** Seek repairs immediately (high priority)
- **Critical (<30%):** Emergency mode - flee to nearest port, skip trading

**Pirate NPCs:**
- **Excellent (90-100%):** Hunt aggressively
- **Good (60-89%):** Continue hunting, target weak merchants
- **Damaged (30-59%):** Retreat to hideout/remote island to repair
- **Critical (<30%):** Flee combat immediately, hide until repaired

**Navy NPCs:**
- **Excellent (90-100%):** Patrol actively, chase pirates
- **Good (60-89%):** Continue patrols
- **Damaged (30-59%):** Return to home port for repairs
- **Critical (<30%):** Abandon patrol, emergency docking

**Fisher NPCs:**
- **Excellent (90-100%):** Fish normally
- **Good (60-89%):** Continue fishing
- **Damaged (30-59%):** Return to village for repairs
- **Critical (<30%):** Emergency return home

---

## Repair Methods

### 1. Port Repairs (Primary Method)

**How It Works:**
```javascript
// NPC merchant arrives at port
if (merchant.ship.durability.current < merchant.ship.durability.max * 0.8) {
    const repairCost = economy.calculateRepairCost(merchant.ship, port);

    if (merchant.gold >= repairCost) {
        merchant.gold -= repairCost;
        merchant.ship.durability.current = merchant.ship.durability.max;
        port.economy.gold += repairCost;

        console.log(`${merchant.name} repaired ship at ${port.name} for ${repairCost}g`);
    } else {
        // Partial repair (spend all available gold)
        const affordableHP = Math.floor(merchant.gold / costPerHP);
        merchant.ship.durability.current += affordableHP;
        port.economy.gold += merchant.gold;
        merchant.gold = 0;
    }
}
```

**NPC Port Repair Behavior:**
- Merchants repair after profitable trades (have gold)
- Pirates avoid main ports (use remote islands)
- Navy ships get free repairs at military ports
- Fishermen repair at their home village (discounted)

---

### 2. Shipyard Repairs (Best Prices)

**Shipyard Advantages:**
- **20% cheaper** than port repairs
- **Faster** - Ships repaired in 1-2 hours (background)
- **Quality** - Better tier shipyards = bonus HP (+5% at capital)

**Shipyard Repair Costs:**

| Shipyard Tier | Cost per HP | Full Repair (100 HP) | Speed |
|---------------|-------------|----------------------|-------|
| Small | 2.5g | 250g | 2 hours |
| Medium | 2.0g | 200g | 1.5 hours |
| Large | 1.5g | 150g | 1 hour |
| Capital | 1.2g | 120g | 0.5 hours |

**NPC Shipyard Behavior:**
```javascript
// Merchant evaluates repair options
const portCost = calculatePortRepairCost(merchant.ship, currentPort);
const nearbyShipyard = findNearestShipyard(merchant.x, merchant.y);

if (nearbyShipyard) {
    const shipyardCost = calculateShipyardRepairCost(merchant.ship, nearbyShipyard);
    const travelCost = calculateTravelCost(merchant, nearbyShipyard);

    if (shipyardCost + travelCost < portCost) {
        merchant.setGoal('travel_to_shipyard', nearbyShipyard);
    } else {
        merchant.repairAtCurrentPort();
    }
}
```

**Smart NPCs:**
- Calculate total cost (repair + travel)
- Prefer shipyards if within 20 tiles
- Wealthy merchants use capital shipyards (best quality)
- Poor merchants use nearest available

---

### 3. Repair Kits (Emergency Field Repairs)

**From Crafting System:**
```javascript
{
    name: 'Repair Kit',
    recipe: {
        wood: 10,
        planks: 5,
        rope: 3,
        iron: 2
    },
    restores: 30 HP,
    cost: 300g,
    usage: 'instant' // No port needed!
}
```

**NPC Repair Kit Behavior:**
- **Merchants:** Carry 1-2 repair kits for emergencies
- **Pirates:** Carry 2-3 kits (no safe port access)
- **Navy:** Carry 3-5 kits (long patrols)

**When NPCs Use Repair Kits:**
```javascript
if (npc.ship.durability.current < 30 && npc.isInCombat()) {
    // Emergency! Use repair kit mid-battle
    if (npc.inventory.has('repair_kit')) {
        npc.useRepairKit();
        npc.ship.durability.current += 30;
        console.log(`${npc.name} used emergency repair kit! (+30 HP)`);
    } else {
        // No kit! Try to flee
        npc.setState('fleeing');
    }
}
```

**Strategic Considerations:**
- Repair kits cost more than port repairs (300g vs ~80g for 40 HP)
- But can save NPC life in emergency
- NPCs restock repair kits at ports (if gold available)

---

### 4. Natural Recovery (Resting)

**For Minor Damage:**
```javascript
// Ships slowly repair when docked/idle
if (npc.state === 'resting' && npc.isAtPort()) {
    const hoursRested = (currentTime - npc.restStartTime) / 3600000;
    const recoveryRate = 2; // HP per hour
    const hpRecovered = Math.floor(hoursRested * recoveryRate);

    npc.ship.durability.current = Math.min(
        npc.ship.durability.max,
        npc.ship.durability.current + hpRecovered
    );
}
```

**Natural Recovery Rates:**
- **Docked at port:** 2 HP/hour (free but slow)
- **Anchored at island:** 1 HP/hour (remote rest)
- **At sea:** 0 HP/hour (no recovery)
- **In combat:** 0 HP/hour (obviously!)

**NPC Resting Behavior:**
- Merchants with minor damage (<10 HP missing) might rest overnight instead of paying
- Pirates hide at remote islands and slowly recover (avoid port fees)
- Fishermen rest at home dock (free recovery)

---

### 5. Self-Repair (Advanced NPC Skill)

**For Skilled Sailors:**
```javascript
{
    npc: {
        skills: {
            shipwright: 75, // 0-100 skill
            carpentry: 60,
            sailing: 80
        }
    }
}

// Self-repair during rest
if (npc.state === 'resting' && npc.skills.shipwright > 50) {
    const skillBonus = npc.skills.shipwright / 100;
    const repairRate = 1 + skillBonus; // 1.5 HP/hour at 50 skill, 2 HP/hour at 100

    npc.ship.durability.current += repairRate * hoursRested;
}
```

**Who Has Self-Repair:**
- **Master merchants:** High shipwright skill (75+)
- **Pirate captains:** Moderate skill (50+)
- **Navy officers:** High skill (80+)
- **Basic merchants:** Low skill (20-30)

**Cost:**
- Requires wood/planks in inventory
- Consumes 1 wood per 5 HP repaired
- Free labor but uses materials

---

## AI Repair Behavior

### Decision Tree for Repair

```
NPC evaluates ship health each turn:

1. Check current HP percentage
   ├─ >90% → No action needed
   ├─ 60-90% → Consider repairs after current task
   ├─ 30-59% → Repairs become high priority
   └─ <30% → EMERGENCY! Immediate action

2. If repairs needed, evaluate options:
   ├─ At port? → Repair here if gold available
   ├─ Repair kit in inventory? → Use if emergency (<30%)
   ├─ Shipyard within 20 tiles? → Travel there if cheaper
   ├─ Can rest safely? → Natural recovery if minor damage
   └─ No options? → Flee to safe location

3. Economic check:
   ├─ Have enough gold for full repair? → Repair fully
   ├─ Have partial gold? → Partial repair
   └─ No gold? → Use repair kit or rest

4. Update behavior state:
   ├─ Critical damage → Abandon current goal, seek repairs
   ├─ Moderate damage → Complete current goal, then repair
   └─ Minor damage → Repair opportunistically
```

---

### Merchant AI Repair Strategy

**Profit-Driven Repairs:**
```javascript
class MerchantRepairAI {
    evaluateRepairs(merchant) {
        const hpMissing = merchant.ship.durability.max - merchant.ship.durability.current;
        const hpPercent = merchant.ship.durability.current / merchant.ship.durability.max;

        // Critical damage - immediate repairs
        if (hpPercent < 0.3) {
            return this.seekEmergencyRepairs(merchant);
        }

        // Moderate damage - repair after trade route completion
        if (hpPercent < 0.6) {
            if (merchant.hasCompletedRoute() && merchant.gold > 200) {
                return this.repairAtNearestPort(merchant);
            }
        }

        // Minor damage - opportunistic repairs
        if (hpPercent < 0.9 && merchant.isAtPort()) {
            const repairCost = this.calculateRepairCost(merchant);
            const profitMargin = merchant.gold - merchant.operatingCosts;

            // Only repair if profit allows (keep 20% gold as buffer)
            if (profitMargin > repairCost * 1.2) {
                return this.repairHere(merchant);
            }
        }

        return null; // No repairs needed
    }

    seekEmergencyRepairs(merchant) {
        // Priority 1: Use repair kit if available
        if (merchant.inventory.has('repair_kit')) {
            merchant.useItem('repair_kit');
            return { action: 'emergency_repair', cost: 0 };
        }

        // Priority 2: Nearest port (even if expensive)
        const nearestPort = findNearestPort(merchant.x, merchant.y);
        merchant.setGoal('emergency_docking', nearestPort);
        return { action: 'flee_to_port', destination: nearestPort };
    }
}
```

**Merchant Repair Budget:**
- **Wealthy merchants** (1000g+): Repair at 80% HP, prefer quality shipyards
- **Average merchants** (300-1000g): Repair at 60% HP, use nearest port
- **Poor merchants** (<300g): Repair at 30% HP, partial repairs only, rest when possible

---

### Pirate AI Repair Strategy

**Survival-Focused Repairs:**
```javascript
class PirateRepairAI {
    evaluateRepairs(pirate) {
        const hpPercent = pirate.ship.durability.current / pirate.ship.durability.max;

        // Pirates avoid main ports (they're criminals!)
        // Use hideouts, remote islands, black market shipyards

        if (hpPercent < 0.3) {
            // Critical - retreat to hideout immediately
            const hideout = findNearestPirateHideout(pirate.x, pirate.y);
            pirate.setState('retreating');
            pirate.setGoal('reach_hideout', hideout);
            return { action: 'retreat', destination: hideout };
        }

        if (hpPercent < 0.6) {
            // Moderate damage - use repair kit if available
            if (pirate.inventory.has('repair_kit')) {
                pirate.useItem('repair_kit');
                return { action: 'field_repair' };
            }

            // Otherwise continue hunting but avoid strong targets
            pirate.huntingStrategy = 'weak_targets_only';
        }

        if (hpPercent < 0.9 && pirate.isAtHideout()) {
            // Repair at hideout (discounted black market)
            const repairCost = calculateHideoutRepairCost(pirate);
            if (pirate.gold >= repairCost) {
                return this.repairAtHideout(pirate);
            }
        }

        return null;
    }

    repairAtHideout(pirate) {
        // Black market repairs (20% more expensive than normal ports)
        const costPerHP = 2.4; // vs 2.0 at normal port
        const hpMissing = pirate.ship.durability.max - pirate.ship.durability.current;
        const cost = hpMissing * costPerHP;

        pirate.gold -= cost;
        pirate.ship.durability.current = pirate.ship.durability.max;

        return { action: 'hideout_repair', cost: cost };
    }
}
```

**Pirate Hideouts:**
- Remote islands (far from ports)
- Hidden coves
- Black market shipyards (expensive but secret)
- Pirate NPCs remember hideout locations

**Pirate Repair Priority:**
1. **Repair kits** (always carry 2-3)
2. **Hideout repairs** (if gold available)
3. **Natural recovery** (rest at remote island)
4. **Raid for gold** (attack weak merchant to get repair funds)

---

### Navy AI Repair Strategy

**Duty-Driven Repairs:**
```javascript
class NavyRepairAI {
    evaluateRepairs(navyShip) {
        const hpPercent = navyShip.ship.durability.current / navyShip.ship.durability.max;

        // Navy has free repairs at military ports
        // But must return to base (takes time)

        if (hpPercent < 0.4) {
            // Moderate damage - return to base
            const homeBase = navyShip.assignedPort;
            navyShip.setState('returning_to_base');
            navyShip.setGoal('repair_at_base', homeBase);
            return { action: 'return_to_base', destination: homeBase };
        }

        if (hpPercent < 0.6 && navyShip.isAtPort()) {
            // Opportunistic repair when docking for other reasons
            return this.repairAtBase(navyShip);
        }

        // Navy carries many repair kits for extended patrols
        if (hpPercent < 0.5 && navyShip.isOnPatrol()) {
            if (navyShip.inventory.count('repair_kit') > 1) {
                // Use repair kit, continue patrol
                navyShip.useItem('repair_kit');
                return { action: 'field_repair' };
            }
        }

        return null;
    }

    repairAtBase(navyShip) {
        // Free repairs at military ports!
        navyShip.ship.durability.current = navyShip.ship.durability.max;
        console.log(`${navyShip.name} repaired at naval base (free)`);

        // Resupply repair kits
        navyShip.inventory.set('repair_kit', 5);

        return { action: 'base_repair', cost: 0 };
    }
}
```

**Navy Repair Advantages:**
- **Free repairs** at assigned base
- **Generous repair kit** supply (5 kits)
- **Fast repairs** (priority service)

---

## Emergency Repairs

### Combat Damage Response

```javascript
// During combat, NPCs evaluate if they should flee
function evaluateCombatStatus(npc, opponent) {
    const hpPercent = npc.ship.durability.current / npc.ship.durability.max;
    const opponentPercent = opponent.ship.durability.current / opponent.ship.durability.max;

    // Critical HP - always flee
    if (hpPercent < 0.2) {
        npc.setState('fleeing');
        npc.combat.flee(opponent);
        return 'FLEE';
    }

    // Losing badly - consider fleeing
    if (hpPercent < 0.4 && opponentPercent > 0.7) {
        // Opponent is much healthier - flee
        npc.setState('fleeing');
        npc.combat.flee(opponent);
        return 'FLEE';
    }

    // Moderate damage - use repair kit if available
    if (hpPercent < 0.5 && npc.inventory.has('repair_kit')) {
        npc.useItem('repair_kit');
        npc.ship.durability.current += 30;
        console.log(`${npc.name} used emergency repair kit mid-combat!`);
        return 'REPAIR';
    }

    // Continue fighting
    return 'FIGHT';
}
```

**Emergency Behaviors:**
- **<20% HP:** Always flee combat
- **<40% HP vs healthy opponent:** Flee to avoid destruction
- **<50% HP with repair kit:** Use kit, continue fighting
- **<30% HP after fleeing:** Seek nearest safe harbor

---

### Fleet Repairs (Advanced)

**Merchant Fleets:**
```javascript
// Merchant with multiple ships repairs all vessels
class MerchantFleet {
    repairFleet(homePort) {
        let totalCost = 0;

        for (const ship of this.fleet) {
            const repairCost = economy.calculateRepairCost(ship, homePort);
            totalCost += repairCost;
        }

        if (this.gold >= totalCost) {
            // Repair all ships
            for (const ship of this.fleet) {
                ship.durability.current = ship.durability.max;
            }
            this.gold -= totalCost;
            console.log(`Fleet repaired for ${totalCost}g`);
        } else {
            // Prioritize most damaged ships
            const sortedShips = this.fleet.sort((a, b) => {
                const aPercent = a.durability.current / a.durability.max;
                const bPercent = b.durability.current / b.durability.max;
                return aPercent - bPercent; // Most damaged first
            });

            let remainingGold = this.gold;
            for (const ship of sortedShips) {
                const cost = economy.calculateRepairCost(ship, homePort);
                if (remainingGold >= cost) {
                    ship.durability.current = ship.durability.max;
                    remainingGold -= cost;
                }
            }

            this.gold = remainingGold;
        }
    }
}
```

---

## Repair Economics

### Port Economy Impact

**Ports Earn Gold from NPC Repairs:**
```javascript
// Port receives gold from NPC repairs
port.economy.gold += repairCost;
port.economy.repairRevenue += repairCost;
port.economy.shipsServiced++;

// Busy repair ports become wealthier
if (port.economy.shipsServiced > 50) {
    port.economy.tier = 'large'; // Upgrade!
}
```

**Economic Cycles:**
1. Pirates attack merchants
2. Damaged merchants seek repairs
3. Ports earn gold from repairs
4. Ports become wealthier
5. Merchants trade more at wealthy ports
6. More pirates attracted to wealthy trade routes
7. Cycle repeats

---

### Repair Resource Demand

**Shipyards Need Materials:**
```javascript
// Shipyard consumes resources for repairs
shipyard.inventory.wood -= hpRepaired / 5;  // 1 wood per 5 HP
shipyard.inventory.planks -= hpRepaired / 10;
shipyard.inventory.iron -= hpRepaired / 20;

// Shipyards buy resources from ports
if (shipyard.inventory.wood < 50) {
    const nearbyPort = findNearestPort(shipyard);
    // Generate trade quest: "Deliver 100 wood to shipyard"
}
```

**Creates Resource Loops:**
- Damaged ships → Shipyards need materials
- Shipyards buy from ports
- Ports pay lumberjacks for wood
- Lumberjacks chop trees
- Economy stays active!

---

## Implementation Plan

### **Phase 1: Basic NPC Repairs** (Week 1)

#### Day 1-2: NPC Repair Logic
**File:** `npc-repair.js`

**Tasks:**
- [ ] Create `NPCRepairManager` class
- [ ] Implement `evaluateRepairNeed(npc)` method
- [ ] Add port repair for NPCs (reuse economy system)
- [ ] Track NPC gold spending on repairs

**Success Criteria:**
- NPCs can repair at ports
- NPCs lose gold when repairing
- Ports gain gold from NPC repairs

---

#### Day 3-4: AI Repair Decision-Making
**File:** `npc-repair-ai.js`

**Tasks:**
- [ ] Implement repair decision tree
- [ ] Add HP threshold checking
- [ ] Create "seek repairs" behavior state
- [ ] Merchants prioritize repairs when damaged

**Success Criteria:**
- Merchants repair at <60% HP
- NPCs pathfind to nearest port when critical
- Repair decisions observable in logs

---

### **Phase 2: Advanced Repairs** (Week 2)

#### Day 5-6: Repair Kits & Emergency Repairs
**Files:** `npc-inventory.js`, `npc-repair.js`

**Tasks:**
- [ ] NPCs carry repair kits in inventory
- [ ] Implement mid-combat repair kit usage
- [ ] Add flee behavior when critical HP
- [ ] NPCs restock repair kits at ports

**Success Criteria:**
- Pirates use repair kits in combat
- NPCs flee when <20% HP
- Repair kit usage visible in combat logs

---

#### Day 7-8: Shipyard Repairs & Natural Recovery
**Files:** `shipyard.js`, `npc-repair.js`

**Tasks:**
- [ ] Shipyards offer discounted repairs to NPCs
- [ ] NPCs calculate cost-benefit (shipyard vs port)
- [ ] Implement natural HP recovery when resting
- [ ] Pirates rest at hideouts for free recovery

**Success Criteria:**
- NPCs choose shipyards when cheaper
- Resting NPCs slowly recover HP
- Pirates use hideouts for repairs

---

### **Phase 3: Specialized Behaviors** (Week 3)

#### Day 9-11: Type-Specific Repair AI
**Files:** `merchant-ai.js`, `pirate-ai.js`, `navy-ai.js`

**Tasks:**
- [ ] Merchant repair budgets and priorities
- [ ] Pirate hideout repair system
- [ ] Navy free repairs at military ports
- [ ] Fisher village repairs (discounted)

**Success Criteria:**
- Each NPC type has unique repair strategy
- Pirates avoid main ports (use hideouts)
- Navy gets free repairs at bases

---

#### Day 12-14: Economy Integration
**Tasks:**
- [ ] Track port repair revenue
- [ ] Shipyards consume resources for repairs
- [ ] Generate "deliver materials to shipyard" quests
- [ ] Port tier upgrades based on repair activity

---

## Example Scenarios

### Scenario 1: Merchant Repair Cycle

```
Turn 1: Merchant "Captain Morgan" trading at Port Royal
        Ship: 100/100 HP, Gold: 500g

Turn 50: Morgan attacked by pirate!
         Combat: Morgan takes 35 damage
         Ship: 65/100 HP (65% - "Good" condition)

Turn 51: Morgan escapes combat, evaluates repairs
         Repair needed: 35 HP
         Cost at current port: 70g (2g per HP)
         Decision: "Continue route, repair later"

Turn 100: Morgan completes trade route
          Gold: 850g (350g profit)
          Ship: 65/100 HP

Turn 101: Morgan arrives at destination port
          Evaluates: Should I repair?
          Cost: 70g
          Profit margin: 350g
          Decision: "Yes, repair now" (has buffer)

Turn 102: Morgan pays 70g, repairs to 100/100 HP
          Port gains 70g revenue
          Morgan: 780g, 100/100 HP

Turn 103: Morgan starts new trade route (healthy ship)

Result: Merchant managed resources, repaired strategically
```

---

### Scenario 2: Pirate Emergency Repairs

```
Turn 1: Pirate "Blackbeard" hunting near trade route
        Ship: 100/100 HP, Gold: 300g, Repair Kits: 2

Turn 20: Blackbeard attacks merchant ship
         Combat begins

Turn 25: Player intervenes! Attacks Blackbeard
         Blackbeard: 75/100 HP (player cannon hit)

Turn 30: Blackbeard losing fight
         Blackbeard: 45/100 HP (45% - "Damaged")
         Decision: "Use repair kit!"

Turn 31: Blackbeard uses repair kit
         Blackbeard: 75/100 HP (+30 HP from kit)
         "Blackbeard used emergency repair kit!"

Turn 35: Combat continues, Blackbeard still losing
         Blackbeard: 28/100 HP (28% - "Critical")
         Decision: "FLEE! I'm going to die!"

Turn 36: Blackbeard flees combat
         Sets goal: "Reach hideout at (x: -50, y: 30)"

Turn 60: Blackbeard arrives at hideout (remote island)
         Hideout: Black market shipyard

Turn 61: Blackbeard evaluates repairs
         Repair needed: 72 HP
         Cost at hideout: 173g (2.4g per HP - black market)
         Gold: 300g
         Decision: "Repair fully"

Turn 62: Blackbeard repairs to 100/100 HP
         Gold: 127g remaining
         Repair kits: 1 (used 1 in combat)

Turn 63: Blackbeard rests at hideout for 1 day
         Restocks repair kits: Costs 300g
         Can't afford yet

Turn 100: Blackbeard raids fishing boat for 200g
          Gold: 327g

Turn 101: Blackbeard returns to hideout
          Buys 1 repair kit for 300g
          Gold: 27g, Repair kits: 2

Turn 102: Blackbeard resumes hunting (healthy, prepared)

Result: Pirate used repair kit in emergency, fled when critical,
        used hideout for repairs, raided to afford supplies
```

---

## Conclusion

**NPC Health Restoration** creates a **living economy** where:
- NPCs manage finite resources (gold, repair kits, HP)
- Damage has consequences (repair costs, downtime)
- Different NPC types have unique strategies
- Ports earn revenue from NPC repairs
- Shipyards consume resources (creates demand)
- Combat has lasting impact (damaged NPCs retreat)

**Perfect Integration:**
- **Radiant AI:** NPCs make smart repair decisions
- **Settlements:** Shipyards provide repair services
- **Crafting:** Repair kits as valuable craftable items
- **Economy:** Repair costs create gold sinks
- **Combat:** Damage matters, NPCs can be worn down

**Next Step:** Start with `npc-repair.js` - implement basic port repairs for NPCs, then add AI decision-making.

This makes your world feel **alive and consequential** - every battle, every storm, every decision matters! ⚓🔧
