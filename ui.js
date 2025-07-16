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
        
        const biomeInfo = this.game.mapGenerator.getBiomeInfo(tile.biome);
        const modifier = this.game.fogOfWar.getVisibilityModifier(worldX, worldY);
        
        // Adjust color based on visibility
        let color = biomeInfo.color;
        if (modifier < 1.0) {
            color = this.adjustColorBrightness(color, modifier);
        }
        
        this.display.draw(screenX, screenY, biomeInfo.char, color);
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
    
    showGameInfo() {
        const treasureCount = this.game.entityManager.getRemainingTreasure();
        const playerMode = this.game.player.getMode();
        
        this.addMessage(`Mode: ${playerMode}, Treasure remaining: ${treasureCount}`);
    }
}