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
            if (glyphInfo && glyphInfo.resourceType && glyphInfo.resourceType !== 'biome_fallback') {
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

    // Serialization for save/load functionality
    serializeLocationStates() {
        try {
            const data = {
                version: '1.0',
                timestamp: Date.now(),
                maxLocationStates: this.maxLocationStates,
                cleanupInterval: this.cleanupInterval,
                locationExpiryTime: this.locationExpiryTime,
                lastCleanup: this.lastCleanup,
                locationStates: {}
            };

            // Convert Map to plain object for serialization
            for (const [key, state] of this.locationStates) {
                data.locationStates[key] = {
                    x: state.x,
                    y: state.y,
                    lastGathered: state.lastGathered,
                    depletionLevel: state.depletionLevel,
                    totalGathers: state.totalGathers,
                    regenerationTimer: state.regenerationTimer
                };
            }

            return JSON.stringify(data);
        } catch (error) {
            console.error('Failed to serialize resource location states:', error);
            return null;
        }
    }

    deserializeLocationStates(jsonString) {
        try {
            if (!jsonString) {
                return { success: true, message: 'No resource data to restore' };
            }

            const data = JSON.parse(jsonString);
            
            // Validate version compatibility
            if (!data.version || data.version !== '1.0') {
                return { success: false, message: 'Resource data version incompatible' };
            }

            // Restore configuration
            this.maxLocationStates = data.maxLocationStates || 1000;
            this.cleanupInterval = data.cleanupInterval || 600000;
            this.locationExpiryTime = data.locationExpiryTime || 3600000;
            this.lastCleanup = data.lastCleanup || Date.now();

            // Clear existing location states
            this.locationStates.clear();

            // Restore location states
            if (data.locationStates) {
                for (const [key, stateData] of Object.entries(data.locationStates)) {
                    this.locationStates.set(key, {
                        x: stateData.x || 0,
                        y: stateData.y || 0,
                        lastGathered: stateData.lastGathered || 0,
                        depletionLevel: stateData.depletionLevel || 0.0,
                        totalGathers: stateData.totalGathers || 0,
                        regenerationTimer: stateData.regenerationTimer || 0
                    });
                }
            }

            console.log(`ResourceManager: Restored ${this.locationStates.size} location states`);
            return { success: true, message: `Restored ${this.locationStates.size} resource locations` };

        } catch (error) {
            console.error('Failed to deserialize resource location states:', error);
            return { success: false, message: `Failed to restore resource data: ${error.message}` };
        }
    }

    // Performance optimization methods
    optimizeLocationStates() {
        const now = Date.now();
        let optimized = 0;

        // Remove fully regenerated locations that haven't been accessed recently
        for (const [key, state] of this.locationStates) {
            const timeSinceLastGather = now - state.lastGathered;
            
            // If location is fully regenerated and hasn't been accessed in a while, remove it
            if (state.depletionLevel <= 0.1 && timeSinceLastGather > this.locationExpiryTime / 2) {
                this.locationStates.delete(key);
                optimized++;
            }
        }

        if (optimized > 0) {
            console.log(`ResourceManager: Optimized ${optimized} location states`);
        }

        return optimized;
    }

    // Get performance metrics
    getPerformanceMetrics() {
        const now = Date.now();
        let activeLocations = 0;
        let depletedLocations = 0;
        let recentlyAccessed = 0;

        for (const [, state] of this.locationStates) {
            if (state.depletionLevel > 0.1) {
                activeLocations++;
            }
            if (state.depletionLevel >= 0.8) {
                depletedLocations++;
            }
            if (now - state.lastGathered < 300000) { // 5 minutes
                recentlyAccessed++;
            }
        }

        return {
            totalLocationStates: this.locationStates.size,
            activeLocations,
            depletedLocations,
            recentlyAccessed,
            memoryUsageEstimate: this.locationStates.size * 100, // Rough estimate in bytes
            lastCleanup: this.lastCleanup,
            nextCleanupIn: Math.max(0, this.cleanupInterval - (now - this.lastCleanup))
        };
    }

    // Resource examination and information system
    examineLocation(x, y) {
        // Get the biome at this location
        const tile = this.mapGenerator.getBiomeAt(x, y);
        if (!tile) {
            return { success: false, message: 'Invalid location' };
        }

        // Get biome configuration
        const biomeConfig = this.getBiomeResources(tile.biome);
        if (!biomeConfig) {
            return { 
                success: true, 
                biome: tile.biome,
                biomeName: this.getBiomeDisplayName(tile.biome),
                message: `This ${this.getBiomeDisplayName(tile.biome)} contains no gatherable resources.`,
                resources: [],
                gatheringInfo: null
            };
        }

        // Get location state for depletion info
        const locationState = this.getLocationState(x, y);
        const currentDepletion = this.calculateRegeneration(locationState, biomeConfig);
        locationState.depletionLevel = currentDepletion;

        // Calculate current success rate
        const successRate = this.calculateGatherSuccess(biomeConfig, locationState);

        // Get resource information
        const resourceInfo = biomeConfig.resources.map(resource => {
            const resourceDef = this.getResourceInfo(resource.type);
            return {
                type: resource.type,
                name: resourceDef ? resourceDef.name : resource.type,
                description: resourceDef ? resourceDef.description : 'Unknown resource',
                rarity: resourceDef ? resourceDef.rarity : 'common',
                icon: resourceDef ? resourceDef.icon : '?',
                weight: resource.weight,
                baseQuantity: resource.baseQuantity,
                probability: Math.round((resource.weight / biomeConfig.resources.reduce((sum, r) => sum + r.weight, 0)) * 100)
            };
        });

        // Determine gathering difficulty and hints
        let difficultyHint = '';
        let depletionHint = '';
        
        if (currentDepletion >= 0.8) {
            difficultyHint = 'This area appears completely picked clean.';
            depletionHint = 'Resources will regenerate over time.';
        } else if (currentDepletion >= 0.6) {
            difficultyHint = 'This area has been heavily gathered from recently.';
            depletionHint = 'Success rate is significantly reduced.';
        } else if (currentDepletion >= 0.4) {
            difficultyHint = 'This area shows signs of recent gathering activity.';
            depletionHint = 'Success rate is moderately reduced.';
        } else if (currentDepletion >= 0.2) {
            difficultyHint = 'This area has been lightly gathered from.';
            depletionHint = 'Success rate is slightly reduced.';
        } else {
            difficultyHint = 'This area appears untouched and resource-rich.';
            depletionHint = 'Success rate is at maximum.';
        }

        // Time-based regeneration info
        let regenerationHint = '';
        if (currentDepletion > 0) {
            const timeSinceLastGather = Date.now() - locationState.lastGathered;
            const regenProgress = Math.min(1, timeSinceLastGather / biomeConfig.regenerationTime);
            const timeRemaining = biomeConfig.regenerationTime - timeSinceLastGather;
            
            if (regenProgress >= 1) {
                regenerationHint = 'Resources have fully regenerated.';
            } else if (timeRemaining > 0) {
                const minutesRemaining = Math.ceil(timeRemaining / 60000);
                regenerationHint = `Resources will fully regenerate in ~${minutesRemaining} minutes.`;
            }
        }

        return {
            success: true,
            biome: tile.biome,
            biomeName: this.getBiomeDisplayName(tile.biome),
            message: `You examine the ${this.getBiomeDisplayName(tile.biome)} carefully.`,
            resources: resourceInfo,
            gatheringInfo: {
                successRate: Math.round(successRate * 100),
                depletionLevel: Math.round(currentDepletion * 100),
                difficultyHint: difficultyHint,
                depletionHint: depletionHint,
                regenerationHint: regenerationHint,
                baseSuccessRate: Math.round(biomeConfig.baseSuccessRate * 100),
                regenerationTime: Math.round(biomeConfig.regenerationTime / 60000) // in minutes
            }
        };
    }

    // Format examination results for consistent display across platforms
    formatExaminationResults(result, platform = 'web') {
        if (!result.success) {
            return [result.message];
        }

        const lines = [];
        lines.push(result.message);

        if (result.resources.length === 0) {
            return lines;
        }

        // Display available resources
        lines.push('');
        lines.push('Available resources:');
        
        result.resources.forEach(resource => {
            const rarityInfo = this.getResourceRarityInfo(resource.rarity);
            const symbol = this.getResourceDisplaySymbol(resource.type, platform);
            
            if (platform === 'terminal') {
                lines.push(`  ${symbol} ${resource.name} (${resource.probability}%) - ${rarityInfo.name}`);
            } else {
                lines.push(`  ${symbol} ${resource.name} (${resource.probability}%) - ${rarityInfo.name}`);
            }
        });

        // Display gathering information
        if (result.gatheringInfo) {
            const info = result.gatheringInfo;
            lines.push('');
            lines.push(`Success rate: ${info.successRate}% (base: ${info.baseSuccessRate}%)`);
            lines.push(`Depletion: ${info.depletionLevel}% | ${info.difficultyHint}`);
            
            if (info.regenerationHint) {
                lines.push(info.regenerationHint);
            }
        }

        return lines;
    }

    // Get display name for biome (consistent across platforms)
    getBiomeDisplayName(biome) {
        const biomeNames = {
            forest: 'Forest',
            desert: 'Desert',
            mountain: 'Mountain',
            beach: 'Beach',
            jungle: 'Jungle',
            savanna: 'Savanna',
            taiga: 'Taiga',
            tropical: 'Tropical Forest',
            swamp: 'Swamp',
            ocean: 'Ocean'
        };
        return biomeNames[biome] || biome;
    }

    // Get platform-appropriate resource display symbol
    getResourceDisplaySymbol(resourceType, platform = 'web', depleted = false) {
        const resourceInfo = this.getResourceInfo(resourceType);
        if (!resourceInfo) return '?';
        
        if (platform === 'terminal') {
            return depleted ? 
                (this.resourceGlyphs[resourceType]?.depletedTerminal || resourceInfo.char) : 
                resourceInfo.char;
        } else {
            return depleted ? 
                (this.resourceGlyphs[resourceType]?.depletedWeb || resourceInfo.icon) : 
                resourceInfo.icon;
        }
    }

    // Standardized gathering feedback messages (consistent across platforms)
    getGatheringFeedbackMessage(result, platform = 'web') {
        if (!result.success) {
            // Standardize failure messages
            if (result.message.includes('Inventory full')) {
                return platform === 'terminal' ? 
                    '⚠ Inventory full! Cannot gather more resources.' :
                    'Inventory full! Cannot gather more resources.';
            } else if (result.message.includes('picked clean')) {
                return platform === 'terminal' ? 
                    '✗ This area has been picked clean. Try again later.' :
                    'This area has been picked clean. Try again later.';
            } else if (result.message.includes('Cannot gather resources while on ship')) {
                return platform === 'terminal' ? 
                    '⚠ Cannot gather resources while on ship' :
                    'Cannot gather resources while on ship';
            } else if (result.message.includes('Nothing to gather here')) {
                return platform === 'terminal' ? 
                    '✗ Nothing to gather here' :
                    'Nothing to gather here';
            } else {
                return platform === 'terminal' ? 
                    '✗ You search around but find nothing useful.' :
                    'You search around but find nothing useful.';
            }
        } else {
            // Standardize success messages
            const resourceInfo = this.getResourceInfo(result.resource);
            const resourceName = resourceInfo ? resourceInfo.name : result.resource;
            const symbol = this.getResourceDisplaySymbol(result.resource, platform);
            
            return platform === 'terminal' ? 
                `✓ Gathered ${result.quantity} ${resourceName}! ${symbol}` :
                `Gathered ${result.quantity} ${resourceName}!`;
        }
    }

    // Get resource rarity information
    getResourceRarityInfo(rarity) {
        const rarityInfo = {
            common: {
                name: 'Common',
                color: '#95a5a6',
                description: 'Easily found in most locations'
            },
            uncommon: {
                name: 'Uncommon',
                color: '#3498db',
                description: 'Somewhat rare, requires specific conditions'
            },
            rare: {
                name: 'Rare',
                color: '#9b59b6',
                description: 'Difficult to find, valuable material'
            },
            epic: {
                name: 'Epic',
                color: '#e67e22',
                description: 'Very rare, highly sought after'
            },
            legendary: {
                name: 'Legendary',
                color: '#f1c40f',
                description: 'Extremely rare, legendary material'
            }
        };
        return rarityInfo[rarity] || rarityInfo.common;
    }

    // Get help information for resource gathering (consistent across platforms)
    getGatheringHelp(platform = 'web') {
        const controls = platform === 'terminal' ? {
            gather: 'G',
            inventory: 'I',
            examine: 'X',
            help: 'H',
            stats: 'T'
        } : {
            gather: 'G key or Gather button',
            inventory: 'I key or Inventory button',
            examine: 'X key or Examine button',
            help: 'H key or Help button',
            stats: 'T key or Stats button'
        };

        return {
            title: 'Resource Gathering Guide',
            sections: [
                {
                    title: 'Getting Started',
                    content: [
                        `Press ${controls.gather} to gather resources from your current location`,
                        'Move to any land biome (avoid ocean tiles)',
                        'Look for resource glyphs mixed in with terrain',
                        'Check your inventory with I to see collected resources',
                        'Cannot gather while aboard your ship - disembark first'
                    ]
                },
                {
                    title: 'Controls',
                    content: [
                        `${controls.gather} - Gather resources from current location`,
                        `${controls.inventory} - View and manage your inventory`,
                        `${controls.examine} - Examine location for resource info`,
                        `${controls.help} - Show this help guide`,
                        `${controls.stats} - View detailed gathering statistics`
                    ]
                },
                {
                    title: 'Biome Resources & Success Rates',
                    content: [
                        'Forest (70%): Wood 🌳, Berries 🫐 - High yield, fast regeneration',
                        'Desert (60%): Stone 🪨, Sand 🏖️ - Moderate yield, medium regeneration',
                        'Mountain (65%): Stone 🪨, Ore ⛏️ - Good for rare materials',
                        'Beach (65%): Driftwood 🌳, Sand 🏖️ - Coastal resources',
                        'Jungle (70%): Dense Wood 🌳, Exotic Berries 🫐 - High productivity',
                        'Savanna (60%): Hay 🌾, Scattered Wood 🌳 - Grassland materials',
                        'Taiga (70%): Coniferous Wood 🌳, Cold Berries 🫐 - Northern timber',
                        'Tropical (75%): Bamboo 🌳, Tropical Fruits 🫐 - Most productive',
                        'Swamp (55%): Reeds 🌿, Bog Berries 🫐 - Unique materials, lower rates'
                    ]
                },
                {
                    title: 'Resource Types & Uses',
                    content: [
                        'Wood: Essential building material, fuel source (Common)',
                        'Stone: Construction material, tool crafting (Common)',
                        'Sand: Glass making, construction filler (Common)',
                        'Berries: Food source, crafting ingredient (Common)',
                        'Hay: Animal feed, thatching material (Common)',
                        'Ore: Valuable metal crafting material (Uncommon)',
                        'Reeds: Rope making, weaving material (Uncommon)'
                    ]
                },
                {
                    title: 'Resource Depletion & Regeneration',
                    content: [
                        'Repeated gathering from same location reduces success rates',
                        'Depleted areas show dimmed resource glyphs',
                        'Regeneration times: 5-15 minutes depending on biome',
                        'Forest/Jungle: 5-8 minutes (fast regeneration)',
                        'Desert/Beach: 8-12 minutes (medium regeneration)',
                        'Mountain/Swamp: 12-18 minutes (slow regeneration)',
                        'Rotate between multiple locations for best efficiency'
                    ]
                },
                {
                    title: 'Advanced Strategies',
                    content: [
                        'Target resource-specific glyphs for better success rates',
                        'Examine locations first to preview available resources',
                        'Establish gathering circuits between 4-5 different areas',
                        'Prioritize rare materials (Ore, Reeds) when found',
                        'Keep inventory space free for unexpected rare finds',
                        'Fresh locations have higher success rates than depleted ones'
                    ]
                },
                {
                    title: 'Inventory Management',
                    content: [
                        'Resources automatically stack (up to 99 per type)',
                        'Total inventory capacity: 500 items',
                        'Inventory full prevents further gathering',
                        'Resources persist between game sessions',
                        'Keep 10-20 of essential resources (Wood, Stone, Berries)',
                        'Stockpile rare materials for future use'
                    ]
                },
                {
                    title: 'Troubleshooting',
                    content: [
                        '"Nothing to gather here" - On ocean or depleted land',
                        '"Cannot gather while on ship" - Disembark first',
                        '"Inventory full" - Clear space or use resources',
                        'Low success rate - Area may be depleted, try elsewhere',
                        'No resource glyphs - Move to different biome area',
                        'Dimmed glyphs - Location is depleted, wait for regeneration'
                    ]
                }
            ]
        };
    }

    // Get detailed resource information
    getDetailedResourceInfo(resourceType) {
        const resourceDef = this.getResourceInfo(resourceType);
        if (!resourceDef) {
            return null;
        }

        const rarityInfo = this.getResourceRarityInfo(resourceDef.rarity);
        
        // Find biomes that contain this resource
        const biomesWithResource = [];
        for (const [biomeName, biomeConfig] of Object.entries(this.biomeResources)) {
            const hasResource = biomeConfig.resources.some(r => r.type === resourceType);
            if (hasResource) {
                const resourceConfig = biomeConfig.resources.find(r => r.type === resourceType);
                biomesWithResource.push({
                    biome: biomeName,
                    biomeName: this.getBiomeDisplayName(biomeName),
                    probability: Math.round((resourceConfig.weight / biomeConfig.resources.reduce((sum, r) => sum + r.weight, 0)) * 100),
                    baseSuccessRate: Math.round(biomeConfig.baseSuccessRate * 100),
                    quantity: resourceConfig.baseQuantity
                });
            }
        }

        return {
            ...resourceDef,
            rarityInfo: rarityInfo,
            foundIn: biomesWithResource,
            uses: this.getResourceUses(resourceType)
        };
    }

    // Get potential uses for a resource (placeholder for future crafting system)
    getResourceUses(resourceType) {
        const uses = {
            stone: ['Building construction', 'Tool crafting', 'Weapon making'],
            sand: ['Glass production', 'Construction material', 'Filtration'],
            wood: ['Building construction', 'Fuel', 'Tool handles', 'Ship repairs'],
            hay: ['Animal feed', 'Thatching', 'Bedding', 'Insulation'],
            ore: ['Metal tools', 'Weapons', 'Advanced construction', 'Trading'],
            berries: ['Food', 'Medicine', 'Dyes', 'Preservation'],
            reeds: ['Rope making', 'Basket weaving', 'Paper', 'Thatching']
        };
        return uses[resourceType] || ['Unknown uses'];
    }
}

module.exports = ResourceManager;