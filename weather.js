// Weather Events System
// Handles dynamic weather generation, movement, and effects on ships

class WeatherManager {
    constructor(seededRandom = null) {
        this.seededRandom = seededRandom || { random: () => Math.random() };
        this.weatherSystems = [];
        this.weatherNoise = null;
        this.initializeConstants();
    }

    initializeConstants() {
        // Weather type configurations
        this.WEATHER_TYPES = {
            clear: {
                name: 'Clear',
                damage: 0,
                probability: 0.60,  // 60% of map
                color: null,
                char: null
            },
            fog: {
                name: 'Fog',
                damage: 0,
                probability: 0.15,  // 15% of map
                color: '#b0b0b0',
                char: '≋'
            },
            rain: {
                name: 'Rain',
                damage: 2,
                probability: 0.15,  // 15% of map
                color: '#6fa8dc',
                char: '∴'
            },
            storm: {
                name: 'Storm',
                damage: 8,
                probability: 0.08,  // 8% of map
                color: '#3d5a80',
                char: '※'
            },
            hurricane: {
                name: 'Hurricane',
                damage: 15,
                probability: 0.02,  // 2% of map
                color: '#1a1a2e',
                char: '⚇'
            }
        };

        // Number of active weather systems
        this.MAX_WEATHER_SYSTEMS = 5;
        this.MIN_WEATHER_SYSTEMS = 3;
    }

    /**
     * Initialize weather noise generator
     */
    initializeNoise() {
        if (typeof ROT !== 'undefined') {
            this.weatherNoise = new ROT.Noise.Simplex();
        }
    }

    /**
     * Generate initial weather systems
     */
    generateWeather(centerX = 0, centerY = 0) {
        this.weatherSystems = [];

        // Create 3-5 initial weather systems
        const numSystems = Math.floor(this.seededRandom.random() *
            (this.MAX_WEATHER_SYSTEMS - this.MIN_WEATHER_SYSTEMS + 1)) + this.MIN_WEATHER_SYSTEMS;

        for (let i = 0; i < numSystems; i++) {
            this.spawnWeatherSystem(centerX, centerY);
        }

        console.log(`Generated ${this.weatherSystems.length} weather systems`);
    }

    /**
     * Spawn a new weather system
     */
    spawnWeatherSystem(centerX = 0, centerY = 0) {
        // Random position within range of center
        const angle = this.seededRandom.random() * Math.PI * 2;
        const distance = 20 + this.seededRandom.random() * 40;
        const x = Math.round(centerX + Math.cos(angle) * distance);
        const y = Math.round(centerY + Math.sin(angle) * distance);

        // Determine weather type based on probability
        const roll = this.seededRandom.random();
        let weatherType = 'clear';
        let cumulativeProbability = 0;

        // Skip 'clear' and assign actual weather
        const weatherOptions = ['fog', 'rain', 'storm', 'hurricane'];
        const totalProb = 0.40; // 40% for weather (100% - 60% clear)

        for (const type of weatherOptions) {
            const normalizedProb = this.WEATHER_TYPES[type].probability / totalProb;
            cumulativeProbability += normalizedProb;
            if (roll < cumulativeProbability) {
                weatherType = type;
                break;
            }
        }

        // Random movement direction and speed
        const moveAngle = this.seededRandom.random() * Math.PI * 2;
        const moveSpeed = 0.3 + this.seededRandom.random() * 0.7; // 0.3 - 1.0 tiles per turn

        const weather = {
            id: `weather_${Date.now()}_${Math.random()}`,
            type: weatherType,
            x: x,
            y: y,
            radius: 5 + Math.floor(this.seededRandom.random() * 10), // 5-15 tiles
            moveX: Math.cos(moveAngle) * moveSpeed,
            moveY: Math.sin(moveAngle) * moveSpeed,
            intensity: 0.6 + this.seededRandom.random() * 0.4, // 0.6 - 1.0
            duration: 100 + Math.floor(this.seededRandom.random() * 200), // 100-300 turns
            age: 0
        };

        this.weatherSystems.push(weather);
        return weather;
    }

    /**
     * Update weather systems (movement, aging, spawning/despawning)
     */
    updateWeather(centerX = 0, centerY = 0) {
        // Move and age weather systems
        for (let i = this.weatherSystems.length - 1; i >= 0; i--) {
            const weather = this.weatherSystems[i];

            // Move weather
            weather.x += weather.moveX;
            weather.y += weather.moveY;
            weather.age++;

            // Remove expired weather
            if (weather.age >= weather.duration) {
                this.weatherSystems.splice(i, 1);
            }
        }

        // Maintain minimum number of weather systems
        while (this.weatherSystems.length < this.MIN_WEATHER_SYSTEMS) {
            this.spawnWeatherSystem(centerX, centerY);
        }

        // Randomly spawn new weather (small chance)
        if (this.weatherSystems.length < this.MAX_WEATHER_SYSTEMS &&
            this.seededRandom.random() < 0.05) {
            this.spawnWeatherSystem(centerX, centerY);
        }
    }

    /**
     * Get weather at a specific position
     * @returns {Object|null} Weather system affecting this position, or null for clear
     */
    getWeatherAt(x, y) {
        // Check if position is within any weather system
        for (const weather of this.weatherSystems) {
            const dx = x - weather.x;
            const dy = y - weather.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= weather.radius) {
                return weather;
            }
        }

        return null; // Clear weather
    }

    /**
     * Calculate damage for a ship at a position
     */
    calculateWeatherDamage(x, y) {
        const weather = this.getWeatherAt(x, y);

        if (!weather || !this.WEATHER_TYPES[weather.type]) {
            return 0;
        }

        const baseDamage = this.WEATHER_TYPES[weather.type].damage;
        if (baseDamage === 0) return 0;

        // Apply intensity and random variance
        const variance = 0.8 + this.seededRandom.random() * 0.4; // 0.8 - 1.2
        const actualDamage = baseDamage * weather.intensity * variance;

        return Math.floor(actualDamage);
    }

    /**
     * Get weather name at position
     */
    getWeatherName(x, y) {
        const weather = this.getWeatherAt(x, y);
        if (!weather) return 'Clear';
        return this.WEATHER_TYPES[weather.type]?.name || 'Unknown';
    }

    /**
     * Check if position is in dangerous weather
     */
    isDangerousWeather(x, y) {
        const weather = this.getWeatherAt(x, y);
        if (!weather) return false;

        const damage = this.WEATHER_TYPES[weather.type]?.damage || 0;
        return damage >= 5; // Storm or worse
    }

    /**
     * Find nearby dangerous weather (for warnings)
     */
    findNearbyDangerousWeather(x, y, radius = 10) {
        const dangerous = [];

        for (const weather of this.weatherSystems) {
            const damage = this.WEATHER_TYPES[weather.type]?.damage || 0;
            if (damage < 5) continue; // Only storms and hurricanes

            const dx = x - weather.x;
            const dy = y - weather.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius + weather.radius) {
                dangerous.push({
                    weather: weather,
                    distance: distance,
                    direction: this.getDirection(dx, dy)
                });
            }
        }

        // Sort by distance
        dangerous.sort((a, b) => a.distance - b.distance);
        return dangerous;
    }

    /**
     * Get cardinal direction from dx, dy
     */
    getDirection(dx, dy) {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const directions = ['east', 'northeast', 'north', 'northwest', 'west', 'southwest', 'south', 'southeast'];
        const index = Math.round((angle + 180) / 45) % 8;
        return directions[index];
    }

    /**
     * Get all weather systems
     */
    getAllWeather() {
        return this.weatherSystems;
    }

    /**
     * Serialize weather state for saving
     */
    serialize() {
        return JSON.stringify({
            weatherSystems: this.weatherSystems
        });
    }

    /**
     * Deserialize weather state from save
     */
    deserialize(data) {
        try {
            const parsed = JSON.parse(data);
            this.weatherSystems = parsed.weatherSystems || [];
        } catch (error) {
            console.error('Failed to deserialize weather:', error);
            this.weatherSystems = [];
        }
    }
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherManager;
}
