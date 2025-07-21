// Resource management system for biome-specific resource gathering
class ResourceManager {
    constructor(mapGenerator, seededRandom) {
        this.mapGenerator = mapGenerator;
        this.seededRandom = seededRandom;
        this.locationStates = new Map(); // Track depletion/regeneration per location
        
        // Configuration for cleanup system
        this.maxLocationStates = 1000; // Maximum number of location states to keep
        this.cleanupInterval = 600000; // Cleanup every 10 minutes
        this.locationExpiryTime = 3600000; // Remove locations not accessed for 1 hour
        this.lastCleanup = Date.now();
        
        this.initializeResourceDefinitions();
        this.initializeBiomeResources();
        this.initializeResourceGlyphs();
    }

    initializeResourceDefinitions() {
        this.resourceDefinitions = {
            stone: {
                type: 'stone',
                name: 'Stone',
                description: 'Sturdy building and tool material',
                category: 'material',
                stackable: true,
                maxStack: 99,
                rarity: 'common',
                icon: '🪨',
                char: '◆'
            },
            sand: {
                type: 'sand',
                name: 'Sand',
                description: 'Fine granules for glass-making and construction',
                category: 'material',
                stackable: true,
                maxStack: 99,
                rarity: 'common',
                icon: '🏖️',
                char: '∴'
            },
            wood: {
                type: 'wood',
                name: 'Wood',
                description: 'Primary building and fuel material',
                category: 'material',
                stackable: true,
                maxStack: 99,
                rarity: 'common',
                icon: '🌳',
                char: '♠'
            },
            hay: {
                type: 'hay',
                name: 'Hay',
                description: 'Animal feed and thatching material',
                category: 'material',
                stackable: true,
                maxStack: 99,
                rarity: 'common',
                icon: '🌾',
                char: '"'
            },
            ore: {
                type: 'ore',
                name: 'Ore',
                description: 'Metal crafting material',
                category: 'material',
                stackable: true,
                maxStack: 99,
                rarity: 'uncommon',
                icon: '⛏️',
                char: '▲'
            },
            berries: {
                type: 'berries',
                name: 'Berries',
                description: 'Food and preservation material',
                category: 'food',
                stackable: true,
                maxStack: 99,
                rarity: 'common',
                icon: '🫐',
                char: '*'
            },
            reeds: {
                type: 'reeds',
                name: 'Reeds',
                description: 'Rope-making and weaving material',
                category: 'material',
                stackable: true,
                maxStack: 99,
                rarity: 'common',
                icon: '🌿',
                char: '|'
            }
        };
    }

    initializeBiomeResources() {
        this.biomeResources = {
            forest: {
                resources: [
                    { type: 'wood', weight: 60, baseQuantity: [1, 3] },
                    { type: 'berries', weight: 40, baseQuantity: [1, 2] }
                ],
                glyphDistribution: [
                    { glyph: 'wood', weight: 45 },
                    { glyph: 'berries', weight: 25 },
                    { glyph: 'biome_fallback', weight: 30 }
                ],
                baseSuccessRate: 0.7,
                depletionRate: 0.1,
                regenerationTime: 300000 // 5 minutes
            },
            desert: {
                resources: [
                    { type: 'stone', weight: 60, baseQuantity: [1, 2] },
                    { type: 'sand', weight: 40, baseQuantity: [1, 3] }
                ],
                glyphDistribution: [
                    { glyph: 'stone', weight: 40 },
                    { glyph: 'sand', weight: 35 },
                    { glyph: 'biome_fallback', weight: 25 }
                ],
                baseSuccessRate: 0.6,
                depletionRate: 0.15,
                regenerationTime: 600000 // 10 minutes
            },
            mountain: {
                resources: [
                    { type: 'stone', weight: 50, baseQuantity: [1, 2] },
                    { type: 'ore', weight: 50, baseQuantity: [1, 1] }
                ],
                glyphDistribution: [
                    { glyph: 'stone', weight: 35 },
                    { glyph: 'ore', weight: 25 },
                    { glyph: 'biome_fallback', weight: 40 }
                ],
                baseSuccessRate: 0.5,
                depletionRate: 0.2,
                regenerationTime: 900000 // 15 minutes
            },
            beach: {
                resources: [
                    { type: 'wood', weight: 50, baseQuantity: [1, 2] },
                    { type: 'sand', weight: 50, baseQuantity: [1, 3] }
                ],
                glyphDistribution: [
                    { glyph: 'wood', weight: 30 },
                    { glyph: 'sand', weight: 40 },
                    { glyph: 'biome_fallback', weight: 30 }
                ],
                baseSuccessRate: 0.65,
                depletionRate: 0.12,
                regenerationTime: 450000 // 7.5 minutes
            },
            jungle: {
                resources: [
                    { type: 'wood', weight: 60, baseQuantity: [1, 3] },
                    { type: 'berries', weight: 40, baseQuantity: [1, 2] }
                ],
                glyphDistribution: [
                    { glyph: 'wood', weight: 40 },
                    { glyph: 'berries', weight: 30 },
                    { glyph: 'biome_fallback', weight: 30 }
                ],
                baseSuccessRate: 0.75,
                depletionRate: 0.08,
                regenerationTime: 240000 // 4 minutes
            },
            savanna: {
                resources: [
                    { type: 'hay', weight: 60, baseQuantity: [1, 3] },
                    { type: 'wood', weight: 40, baseQuantity: [1, 2] }
                ],
                glyphDistribution: [
                    { glyph: 'hay', weight: 45 },
                    { glyph: 'wood', weight: 25 },
                    { glyph: 'biome_fallback', weight: 30 }
                ],
                baseSuccessRate: 0.7,
                depletionRate: 0.1,
                regenerationTime: 360000 // 6 minutes
            },
            taiga: {
                resources: [
                    { type: 'wood', weight: 60, baseQuantity: [1, 3] },
                    { type: 'berries', weight: 40, baseQuantity: [1, 2] }
                ],
                glyphDistribution: [
                    { glyph: 'wood', weight: 45 },
                    { glyph: 'berries', weight: 25 },
                    { glyph: 'biome_fallback', weight: 30 }
                ],
                baseSuccessRate: 0.65,
                depletionRate: 0.12,
                regenerationTime: 420000 // 7 minutes
            },
            tropical: {
                resources: [
                    { type: 'wood', weight: 60, baseQuantity: [1, 3] },
                    { type: 'berries', weight: 40, baseQuantity: [1, 2] }
                ],
                glyphDistribution: [
                    { glyph: 'wood', weight: 40 },
                    { glyph: 'berries', weight: 30 },
                    { glyph: 'biome_fallback', weight: 30 }
                ],
                baseSuccessRate: 0.8,
                depletionRate: 0.07,
                regenerationTime: 180000 // 3 minutes
            },
            swamp: {
                resources: [
                    { type: 'reeds', weight: 60, baseQuantity: [1, 3] },
                    { type: 'berries', weight: 40, baseQuantity: [1, 2] }
                ],
                glyphDistribution: [
                    { glyph: 'reeds', weight: 45 },
                    { glyph: 'berries', weight: 25 },
                    { glyph: 'biome_fallback', weight: 30 }
                ],
                baseSuccessRate: 0.6,
                depletionRate: 0.15,
                regenerationTime: 540000 // 9 minutes
            }
        };
    }

    initializeResourceGlyphs() {
        this.resourceGlyphs = {
            stone: { 
                web: '🪨', 
                terminal: '◆', 
                color: '#7f8c8d',
                depletedWeb: '🗿',
                depletedTerminal: '◇',
                depletedColor: '#95a5a6'
            },
            sand: { 
                web: '🏖️', 
                terminal: '∴', 
                color: '#f39c12',
                depletedWeb: '⏳',
                depletedTerminal: '∵',
                depletedColor: '#d68910'
            },
            wood: { 
                web: '🌳', 
                terminal: '♠', 
                color: '#27ae60',
                depletedWeb: '🪵',
                depletedTerminal: '♤',
                depletedColor: '#58d68d'
            },
            hay: { 
                web: '🌾', 
                terminal: '"', 
                color: '#f1c40f',
                depletedWeb: '🌱',
                depletedTerminal: '.',
                depletedColor: '#f4d03f'
            },
            ore: { 
                web: '⛏️', 
                terminal: '▲', 
                color: '#34495e',
                depletedWeb: '⚒️',
                depletedTerminal: '△',
                depletedColor: '#5d6d7e'
            },
            berries: { 
                web: '🫐', 
                terminal: '*', 
                color: '#e74c3c',
                depletedWeb: '🍃',
                depletedTerminal: '°',
                depletedColor: '#ec7063'
            },
            reeds: { 
                web: '🌿', 
                terminal: '|', 
                color: '#16a085',
                depletedWeb: '🌾',
                depletedTerminal: '¦',
                depletedColor: '#48c9b0'
            }
        };
    }

    // Core resource management methods
    getBiomeResources(biomeType) {
        return this.biomeResources[biomeType] || null;
    }

    getResourceInfo(resourceType) {
        return this.resourceDefinitions[resourceType] || null;
    }

    getResourceGlyph(resourceType, platform = 'web', depleted = false) {
        const glyph = this.resourceGlyphs[resourceType];
        if (!glyph) return null;
        
        if (depleted) {
            if (platform === 'terminal') {
                return glyph.depletedTerminal || glyph.terminal;
            } else {
                return glyph.depletedWeb || glyph.web;
            }
        }
        
        return platform === 'terminal' ? glyph.terminal : glyph.web;
    }

    getResourceColor(resourceType, depleted = false) {
        const glyph = this.resourceGlyphs[resourceType];
        if (!glyph) return null;
        
        return depleted ? (glyph.depletedColor || glyph.color) : glyph.color;
    }

    // Location state management for depletion/regeneration
    getLocationKey(x, y) {
        return `${x},${y}`;
    }

    getLocationState(x, y) {
        const key = this.getLocationKey(x, y);
        return this.locationStates.get(key) || {
            x: x,
            y: y,
            lastGathered: 0,
            depletionLevel: 0.0,
            totalGathers: 0,
            regenerationTimer: 0
        };
    }

    updateLocationState(x, y, newState) {
        const key = this.getLocationKey(x, y);
        this.locationStates.set(key, newState);
    }

    isLocationDepleted(x, y) {
        const state = this.getLocationState(x, y);
        return state.depletionLevel >= 0.8; // 80% depleted
    }

    // Check if location should show depleted visual state
    isLocationVisuallyDepleted(x, y) {
        const state = this.getLocationState(x, y);
        
        // Get the biome at this location to check regeneration
        const tile = this.mapGenerator.getBiomeAt(x, y);
        if (!tile) return false;
        
        const biomeConfig = this.getBiomeResources(tile.biome);
        if (!biomeConfig) return false;
        
        // Calculate current depletion level with regeneration
        const currentDepletion = this.calculateRegeneration(state, biomeConfig);
        
        // Show depleted visual if depletion is above 40% (more sensitive than gathering block)
        return currentDepletion >= 0.4;
    }

    // Calculate time-based regeneration
    calculateRegeneration(locationState, biomeConfig) {
        const now = Date.now();
        const timeSinceLastGather = now - locationState.lastGathered;
        
        if (timeSinceLastGather > biomeConfig.regenerationTime) {
            // Full regeneration after regeneration time
            return 0.0;
        } else {
            // Gradual regeneration over time
            const regenProgress = timeSinceLastGather / biomeConfig.regenerationTime;
            return Math.max(0, locationState.depletionLevel * (1 - regenProgress));
        }
    }

    // Core gathering mechanics
    attemptGather(x, y, playerInventory) {
        // Get the biome at this location
        const tile = this.mapGenerator.getBiomeAt(x, y);
        if (!tile) {
            return { success: false, message: 'Invalid location' };
        }

        // Check if this biome has resources
        const biomeConfig = this.getBiomeResources(tile.biome);
        if (!biomeConfig) {
            return { success: false, message: 'Nothing to gather here' };
        }

        // Get location state for depletion tracking
        const locationState = this.getLocationState(x, y);
        
        // Calculate current depletion level (with regeneration)
        const currentDepletion = this.calculateRegeneration(locationState, biomeConfig);
        locationState.depletionLevel = currentDepletion;

        // Check if location is too depleted
        if (this.isLocationDepleted(x, y)) {
            return { success: false, message: 'This area has been picked clean. Try again later.' };
        }

        // Calculate success rate
        const successRate = this.calculateGatherSuccess(biomeConfig, locationState);
        
        // Attempt gathering
        const gatherRoll = this.seededRandom.random();
        if (gatherRoll > successRate) {
            // Failed to gather - still update location state
            this.updateLocationAfterAttempt(x, y, locationState, false);
            return { success: false, message: 'You search around but find nothing useful.' };
        }

        // Success! Determine what resource to gather
        const gatheredResource = this.selectResourceToGather(biomeConfig, x, y);
        if (!gatheredResource) {
            return { success: false, message: 'Nothing to gather here' };
        }

        // Determine quantity
        const quantity = this.calculateGatherQuantity(gatheredResource, locationState);

        // Check if inventory has space
        if (!playerInventory.hasSpace(quantity)) {
            return { success: false, message: 'Inventory full! Cannot gather more resources.' };
        }

        // Add resource to inventory
        const addResult = playerInventory.addResource(gatheredResource.type, quantity);
        if (!addResult.success) {
            return { success: false, message: addResult.message };
        }

        // Update location state after successful gather
        this.updateLocationAfterAttempt(x, y, locationState, true);

        // Get resource info for display
        const resourceInfo = this.getResourceInfo(gatheredResource.type);
        const resourceName = resourceInfo ? resourceInfo.name : gatheredResource.type;

        return { 
            success: true, 
            message: `Gathered ${quantity} ${resourceName}!`,
            resource: gatheredResource.type,
            quantity: quantity
        };
    }

    // Calculate gathering success rate
    calculateGatherSuccess(biomeConfig, locationState) {
        const baseRate = biomeConfig.baseSuccessRate;
        const depletionPenalty = locationState.depletionLevel * 0.7; // Max 70% penalty
        
        // Time bonus for waiting between gathers
        const now = Date.now();
        const timeSinceLastGather = now - locationState.lastGathered;
        const timeBonus = Math.min(0.2, timeSinceLastGather / (5 * 60 * 1000)); // Max 20% bonus after 5 minutes
        
        const finalRate = Math.max(0.1, baseRate - depletionPenalty + timeBonus);
        return Math.min(0.95, finalRate); // Cap at 95%
    }

    // Select which resource to gather based on biome config and tile glyph
    selectResourceToGather(biomeConfig, x, y) {
        // Get the tile to determine biome
        const tile = this.mapGenerator.getBiomeAt(x, y);
        
        // Check if this tile has a specific resource glyph (if map generator supports it)
        if (this.mapGenerator.generateResourceGlyph) {
            const glyphInfo = this.mapGenerator.generateResourceGlyph(x, y, tile.biome, this);
            
            // If tile shows a specific resource glyph, bias towards that resource
            if (glyphInfo.resourceType && glyphInfo.resourceType !== 'biome_fallback') {
                // Find the resource in biome config
                const biasedResource = biomeConfig.resources.find(r => r.type === glyphInfo.resourceType);
                if (biasedResource) {
                    // 70% chance to get the resource shown by the glyph
                    if (this.seededRandom.random() < 0.7) {
                        return biasedResource;
                    }
                }
            }
        }

        // Otherwise, use weighted random selection
        const totalWeight = biomeConfig.resources.reduce((sum, resource) => sum + resource.weight, 0);
        const randomValue = this.seededRandom.random() * totalWeight;
        
        let currentWeight = 0;
        for (const resource of biomeConfig.resources) {
            currentWeight += resource.weight;
            if (randomValue <= currentWeight) {
                return resource;
            }
        }

        // Fallback to first resource
        return biomeConfig.resources[0];
    }

    // Calculate quantity of resources gathered
    calculateGatherQuantity(resourceConfig, locationState) {
        const [minQuantity, maxQuantity] = resourceConfig.baseQuantity;
        
        // Reduce quantity based on depletion
        const depletionPenalty = locationState.depletionLevel * 0.5; // Up to 50% reduction
        const effectiveMin = Math.max(1, Math.floor(minQuantity * (1 - depletionPenalty)));
        const effectiveMax = Math.max(effectiveMin, Math.floor(maxQuantity * (1 - depletionPenalty)));
        
        // Random quantity within range
        const quantity = this.seededRandom.randomInt(effectiveMin, effectiveMax);
        return Math.max(1, quantity); // Always at least 1
    }

    // Update location state after a gathering attempt
    updateLocationAfterAttempt(x, y, locationState, wasSuccessful) {
        const now = Date.now();
        
        locationState.lastGathered = now;
        locationState.totalGathers += 1;
        
        if (wasSuccessful) {
            // Get biome config for depletion rate
            const tile = this.mapGenerator.getBiomeAt(x, y);
            const biomeConfig = this.getBiomeResources(tile.biome);
            
            if (biomeConfig) {
                // Increase depletion
                locationState.depletionLevel = Math.min(1.0, 
                    locationState.depletionLevel + biomeConfig.depletionRate
                );
            }
        }
        
        // Update the stored state
        this.updateLocationState(x, y, locationState);
        
        // Trigger cleanup if needed
        this.performCleanupIfNeeded();
    }

    // Cleanup system for managing memory usage
    performCleanupIfNeeded() {
        const now = Date.now();
        
        // Check if it's time for cleanup
        if (now - this.lastCleanup < this.cleanupInterval) {
            return;
        }
        
        // Check if we need cleanup (too many locations or time-based)
        if (this.locationStates.size > this.maxLocationStates || 
            now - this.lastCleanup > this.cleanupInterval) {
            this.cleanupOldLocationStates();
            this.lastCleanup = now;
        }
    }

    cleanupOldLocationStates() {
        const now = Date.now();
        const locationsToRemove = [];
        
        // Find locations that haven't been accessed recently
        for (const [key, state] of this.locationStates) {
            const timeSinceLastAccess = now - state.lastGathered;
            
            // Remove locations that haven't been accessed for a long time
            if (timeSinceLastAccess > this.locationExpiryTime) {
                locationsToRemove.push(key);
            }
        }
        
        // If we still have too many locations, remove the oldest ones
        if (this.locationStates.size - locationsToRemove.length > this.maxLocationStates) {
            const allStates = Array.from(this.locationStates.entries());
            
            // Sort by last accessed time (oldest first)
            allStates.sort((a, b) => a[1].lastGathered - b[1].lastGathered);
            
            // Add more locations to remove until we're under the limit
            const targetRemoval = this.locationStates.size - this.maxLocationStates;
            for (let i = 0; i < targetRemoval && i < allStates.length; i++) {
                const key = allStates[i][0];
                if (!locationsToRemove.includes(key)) {
                    locationsToRemove.push(key);
                }
            }
        }
        
        // Remove the selected locations
        for (const key of locationsToRemove) {
            this.locationStates.delete(key);
        }
        
        if (locationsToRemove.length > 0) {
            console.log(`ResourceManager: Cleaned up ${locationsToRemove.length} old location states`);
        }
    }

    // Get cleanup statistics for monitoring
    getCleanupStats() {
        return {
            totalLocationStates: this.locationStates.size,
            maxLocationStates: this.maxLocationStates,
            lastCleanup: this.lastCleanup,
            cleanupInterval: this.cleanupInterval,
            locationExpiryTime: this.locationExpiryTime
        };
    }

    // Force cleanup (useful for testing or manual management)
    forceCleanup() {
        this.cleanupOldLocationStates();
        this.lastCleanup = Date.now();
    }
}

module.exports = ResourceManager;