// UI controls and input handling
class UIManager {
    constructor(game) {
        this.game = game;
        this.display = null;
        this.messageLog = [];
        this.maxMessages = 10;
        
        // Gathering statistics tracking
        this.gatheringStats = {
            totalAttempts: 0,
            successfulGathers: 0,
            failedGathers: 0,
            resourcesGathered: {},
            locationsVisited: new Set(),
            sessionStartTime: Date.now(),
            lastGatherTime: null
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Touch controls
        this.setupTouchControls();
        
        // Seed controls
        this.setupSeedControls();
        
        // Prevent default touch behaviors that might interfere
        document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
    
    setupTouchControls() {
        // Original Direction buttons
        const upBtn = document.getElementById('up-btn');
        const downBtn = document.getElementById('down-btn');
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        
        // Original Action buttons
        const boardBtn = document.getElementById('board-btn');
        const unboardBtn = document.getElementById('unboard-btn');
        
        // Overlay Direction buttons
        const overlayUpBtn = document.getElementById('overlay-up-btn');
        const overlayDownBtn = document.getElementById('overlay-down-btn');
        const overlayLeftBtn = document.getElementById('overlay-left-btn');
        const overlayRightBtn = document.getElementById('overlay-right-btn');
        
        // Overlay Action buttons
        const overlayBoardBtn = document.getElementById('overlay-board-btn');
        const overlayUnboardBtn = document.getElementById('overlay-unboard-btn');
        
        // Add touch event listeners for original controls
        if (upBtn) upBtn.addEventListener('touchstart', () => this.handleMovement('up'));
        if (downBtn) downBtn.addEventListener('touchstart', () => this.handleMovement('down'));
        if (leftBtn) leftBtn.addEventListener('touchstart', () => this.handleMovement('left'));
        if (rightBtn) rightBtn.addEventListener('touchstart', () => this.handleMovement('right'));
        
        // Add click event listeners for desktop (original controls)
        if (upBtn) upBtn.addEventListener('click', () => this.handleMovement('up'));
        if (downBtn) downBtn.addEventListener('click', () => this.handleMovement('down'));
        if (leftBtn) leftBtn.addEventListener('click', () => this.handleMovement('left'));
        if (rightBtn) rightBtn.addEventListener('click', () => this.handleMovement('right'));
        
        // Add touch event listeners for overlay controls
        if (overlayUpBtn) {
            overlayUpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleMovement('up'); });
            overlayUpBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleMovement('up'); });
        }
        if (overlayDownBtn) {
            overlayDownBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleMovement('down'); });
            overlayDownBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleMovement('down'); });
        }
        if (overlayLeftBtn) {
            overlayLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleMovement('left'); });
            overlayLeftBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleMovement('left'); });
        }
        if (overlayRightBtn) {
            overlayRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleMovement('right'); });
            overlayRightBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleMovement('right'); });
        }
        
        // Original Action buttons
        if (boardBtn) {
            boardBtn.addEventListener('touchstart', () => this.handleBoarding());
            boardBtn.addEventListener('click', () => this.handleBoarding());
        }
        
        if (unboardBtn) {
            unboardBtn.addEventListener('touchstart', () => this.handleUnboarding());
            unboardBtn.addEventListener('click', () => this.handleUnboarding());
        }
        
        // Overlay Action buttons
        if (overlayBoardBtn) {
            overlayBoardBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleBoarding(); });
            overlayBoardBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleBoarding(); });
        }
        
        if (overlayUnboardBtn) {
            overlayUnboardBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleUnboarding(); });
            overlayUnboardBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleUnboarding(); });
        }
        
        // Gathering and inventory buttons
        const gatherBtn = document.getElementById('gather-btn');
        const inventoryBtn = document.getElementById('inventory-btn');
        const overlayGatherBtn = document.getElementById('overlay-gather-btn');
        const overlayInventoryBtn = document.getElementById('overlay-inventory-btn');
        
        // Examination and help buttons
        const examineBtn = document.getElementById('examine-btn');
        const helpBtn = document.getElementById('help-btn');
        const statsBtn = document.getElementById('stats-btn');
        const overlayExamineBtn = document.getElementById('overlay-examine-btn');
        const overlayHelpBtn = document.getElementById('overlay-help-btn');
        const overlayStatsBtn = document.getElementById('overlay-stats-btn');
        
        if (gatherBtn) {
            gatherBtn.addEventListener('touchstart', () => this.handleGathering());
            gatherBtn.addEventListener('click', () => this.handleGathering());
        }
        
        if (inventoryBtn) {
            inventoryBtn.addEventListener('touchstart', () => this.handleInventoryToggle());
            inventoryBtn.addEventListener('click', () => this.handleInventoryToggle());
        }
        
        if (examineBtn) {
            examineBtn.addEventListener('touchstart', () => this.handleExamination());
            examineBtn.addEventListener('click', () => this.handleExamination());
        }
        
        if (helpBtn) {
            helpBtn.addEventListener('touchstart', () => this.handleGatheringHelp());
            helpBtn.addEventListener('click', () => this.handleGatheringHelp());
        }
        
        if (statsBtn) {
            statsBtn.addEventListener('touchstart', () => this.handleGatheringStats());
            statsBtn.addEventListener('click', () => this.handleGatheringStats());
        }
        
        if (overlayGatherBtn) {
            overlayGatherBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleGathering(); });
            overlayGatherBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleGathering(); });
        }
        
        if (overlayInventoryBtn) {
            overlayInventoryBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleInventoryToggle(); });
            overlayInventoryBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleInventoryToggle(); });
        }
        
        if (overlayExamineBtn) {
            overlayExamineBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleExamination(); });
            overlayExamineBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleExamination(); });
        }
        
        if (overlayHelpBtn) {
            overlayHelpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleGatheringHelp(); });
            overlayHelpBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleGatheringHelp(); });
        }
        
        if (overlayStatsBtn) {
            overlayStatsBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleGatheringStats(); });
            overlayStatsBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleGatheringStats(); });
        }
    }
    
    handleKeyPress(event) {
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                this.handleMovement('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.handleMovement('down');
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.handleMovement('left');
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.handleMovement('right');
                break;
            case 'b':
            case 'B':
                this.handleBoarding();
                break;
            case 'u':
            case 'U':
                this.handleUnboarding();
                break;
            case 'e':
            case 'E':
                this.handleEmbarking();
                break;
            case 'g':
            case 'G':
                this.handleGathering();
                break;
            case 'i':
            case 'I':
                this.handleInventoryToggle();
                break;
            case 'x':
            case 'X':
                this.handleExamination();
                break;
            case 'h':
            case 'H':
                this.handleGatheringHelp();
                break;
            case 't':
            case 'T':
                this.handleGatheringStats();
                break;
        }
    }
    
    handleMovement(direction) {
        if (!this.game.player) return;
        
        let moved = false;
        
        switch (direction) {
            case 'up':
                moved = this.game.player.moveUp();
                break;
            case 'down':
                moved = this.game.player.moveDown();
                break;
            case 'left':
                moved = this.game.player.moveLeft();
                break;
            case 'right':
                moved = this.game.player.moveRight();
                break;
        }
        
        if (moved) {
            this.game.onPlayerMove();
        } else {
            this.addMessage('Cannot move in that direction!');
        }
    }
    
    handleBoarding() {
        if (!this.game.player || !this.game.entityManager) return;
        
        // Try boarding an existing ship first
        const boardResult = this.game.player.boardShip(null, this.game.entityManager);
        if (boardResult.success) {
            this.addMessage(boardResult.message);
            this.game.onPlayerMove();
            this.updateActionButtons();
            return;
        }
        
        // If no ship to board, try embarking from coast
        const embarkResult = this.game.player.embarkFromCoast(this.game.entityManager);
        this.addMessage(embarkResult.message);
        
        if (embarkResult.success) {
            this.game.onPlayerMove();
            this.updateActionButtons();
        }
    }
    
    handleEmbarking() {
        if (!this.game.player || !this.game.entityManager) return;
        
        const result = this.game.player.embarkFromCoast(this.game.entityManager);
        this.addMessage(result.message);
        
        if (result.success) {
            this.game.onPlayerMove();
            this.updateActionButtons();
        }
    }
    
    handleUnboarding() {
        if (!this.game.player || !this.game.entityManager) return;
        
        const result = this.game.player.unboard(null, this.game.entityManager);
        this.addMessage(result.message);
        
        if (result.success) {
            this.game.onPlayerMove();
            this.updateActionButtons();
        }
    }
    
    handleGathering() {
        if (!this.game) return;
        this.game.attemptGather();
    }
    
    handleInventoryToggle() {
        if (!this.game) return;
        this.game.toggleInventory();
    }
    
    handleExamination() {
        if (!this.game) return;
        this.game.examineLocation();
    }
    
    handleGatheringHelp() {
        if (!this.game) return;
        this.displayGatheringHelp();
    }
    
    handleGatheringStats() {
        if (!this.game) return;
        this.displayGatheringStats();
    }
    
    initializeDisplay() {
        const gameDisplay = document.getElementById('game-display');
        if (!gameDisplay) {
            console.error('Game display element not found!');
            return;
        }
        
        this.display = new ROT.Display({
            width: 48,
            height: 28,
            fontSize: 12,
            fontFamily: 'Courier New, monospace'
        });
        
        gameDisplay.appendChild(this.display.getContainer());
        console.log('Display initialized');
    }
    
    render() {
        if (!this.display || !this.game.mapGenerator) return;
        
        this.display.clear();
        
        // Update camera to follow player
        this.game.mapGenerator.updateCamera(this.game.player.x, this.game.player.y);
        
        // Get visible tiles for current camera position
        const visibleTiles = this.game.mapGenerator.getVisibleTiles();
        
        // Render map tiles
        for (const tileData of visibleTiles) {
            this.renderTileAtScreen(tileData.tile, tileData.screenX, tileData.screenY, tileData.worldX, tileData.worldY);
        }
        
        // Render entities
        this.renderEntities();
        
        // Render player
        this.renderPlayer();
        
        // Update UI elements
        this.updateActionButtons();
    }
    
    renderTileAtScreen(tile, screenX, screenY, worldX, worldY) {
        if (!tile) return;
        
        const visibilityState = this.game.fogOfWar.getTileVisibilityState(worldX, worldY);
        if (visibilityState === 'hidden') return;
        
        // Use resource glyph system if available
        let tileInfo;
        if (this.game.mapGenerator.generateResourceGlyph && this.game.resourceManager) {
            tileInfo = this.game.mapGenerator.generateResourceGlyph(
                worldX, 
                worldY, 
                tile.biome, 
                this.game.resourceManager
            );
        } else {
            tileInfo = this.game.mapGenerator.getBiomeInfo(tile.biome);
        }
        
        const modifier = this.game.fogOfWar.getVisibilityModifier(worldX, worldY);
        
        // Adjust color based on visibility
        let color = tileInfo.color;
        if (modifier < 1.0) {
            color = this.adjustColorBrightness(color, modifier);
        }
        
        this.display.draw(screenX, screenY, tileInfo.char, color);
    }
    
    renderEntities() {
        const entities = this.game.entityManager.getAllEntities();
        const cameraX = this.game.mapGenerator.cameraX;
        const cameraY = this.game.mapGenerator.cameraY;
        
        for (const entity of entities) {
            if (this.game.fogOfWar.shouldRenderEntity(entity.x, entity.y)) {
                // Convert world coordinates to screen coordinates
                const screenX = entity.x - cameraX;
                const screenY = entity.y - cameraY;
                
                // Only render if entity is on screen
                if (screenX >= 0 && screenX < this.game.mapGenerator.displayWidth &&
                    screenY >= 0 && screenY < this.game.mapGenerator.displayHeight) {
                    this.display.draw(screenX, screenY, entity.char, entity.color);
                }
            }
        }
    }
    
    renderPlayer() {
        const player = this.game.player;
        if (!player) return;
        
        const playerIcon = player.getIcon();
        const playerColor = player.getMode() === 'ship' ? '#3498db' : '#e74c3c';
        
        // Player is always at the center of the screen
        const centerX = Math.floor(this.game.mapGenerator.displayWidth / 2);
        const centerY = Math.floor(this.game.mapGenerator.displayHeight / 2);
        
        this.display.draw(centerX, centerY, playerIcon, playerColor);
    }
    
    updateActionButtons() {
        const boardBtn = document.getElementById('board-btn');
        const unboardBtn = document.getElementById('unboard-btn');
        const overlayBoardBtn = document.getElementById('overlay-board-btn');
        const overlayUnboardBtn = document.getElementById('overlay-unboard-btn');
        
        if (!this.game.player) return;
        
        const canBoard = this.game.player.canBoardShip(this.game.entityManager);
        const canEmbark = this.game.player.canEmbarkFromCoast(this.game.entityManager);
        const canUnboard = this.game.player.canUnboard();
        
        // Determine button text and visibility
        const showBoardButton = canBoard.canBoard || canEmbark.canEmbark;
        const boardButtonText = canBoard.canBoard ? 'Board' : 'Embark';
        
        // Update original board buttons
        if (boardBtn) {
            boardBtn.style.display = showBoardButton ? 'block' : 'none';
            boardBtn.textContent = boardButtonText;
        }
        
        if (unboardBtn) {
            unboardBtn.style.display = canUnboard.canUnboard ? 'block' : 'none';
        }
        
        // Update overlay board buttons
        if (overlayBoardBtn) {
            overlayBoardBtn.style.display = showBoardButton ? 'block' : 'none';
            overlayBoardBtn.textContent = boardButtonText;
        }
        
        if (overlayUnboardBtn) {
            overlayUnboardBtn.style.display = canUnboard.canUnboard ? 'block' : 'none';
        }
    }
    
    adjustColorBrightness(color, factor) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Adjust brightness
        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);
        
        // Convert back to hex
        const newHex = '#' + 
            newR.toString(16).padStart(2, '0') +
            newG.toString(16).padStart(2, '0') +
            newB.toString(16).padStart(2, '0');
        
        return newHex;
    }
    
    addMessage(message, type = 'normal') {
        const timestamp = Date.now();
        this.messageLog.push({
            text: message,
            type: type,
            timestamp: timestamp
        });
        
        // Keep only the last maxMessages
        if (this.messageLog.length > this.maxMessages) {
            this.messageLog.shift();
        }
        
        this.updateMessageDisplay();
        
        // Show gathering animation for success messages
        if (type === 'gathering-success') {
            this.showGatheringAnimation(message);
        }
        
        // Show inventory warning for full inventory
        if (type === 'inventory-full') {
            this.showInventoryFullWarning();
        }
    }
    
    updateMessageDisplay() {
        const messageLog = document.getElementById('message-log');
        if (!messageLog) return;
        
        messageLog.innerHTML = '';
        
        this.messageLog.forEach(messageData => {
            const messageElement = document.createElement('div');
            const message = typeof messageData === 'string' ? messageData : messageData.text;
            const type = typeof messageData === 'string' ? 'normal' : messageData.type;
            
            messageElement.textContent = message;
            messageElement.style.marginBottom = '5px';
            
            // Style messages based on type
            switch (type) {
                case 'gathering-success':
                    messageElement.style.color = '#27ae60';
                    messageElement.style.fontWeight = 'bold';
                    break;
                case 'gathering-failure':
                    messageElement.style.color = '#e74c3c';
                    break;
                case 'inventory-full':
                    messageElement.style.color = '#f39c12';
                    messageElement.style.fontWeight = 'bold';
                    break;
                case 'system':
                    messageElement.style.color = '#3498db';
                    messageElement.style.fontStyle = 'italic';
                    break;
                case 'warning':
                    messageElement.style.color = '#f39c12';
                    break;
                default:
                    messageElement.style.color = '#ecf0f1';
            }
            
            messageLog.appendChild(messageElement);
        });
        
        // Scroll to bottom
        messageLog.scrollTop = messageLog.scrollHeight;
    }
    
    clearMessages() {
        this.messageLog = [];
        this.updateMessageDisplay();
    }
    
    // Enhanced feedback methods for gathering
    showGatheringAnimation(message) {
        // Create floating animation element
        const animationElement = document.createElement('div');
        animationElement.textContent = message;
        animationElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(39, 174, 96, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 1.1rem;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: gatheringSuccess 2s ease-out forwards;
        `;
        
        // Add CSS animation if not already present
        if (!document.getElementById('gathering-animations')) {
            const style = document.createElement('style');
            style.id = 'gathering-animations';
            style.textContent = `
                @keyframes gatheringSuccess {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    20% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                    40% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -60%) scale(1);
                    }
                }
                
                @keyframes inventoryWarning {
                    0%, 100% { background-color: rgba(243, 156, 18, 0.2); }
                    50% { background-color: rgba(243, 156, 18, 0.4); }
                }
                
                .inventory-warning {
                    animation: inventoryWarning 0.5s ease-in-out 3;
                }
                
                @keyframes gatheringPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .gathering-pulse {
                    animation: gatheringPulse 0.3s ease-in-out;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(animationElement);
        
        // Remove element after animation
        setTimeout(() => {
            if (animationElement.parentNode) {
                animationElement.parentNode.removeChild(animationElement);
            }
        }, 2000);
        
        // Add pulse effect to gather button
        const gatherBtn = document.getElementById('gather-btn');
        const overlayGatherBtn = document.getElementById('overlay-gather-btn');
        
        if (gatherBtn) {
            gatherBtn.classList.add('gathering-pulse');
            setTimeout(() => gatherBtn.classList.remove('gathering-pulse'), 300);
        }
        
        if (overlayGatherBtn) {
            overlayGatherBtn.classList.add('gathering-pulse');
            setTimeout(() => overlayGatherBtn.classList.remove('gathering-pulse'), 300);
        }
    }
    
    showInventoryFullWarning() {
        const inventoryDisplay = document.getElementById('inventory-display');
        const inventoryBtn = document.getElementById('inventory-btn');
        const overlayInventoryBtn = document.getElementById('overlay-inventory-btn');
        
        // Flash inventory display if visible
        if (inventoryDisplay && inventoryDisplay.style.display !== 'none') {
            inventoryDisplay.classList.add('inventory-warning');
            setTimeout(() => inventoryDisplay.classList.remove('inventory-warning'), 1500);
        }
        
        // Flash inventory buttons
        if (inventoryBtn) {
            inventoryBtn.classList.add('inventory-warning');
            setTimeout(() => inventoryBtn.classList.remove('inventory-warning'), 1500);
        }
        
        if (overlayInventoryBtn) {
            overlayInventoryBtn.classList.add('inventory-warning');
            setTimeout(() => overlayInventoryBtn.classList.remove('inventory-warning'), 1500);
        }
        
        // Show floating warning message
        const warningElement = document.createElement('div');
        warningElement.textContent = 'Inventory Full!';
        warningElement.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(231, 76, 60, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 1.2rem;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: gatheringSuccess 2s ease-out forwards;
        `;
        
        document.body.appendChild(warningElement);
        
        // Remove element after animation
        setTimeout(() => {
            if (warningElement.parentNode) {
                warningElement.parentNode.removeChild(warningElement);
            }
        }, 2000);
    }
    
    // Gathering statistics methods
    trackGatheringAttempt(x, y, success, resourceType = null, quantity = 0) {
        this.gatheringStats.totalAttempts++;
        this.gatheringStats.locationsVisited.add(`${x},${y}`);
        this.gatheringStats.lastGatherTime = Date.now();
        
        if (success) {
            this.gatheringStats.successfulGathers++;
            
            if (resourceType) {
                if (!this.gatheringStats.resourcesGathered[resourceType]) {
                    this.gatheringStats.resourcesGathered[resourceType] = 0;
                }
                this.gatheringStats.resourcesGathered[resourceType] += quantity;
            }
        } else {
            this.gatheringStats.failedGathers++;
        }
    }
    
    getGatheringStats() {
        const sessionTime = Date.now() - this.gatheringStats.sessionStartTime;
        const sessionMinutes = Math.floor(sessionTime / 60000);
        const successRate = this.gatheringStats.totalAttempts > 0 
            ? Math.round((this.gatheringStats.successfulGathers / this.gatheringStats.totalAttempts) * 100)
            : 0;
        
        return {
            ...this.gatheringStats,
            sessionMinutes,
            successRate,
            uniqueLocations: this.gatheringStats.locationsVisited.size
        };
    }
    
    displayGatheringStats() {
        const stats = this.getGatheringStats();
        
        let statsModal = document.getElementById('gathering-stats-modal');
        if (!statsModal) {
            statsModal = this.createGatheringStatsModal();
        }
        
        const statsContent = statsModal.querySelector('.stats-content');
        if (!statsContent) return;
        
        let html = `
            <h3>📊 Gathering Statistics</h3>
            
            <div class="stats-overview">
                <div class="stat-card">
                    <div class="stat-number">${stats.totalAttempts}</div>
                    <div class="stat-label">Total Attempts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.successRate}%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.uniqueLocations}</div>
                    <div class="stat-label">Locations Visited</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.sessionMinutes}m</div>
                    <div class="stat-label">Session Time</div>
                </div>
            </div>
            
            <div class="stats-section">
                <h4>Gathering Results</h4>
                <div class="result-stats">
                    <div class="result-item success">
                        <span class="result-label">Successful:</span>
                        <span class="result-value">${stats.successfulGathers}</span>
                    </div>
                    <div class="result-item failure">
                        <span class="result-label">Failed:</span>
                        <span class="result-value">${stats.failedGathers}</span>
                    </div>
                </div>
            </div>
        `;
        
        if (Object.keys(stats.resourcesGathered).length > 0) {
            html += `
                <div class="stats-section">
                    <h4>Resources Collected</h4>
                    <div class="resource-stats">
            `;
            
            // Sort resources by quantity
            const sortedResources = Object.entries(stats.resourcesGathered)
                .sort(([,a], [,b]) => b - a);
            
            sortedResources.forEach(([resourceType, quantity]) => {
                const resourceInfo = this.game.resourceManager.getResourceInfo(resourceType);
                const displayName = resourceInfo ? resourceInfo.name : resourceType;
                const icon = resourceInfo ? resourceInfo.icon : '?';
                
                html += `
                    <div class="resource-stat-item">
                        <span class="resource-icon">${icon}</span>
                        <span class="resource-name">${displayName}</span>
                        <span class="resource-quantity">${quantity}</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += `
            <div class="stats-actions">
                <button onclick="this.closest('.modal').style.display='none'">Close</button>
                <button onclick="game.uiManager.resetGatheringStats()">Reset Stats</button>
            </div>
        `;
        
        statsContent.innerHTML = html;
        statsModal.style.display = 'block';
    }
    
    createGatheringStatsModal() {
        const modal = document.createElement('div');
        modal.id = 'gathering-stats-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                <div class="stats-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    resetGatheringStats() {
        this.gatheringStats = {
            totalAttempts: 0,
            successfulGathers: 0,
            failedGathers: 0,
            resourcesGathered: {},
            locationsVisited: new Set(),
            sessionStartTime: Date.now(),
            lastGatherTime: null
        };
        
        this.addMessage('Gathering statistics reset', 'system');
        
        // Close stats modal if open
        const statsModal = document.getElementById('gathering-stats-modal');
        if (statsModal) {
            statsModal.style.display = 'none';
        }
    }
    
    // Enhanced gathering help system
    displayGatheringHelp() {
        if (!this.game.resourceManager) {
            this.addMessage('Resource system not initialized', 'warning');
            return;
        }
        
        let helpModal = document.getElementById('gathering-help-modal');
        if (!helpModal) {
            helpModal = this.createGatheringHelpModal();
        }
        
        const helpContent = helpModal.querySelector('.help-content');
        if (!helpContent) return;
        
        const helpInfo = this.game.resourceManager.getGatheringHelp('web');
        const stats = this.getGatheringStats();
        
        let html = `
            <h3>🎯 ${helpInfo.title}</h3>
            
            <div class="help-quick-stats">
                <div class="quick-stat">
                    <span class="stat-label">Success Rate:</span>
                    <span class="stat-value ${stats.successRate >= 70 ? 'good' : stats.successRate >= 40 ? 'medium' : 'poor'}">${stats.successRate}%</span>
                </div>
                <div class="quick-stat">
                    <span class="stat-label">Total Gathered:</span>
                    <span class="stat-value">${stats.successfulGathers}</span>
                </div>
            </div>
        `;
        
        helpInfo.sections.forEach(section => {
            html += `
                <div class="help-section">
                    <h4>${section.title}</h4>
                    <ul>
            `;
            
            section.content.forEach(item => {
                html += `<li>${item}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        });
        
        // Add resource types guide
        html += `
            <div class="help-section">
                <h4>Resource Types</h4>
                <div class="resource-guide">
        `;
        
        const resourceTypes = ['stone', 'sand', 'wood', 'hay', 'ore', 'berries', 'reeds'];
        resourceTypes.forEach(resourceType => {
            const resourceInfo = this.game.resourceManager.getResourceInfo(resourceType);
            if (resourceInfo) {
                const rarityInfo = this.game.resourceManager.getResourceRarityInfo(resourceInfo.rarity);
                html += `
                    <div class="resource-guide-item">
                        <span class="resource-icon">${resourceInfo.icon}</span>
                        <div class="resource-info">
                            <div class="resource-name">${resourceInfo.name}</div>
                            <div class="resource-desc">${resourceInfo.description}</div>
                            <div class="resource-rarity" style="color: ${rarityInfo.color}">${rarityInfo.name}</div>
                        </div>
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
            
            <div class="help-section">
                <h4>Biome Guide</h4>
                <div class="biome-guide">
                    <div class="biome-item">
                        <span class="biome-name">🌲 Forest</span>
                        <span class="biome-resources">Wood, Berries</span>
                    </div>
                    <div class="biome-item">
                        <span class="biome-name">🏜️ Desert</span>
                        <span class="biome-resources">Stone, Sand</span>
                    </div>
                    <div class="biome-item">
                        <span class="biome-name">⛰️ Mountain</span>
                        <span class="biome-resources">Stone, Ore</span>
                    </div>
                    <div class="biome-item">
                        <span class="biome-name">🏖️ Beach</span>
                        <span class="biome-resources">Wood, Sand</span>
                    </div>
                    <div class="biome-item">
                        <span class="biome-name">🌿 Jungle</span>
                        <span class="biome-resources">Wood, Berries</span>
                    </div>
                    <div class="biome-item">
                        <span class="biome-name">🌾 Savanna</span>
                        <span class="biome-resources">Hay, Wood</span>
                    </div>
                    <div class="biome-item">
                        <span class="biome-name">🌲 Taiga</span>
                        <span class="biome-resources">Wood, Berries</span>
                    </div>
                    <div class="biome-item">
                        <span class="biome-name">🌺 Tropical</span>
                        <span class="biome-resources">Wood, Berries</span>
                    </div>
                    <div class="biome-item">
                        <span class="biome-name">🐸 Swamp</span>
                        <span class="biome-resources">Reeds, Berries</span>
                    </div>
                </div>
            </div>
            
            <div class="help-actions">
                <button onclick="this.closest('.modal').style.display='none'">Close</button>
                <button onclick="game.uiManager.displayGatheringStats()">View Statistics</button>
                <button onclick="game.examineLocation()">Examine Current Location</button>
            </div>
        `;
        
        helpContent.innerHTML = html;
        helpModal.style.display = 'block';
    }
    
    createGatheringHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'gathering-help-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                <div class="help-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    setupSeedControls() {
        const seedInput = document.getElementById('seed-input');
        const generateBtn = document.getElementById('generate-btn');
        const copySeedBtn = document.getElementById('copy-seed-btn');
        const seedDisplay = document.getElementById('seed-display');
        
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const seedValue = seedInput.value.trim();
                let newSeed = null;
                
                if (seedValue) {
                    newSeed = parseInt(seedValue);
                    if (isNaN(newSeed)) {
                        this.addMessage('Invalid seed! Using random seed.');
                        newSeed = null;
                    }
                }
                
                // If no seed provided, generate random one
                if (newSeed === null) {
                    newSeed = Math.floor(Math.random() * 1000000);
                }
                
                this.game.setSeed(newSeed);
                this.updateSeedDisplay();
                seedInput.value = '';
            });
        }
        
        if (copySeedBtn) {
            copySeedBtn.addEventListener('click', () => {
                const currentSeed = this.game.getSeed();
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(currentSeed.toString()).then(() => {
                        this.addMessage(`Seed ${currentSeed} copied to clipboard!`);
                    }).catch(() => {
                        this.addMessage(`Current seed: ${currentSeed}`);
                    });
                } else {
                    // Fallback for older browsers
                    this.addMessage(`Current seed: ${currentSeed}`);
                }
            });
        }
        
        // Update seed display initially
        setTimeout(() => this.updateSeedDisplay(), 100);
        
        // Setup save/load controls
        this.setupSaveControls();
    }
    
    setupSaveControls() {
        const saveBtn = document.getElementById('save-btn');
        const loadBtn = document.getElementById('load-btn');
        const autoSaveToggle = document.getElementById('auto-save-toggle');
        const saveStatus = document.getElementById('save-status');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const result = this.game.saveGameState();
                this.updateSaveStatus(result.message, result.success ? 'success' : 'error');
                this.addMessage(result.message, result.success ? 'system' : 'warning');
            });
        }
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                const result = this.game.loadGameState();
                this.updateSaveStatus(result.message, result.success ? 'success' : 'error');
                this.addMessage(result.message, result.success ? 'system' : 'warning');
                
                if (result.success) {
                    // Update displays after loading
                    this.updateSeedDisplay();
                    if (this.isInventoryOpen()) {
                        this.updateInventoryDisplay();
                    }
                }
            });
        }
        
        if (autoSaveToggle) {
            let autoSaveEnabled = true;
            
            autoSaveToggle.addEventListener('click', () => {
                autoSaveEnabled = !autoSaveEnabled;
                
                if (autoSaveEnabled) {
                    this.game.enableAutoSave(3);
                    autoSaveToggle.textContent = 'Auto-Save: ON';
                    autoSaveToggle.classList.remove('disabled');
                    this.updateSaveStatus('Auto-save enabled', 'success');
                } else {
                    this.game.disableAutoSave();
                    autoSaveToggle.textContent = 'Auto-Save: OFF';
                    autoSaveToggle.classList.add('disabled');
                    this.updateSaveStatus('Auto-save disabled', 'error');
                }
            });
        }
    }
    
    updateSaveStatus(message, type = 'normal') {
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.textContent = message;
            saveStatus.className = `save-status ${type}`;
            
            // Clear status after 3 seconds
            setTimeout(() => {
                saveStatus.textContent = '';
                saveStatus.className = 'save-status';
            }, 3000);
        }
    }
    
    updateSeedDisplay() {
        const seedDisplay = document.getElementById('seed-display');
        if (seedDisplay && this.game) {
            const currentSeed = this.game.getSeed();
            seedDisplay.textContent = currentSeed || 'Loading...';
        }
    }
    
    showGameInfo() {
        const treasureCount = this.game.entityManager.getRemainingTreasure();
        const playerMode = this.game.player.getMode();
        const currentSeed = this.game.getSeed();
        
        this.addMessage(`Mode: ${playerMode}, Treasure: ${treasureCount}, Seed: ${currentSeed}`);
    }
    
    // Inventory management methods
    toggleInventory() {
        const inventoryDisplay = document.getElementById('inventory-display');
        if (!inventoryDisplay) return;
        
        if (inventoryDisplay.style.display === 'none') {
            inventoryDisplay.style.display = 'block';
            this.updateInventoryDisplay();
            this.addMessage('Inventory opened');
        } else {
            inventoryDisplay.style.display = 'none';
            this.addMessage('Inventory closed');
        }
    }
    
    isInventoryOpen() {
        const inventoryDisplay = document.getElementById('inventory-display');
        return inventoryDisplay && inventoryDisplay.style.display !== 'none';
    }
    
    updateInventoryDisplay() {
        const inventoryContent = document.getElementById('inventory-content');
        const inventoryCapacity = document.getElementById('inventory-capacity');
        
        if (!inventoryContent || !this.game.playerInventory) return;
        
        // Update capacity indicator
        if (inventoryCapacity) {
            const totalItems = this.game.playerInventory.getTotalItems();
            const capacity = this.game.playerInventory.getCapacity();
            const percentage = capacity > 0 ? Math.round((totalItems / capacity) * 100) : 0;
            
            inventoryCapacity.innerHTML = `
                <div class="capacity-bar">
                    <div class="capacity-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="capacity-text">${totalItems}/${capacity} (${percentage}%)</div>
            `;
            
            // Update capacity bar color based on fullness
            const capacityFill = inventoryCapacity.querySelector('.capacity-fill');
            if (capacityFill) {
                if (percentage >= 90) {
                    capacityFill.style.backgroundColor = '#e74c3c'; // Red
                } else if (percentage >= 70) {
                    capacityFill.style.backgroundColor = '#f39c12'; // Orange
                } else {
                    capacityFill.style.backgroundColor = '#27ae60'; // Green
                }
            }
        }
        
        // Update inventory content
        if (this.game.playerInventory.isEmpty()) {
            inventoryContent.innerHTML = '<div class="inventory-empty">Inventory is empty</div>';
        } else {
            const resources = this.game.playerInventory.getAllResources();
            let inventoryHTML = '<div class="inventory-grid">';
            
            for (const [resourceType, data] of Object.entries(resources)) {
                const resourceInfo = this.game.resourceManager.getResourceInfo(resourceType);
                const displayName = resourceInfo ? resourceInfo.name : resourceType;
                const icon = resourceInfo ? resourceInfo.icon : '?';
                const description = resourceInfo ? resourceInfo.description : 'Unknown resource';
                
                inventoryHTML += `
                    <div class="inventory-item" title="${description}">
                        <div class="item-icon">${icon}</div>
                        <div class="item-info">
                            <div class="item-name">${displayName}</div>
                            <div class="item-quantity">${data.quantity}</div>
                        </div>
                    </div>
                `;
            }
            
            inventoryHTML += '</div>';
            inventoryContent.innerHTML = inventoryHTML;
        }
    }

    // Resource examination display methods
    displayExaminationResults(examResult) {
        // Add basic examination message
        this.addMessage(examResult.message);
        
        if (examResult.resources.length === 0) {
            return;
        }
        
        // Display available resources
        const resourceNames = examResult.resources.map(r => `${r.name} (${r.probability}%)`).join(', ');
        this.addMessage(`Available resources: ${resourceNames}`);
        
        // Display gathering information
        if (examResult.gatheringInfo) {
            const info = examResult.gatheringInfo;
            this.addMessage(`Success rate: ${info.successRate}% | ${info.difficultyHint}`);
            
            if (info.depletionLevel > 0) {
                this.addMessage(`Depletion: ${info.depletionLevel}% | ${info.depletionHint}`);
            }
            
            if (info.regenerationHint) {
                this.addMessage(info.regenerationHint);
            }
        }
        
        // Show detailed examination in a modal if available
        this.showExaminationModal(examResult);
    }

    showExaminationModal(examResult) {
        // Create or get examination modal
        let modal = document.getElementById('examination-modal');
        if (!modal) {
            modal = this.createExaminationModal();
        }
        
        // Populate modal content
        const modalContent = modal.querySelector('.examination-content');
        if (!modalContent) return;
        
        let html = `
            <h3>Examining ${examResult.biomeName}</h3>
            <div class="biome-info">
                <p>${examResult.message}</p>
            </div>
        `;
        
        if (examResult.resources.length > 0) {
            html += `
                <div class="resources-section">
                    <h4>Available Resources</h4>
                    <div class="resource-list">
            `;
            
            examResult.resources.forEach(resource => {
                const rarityInfo = this.game.resourceManager.getResourceRarityInfo(resource.rarity);
                html += `
                    <div class="resource-item" onclick="game.showResourceInfo('${resource.type}')">
                        <div class="resource-icon">${resource.icon}</div>
                        <div class="resource-details">
                            <div class="resource-name">${resource.name}</div>
                            <div class="resource-description">${resource.description}</div>
                            <div class="resource-stats">
                                <span class="probability">Chance: ${resource.probability}%</span>
                                <span class="quantity">Qty: ${resource.baseQuantity[0]}-${resource.baseQuantity[1]}</span>
                                <span class="rarity" style="color: ${rarityInfo.color}">${rarityInfo.name}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        if (examResult.gatheringInfo) {
            const info = examResult.gatheringInfo;
            html += `
                <div class="gathering-section">
                    <h4>Gathering Information</h4>
                    <div class="gathering-stats">
                        <div class="stat-row">
                            <span class="stat-label">Current Success Rate:</span>
                            <span class="stat-value ${info.successRate >= 70 ? 'good' : info.successRate >= 40 ? 'medium' : 'poor'}">${info.successRate}%</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Base Success Rate:</span>
                            <span class="stat-value">${info.baseSuccessRate}%</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Depletion Level:</span>
                            <span class="stat-value ${info.depletionLevel <= 20 ? 'good' : info.depletionLevel <= 60 ? 'medium' : 'poor'}">${info.depletionLevel}%</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Regeneration Time:</span>
                            <span class="stat-value">${info.regenerationTime} minutes</span>
                        </div>
                    </div>
                    <div class="gathering-hints">
                        <p class="difficulty-hint">${info.difficultyHint}</p>
                        <p class="depletion-hint">${info.depletionHint}</p>
                        ${info.regenerationHint ? `<p class="regeneration-hint">${info.regenerationHint}</p>` : ''}
                    </div>
                </div>
            `;
        }
        
        html += `
            <div class="modal-actions">
                <button onclick="this.closest('.modal').style.display='none'">Close</button>
                <button onclick="game.attemptGather(); this.closest('.modal').style.display='none'">Gather Here</button>
            </div>
        `;
        
        modalContent.innerHTML = html;
        modal.style.display = 'block';
    }

    createExaminationModal() {
        const modal = document.createElement('div');
        modal.id = 'examination-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                <div class="examination-content"></div>
            </div>
        `;
        
    }
    }

    displayGatheringHelp(helpInfo) {
        // Create or get help modal
        let modal = document.getElementById('help-modal');
        if (!modal) {
            modal = this.createHelpModal();
        }
        
        // Populate help content
        const modalContent = modal.querySelector('.help-content');
        if (!modalContent) return;
        
        let html = `<h3>${helpInfo.title}</h3>`;
        
        helpInfo.sections.forEach(section => {
            html += `
                <div class="help-section">
                    <h4>${section.title}</h4>
                    <ul>
            `;
            section.content.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `
                    </ul>
                </div>
            `;
        });
        
        html += `
            <div class="modal-actions">
                <button onclick="this.closest('.modal').style.display='none'">Close</button>
            </div>
        `;
        
        modalContent.innerHTML = html;
        modal.style.display = 'block';
        
        // Also add a summary message to the message log
        this.addMessage('Resource gathering help opened. Press H again to close.');
    }

    createHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'help-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                <div class="help-content"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }

    displayResourceInfo(resourceInfo) {
        // Create or get resource info modal
        let modal = document.getElementById('resource-info-modal');
        if (!modal) {
            modal = this.createResourceInfoModal();
        }
        
        // Populate resource info content
        const modalContent = modal.querySelector('.resource-info-content');
        if (!modalContent) return;
        
        const rarityInfo = resourceInfo.rarityInfo;
        
        let html = `
            <h3>${resourceInfo.icon} ${resourceInfo.name}</h3>
            <div class="resource-overview">
                <p class="resource-description">${resourceInfo.description}</p>
                <div class="resource-meta">
                    <span class="rarity" style="color: ${rarityInfo.color}">
                        ${rarityInfo.name} - ${rarityInfo.description}
                    </span>
                </div>
            </div>
        `;
        
        if (resourceInfo.foundIn.length > 0) {
            html += `
                <div class="found-in-section">
                    <h4>Found In</h4>
                    <div class="biome-list">
            `;
            
            resourceInfo.foundIn.forEach(biome => {
                html += `
                    <div class="biome-item">
                        <div class="biome-name">${biome.biomeName}</div>
                        <div class="biome-stats">
                            <span>Chance: ${biome.probability}%</span>
                            <span>Success: ${biome.baseSuccessRate}%</span>
                            <span>Qty: ${biome.quantity[0]}-${biome.quantity[1]}</span>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        if (resourceInfo.uses.length > 0) {
            html += `
                <div class="uses-section">
                    <h4>Potential Uses</h4>
                    <ul>
            `;
            resourceInfo.uses.forEach(use => {
                html += `<li>${use}</li>`;
            });
            html += `
                    </ul>
                </div>
            `;
        }
        
        html += `
            <div class="modal-actions">
                <button onclick="this.closest('.modal').style.display='none'">Close</button>
            </div>
        `;
        
        modalContent.innerHTML = html;
        modal.style.display = 'block';
    }

    createResourceInfoModal() {
        const modal = document.createElement('div');
        modal.id = 'resource-info-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                <div class="resource-info-content"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }
}