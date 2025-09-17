// RUNNER TERMINAL - Simple Working Version v2.1
let userData = null;
let menuOpen = false;
let gameActive = false;
let isMultiplayer = false;
let correctPassword = '';
let attemptsLeft = 4;
let currentStake = { amount: 0, currency: 'TON' };
let selectedCurrency = 'TON';
let gameScore = 0;
let messageType = 'public';
let soundEnabled = true;
let playerTurn = true;
let referralCode = '';

// Простые системы
let audioManager;
let wastelandRadio;
let runnerSystem;
let referralSystem;
let blockchainManager;
let marketplace;
let terminalGame;
let shmupGameManager;

// Простая звуковая система БЕЗ мелодии
class SimpleAudioManager {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.masterVolume = 0.05;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }
            this.initialized = true;
            console.log("Audio initialized");
        } catch (error) {
            console.log("Audio failed:", error);
            this.enabled = false;
        }
    }

    beep() {
        if (!this.enabled || !this.initialized || !this.context || !soundEnabled) return;
        
        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.type = 'sine';
            osc.frequency.value = 800;
            
            gain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.1);
        } catch (e) {}
    }

    playGameSound(type) {
        if (!this.enabled || !this.initialized || !this.context || !soundEnabled) return;
        
        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            switch(type) {
                case 'correct': osc.frequency.value = 600; break;
                case 'incorrect': osc.frequency.value = 200; break;
                case 'shoot': osc.frequency.value = 1000; break;
                case 'hit': osc.frequency.value = 150; break;
                default: osc.frequency.value = 400;
            }
            
            gain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.1);
        } catch (e) {}
    }
}

// Простая радио система
class SimpleRadio {
    constructor() {
        this.messages = this.loadMessages();
        this.nextId = this.messages.length > 0 ? Math.max(...this.messages.map(m => m.id)) + 1 : 1;
    }

    loadMessages() {
        try {
            const saved = localStorage.getItem('wasteland_radio_messages');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {}
        
        return [
            {
                id: 1,
                author: 'VAULT_DWELLER_101',
                text: 'Anyone found any good loot in the northern sectors?',
                time: '12:34',
                type: 'public'
            },
            {
                id: 2,
                author: 'ANONYMOUS',
                text: 'Radiation storm incoming from the east. Take shelter.',
                time: '12:45',
                type: 'anonymous'
            },
            {
                id: 3,
                author: 'TRADER_MIKE',
                text: '[SPONSORED] Premium weapons available at Diamond City!',
                time: '13:15',
                type: 'sponsored'
            }
        ];
    }

    saveMessages() {
        try {
            localStorage.setItem('wasteland_radio_messages', JSON.stringify(this.messages));
        } catch (e) {}
    }

    addMessage(text, author, type = 'public') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const message = {
            id: this.nextId++,
            author: type === 'anonymous' ? 'ANONYMOUS_USER' : author,
            text: text.substring(0, 200),
            time: timeStr,
            type: type,
            timestamp: Date.now()
        };
        
        this.messages.unshift(message);
        
        if (this.messages.length > 50) {
            this.messages = this.messages.slice(0, 50);
        }
        
        this.saveMessages();
        return message;
    }

    getMessages() {
        return this.messages;
    }
}

// Простая RUNNER система
class SimpleRunnerSystem {
    constructor() {
        this.missions = [
            {
                id: 1,
                title: 'Join Telegram Channel',
                description: 'Subscribe to @blockchain_news and stay for 24h',
                reward: { amount: 0.01, currency: 'TON' },
                type: 'telegram',
                advertiser: 'CRYPTO_NEWS_HUB',
                requirements: { minTsar: 100 },
                status: 'available'
            },
            {
                id: 2,
                title: 'Like and Share Post',
                description: 'Like post and share to your story',
                reward: { amount: 50, currency: 'TSAR' },
                type: 'social',
                advertiser: 'DEFI_PROJECT',
                requirements: { minTsar: 500 },
                status: 'available'
            },
            {
                id: 3,
                title: 'Complete KYC Verification',
                description: 'Complete KYC and make first trade',
                reward: { amount: 0.05, currency: 'TON' },
                type: 'trading',
                advertiser: 'DEX_EXCHANGE',
                requirements: { minTsar: 1000 },
                status: 'available'
            },
            {
                id: 4,
                title: 'Play and Review Game',
                description: 'Play game for 30 min and leave review',
                reward: { amount: 25, currency: 'STARS' },
                type: 'gaming',
                advertiser: 'GAME_STUDIO_X',
                requirements: { minTsar: 200 },
                status: 'available'
            },
            {
                id: 5,
                title: 'Follow and Retweet',
                description: 'Follow @crypto_project and retweet pinned',
                reward: { amount: 100, currency: 'TSAR' },
                type: 'social',
                advertiser: 'CRYPTO_STARTUP',
                requirements: { minTsar: 300 },
                status: 'available'
            }
        ];
        this.userMissions = this.loadUserMissions();
    }

    loadUserMissions() {
        try {
            const saved = localStorage.getItem('user_missions');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveUserMissions() {
        try {
            localStorage.setItem('user_missions', JSON.stringify(this.userMissions));
        } catch (e) {}
    }

    getAvailableMissions(filter = 'all') {
        let filtered = this.missions.filter(mission => {
            const userHasTsar = userData && userData.tsarBalance >= mission.requirements.minTsar;
            const notCompleted = !this.userMissions.find(um => um.id === mission.id && um.status === 'completed');
            return userHasTsar && notCompleted && mission.status === 'available';
        });

        if (filter !== 'all') {
            filtered = filtered.filter(mission => mission.type === filter);
        }

        return filtered;
    }

    startMission(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission) return { success: false, error: 'Mission not found' };

        if (!userData || userData.tsarBalance < mission.requirements.minTsar) {
            return { success: false, error: 'Insufficient TSAR tokens' };
        }

        const userMission = {
            id: missionId,
            status: 'in_progress',
            startedAt: Date.now(),
            reward: mission.reward
        };

        this.userMissions.push(userMission);
        this.saveUserMissions();

        return { success: true, mission: userMission };
    }

    completeMission(missionId) {
        const userMission = this.userMissions.find(m => m.id === missionId && m.status === 'in_progress');
        if (!userMission) return { success: false, error: 'Mission not active' };

        userMission.status = 'completed';
        userMission.completedAt = Date.now();

        const reward = userMission.reward;
        if (userData) {
            if (reward.currency === 'TON') {
                userData.tonBalance += reward.amount;
            } else if (reward.currency === 'TSAR') {
                userData.tsarBalance += reward.amount;
            } else if (reward.currency === 'STARS') {
                userData.starsBalance += reward.amount;
            }
        }

        this.saveUserMissions();
        return { success: true, reward: reward };
    }

    getCompletedMissionsCount() {
        return this.userMissions.filter(m => m.status === 'completed').length;
    }
}

// Простая реферальная система
class SimpleReferralSystem {
    constructor() {
        this.referrals = [];
        this.earnings = { total: 0, level1: 0, level2: 0, level3: 0 };
    }

    generateReferralCode() {
        if (!userData) return 'REF_UNKNOWN';
        return `REF_${userData.name}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    processEarning(amount, currency) {
        // Простая симуляция реферальных
        if (userData) {
            const referralBonus = amount * 0.1;
            if (currency === 'TON') {
                userData.tonBalance += referralBonus;
            } else if (currency === 'TSAR') {
                userData.tsarBalance += referralBonus;
            }
        }
    }
}

// Простой блокчейн менеджер
class SimpleBlockchainManager {
    constructor() {
        this.connected = false;
        this.userWallet = null;
    }

    async connectWallet() {
        try {
            this.connected = true;
            this.userWallet = {
                account: {
                    address: 'EQD' + Math.random().toString(36).substr(2, 40)
                }
            };
            
            this.updateWalletUI();
            alert('[SUCCESS] Wallet connected!\nAddress: ' + this.userWallet.account.address.substr(0, 15) + '...');
        } catch (error) {
            alert('[ERROR] Failed to connect wallet');
        }
    }

    updateWalletUI() {
        const statusElement = document.getElementById('wallet-status');
        const connectBtn = document.getElementById('connect-wallet');
        
        if (statusElement && connectBtn) {
            const statusText = statusElement.querySelector('.status-text');
            if (statusText) {
                if (this.connected) {
                    statusText.textContent = 'WALLET: CONNECTED';
                    connectBtn.textContent = 'DISCONNECT WALLET';
                    connectBtn.style.borderColor = 'var(--combat-active)';
                    connectBtn.style.color = 'var(--combat-active)';
                } else {
                    statusText.textContent = 'WALLET: DISCONNECTED';
                    connectBtn.textContent = 'CONNECT TON WALLET';
                    connectBtn.style.borderColor = 'var(--pipboy-yellow)';
                    connectBtn.style.color = 'var(--pipboy-yellow)';
                }
            }
        }

        const tradingPanel = document.getElementById('trading-panel');
        const connectPanel = document.getElementById('wallet-connect-panel');
        
        if (tradingPanel && connectPanel) {
            if (this.connected) {
                tradingPanel.style.display = 'block';
                connectPanel.style.display = 'none';
            } else {
                tradingPanel.style.display = 'none';
                connectPanel.style.display = 'block';
            }
        }
    }

    async processTokenListing(tokenData) {
        const requiredTsar = 50000;

        if (!userData || userData.tsarBalance < requiredTsar) {
            return { 
                success: false, 
                error: `Insufficient TSAR tokens. Required: ${requiredTsar.toLocaleString()} TSAR` 
            };
        }

        try {
            userData.tsarBalance -= requiredTsar;
            
            const listedToken = {
                id: Date.now(),
                symbol: tokenData.symbol,
                name: tokenData.name,
                contractAddress: tokenData.contractAddress,
                listedBy: userData.name,
                listedAt: Date.now(),
                burnTxHash: '0x' + Math.random().toString(36).substr(2, 64)
            };

            return { success: true, token: listedToken };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Простая система рынка
class SimpleMarketplace {
    constructor() {
        this.listings = [
            {
                id: 1,
                title: 'Rare Terminal Skin',
                description: 'Unique blue-glow terminal theme',
                price: 100,
                currency: 'TSAR',
                seller: 'TECH_TRADER_99',
                type: 'cosmetic'
            },
            {
                id: 2,
                title: 'Gaming Guide',
                description: 'Advanced hacking techniques',
                price: 50,
                currency: 'TSAR',
                seller: 'HACKER_ELITE',
                type: 'guide'
            },
            {
                id: 3,
                title: 'Premium Access Pass',
                description: 'Access to exclusive tournaments',
                price: 0.1,
                currency: 'TON',
                seller: 'TOURNAMENT_HOST',
                type: 'access'
            }
        ];
        this.nextId = 10;
    }

    createListing(listingData) {
        const listing = {
            id: this.nextId++,
            title: listingData.title,
            description: listingData.description,
            price: listingData.price,
            currency: listingData.currency,
            seller: userData ? userData.name : 'UNKNOWN',
            type: listingData.type || 'general',
            createdAt: Date.now()
        };

        this.listings.unshift(listing);
        return { success: true, listing: listing };
    }

    getAllListings() {
        return this.listings;
    }
}

// Простая игра терминала
class SimpleTerminalGame {
    constructor() {
        this.wordLists = {
            5: ['ABOUT', 'ABOVE', 'AGENT', 'ALARM', 'ALONE', 'ANGER', 'ARMOR', 'BLADE', 'BRAVE', 'BREAK'],
            7: ['ABILITY', 'ANCIENT', 'ARCHIVE', 'BALANCE', 'BATTERY', 'BENEFIT', 'BICYCLE', 'CAPTAIN', 'CHAMBER', 'CIRCUIT']
        };
        this.currentWords = [];
        this.correctWord = '';
        this.attemptsLeft = 4;
        this.gameActive = false;
        this.isMultiplayer = false;
        this.playerTurn = true;
        this.opponentAttempts = 4;
    }

    startGame(mode = 'solo') {
        this.isMultiplayer = mode === 'multiplayer';
        this.attemptsLeft = 4;
        this.opponentAttempts = 4;
        this.playerTurn = true;
        this.gameActive = true;

        this.generateWords();
        this.generateHexDump();
        this.updateGameUI();

        if (this.isMultiplayer) {
            this.startMultiplayerMode();
        }
    }

    generateWords() {
        const wordPool = [...this.wordLists[7]];
        this.currentWords = [];

        for (let i = 0; i < 12 && wordPool.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * wordPool.length);
            this.currentWords.push(wordPool.splice(randomIndex, 1)[0]);
        }

        this.correctWord = this.currentWords[Math.floor(Math.random() * this.currentWords.length)];
        console.log('Correct password:', this.correctWord);
    }

    generateHexDump() {
        const hexDump = document.getElementById('hex-dump');
        if (!hexDump) return;

        const chars = '0123456789ABCDEF';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let html = '';

        for (let line = 0; line < 20; line++) {
            const address = (0xF000 + line * 16).toString(16).toUpperCase();
            let hexLine = `0x${address} `;
            
            for (let i = 0; i < 16; i++) {
                hexLine += chars[Math.floor(Math.random() * chars.length)];
                if (i % 2 === 1) hexLine += ' ';
            }
            
            let dataLine = '';
            for (let i = 0; i < 12; i++) {
                if (Math.random() < 0.3 && this.currentWords.length > 0) {
                    const word = this.currentWords.shift();
                    dataLine += `<span class="password-word" data-word="${word}">${word}</span>`;
                    i += word.length - 1;
                } else {
                    if (Math.random() < 0.1) {
                        dataLine += '<span class="bracket-hint">[]</span>';
                        i++;
                    } else {
                        dataLine += symbols[Math.floor(Math.random() * symbols.length)];
                    }
                }
            }
            
            html += `<div class="hex-line">
                <span class="hex-address">${hexLine}</span> 
                <span class="hex-ascii">${dataLine}</span>
            </div>`;
        }

        hexDump.innerHTML = html;
        this.attachHandlers();
    }

    attachHandlers() {
        document.querySelectorAll('.password-word').forEach(word => {
            word.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameActive && (!this.isMultiplayer || this.playerTurn)) {
                    const selectedWord = word.getAttribute('data-word');
                    this.selectPassword(selectedWord);
                }
            });
        });

        document.querySelectorAll('.bracket-hint').forEach(bracket => {
            bracket.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameActive && (!this.isMultiplayer || this.playerTurn)) {
                    this.useBracketHint(bracket);
                }
            });
        });
    }

    selectPassword(word) {
        document.querySelectorAll('.password-word').forEach(w => {
            w.classList.remove('selected');
        });
        
        const selectedElement = document.querySelector(`[data-word="${word}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
        }

        this.addLogEntry(`> ${word}`);
        this.addLogEntry('> Checking...');

        setTimeout(() => {
            if (word === this.correctWord) {
                this.handleCorrectPassword(word);
            } else {
                this.handleIncorrectPassword(word);
            }
        }, 800);
    }

    handleCorrectPassword(word) {
        const wordElement = document.querySelector(`[data-word="${word}"]`);
        if (wordElement) {
            wordElement.classList.add('correct');
        }
        
        this.addLogEntry('> Exact match!', 'success');
        this.addLogEntry('> Access granted!', 'success');
        
        if (audioManager) {
            audioManager.playGameSound('correct');
        }
        
        setTimeout(() => {
            this.endGame(true);
        }, 2000);
    }

    handleIncorrectPassword(word) {
        const wordElement = document.querySelector(`[data-word="${word}"]`);
        if (wordElement) {
            wordElement.classList.add('incorrect');
        }
        
        const likeness = this.calculateLikeness(word, this.correctWord);
        this.addLogEntry(`> Entry denied`, 'error');
        this.addLogEntry(`> Likeness=${likeness}`, 'error');
        
        this.attemptsLeft--;
        this.updateAttemptsDisplay();
        
        if (audioManager) {
            audioManager.playGameSound('incorrect');
        }

        if (this.attemptsLeft <= 0) {
            this.addLogEntry('> Terminal locked', 'error');
            this.endGame(false);
        } else if (this.isMultiplayer) {
            this.playerTurn = false;
            this.simulateOpponentTurn();
        }
    }

    calculateLikeness(word1, word2) {
        let matches = 0;
        for (let i = 0; i < Math.min(word1.length, word2.length); i++) {
            if (word1[i] === word2[i]) {
                matches++;
            }
        }
        return matches;
    }

    useBracketHint(bracketElement) {
        if (bracketElement.classList.contains('used')) return;

        bracketElement.classList.add('used');
        bracketElement.style.color = '#666666';
        
        this.removeDudPassword();
        this.addLogEntry('> Dud removed', 'system');

        if (audioManager) {
            audioManager.playGameSound('correct');
        }
    }

    removeDudPassword() {
        const availableWords = document.querySelectorAll('.password-word:not(.incorrect):not(.correct):not(.removed)');
        const duds = Array.from(availableWords).filter(word => 
            word.getAttribute('data-word') !== this.correctWord
        );

        if (duds.length > 0) {
            const randomDud = duds[Math.floor(Math.random() * duds.length)];
            randomDud.classList.add('removed');
            randomDud.style.textDecoration = 'line-through';
            randomDud.style.opacity = '0.3';
            randomDud.style.pointerEvents = 'none';
        }
    }

    simulateOpponentTurn() {
        if (!this.isMultiplayer || this.playerTurn) return;

        setTimeout(() => {
            const availableWords = this.currentWords.filter(word => 
                word !== this.correctWord &&
                !document.querySelector(`[data-word="${word}"]`)?.classList.contains('incorrect')
            );
            
            if (availableWords.length === 0) return;

            const opponentChoice = availableWords[Math.floor(Math.random() * availableWords.length)];
            this.addLogEntry(`> Opponent: ${opponentChoice}`, 'opponent');

            setTimeout(() => {
                if (opponentChoice === this.correctWord) {
                    this.addLogEntry('> Opponent access granted!', 'error');
                    this.endGame(false);
                } else {
                    const likeness = this.calculateLikeness(opponentChoice, this.correctWord);
                    this.addLogEntry(`> Opponent denied - Likeness=${likeness}`, 'opponent');
                    
                    this.opponentAttempts--;
                    this.updateOpponentDisplay();

                    if (this.opponentAttempts <= 0) {
                        this.addLogEntry('> Opponent locked out', 'success');
                        this.endGame(true);
                    } else {
                        this.playerTurn = true;
                    }
                }
            }, 1200);
        }, 3000);
    }

    addLogEntry(text, type = 'normal') {
        const log = document.getElementById('terminal-log');
        if (!log) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = text;
        
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;

        if (log.children.length > 15) {
            log.removeChild(log.children[0]);
        }
    }

    updateAttemptsDisplay() {
        const attemptsDisplay = document.getElementById('attempts-display');
        if (attemptsDisplay) {
            attemptsDisplay.textContent = this.attemptsLeft;
        }

        const playerAttempts = document.getElementById('player-attempts');
        if (playerAttempts) {
            let display = '';
            for (let i = 0; i < 4; i++) {
                display += i < this.attemptsLeft ? '[█]' : '[X]';
            }
            playerAttempts.textContent = display;
        }
    }

    updateOpponentDisplay() {
        const opponentAttempts = document.getElementById('opponent-attempts');
        if (opponentAttempts) {
            let display = '';
            for (let i = 0; i < 4; i++) {
                display += i < this.opponentAttempts ? '[█]' : '[X]';
            }
            opponentAttempts.textContent = display;
        }
    }

    updateGameUI() {
        const modeBadge = document.getElementById('mode-badge');
        const opponentSide = document.getElementById('opponent-side');
        const stakeInfo = document.getElementById('stake-info');

        if (modeBadge) {
            modeBadge.textContent = this.isMultiplayer ? 'VERSUS' : 'SOLO';
        }

        if (opponentSide) {
            opponentSide.style.display = this.isMultiplayer ? 'block' : 'none';
        }

        if (stakeInfo && currentStake) {
            stakeInfo.style.display = this.isMultiplayer ? 'block' : 'none';
            if (this.isMultiplayer) {
                stakeInfo.textContent = `${currentStake.amount} ${currentStake.currency}`;
            }
        }

        this.updateAttemptsDisplay();
        if (this.isMultiplayer) {
            this.updateOpponentDisplay();
        }
    }

    startMultiplayerMode() {
        this.addLogEntry('> Connecting to opponent...', 'system');
        
        setTimeout(() => {
            this.addLogEntry('> Opponent connected', 'system');
            this.addLogEntry('> Match started!', 'system');
        }, 2000);
    }

    endGame(won) {
        this.gameActive = false;
        
        if (!userData) return;
        
        const baseReward = this.isMultiplayer ? 100 : 50;
        const totalReward = won ? baseReward : Math.floor(baseReward * 0.3);
        
        userData.bottleCaps += totalReward;
        
        if (this.isMultiplayer && won && currentStake) {
            const winnings = currentStake.amount * 1.8;
            if (currentStake.currency === 'TON') {
                userData.tonBalance += winnings;
            } else if (currentStake.currency === 'TSAR') {
                userData.tsarBalance += winnings;
            }
        }

        updateUserInfo();

        setTimeout(() => {
            let resultMessage = won ? 
                `[ACCESS GRANTED!]\nTerminal unlocked!\n+${totalReward} Bottle Caps` : 
                `[ACCESS DENIED!]\nTerminal locked!\n+${totalReward} Bottle Caps`;
            
            if (this.isMultiplayer && won && currentStake) {
                const winnings = currentStake.amount * 1.8;
                resultMessage += `\n+${winnings} ${currentStake.currency}`;
            }
            
            alert(resultMessage);
            this.resetGame();
            showModeSelector();
        }, 1500);
    }

    resetGame() {
        this.gameActive = false;
        this.currentWords = [];
        this.correctWord = '';
        this.attemptsLeft = 4;
        this.opponentAttempts = 4;
        this.playerTurn = true;
        
        const hexDump = document.getElementById('hex-dump');
        const terminalLog = document.getElementById('terminal-log');
        
        if (hexDump) hexDump.innerHTML = '';
        if (terminalLog) {
            terminalLog.innerHTML = '<div class="log-entry system">RUNNER Terminal initialized</div>';
        }
    }
}

// Простая игра Shmup
class SimpleShmupGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameActive = false;
        this.player = { x: 150, y: 350, width: 20, height: 20, lives: 3 };
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.gameLoop = null;
        this.enemySpawner = null;
        this.isMultiplayer = false;
        this.opponentScore = 0;
    }

    init() {
        this.canvas = document.getElementById('shmup-canvas');
        if (!this.canvas) return false;
        
        this.ctx = this.canvas.getContext('2d');
        console.log("Shmup initialized");
        return true;
    }

    startGame(mode = 'solo') {
        if (!this.init()) {
            alert('[ERROR] Failed to initialize game');
            return;
        }

        this.isMultiplayer = mode === 'multiplayer';
        this.gameActive = true;
        this.score = 0;
        this.player = { x: 150, y: 350, width: 20, height: 20, lives: 3 };
        this.enemies = [];
        this.bullets = [];

        this.updateShmupUI();
        
        this.gameLoop = setInterval(() => this.update(), 1000/60);
        this.enemySpawner = setInterval(() => this.spawnEnemy(), 1000);

        if (this.isMultiplayer) {
            this.startMultiplayerShmup();
        }
    }

    update() {
        if (!this.gameActive || !this.ctx) return;

        this.clearCanvas();
        this.updateBullets();
        this.updateEnemies();
        this.checkCollisions();
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawUI();
    }

    clearCanvas() {
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Простые звезды
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 30; i++) {
            const x = (i * 7) % this.canvas.width;
            const y = (i * 11 + Date.now() * 0.05) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }

    drawPlayer() {
        this.ctx.fillStyle = '#00b000';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }

    drawBullets() {
        this.ctx.fillStyle = '#ffcc00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, 3, 8);
        });
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = '#cc5500';
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
    }

    drawUI() {
        this.ctx.fillStyle = '#00b000';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`SCORE: ${this.score}`, 10, 20);
        this.ctx.fillText(`LIVES: ${this.player.lives}`, 10, 35);

        if (this.isMultiplayer) {
            this.ctx.fillText(`OPPONENT: ${this.opponentScore}`, 180, 20);
        }
    }

    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= 8;
            return bullet.y > 0;
        });
    }

    updateEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            enemy.y += enemy.speed;
            return enemy.y < this.canvas.height;
        });
    }

    spawnEnemy() {
        if (!this.gameActive) return;

        const enemy = {
            x: Math.random() * (this.canvas.width - 20),
            y: 0,
            width: 20,
            height: 20,
            speed: 2 + Math.random(),
            health: 1
        };

        this.enemies.push(enemy);
    }

    shoot() {
        if (!this.gameActive) return;

        const bullet = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y,
            width: 3,
            height: 8
        };

        this.bullets.push(bullet);
        
        if (audioManager) {
            audioManager.playGameSound('shoot');
        }
    }

    movePlayer(direction) {
        if (!this.gameActive) return;

        const speed = 5;
        switch(direction) {
            case 'left':
                this.player.x = Math.max(0, this.player.x - speed);
                break;
            case 'right':
                this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + speed);
                break;
            case 'up':
                this.player.y = Math.max(0, this.player.y - speed);
                break;
            case 'down':
                this.player.y = Math.min(this.canvas.height - this.player.height, this.player.y + speed);
                break;
        }
    }

    checkCollisions() {
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += 10;
                    
                    if (audioManager) {
                        audioManager.playGameSound('hit');
                    }
                }
            });
        });

        this.enemies.forEach((enemy, enemyIndex) => {
            if (this.isColliding(this.player, enemy)) {
                this.enemies.splice(enemyIndex, 1);
                this.player.lives--;
                
                if (audioManager) {
                    audioManager.playGameSound('hit');
                }

                if (this.player.lives <= 0) {
                    this.endShmupGame();
                }
            }
        });

        this.updateShmupUI();
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    updateShmupUI() {
        const scoreElement = document.getElementById('shmup-score');
        const livesElement = document.getElementById('shmup-lives');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (livesElement) livesElement.textContent = this.player.lives;
    }

    startMultiplayerShmup() {
        const opponentSimulator = setInterval(() => {
            if (this.gameActive && this.isMultiplayer) {
                this.opponentScore += Math.floor(Math.random() * 20);
            } else {
                clearInterval(opponentSimulator);
            }
        }, 2000);
    }

    endShmupGame() {
        this.gameActive = false;
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.enemySpawner) clearInterval(this.enemySpawner);

        if (!userData) return;

        const reward = Math.floor(this.score / 10);
        userData.bottleCaps += reward;

        let resultMessage = `[GAME OVER!]\nScore: ${this.score}\n+${reward} Bottle Caps`;

        if (this.isMultiplayer) {
            const won = this.score > this.opponentScore;
            resultMessage += `\nOpponent: ${this.opponentScore}\n${won ? 'VICTORY!' : 'DEFEAT'}`;
            
            if (won && currentStake) {
                const winnings = currentStake.amount * 1.8;
                if (currentStake.currency === 'TON') {
                    userData.tonBalance += winnings;
                } else if (currentStake.currency === 'TSAR') {
                    userData.tsarBalance += winnings;
                }
                resultMessage += `\n+${winnings} ${currentStake.currency}`;
            }
        }

        updateUserInfo();

        setTimeout(() => {
            alert(resultMessage);
            this.resetShmupGame();
        }, 1000);
    }

    resetShmupGame() {
        this.gameActive = false;
        this.score = 0;
        this.opponentScore = 0;
        this.player.lives = 3;
        this.enemies = [];
        this.bullets = [];
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.enemySpawner) clearInterval(this.enemySpawner);
        
        this.updateShmupUI();
        
        hideAllScreens();
        document.getElementById('main-screen').classList.add('active');
        showSection('gameboy');
    }
}

// Инициализация (ПРОСТАЯ)
let initStarted = false;

function initApp() {
    if (initStarted) return;
    initStarted = true;
    
    console.log("🚀 Initializing simple RUNNER terminal...");
    
    audioManager = new SimpleAudioManager();
    wastelandRadio = new SimpleRadio();
    runnerSystem = new SimpleRunnerSystem();
    referralSystem = new SimpleReferralSystem();
    blockchainManager = new SimpleBlockchainManager();
    marketplace = new SimpleMarketplace();
    terminalGame = new SimpleTerminalGame();
    shmupGameManager = new SimpleShmupGame();
    
    loadUserData();
    generateReferralCode();
    setupAllEventHandlers();
    loadRadioMessages();
    loadMarketListings();
    loadRunnerMissions();
    
    showWelcomeScreen();
    
    console.log("✅ Simple RUNNER terminal ready");
}

function loadUserData() {
    try {
        const saved = localStorage.getItem('runner_user_data');
        if (saved) {
            userData = JSON.parse(saved);
        }
    } catch (e) {}
    
    if (!userData) {
        userData = {
            name: "RUNNER_PLAYER",
            tonBalance: 0.542,
            tsarBalance: 1250,
            starsBalance: 45,
            bottleCaps: 1250,
            level: 15,
            wins: 23,
            losses: 7,
            clan: null,
            missionsCompleted: 0,
            totalEarned: 0,
            referralEarnings: 0,
            referrals: 0
        };
        saveUserData();
    }
    
    updateUserInfo();
}

function saveUserData() {
    if (!userData) return;
    
    try {
        localStorage.setItem('runner_user_data', JSON.stringify(userData));
    } catch (e) {}
}

function generateReferralCode() {
    if (!referralSystem) return;
    
    referralCode = referralSystem.generateReferralCode();
    const referralLink = document.getElementById('referral-link');
    if (referralLink) {
        referralLink.textContent = `https://t.me/runner_bot?start=${referralCode}`;
    }
}

function updateUserInfo() {
    if (!userData) return;

    const elements = {
        'player-level': userData.level,
        'caps-value': userData.bottleCaps,
        'ton-stat': userData.tonBalance.toFixed(3) + ' TON',
        'tsar-stat': userData.tsarBalance.toLocaleString() + ' TSAR',
        'referral-count': userData.referrals,
        'clan-status': userData.clan || 'NO CLAN',
        'ton-balance': userData.tonBalance.toFixed(3),
        'tsar-balance': userData.tsarBalance.toLocaleString(),
        'stars-balance': userData.starsBalance
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    if (runnerSystem) {
        const completedElement = document.getElementById('completed-missions');
        const totalEarnedElement = document.getElementById('total-earned');
        const referralEarningsElement = document.getElementById('referral-earnings');
        
        if (completedElement) completedElement.textContent = runnerSystem.getCompletedMissionsCount();
        if (totalEarnedElement) totalEarnedElement.textContent = userData.totalEarned.toFixed(3) + ' TON';
        if (referralEarningsElement) referralEarningsElement.textContent = userData.referralEarnings.toFixed(3) + ' TON';
    }

    updateCraftingAccess();
    updateAdvertiserAccess();
    saveUserData();
}

function showWelcomeScreen() {
    hideAllScreens();
    document.getElementById('welcome-screen').classList.add('active');
    
    const welcomeTerminal = document.getElementById('welcome-terminal');
    let canSkip = false;
    let skipped = false;
    
    const skipHandler = (e) => {
        if (canSkip && !skipped) {
            e.preventDefault();
            skipped = true;
            if (audioManager) audioManager.beep();
            proceedToMainScreen();
        }
    };
    
    if (welcomeTerminal) {
        welcomeTerminal.addEventListener('click', skipHandler);
        welcomeTerminal.addEventListener('touchstart', skipHandler);
    }
    
    setTimeout(() => { canSkip = true; }, 2000);
    
    // Инициализация аудио БЕЗ мелодии
    const initAudio = () => {
        if (audioManager) {
            audioManager.init();
        }
    };
    
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
    
    const bootMessages = [
        'INITIALIZING RUNNER TERMINAL...',
        'LOADING BLOCKCHAIN PROTOCOLS...',
        'CONNECTING TO TON NETWORK......OK',
        'LOADING TSAR TOKEN SYSTEM......OK',  
        'TERMINAL READY FOR OPERATION'
    ];
    
    let currentLine = 0;
    
    function typeNextLine() {
        if (skipped) return;
        
        if (currentLine >= bootMessages.length) {
            showSystemCheck();
            return;
        }
        
        const lineElement = document.getElementById(`boot-line-${currentLine + 1}`);
        if (!lineElement) {
            currentLine++;
            setTimeout(typeNextLine, 100);
            return;
        }
        
        const message = bootMessages[currentLine];
        
        if (message.includes('OK') || message.includes('READY')) {
            lineElement.className = 'boot-line success';
        }
        
        typeText(lineElement, message, () => {
            currentLine++;
            setTimeout(typeNextLine, 300);
        });
    }
    
    setTimeout(typeNextLine, 500);
}

function typeText(element, text, callback) {
    if (!element) {
        if (callback) callback();
        return;
    }
    
    element.textContent = '';
    let i = 0;
    
    const typeInterval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text[i];
            i++;
        } else {
            clearInterval(typeInterval);
            if (callback) {
                setTimeout(callback, 100);
            }
        }
    }, 30);
}

function showSystemCheck() {
    const systemCheck = document.getElementById('system-check');
    if (systemCheck) {
        systemCheck.style.display = 'block';
    }
    
    setTimeout(showContinuePrompt, 1500);
}

function showContinuePrompt() {
    const continueSection = document.getElementById('continue-section');
    
    if (continueSection) {
        continueSection.style.display = 'block';
        
        const continueHandler = (e) => {
            e.preventDefault();
            proceedToMainScreen();
        };
        
        continueSection.addEventListener('click', continueHandler);
        continueSection.addEventListener('touchstart', continueHandler);
        document.addEventListener('keydown', continueHandler);
        
        setTimeout(() => {
            if (document.getElementById('welcome-screen').classList.contains('active')) {
                proceedToMainScreen();
            }
        }, 8000);
    }
}

function proceedToMainScreen() {
    if (audioManager && !audioManager.initialized) {
        audioManager.init();
    }
    
    if (audioManager) audioManager.beep();
    
    hideAllScreens();
    document.getElementById('main-screen').classList.add('active');
    showSection('stat');
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

function setupAllEventHandlers() {
    setupSimpleNavigation();
    setupGameHandlers();
    setupRadioHandlers();
    setupWalletHandlers();
    setupClanHandlers();
    setupSettingsHandlers();
    setupMarketHandlers();
    setupNuclearHandlers();
    setupRunnerHandlers();
    setupShmupHandlers();
}

function setupSimpleNavigation() {
    const menuBtn = document.getElementById('simple-menu-toggle');
    const closeBtn = document.getElementById('simple-close');
    const nav = document.getElementById('simple-nav');
    
    if (!menuBtn || !closeBtn || !nav) {
        console.error("❌ Menu elements not found!");
        return;
    }
    
    function openMenu() {
        nav.style.display = 'block';
        menuOpen = true;
    }
    
    function closeMenu() {
        nav.style.display = 'none';
        menuOpen = false;
    }
    
    menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (audioManager) audioManager.beep();
        menuOpen ? closeMenu() : openMenu();
    });
    
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (audioManager) audioManager.beep();
        closeMenu();
    });
    
    document.querySelectorAll('.simple-nav-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const section = button.getAttribute('data-section');
            if (audioManager) audioManager.beep();
            showSection(section);
            closeMenu();
        });
    });
}

function showSection(section) {
    document.querySelectorAll('.section-content').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const defaultContent = document.getElementById('default-content');
    if (defaultContent) {
        defaultContent.style.display = 'none';
    }
    
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        if (section === 'runner') loadRunnerMissions();
        else if (section === 'radio') loadRadioMessages();
        else if (section === 'shop') loadMarketListings();
        else if (section === 'inventory') loadInventory();
    }
}

// Остальные функции (упрощенные версии)
function setupGameHandlers() {
    const terminalBtn = document.getElementById('terminal-hack-btn');
    if (terminalBtn) {
        terminalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            showTerminalHackingScreen();
        });
    }

    const shmupBtn = document.getElementById('shmup-btn');
    if (shmupBtn) {
        shmupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            showShmupScreen();
        });
    }

    const backBtn = document.getElementById('back-to-arcade');
    const backShmupBtn = document.getElementById('back-from-shmup');
    
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            if (terminalGame) terminalGame.resetGame();
            hideAllScreens();
            document.getElementById('main-screen').classList.add('active');
            showSection('gameboy');
        });
    }

    if (backShmupBtn) {
        backShmupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            if (shmupGameManager) shmupGameManager.resetShmupGame();
        });
    }

    setupModeHandlers();
}

function setupModeHandlers() {
    const soloBtn = document.getElementById('solo-mode-btn');
    const mpBtn = document.getElementById('multiplayer-mode-btn');
    
    if (soloBtn) {
        soloBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            startTerminalHacking('solo');
        });
    }

    if (mpBtn) {
        mpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            showMultiplayerSetup();
        });
    }

    const createGameBtn = document.getElementById('create-game');
    if (createGameBtn) {
        createGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            createMultiplayerGame();
        });
    }

    const backToModesBtn = document.getElementById('back-to-modes');
    if (backToModesBtn) {
        backToModesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            showModeSelector();
        });
    }

    document.querySelectorAll('.crypto-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            document.querySelectorAll('.crypto-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            selectedCurrency = btn.getAttribute('data-currency');
            const displayElement = document.getElementById('currency-display');
            if (displayElement) {
                displayElement.textContent = selectedCurrency;
            }
        });
    });
}

function setupShmupHandlers() {
    const shootBtn = document.getElementById('shoot-btn');
    if (shootBtn) {
        shootBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (shmupGameManager) shmupGameManager.shoot();
        });
    }

    const moveButtons = [
        { id: 'move-left', direction: 'left' },
        { id: 'move-right', direction: 'right' },
        { id: 'move-up', direction: 'up' },
        { id: 'move-down', direction: 'down' }
    ];
    
    moveButtons.forEach(({ id, direction }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (shmupGameManager) shmupGameManager.movePlayer(direction);
            });
        }
    });
}

function setupRunnerHandlers() {
    const missionFilter = document.getElementById('mission-filter');
    if (missionFilter) {
        missionFilter.addEventListener('change', (e) => {
            if (audioManager) audioManager.beep();
            loadRunnerMissions(e.target.value);
        });
    }

    const createMissionBtn = document.getElementById('create-mission-btn');
    if (createMissionBtn) {
        createMissionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            openMissionCreator();
        });
    }
}

function setupRadioHandlers() {
    document.querySelectorAll('.message-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            document.querySelectorAll('.message-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            messageType = btn.getAttribute('data-type');
        });
    });

    const sendBtn = document.getElementById('send-message');
    if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            sendRadioMessage();
        });
    }

    const refreshBtn = document.getElementById('refresh-radio');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            loadRadioMessages();
        });
    }

    const messageInput = document.getElementById('radio-message');
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            const count = this.value.length;
            const counter = document.getElementById('char-counter');
            if (counter) {
                counter.textContent = `${count}/200`;
            }
        });
    }
}

function setupWalletHandlers() {
    const connectBtn = document.getElementById('connect-wallet');
    if (connectBtn) {
        connectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            if (blockchainManager && blockchainManager.connected) {
                blockchainManager.connected = false;
                blockchainManager.userWallet = null;
                blockchainManager.updateWalletUI();
                alert('[WALLET] Disconnected');
            } else {
                if (blockchainManager) blockchainManager.connectWallet();
            }
        });
    }

    const walletButtons = [
        { id: 'deposit-btn', action: handleDeposit },
        { id: 'withdraw-btn', action: handleWithdraw },
        { id: 'stake-tsar-btn', action: handleStakeTsar },
        { id: 'add-tokens-btn', action: handleAddTokens }
    ];
    
    walletButtons.forEach(({ id, action }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (audioManager) audioManager.beep();
                action();
            });
        }
    });

    const listTokenBtn = document.getElementById('list-token-btn');
    if (listTokenBtn) {
        listTokenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            openTokenListing();
        });
    }
}

function setupClanHandlers() {
    const createBtn = document.getElementById('create-clan-btn');
    if (createBtn) {
        createBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            createClan();
        });
    }

    const joinBtn = document.getElementById('join-clan-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            joinClan();
        });
    }

    const copyBtn = document.getElementById('copy-referral');
    if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            copyReferralLink();
        });
    }
}

function setupSettingsHandlers() {
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', (e) => {
            e.preventDefault();
            
            soundEnabled = !soundEnabled;
            e.target.textContent = soundEnabled ? 'ON' : 'OFF';
            e.target.classList.toggle('active', soundEnabled);
            
            if (soundEnabled && audioManager) {
                audioManager.beep();
            }
        });
    }

    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            if (audioManager) audioManager.beep();
            alert(`[LANGUAGE] Changed to ${e.target.value.toUpperCase()}`);
        });
    }

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            if (userData && userData.tsarBalance >= 10000) {
                if (audioManager) audioManager.beep();
                alert(`[THEME] Applied ${e.target.value.toUpperCase()} theme`);
            } else {
                e.target.value = 'classic';
                alert('[ERROR] Premium feature\nRequires 10,000+ TSAR tokens');
            }
        });
    }
}

function setupMarketHandlers() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            loadMarketListings();
        });
    });

    const createListingBtn = document.getElementById('create-listing-btn');
    if (createListingBtn) {
        createListingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            createGeneralListing();
        });
    }

    const sellNftBtn = document.getElementById('sell-nft-btn');
    if (sellNftBtn) {
        sellNftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            alert('[NFT MARKETPLACE]\nComing soon!');
        });
    }

    const sellGiftBtn = document.getElementById('sell-gift-btn');
    if (sellGiftBtn) {
        sellGiftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            alert('[GIFT MARKETPLACE]\nComing soon!');
        });
    }

    document.querySelectorAll('.inv-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            document.querySelectorAll('.inv-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            loadInventory();
        });
    });
}

function setupNuclearHandlers() {
    const connectTradingBtn = document.getElementById('connect-trading-wallet');
    if (connectTradingBtn) {
        connectTradingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            if (blockchainManager) blockchainManager.connectWallet();
        });
    }

    const buyBtn = document.getElementById('buy-btn');
    const sellBtn = document.getElementById('sell-btn');
    
    if (buyBtn) {
        buyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            placeBuyOrder();
        });
    }

    if (sellBtn) {
        sellBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            placeSellOrder();
        });
    }
}

// Игровые функции
function showTerminalHackingScreen() {
    hideAllScreens();
    document.getElementById('game-screen').classList.add('active');
    showModeSelector();
}

function showShmupScreen() {
    hideAllScreens();
    document.getElementById('shmup-screen').classList.add('active');
    
    setTimeout(() => {
        const mode = confirm('Choose mode:\nOK = Solo\nCancel = Multiplayer') ? 'solo' : 'multiplayer';
        
        if (mode === 'multiplayer') {
            const stake = prompt('Stake amount (TON):');
            const stakeAmount = parseFloat(stake);
            
            if (stake && stakeAmount > 0 && stakeAmount <= userData.tonBalance) {
                currentStake = { amount: stakeAmount, currency: 'TON' };
                if (shmupGameManager) shmupGameManager.startGame(mode);
            } else {
                alert('[ERROR] Invalid stake amount');
                return;
            }
        } else {
            if (shmupGameManager) shmupGameManager.startGame(mode);
        }
    }, 500);
}

function showModeSelector() {
    document.getElementById('mode-selector').style.display = 'block';
    document.getElementById('multiplayer-setup').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'none';
    document.getElementById('gaming-area').style.display = 'none';
}

function showMultiplayerSetup() {
    document.getElementById('mode-selector').style.display = 'none';
    document.getElementById('multiplayer-setup').style.display = 'block';
}

function startTerminalHacking(mode) {
    document.getElementById('mode-selector').style.display = 'none';
    document.getElementById('gaming-area').style.display = 'block';
    
    if (terminalGame) {
        terminalGame.startGame(mode);
    }
}

function createMultiplayerGame() {
    const amountInput = document.getElementById('stake-amount');
    const amount = amountInput ? parseFloat(amountInput.value) : 0.1;
    
    if (amount <= 0) {
        alert('[ERROR] Invalid stake amount');
        return;
    }

    if (!userData) return;

    const balance = selectedCurrency === 'TON' ? userData.tonBalance : userData.tsarBalance;
    if (amount > balance) {
        alert(`[ERROR] Insufficient ${selectedCurrency} balance`);
        return;
    }

    currentStake = { amount, currency: selectedCurrency };
    showWaitingLobby();
    
    setTimeout(() => {
        startTerminalHacking('multiplayer');
    }, 3000);
}

function showWaitingLobby() {
    document.getElementById('multiplayer-setup').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'flex';
    
    const gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const gameCodeElement = document.getElementById('lobby-game-code');
    const stakeElement = document.getElementById('lobby-stake');
    
    if (gameCodeElement) gameCodeElement.textContent = gameCode;
    if (stakeElement && currentStake) {
        stakeElement.textContent = `${currentStake.amount} ${currentStake.currency}`;
    }
}

// RUNNER функции
function loadRunnerMissions(filter = 'all') {
    const missionsList = document.getElementById('missions-list');
    if (!missionsList || !runnerSystem) return;

    const missions = runnerSystem.getAvailableMissions(filter);
    const missionsCount = document.getElementById('missions-count');
    
    if (missionsCount) {
        missionsCount.textContent = `${missions.length} active missions`;
    }

    missionsList.innerHTML = missions.map(mission => `
        <div class="mission-item" data-mission-id="${mission.id}">
            <div class="mission-header">
                <span class="mission-title">${mission.title}</span>
                <span class="mission-reward">+${mission.reward.amount} ${mission.reward.currency}</span>
            </div>
            <div class="mission-description">${mission.description}</div>
            <div class="mission-progress">
                <span class="progress-text">Required: ${mission.requirements.minTsar} TSAR</span>
                <span class="mission-status">AVAILABLE</span>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.mission-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            const missionId = parseInt(item.getAttribute('data-mission-id'));
            startMission(missionId);
        });
    });
}

function startMission(missionId) {
    if (!runnerSystem) return;
    
    const result = runnerSystem.startMission(missionId);
    
    if (result.success) {
        alert('[MISSION STARTED]\nMission accepted!\nComplete the task to earn reward.');
        
        setTimeout(() => {
            const success = Math.random() > 0.2;
            
            if (success) {
                const completeResult = runnerSystem.completeMission(missionId);
                if (completeResult.success) {
                    const reward = completeResult.reward;
                    alert(`[MISSION COMPLETED!]\nReward: +${reward.amount} ${reward.currency}`);
                    
                    if (userData) {
                        userData.missionsCompleted++;
                        userData.totalEarned += reward.currency === 'TON' ? reward.amount : 0;
                    }
                    
                    if (referralSystem) {
                        referralSystem.processEarning(reward.amount, reward.currency);
                    }
                    
                    updateUserInfo();
                    loadRunnerMissions();
                }
            } else {
                alert('[MISSION FAILED]\nTask verification failed.');
            }
        }, 5000);
    } else {
        alert(`[ERROR] ${result.error}`);
    }
}

function openMissionCreator() {
    if (!userData || userData.tsarBalance < 350000) {
        alert('[ACCESS DENIED]\nRequired: 350,000 TSAR');
        return;
    }

    alert('[MISSION CREATOR]\nComing in next update!\nCreate custom missions for users');
}

function updateAdvertiserAccess() {
    if (!userData) return;
    
    const hasAccess = userData.tsarBalance >= 350000;
    const createBtn = document.getElementById('create-mission-btn');
    const accessStatus = document.getElementById('advertiser-access');
    
    if (accessStatus) {
        accessStatus.textContent = hasAccess ? 'UNLOCKED' : 'LOCKED';
        accessStatus.style.color = hasAccess ? 'var(--pipboy-green)' : 'var(--combat-active)';
    }
    
    if (createBtn) {
        createBtn.disabled = !hasAccess;
        createBtn.style.opacity = hasAccess ? '1' : '0.5';
    }
}

// Остальные простые функции
function handleDeposit() {
    if (!blockchainManager || !blockchainManager.connected) {
        alert('[ERROR] Connect wallet first');
        return;
    }
    
    alert('[DEPOSIT]\nSend TON to your wallet address\nFunds will be credited automatically');
}

function handleWithdraw() {
    const amount = prompt('Withdraw amount (TON):');
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount < 0.1) {
        alert('[ERROR] Minimum: 0.1 TON');
        return;
    }

    if (withdrawAmount > userData.tonBalance) {
        alert('[ERROR] Insufficient balance');
        return;
    }

    userData.tonBalance -= withdrawAmount;
    updateUserInfo();
    
    alert(`[WITHDRAWAL]\n${withdrawAmount} TON sent\nCompletes in 1-3 minutes`);
}

function handleStakeTsar() {
    const amount = prompt('Stake amount (TSAR):');
    const stakeAmount = parseFloat(amount);
    
    if (!stakeAmount || stakeAmount < 1000) {
        alert('[ERROR] Minimum: 1000 TSAR');
        return;
    }

    if (stakeAmount > userData.tsarBalance) {
        alert('[ERROR] Insufficient balance');
        return;
    }

    userData.tsarBalance -= stakeAmount;
    updateUserInfo();
    
    alert(`[STAKING]\n${stakeAmount.toLocaleString()} TSAR staked\nAPY: 12%`);
}

function handleAddTokens() {
    const choice = prompt('1. TON→TSAR (1:1000)\n2. STARS→TSAR (1:10)\n3. List token ($50)\n\nChoose:');
    
    switch(choice) {
        case '1': buyTsarWithTon(); break;
        case '2': buyTsarWithStars(); break;
        case '3': openTokenListing(); break;
        default: alert('[ERROR] Invalid choice');
    }
}

function buyTsarWithTon() {
    const amount = prompt('TON amount:');
    const tonAmount = parseFloat(amount);
    
    if (!tonAmount || tonAmount > userData.tonBalance) {
        alert('[ERROR] Invalid amount');
        return;
    }

    const tsarAmount = tonAmount * 1000;
    userData.tonBalance -= tonAmount;
    userData.tsarBalance += tsarAmount;
    
    updateUserInfo();
    alert(`[EXCHANGE]\n${tonAmount} TON → ${tsarAmount.toLocaleString()} TSAR`);
}

function buyTsarWithStars() {
    const amount = prompt('STARS amount:');
    const starsAmount = parseFloat(amount);
    
    if (!starsAmount || starsAmount > userData.starsBalance) {
        alert('[ERROR] Invalid amount');
        return;
    }

    const tsarAmount = starsAmount * 10;
    userData.starsBalance -= starsAmount;
    userData.tsarBalance += tsarAmount;
    
    updateUserInfo();
    alert(`[EXCHANGE]\n${starsAmount} STARS → ${tsarAmount} TSAR`);
}

function openTokenListing() {
    const symbol = prompt('Token symbol:');
    const name = prompt('Token name:');
    const address = prompt('Contract address:');
    
    if (!symbol || !name || !address) {
        alert('[ERROR] All fields required');
        return;
    }

    const confirm = window.confirm(`List ${name} (${symbol})?\nCost: $50 (50,000 TSAR)`);

    if (confirm) {
        const tokenData = { symbol: symbol.toUpperCase(), name, contractAddress: address };

        if (blockchainManager) {
            blockchainManager.processTokenListing(tokenData).then(result => {
                if (result.success) {
                    alert(`[TOKEN LISTED]\n${name} listed successfully!`);
                    updateUserInfo();
                } else {
                    alert(`[ERROR] ${result.error}`);
                }
            });
        }
    }
}

function loadMarketListings() {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer || !marketplace) return;
    
    const listings = marketplace.getAllListings();
    
    listingsContainer.innerHTML = listings.map(listing => `
        <div class="market-listing" data-listing-id="${listing.id}">
            <div class="listing-header">
                <span class="listing-title">${listing.title}</span>
                <span class="listing-price">${listing.price} ${listing.currency}</span>
            </div>
            <div class="listing-description">${listing.description}</div>
            <div class="listing-seller">Seller: ${listing.seller}</div>
        </div>
    `).join('');

    document.querySelectorAll('.market-listing').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            const listingId = parseInt(item.getAttribute('data-listing-id'));
            const listing = listings.find(l => l.id === listingId);
            
            if (listing) {
                purchaseListing(listing);
            }
        });
    });
}

function createGeneralListing() {
    const title = prompt('Item title:');
    const description = prompt('Description:');
    const price = parseFloat(prompt('Price:'));
    const currency = prompt('Currency (TON/TSAR/STARS):').toUpperCase();
    
    if (!title || !description || !price || !['TON', 'TSAR', 'STARS'].includes(currency)) {
        alert('[ERROR] Invalid data');
        return;
    }

    const listingData = { title, description, price, currency, type: 'general' };
    const result = marketplace.createListing(listingData);
    
    if (result.success) {
        alert(`[LISTING CREATED]\n${title}\n${price} ${currency}`);
        loadMarketListings();
    }
}

function purchaseListing(listing) {
    const confirm = window.confirm(`Buy "${listing.title}"?\nPrice: ${listing.price} ${listing.currency}`);

    if (confirm && userData) {
        const userBalance = getUserBalance(listing.currency);
        
        if (userBalance >= listing.price) {
            if (listing.currency === 'TON') userData.tonBalance -= listing.price;
            else if (listing.currency === 'TSAR') userData.tsarBalance -= listing.price;
            else if (listing.currency === 'STARS') userData.starsBalance -= listing.price;

            updateUserInfo();
            alert(`[PURCHASED]\n${listing.title}\nPaid: ${listing.price} ${listing.currency}`);
        } else {
            alert(`[ERROR] Insufficient ${listing.currency}`);
        }
    }
}

function getUserBalance(currency) {
    if (!userData) return 0;
    
    switch(currency) {
        case 'TON': return userData.tonBalance;
        case 'TSAR': return userData.tsarBalance;
        case 'STARS': return userData.starsBalance;
        default: return 0;
    }
}

function sendRadioMessage() {
    const messageInput = document.getElementById('radio-message');
    if (!messageInput || !wastelandRadio) return;
    
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        alert('[ERROR] Empty message');
        return;
    }

    if (!userData) return;

    try {
        if (messageType === 'anonymous' && userData.tsarBalance < 5000) {
            alert('[ERROR] Need 5000 TSAR for anonymous');
            return;
        }

        if (messageType === 'sponsored' && userData.tsarBalance < 10000) {
            alert('[ERROR] Need 10000 TSAR for sponsored');
            return;
        }

        if (messageType === 'anonymous') {
            userData.tsarBalance -= 5000;
            alert('[SUCCESS] Anonymous message posted');
        } else if (messageType === 'sponsored') {
            userData.tsarBalance -= 10000;
            alert('[SUCCESS] Sponsored message posted');
        }

        wastelandRadio.addMessage(messageText, userData.name, messageType);
        
        messageInput.value = '';
        const counter = document.getElementById('char-counter');
        if (counter) counter.textContent = '0/200';
        
        updateUserInfo();
        loadRadioMessages();
        
    } catch (error) {
        alert('[ERROR] Failed to send message');
    }
}

function loadRadioMessages() {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent || !wastelandRadio) return;
    
    const messages = wastelandRadio.getMessages();
    
    feedContent.innerHTML = messages.map(msg => `
        <div class="radio-message ${msg.type}">
            <div class="message-header">
                <span class="message-author ${msg.type}">${msg.author}</span>
                <span class="message-time">${msg.time}</span>
            </div>
            <div class="message-text">${msg.text}</div>
        </div>
    `).join('');
    
    feedContent.scrollTop = 0;
}

function placeBuyOrder() {
    if (!blockchainManager || !blockchainManager.connected) {
        alert('[ERROR] Connect wallet first');
        return;
    }

    const amount = parseFloat(document.getElementById('trade-amount')?.value || 0);
    const price = parseFloat(document.getElementById('trade-price')?.value || 0);
    
    if (!amount || !price) {
        alert('[ERROR] Enter amount and price');
        return;
    }

    const total = amount * price;
    
    if (total > userData.tonBalance) {
        alert('[ERROR] Insufficient TON');
        return;
    }

    userData.tonBalance -= total;
    updateUserInfo();

    alert(`[BUY ORDER]\n${amount} TSAR @ ${price} TON\nTotal: ${total.toFixed(3)} TON`);
}

function placeSellOrder() {
    if (!blockchainManager || !blockchainManager.connected) {
        alert('[ERROR] Connect wallet first');
        return;
    }

    const amount = parseFloat(document.getElementById('trade-amount')?.value || 0);
    const price = parseFloat(document.getElementById('trade-price')?.value || 0);
    
    if (!amount || !price) {
        alert('[ERROR] Enter amount and price');
        return;
    }

    if (amount > userData.tsarBalance) {
        alert('[ERROR] Insufficient TSAR');
        return;
    }

    userData.tsarBalance -= amount;
    updateUserInfo();

    alert(`[SELL ORDER]\n${amount} TSAR @ ${price} TON\nExpected: ${(amount * price).toFixed(3)} TON`);
}

function createClan() {
    const clanName = prompt('Clan name (3-20 chars):');
    if (!clanName || clanName.length < 3 || clanName.length > 20) {
        alert('[ERROR] Invalid clan name');
        return;
    }

    if (!userData || userData.tsarBalance < 1000) {
        alert('[ERROR] Need 1000 TSAR');
        return;
    }

    userData.tsarBalance -= 1000;
    userData.clan = clanName.toUpperCase();
    updateUserInfo();
    alert(`[CLAN CREATED]\n${userData.clan}\nCost: 1000 TSAR`);
}

function joinClan() {
    const clanName = prompt('Clan name:');
    if (!clanName) return;

    const found = Math.random() > 0.3;
    
    if (found && userData) {
        userData.clan = clanName.toUpperCase();
        updateUserInfo();
        alert(`[JOINED]\nWelcome to ${userData.clan}!`);
    } else {
        alert(`[NOT FOUND]\nClan "${clanName}" not found`);
    }
}

function copyReferralLink() {
    const referralLinkElement = document.getElementById('referral-link');
    if (!referralLinkElement) return;
    
    const referralLink = referralLinkElement.textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('[COPIED]\nReferral link copied!');
        });
    } else {
        alert(`[COPY MANUALLY]\n${referralLink}`);
    }
}

function loadInventory() {
    const inventoryGrid = document.getElementById('inventory-grid');
    if (!inventoryGrid) return;

    const items = [
        { name: 'Terminal Skin', type: 'cosmetic', rarity: 'rare' },
        { name: 'XP Boost', type: 'consumable', rarity: 'common' }
    ];

    inventoryGrid.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        
        if (i < items.length) {
            const item = items[i];
            slot.classList.remove('empty');
            slot.innerHTML = `
                <div class="item-icon">[${item.type.substr(0, 3).toUpperCase()}]</div>
                <div class="item-name">${item.name}</div>
            `;
        } else {
            slot.classList.add('empty');
            slot.textContent = '[EMPTY]';
        }
        
        inventoryGrid.appendChild(slot);
    }
}

function updateCraftingAccess() {
    if (!userData) return;
    
    const hasAccess = userData.tsarBalance >= 500000;
    const craftStatus = document.getElementById('craft-status');
    
    if (craftStatus) {
        craftStatus.textContent = hasAccess ? 'UNLOCKED' : 'LOCKED';
        craftStatus.style.color = hasAccess ? 'var(--pipboy-green)' : 'var(--combat-active)';
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 RUNNER DOM loaded");
    setTimeout(initApp, 100);
});

document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

console.log("🎮 RUNNER Terminal script loaded");