// Seeded random number generator for deterministic procedural generation
class SeededRandom {
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.state = this.hashSeed(seed);
    }
    
    // Simple hash function to convert seed to initial state
    hashSeed(seed) {
        let hash = 0;
        const str = seed.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) || 1; // Ensure non-zero
    }
    
    // Linear Congruential Generator (LCG) for deterministic random numbers
    next() {
        this.state = (this.state * 1664525 + 1013904223) % 4294967296;
        return this.state / 4294967296;
    }
    
    // Generate random float between 0 and 1
    random() {
        return this.next();
    }
    
    // Generate random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
    
    // Generate random float between min and max
    randomFloat(min, max) {
        return this.random() * (max - min) + min;
    }
    
    // Choose random element from array
    choice(array) {
        if (array.length === 0) return undefined;
        return array[Math.floor(this.random() * array.length)];
    }
    
    // Shuffle array in place using Fisher-Yates algorithm
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Generate seeded noise (simple implementation)
    noise2D(x, y) {
        // Simple 2D noise using the seed
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
        return (n - Math.floor(n));
    }
    
    // Reset to original seed
    reset() {
        this.state = this.hashSeed(this.seed);
    }
    
    // Get current seed
    getSeed() {
        return this.seed;
    }
    
    // Set new seed
    setSeed(newSeed) {
        this.seed = newSeed;
        this.state = this.hashSeed(newSeed);
    }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeededRandom;
} else if (typeof window !== 'undefined') {
    window.SeededRandom = SeededRandom;
}