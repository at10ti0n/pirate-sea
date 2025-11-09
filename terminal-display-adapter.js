// Display adapter for terminal rendering
// Converts web-style colors to ANSI terminal colors

class TerminalDisplayAdapter {
    constructor() {
        // Map hex colors to ANSI codes
        this.colorMap = {
            // Biome colors
            '#3498db': '\x1b[34m',    // ocean - blue
            '#2980b9': '\x1b[34m',    // ocean - blue (legacy)
            '#f39c12': '\x1b[33m',    // beach - yellow
            '#7f8c8d': '\x1b[90m',    // mountain - gray
            '#ecf0f1': '\x1b[97m',    // snow - bright white
            '#e67e22': '\x1b[33m',    // desert - orange/yellow
            '#d35400': '\x1b[33m',    // savanna - dark orange/yellow
            '#27ae60': '\x1b[32m',    // jungle - green
            '#16a085': '\x1b[36m',    // swamp - cyan
            '#2c3e50': '\x1b[34m',    // taiga - dark blue
            '#e74c3c': '\x1b[31m',    // tropical - red
            '#229954': '\x1b[32m',    // forest - green
            '#2ecc71': '\x1b[32m',    // grassland - bright green

            // Weather colors
            '#b0b0b0': '\x1b[90m',    // fog - gray
            '#6fa8dc': '\x1b[36m',    // rain - cyan/light blue
            '#3d5a80': '\x1b[34m',    // storm - dark blue
            '#1a1a2e': '\x1b[90m',    // hurricane - very dark (gray)

            // Entity colors
            '#8b4513': '\x1b[33m',    // ship - brown/yellow
            '#e74c3c': '\x1b[31m',    // port - red
            '#f1c40f': '\x1b[93m',    // treasure - bright yellow

            // Resource colors
            '#8b4513': '\x1b[33m',    // wood
            '#95a5a6': '\x1b[37m',    // stone
            '#7f8c8d': '\x1b[90m',    // ore
            '#e74c3c': '\x1b[31m',    // berries
            '#f39c12': '\x1b[33m',    // hay
            '#2ecc71': '\x1b[32m',    // reeds
            '#ecf0f1': '\x1b[37m'     // sand
        };

        // Reset code
        this.reset = '\x1b[0m';
    }

    // Convert hex color to ANSI
    toAnsi(hexColor) {
        return this.colorMap[hexColor.toLowerCase()] || '\x1b[37m'; // Default to white
    }

    // Apply color to text
    colorText(text, hexColor) {
        const ansi = this.toAnsi(hexColor);
        return `${ansi}${text}${this.reset}`;
    }

    // Convert biome definition from web to terminal format
    convertBiome(biome) {
        return {
            char: biome.char,
            color: this.toAnsi(biome.color),
            walkable: biome.walkable,
            shipWalkable: biome.shipWalkable
        };
    }

    // Convert all biomes
    convertBiomes(biomes) {
        const terminalBiomes = {};
        for (const [key, biome] of Object.entries(biomes)) {
            terminalBiomes[key] = this.convertBiome(biome);
        }
        return terminalBiomes;
    }

    // Convert entity for terminal display
    convertEntity(entity) {
        const terminalEntity = { ...entity };
        if (entity.color && entity.color.startsWith('#')) {
            terminalEntity.color = this.toAnsi(entity.color);
        }
        return terminalEntity;
    }

    // Convert entity type definition
    convertEntityType(entityType) {
        return {
            char: entityType.char,
            color: this.toAnsi(entityType.color)
        };
    }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalDisplayAdapter;
}
