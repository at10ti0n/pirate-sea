// Fog of war system using rot.js FOV

// Support both browser and Node.js environments
let ROT;
if (typeof window !== 'undefined' && window.ROT) {
    ROT = window.ROT;
} else if (typeof require !== 'undefined') {
    ROT = require('rot-js');
}

class FogOfWar {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.fov = new ROT.FOV.PreciseShadowcasting(this.lightPassesCallback.bind(this));
        this.baseViewRadius = 10; // Base visibility radius
        this.currentViewRadius = 10;
        this.weatherManager = null; // Will be set by game
        this.timeOfDay = 12; // 0-24 hour format, starts at noon
    }

    setWeatherManager(weatherManager) {
        this.weatherManager = weatherManager;
    }

    updateTimeOfDay(delta = 0.1) {
        // Advance time (0.1 = 6 minutes per turn)
        this.timeOfDay = (this.timeOfDay + delta) % 24;
    }

    getTimeOfDayMultiplier() {
        // Night: reduced visibility (22:00 - 6:00)
        // Dawn/Dusk: moderate visibility (6:00-8:00, 18:00-22:00)
        // Day: full visibility (8:00-18:00)

        if (this.timeOfDay >= 8 && this.timeOfDay < 18) {
            return 1.0; // Full visibility during day
        } else if (this.timeOfDay >= 6 && this.timeOfDay < 8) {
            return 0.8; // Dawn - slightly reduced
        } else if (this.timeOfDay >= 18 && this.timeOfDay < 22) {
            return 0.7; // Dusk - more reduced
        } else {
            return 0.5; // Night - significantly reduced
        }
    }

    getWeatherVisibilityMultiplier(x, y) {
        if (!this.weatherManager) return 1.0;

        const weather = this.weatherManager.getWeatherAt(x, y);
        if (!weather) return 1.0; // Clear weather

        // Different weather types affect visibility differently
        switch (weather.type) {
            case 'fog':
                return 0.5; // Heavy visibility reduction
            case 'rain':
                return 0.8; // Moderate reduction
            case 'storm':
                return 0.6; // Significant reduction
            case 'hurricane':
                return 0.4; // Severe reduction
            default:
                return 1.0;
        }
    }

    calculateViewRadius(playerX, playerY) {
        // Start with base radius
        let radius = this.baseViewRadius;

        // Apply time of day modifier
        radius *= this.getTimeOfDayMultiplier();

        // Apply weather modifier at player's position
        const weatherMod = this.getWeatherVisibilityMultiplier(playerX, playerY);
        radius *= weatherMod;

        // Ensure minimum visibility
        this.currentViewRadius = Math.max(3, Math.floor(radius));
        return this.currentViewRadius;
    }

    lightPassesCallback(x, y) {
        // Light passes through all tiles except mountains and walls
        const tile = this.mapGenerator.getBiomeAt(x, y);
        if (!tile) return true; // Allow light through unexplored areas
        
        // Block light for mountains and snow (acting as walls)
        return tile.biome !== 'mountain' && tile.biome !== 'snow';
    }
    
    updateVisibility(playerX, playerY) {
        // Clear current visibility
        this.mapGenerator.clearVisibility();

        // Calculate dynamic view radius based on weather and time
        const viewRadius = this.calculateViewRadius(playerX, playerY);

        // Calculate FOV from player position using ROT.js circular shadowcasting
        this.fov.compute(playerX, playerY, viewRadius, (x, y, r, visibility) => {
            // visibility is a value between 0 and 1 from ROT.js
            // r is the distance from the player
            // IMPORTANT: Filter by circular distance, not just visibility
            const dx = x - playerX;
            const dy = y - playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (visibility > 0 && distance <= viewRadius) {
                this.mapGenerator.setVisibility(x, y, true);
            }
        });

        // Always ensure player position is visible
        this.mapGenerator.setVisibility(playerX, playerY, true);
    }
    
    isVisible(x, y) {
        const tile = this.mapGenerator.getBiomeAt(x, y);
        return tile ? tile.visible : false;
    }
    
    isExplored(x, y) {
        const tile = this.mapGenerator.getBiomeAt(x, y);
        return tile ? tile.explored : false;
    }
    
    getTileVisibilityState(x, y) {
        const tile = this.mapGenerator.getBiomeAt(x, y);
        if (!tile) return 'hidden';
        
        if (tile.visible) return 'visible';
        if (tile.explored) return 'explored';
        return 'hidden';
    }
    
    getVisibilityModifier(x, y) {
        const state = this.getTileVisibilityState(x, y);
        switch (state) {
            case 'visible':
                return 1.0; // Full brightness
            case 'explored':
                return 0.5; // Dimmed
            case 'hidden':
            default:
                return 0.0; // Hidden
        }
    }
    
    shouldRenderTile(x, y) {
        const state = this.getTileVisibilityState(x, y);
        return state !== 'hidden';
    }
    
    shouldRenderEntity(x, y) {
        // Only render entities in currently visible tiles
        return this.isVisible(x, y);
    }
    
    shouldRenderPlayer(x, y) {
        // Player is always visible at their position
        return true;
    }
    
    getVisibleTiles() {
        const visibleTiles = [];
        for (let y = 0; y < this.mapGenerator.height; y++) {
            for (let x = 0; x < this.mapGenerator.width; x++) {
                if (this.isVisible(x, y)) {
                    visibleTiles.push({ x, y });
                }
            }
        }
        return visibleTiles;
    }
    
    getExploredTiles() {
        const exploredTiles = [];
        for (let y = 0; y < this.mapGenerator.height; y++) {
            for (let x = 0; x < this.mapGenerator.width; x++) {
                if (this.isExplored(x, y)) {
                    exploredTiles.push({ x, y });
                }
            }
        }
        return exploredTiles;
    }
    
    setViewRadius(radius) {
        this.baseViewRadius = Math.max(1, Math.min(radius, 15)); // Clamp between 1 and 15
    }

    getViewRadius() {
        return this.currentViewRadius;
    }

    getTimeOfDayString() {
        const hour = Math.floor(this.timeOfDay);
        const minute = Math.floor((this.timeOfDay % 1) * 60);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    getTimeOfDayPeriod() {
        if (this.timeOfDay >= 5 && this.timeOfDay < 8) return 'Dawn';
        if (this.timeOfDay >= 8 && this.timeOfDay < 12) return 'Morning';
        if (this.timeOfDay >= 12 && this.timeOfDay < 18) return 'Afternoon';
        if (this.timeOfDay >= 18 && this.timeOfDay < 22) return 'Dusk';
        return 'Night';
    }
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FogOfWar;
}