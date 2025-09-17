// RUNNER TERMINAL - Fixed Production Version v2.1
let userData = null;
let menuOpen = false;
let gameActive = false;
let isMultiplayer = false;
let gameWords = [];
let correctPassword = '';
let attemptsLeft = 4;
let currentStake = { amount: 0, currency: 'TON' };
let gameTimer = null;
let turnTimer = null;
let timeLeft = 300;
let selectedCurrency = 'TON';
let gameScore = 0;
let messageType = 'public';
let currentLanguage = 'en';
let soundEnabled = true;
let playerTurn = true;
let walletConnected = false;
let userWallet = null;
let referralCode = '';

// Глобальные менеджеры (объявляем только один раз)
let audioManager;
let wastelandRadio;
let runnerSystem;
let referralSystem;
let blockchainManager;
let marketplace;
let terminalGame;
let shmupGameManager; // Изменил название чтобы избежать конфликта

// Звуковая система
class RetroAudioManager {
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
            console.log("Audio initialized successfully");
        } catch (error) {
            console.log("Audio initialization failed:", error);
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
            osc.frequency.setValueAtTime(800, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.08);
            
            gain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.08);
        } catch (e) {
            console.log("Beep error:", e);
        }
    }
    
    playWelcomeMelody() {
        if (!this.enabled || !this.initialized || !this.context) return;
        
        try {
            const melody = [220, 246, 261, 293, 261, 220];
            let time = this.context.currentTime + 0.5;
            
            melody.forEach((note) => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                
                osc.connect(gain);
                gain.connect(this.context.destination);
                
                osc.type = 'triangle';
                osc.frequency.value = note;
                
                gain.gain.setValueAtTime(this.masterVolume * 0.3, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
                
                osc.start(time);
                osc.stop(time + 0.4);
                
                time += 0.5;
            });
        } catch (e) {
            console.log("Melody error:", e);
        }
    }

    playGameSound(type) {
        if (!this.enabled || !this.initialized || !this.context || !soundEnabled) return;
        
        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            switch(type) {
                case 'correct':
                    osc.frequency.value = 600;
                    break;
                case 'incorrect':
                    osc.frequency.value = 200;
                    break;
                case 'shoot':
                    osc.frequency.value = 1000;
                    break;
                case 'hit':
                    osc.frequency.value = 150;
                    break;
                default:
                    osc.frequency.value = 400;
            }
            
            gain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.1);
        } catch (e) {
            console.log("Game sound error:", e);
        }
    }
}

// Радио система с сохранением
class WastelandRadio {
    constructor() {
        this.messages = this.loadMessages();
        this.nextId = this.messages.length > 0 ? Math.max(...this.messages.map(m => m.id)) + 1 : 1;
        this.bannedWords = ['drug', 'drugs', 'porn', 'sex', 'weapon', 'kill', 'death', 'suicide'];
    }

    loadMessages() {
        try {
            const saved = localStorage.getItem('wasteland_radio_messages');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.log("Failed to load messages:", e);
        }
        
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
                text: '[SPONSORED] Premium weapons available at Diamond City! Best deals for TSAR holders!',
                time: '13:15',
                type: 'sponsored'
            }
        ];
    }

    saveMessages() {
        try {
            localStorage.setItem('wasteland_radio_messages', JSON.stringify(this.messages));
        } catch (e) {
            console.log("Failed to save messages:", e);
        }
    }

    addMessage(text, author, type = 'public') {
        if (this.containsBannedContent(text)) {
            throw new Error('Message contains prohibited content');
        }
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const message = {
            id: this.nextId++,
            author: type === 'anonymous' ? 'ANONYMOUS_USER' : author,
            text: this.filterContent(text),
            time: timeStr,
            type: type,
            timestamp: Date.now()
        };
        
        this.messages.unshift(message);
        
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(0, 100);
        }
        
        this.saveMessages();
        return message;
    }

    containsBannedContent(text) {
        const lowerText = text.toLowerCase();
        return this.bannedWords.some(word => lowerText.includes(word));
    }

    filterContent(text) {
        return text
            .replace(/https?:\/\/[^\s]+/gi, '[LINK_REMOVED]')
            .replace(/www\.[^\s]+/gi, '[LINK_REMOVED]')
            .replace(/[<>]/g, '')
            .substring(0, 200);
    }

    getMessages() {
        return this.messages;
    }
}

// RUNNER миссии
class RunnerMissionSystem {
    constructor() {
        this.missions = this.getDefaultMissions();
        this.userMissions = this.loadUserMissions();
        this.nextMissionId = 100;
    }

    getDefaultMissions() {
        return [
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
        } catch (e) {
            console.log("Failed to save user missions:", e);
        }
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

        // Начисляем награду
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

    createMission(missionData) {
        if (!userData || userData.tsarBalance < 350000) {
            return { success: false, error: 'Insufficient TSAR tokens. Required: 350,000 TSAR' };
        }

        const mission = {
            id: this.nextMissionId++,
            title: missionData.title,
            description: missionData.description,
            reward: missionData.reward,
            type: missionData.type,
            advertiser: userData.name,
            requirements: missionData.requirements || { minTsar: 100 },
            status: 'available',
            createdAt: Date.now()
        };

        // Берем комиссию 10%
        const commission = missionData.totalBudget * 0.1;
        userData.tsarBalance -= commission;

        this.missions.push(mission);
        return { success: true, mission: mission };
    }
}

// Реферальная система
class ReferralSystem {
    constructor() {
        this.referrals = this.loadReferrals();
        this.earnings = this.loadEarnings();
    }

    loadReferrals() {
        try {
            const saved = localStorage.getItem('user_referrals');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveReferrals() {
        try {
            localStorage.setItem('user_referrals', JSON.stringify(this.referrals));
        } catch (e) {
            console.log("Failed to save referrals:", e);
        }
    }

    loadEarnings() {
        try {
            const saved = localStorage.getItem('referral_earnings');
            return saved ? JSON.parse(saved) : { total: 0, level1: 0, level2: 0, level3: 0 };
        } catch (e) {
            return { total: 0, level1: 0, level2: 0, level3: 0 };
        }
    }

    saveEarnings() {
        try {
            localStorage.setItem('referral_earnings', JSON.stringify(this.earnings));
        } catch (e) {
            console.log("Failed to save earnings:", e);
        }
    }

    generateReferralCode() {
        if (!userData) return 'REF_UNKNOWN';
        return `REF_${userData.name}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    addReferral(referredUserId, level = 1) {
        const referral = {
            id: referredUserId,
            level: level,
            addedAt: Date.now(),
            earnings: 0
        };

        this.referrals.push(referral);
        this.saveReferrals();
        return referral;
    }

    processEarning(amount, currency) {
        const rates = [0.1, 0.05, 0.02]; // 10% / 5% / 2%
        
        this.referrals.forEach(ref => {
            if (ref.level <= 3) {
                const earning = amount * rates[ref.level - 1];
                ref.earnings += earning;
                this.earnings[`level${ref.level}`] += earning;
                this.earnings.total += earning;
                
                if (userData) {
                    if (currency === 'TON') {
                        userData.tonBalance += earning;
                    } else if (currency === 'TSAR') {
                        userData.tsarBalance += earning;
                    }
                }
            }
        });

        this.saveReferrals();
        this.saveEarnings();
    }
}

// Блокчейн менеджер
class BlockchainManager {
    constructor() {
        this.tonConnect = null;
        this.connected = false;
        this.userWallet = null;
    }

    async initTonConnect() {
        try {
            // В реальной версии здесь будет настоящий TonConnect
            console.log("TonConnect initialized (simulation mode)");
        } catch (error) {
            console.log("TonConnect initialization failed:", error);
        }
    }

    async connectWallet() {
        try {
            // Симуляция подключения кошелька
            this.connected = true;
            this.userWallet = {
                account: {
                    address: 'EQD' + Math.random().toString(36).substr(2, 40),
                    publicKey: Math.random().toString(36).substr(2, 64)
                }
            };
            
            this.updateWalletUI();
            alert('[SUCCESS] Wallet connected!\nAddress: ' + this.userWallet.account.address.substr(0, 15) + '...');
        } catch (error) {
            console.log("Wallet connection failed:", error);
            alert('[ERROR] Failed to connect wallet\nTry again later');
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

        // Показываем/скрываем торговую панель
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
        const requiredUsd = 50;
        const tsarPriceUsd = 0.001;
        const requiredTsar = requiredUsd / tsarPriceUsd; // 50,000 TSAR

        if (!userData || userData.tsarBalance < requiredTsar) {
            return { 
                success: false, 
                error: `Insufficient TSAR tokens. Required: ${requiredTsar.toLocaleString()} TSAR ($50 worth)` 
            };
        }

        try {
            // Симуляция транзакции
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

// Система рынка
class MarketplaceSystem {
    constructor() {
        this.listings = this.loadListings();
        this.nftListings = this.loadNFTListings();
        this.giftListings = this.loadGiftListings();
        this.commissionRate = 0.025;
        this.nextId = this.getMaxId() + 1;
    }

    loadListings() {
        try {
            const saved = localStorage.getItem('market_listings');
            return saved ? JSON.parse(saved) : this.getDefaultListings();
        } catch (e) {
            return this.getDefaultListings();
        }
    }

    loadNFTListings() {
        try {
            const saved = localStorage.getItem('nft_listings');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    loadGiftListings() {
        try {
            const saved = localStorage.getItem('gift_listings');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    getDefaultListings() {
        return [
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
    }

    getMaxId() {
        const allListings = [...this.listings, ...this.nftListings, ...this.giftListings];
        return allListings.length > 0 ? Math.max(...allListings.map(l => l.id)) : 0;
    }

    saveListings() {
        try {
            localStorage.setItem('market_listings', JSON.stringify(this.listings));
            localStorage.setItem('nft_listings', JSON.stringify(this.nftListings));
            localStorage.setItem('gift_listings', JSON.stringify(this.giftListings));
        } catch (e) {
            console.log("Failed to save listings:", e);
        }
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
        this.saveListings();
        return { success: true, listing: listing };
    }

    getAllListings(type = 'listings') {
        switch(type) {
            case 'nft': return this.nftListings;
            case 'gifts': return this.giftListings;
            default: return this.listings;
        }
    }
}

// Fallout-style игра взлома
class TerminalHackingGame {
    constructor() {
        this.difficulty = 'normal';
        this.wordLengths = { easy: 5, normal: 7, hard: 9 };
        this.wordLists = {
            5: ['APPLE', 'BRAVE', 'CHARM', 'DANCE', 'EAGLE', 'FIGHT', 'GRACE', 'HAPPY', 'IMAGE', 'JUDGE'],
            7: ['ABILITY', 'BALANCE', 'CAPITAL', 'DESTINY', 'ELEGANT', 'FACTORY', 'GALLERY', 'HIGHWAY', 'IMAGINE', 'JUSTICE'],
            9: ['ADVENTURE', 'BEAUTIFUL', 'CHARACTER', 'DEMOCRACY', 'EDUCATION', 'FANTASTIC', 'GUARANTEE', 'KNOWLEDGE', 'LANDSCAPE', 'MACHINERY']
        };
        this.currentWords = [];
        this.correctWord = '';
        this.attemptsLeft = 4;
        this.hexData = [];
        this.gameActive = false;
        this.isMultiplayer = false;
        this.playerTurn = true;
        this.opponentAttempts = 4;
    }

    startGame(mode = 'solo', difficulty = 'normal') {
        console.log(`Starting terminal hacking game: ${mode} mode`);
        
        this.difficulty = difficulty;
        this.isMultiplayer = mode === 'multiplayer';
        this.attemptsLeft = 4;
        this.opponentAttempts = 4;
        this.playerTurn = true;
        this.gameActive = true;

        this.generateWords();
        this.generateHexDump();
        this.renderTerminal();
        this.updateGameUI();

        if (this.isMultiplayer) {
            this.startMultiplayerMode();
        }
    }

    generateWords() {
        const wordLength = this.wordLengths[this.difficulty];
        const wordPool = [...this.wordLists[wordLength]];
        this.currentWords = [];

        // Выбираем 12-15 слов
        const wordCount = 12 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < wordCount && wordPool.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * wordPool.length);
            this.currentWords.push(wordPool.splice(randomIndex, 1)[0]);
        }

        // Выбираем правильный пароль
        this.correctWord = this.currentWords[Math.floor(Math.random() * this.currentWords.length)];
        console.log('Correct password:', this.correctWord);
    }

    generateHexDump() {
        this.hexData = [];
        const chars = '0123456789ABCDEF';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        // Создаем копию слов для размещения
        let wordsToPlace = [...this.currentWords];
        
        for (let line = 0; line < 25; line++) {
            let hexLine = '';
            let dataLine = '';
            
            // Hex адрес
            const address = (0xF000 + line * 16).toString(16).toUpperCase();
            hexLine += `0x${address} `;
            
            // Hex данные
            for (let i = 0; i < 16; i++) {
                hexLine += chars[Math.floor(Math.random() * chars.length)];
                if (i % 2 === 1) hexLine += ' ';
            }
            
            // ASCII представление
            let charCount = 0;
            while (charCount < 12) {
                if (Math.random() < 0.4 && wordsToPlace.length > 0) {
                    // Вставляем слово
                    const wordIndex = Math.floor(Math.random() * wordsToPlace.length);
                    const word = wordsToPlace.splice(wordIndex, 1)[0];
                    dataLine += word;
                    charCount += word.length;
                } else {
                    // Вставляем символы или скобки
                    if (Math.random() < 0.15) {
                        const brackets = ['()', '[]', '{}'];
                        const bracket = brackets[Math.floor(Math.random() * brackets.length)];
                        dataLine += bracket;
                        charCount += 2;
                    } else {
                        dataLine += symbols[Math.floor(Math.random() * symbols.length)];
                        charCount++;
                    }
                }
            }
            
            this.hexData.push({
                address: `0x${address}`,
                hex: hexLine,
                data: dataLine
            });
        }
    }

    renderTerminal() {
        const hexDump = document.getElementById('hex-dump');
        if (!hexDump) return;

        hexDump.innerHTML = this.hexData.map((line, index) => {
            let processedData = line.data;
            
            // Подсвечиваем все слова из списка
            this.currentWords.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'g');
                processedData = processedData.replace(regex, `<span class="password-word" data-word="${word}">${word}</span>`);
            });

            // Подсвечиваем скобки для подсказок
            processedData = processedData.replace(/[\(\)\[\]\{\}]{2}/g, match => {
                return `<span class="bracket-hint" data-hint="remove-dud">${match}</span>`;
            });

            return `<div class="hex-line" data-line="${index}">
                <span class="hex-address">${line.address}</span> 
                <span class="hex-bytes">${line.hex}</span> 
                <span class="hex-ascii">${processedData}</span>
            </div>`;
        }).join('');

        // Добавляем обработчики
        this.attachTerminalHandlers();
    }

    attachTerminalHandlers() {
        // Обработчики для слов
        document.querySelectorAll('.password-word').forEach(word => {
            word.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameActive && (!this.isMultiplayer || this.playerTurn)) {
                    const selectedWord = word.getAttribute('data-word');
                    this.selectPassword(selectedWord);
                }
            });
        });

        // Обработчики для скобок
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
        console.log(`Password selected: ${word}`);
        
        // Подсвечиваем выбранное слово
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
        }, 1000);
    }

    handleCorrectPassword(word) {
        const wordElement = document.querySelector(`[data-word="${word}"]`);
        if (wordElement) {
            wordElement.classList.add('correct');
        }
        
        this.addLogEntry('> Exact match!', 'success');
        this.addLogEntry('> Please wait while system', 'success');
        this.addLogEntry('> grants access...', 'success');
        
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
            this.addLogEntry('> Please contact administrator', 'error');
            setTimeout(() => {
                this.endGame(false);
            }, 2000);
        } else {
            if (this.isMultiplayer) {
                this.playerTurn = false;
                this.updateTurnIndicator();
                this.simulateOpponentTurn();
            }
        }
    }

    calculateLikeness(word1, word2) {
        let matches = 0;
        const minLength = Math.min(word1.length, word2.length);
        
        for (let i = 0; i < minLength; i++) {
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
        
        const hintTypes = ['dud_removed', 'reset_attempts'];
        const hint = hintTypes[Math.floor(Math.random() * hintTypes.length)];

        if (hint === 'dud_removed') {
            this.removeDudPassword();
            this.addLogEntry('> Dud removed', 'system');
        } else if (hint === 'reset_attempts' && this.attemptsLeft < 4) {
            this.attemptsLeft = 4;
            this.updateAttemptsDisplay();
            this.addLogEntry('> Attempts reset', 'system');
        }

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
            const availableWords = this.currentWords.filter(word => word !== this.correctWord);
            if (availableWords.length === 0) return;

            const opponentChoice = availableWords[Math.floor(Math.random() * availableWords.length)];
            this.addLogEntry(`> Opponent: ${opponentChoice}`, 'opponent');

            setTimeout(() => {
                if (opponentChoice === this.correctWord) {
                    this.addLogEntry('> Opponent found password!', 'error');
                    this.endGame(false);
                } else {
                    const likeness = this.calculateLikeness(opponentChoice, this.correctWord);
                    this.addLogEntry(`> Opponent failed - Likeness=${likeness}`, 'opponent');
                    
                    this.opponentAttempts--;
                    this.updateOpponentDisplay();

                    if (this.opponentAttempts <= 0) {
                        this.addLogEntry('> Opponent locked out', 'success');
                        this.endGame(true);
                    } else {
                        this.playerTurn = true;
                        this.updateTurnIndicator();
                    }
                }
            }, 1500);
        }, 2000 + Math.random() * 3000);
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

    updateTurnIndicator() {
        const turnText = document.querySelector('.turn-text');
        if (!turnText) return;

        if (this.playerTurn) {
            turnText.textContent = 'YOUR TURN';
            turnText.style.color = 'var(--pipboy-yellow)';
        } else {
            turnText.textContent = 'OPPONENT TURN';
            turnText.style.color = 'var(--combat-active)';
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
            this.updateTurnIndicator();
        }
    }

    startMultiplayerMode() {
        this.addLogEntry('> Connecting to opponent...', 'system');
        
        setTimeout(() => {
            this.addLogEntry('> Opponent connected: VAULT_DWELLER_' + Math.floor(Math.random() * 1000), 'system');
            this.addLogEntry('> Match started!', 'system');
            this.updateTurnIndicator();
        }, 2000);
    }

    endGame(won) {
        this.gameActive = false;
        
        if (!userData) return;
        
        const baseReward = this.isMultiplayer ? 100 : 25;
        const reward = won ? baseReward : Math.floor(baseReward * 0.2);
        
        userData.bottleCaps += reward;
        
        if (this.isMultiplayer && won && currentStake) {
            if (currentStake.currency === 'TON') {
                userData.tonBalance += currentStake.amount * 1.8;
            } else if (currentStake.currency === 'TSAR') {
                userData.tsarBalance += currentStake.amount * 1.8;
            }
        }

        updateUserInfo();

        setTimeout(() => {
            const resultMessage = won ? 
                `[ACCESS GRANTED!]\nPassword accepted!\n+${reward} Bottle Caps` : 
                `[ACCESS DENIED!]\nTerminal locked!\n+${reward} Bottle Caps`;
            
            if (this.isMultiplayer && won && currentStake) {
                resultMessage += `\n+${currentStake.amount * 1.8} ${currentStake.currency}`;
            }
            
            alert(resultMessage);
            this.resetGame();
            showModeSelector();
        }, 1000);
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

// Космические стрелялки
class ShmupGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameActive = false;
        this.player = { x: 150, y: 350, width: 20, height: 20, lives: 3 };
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.level = 1;
        this.gameLoop = null;
        this.enemySpawner = null;
        this.isMultiplayer = false;
        this.opponentScore = 0;
    }

    init() {
        this.canvas = document.getElementById('shmup-canvas');
        if (!this.canvas) {
            console.log("Canvas not found");
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d');
        console.log("Shmup game initialized");
        return true;
    }

    startGame(mode = 'solo') {
        console.log(`Starting shmup game: ${mode} mode`);
        
        if (!this.init()) {
            alert('[ERROR] Failed to initialize game');
            return;
        }

        this.isMultiplayer = mode === 'multiplayer';
        this.gameActive = true;
        this.score = 0;
        this.level = 1;
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
        // Космический фон
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Звезды
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 7 + Date.now() * 0.01) % this.canvas.width;
            const y = (i * 11 + Date.now() * 0.02) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }

    drawPlayer() {
        this.ctx.fillStyle = '#00b000';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Крылья корабля
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillRect(this.player.x - 5, this.player.y + 5, 5, 10);
        this.ctx.fillRect(this.player.x + this.player.width, this.player.y + 5, 5, 10);
    }

    drawBullets() {
        this.ctx.fillStyle = '#ffcc00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, 3, 8);
        });
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.type === 'boss' ? '#cc3333' : '#cc5500';
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            if (enemy.type === 'boss') {
                // Дополнительные детали для босса
                this.ctx.fillStyle = '#ff6600';
                this.ctx.fillRect(enemy.x + 2, enemy.y + 2, enemy.width - 4, enemy.height - 4);
            }
        });
    }

    drawUI() {
        this.ctx.fillStyle = '#00b000';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`SCORE: ${this.score}`, 10, 20);
        this.ctx.fillText(`LIVES: ${this.player.lives}`, 10, 35);
        this.ctx.fillText(`LEVEL: ${this.level}`, 10, 50);

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
            x: Math.random() * (this.canvas.width - 30),
            y: 0,
            width: 15 + Math.random() * 15,
            height: 15 + Math.random() * 15,
            speed: 1 + Math.random() * 2,
            type: Math.random() < 0.1 ? 'boss' : 'normal',
            health: Math.random() < 0.1 ? 3 : 1
        };

        this.enemies.push(enemy);
    }

    shoot() {
        if (!this.gameActive) return;

        const bullet = {
            x: this.player.x + this.player.width / 2 - 1.5,
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
        const canvas = this.canvas;
        
        switch(direction) {
            case 'left':
                this.player.x = Math.max(0, this.player.x - speed);
                break;
            case 'right':
                this.player.x = Math.min(canvas.width - this.player.width, this.player.x + speed);
                break;
            case 'up':
                this.player.y = Math.max(0, this.player.y - speed);
                break;
            case 'down':
                this.player.y = Math.min(canvas.height - this.player.height, this.player.y + speed);
                break;
        }
    }

    checkCollisions() {
        // Пули против врагов
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    
                    enemy.health--;
                    if (enemy.health <= 0) {
                        this.enemies.splice(enemyIndex, 1);
                        this.score += enemy.type === 'boss' ? 100 : 10;
                        
                        if (audioManager) {
                            audioManager.playGameSound('hit');
                        }
                        
                        // Повышаем уровень каждые 500 очков
                        if (this.score % 500 === 0) {
                            this.level++;
                        }
                    }
                }
            });
        });

        // Враги против игрока
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
        // Симуляция соперника
        const opponentSimulator = setInterval(() => {
            if (this.gameActive && this.isMultiplayer) {
                this.opponentScore += Math.floor(Math.random() * 30);
                
                if (this.opponentScore >= this.score + 500) {
                    clearInterval(opponentSimulator);
                    this.endShmupGame();
                }
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

        let resultMessage = `[GAME OVER!]\nFinal Score: ${this.score}\n+${reward} Bottle Caps`;

        if (this.isMultiplayer) {
            const won = this.score > this.opponentScore;
            resultMessage += `\nOpponent Score: ${this.opponentScore}`;
            resultMessage += `\nResult: ${won ? 'VICTORY!' : 'DEFEAT'}`;
            
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
        this.player = { x: 150, y: 350, width: 20, height: 20, lives: 3 };
        this.enemies = [];
        this.bullets = [];
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        if (this.enemySpawner) {
            clearInterval(this.enemySpawner);
            this.enemySpawner = null;
        }
        
        this.updateShmupUI();
        
        // Возвращаемся к выбору игр
        hideAllScreens();
        document.getElementById('main-screen').classList.add('active');
        showSection('gameboy');
    }
}

let initStarted = false;

function initApp() {
    if (initStarted) {
        console.log("Init already started, skipping...");
        return;
    }
    
    initStarted = true;
    console.log("🚀 Initializing RUNNER terminal...");
    
    // Инициализируем все системы БЕЗ дубликатов
    audioManager = new RetroAudioManager();
    wastelandRadio = new WastelandRadio();
    runnerSystem = new RunnerMissionSystem();
    referralSystem = new ReferralSystem();
    blockchainManager = new BlockchainManager();
    marketplace = new MarketplaceSystem();
    terminalGame = new TerminalHackingGame();
    shmupGameManager = new ShmupGame(); // Используем другое имя
    
    loadUserData();
    generateReferralCode();
    setupAllEventHandlers();
    loadRadioMessages();
    loadMarketListings();
    loadRunnerMissions();
    
    blockchainManager.initTonConnect();
    
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    showWelcomeScreen();
    
    console.log("✅ RUNNER terminal ready");
}

function loadUserData() {
    try {
        const saved = localStorage.getItem('runner_user_data');
        if (saved) {
            userData = JSON.parse(saved);
        }
    } catch (e) {
        console.log("Failed to load user data:", e);
    }
    
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
            gamesPlayed: 30,
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
    } catch (e) {
        console.log("Failed to save user data:", e);
    }
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

    // Обновляем заголовок
    const balanceDisplay = document.getElementById('balance-display');
    const capsDisplay = document.getElementById('caps-display');
    
    if (balanceDisplay) balanceDisplay.textContent = `TON: ${userData.tonBalance.toFixed(3)}`;
    if (capsDisplay) capsDisplay.textContent = `CAPS: ${userData.bottleCaps}`;
    
    // Обновляем статистику
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

    // Обновляем Runner статистику
    if (runnerSystem) {
        const completedElement = document.getElementById('completed-missions');
        const totalEarnedElement = document.getElementById('total-earned');
        const referralEarningsElement = document.getElementById('referral-earnings');
        
        if (completedElement) completedElement.textContent = runnerSystem.getCompletedMissionsCount();
        if (totalEarnedElement) totalEarnedElement.textContent = userData.totalEarned.toFixed(3) + ' TON';
        if (referralEarningsElement) referralEarningsElement.textContent = userData.referralEarnings.toFixed(3) + ' TON';
    }

    // Обновляем балансы в кошельке
    const balanceItems = document.querySelectorAll('.crypto-amount');
    if (balanceItems.length >= 3) {
        balanceItems[0].textContent = userData.tonBalance.toFixed(3);
        balanceItems[1].textContent = userData.tsarBalance.toLocaleString();
        balanceItems[2].textContent = userData.starsBalance.toString();
    }
    
    updateCraftingAccess();
    updateAdvertiserAccess();
    saveUserData();
}

function updateDateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) {
        timeDisplay.textContent = `[TIME] ${timeStr}`;
    }
}

function showWelcomeScreen() {
    hideAllScreens();
    document.getElementById('welcome-screen').classList.add('active');
    
    // Добавляем возможность пропуска
    const welcomeTerminal = document.getElementById('welcome-terminal');
    let canSkip = false;
    let skipped = false;
    
    const skipHandler = (e) => {
        if (canSkip && !skipped) {
            e.preventDefault();
            e.stopPropagation();
            skipped = true;
            console.log("Welcome screen skipped by user");
            if (audioManager) audioManager.beep();
            proceedToMainScreen();
        }
    };
    
    if (welcomeTerminal) {
        welcomeTerminal.addEventListener('click', skipHandler);
        welcomeTerminal.addEventListener('touchstart', skipHandler);
    }
    
    // Разрешаем пропуск через 2 секунды
    setTimeout(() => {
        canSkip = true;
        console.log("Skip enabled");
    }, 2000);
    
    // Инициализируем аудио
    const initAudio = () => {
        if (audioManager) {
            audioManager.init().then(() => {
                setTimeout(() => {
                    audioManager.playWelcomeMelody();
                }, 1000);
            });
        }
    };
    
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
    
    // Автоматическая загрузка
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
    
    setTimeout(() => {
        showContinuePrompt();
    }, 1500);
}

function showContinuePrompt() {
    const continueSection = document.getElementById('continue-section');
    
    if (continueSection) {
        continueSection.style.display = 'block';
        
        const continueHandler = (e) => {
            e.preventDefault();
            proceedToMainScreen();
        };
        
        const keyHandler = (e) => {
            proceedToMainScreen();
        };
        
        continueSection.addEventListener('click', continueHandler);
        continueSection.addEventListener('touchstart', continueHandler);
        document.addEventListener('keydown', keyHandler);
        
        // Автоматический переход через 10 секунд
        setTimeout(() => {
            if (document.getElementById('welcome-screen').classList.contains('active')) {
                proceedToMainScreen();
            }
        }, 10000);
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
    
    // Очищаем обработчики
    const continueSection = document.getElementById('continue-section');
    const welcomeTerminal = document.getElementById('welcome-terminal');
    
    if (continueSection) {
        const newContinueSection = continueSection.cloneNode(true);
        continueSection.parentNode.replaceChild(newContinueSection, continueSection);
    }
    
    if (welcomeTerminal) {
        const newWelcomeTerminal = welcomeTerminal.cloneNode(true);
        welcomeTerminal.parentNode.replaceChild(newWelcomeTerminal, welcomeTerminal);
    }
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

function setupAllEventHandlers() {
    console.log("🔧 Setting up all event handlers...");
    
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
    
    console.log("✅ All handlers setup complete");
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
        console.log("✅ Menu opened");
    }
    
    function closeMenu() {
        nav.style.display = 'none';
        menuOpen = false;
        console.log("✅ Menu closed");
    }
    
    menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (audioManager) audioManager.beep();
        
        if (menuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (audioManager) audioManager.beep();
        closeMenu();
    });
    
    // Навигационные кнопки
    document.querySelectorAll('.simple-nav-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const section = button.getAttribute('data-section');
            if (audioManager) audioManager.beep();
            showSection(section);
            closeMenu();
        });
    });
    
    console.log("✅ Navigation setup complete");
}

function showSection(section) {
    console.log(`📄 Showing section: ${section}`);
    
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
        
        // Специальные действия при открытии разделов
        if (section === 'runner') {
            loadRunnerMissions();
        } else if (section === 'radio') {
            loadRadioMessages();
        } else if (section === 'shop') {
            loadMarketListings();
        } else if (section === 'inventory') {
            loadInventory();
        }
        
        console.log(`✅ Section activated: ${section}`);
    } else {
        console.error(`❌ Section not found: ${section}`);
    }
}

function setupGameHandlers() {
    console.log("Setting up game handlers...");
    
    // Terminal Hacking
    const terminalBtn = document.getElementById('terminal-hack-btn');
    if (terminalBtn) {
        terminalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            showTerminalHackingScreen();
        });
    }

    // Shmup
    const shmupBtn = document.getElementById('shmup-btn');
    if (shmupBtn) {
        shmupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            showShmupScreen();
        });
    }

    // Другие игры
    const otherGames = [
        { id: 'chess-btn', name: 'WASTELAND CHESS' },
        { id: 'battle-arena-btn', name: 'BATTLE ARENA' }
    ];
    
    otherGames.forEach(({ id, name }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (audioManager) audioManager.beep();
                alert(`[${name}]\nComing in future updates!\nStay tuned for more blockchain games!`);
            });
        }
    });

    // Возврат из игр
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
    console.log("✅ Game handlers setup complete");
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

    // Мультиплеер кнопки
    const buttons = [
        { id: 'create-game', handler: createMultiplayerGame },
        { id: 'find-game', handler: findMultiplayerGame },
        { id: 'back-to-modes', handler: showModeSelector },
        { id: 'cancel-waiting', handler: () => showMultiplayerSetup() }
    ];
    
    buttons.forEach(({ id, handler }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                if (audioManager) audioManager.beep();
                handler();
            });
        }
    });

    // Валютные опции
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
    console.log("Setting up shmup handlers...");
    
    // Управление стрельбой
    const shootBtn = document.getElementById('shoot-btn');
    if (shootBtn) {
        shootBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (shmupGameManager) shmupGameManager.shoot();
        });

        // Автоматическая стрельба при удержании
        let shootInterval;
        
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (shmupGameManager) shmupGameManager.shoot();
            shootInterval = setInterval(() => {
                if (shmupGameManager) shmupGameManager.shoot();
            }, 200);
        });

        shootBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (shootInterval) {
                clearInterval(shootInterval);
                shootInterval = null;
            }
        });
    }

    // Кнопки движения
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

            // Непрерывное движение при удержании
            let moveInterval;
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                moveInterval = setInterval(() => {
                    if (shmupGameManager) shmupGameManager.movePlayer(direction);
                }, 50);
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (moveInterval) {
                    clearInterval(moveInterval);
                    moveInterval = null;
                }
            });
        }
    });

    // Клавиатурное управление
    document.addEventListener('keydown', (e) => {
        if (!shmupGameManager || !shmupGameManager.gameActive) return;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                shmupGameManager.movePlayer('left');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                shmupGameManager.movePlayer('right');
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                shmupGameManager.movePlayer('up');
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                shmupGameManager.movePlayer('down');
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                shmupGameManager.shoot();
                break;
        }
    });
    
    console.log("✅ Shmup handlers setup complete");
}

function setupRunnerHandlers() {
    console.log("Setting up runner handlers...");
    
    // Фильтр миссий
    const missionFilter = document.getElementById('mission-filter');
    if (missionFilter) {
        missionFilter.addEventListener('change', (e) => {
            if (audioManager) audioManager.beep();
            loadRunnerMissions(e.target.value);
        });
    }

    // Создание миссии
    const createMissionBtn = document.getElementById('create-mission-btn');
    if (createMissionBtn) {
        createMissionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            openMissionCreator();
        });
    }
    
    console.log("✅ Runner handlers setup complete");
}

function setupRadioHandlers() {
    console.log("Setting up radio handlers...");
    
    // Выбор типа сообщения
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
    
    console.log("✅ Radio handlers setup complete");
}

function setupWalletHandlers() {
    console.log("Setting up wallet handlers...");
    
    // Подключение кошелька
    const connectBtn = document.getElementById('connect-wallet');
    if (connectBtn) {
        connectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            if (blockchainManager && blockchainManager.connected) {
                // Отключение
                blockchainManager.connected = false;
                blockchainManager.userWallet = null;
                blockchainManager.updateWalletUI();
                alert('[WALLET] Disconnected successfully');
            } else {
                // Подключение
                if (blockchainManager) blockchainManager.connectWallet();
            }
        });
    }

    // Остальные кнопки кошелька
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

    // Листинг токена
    const listTokenBtn = document.getElementById('list-token-btn');
    if (listTokenBtn) {
        listTokenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            openTokenListing();
        });
    }
    
    console.log("✅ Wallet handlers setup complete");
}

function setupClanHandlers() {
    console.log("Setting up clan handlers...");
    
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

    // Копирование реферальной ссылки
    const copyBtn = document.getElementById('copy-referral');
    if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            copyReferralLink();
        });
    }
    
    console.log("✅ Clan handlers setup complete");
}

function setupSettingsHandlers() {
    console.log("Setting up settings handlers...");
    
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

    const animationToggle = document.getElementById('animation-toggle');
    if (animationToggle) {
        animationToggle.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            const enabled = e.target.classList.contains('active');
            e.target.classList.toggle('active', !enabled);
            e.target.textContent = enabled ? 'OFF' : 'ON';
            
            document.body.style.animationPlayState = enabled ? 'paused' : 'running';
        });
    }

    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            if (audioManager) audioManager.beep();
            alert(`[LANGUAGE] Changed to ${e.target.value.toUpperCase()}\nFull localization coming soon!`);
        });
    }

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            if (userData && userData.tsarBalance >= 10000) {
                if (audioManager) audioManager.beep();
                applyTheme(e.target.value);
                alert(`[THEME] Applied ${e.target.value.toUpperCase()} theme successfully!`);
            } else {
                e.target.value = 'classic';
                alert('[ERROR] Premium feature\nRequires 10,000+ TSAR tokens');
            }
        });
    }
    
    console.log("✅ Settings handlers setup complete");
}

function setupMarketHandlers() {
    console.log("Setting up market handlers...");
    
    // Табы рынка
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.getAttribute('data-tab');
            loadMarketListings(tab);
        });
    });

    // Создание листингов
    const buttons = [
        { id: 'create-listing-btn', action: createGeneralListing },
        { id: 'sell-nft-btn', action: createNFTListing },
        { id: 'sell-gift-btn', action: createGiftListing }
    ];
    
    buttons.forEach(({ id, action }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (audioManager) audioManager.beep();
                action();
            });
        }
    });

    // Табы инвентаря
    document.querySelectorAll('.inv-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            document.querySelectorAll('.inv-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.getAttribute('data-tab');
            loadInventory(tab);
        });
    });
    
    console.log("✅ Market handlers setup complete");
}

function setupNuclearHandlers() {
    console.log("Setting up nuclear handlers...");
    
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
    
    console.log("✅ Nuclear handlers setup complete");
}

// ===== ИГРОВЫЕ ФУНКЦИИ =====

function showTerminalHackingScreen() {
    hideAllScreens();
    document.getElementById('game-screen').classList.add('active');
    showModeSelector();
    gameScore = 0;
    updateScoreDisplay();
}

function showShmupScreen() {
    hideAllScreens();
    document.getElementById('shmup-screen').classList.add('active');
    
    setTimeout(() => {
        const mode = confirm('Choose game mode:\nOK = Solo Practice (earn bottle caps)\nCancel = Multiplayer (crypto stakes)') ? 'solo' : 'multiplayer';
        
        if (mode === 'multiplayer') {
            const stake = prompt('Enter stake amount (TON):');
            const stakeAmount = parseFloat(stake);
            
            if (stake && stakeAmount > 0 && stakeAmount <= userData.tonBalance) {
                currentStake = { amount: stakeAmount, currency: 'TON' };
                if (shmupGameManager) shmupGameManager.startGame(mode);
            } else {
                alert('[ERROR] Invalid stake amount or insufficient balance');
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
        terminalGame.startGame(mode, 'normal');
    }
}

function createMultiplayerGame() {
    const amountInput = document.getElementById('stake-amount');
    const amount = amountInput ? parseFloat(amountInput.value) : 0.1;
    
    if (amount <= 0) {
        alert('[ERROR] Please enter a valid stake amount');
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

function findMultiplayerGame() {
    const availableGames = [
        { id: 'GAME01', host: 'WASTELAND_TRADER', stake: '0.1 TON' },
        { id: 'GAME02', host: 'VAULT_HUNTER', stake: '500 TSAR' }
    ];
    
    if (availableGames.length > 0) {
        const game = availableGames[0];
        const join = confirm(`Join game ${game.id}?\nHost: ${game.host}\nStake: ${game.stake}`);
        
        if (join) {
            const [amount, currency] = game.stake.split(' ');
            currentStake = { amount: parseFloat(amount), currency };
            
            showWaitingLobby();
            setTimeout(() => {
                startTerminalHacking('multiplayer');
            }, 2000);
        }
    } else {
        alert('[NO GAMES FOUND]\nNo active games available.\nTry creating your own game!');
    }
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

function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
        scoreDisplay.textContent = `SCORE: ${gameScore}`;
    }
}

// ===== RUNNER ФУНКЦИИ =====

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

    // Добавляем обработчики для миссий
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
        alert('[MISSION STARTED]\nMission accepted!\nComplete the task to earn reward.\nYou have 24 hours to complete it.');
        
        // Симуляция выполнения через 5-15 секунд
        const completionTime = 5000 + Math.random() * 10000;
        
        setTimeout(() => {
            const success = Math.random() > 0.2; // 80% шанс успеха
            
            if (success) {
                const completeResult = runnerSystem.completeMission(missionId);
                if (completeResult.success) {
                    const reward = completeResult.reward;
                    alert(`[MISSION COMPLETED!]\nReward: +${reward.amount} ${reward.currency}\nGreat job, Runner!`);
                    
                    if (userData) {
                        userData.missionsCompleted++;
                        userData.totalEarned += reward.currency === 'TON' ? reward.amount : 0;
                    }
                    
                    // Обрабатываем реферальные
                    if (referralSystem) {
                        referralSystem.processEarning(reward.amount, reward.currency);
                    }
                    
                    updateUserInfo();
                    loadRunnerMissions();
                }
            } else {
                alert('[MISSION FAILED]\nTask verification failed.\nPlease try again or contact support.');
            }
        }, completionTime);
    } else {
        alert(`[ERROR] ${result.error}`);
    }
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

function openMissionCreator() {
    if (!userData || userData.tsarBalance < 350000) {
        alert('[ACCESS DENIED]\nInsufficient TSAR tokens\nRequired: 350,000 TSAR for Mission Control Center');
        return;
    }

    const title = prompt('Mission title (max 50 characters):');
    if (!title || title.length > 50) {
        alert('[ERROR] Invalid title');
        return;
    }

    const description = prompt('Mission description (max 200 characters):');
    if (!description || description.length > 200) {
        alert('[ERROR] Invalid description');
        return;
    }

    const rewardAmount = prompt('Reward amount per user (number):');
    const reward = parseFloat(rewardAmount);
    if (!reward || reward <= 0) {
        alert('[ERROR] Invalid reward amount');
        return;
    }

    const currency = prompt('Reward currency (TON/TSAR/STARS):');
    if (!currency || !['TON', 'TSAR', 'STARS'].includes(currency.toUpperCase())) {
        alert('[ERROR] Invalid currency. Use TON, TSAR, or STARS');
        return;
    }

    const type = prompt('Mission type (telegram/social/trading/gaming):');
    if (!type || !['telegram', 'social', 'trading', 'gaming'].includes(type.toLowerCase())) {
        alert('[ERROR] Invalid mission type');
        return;
    }

    const totalBudget = prompt('Total mission budget (in TSAR):');
    const budget = parseFloat(totalBudget);
    if (!budget || budget < 1000) {
        alert('[ERROR] Minimum budget: 1000 TSAR');
        return;
    }

    const missionData = {
        title,
        description,
        reward: { amount: reward, currency: currency.toUpperCase() },
        type: type.toLowerCase(),
        totalBudget: budget,
        requirements: { minTsar: 100 }
    };

    if (!runnerSystem) return;
    
    const result = runnerSystem.createMission(missionData);
    
    if (result.success) {
        alert(`[MISSION CREATED!]\nTitle: ${title}\nReward: ${reward} ${currency.toUpperCase()}\nCommission: ${Math.floor(budget * 0.1)} TSAR (10%)`);
        updateUserInfo();
        loadRunnerMissions();
    } else {
        alert(`[ERROR] ${result.error}`);
    }
}

// ===== ФУНКЦИИ КОШЕЛЬКА =====

function handleDeposit() {
    if (!blockchainManager || !blockchainManager.connected) {
        alert('[ERROR] Please connect your TON wallet first\nUse the CONNECT TON WALLET button');
        return;
    }
    
    const address = blockchainManager.userWallet.account.address;
    alert(`[DEPOSIT INSTRUCTIONS]\nSend TON to your terminal address:\n\n${address.substr(0, 20)}...\n\nDeposits are credited automatically\nMinimum: 0.01 TON`);
}

function handleWithdraw() {
    if (!blockchainManager || !blockchainManager.connected) {
        alert('[ERROR] Please connect your TON wallet first');
        return;
    }

    if (!userData) return;

    const amount = prompt('Withdraw amount (TON):');
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
        alert('[ERROR] Invalid amount');
        return;
    }

    if (withdrawAmount < 0.1) {
        alert('[ERROR] Minimum withdrawal: 0.1 TON');
        return;
    }

    if (withdrawAmount > userData.tonBalance) {
        alert('[ERROR] Insufficient TON balance');
        return;
    }

    // Симуляция вывода
    userData.tonBalance -= withdrawAmount;
    updateUserInfo();
    
    alert(`[WITHDRAWAL PROCESSED]\nAmount: ${withdrawAmount} TON\nDestination: ${blockchainManager.userWallet.account.address.substr(0, 15)}...\nTransaction will complete in 1-3 minutes`);
}

function handleStakeTsar() {
    if (!userData) return;
    
    const amount = prompt('Stake amount (TSAR):');
    const stakeAmount = parseFloat(amount);
    
    if (!stakeAmount || stakeAmount <= 0) {
        alert('[ERROR] Invalid amount');
        return;
    }

    if (stakeAmount < 1000) {
        alert('[ERROR] Minimum stake: 1000 TSAR');
        return;
    }

    if (stakeAmount > userData.tsarBalance) {
        alert('[ERROR] Insufficient TSAR balance');
        return;
    }

    userData.tsarBalance -= stakeAmount;
    updateUserInfo();
    
    alert(`[STAKING ACTIVATED]\nStaked: ${stakeAmount.toLocaleString()} TSAR\nAPY: 12% annually\nRewards paid daily to your balance`);
}

function handleAddTokens() {
    const choice = prompt(`Select option:\n1. Buy TSAR with TON (1 TON = 1000 TSAR)\n2. Buy TSAR with STARS (1 STAR = 10 TSAR)\n3. List new token ($50 worth of TSAR)\n\nEnter 1, 2, or 3:`);
    
    switch(choice) {
        case '1':
            buyTsarWithTon();
            break;
        case '2':
            buyTsarWithStars();
            break;
        case '3':
            openTokenListing();
            break;
        default:
            alert('[ERROR] Invalid option selected');
    }
}

function buyTsarWithTon() {
    if (!userData) return;
    
    const amount = prompt('TON amount to convert to TSAR:');
    const tonAmount = parseFloat(amount);
    
    if (!tonAmount || tonAmount <= 0) {
        alert('[ERROR] Invalid amount');
        return;
    }

    if (tonAmount > userData.tonBalance) {
        alert('[ERROR] Insufficient TON balance');
        return;
    }

    const tsarAmount = tonAmount * 1000;
    userData.tonBalance -= tonAmount;
    userData.tsarBalance += tsarAmount;
    
    updateUserInfo();
    alert(`[EXCHANGE COMPLETED]\nConverted: ${tonAmount} TON → ${tsarAmount.toLocaleString()} TSAR\nExchange rate: 1 TON = 1000 TSAR`);
}

function buyTsarWithStars() {
    if (!userData) return;
    
    const amount = prompt('STARS amount to convert to TSAR:');
    const starsAmount = parseFloat(amount);
    
    if (!starsAmount || starsAmount <= 0) {
        alert('[ERROR] Invalid amount');
        return;
    }

    if (starsAmount > userData.starsBalance) {
        alert('[ERROR] Insufficient STARS balance');
        return;
    }

    const tsarAmount = starsAmount * 10;
    userData.starsBalance -= starsAmount;
    userData.tsarBalance += tsarAmount;
    
    updateUserInfo();
    alert(`[EXCHANGE COMPLETED]\nConverted: ${starsAmount} STARS → ${tsarAmount} TSAR\nExchange rate: 1 STAR = 10 TSAR`);
}

function openTokenListing() {
    const tokenSymbol = prompt('Token symbol (e.g., DOGE):');
    if (!tokenSymbol || tokenSymbol.length > 10) {
        alert('[ERROR] Invalid token symbol');
        return;
    }

    const tokenName = prompt('Token name (e.g., Dogecoin):');
    if (!tokenName || tokenName.length > 30) {
        alert('[ERROR] Invalid token name');
        return;
    }

    const contractAddress = prompt('TON contract address:');
    if (!contractAddress || contractAddress.length < 10) {
        alert('[ERROR] Invalid contract address');
        return;
    }

    const confirmListing = confirm(
        `List ${tokenName} (${tokenSymbol.toUpperCase()})?\n\n` +
        `Cost: $50 worth of TSAR tokens (50,000 TSAR)\n` +
        `These tokens will be sent to burn address\n` +
        `Contract: ${contractAddress.substr(0, 20)}...\n\n` +
        `Continue with listing?`
    );

    if (confirmListing) {
        const tokenData = {
            symbol: tokenSymbol.toUpperCase(),
            name: tokenName,
            contractAddress: contractAddress
        };

        if (blockchainManager) {
            blockchainManager.processTokenListing(tokenData).then(result => {
                if (result.success) {
                    alert(`[TOKEN LISTED SUCCESSFULLY!]\n${tokenName} (${tokenSymbol.toUpperCase()}) is now listed!\n\nBurn transaction: ${result.token.burnTxHash.substr(0, 20)}...\nYour token is now available for trading!`);
                    updateUserInfo();
                } else {
                    alert(`[LISTING FAILED]\n${result.error}`);
                }
            }).catch(error => {
                alert(`[LISTING ERROR]\n${error.message}`);
            });
        }
    }
}

// ===== ФУНКЦИИ РЫНКА =====

function loadMarketListings(type = 'listings') {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer || !marketplace) return;
    
    const listings = marketplace.getAllListings(type);
    
    listingsContainer.innerHTML = listings.map(listing => `
        <div class="market-listing" data-listing-id="${listing.id}" data-listing-type="${type}">
            <div class="listing-header">
                <span class="listing-title">${listing.title}</span>
                <span class="listing-price">${listing.price} ${listing.currency}</span>
            </div>
            <div class="listing-description">${listing.description}</div>
            <div class="listing-seller">Seller: ${listing.seller}</div>
            ${type === 'nft' ? '<div class="listing-type">[NFT]</div>' : ''}
            ${type === 'gifts' ? '<div class="listing-type">[GIFT]</div>' : ''}
        </div>
    `).join('');

    // Добавляем обработчики для покупки
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
    const title = prompt('Item title (max 50 characters):');
    if (!title || title.length > 50) {
        alert('[ERROR] Invalid title');
        return;
    }

    const description = prompt('Item description (max 200 characters):');
    if (!description || description.length > 200) {
        alert('[ERROR] Invalid description');
        return;
    }

    const price = prompt('Price (number only):');
    const priceAmount = parseFloat(price);
    if (!priceAmount || priceAmount <= 0) {
        alert('[ERROR] Invalid price');
        return;
    }

    const currency = prompt('Currency (TON/TSAR/STARS):');
    if (!currency || !['TON', 'TSAR', 'STARS'].includes(currency.toUpperCase())) {
        alert('[ERROR] Invalid currency. Use TON, TSAR, or STARS');
        return;
    }

    const listingData = {
        title,
        description,
        price: priceAmount,
        currency: currency.toUpperCase(),
        type: 'general'
    };

    if (!marketplace) return;
    
    const result = marketplace.createListing(listingData);
    
    if (result.success) {
        alert(`[LISTING CREATED]\n${title}\nPrice: ${priceAmount} ${currency.toUpperCase()}\nCommission: 2.5% on successful sale`);
        loadMarketListings();
    } else {
        alert(`[ERROR] Failed to create listing`);
    }
}

function createNFTListing() {
    alert('[NFT MARKETPLACE]\nNFT trading feature coming soon!\n\nFeatures:\n- List your Telegram NFT gifts\n- Trade rare collectibles\n- Secure STARS transactions\n- Low 2.5% commission');
}

function createGiftListing() {
    alert('[GIFT MARKETPLACE]\nTelegram gifts trading coming soon!\n\nFeatures:\n- Sell received gifts for STARS\n- Buy rare gifts from other users\n- Secure P2P transactions\n- Instant delivery system');
}

function purchaseListing(listing) {
    if (!userData) return;
    
    const confirmPurchase = confirm(
        `Purchase "${listing.title}"?\n\n` +
        `Price: ${listing.price} ${listing.currency}\n` +
        `Seller: ${listing.seller}\n` +
        `Type: ${listing.type.toUpperCase()}\n\n` +
        `Continue with purchase?`
    );

    if (confirmPurchase) {
        const userBalance = getUserBalance(listing.currency);
        
        if (userBalance >= listing.price) {
            // Списываем средства
            if (listing.currency === 'TON') {
                userData.tonBalance -= listing.price;
            } else if (listing.currency === 'TSAR') {
                userData.tsarBalance -= listing.price;
            } else if (listing.currency === 'STARS') {
                userData.starsBalance -= listing.price;
            }

            updateUserInfo();
            alert(`[PURCHASE COMPLETED]\nYou bought: ${listing.title}\nPaid: ${listing.price} ${listing.currency}\nItem added to your inventory`);
        } else {
            alert(`[ERROR] Insufficient ${listing.currency} balance\nRequired: ${listing.price} ${listing.currency}`);
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

function loadInventory(type = 'items') {
    const inventoryGrid = document.getElementById('inventory-grid');
    if (!inventoryGrid) return;

    // Симуляция предметов
    const items = {
        items: [
            { name: 'Terminal Skin', type: 'cosmetic', rarity: 'rare' },
            { name: 'XP Boost', type: 'consumable', rarity: 'common' },
            { name: 'Lucky Charm', type: 'buff', rarity: 'epic' }
        ],
        nfts: [
            { name: 'Vault Boy NFT', type: 'nft', rarity: 'legendary' },
            { name: 'Wasteland Map', type: 'nft', rarity: 'rare' }
        ],
        gifts: [
            { name: 'Premium Star', type: 'gift', rarity: 'epic' },
            { name: 'Golden Rose', type: 'gift', rarity: 'rare' }
        ]
    };

    const currentItems = items[type] || [];
    
    inventoryGrid.innerHTML = '';
    
    // Создаем 9 слотов
    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        
        if (i < currentItems.length) {
            const item = currentItems[i];
            slot.classList.remove('empty');
            slot.innerHTML = `
                <div class="item-icon">[${item.type.substr(0, 3).toUpperCase()}]</div>
                <div class="item-name">${item.name}</div>
            `;
            slot.style.borderColor = getItemRarityColor(item.rarity);
            slot.style.borderStyle = 'solid';
        } else {
            slot.classList.add('empty');
            slot.textContent = '[EMPTY]';
        }
        
        inventoryGrid.appendChild(slot);
    }
}

function getItemRarityColor(rarity) {
    switch(rarity) {
        case 'common': return '#888888';
        case 'rare': return '#0088cc';
        case 'epic': return '#cc5500';
        case 'legendary': return '#ffcc00';
        default: return 'var(--pipboy-border)';
    }
}

// ===== ФУНКЦИИ РАДИО =====

function sendRadioMessage() {
    const messageInput = document.getElementById('radio-message');
    if (!messageInput || !wastelandRadio) return;
    
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        alert('[ERROR] Message cannot be empty');
        return;
    }

    if (!userData) return;

    try {
        if (messageType === 'anonymous' && userData.tsarBalance < 5000) {
            alert('[ERROR] Insufficient TSAR tokens\nRequired: 5000 TSAR for anonymous messaging');
            return;
        }

        if (messageType === 'sponsored' && userData.tsarBalance < 10000) {
            alert('[ERROR] Insufficient TSAR tokens\nRequired: 10000 TSAR for sponsored posts');
            return;
        }

        if (messageType === 'anonymous') {
            userData.tsarBalance -= 5000;
            alert('[SUCCESS] Anonymous message posted\n5000 TSAR sent to burn address\nYour identity is protected');
        } else if (messageType === 'sponsored') {
            userData.tsarBalance -= 10000;
            alert('[SUCCESS] Sponsored message posted\n10000 TSAR sent to burn address\nYour message will be highlighted');
        }

        wastelandRadio.addMessage(messageText, userData.name, messageType);
        
        messageInput.value = '';
        const counter = document.getElementById('char-counter');
        if (counter) {
            counter.textContent = '0/200';
        }
        
        updateUserInfo();
        loadRadioMessages();
        
    } catch (error) {
        alert('[ERROR] ' + error.message);
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

// ===== ФУНКЦИИ ТОРГОВЛИ =====

function placeBuyOrder() {
    if (!blockchainManager || !blockchainManager.connected) {
        alert('[ERROR] Please connect your wallet first\nUse NUCLEAR CHARGE → CONNECT WALLET');
        return;
    }

    const amountInput = document.getElementById('trade-amount');
    const priceInput = document.getElementById('trade-price');
    
    const amount = amountInput ? parseFloat(amountInput.value) : 0;
    const price = priceInput ? parseFloat(priceInput.value) : 0;
    
    if (!amount || !price || amount <= 0 || price <= 0) {
        alert('[ERROR] Please enter valid amount and price');
        return;
    }

    const total = amount * price;
    
    if (!userData || total > userData.tonBalance) {
        alert('[ERROR] Insufficient TON balance for this order\nRequired: ' + total.toFixed(3) + ' TON');
        return;
    }

    // Резервируем средства
    userData.tonBalance -= total;
    updateUserInfo();

    alert(`[BUY ORDER PLACED]\nAmount: ${amount.toLocaleString()} TSAR\nPrice: ${price} TON each\nTotal: ${total.toFixed(3)} TON\n\nOrder submitted to orderbook\nFunds reserved until execution`);
}

function placeSellOrder() {
    if (!blockchainManager || !blockchainManager.connected) {
        alert('[ERROR] Please connect your wallet first');
        return;
    }

    const amountInput = document.getElementById('trade-amount');
    const priceInput = document.getElementById('trade-price');
    
    const amount = amountInput ? parseFloat(amountInput.value) : 0;
    const price = priceInput ? parseFloat(priceInput.value) : 0;
    
    if (!amount || !price || amount <= 0 || price <= 0) {
        alert('[ERROR] Please enter valid amount and price');
        return;
    }

    if (!userData || amount > userData.tsarBalance) {
        alert('[ERROR] Insufficient TSAR balance for this order\nRequired: ' + amount.toLocaleString() + ' TSAR');
        return;
    }

    // Резервируем токены
    userData.tsarBalance -= amount;
    updateUserInfo();

    const expectedTon = amount * price;
    alert(`[SELL ORDER PLACED]\nAmount: ${amount.toLocaleString()} TSAR\nPrice: ${price} TON each\nExpected: ${expectedTon.toFixed(3)} TON\n\nOrder submitted to orderbook\nTokens reserved until execution`);
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function createClan() {
    const clanName = prompt('Enter clan name (3-20 characters):');
    if (!clanName || clanName.length < 3 || clanName.length > 20) {
        alert('[ERROR] Clan name must be 3-20 characters');
        return;
    }

    if (!userData || userData.tsarBalance < 1000) {
        alert('[ERROR] Insufficient TSAR tokens\nRequired: 1000 TSAR to create clan');
        return;
    }

    userData.tsarBalance -= 1000;
    userData.clan = clanName.toUpperCase();
    updateUserInfo();
    
    alert(`[CLAN CREATED]\nClan: ${userData.clan}\nCost: 1000 TSAR\nYou are now the clan leader!\n\nClan features:\n- Exclusive missions\n- Group activities\n- Shared rewards`);
}

function joinClan() {
    const clanName = prompt('Enter clan name to join:');
    if (!clanName) return;

    // Симуляция поиска клана
    const found = Math.random() > 0.3; // 70% шанс найти клан
    
    if (found) {
        if (userData) {
            userData.clan = clanName.toUpperCase();
            updateUserInfo();
        }
        alert(`[CLAN JOINED]\nWelcome to ${clanName.toUpperCase()}!\n\nYou can now:\n- Participate in clan missions\n- Access clan chat\n- Earn clan bonuses`);
    } else {
        alert(`[CLAN NOT FOUND]\nClan "${clanName}" not found\n\nTips:\n- Check spelling\n- Ask clan leader for exact name\n- Some clans may be private`);
    }
}

function copyReferralLink() {
    const referralLinkElement = document.getElementById('referral-link');
    if (!referralLinkElement) return;
    
    const referralLink = referralLinkElement.textContent;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('[COPIED TO CLIPBOARD]\nReferral link copied successfully!\n\nShare it to earn:\n- 10% from direct referrals\n- 5% from 2nd level\n- 2% from 3rd level');
        }).catch(() => {
            fallbackCopy(referralLink);
        });
    } else {
        fallbackCopy(referralLink);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        alert('[COPIED]\nReferral link copied!\nShare it to earn crypto from referrals');
    } catch (err) {
        alert('[COPY FAILED]\nPlease copy manually:\n' + text);
    }
    
    document.body.removeChild(textArea);
}

function updateCraftingAccess() {
    if (!userData) return;
    
    const hasAccess = userData.tsarBalance >= 500000;
    const craftStatus = document.getElementById('craft-status');
    
    if (craftStatus) {
        if (hasAccess) {
            craftStatus.textContent = 'UNLOCKED';
            craftStatus.style.color = 'var(--pipboy-green)';
            craftStatus.style.textShadow = '0 0 5px var(--pipboy-green)';
        } else {
            craftStatus.textContent = 'LOCKED';
            craftStatus.style.color = 'var(--combat-active)';
            craftStatus.style.textShadow = '0 0 3px var(--combat-active)';
        }
    }
}

function applyTheme(theme) {
    document.body.className = theme === 'classic' ? '' : `theme-${theme}`;
    
    const root = document.documentElement;
    
    switch(theme) {
        case 'amber':
            root.style.setProperty('--pipboy-green', '#ffaa00');
            root.style.setProperty('--pipboy-yellow', '#ff7700');
            root.style.setProperty('--pipboy-border', '#ffaa00');
            break;
        case 'blue':
            root.style.setProperty('--pipboy-green', '#0099ff');
            root.style.setProperty('--pipboy-yellow', '#66ccff');
            root.style.setProperty('--pipboy-border', '#0099ff');
            break;
        case 'red':
            root.style.setProperty('--pipboy-green', '#ff4444');
            root.style.setProperty('--pipboy-yellow', '#ff8888');
            root.style.setProperty('--pipboy-border', '#ff4444');
            break;
        default:
            root.style.setProperty('--pipboy-green', '#00b000');
            root.style.setProperty('--pipboy-yellow', '#ffcc00');
            root.style.setProperty('--pipboy-border', '#009900');
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 RUNNER DOM loaded");
    setTimeout(initApp, 100);
});

// Предотвращаем случайный zoom
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

// Обработка поворота экрана
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});

console.log("🎮 RUNNER Terminal script loaded successfully");