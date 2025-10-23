// UI controls and input handling
class UIManager {
    constructor(game) {
        this.game = game;
        this.display = null;
        this.messageLog = [];
        this.maxMessages = 10;
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
        
        if (gatherBtn) {
            gatherBtn.addEventListener('touchstart', () => this.handleGathering());
            gatherBtn.addEventListener('click', () => this.handleGathering());
        }
        
        if (inventoryBtn) {
            inventoryBtn.addEventListener('touchstart', () => this.handleInventoryToggle());
            inventoryBtn.addEventListener('click', () => this.handleInventoryToggle());
        }
        
        if (overlayGatherBtn) {
            overlayGatherBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleGathering(); });
            overlayGatherBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleGathering(); });
        }
        
        if (overlayInventoryBtn) {
            overlayInventoryBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleInventoryToggle(); });
            overlayInventoryBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleInventoryToggle(); });
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
            case 't':
            case 'T':
                this.handleTrading();
                break;
            case 'r':
            case 'R':
                this.handleRepair();
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

    handleTrading() {
        if (!this.game || !this.game.player || !this.game.entityManager) return;

        // Check if player is at a port
        const port = this.game.entityManager.getEntityAt(this.game.player.x, this.game.player.y);

        if (!port || port.type !== 'port') {
            this.addMessage('You must be at a port to trade!');
            return;
        }

        if (!port.economy) {
            this.addMessage('This port has no merchant!');
            return;
        }

        // Open trading interface
        this.game.openTrading(port);
    }

    handleRepair() {
        if (!this.game || !this.game.player || !this.game.entityManager) return;

        // Check if player is at a port
        const port = this.game.entityManager.getEntityAt(this.game.player.x, this.game.player.y);

        if (!port || port.type !== 'port') {
            this.addMessage('You must be at a port to repair!');
            return;
        }

        if (!port.economy) {
            this.addMessage('This port has no shipyard!');
            return;
        }

        // Check if player has a ship
        if (!this.game.player.shipDurability) {
            this.addMessage('You don\'t have a ship to repair!');
            return;
        }

        // Create a temporary ship object for repair calculations
        const tempShip = { durability: this.game.player.shipDurability };

        // Get repair info
        const repairInfo = this.game.economyManager.getRepairInfo(tempShip, port);

        if (!repairInfo.canRepair) {
            this.addMessage('Your ship is already at full health!');
            return;
        }

        // Execute repair
        const result = this.game.economyManager.executeRepairTransaction(
            this.game.player,
            tempShip,
            port
        );

        if (result.success) {
            this.addMessage(`Repaired ${result.hpRepaired} HP for ${result.cost}g! Ship: ${result.newHp}/${result.maxHp} HP`);
        } else {
            this.addMessage(`Repair failed: ${result.error} (Cost: ${repairInfo.totalCost}g)`);
        }
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

        // Render weather overlay
        this.renderWeather(visibleTiles);

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

                    // Use dynamic icon/color for ships based on durability
                    let char = entity.char;
                    let color = entity.color;

                    if (entity.type === 'ship' && entity.durability) {
                        char = this.game.entityManager.getShipIcon(entity);
                        color = this.game.entityManager.getShipColor(entity);
                    }

                    this.display.draw(screenX, screenY, char, color);
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

    renderWeather(visibleTiles) {
        if (!this.game.weatherManager) return;

        for (const tileData of visibleTiles) {
            // Check if there's weather at this world position
            const weather = this.game.weatherManager.getWeatherAt(tileData.worldX, tileData.worldY);

            if (weather && weather.type !== 'clear') {
                const weatherType = this.game.weatherManager.WEATHER_TYPES[weather.type];
                if (!weatherType || !weatherType.char) continue;

                // Check visibility state - only show in visible/explored areas
                const visibilityState = this.game.fogOfWar.getTileVisibilityState(tileData.worldX, tileData.worldY);
                if (visibilityState === 'hidden') continue;

                // Draw weather overlay with semi-transparency effect
                // For fog of war explored areas, dim the weather slightly
                let weatherColor = weatherType.color;
                if (visibilityState === 'explored') {
                    weatherColor = this.dimColor(weatherColor);
                }

                this.display.draw(tileData.screenX, tileData.screenY, weatherType.char, weatherColor);
            }
        }
    }

    dimColor(color) {
        // Simple dimming for explored areas
        if (!color) return color;
        // Reduce brightness by making it darker
        return color + '80'; // Add alpha for transparency if browser supports it
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
    
    addMessage(message) {
        this.messageLog.push(message);
        
        // Keep only the last maxMessages
        if (this.messageLog.length > this.maxMessages) {
            this.messageLog.shift();
        }
        
        this.updateMessageDisplay();
    }
    
    updateMessageDisplay() {
        const messageLog = document.getElementById('message-log');
        if (!messageLog) return;
        
        messageLog.innerHTML = '';
        
        this.messageLog.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.textContent = message;
            messageElement.style.marginBottom = '5px';
            messageLog.appendChild(messageElement);
        });
        
        // Scroll to bottom
        messageLog.scrollTop = messageLog.scrollHeight;
    }
    
    clearMessages() {
        this.messageLog = [];
        this.updateMessageDisplay();
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
        const playerGold = this.game.player.gold;

        this.addMessage(`Mode: ${playerMode}, Gold: ${playerGold}g, Treasure: ${treasureCount}, Seed: ${currentSeed}`);
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
        if (!inventoryContent || !this.game.playerInventory) return;
        
        const inventoryText = this.game.playerInventory.getInventoryDisplay(this.game.resourceManager);
        inventoryContent.innerHTML = inventoryText.replace(/\n/g, '<br>');
    }

    // Trading interface methods
    showTradingScreen(port) {
        if (!port || !port.economy) return;

        // Create or show trading modal
        let tradingModal = document.getElementById('trading-modal');
        if (!tradingModal) {
            tradingModal = this.createTradingModal();
        }

        this.currentTradingPort = port;
        this.updateTradingDisplay(port);
        tradingModal.style.display = 'block';

        // Add message
        const tierNames = { small: 'Small', medium: 'Medium', large: 'Large', capital: 'Capital' };
        const portTier = tierNames[port.economy.tier] || 'Unknown';
        this.addMessage(`Trading at ${portTier} Port (Merchant Gold: ${Math.floor(port.economy.gold)}g)`);
    }

    createTradingModal() {
        const modal = document.createElement('div');
        modal.id = 'trading-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #f39c12;
            color: #ecf0f1;
            padding: 20px;
            z-index: 1000;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        `;

        modal.innerHTML = `
            <div id="trading-header" style="margin-bottom: 15px; border-bottom: 1px solid #555; padding-bottom: 10px;"></div>
            <div id="trading-sell-section" style="margin-bottom: 20px;">
                <h3 style="color: #2ecc71; margin: 10px 0;">Your Inventory (Sell)</h3>
                <div id="trading-sell-items" style="font-family: monospace; font-size: 12px;"></div>
            </div>
            <div id="trading-buy-section">
                <h3 style="color: #3498db; margin: 10px 0;">Port Goods (Buy)</h3>
                <div id="trading-buy-items" style="font-family: monospace; font-size: 12px;"></div>
            </div>
            <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #555; color: #95a5a6;">
                <div>Press number keys (1-9) to select items</div>
                <div>Press S to sell selected item | Press B to buy selected item</div>
                <div>Press ESC to close trading</div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupTradingKeyHandlers();
        return modal;
    }

    updateTradingDisplay(port) {
        if (!port || !port.economy) return;

        const economyManager = this.game.economyManager;
        if (!economyManager) return;

        // Update header
        const header = document.getElementById('trading-header');
        if (header) {
            const tierNames = { small: 'Small', medium: 'Medium', large: 'Large', capital: 'Capital' };
            header.innerHTML = `
                <div style="font-size: 18px; font-weight: bold;">${tierNames[port.economy.tier]} Port Trading</div>
                <div style="margin-top: 5px;">Your Gold: <span style="color: #f1c40f;">${this.game.player.gold}g</span> |
                Merchant Gold: <span style="color: #f39c12;">${Math.floor(port.economy.gold)}g</span> / ${port.economy.maxGold}g</div>
            `;
        }

        // Update sell section (player inventory)
        const sellItems = document.getElementById('trading-sell-items');
        if (sellItems) {
            let html = '<table style="width: 100%; border-collapse: collapse;">';
            html += '<tr style="border-bottom: 1px solid #555;"><th style="text-align: left; padding: 5px;">Item</th><th>Qty</th><th>Price</th><th>Indicator</th><th>Port Space</th><th>Action</th></tr>';

            let index = 1;
            const resources = Object.keys(economyManager.BASE_PRICES);
            for (const resource of resources) {
                const qty = this.game.playerInventory.getQuantity(resource);
                if (qty > 0) {
                    const sellPrice = economyManager.calculateSellPrice(resource, port);
                    const basePrice = economyManager.BASE_PRICES[resource];
                    const indicator = economyManager.getPriceIndicator(sellPrice, basePrice);
                    const indicatorColor = indicator === '★' ? '#2ecc71' : indicator === '↓' ? '#e74c3c' : '#95a5a6';

                    // Port storage space
                    const portStock = port.economy.inventory[resource] || 0;
                    const portCapacity = port.economy.inventoryCapacity[resource] || 1;
                    const spaceAvailable = portCapacity - portStock;
                    let storageColor = '#95a5a6';
                    let storageText = `${spaceAvailable}`;
                    if (spaceAvailable === 0) {
                        storageColor = '#e74c3c';
                        storageText = 'FULL';
                    } else if (spaceAvailable < qty) {
                        storageColor = '#f39c12';
                    }

                    html += `<tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 5px;">${this.getResourceIcon(resource)} ${resource}</td>
                        <td style="text-align: center;">${qty}</td>
                        <td style="text-align: center; color: #f1c40f;">${sellPrice}g</td>
                        <td style="text-align: center; color: ${indicatorColor};">${indicator || '-'}</td>
                        <td style="text-align: center; color: ${storageColor};">${storageText}</td>
                        <td style="text-align: center;"><span style="color: #95a5a6;">[${index}]</span> Sell 1</td>
                    </tr>`;
                    index++;
                    if (index > 9) break;
                }
            }

            if (index === 1) {
                html += '<tr><td colspan="6" style="padding: 10px; text-align: center; color: #7f8c8d;">No items to sell</td></tr>';
            }

            html += '</table>';
            sellItems.innerHTML = html;
        }

        // Update buy section
        const buyItems = document.getElementById('trading-buy-items');
        if (buyItems) {
            let html = '<table style="width: 100%; border-collapse: collapse;">';
            html += '<tr style="border-bottom: 1px solid #555;"><th style="text-align: left; padding: 5px;">Item</th><th>Price</th><th>Indicator</th><th>Port Stock</th><th>Action</th></tr>';

            let index = 1;
            const resources = Object.keys(economyManager.BASE_PRICES);
            for (const resource of resources) {
                const buyPrice = economyManager.calculateBuyPrice(resource, port);
                const basePrice = economyManager.BASE_PRICES[resource];
                const indicator = economyManager.getPriceIndicator(buyPrice, basePrice);
                const indicatorColor = indicator === '★' ? '#e74c3c' : indicator === '↓' ? '#2ecc71' : '#95a5a6';

                // Port stock information
                const stock = port.economy.inventory[resource] || 0;
                const capacity = port.economy.inventoryCapacity[resource] || 1;
                const stockPercent = stock / capacity;
                let stockColor = '#95a5a6';
                let stockText = `${Math.floor(stock)}/${capacity}`;
                let stockStatus = '';

                if (stock === 0) {
                    stockColor = '#e74c3c';
                    stockStatus = ' OUT';
                } else if (stockPercent < 0.2) {
                    stockColor = '#f39c12';
                    stockStatus = ' LOW';
                } else if (stockPercent > 0.8) {
                    stockColor = '#2ecc71';
                    stockStatus = ' HIGH';
                }

                html += `<tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 5px;">${this.getResourceIcon(resource)} ${resource}</td>
                    <td style="text-align: center; color: #3498db;">${buyPrice}g</td>
                    <td style="text-align: center; color: ${indicatorColor};">${indicator || '-'}</td>
                    <td style="text-align: center; color: ${stockColor};">${stockText}${stockStatus}</td>
                    <td style="text-align: center;"><span style="color: #95a5a6;">[${index}]</span> Buy 1</td>
                </tr>`;
                index++;
                if (index > 9) break;
            }

            html += '</table>';
            buyItems.innerHTML = html;
        }

        // Store sellable items for key handling
        this.tradingSellItems = [];
        const resources = Object.keys(economyManager.BASE_PRICES);
        for (const resource of resources) {
            const qty = this.game.playerInventory.getQuantity(resource);
            if (qty > 0 && this.tradingSellItems.length < 9) {
                this.tradingSellItems.push(resource);
            }
        }

        this.tradingBuyItems = resources.slice(0, 9);
    }

    getResourceIcon(resource) {
        const icons = {
            wood: '🪵',
            berries: '🫐',
            stone: '🪨',
            sand: '⌛',
            ore: '⛏️',
            hay: '🌾',
            reeds: '🌿'
        };
        return icons[resource] || '📦';
    }

    setupTradingKeyHandlers() {
        this.tradingKeyHandler = (event) => {
            const modal = document.getElementById('trading-modal');
            if (!modal || modal.style.display === 'none') return;

            if (event.key === 'Escape') {
                this.closeTradingScreen();
                event.preventDefault();
                return;
            }

            // Number key selection
            const num = parseInt(event.key);
            if (num >= 1 && num <= 9) {
                this.selectedTradingIndex = num - 1;
                this.addMessage(`Selected item #${num}`);
                event.preventDefault();
                return;
            }

            // Sell action
            if (event.key === 's' || event.key === 'S') {
                this.executeSell();
                event.preventDefault();
                return;
            }

            // Buy action
            if (event.key === 'b' || event.key === 'B') {
                this.executeBuy();
                event.preventDefault();
                return;
            }
        };

        document.addEventListener('keydown', this.tradingKeyHandler);
    }

    executeSell() {
        if (this.selectedTradingIndex === undefined || !this.currentTradingPort) {
            this.addMessage('Select an item first (press 1-9)');
            return;
        }

        const resource = this.tradingSellItems[this.selectedTradingIndex];
        if (!resource) {
            this.addMessage('Invalid selection');
            return;
        }

        const quantity = 1; // For now, sell 1 at a time
        const result = this.game.economyManager.executeSellTransaction(
            this.game.player,
            this.currentTradingPort,
            resource,
            quantity
        );

        if (result.success) {
            this.addMessage(`Sold ${quantity} ${resource} for ${result.earned}g! (${result.pricePerUnit}g each)`);
            this.updateTradingDisplay(this.currentTradingPort);
            this.game.updateInventoryDisplay();
        } else {
            this.addMessage(`Cannot sell: ${result.error}`);
            if (result.suggestion) {
                this.addMessage(result.suggestion);
            }
        }
    }

    executeBuy() {
        if (this.selectedTradingIndex === undefined || !this.currentTradingPort) {
            this.addMessage('Select an item first (press 1-9)');
            return;
        }

        const resource = this.tradingBuyItems[this.selectedTradingIndex];
        if (!resource) {
            this.addMessage('Invalid selection');
            return;
        }

        const quantity = 1; // For now, buy 1 at a time
        const result = this.game.economyManager.executeBuyTransaction(
            this.game.player,
            this.currentTradingPort,
            resource,
            quantity
        );

        if (result.success) {
            this.addMessage(`Bought ${quantity} ${resource} for ${result.spent}g! (${result.pricePerUnit}g each)`);
            this.updateTradingDisplay(this.currentTradingPort);
            this.game.updateInventoryDisplay();
        } else {
            this.addMessage(`Cannot buy: ${result.error}`);
        }
    }

    closeTradingScreen() {
        const modal = document.getElementById('trading-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        this.currentTradingPort = null;
        this.selectedTradingIndex = undefined;
        this.tradingSellItems = [];
        this.tradingBuyItems = [];

        // Remove key handler
        if (this.tradingKeyHandler) {
            document.removeEventListener('keydown', this.tradingKeyHandler);
            this.tradingKeyHandler = null;
        }

        this.addMessage('Closed trading');
    }
}