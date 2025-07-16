// Fog of war system using rot.js FOV
class FogOfWar {
    constructor(mapGenerator) {
        this.mapGenerator = mapGenerator;
        this.fov = new ROT.FOV.PreciseShadowcasting(this.lightPassesCallback.bind(this));
        this.viewRadius = 7;
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
        
        // Calculate FOV from player position
        this.fov.compute(playerX, playerY, this.viewRadius, (x, y, r, visibility) => {
            // visibility is a value between 0 and 1
            if (visibility > 0) {
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
        this.viewRadius = Math.max(1, Math.min(radius, 15)); // Clamp between 1 and 15
    }
    
    getViewRadius() {
        return this.viewRadius;
    }
}