/* ================================================================
   RUNNER Terminal v3.0 - Complete JavaScript
   Post-apocalyptic blockchain gaming platform
   ================================================================ */

// Global Configuration
const CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8080/api' 
        : 'https://your-bot-domain.com/api',
    
    // Telegram WebApp
    TELEGRAM_BOT_USERNAME: 'kiloton_runner_terminal_bot',
    
    // TON Connect
    TON_CONNECT_MANIFEST: 'https://kilotonproject.github.io/MiniApp/tonconnect-manifest.json',
    TON_NETWORK: 'testnet', // 'mainnet' or 'testnet'
    
    // Game Configuration
    GAMES: {
        'terminal-hacking': {
            name: 'Terminal Hacking',
            difficulty: 'Medium',
            duration: 180, // seconds
            rewards: { min: 5, max: 50 },
            currency: 'TSAR'
        },
        'wasteland-wings': {
            name: 'Wasteland Wings',
            difficulty: 'Hard',
            duration: 300,
            rewards: { min: 10, max: 100 },
            currency: 'TSAR'
        },
        'nuclear-charge': {
            name: 'Nuclear Charge',
            difficulty: 'Expert',
            duration: 600,
            rewards: { min: 20, max: 500 },
            currency: 'TSAR'
        }
    },
    
    // Mission Configuration
    MISSIONS: {
        DAILY_RESET_HOUR: 0, // UTC
        WEEKLY_RESET_DAY: 1,  // Monday
        REFRESH_INTERVAL: 300000 // 5 minutes
    },
    
    // UI Configuration
    ANIMATIONS: {
        FAST: 200,
        NORMAL: 300,
        SLOW: 500
    },
    
    // Notification Settings
    NOTIFICATIONS: {
        AUTO_HIDE_DELAY: 5000,
        MAX_NOTIFICATIONS: 5
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        USER_DATA: 'runner_user_data',
        SETTINGS: 'runner_settings',
        GAME_STATE: 'runner_game_state',
        ACHIEVEMENTS: 'runner_achievements'
    }
};

// Global State Management
class StateManager {
    constructor() {
        this.state = {
            user: null,
            currentSection: 'dashboard',
            gameState: null,
            missions: [],
            notifications: [],
            isLoading: false,
            isConnected: false,
            wallet: null,
            settings: this.loadSettings()
        };
        this.listeners = new Map();
    }
    
    // State getters
    getState() {
        return { ...this.state };
    }
    
    getUser() {
        return this.state.user;
    }
    
    getCurrentSection() {
        return this.state.currentSection;
    }
    
    getWallet() {
        return this.state.wallet;
    }
    
    // State setters
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.notifyListeners(oldState, this.state);
        this.saveToStorage();
    }
    
    setUser(user) {
        this.setState({ user });
    }
    
    setCurrentSection(section) {
        this.setState({ currentSection: section });
    }
    
    setWallet(wallet) {
        this.setState({ wallet, isConnected: !!wallet });
    }
    
    // Event listeners
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    unsubscribe(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    notifyListeners(oldState, newState) {
        // Check what changed and notify appropriate listeners
        if (oldState.user !== newState.user) {
            this.emit('userChanged', newState.user);
        }
        if (oldState.currentSection !== newState.currentSection) {
            this.emit('sectionChanged', newState.currentSection);
        }
        if (oldState.wallet !== newState.wallet) {
            this.emit('walletChanged', newState.wallet);
        }
        this.emit('stateChanged', newState);
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in listener for ${event}:`, error);
                }
            });
        }
    }
    
    // Persistence
    saveToStorage() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.state.user));
            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(this.state.settings));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }
    
    loadSettings() {
        try {
            const settings = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : {
                soundEnabled: true,
                animationsEnabled: true,
                notificationsEnabled: true,
                theme: 'dark',
                language: 'en'
            };
        } catch (error) {
            console.error('Failed to load settings:', error);
            return {
                soundEnabled: true,
                animationsEnabled: true,
                notificationsEnabled: true,
                theme: 'dark',
                language: 'en'
            };
        }
    }
}

// API Service
class APIService {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // ms
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`API Request (attempt ${attempt}):`, url, requestOptions);
                
                const response = await fetch(url, requestOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('API Response:', data);
                
                return data;
            } catch (error) {
                console.error(`API Request failed (attempt ${attempt}):`, error);
                
                if (attempt === this.retryAttempts) {
                    throw error;
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }
    
    // User API
    async getUser(userId) {
        return this.request(`/user/${userId}`);
    }
    
    async updateGameStats(userId, gameData) {
        return this.request('/update-game-stats', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                ...gameData
            })
        });
    }
    
    async completeMission(userId, missionId, verificationData = {}) {
        return this.request('/complete-mission', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                mission_id: missionId,
                verification_data: verificationData
            })
        });
    }
    
    // Stars API
    async createStarsInvoice(userId, productId) {
        return this.request('/create-stars-invoice', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                product_id: productId
            })
        });
    }
    
    async getShopProducts() {
        return this.request('/shop/products');
    }
    
    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

// Notification System
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = CONFIG.NOTIFICATIONS.MAX_NOTIFICATIONS;
        this.autoHideDelay = CONFIG.NOTIFICATIONS.AUTO_HIDE_DELAY;
    }
    
    init() {
        this.container = document.getElementById('notifications');
        if (!this.container) {
            console.error('Notifications container not found');
        }
    }
    
    show(message, type = 'info', options = {}) {
        if (!this.container) return;
        
        const notification = this.createNotification(message, type, options);
        this.notifications.push(notification);
        
        // Remove old notifications if too many
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.removeNotification(oldest);
        }
        
        this.container.appendChild(notification.element);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });
        
        // Auto-hide
        if (options.autoHide !== false) {
            notification.timeout = setTimeout(() => {
                this.hide(notification);
            }, options.duration || this.autoHideDelay);
        }
        
        return notification;
    }
    
    createNotification(message, type, options) {
        const id = Date.now().toString();
        const element = document.createElement('div');
        element.className = `notification ${type}`;
        element.dataset.id = id;
        
        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        element.innerHTML = `
            <div class="notification-header">
                <span class="notification-icon">${iconMap[type] || iconMap.info}</span>
                <span class="notification-title">${options.title || type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <button class="notification-close" onclick="notificationManager.hide('${id}')">&times;</button>
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        return {
            id,
            element,
            type,
            message,
            timeout: null
        };
    }
    
    hide(notificationOrId) {
        let notification;
        
        if (typeof notificationOrId === 'string') {
            notification = this.notifications.find(n => n.id === notificationOrId);
        } else {
            notification = notificationOrId;
        }
        
        if (!notification) return;
        
        // Clear timeout
        if (notification.timeout) {
            clearTimeout(notification.timeout);
        }
        
        // Animate out
        notification.element.classList.add('hiding');
        
        setTimeout(() => {
            this.removeNotification(notification);
        }, CONFIG.ANIMATIONS.NORMAL);
    }
    
    removeNotification(notification) {
        if (notification.element && notification.element.parentNode) {
            notification.element.parentNode.removeChild(notification.element);
        }
        
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }
    }
    
    clear() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
        this.notifications = [];
    }
    
    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }
    
    error(message, options = {}) {
        return this.show(message, 'error', options);
    }
    
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }
    
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }
}

// TON Connect Integration
class TONConnectManager {
    constructor() {
        this.tonConnect = null;
        this.wallet = null;
        this.isConnected = false;
    }
    
    async init() {
        try {
            // Import TON Connect UI
            if (typeof TonConnectUI !== 'undefined') {
                this.tonConnect = new TonConnectUI({
                    manifestUrl: CONFIG.TON_CONNECT_MANIFEST,
                    buttonRootId: 'ton-connect-btn'
                });
                
                // Subscribe to wallet events
                this.tonConnect.onStatusChange(wallet => {
                    this.handleWalletChange(wallet);
                });
                
                console.log('TON Connect initialized');
            } else {
                console.warn('TON Connect UI not available');
            }
        } catch (error) {
            console.error('Failed to initialize TON Connect:', error);
        }
    }
    
    handleWalletChange(wallet) {
        this.wallet = wallet;
        this.isConnected = !!wallet;
        
        // Update global state
        stateManager.setWallet(wallet);
        
        // Update UI
        this.updateWalletUI();
        
        if (wallet) {
            notificationManager.success('Wallet connected successfully!', {
                title: 'TON Wallet'
            });
            
            // Save wallet to user data
            if (stateManager.getUser()) {
                this.saveWalletAddress(wallet.account.address);
            }
        } else {
            notificationManager.info('Wallet disconnected', {
                title: 'TON Wallet'
            });
        }
    }
    
    updateWalletUI() {
        const walletBtn = document.getElementById('ton-connect-btn');
        const walletStatus = document.getElementById('wallet-status');
        
        if (walletStatus) {
            if (this.isConnected && this.wallet) {
                const address = this.wallet.account.address;
                const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
                walletStatus.textContent = shortAddress;
                walletBtn.classList.add('connected');
            } else {
                walletStatus.textContent = 'Connect Wallet';
                walletBtn.classList.remove('connected');
            }
        }
    }
    
    async connect() {
        if (!this.tonConnect) {
            notificationManager.error('TON Connect not initialized');
            return;
        }
        
        try {
            await this.tonConnect.connectWallet();
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            notificationManager.error('Failed to connect wallet');
        }
    }
    
    async disconnect() {
        if (!this.tonConnect) return;
        
        try {
            await this.tonConnect.disconnect();
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
        }
    }
    
    async saveWalletAddress(address) {
        try {
            const user = stateManager.getUser();
            if (user) {
                const response = await apiService.request('/update-user', {
                    method: 'POST',
                    body: JSON.stringify({
                        user_id: user.user_id,
                        wallet_address: address
                    })
                });
                
                if (response.success) {
                    // Update local user data
                    user.wallet_address = address;
                    stateManager.setUser(user);
                }
            }
        } catch (error) {
            console.error('Failed to save wallet address:', error);
        }
    }
    
    async sendTransaction(transaction) {
        if (!this.tonConnect || !this.isConnected) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const result = await this.tonConnect.sendTransaction(transaction);
            return result;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }
}

// Game Engine
class GameEngine {
    constructor() {
        this.currentGame = null;
        this.gameState = null;
        this.gameContainer = null;
        this.gameArea = null;
        this.gameControls = null;
        this.gameModal = null;
        this.gameTimer = null;
        this.gameData = {};
    }
    
    init() {
        this.gameModal = document.getElementById('game-modal');
        this.gameContainer = this.gameModal?.querySelector('.game-container');
        this.gameArea = document.getElementById('game-area');
        this.gameControls = document.getElementById('game-controls');
        
        // Add event listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    async startGame(gameId) {
        try {
            if (!CONFIG.GAMES[gameId]) {
                throw new Error(`Unknown game: ${gameId}`);
            }
            
            this.currentGame = gameId;
            const gameConfig = CONFIG.GAMES[gameId];
            
            // Initialize game data
            this.gameData = {
                gameId,
                startTime: Date.now(),
                score: 0,
                level: 1,
                isPlaying: true,
                duration: gameConfig.duration
            };
            
            // Show game modal
            this.showGameModal(gameConfig.name);
            
            // Load game-specific logic
            await this.loadGame(gameId);
            
            // Start game timer
            this.startGameTimer();
            
            notificationManager.success(`${gameConfig.name} started!`, {
                title: 'Game Started'
            });
            
        } catch (error) {
            console.error('Failed to start game:', error);
            notificationManager.error(`Failed to start game: ${error.message}`);
        }
    }
    
    async loadGame(gameId) {
        switch (gameId) {
            case 'terminal-hacking':
                await this.loadTerminalHacking();
                break;
            case 'wasteland-wings':
                await this.loadWastelandWings();
                break;
            case 'nuclear-charge':
                await this.loadNuclearCharge();
                break;
            default:
                throw new Error(`Game ${gameId} not implemented`);
        }
    }
    
    showGameModal(title) {
        if (!this.gameModal) return;
        
        const titleElement = document.getElementById('game-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
        
        this.gameModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus game area for keyboard input
        if (this.gameArea) {
            this.gameArea.focus();
        }
    }
    
    closeGame() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.gameModal) {
            this.gameModal.style.display = 'none';
        }
        
        document.body.style.overflow = '';
        
        // Submit game results if game was played
        if (this.gameData && this.gameData.isPlaying) {
            this.endGame(false); // Game was abandoned
        }
        
        this.currentGame = null;
        this.gameData = {};
    }
    
    async endGame(won = false) {
        if (!this.currentGame || !this.gameData) return;
        
        this.gameData.isPlaying = false;
        this.gameData.endTime = Date.now();
        this.gameData.duration = this.gameData.endTime - this.gameData.startTime;
        this.gameData.won = won;
        
        try {
            // Submit game results to API
            const user = stateManager.getUser();
            if (user) {
                const response = await apiService.updateGameStats(user.user_id, {
                    game_type: this.currentGame,
                    score: this.gameData.score,
                    won: won,
                    duration: Math.floor(this.gameData.duration / 1000)
                });
                
                if (response.success) {
                    // Show rewards
                    this.showGameResults(response.rewards, response.stats);
                    
                    // Update user data
                    await this.refreshUserData();
                } else {
                    notificationManager.error('Failed to save game results');
                }
            }
        } catch (error) {
            console.error('Failed to submit game results:', error);
            notificationManager.error('Failed to save game results');
        }
        
        // Clear game timer
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    showGameResults(rewards, stats) {
        const resultText = this.gameData.won ? 'Victory!' : 'Game Over';
        const resultClass = this.gameData.won ? 'success' : 'info';
        
        let rewardText = '';
        if (rewards) {
            if (rewards.bottle_caps > 0) {
                rewardText += `🍺 +${rewards.bottle_caps} Bottle Caps\n`;
            }
            if (rewards.tsar_tokens > 0) {
                rewardText += `💰 +${rewards.tsar_tokens} TSAR Tokens\n`;
            }
            if (rewards.level_up) {
                rewardText += `🎉 Level up! Now level ${rewards.new_level}\n`;
            }
        }
        
        notificationManager.show(`${resultText}\n\nScore: ${this.gameData.score}\n${rewardText}`, resultClass, {
            title: CONFIG.GAMES[this.currentGame].name,
            duration: 8000
        });
    }
    
    startGameTimer() {
        if (!this.gameData.duration) return;
        
        const updateTimer = () => {
            const elapsed = Date.now() - this.gameData.startTime;
            const remaining = this.gameData.duration * 1000 - elapsed;
            
            if (remaining <= 0) {
                this.endGame(false); // Time's up
                return;
            }
            
            // Update timer display
            const seconds = Math.ceil(remaining / 1000);
            const timerElement = document.getElementById('game-timer');
            if (timerElement) {
                timerElement.textContent = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
            }
        };
        
        updateTimer();
        this.gameTimer = setInterval(updateTimer, 1000);
    }
    
    handleKeyDown(event) {
        if (!this.currentGame || !this.gameData.isPlaying) return;
        
        // Game-specific key handling
        switch (this.currentGame) {
            case 'terminal-hacking':
                this.handleTerminalHackingKey(event);
                break;
            case 'wasteland-wings':
                this.handleWastelandWingsKey(event);
                break;
            case 'nuclear-charge':
                this.handleNuclearChargeKey(event);
                break;
        }
    }
    
    handleKeyUp(event) {
        // Handle key release events if needed
    }
    
    async refreshUserData() {
        try {
            const user = stateManager.getUser();
            if (user) {
                const response = await apiService.getUser(user.user_id);
                if (response.success) {
                    stateManager.setUser(response.data);
                    updateUserDisplay();
                }
            }
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    }
    
    // Game-specific implementations
    async loadTerminalHacking() {
        if (!this.gameArea) return;
        
        this.gameArea.innerHTML = `
            <div class="terminal-hacking-game">
                <div class="terminal-screen">
                    <div class="terminal-header">
                        <span class="terminal-title">ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL</span>
                        <span class="terminal-timer" id="game-timer">3:00</span>
                    </div>
                    <div class="terminal-content">
                        <div class="terminal-log" id="terminal-log">
                            <div class="log-line">Welcome to ROBCO Industries (TM) Termlink</div>
                            <div class="log-line">Password Required</div>
                            <div class="log-line">Attempts Remaining: <span id="attempts-remaining">4</span></div>
                            <div class="log-line"></div>
                        </div>
                        <div class="terminal-words" id="terminal-words">
                            <!-- Words will be generated here -->
                        </div>
                        <div class="terminal-input">
                            <span class="prompt">&gt;</span>
                            <input type="text" id="terminal-input" placeholder="Select a word..." readonly>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize terminal hacking game
        this.initTerminalHacking();
    }
    
    initTerminalHacking() {
        const words = this.generateHackingWords();
        const correctWord = words[Math.floor(Math.random() * words.length)];
        
        this.gameData.correctWord = correctWord;
        this.gameData.attempts = 4;
        this.gameData.words = words;
        
        const wordsContainer = document.getElementById('terminal-words');
        if (wordsContainer) {
            wordsContainer.innerHTML = words.map((word, index) => 
                `<span class="terminal-word" data-word="${word}" onclick="gameEngine.selectWord('${word}')">${word}</span>`
            ).join('');
        }
    }
    
    generateHackingWords() {
        const wordLists = {
            4: ['HACK', 'CODE', 'DATA', 'BYTE', 'CORE', 'FIRE', 'WAVE', 'ZERO'],
            5: ['VIRUS', 'CYBER', 'LOGIN', 'ADMIN', 'GHOST', 'QUICK', 'BRAIN', 'STORM'],
            6: ['MATRIX', 'SYSTEM', 'ACCESS', 'SECURE', 'BYPASS', 'NEURAL', 'BINARY', 'CRYPTO'],
            7: ['NETWORK', 'PROGRAM', 'MACHINE', 'DIGITAL', 'PROCESS', 'HACKER', 'FIREWALL', 'QUANTUM'],
            8: ['PASSWORD', 'TERMINAL', 'DATABASE', 'PROTOCOL', 'MAINFRAME', 'SUBROUTINE', 'BACKDOOR', 'OVERRIDE']
        };
        
        const length = 4 + Math.floor(Math.random() * 5); // 4-8 letters
        const wordList = wordLists[length];
        
        // Select 8 random words
        const selectedWords = [];
        while (selectedWords.length < 8) {
            const word = wordList[Math.floor(Math.random() * wordList.length)];
            if (!selectedWords.includes(word)) {
                selectedWords.push(word);
            }
        }
        
        return selectedWords;
    }
    
    selectWord(word) {
        if (!this.gameData.isPlaying) return;
        
        const input = document.getElementById('terminal-input');
        if (input) {
            input.value = word;
        }
        
        if (word === this.gameData.correctWord) {
            this.terminalHackingSuccess();
        } else {
            this.terminalHackingFailure(word);
        }
    }
    
    terminalHackingSuccess() {
        const log = document.getElementById('terminal-log');
        if (log) {
            log.innerHTML += `
                <div class="log-line success">&gt; ${this.gameData.correctWord}</div>
                <div class="log-line success">Exact match!</div>
                <div class="log-line success">Please wait while system is accessed...</div>
                <div class="log-line success">Access granted!</div>
            `;
        }
        
        this.gameData.score = 1000 * this.gameData.attempts; // Bonus for fewer attempts
        this.endGame(true);
    }
    
    terminalHackingFailure(selectedWord) {
        this.gameData.attempts--;
        
        const likeness = this.calculateLikeness(selectedWord, this.gameData.correctWord);
        
        const log = document.getElementById('terminal-log');
        const attemptsElement = document.getElementById('attempts-remaining');
        
        if (log) {
            log.innerHTML += `
                <div class="log-line error">&gt; ${selectedWord}</div>
                <div class="log-line error">Entry denied</div>
                <div class="log-line">Likeness=${likeness}</div>
                <div class="log-line"></div>
            `;
        }
        
        if (attemptsElement) {
            attemptsElement.textContent = this.gameData.attempts;
        }
        
        if (this.gameData.attempts <= 0) {
            if (log) {
                log.innerHTML += `
                    <div class="log-line error">Terminal locked</div>
                    <div class="log-line error">Please contact an administrator</div>
                `;
            }
            this.gameData.score = 100; // Consolation score
            this.endGame(false);
        }
    }
    
    calculateLikeness(word1, word2) {
        let likeness = 0;
        const minLength = Math.min(word1.length, word2.length);
        
        for (let i = 0; i < minLength; i++) {
            if (word1[i] === word2[i]) {
                likeness++;
            }
        }
        
        return likeness;
    }
    
    handleTerminalHackingKey(event) {
        // Terminal hacking uses mouse clicks, not keyboard
    }
    
    async loadWastelandWings() {
        if (!this.gameArea) return;
        
        this.gameArea.innerHTML = `
            <div class="wasteland-wings-game">
                <canvas id="wings-canvas" width="800" height="600"></canvas>
                <div class="wings-ui">
                    <div class="wings-score">Score: <span id="wings-score">0</span></div>
                    <div class="wings-health">Health: <span id="wings-health">100</span></div>
                    <div class="wings-timer" id="game-timer">5:00</div>
                </div>
            </div>
        `;
        
        this.initWastelandWings();
    }
    
    initWastelandWings() {
        const canvas = document.getElementById('wings-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        this.gameData.wingsGame = {
            canvas,
            ctx,
            player: {
                x: 100,
                y: 300,
                width: 40,
                height: 30,
                health: 100,
                speed: 5
            },
            enemies: [],
            bullets: [],
            score: 0,
            keys: {}
        };
        
        this.startWastelandWingsLoop();
        this.spawnEnemies();
    }
    
    startWastelandWingsLoop() {
        const gameLoop = () => {
            if (!this.gameData.isPlaying) return;
            
            this.updateWastelandWings();
            this.renderWastelandWings();
            
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    updateWastelandWings() {
        const game = this.gameData.wingsGame;
        if (!game) return;
        
        // Update player position
        if (game.keys.ArrowUp && game.player.y > 0) {
            game.player.y -= game.player.speed;
        }
        if (game.keys.ArrowDown && game.player.y < game.canvas.height - game.player.height) {
            game.player.y += game.player.speed;
        }
        if (game.keys.ArrowLeft && game.player.x > 0) {
            game.player.x -= game.player.speed;
        }
        if (game.keys.ArrowRight && game.player.x < game.canvas.width - game.player.width) {
            game.player.x += game.player.speed;
        }
        
        // Update bullets
        game.bullets = game.bullets.filter(bullet => {
            bullet.x += bullet.speed;
            return bullet.x < game.canvas.width;
        });
        
        // Update enemies
        game.enemies = game.enemies.filter(enemy => {
            enemy.x -= enemy.speed;
            
            // Check collision with player
            if (this.checkCollision(game.player, enemy)) {
                game.player.health -= 10;
                if (game.player.health <= 0) {
                    this.endGame(false);
                }
                return false; // Remove enemy
            }
            
            // Check collision with bullets
            for (let i = game.bullets.length - 1; i >= 0; i--) {
                if (this.checkCollision(game.bullets[i], enemy)) {
                    game.bullets.splice(i, 1);
                    game.score += 10;
                    return false; // Remove enemy
                }
            }
            
            return enemy.x > -enemy.width;
        });
        
        // Update UI
        const scoreElement = document.getElementById('wings-score');
        const healthElement = document.getElementById('wings-health');
        
        if (scoreElement) scoreElement.textContent = game.score;
        if (healthElement) healthElement.textContent = game.player.health;
        
        this.gameData.score = game.score;
    }
    
    renderWastelandWings() {
        const game = this.gameData.wingsGame;
        if (!game) return;
        
        const { ctx, canvas } = game;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw player
        ctx.fillStyle = '#00ff41';
        ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
        
        // Draw enemies
        ctx.fillStyle = '#ff4444';
        game.enemies.forEach(enemy => {
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
        
        // Draw bullets
        ctx.fillStyle = '#ffff00';
        game.bullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }
    
    spawnEnemies() {
        const spawnEnemy = () => {
            if (!this.gameData.isPlaying) return;
            
            const game = this.gameData.wingsGame;
            if (!game) return;
            
            game.enemies.push({
                x: game.canvas.width,
                y: Math.random() * (game.canvas.height - 40),
                width: 30,
                height: 20,
                speed: 2 + Math.random() * 3
            });
            
            setTimeout(spawnEnemy, 1000 + Math.random() * 2000);
        };
        
        setTimeout(spawnEnemy, 2000);
    }
    
    handleWastelandWingsKey(event) {
        const game = this.gameData.wingsGame;
        if (!game) return;
        
        if (event.type === 'keydown') {
            game.keys[event.code] = true;
            
            if (event.code === 'Space') {
                event.preventDefault();
                this.shootBullet();
            }
        } else if (event.type === 'keyup') {
            game.keys[event.code] = false;
        }
    }
    
    shootBullet() {
        const game = this.gameData.wingsGame;
        if (!game) return;
        
        game.bullets.push({
            x: game.player.x + game.player.width,
            y: game.player.y + game.player.height / 2,
            width: 10,
            height: 3,
            speed: 8
        });
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    async loadNuclearCharge() {
        if (!this.gameArea) return;
        
        this.gameArea.innerHTML = `
            <div class="nuclear-charge-game">
                <div class="trading-interface">
                    <div class="market-display">
                        <h3>Fusion Core Market</h3>
                        <div class="price-chart" id="price-chart">
                            <canvas id="chart-canvas" width="400" height="200"></canvas>
                        </div>
                        <div class="current-price">
                            Current Price: <span id="current-price">100</span> Caps
                        </div>
                    </div>
                    <div class="trading-controls">
                        <div class="inventory">
                            <div>Fusion Cores: <span id="cores-count">0</span></div>
                            <div>Caps: <span id="caps-count">1000</span></div>
                        </div>
                        <div class="trading-buttons">
                            <button id="buy-btn" onclick="gameEngine.buyCore()">Buy Core</button>
                            <button id="sell-btn" onclick="gameEngine.sellCore()">Sell Core</button>
                        </div>
                        <div class="market-info">
                            <div>Portfolio Value: <span id="portfolio-value">1000</span> Caps</div>
                            <div>Profit/Loss: <span id="profit-loss">0</span> Caps</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.initNuclearCharge();
    }
    
    initNuclearCharge() {
        this.gameData.tradingGame = {
            cores: 0,
            caps: 1000,
            initialCaps: 1000,
            currentPrice: 100,
            priceHistory: [100],
            priceDirection: 1
        };
        
        this.updateTradingDisplay();
        this.startPriceSimulation();
    }
    
    startPriceSimulation() {
        const updatePrice = () => {
            if (!this.gameData.isPlaying) return;
            
            const game = this.gameData.tradingGame;
            
            // Simple price simulation
            const change = (Math.random() - 0.5) * 20;
            game.currentPrice = Math.max(50, Math.min(200, game.currentPrice + change));
            game.priceHistory.push(game.currentPrice);
            
            // Keep only last 50 prices
            if (game.priceHistory.length > 50) {
                game.priceHistory.shift();
            }
            
            this.updateTradingDisplay();
            this.updateChart();
            
            setTimeout(updatePrice, 2000);
        };
        
        updatePrice();
    }
    
    updateTradingDisplay() {
        const game = this.gameData.tradingGame;
        
        document.getElementById('cores-count').textContent = game.cores;
        document.getElementById('caps-count').textContent = Math.floor(game.caps);
        document.getElementById('current-price').textContent = Math.floor(game.currentPrice);
        
        const portfolioValue = game.caps + (game.cores * game.currentPrice);
        const profitLoss = portfolioValue - game.initialCaps;
        
        document.getElementById('portfolio-value').textContent = Math.floor(portfolioValue);
        document.getElementById('profit-loss').textContent = Math.floor(profitLoss);
        
        this.gameData.score = Math.max(0, profitLoss);
    }
    
    updateChart() {
        const canvas = document.getElementById('chart-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const game = this.gameData.tradingGame;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (game.priceHistory.length < 2) return;
        
        const minPrice = Math.min(...game.priceHistory);
        const maxPrice = Math.max(...game.priceHistory);
        const priceRange = maxPrice - minPrice;
        
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        game.priceHistory.forEach((price, index) => {
            const x = (index / (game.priceHistory.length - 1)) * canvas.width;
            const y = canvas.height - ((price - minPrice) / priceRange) * canvas.height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }
    
    buyCore() {
        const game = this.gameData.tradingGame;
        
        if (game.caps >= game.currentPrice) {
            game.caps -= game.currentPrice;
            game.cores++;
            this.updateTradingDisplay();
            
            notificationManager.success(`Bought 1 Fusion Core for ${Math.floor(game.currentPrice)} caps`);
        } else {
            notificationManager.warning('Not enough caps!');
        }
    }
    
    sellCore() {
        const game = this.gameData.tradingGame;
        
        if (game.cores > 0) {
            game.caps += game.currentPrice;
            game.cores--;
            this.updateTradingDisplay();
            
            notificationManager.success(`Sold 1 Fusion Core for ${Math.floor(game.currentPrice)} caps`);
        } else {
            notificationManager.warning('No cores to sell!');
        }
    }
    
    handleNuclearChargeKey(event) {
        // Nuclear Charge uses mouse clicks, not keyboard
    }
}

// Mission System
class MissionManager {
    constructor() {
        this.missions = [];
        this.availableMissions = [
            {
                id: 1,
                title: '🎮 First Steps',
                description: 'Play your first game in RUNNER Terminal',
                type: 'daily',
                difficulty: 'Easy',
                requirements: { games_played: 1 },
                rewards: { tsar: 50, bottle_caps: 100 },
                progress: 0,
                maxProgress: 1
            },
            {
                id: 2,
                title: '🔗 Social Butterfly',
                description: 'Share RUNNER Terminal with 3 friends',
                type: 'weekly',
                difficulty: 'Medium',
                requirements: { referrals: 3 },
                rewards: { tsar: 200, bottle_caps: 500 },
                progress: 0,
                maxProgress: 3
            },
            {
                id: 3,
                title: '💰 Wallet Connect',
                description: 'Connect your TON wallet to RUNNER Terminal',
                type: 'special',
                difficulty: 'Easy',
                requirements: { wallet_connected: true },
                rewards: { tsar: 150, bottle_caps: 300 },
                progress: 0,
                maxProgress: 1
            },
            {
                id: 4,
                title: '🏆 Win Streak',
                description: 'Win 5 games in a row',
                type: 'daily',
                difficulty: 'Hard',
                requirements: { win_streak: 5 },
                rewards: { tsar: 300, bottle_caps: 750 },
                progress: 0,
                maxProgress: 5
            },
            {
                id: 5,
                title: '⭐ High Score',
                description: 'Achieve a score of 5000+ in any game',
                type: 'weekly',
                difficulty: 'Expert',
                requirements: { high_score: 5000 },
                rewards: { tsar: 500, ton: 0.001 },
                progress: 0,
                maxProgress: 5000
            }
        ];
    }
    
    async loadMissions() {
        try {
            // In a real implementation, this would fetch from API
            this.missions = [...this.availableMissions];
            this.updateMissionProgress();
            this.renderMissions();
        } catch (error) {
            console.error('Failed to load missions:', error);
        }
    }
    
    updateMissionProgress() {
        const user = stateManager.getUser();
        if (!user) return;
        
        this.missions.forEach(mission => {
            switch (mission.id) {
                case 1: // First Steps
                    mission.progress = Math.min(user.games_played || 0, mission.maxProgress);
                    break;
                case 2: // Social Butterfly
                    mission.progress = Math.min(user.referrals_count || 0, mission.maxProgress);
                    break;
                case 3: // Wallet Connect
                    mission.progress = user.wallet_address ? 1 : 0;
                    break;
                case 4: // Win Streak
                    mission.progress = Math.min(user.current_win_streak || 0, mission.maxProgress);
                    break;
                case 5: // High Score
                    mission.progress = Math.min(user.best_score || 0, mission.maxProgress);
                    break;
            }
            
            mission.completed = mission.progress >= mission.maxProgress;
        });
    }
    
    renderMissions() {
        const missionsList = document.getElementById('missions-list');
        if (!missionsList) return;
        
        const filteredMissions = this.getFilteredMissions();
        
        missionsList.innerHTML = filteredMissions.map(mission => `
            <div class="mission-card ${mission.completed ? 'completed' : ''}" data-mission-id="${mission.id}">
                <div class="mission-header">
                    <div class="mission-info">
                        <h3>${mission.title}</h3>
                        <p>${mission.description}</p>
                    </div>
                    <div class="mission-status">
                        <span class="status-badge ${mission.completed ? 'completed' : 'available'}">${mission.completed ? 'Completed' : 'Active'}</span>
                        <span class="difficulty-badge ${mission.difficulty.toLowerCase()}">${mission.difficulty}</span>
                    </div>
                </div>
                
                <div class="mission-progress">
                    <div class="progress-header">
                        <span>Progress</span>
                        <span>${mission.progress}/${mission.maxProgress}</span>
                    </div>
                    <div class="progress-bar-mission">
                        <div class="progress-fill-mission" style="width: ${(mission.progress / mission.maxProgress) * 100}%"></div>
                    </div>
                </div>
                
                <div class="mission-rewards">
                    <div class="rewards-list">
                        ${Object.entries(mission.rewards).map(([currency, amount]) => `
                            <span class="reward-item">${this.getCurrencyIcon(currency)} ${amount} ${currency.toUpperCase()}</span>
                        `).join('')}
                    </div>
                    <div class="mission-action">
                        ${mission.completed 
                            ? '<button class="mission-btn" disabled>Completed</button>'
                            : `<button class="mission-btn" onclick="missionManager.completeMission(${mission.id})">Claim Reward</button>`
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    getFilteredMissions() {
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        
        if (activeFilter === 'all') {
            return this.missions;
        }
        
        return this.missions.filter(mission => mission.type === activeFilter);
    }
    
    getCurrencyIcon(currency) {
        const icons = {
            tsar: '💰',
            ton: '💎',
            bottle_caps: '🍺',
            stars: '⭐'
        };
        return icons[currency] || '🎁';
    }
    
    async completeMission(missionId) {
        try {
            const mission = this.missions.find(m => m.id === missionId);
            if (!mission || !mission.completed) {
                notificationManager.warning('Mission not completed yet!');
                return;
            }
            
            const user = stateManager.getUser();
            if (!user) {
                notificationManager.error('User not found');
                return;
            }
            
            const response = await apiService.completeMission(user.user_id, missionId, {
                progress: mission.progress,
                completed_at: new Date().toISOString()
            });
            
            if (response.success) {
                notificationManager.success(`Mission "${mission.title}" completed!`, {
                    title: 'Mission Complete'
                });
                
                // Show rewards
                const rewardText = Object.entries(mission.rewards)
                    .map(([currency, amount]) => `${this.getCurrencyIcon(currency)} +${amount} ${currency.toUpperCase()}`)
                    .join('\n');
                
                notificationManager.success(`Rewards received:\n${rewardText}`, {
                    title: 'Rewards',
                    duration: 6000
                });
                
                // Mark mission as claimed
                mission.claimed = true;
                
                // Refresh user data and missions
                await gameEngine.refreshUserData();
                this.loadMissions();
                
            } else {
                notificationManager.error('Failed to complete mission');
            }
            
        } catch (error) {
            console.error('Failed to complete mission:', error);
            notificationManager.error('Failed to complete mission');
        }
    }
    
    setFilter(filter) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Re-render missions
        this.renderMissions();
    }
}

// Market System
class MarketManager {
    constructor() {
        this.products = [];
        this.currentTab = 'tokens';
    }
    
    async loadProducts() {
        try {
            const response = await apiService.getShopProducts();
            if (response.success) {
                this.products = response.products;
                this.renderProducts();
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            // Use fallback products
            this.loadFallbackProducts();
        }
    }
    
    loadFallbackProducts() {
        this.products = [
            {
                id: 'tsar_pack_small',
                name: '100 TSAR Tokens',
                description: 'Small pack of TSAR tokens for RUNNER Terminal',
                price: 1,
                reward_type: 'tsar',
                category: 'tokens',
                available: true
            },
            {
                id: 'tsar_pack_medium',
                name: '1,000 TSAR Tokens',
                description: 'Medium pack with +20% bonus tokens',
                price: 5,
                reward_type: 'tsar',
                category: 'tokens',
                available: true
            },
            {
                id: 'tsar_pack_large',
                name: '10,000 TSAR Tokens',
                description: 'Large pack with +50% bonus tokens',
                price: 25,
                reward_type: 'tsar',
                category: 'tokens',
                available: true
            },
            {
                id: 'premium_nft',
                name: 'Vault-Tec Premium NFT',
                description: 'Exclusive RUNNER Terminal NFT with special bonuses',
                price: 10,
                reward_type: 'nft',
                category: 'nfts',
                available: true
            },
            {
                id: 'battle_pass',
                name: 'Wasteland Battle Pass',
                description: '30 days of premium rewards and exclusive missions',
                price: 15,
                reward_type: 'battle_pass',
                category: 'passes',
                available: true
            }
        ];
        
        this.renderProducts();
    }
    
    renderProducts() {
        const categories = ['tokens', 'nfts', 'passes', 'items'];
        
        categories.forEach(category => {
            const container = document.getElementById(`${category === 'tokens' ? 'tsar' : category.slice(0, -1)}-products`);
            if (!container) return;
            
            const categoryProducts = this.products.filter(p => p.category === category);
            
            container.innerHTML = categoryProducts.map(product => `
                <div class="product-card" data-product-id="${product.id}">
                    <div class="product-header">
                        <div class="product-info">
                            <h3>${product.name}</h3>
                            <p>${product.description}</p>
                        </div>
                        <div class="product-price">
                            <span class="price-amount">${product.price}</span>
                            <span class="price-currency">⭐ Stars</span>
                        </div>
                    </div>
                    
                    <div class="product-features">
                        <ul class="features-list">
                            ${this.getProductFeatures(product).map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <button class="purchase-btn" onclick="marketManager.purchaseProduct('${product.id}')" ${!product.available ? 'disabled' : ''}>
                        ${product.available ? 'Purchase with Stars' : 'Not Available'}
                    </button>
                </div>
            `).join('');
        });
    }
    
    getProductFeatures(product) {
        const features = {
            'tsar_pack_small': ['100 TSAR Tokens', 'Instant delivery', 'Perfect for beginners'],
            'tsar_pack_medium': ['1,200 TSAR Tokens', '+20% bonus tokens', 'Best value for regular players'],
            'tsar_pack_large': ['15,000 TSAR Tokens', '+50% bonus tokens', 'Maximum value pack'],
            'premium_nft': ['Exclusive NFT artwork', 'Special game bonuses', 'Limited edition'],
            'battle_pass': ['30 days premium access', 'Exclusive missions', 'Double XP bonus', 'Special rewards']
        };
        
        return features[product.id] || ['Special item', 'Limited availability'];
    }
    
    async purchaseProduct(productId) {
        try {
            const user = stateManager.getUser();
            if (!user) {
                notificationManager.error('Please start the bot first');
                return;
            }
            
            const product = this.products.find(p => p.id === productId);
            if (!product) {
                notificationManager.error('Product not found');
                return;
            }
            
            // Create Stars invoice
            const response = await apiService.createStarsInvoice(user.user_id, productId);
            
            if (response.success) {
                // Open invoice URL
                if (window.Telegram?.WebApp) {
                    window.Telegram.WebApp.openInvoice(response.invoice_url);
                } else {
                    // Fallback for testing
                    window.open(response.invoice_url, '_blank');
                }
                
                notificationManager.info('Redirecting to payment...', {
                    title: 'Purchase'
                });
            } else {
                notificationManager.error('Failed to create payment');
            }
            
        } catch (error) {
            console.error('Purchase failed:', error);
            notificationManager.error('Purchase failed');
        }
    }
    
    setTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });
    }
}

// UI Management
class UIManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.sideMenuOpen = false;
        this.isLoading = false;
    }
    
    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupSideMenu();
        this.setupTabs();
        this.updateUserDisplay();
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = btn.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Menu button
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.toggleSideMenu());
        }
        
        // Close modal buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = btn.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Modal overlay clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // TON Connect button
        const tonConnectBtn = document.getElementById('ton-connect-btn');
        if (tonConnectBtn) {
            tonConnectBtn.addEventListener('click', () => {
                tonConnectManager.connect();
            });
        }
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                missionManager.setFilter(filter);
            });
        });
        
        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                const parent = btn.closest('[class*="tabs"]').nextElementSibling;
                this.setActiveTab(parent, tab);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Visibility change (for pausing animations when tab is not visible)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }
    
    setupNavigation() {
        // Set initial active navigation
        this.updateNavigation(this.currentSection);
    }
    
    setupSideMenu() {
        // Create overlay if it doesn't exist
        let overlay = document.getElementById('menu-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'menu-overlay';
            overlay.className = 'menu-overlay';
            overlay.addEventListener('click', () => this.closeSideMenu());
            document.body.appendChild(overlay);
        }
    }
    
    setupTabs() {
        // Initialize all tab systems
        const tabSystems = document.querySelectorAll('[class*="tabs"]');
        tabSystems.forEach(tabSystem => {
            const firstTab = tabSystem.querySelector('.tab-btn');
            if (firstTab) {
                const tab = firstTab.dataset.tab;
                const content = tabSystem.nextElementSibling;
                this.setActiveTab(content, tab);
            }
        });
    }
    
    switchSection(section) {
        if (this.currentSection === section) return;
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
            
            // Update navigation
            this.updateNavigation(section);
            
            // Update state
            stateManager.setCurrentSection(section);
            
            // Load section-specific data
            this.loadSectionData(section);
            
            // Close side menu if open
            this.closeSideMenu();
        }
    }
    
    updateNavigation(activeSection) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === activeSection);
        });
    }
    
    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'missions':
                await missionManager.loadMissions();
                break;
            case 'market':
                await marketManager.loadProducts();
                break;
            case 'inventory':
                this.loadInventory();
                break;
            case 'leaderboard':
                this.loadLeaderboard();
                break;
        }
    }
    
    updateDashboard() {
        const user = stateManager.getUser();
        if (!user) return;
        
        // Update stats
        const elements = {
            'dash-games-played': user.games_played || 0,
            'dash-missions-completed': user.missions_completed || 0,
            'dash-total-earned': (user.total_earned || 0).toFixed(6),
            'dash-win-rate': this.calculateWinRate(user)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    calculateWinRate(user) {
        const totalGames = (user.wins || 0) + (user.losses || 0);
        if (totalGames === 0) return '0%';
        return Math.round((user.wins || 0) / totalGames * 100) + '%';
    }
    
    updateUserDisplay() {
        const user = stateManager.getUser();
        if (!user) return;
        
        // Update header stats
        const elements = {
            'user-level': user.level || 1,
            'tsar-balance': (user.tsar_balance || 0).toLocaleString(),
            'caps-balance': (user.bottle_caps || 1250).toLocaleString()
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update user info in side menu
        const userNameElement = document.getElementById('user-name');
        const userRankElement = document.getElementById('user-rank');
        const userAvatarElement = document.getElementById('user-avatar');
        
        if (userNameElement) {
            userNameElement.textContent = user.first_name || 'Unknown User';
        }
        
        if (userRankElement) {
            userRankElement.textContent = this.getUserRank(user);
        }
        
        if (userAvatarElement && window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) {
            userAvatarElement.src = window.Telegram.WebApp.initDataUnsafe.user.photo_url;
        }
    }
    
    getUserRank(user) {
        const totalEarned = user.total_earned || 0;
        
        if (totalEarned >= 1.0) return '🏆 Elite Runner';
        if (totalEarned >= 0.1) return '🥇 Pro Runner';
        if (totalEarned >= 0.01) return '🥈 Active Runner';
        return '🥉 Rookie Runner';
    }
    
    toggleSideMenu() {
        if (this.sideMenuOpen) {
            this.closeSideMenu();
        } else {
            this.openSideMenu();
        }
    }
    
    openSideMenu() {
        const sideMenu = document.getElementById('side-menu');
        const overlay = document.getElementById('menu-overlay');
        
        if (sideMenu) {
            sideMenu.classList.add('open');
            this.sideMenuOpen = true;
        }
        
        if (overlay) {
            overlay.classList.add('active');
        }
        
        document.body.style.overflow = 'hidden';
    }
    
    closeSideMenu() {
        const sideMenu = document.getElementById('side-menu');
        const overlay = document.getElementById('menu-overlay');
        
        if (sideMenu) {
            sideMenu.classList.remove('open');
            this.sideMenuOpen = false;
        }
        
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        document.body.style.overflow = '';
    }
    
    setActiveTab(container, tabId) {
        if (!container) return;
        
        // Update tab buttons
        const tabButtons = container.previousElementSibling.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Update tab content
        const tabContents = container.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
        
        // Handle market tab changes
        if (container.closest('#market-section')) {
            marketManager.setTab(tabId);
        }
    }
    
    showLoading(show = true) {
        this.isLoading = show;
        const loadingScreen = document.getElementById('loading-screen');
        
        if (loadingScreen) {
            if (show) {
                loadingScreen.classList.remove('hidden');
            } else {
                loadingScreen.classList.add('hidden');
            }
        }
    }
    
    handleKeyboardShortcuts(event) {
        // Escape key - close modals and menus
        if (event.key === 'Escape') {
            // Close any open modals
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display !== 'none') {
                    modal.style.display = 'none';
                }
            });
            
            // Close side menu
            this.closeSideMenu();
            
            // Close game
            if (gameEngine.currentGame) {
                gameEngine.closeGame();
            }
        }
        
        // Number keys for navigation (1-6)
        if (event.key >= '1' && event.key <= '6' && !event.ctrlKey && !event.altKey) {
            const sections = ['dashboard', 'games', 'missions', 'market', 'inventory', 'leaderboard'];
            const sectionIndex = parseInt(event.key) - 1;
            
            if (sections[sectionIndex]) {
                this.switchSection(sections[sectionIndex]);
            }
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animations and timers when tab is not visible
            document.body.classList.add('page-hidden');
        } else {
            // Resume when tab becomes visible
            document.body.classList.remove('page-hidden');
        }
    }
    
    loadInventory() {
        const user = stateManager.getUser();
        if (!user) return;
        
        // Load NFTs
        this.loadUserNFTs(user);
        
        // Load items
        this.loadUserItems(user);
        
        // Load achievements
        this.loadUserAchievements(user);
    }
    
    loadUserNFTs(user) {
        const nftsContainer = document.getElementById('user-nfts');
        if (!nftsContainer) return;
        
        const nfts = user.nft_inventory || [];
        
        if (nfts.length === 0) {
            nftsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>🎨 No NFTs Yet</h3>
                    <p>Purchase NFTs from the market to see them here</p>
                    <button class="action-btn" onclick="uiManager.switchSection('market')">
                        <span class="btn-icon">🛒</span>
                        <span class="btn-text">Visit Market</span>
                    </button>
                </div>
            `;
            return;
        }
        
        nftsContainer.innerHTML = nfts.map(nft => `
            <div class="inventory-item nft-item">
                <div class="item-icon">🎨</div>
                <div class="item-name">${nft.name}</div>
                <div class="item-description">${nft.description || 'Exclusive NFT'}</div>
                <div class="item-rarity legendary">Legendary</div>
                <div class="item-actions">
                    <button class="item-btn primary">View Details</button>
                </div>
            </div>
        `).join('');
    }
    
    loadUserItems(user) {
        const itemsContainer = document.getElementById('user-items');
        if (!itemsContainer) return;
        
        // For now, show placeholder items
        itemsContainer.innerHTML = `
            <div class="empty-state">
                <h3>⚔️ No Items Yet</h3>
                <p>Items will be available in future updates</p>
            </div>
        `;
    }
    
    loadUserAchievements(user) {
        const achievementsContainer = document.getElementById('user-achievements');
        if (!achievementsContainer) return;
        
        const achievements = [
            { id: 1, name: 'First Steps', description: 'Played your first game', unlocked: (user.games_played || 0) > 0 },
            { id: 2, name: 'Social Butterfly', description: 'Referred 3 friends', unlocked: (user.referrals_count || 0) >= 3 },
            { id: 3, name: 'Crypto Warrior', description: 'Connected TON wallet', unlocked: !!user.wallet_address },
            { id: 4, name: 'High Roller', description: 'Earned 1000+ TSAR', unlocked: (user.tsar_balance || 0) >= 1000 },
            { id: 5, name: 'Mission Master', description: 'Completed 10 missions', unlocked: (user.missions_completed || 0) >= 10 },
            { id: 6, name: 'Elite Gamer', description: 'Reached level 10', unlocked: (user.level || 1) >= 10 }
        ];
        
        achievementsContainer.innerHTML = achievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
                <div class="achievement-title">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-progress">
                    ${achievement.unlocked ? 'Unlocked!' : 'Keep playing to unlock'}
                </div>
            </div>
        `).join('');
    }
    
    loadLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        if (!leaderboardList) return;
        
        // Mock leaderboard data
        const leaderboardData = [
            { rank: 1, name: 'VaultDweller', earnings: 10.5, games: 145, avatar: 'assets/avatar1.png' },
            { rank: 2, name: 'WastelandWanderer', earnings: 8.3, games: 132, avatar: 'assets/avatar2.png' },
            { rank: 3, name: 'TerminalHacker', earnings: 7.1, games: 98, avatar: 'assets/avatar3.png' },
            { rank: 4, name: 'NukeCollector', earnings: 6.8, games: 87, avatar: 'assets/avatar4.png' },
            { rank: 5, name: 'RadiationKing', earnings: 5.9, games: 76, avatar: 'assets/avatar5.png' }
        ];
        
        leaderboardList.innerHTML = leaderboardData.map(player => `
            <div class="leaderboard-item ${player.rank <= 3 ? `top-${player.rank}` : ''}">
                <div class="rank-number ${player.rank <= 3 ? `top-${player.rank}` : ''}">${player.rank}</div>
                <img class="user-avatar" src="${player.avatar}" alt="${player.name}" onerror="this.src='assets/default-avatar.png'">
                <div class="user-info">
                    <div class="user-name">${player.name}</div>
                    <div class="user-stats-mini">
                        <span>Games: ${player.games}</span>
                    </div>
                </div>
                <div class="stat-value-lb">${player.earnings} TON</div>
            </div>
        `).join('');
    }
}

// PWA Support
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
    }
    
    init() {
        // Check if already installed
        this.checkInstallStatus();
        
        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });
        
        // Listen for app installed
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallPrompt();
            notificationManager.success('RUNNER Terminal installed successfully!', {
                title: 'App Installed'
            });
        });
    }
    
    checkInstallStatus() {
        // Check if running as PWA
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            this.isInstalled = true;
        }
    }
    
    showInstallPrompt() {
        if (this.isInstalled) return;
        
        const prompt = document.getElementById('pwa-prompt');
        if (prompt) {
            prompt.classList.remove('hidden');
            
            // Set up buttons
            const installBtn = document.getElementById('pwa-install');
            const dismissBtn = document.getElementById('pwa-dismiss');
            
            if (installBtn) {
                installBtn.onclick = () => this.installApp();
            }
            
            if (dismissBtn) {
                dismissBtn.onclick = () => this.hideInstallPrompt();
            }
        }
    }
    
    hideInstallPrompt() {
        const prompt = document.getElementById('pwa-prompt');
        if (prompt) {
            prompt.classList.add('hidden');
        }
    }
    
    async installApp() {
        if (!this.deferredPrompt) return;
        
        try {
            this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            
            if (result.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            
            this.deferredPrompt = null;
            this.hideInstallPrompt();
            
        } catch (error) {
            console.error('Failed to install app:', error);
        }
    }
}

// Global instances
let stateManager;
let apiService;
let notificationManager;
let tonConnectManager;
let gameEngine;
let missionManager;
let marketManager;
let uiManager;
let pwaManager;

// Global functions for HTML onclick handlers
window.switchSection = (section) => uiManager.switchSection(section);
window.startGame = (gameId) => gameEngine.startGame(gameId);
window.closeGame = () => gameEngine.closeGame();
window.openTONConnect = () => tonConnectManager.connect();
window.closeSideMenu = () => uiManager.closeSideMenu();
window.showProfile = () => notificationManager.info('Profile feature coming soon!');
window.showSettings = () => notificationManager.info('Settings feature coming soon!');
window.showHelp = () => notificationManager.info('Help feature coming soon!');
window.showAbout = () => notificationManager.info('RUNNER Terminal v3.0 - Post-apocalyptic blockchain gaming platform');

// Boot sequence
async function bootSystem() {
    try {
        console.log('🚀 Booting RUNNER Terminal...');
        
        // Show boot messages
        const bootMessages = [
            'Initializing quantum processors...',
            'Loading fusion protocols...',
            'Establishing wasteland connection...',
            'Calibrating crypto miners...',
            'Activating terminal interface...',
            'Loading user data...',
            'Connecting to blockchain...',
            'Systems ready!'
        ];
        
        const bootTextElement = document.getElementById('boot-text');
        const progressElement = document.getElementById('boot-progress');
        
        for (let i = 0; i < bootMessages.length; i++) {
            if (bootTextElement) {
                bootTextElement.textContent = bootMessages[i];
            }
            
            if (progressElement) {
                progressElement.style.width = `${((i + 1) / bootMessages.length) * 100}%`;
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Initialize all systems
        await initializeSystem();
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loadingScreen && app) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                app.classList.remove('hidden');
            }, 500);
        }
        
        console.log('✅ RUNNER Terminal ready!');
        
    } catch (error) {
        console.error('❌ Boot failed:', error);
        notificationManager?.error('Failed to initialize RUNNER Terminal');
    }
}

async function initializeSystem() {
    // Initialize managers
    stateManager = new StateManager();
    apiService = new APIService();
    notificationManager = new NotificationManager();
    tonConnectManager = new TONConnectManager();
    gameEngine = new GameEngine();
    missionManager = new MissionManager();
    marketManager = new MarketManager();
    uiManager = new UIManager();
    pwaManager = new PWAManager();
    
    // Initialize components
    notificationManager.init();
    await tonConnectManager.init();
    gameEngine.init();
    uiManager.init();
    pwaManager.init();
    
    // Load initial data
    await loadInitialData();
    
    // Set up state listeners
    setupStateListeners();
    
    console.log('🔧 All systems initialized');
}

async function loadInitialData() {
    try {
        // Check API health
        try {
            const health = await apiService.healthCheck();
            console.log('✅ API connected:', health);
        } catch (error) {
            console.warn('⚠️ API not available, using offline mode');
        }
        
        // Load user data from Telegram
        if (window.Telegram?.WebApp) {
            const webApp = window.Telegram.WebApp;
            webApp.ready();
            
            const user = webApp.initDataUnsafe?.user;
            if (user) {
                try {
                    const response = await apiService.getUser(user.id);
                    if (response.success) {
                        stateManager.setUser(response.data);
                    } else {
                        // Create new user
                        const newUser = {
                            user_id: user.id,
                            username: user.username,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            ton_balance: 0,
                            tsar_balance: 0,
                            bottle_caps: 1250,
                            level: 1,
                            games_played: 0,
                            missions_completed: 0
                        };
                        stateManager.setUser(newUser);
                    }
                } catch (error) {
                    console.error('Failed to load user data:', error);
                    // Use fallback user data
                    stateManager.setUser({
                        user_id: user.id,
                        first_name: user.first_name || 'Anonymous',
                        bottle_caps: 1250,
                        level: 1
                    });
                }
            }
        } else {
            // Development mode - use test user
            stateManager.setUser({
                user_id: 12345,
                first_name: 'Test User',
                bottle_caps: 1250,
                tsar_balance: 100,
                level: 3,
                games_played: 5,
                wins: 3,
                losses: 2
            });
        }
        
        // Update UI
        uiManager.updateUserDisplay();
        
    } catch (error) {
        console.error('Failed to load initial data:', error);
    }
}

function setupStateListeners() {
    // Listen for state changes
    stateManager.subscribe('userChanged', (user) => {
        uiManager.updateUserDisplay();
        missionManager.updateMissionProgress();
    });
    
    stateManager.subscribe('walletChanged', (wallet) => {
        tonConnectManager.updateWalletUI();
    });
    
    stateManager.subscribe('sectionChanged', (section) => {
        uiManager.loadSectionData(section);
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSystem);
} else {
    bootSystem();
}

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (notificationManager) {
        notificationManager.error('An unexpected error occurred');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (notificationManager) {
        notificationManager.error('Failed to complete operation');
    }
});

// Export for debugging
if (typeof window !== 'undefined') {
    window.RUNNER = {
        stateManager,
        apiService,
        notificationManager,
        tonConnectManager,
        gameEngine,
        missionManager,
        marketManager,
        uiManager,
        pwaManager,
        CONFIG
    };
}

console.log('📱 RUNNER Terminal v3.0 loaded successfully');