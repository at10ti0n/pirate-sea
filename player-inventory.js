// Player inventory system for resource management
class PlayerInventory {
    constructor(initialCapacity = 100) {
        this.resources = new Map(); // resourceType -> { quantity, lastUpdated }
        this.capacity = initialCapacity;
        this.totalItems = 0;
    }

    // Core inventory management methods
    addResource(resourceType, quantity) {
        if (!resourceType || quantity <= 0) {
            return { success: false, message: 'Invalid resource or quantity' };
        }

        // Check if we have space
        if (!this.hasSpace(quantity)) {
            return { success: false, message: 'Inventory full! Cannot add more resources.' };
        }

        const existing = this.resources.get(resourceType);
        const now = Date.now();

        if (existing) {
            // Stack with existing resources
            const newQuantity = existing.quantity + quantity;
            this.resources.set(resourceType, {
                quantity: newQuantity,
                lastUpdated: now
            });
        } else {
            // Add new resource type
            this.resources.set(resourceType, {
                quantity: quantity,
                lastUpdated: now
            });
        }

        this.updateTotalItems();
        return { success: true, message: `Added ${quantity} ${resourceType}` };
    }

    removeResource(resourceType, quantity) {
        if (!resourceType || quantity <= 0) {
            return { success: false, message: 'Invalid resource or quantity' };
        }

        const existing = this.resources.get(resourceType);
        if (!existing) {
            return { success: false, message: `No ${resourceType} in inventory` };
        }

        if (existing.quantity < quantity) {
            return { success: false, message: `Not enough ${resourceType} (have ${existing.quantity}, need ${quantity})` };
        }

        const newQuantity = existing.quantity - quantity;
        const now = Date.now();

        if (newQuantity === 0) {
            // Remove resource type entirely if quantity reaches 0
            this.resources.delete(resourceType);
        } else {
            // Update quantity
            this.resources.set(resourceType, {
                quantity: newQuantity,
                lastUpdated: now
            });
        }

        this.updateTotalItems();
        return { success: true, message: `Removed ${quantity} ${resourceType}` };
    }

    getResourceCount(resourceType) {
        const resource = this.resources.get(resourceType);
        return resource ? resource.quantity : 0;
    }

    getAllResources() {
        const result = {};
        for (const [resourceType, data] of this.resources) {
            result[resourceType] = {
                quantity: data.quantity,
                lastUpdated: data.lastUpdated
            };
        }
        return result;
    }

    // Capacity management
    getTotalItems() {
        return this.totalItems;
    }

    getCapacity() {
        return this.capacity;
    }

    setCapacity(newCapacity) {
        if (newCapacity < 0) {
            return { success: false, message: 'Capacity cannot be negative' };
        }
        
        this.capacity = newCapacity;
        return { success: true, message: `Capacity set to ${newCapacity}` };
    }

    hasSpace(quantity = 1) {
        return (this.totalItems + quantity) <= this.capacity;
    }

    getRemainingSpace() {
        return Math.max(0, this.capacity - this.totalItems);
    }

    // Utility methods
    updateTotalItems() {
        this.totalItems = 0;
        for (const [, data] of this.resources) {
            this.totalItems += data.quantity;
        }
    }

    isEmpty() {
        return this.resources.size === 0;
    }

    getResourceTypes() {
        return Array.from(this.resources.keys());
    }

    getResourceCount() {
        return this.resources.size;
    }

    // Serialization for save/load functionality
    serialize() {
        const data = {
            capacity: this.capacity,
            totalItems: this.totalItems,
            resources: {}
        };

        for (const [resourceType, resourceData] of this.resources) {
            data.resources[resourceType] = {
                quantity: resourceData.quantity,
                lastUpdated: resourceData.lastUpdated
            };
        }

        return JSON.stringify(data);
    }

    deserialize(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            this.capacity = data.capacity || 100;
            this.totalItems = data.totalItems || 0;
            this.resources.clear();

            if (data.resources) {
                for (const [resourceType, resourceData] of Object.entries(data.resources)) {
                    this.resources.set(resourceType, {
                        quantity: resourceData.quantity || 0,
                        lastUpdated: resourceData.lastUpdated || Date.now()
                    });
                }
            }

            // Recalculate total items to ensure consistency
            this.updateTotalItems();
            
            return { success: true, message: 'Inventory loaded successfully' };
        } catch (error) {
            return { success: false, message: `Failed to load inventory: ${error.message}` };
        }
    }

    // Display and formatting methods
    getInventoryDisplay(resourceManager = null) {
        if (this.isEmpty()) {
            return 'Inventory is empty';
        }

        const lines = [];
        lines.push(`Inventory (${this.totalItems}/${this.capacity}):`);
        lines.push('─'.repeat(30));

        for (const [resourceType, data] of this.resources) {
            let displayName = resourceType;
            let icon = '';

            // Get resource info if ResourceManager is provided
            if (resourceManager) {
                const resourceInfo = resourceManager.getResourceInfo(resourceType);
                if (resourceInfo) {
                    displayName = resourceInfo.name;
                    icon = resourceInfo.icon + ' ';
                }
            }

            lines.push(`${icon}${displayName}: ${data.quantity}`);
        }

        return lines.join('\n');
    }

    getInventoryDisplayTerminal(resourceManager = null) {
        if (this.isEmpty()) {
            return 'Inventory is empty';
        }

        const lines = [];
        lines.push(`Inventory (${this.totalItems}/${this.capacity}):`);
        lines.push('-'.repeat(30));

        for (const [resourceType, data] of this.resources) {
            let displayName = resourceType;
            let char = '';

            // Get resource info if ResourceManager is provided
            if (resourceManager) {
                const resourceInfo = resourceManager.getResourceInfo(resourceType);
                if (resourceInfo) {
                    displayName = resourceInfo.name;
                    char = resourceInfo.char + ' ';
                }
            }

            lines.push(`${char}${displayName}: ${data.quantity}`);
        }

        return lines.join('\n');
    }

    // Validation and integrity checks
    validateInventory() {
        const issues = [];

        // Check for negative quantities
        for (const [resourceType, data] of this.resources) {
            if (data.quantity < 0) {
                issues.push(`Negative quantity for ${resourceType}: ${data.quantity}`);
            }
        }

        // Check total items calculation
        let calculatedTotal = 0;
        for (const [, data] of this.resources) {
            calculatedTotal += data.quantity;
        }

        if (calculatedTotal !== this.totalItems) {
            issues.push(`Total items mismatch: stored ${this.totalItems}, calculated ${calculatedTotal}`);
            this.totalItems = calculatedTotal; // Fix the issue
        }

        // Check capacity constraints
        if (this.totalItems > this.capacity) {
            issues.push(`Inventory over capacity: ${this.totalItems}/${this.capacity}`);
        }

        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }

    // Clear inventory (for testing or reset)
    clear() {
        this.resources.clear();
        this.totalItems = 0;
        return { success: true, message: 'Inventory cleared' };
    }
}

module.exports = PlayerInventory;