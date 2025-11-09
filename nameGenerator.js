// Procedural name generation for islands and ports
class NameGenerator {
    constructor(seed) {
        this.seed = seed;
    }

    // Seeded random number generator for deterministic names
    getRandomAt(x, y, offset = 0) {
        const positionSeed = this.seed + (x * 73856093) + (y * 19349663) + offset;
        const random = Math.sin(positionSeed) * 10000;
        return random - Math.floor(random);
    }

    // Select random element from array using seeded random
    selectRandom(array, x, y, offset = 0) {
        const random = this.getRandomAt(x, y, offset);
        return array[Math.floor(random * array.length)];
    }

    // Island name components
    getIslandPrefixes() {
        return [
            "Black", "Dead", "Skull", "Treasure", "Lost", "Cursed", "Shadow", "Blood",
            "Ghost", "Storm", "Thunder", "Coral", "Pearl", "Diamond", "Golden", "Silver",
            "Emerald", "Sapphire", "Ruby", "Crimson", "Azure", "Jade", "Amber", "Crystal",
            "Forgotten", "Hidden", "Secret", "Mysterious", "Ancient", "Serpent", "Dragon",
            "Kraken", "Leviathan", "Siren", "Mermaid", "Neptune", "Poseidon", "Triton",
            "Calypso", "Davy", "Jolly", "Captain", "Admiral", "Privateer", "Buccaneer",
            "Mariner", "Sailor", "Navigator", "Compass", "Horizon", "Sunset", "Sunrise",
            "Moonlight", "Starlight", "Twilight", "Dawn", "Dusk", "Midnight", "High Noon"
        ];
    }

    getIslandSuffixes() {
        return [
            "Isle", "Island", "Atoll", "Cay", "Key", "Rock", "Reef", "Shoal",
            "Point", "Cape", "Head", "Haven", "Bay", "Cove", "Lagoon", "Shore"
        ];
    }

    getIslandDescriptors() {
        return [
            "of Bones", "of Doom", "of Fortune", "of the Damned", "of the Lost",
            "of Mysteries", "of Secrets", "of Legends", "of Tales", "of Wonders",
            "of Dreams", "of Nightmares", "of Shadows", "of Light", "of Thunder",
            "of Storms", "of Calm", "of Peace", "of War", "of Glory", "of Shame",
            "of the Deep", "of the Abyss", "of the Void", "of the Gods", "of the Titans",
            "of Paradise", "of Hell", "of Purgatory", "of Limbo", "of Eternity"
        ];
    }

    // Port name components
    getPortPrefixes() {
        return [
            "Port", "Harbor", "Haven", "Bay", "Cove", "Anchorage", "Landing",
            "Wharf", "Dock", "Quay", "Marina", "Berth", "Pier"
        ];
    }

    getPortNames() {
        return [
            "Royal", "Crown", "King's", "Queen's", "Prince's", "Admiral's", "Captain's",
            "Merchant", "Trader", "Smuggler", "Pirate", "Privateer", "Buccaneer",
            "Victory", "Triumph", "Glory", "Fortune", "Prosperity", "Abundance", "Wealth",
            "Liberty", "Freedom", "Independence", "Justice", "Mercy", "Hope", "Faith",
            "Courage", "Valor", "Honor", "Pride", "Destiny", "Legacy", "Heritage",
            "Sunset", "Sunrise", "Moonlight", "Starlight", "Twilight", "Dawn", "Dusk",
            "Storm", "Thunder", "Lightning", "Tempest", "Hurricane", "Typhoon", "Gale",
            "Calm", "Peace", "Serenity", "Tranquil", "Quiet", "Silent", "Whisper",
            "Coral", "Pearl", "Diamond", "Emerald", "Sapphire", "Ruby", "Amber", "Jade",
            "North", "South", "East", "West", "Central", "Grand", "New", "Old"
        ];
    }

    getPortSuffixes() {
        return [
            "Town", "City", "Point", "Cross", "End", "Side", "View", "Gate",
            "Ridge", "Hill", "Dale", "Field", "Shore", "Coast", "Beach", "Cliff"
        ];
    }

    // Famous pirate and nautical names for special islands
    getPirateNames() {
        return [
            "Blackbeard", "Calico Jack", "Anne Bonny", "Mary Read", "Henry Morgan",
            "Bartholomew Roberts", "Charles Vane", "Edward Low", "Stede Bonnet",
            "William Kidd", "Samuel Bellamy", "François L'Olonnais", "Henry Every",
            "Jack Rackham", "Ching Shih", "Grace O'Malley", "Barbarossa", "Dragut",
            "Turgut Reis", "Blackjack", "Redbeard", "Ironhook", "Pegleg", "One-Eye"
        ];
    }

    // Generate island name based on position and size
    generateIslandName(x, y, size) {
        const random1 = this.getRandomAt(x, y, 100);
        const random2 = this.getRandomAt(x, y, 200);
        const random3 = this.getRandomAt(x, y, 300);

        // Large islands (>150 tiles) sometimes get pirate names
        if (size > 150 && random1 < 0.4) {
            const pirateName = this.selectRandom(this.getPirateNames(), x, y, 400);
            const suffix = this.selectRandom(this.getIslandSuffixes(), x, y, 500);
            return `${pirateName}'s ${suffix}`;
        }

        // Most islands: Prefix + Suffix pattern
        if (random2 < 0.6) {
            const prefix = this.selectRandom(this.getIslandPrefixes(), x, y, 100);
            const suffix = this.selectRandom(this.getIslandSuffixes(), x, y, 200);
            return `${prefix} ${suffix}`;
        }

        // Some islands: Prefix + Suffix + Descriptor pattern
        if (random2 < 0.9) {
            const prefix = this.selectRandom(this.getIslandPrefixes(), x, y, 100);
            const suffix = this.selectRandom(this.getIslandSuffixes(), x, y, 200);
            const descriptor = this.selectRandom(this.getIslandDescriptors(), x, y, 300);
            return `${prefix} ${suffix} ${descriptor}`;
        }

        // Rare: Just a descriptor name
        const prefix = this.selectRandom(this.getIslandPrefixes(), x, y, 100);
        return `The ${prefix}`;
    }

    // Generate port name based on position and island name
    generatePortName(x, y, islandName) {
        const random1 = this.getRandomAt(x, y, 600);
        const random2 = this.getRandomAt(x, y, 700);

        // Sometimes ports are named after their island
        if (random1 < 0.3 && islandName) {
            const portPrefix = this.selectRandom(this.getPortPrefixes(), x, y, 600);
            // Extract first word of island name
            const islandFirstWord = islandName.split(' ')[0];
            return `${portPrefix} ${islandFirstWord}`;
        }

        // Port + Name pattern (most common)
        if (random2 < 0.7) {
            const portPrefix = this.selectRandom(this.getPortPrefixes(), x, y, 600);
            const portName = this.selectRandom(this.getPortNames(), x, y, 700);
            return `${portPrefix} ${portName}`;
        }

        // Name + Suffix pattern
        const portName = this.selectRandom(this.getPortNames(), x, y, 700);
        const suffix = this.selectRandom(this.getPortSuffixes(), x, y, 800);
        return `${portName} ${suffix}`;
    }

    // Generate ship name (bonus feature for future use)
    generateShipName(x, y) {
        const shipPrefixes = [
            "The", "HMS", "SS", "The Black", "The Golden", "The Silver", "The Crimson",
            "The Flying", "The Wandering", "The Vengeful", "The Fearless", "The Mighty"
        ];
        const shipNames = [
            "Revenge", "Fortune", "Pearl", "Kraken", "Serpent", "Dragon", "Phoenix",
            "Albatross", "Cutlass", "Scimitar", "Rapier", "Saber", "Dagger", "Blade",
            "Tempest", "Storm", "Thunder", "Lightning", "Hurricane", "Typhoon", "Gale",
            "Mermaid", "Siren", "Nymph", "Naiad", "Nereid", "Leviathan", "Behemoth",
            "Voyager", "Navigator", "Explorer", "Adventurer", "Wanderer", "Drifter",
            "Victory", "Triumph", "Glory", "Pride", "Honor", "Valor", "Courage"
        ];

        const prefix = this.selectRandom(shipPrefixes, x, y, 900);
        const name = this.selectRandom(shipNames, x, y, 1000);
        return `${prefix} ${name}`;
    }
}

// Export for use in both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NameGenerator;
}
