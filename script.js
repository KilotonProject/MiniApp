// RUNNER TERMINAL - Complete Production Version v2.2
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

// Глобальные менеджеры
let audioManager;
let wastelandRadio;
let runnerSystem;
let referralSystem;
let blockchainManager;
let marketplace;
let terminalGame;
let shmupGameManager;
let achievementSystem;
let clanSystem;

// Звуковая система
class RetroAudioManager {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.masterVolume = 0.08;
        this.initialized = false;
        this.soundBank = {};
    }

    async init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }
            this.initialized = true;
            this.createSoundBank();
            console.log("Enhanced audio system initialized");
        } catch (error) {
            console.log("Audio initialization failed:", error);
            this.enabled = false;
        }
    }

    createSoundBank() {
        this.soundBank = {
            beep: { freq: 800, duration: 0.08, type: 'sine' },
            correct: { freq: 600, duration: 0.2, type: 'triangle' },
            incorrect: { freq: 200, duration: 0.3, type: 'sawtooth' },
            shoot: { freq: 1000, duration: 0.05, type: 'square' },
            hit: { freq: 150, duration: 0.15, type: 'sawtooth' },
            powerup: { freq: 800, duration: 0.4, type: 'sine' },
            levelup: { freq: 523, duration: 0.6, type: 'triangle' },
            coin: { freq: 880, duration: 0.2, type: 'sine' }
        };
    }

    playSound(soundName) {
        if (!this.enabled || !this.initialized || !this.context || !soundEnabled) return;
        
        const sound = this.soundBank[soundName] || this.soundBank.beep;
        
        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.type = sound.type;
            osc.frequency.setValueAtTime(sound.freq, this.context.currentTime);
            
            if (soundName === 'powerup' || soundName === 'levelup') {
                osc.frequency.exponentialRampToValueAtTime(sound.freq * 1.5, this.context.currentTime + sound.duration);
            }
            
            gain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + sound.duration);
            
            osc.start();
            osc.stop(this.context.currentTime + sound.duration);
        } catch (e) {
            console.log("Sound error:", e);
        }
    }

    beep() { this.playSound('beep'); }
    playGameSound(type) { this.playSound(type); }
    
    playWelcomeMelody() {
        if (!this.enabled || !this.initialized || !this.context) return;
        
        try {
            const melody = [
                { note: 220, duration: 0.5 },
                { note: 246, duration: 0.5 },
                { note: 261, duration: 0.7 },
                { note: 293, duration: 0.5 },
                { note: 329, duration: 0.5 },
                { note: 261, duration: 1.0 }
            ];
            
            let time = this.context.currentTime + 0.5;
            
            melody.forEach(({ note, duration }) => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                
                osc.connect(gain);
                gain.connect(this.context.destination);
                
                osc.type = 'triangle';
                osc.frequency.value = note;
                
                gain.gain.setValueAtTime(this.masterVolume * 0.4, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
                
                osc.start(time);
                osc.stop(time + duration);
                
                time += duration + 0.1;
            });
        } catch (e) {
            console.log("Melody error:", e);
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

    processEarning(amount, currency) {
        const rates = [0.1, 0.05, 0.02];
        
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
            console.log("TonConnect initialized (simulation mode)");
        } catch (error) {
            console.log("TonConnect initialization failed:", error);
        }
    }

    async connectWallet() {
        try {
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
        const requiredTsar = requiredUsd / tsarPriceUsd;

        if (!userData || userData.tsarBalance < requiredTsar) {
            return { 
                success: false, 
                error: `Insufficient TSAR tokens. Required: ${requiredTsar.toLocaleString()} TSAR ($50 worth)` 
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
                description: 'Unique blue-glow terminal theme with special effects',
                price: 100,
                currency: 'TSAR',
                seller: 'TECH_TRADER_99',
                type: 'cosmetic'
            },
            {
                id: 2,
                title: 'Gaming Guide',
                description: 'Advanced hacking techniques and strategies',
                price: 50,
                currency: 'TSAR',
                seller: 'HACKER_ELITE',
                type: 'guide'
            },
            {
                id: 3,
                title: 'Premium Access Pass',
                description: 'Access to exclusive gaming tournaments',
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

// Система достижений
class AchievementSystem {
    constructor() {
        this.achievements = [
            {
                id: 'first_mission',
                name: 'First Steps',
                description: 'Complete your first mission',
                icon: '[1ST]',
                reward: { amount: 10, currency: 'TSAR' },
                unlocked: false
            },
            {
                id: 'hacker_novice',
                name: 'Novice Hacker',
                description: 'Win 5 terminal hacking games',
                icon: '[HCK]',
                reward: { amount: 50, currency: 'TSAR' },
                unlocked: false,
                progress: 0,
                target: 5
            },
            {
                id: 'space_ace',
                name: 'Space Ace',
                description: 'Score 1000+ in Wasteland Wings',
                icon: '[ACE]',
                reward: { amount: 0.01, currency: 'TON' },
                unlocked: false
            },
            {
                id: 'clan_leader',
                name: 'Clan Leader',
                description: 'Create a clan',
                icon: '[LDR]',
                reward: { amount: 100, currency: 'TSAR' },
                unlocked: false
            },
            {
                id: 'crypto_trader',
                name: 'Crypto Trader',
                description: 'Complete 10 trading orders',
                icon: '[TRD]',
                reward: { amount: 0.05, currency: 'TON' },
                unlocked: false,
                progress: 0,
                target: 10
            },
            {
                id: 'referral_master',
                name: 'Referral Master',
                description: 'Invite 10 active referrals',
                icon: '[REF]',
                reward: { amount: 0.1, currency: 'TON' },
                unlocked: false,
                progress: 0,
                target: 10
            }
        ];
        this.loadProgress();
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('achievements_progress');
            if (saved) {
                const progress = JSON.parse(saved);
                this.achievements.forEach(achievement => {
                    if (progress[achievement.id]) {
                        Object.assign(achievement, progress[achievement.id]);
                    }
                });
            }
        } catch (e) {
            console.log("Failed to load achievements:", e);
        }
    }

    saveProgress() {
        try {
            const progress = {};
            this.achievements.forEach(achievement => {
                progress[achievement.id] = {
                    unlocked: achievement.unlocked,
                    progress: achievement.progress || 0
                };
            });
            localStorage.setItem('achievements_progress', JSON.stringify(progress));
        } catch (e) {
            console.log("Failed to save achievements:", e);
        }
    }

    checkAchievement(id, increment = 1) {
        const achievement = this.achievements.find(a => a.id === id);
        if (!achievement || achievement.unlocked) return;

        if (achievement.target) {
            achievement.progress = (achievement.progress || 0) + increment;
            if (achievement.progress >= achievement.target) {
                this.unlockAchievement(achievement);
            }
        } else {
            this.unlockAchievement(achievement);
        }

        this.saveProgress();
    }

    unlockAchievement(achievement) {
        achievement.unlocked = true;
        
        if (userData && achievement.reward) {
            const reward = achievement.reward;
            if (reward.currency === 'TON') {
                userData.tonBalance += reward.amount;
            } else if (reward.currency === 'TSAR') {
                userData.tsarBalance += reward.amount;
            } else if (reward.currency === 'STARS') {
                userData.starsBalance += reward.amount;
            }
        }

        showAchievementNotification(achievement);
        
        if (audioManager) {
            audioManager.playSound('levelup');
        }

        updateUserInfo();
    }
}

// Fallout-style игра взлома
class TerminalHackingGame {
    constructor() {
        this.difficulty = 'normal';
        this.wordLengths = { easy: 5, normal: 7, hard: 9 };
        this.wordLists = {
            5: ['ABOUT', 'ABOVE', 'AGENT', 'ALARM', 'ALONE', 'ANGER', 'ARMOR', 'BLADE', 'BRAVE', 'BREAK', 'BRING', 'BUILD', 'CHAOS', 'CHARM', 'CLEAN', 'CLEAR', 'CLIMB', 'CLOSE', 'COINS', 'CROWN', 'DANCE', 'DEATH', 'DREAM', 'DRIVE', 'EARTH', 'EMPTY', 'ENEMY', 'ENTRY', 'ERROR', 'FAITH'],
            7: ['ABILITY', 'ANCIENT', 'ARCHIVE', 'BALANCE', 'BATTERY', 'BENEFIT', 'BICYCLE', 'CAPTAIN', 'CHAMBER', 'CIRCUIT', 'CLASSES', 'COMMAND', 'COMPLEX', 'CONCEPT', 'CONFORM', 'CONTENT', 'CONTROL', 'COUNTRY', 'CURRENT', 'CUSTOMS', 'DIAGRAM', 'DIGITAL', 'DYNAMIC', 'ECONOMY', 'ELEMENT', 'EMPEROR', 'ENHANCE', 'EVENING', 'EXAMPLE', 'FACTORY'],
            9: ['ABANDONED', 'ADVENTURE', 'ALGORITHM', 'AMBULANCE', 'BENCHMARK', 'BIOGRAPHY', 'BREAKFAST', 'CALCULATE', 'CATALOGUE', 'CHARACTER', 'CHEMISTRY', 'COMMUNITY', 'DEMOCRACY', 'DIRECTORY', 'EDUCATION', 'ELEVATION', 'EMERGENCY', 'EQUIPMENT', 'EVERYBODY', 'EXISTENCE', 'FRAMEWORK', 'GUARANTEE', 'HAPPENING', 'HISTOGRAM', 'KNOWLEDGE', 'LANDSCAPE', 'MACHINERY', 'NIGHTMARE', 'OPERATION', 'PROFESSOR']
        };
        this.currentWords = [];
        this.correctWord = '';
        this.attemptsLeft = 4;
        this.hexData = [];
        this.gameActive = false;
        this.isMultiplayer = false;
        this.playerTurn = true;
        this.opponentAttempts = 4;
        this.hintsUsed = 0;
        this.timeStarted = 0;
    }

    startGame(mode = 'solo', difficulty = 'normal') {
        console.log(`Starting terminal hacking: ${mode} mode, ${difficulty} difficulty`);
        
        this.difficulty = difficulty;
        this.isMultiplayer = mode === 'multiplayer';
        this.attemptsLeft = 4;
        this.opponentAttempts = 4;
        this.playerTurn = true;
        this.gameActive = true;
        this.hintsUsed = 0;
        this.timeStarted = Date.now();

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

        const wordCount = this.difficulty === 'easy' ? 15 : this.difficulty === 'normal' ? 17 : 20;
        
        for (let i = 0; i < wordCount && wordPool.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * wordPool.length);
            this.currentWords.push(wordPool.splice(randomIndex, 1)[0]);
        }

        this.correctWord = this.currentWords[Math.floor(Math.random() * this.currentWords.length)];
        console.log(`Correct password: ${this.correctWord}`);
    }

    generateHexDump() {
        this.hexData = [];
        const chars = '0123456789ABCDEF';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`';
        
        let wordsToPlace = [...this.currentWords];
        const lineCount = this.difficulty === 'easy' ? 20 : this.difficulty === 'normal' ? 25 : 30;
        
        for (let line = 0; line < lineCount; line++) {
            let hexLine = '';
            let dataLine = '';
            
            const address = (0xF000 + line * 16).toString(16).toUpperCase().padStart(4, '0');
            hexLine += `0x${address} `;
            
            for (let i = 0; i < 16; i++) {
                hexLine += chars[Math.floor(Math.random() * chars.length)];
                if (i % 2 === 1) hexLine += ' ';
            }
            
            let charCount = 0;
            const lineLength = 12;
            
            while (charCount < lineLength) {
                const remainingSpace = lineLength - charCount;
                
                if (wordsToPlace.length > 0 && Math.random() < 0.4) {
                    const availableWords = wordsToPlace.filter(word => word.length <= remainingSpace);
                    if (availableWords.length > 0) {
                        const wordIndex = wordsToPlace.findIndex(word => 
                            availableWords.includes(word)
                        );
                        const word = wordsToPlace.splice(wordIndex, 1)[0];
                        dataLine += word;
                        charCount += word.length;
                        continue;
                    }
                }
                
                const hintChance = this.difficulty === 'easy' ? 0.15 : this.difficulty === 'normal' ? 0.12 : 0.08;
                if (Math.random() < hintChance && remainingSpace >= 2) {
                    const brackets = ['()', '[]', '{}', '<>'];
                    const bracket = brackets[Math.floor(Math.random() * brackets.length)];
                    dataLine += bracket;
                    charCount += 2;
                } else {
                    dataLine += symbols[Math.floor(Math.random() * symbols.length)];
                    charCount++;
                }
            }
            
            this.hexData.push({
                address: `0x${address}`,
                hex: hexLine,
                data: dataLine
            });
        }

        while (wordsToPlace.length > 0) {
            const word = wordsToPlace.shift();
            const randomLine = Math.floor(Math.random() * this.hexData.length);
            const line = this.hexData[randomLine];
            
            const availableSpaces = [];
            for (let i = 0; i <= line.data.length - word.length; i++) {
                const canFit = line.data.substr(i, word.length).split('').every(char => 
                    symbols.includes(char) || char === ' '
                );
                if (canFit) {
                    availableSpaces.push(i);
                }
            }
            
            if (availableSpaces.length > 0) {
                const insertPos = availableSpaces[Math.floor(Math.random() * availableSpaces.length)];
                line.data = line.data.substring(0, insertPos) + word + 
                           line.data.substring(insertPos + word.length);
            }
        }
    }

    renderTerminal() {
        const hexDump = document.getElementById('hex-dump');
        if (!hexDump) return;

        hexDump.innerHTML = this.hexData.map((line, index) => {
            let processedData = line.data;
            
            this.currentWords.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'g');
                processedData = processedData.replace(regex, 
                    `<span class="password-word" data-word="${word}">${word}</span>`
                );
            });

            processedData = processedData.replace(/[\(\)\[\]\{\}<>]{2}/g, match => {
                return `<span class="bracket-hint" data-hint="remove-dud">${match}</span>`;
            });

            return `<div class="hex-line" data-line="${index}">
                <span class="hex-address">${line.address}</span> 
                <span class="hex-bytes">${line.hex}</span> 
                <span class="hex-ascii">${processedData}</span>
            </div>`;
        }).join('');

        this.attachTerminalHandlers();
    }

    attachTerminalHandlers() {
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
        this.addLogEntry('> Please wait while system', 'success');
        this.addLogEntry('> grants access...', 'success');
        
        if (audioManager) {
            audioManager.playSound('correct');
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
            audioManager.playSound('incorrect');
        }

        if (this.attemptsLeft <= 0) {
            this.addLogEntry('> Terminal locked', 'error');
            this.endGame(false);
        } else if (this.isMultiplayer) {
            this.playerTurn = false;
            this.updateTurnIndicator();
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
        
        this.hintsUsed++;
        
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
            audioManager.playSound('powerup');
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
                !document.querySelector(`[data-word="${word}"]`).classList.contains('incorrect')
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
                        this.updateTurnIndicator();
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

        if (log.children.length > 20) {
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
        
        if (turnText) {
            if (this.playerTurn) {
                turnText.textContent = 'YOUR TURN';
                turnText.style.color = 'var(--pipboy-yellow)';
            } else {
                turnText.textContent = 'OPPONENT TURN';
                turnText.style.color = 'var(--combat-active)';
            }
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
        this.addLogEntry('> Establishing secure connection...', 'system');
        
        setTimeout(() => {
            this.addLogEntry('> Opponent connected: VAULT_DWELLER_' + Math.floor(Math.random() * 1000), 'system');
            this.addLogEntry('> Match commenced!', 'system');
            this.updateTurnIndicator();
        }, 2500);
    }

    endGame(won) {
        this.gameActive = false;
        
        if (!userData) return;
        
        const baseReward = this.isMultiplayer ? 100 : 50;
        const totalReward = won ? baseReward : Math.floor(baseReward * 0.3);
        
        userData.bottleCaps += totalReward;
        
        if (this.isMultiplayer && won && currentStake) {
            const winnings = currentStake.amount * 1.85;
            if (currentStake.currency === 'TON') {
                userData.tonBalance += winnings;
            } else if (currentStake.currency === 'TSAR') {
                userData.tsarBalance += winnings;
            }
        }

        if (achievementSystem && won) {
            achievementSystem.checkAchievement('hacker_novice');
        }

        updateUserInfo();

        setTimeout(() => {
            let resultMessage = won ? 
                `[ACCESS GRANTED!]\nTerminal unlocked!\n+${totalReward} Bottle Caps` : 
                `[ACCESS DENIED!]\nTerminal locked!\n+${totalReward} Bottle Caps`;
            
            if (this.isMultiplayer && won && currentStake) {
                const winnings = currentStake.amount * 1.85;
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

// Космические стрелялки
class ShmupGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameActive = false;
        this.player = { 
            x: 150, y: 350, width: 24, height: 24, 
            lives: 3, speed: 6, fireRate: 200, lastShot: 0,
            powerLevel: 1, shield: 0
        };
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.particles = [];
        this.score = 0;
        this.level = 1;
        this.gameLoop = null;
        this.enemySpawner = null;
        this.powerupSpawner = null;
        this.isMultiplayer = false;
        this.opponentScore = 0;
        this.waveNumber = 1;
        this.enemiesKilled = 0;
        this.bossActive = false;
    }

    init() {
        this.canvas = document.getElementById('shmup-canvas');
        if (!this.canvas) {
            console.log("Shmup canvas not found");
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 300;
        this.canvas.height = 400;
        
        console.log("Shmup game initialized");
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
        this.level = 1;
        this.waveNumber = 1;
        this.enemiesKilled = 0;
        
        this.player = { 
            x: 138, y: 350, width: 24, height: 24, 
            lives: 3, speed: 6, fireRate: 200, lastShot: 0,
            powerLevel: 1, shield: 0
        };
        
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.particles = [];

        this.updateShmupUI();
        
        this.gameLoop = setInterval(() => this.update(), 1000/60);
        this.enemySpawner = setInterval(() => this.spawnEnemy(), 1500);
        this.powerupSpawner = setInterval(() => this.spawnPowerup(), 8000);

        if (this.isMultiplayer) {
            this.startMultiplayerShmup();
        }
    }

    update() {
        if (!this.gameActive || !this.ctx) return;

        this.clearCanvas();
        this.drawBackground();
        this.updateBullets();
        this.updateEnemies();
        this.updatePowerups();
        this.updateParticles();
        this.checkCollisions();
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawPowerups();
        this.drawParticles();
        this.drawUI();
    }

    clearCanvas() {
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const speed = (i % 3) + 1;
            const x = (i * 7) % this.canvas.width;
            const y = (i * 11 + Date.now() * speed * 0.02) % this.canvas.height;
            const size = speed > 2 ? 2 : 1;
            this.ctx.fillRect(x, y, size, size);
        }
    }

    drawPlayer() {
        const p = this.player;
        
        this.ctx.fillStyle = '#00b000';
        this.ctx.fillRect(p.x + 4, p.y, p.width - 8, p.height);
        
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillRect(p.x + 8, p.y + 4, p.width - 16, p.height - 8);
        
        this.ctx.fillStyle = '#008800';
        this.ctx.fillRect(p.x, p.y + 8, 6, 12);
        this.ctx.fillRect(p.x + p.width - 6, p.y + 8, 6, 12);
        
        if (p.shield > 0) {
            this.ctx.strokeStyle = '#00aaff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2 + 8, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawBullets() {
        this.bullets.forEach(bullet => {
            if (bullet.type === 'player') {
                this.ctx.fillStyle = '#ffcc00';
                this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            } else {
                this.ctx.fillStyle = '#cc3333';
                this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            }
        });
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy.type === 'boss') {
                this.ctx.fillStyle = '#cc3333';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                this.ctx.fillStyle = '#ff6666';
                this.ctx.fillRect(enemy.x + 4, enemy.y + 4, enemy.width - 8, enemy.height - 8);
            } else {
                this.ctx.fillStyle = enemy.type === 'fast' ? '#cc7700' : '#cc5500';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        });
    }

    drawPowerups() {
        this.powerups.forEach(powerup => {
            this.ctx.fillStyle = powerup.color;
            this.ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(powerup.icon, powerup.x + powerup.width/2, powerup.y + powerup.height/2 + 4);
            this.ctx.textAlign = 'left';
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        this.ctx.globalAlpha = 1;
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
            if (bullet.type === 'player') {
                bullet.y -= 10;
                return bullet.y > -bullet.height;
            } else {
                bullet.y += 5;
                return bullet.y < this.canvas.height;
            }
        });
    }

    updateEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            enemy.y += enemy.speed;
            return enemy.y < this.canvas.height + 50;
        });
    }

    updatePowerups() {
        this.powerups = this.powerups.filter(powerup => {
            powerup.y += 3;
            return powerup.y < this.canvas.height;
        });
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            return particle.life > 0;
        });
    }

    spawnEnemy() {
        if (!this.gameActive) return;

        const enemy = {
            x: Math.random() * (this.canvas.width - 24),
            y: -24,
            width: 20,
            height: 20,
            speed: 2 + Math.random() * 1.5,
            health: 1,
            type: 'normal',
            points: 10
        };

        this.enemies.push(enemy);
    }

    spawnPowerup() {
        if (!this.gameActive || Math.random() < 0.7) return;

        const powerupTypes = [
            { type: 'health', color: '#00ff00', icon: '+' },
            { type: 'weapon', color: '#ffcc00', icon: 'W' },
            { type: 'shield', color: '#00aaff', icon: 'S' }
        ];

        const powerupType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];

        const powerup = {
            x: Math.random() * (this.canvas.width - 20),
            y: -20,
            width: 20,
            height: 20,
            type: powerupType.type,
            color: powerupType.color,
            icon: powerupType.icon
        };

        this.powerups.push(powerup);
    }

    shoot() {
        if (!this.gameActive) return;
        
        const now = Date.now();
        if (now - this.player.lastShot < this.player.fireRate) return;
        
        this.player.lastShot = now;

        const bullet = {
            x: this.player.x + this.player.width / 2 - 1.5,
            y: this.player.y,
            width: 3,
            height: 8,
            type: 'player'
        };

        this.bullets.push(bullet);
        
        if (audioManager) {
            audioManager.playSound('shoot');
        }
    }

    movePlayer(direction) {
        if (!this.gameActive) return;

        const speed = this.player.speed;
        
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
                this.player.y = Math.min(this.canvas.height - this.player.height - 20, this.player.y + speed);
                break;
        }
    }

    checkCollisions() {
        this.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.type !== 'player') return;
            
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    
                    enemy.health--;
                    if (enemy.health <= 0) {
                        this.enemies.splice(enemyIndex, 1);
                        this.score += enemy.points;
                        this.enemiesKilled++;
                        
                        this.createExplosionParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                        
                        if (audioManager) {
                            audioManager.playSound('hit');
                        }
                        
                        if (Math.random() < 0.15) {
                            this.spawnPowerup();
                        }
                    }
                }
            });
        });

        this.enemies.forEach((enemy, enemyIndex) => {
            if (this.isColliding(this.player, enemy)) {
                this.enemies.splice(enemyIndex, 1);
                this.damagePlayer();
            }
        });

        this.powerups.forEach((powerup, powerupIndex) => {
            if (this.isColliding(this.player, powerup)) {
                this.powerups.splice(powerupIndex, 1);
                this.applyPowerup(powerup);
                
                if (audioManager) {
                    audioManager.playSound('powerup');
                }
            }
        });

        this.updateShmupUI();
    }

    damagePlayer() {
        if (this.player.shield > 0) {
            this.player.shield--;
        } else {
            this.player.lives--;
        }
        
        if (audioManager) {
            audioManager.playSound('hit');
        }

        if (this.player.lives <= 0) {
            this.endShmupGame();
        }
    }

    applyPowerup(powerup) {
        switch(powerup.type) {
            case 'health':
                this.player.lives = Math.min(3, this.player.lives + 1);
                break;
            case 'weapon':
                this.player.powerLevel = Math.min(3, this.player.powerLevel + 1);
                this.player.fireRate = Math.max(100, this.player.fireRate - 50);
                break;
            case 'shield':
                this.player.shield += 3;
                break;
        }
    }

    createExplosionParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 2 + Math.random() * 3,
                color: ['#ff6600', '#ffcc00', '#ff3333'][Math.floor(Math.random() * 3)],
                life: 1
            });
        }
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
                this.opponentScore += Math.floor(Math.random() * 30) + 10;
            } else {
                clearInterval(opponentSimulator);
            }
        }, 2000);
    }

    endShmupGame() {
        this.gameActive = false;
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.enemySpawner) clearInterval(this.enemySpawner);
        if (this.powerupSpawner) clearInterval(this.powerupSpawner);

        if (!userData) return;

        const reward = Math.floor(this.score / 10);
        userData.bottleCaps += reward;

        let resultMessage = `[MISSION COMPLETE!]\nScore: ${this.score}\n+${reward} Bottle Caps`;

        if (this.isMultiplayer) {
            const won = this.score > this.opponentScore;
            resultMessage += `\nOpponent: ${this.opponentScore}\n${won ? 'VICTORY!' : 'DEFEAT'}`;
            
            if (won && currentStake) {
                const winnings = currentStake.amount * 1.85;
                if (currentStake.currency === 'TON') {
                    userData.tonBalance += winnings;
                } else if (currentStake.currency === 'TSAR') {
                    userData.tsarBalance += winnings;
                }
                resultMessage += `\n+${winnings} ${currentStake.currency}`;
            }
        }

        if (achievementSystem && this.score >= 1000) {
            achievementSystem.checkAchievement('space_ace');
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
        this.level = 1;
        this.player.lives = 3;
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.particles = [];
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.enemySpawner) clearInterval(this.enemySpawner);
        if (this.powerupSpawner) clearInterval(this.powerupSpawner);
        
        this.updateShmupUI();
        
        hideAllScreens();
        document.getElementById('main-screen').classList.add('active');
        showSection('gameboy');
    }
}

// Инициализация
let initStarted = false;

function initApp() {
    if (initStarted) return;
    initStarted = true;
    
    console.log("🚀 Initializing RUNNER terminal...");
    
    audioManager = new RetroAudioManager();
    wastelandRadio = new WastelandRadio();
    runnerSystem = new RunnerMissionSystem();
    referralSystem = new ReferralSystem();
    blockchainManager = new BlockchainManager();
    marketplace = new MarketplaceSystem();
    terminalGame = new TerminalHackingGame();
    shmupGameManager = new ShmupGame();
    achievementSystem = new AchievementSystem();
    
    loadUserData();
    generateReferralCode();
    setupAllEventHandlers();
    loadRadioMessages();
    loadMarketListings();
    loadRunnerMissions();
    
    blockchainManager.initTonConnect();
    
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    addAchievementStyles();
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

    const balanceDisplay = document.getElementById('balance-display');
    const capsDisplay = document.getElementById('caps-display');
    
    if (balanceDisplay) balanceDisplay.textContent = `TON: ${userData.tonBalance.toFixed(3)}`;
    if (capsDisplay) capsDisplay.textContent = `CAPS: ${userData.bottleCaps}`;
    
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
    
    const initAudio = () => {
        if (audioManager) {
            audioManager.init().then(() => {
                setTimeout(() => audioManager.playWelcomeMelody(), 1000);
            });
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
    
    if (!menuBtn || !closeBtn || !nav) return;
    
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

    const otherGames = ['chess-btn', 'battle-arena-btn'];
    otherGames.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (audioManager) audioManager.beep();
                alert(`[GAME]\nComing in future updates!`);
            });
        }
    });

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
            if (shootInterval) clearInterval(shootInterval);
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

            let moveInterval;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                moveInterval = setInterval(() => {
                    if (shmupGameManager) shmupGameManager.movePlayer(direction);
                }, 50);
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (moveInterval) clearInterval(moveInterval);
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
                alert('[WALLET] Disconnected successfully');
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

    const animationToggle = document.getElementById('animation-toggle');
    if (animationToggle) {
        animationToggle.addEventListener('click', (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            const enabled = e.target.classList.contains('active');
            e.target.classList.toggle('active', !enabled);
            e.target.textContent = enabled ? 'OFF' : 'ON';
        });
    }

    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            if (audioManager) audioManager.beep();
            alert(`[LANGUAGE] Changed to ${e.target.value.toUpperCase()}`);
        });
    }

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            if (userData && userData.tsarBalance >= 10000) {
                if (audioManager) audioManager.beep();
                applyTheme(e.target.value);
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
            
            const tab = btn.getAttribute('data-tab');
            loadMarketListings(tab);
        });
    });

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
        terminalGame.startGame(mode, 'normal');
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

function findMultiplayerGame() {
    alert('[FIND GAME]\nLooking for available games...\nFeature in development!');
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

                    if (achievementSystem) {
                        achievementSystem.checkAchievement('first_mission');
                    }
                    
                    updateUserInfo();
                    loadRunnerMissions();
                }
            } else {
                alert('[MISSION FAILED]\nTask verification failed.');
            }
        }, 5000 + Math.random() * 10000);
    } else {
        alert(`[ERROR] ${result.error}`);
    }
}

function openMissionCreator() {
    if (!userData || userData.tsarBalance < 350000) {
        alert('[ACCESS DENIED]\nRequired: 350,000 TSAR');
        return;
    }

    const title = prompt('Mission title:');
    if (!title) return;

    const description = prompt('Description:');
    if (!description) return;

    const rewardAmount = prompt('Reward amount:');
    const reward = parseFloat(rewardAmount);
    if (!reward || reward <= 0) {
        alert('[ERROR] Invalid reward');
        return;
    }

    const currency = prompt('Currency (TON/TSAR/STARS):').toUpperCase();
    if (!['TON', 'TSAR', 'STARS'].includes(currency)) {
        alert('[ERROR] Invalid currency');
        return;
    }

    const type = prompt('Type (telegram/social/trading/gaming):').toLowerCase();
    if (!['telegram', 'social', 'trading', 'gaming'].includes(type)) {
        alert('[ERROR] Invalid type');
        return;
    }

    const budget = parseFloat(prompt('Budget (TSAR):'));
    if (!budget || budget < 1000) {
        alert('[ERROR] Minimum budget: 1000 TSAR');
        return;
    }

    const missionData = {
        title, description,
        reward: { amount: reward, currency },
        type, totalBudget: budget
    };

    const result = runnerSystem.createMission(missionData);
    
    if (result.success) {
        alert(`[MISSION CREATED!]\n${title}\nReward: ${reward} ${currency}`);
        updateUserInfo();
        loadRunnerMissions();
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

// Функции кошелька
function handleDeposit() {
    if (!blockchainManager || !blockchainManager.connected) {
        alert('[ERROR] Connect wallet first');
        return;
    }
    
    const address = blockchainManager.userWallet.account.address;
    alert(`[DEPOSIT]\nSend TON to:\n${address.substr(0, 20)}...\n\nMinimum: 0.01 TON`);
}

function handleWithdraw() {
    if (!blockchainManager || !blockchainManager.connected) {
        alert('[ERROR] Connect wallet first');
        return;
    }

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

// Функции рынка
function loadMarketListings(type = 'listings') {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer || !marketplace) return;
    
    const listings = marketplace.getAllListings(type);
    
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

function createNFTListing() {
    alert('[NFT MARKETPLACE]\nComing soon!\nTrade NFTs for STARS');
}

function createGiftListing() {
    alert('[GIFT MARKETPLACE]\nComing soon!\nSell Telegram gifts');
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

// Функции радио
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

// Функции торговли
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

// Вспомогательные функции
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
    
    if (achievementSystem) {
        achievementSystem.checkAchievement('clan_leader');
    }
    
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
            alert('[COPIED]\nReferral link copied!\nEarn 10% from referrals');
        });
    } else {
        alert(`[COPY MANUALLY]\n${referralLink}`);
    }
}

function loadInventory(type = 'items') {
    const inventoryGrid = document.getElementById('inventory-grid');
    if (!inventoryGrid) return;

    const items = {
        items: [
            { name: 'Terminal Skin', type: 'cosmetic', rarity: 'rare' },
            { name: 'XP Boost', type: 'consumable', rarity: 'common' }
        ],
        nfts: [
            { name: 'Vault Boy NFT', type: 'nft', rarity: 'legendary' }
        ],
        gifts: [
            { name: 'Premium Star', type: 'gift', rarity: 'epic' }
        ]
    };

    const currentItems = items[type] || [];
    inventoryGrid.innerHTML = '';
    
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

function updateCraftingAccess() {
    if (!userData) return;
    
    const hasAccess = userData.tsarBalance >= 500000;
    const craftStatus = document.getElementById('craft-status');
    
    if (craftStatus) {
        craftStatus.textContent = hasAccess ? 'UNLOCKED' : 'LOCKED';
        craftStatus.style.color = hasAccess ? 'var(--pipboy-green)' : 'var(--combat-active)';
    }
}

function applyTheme(theme) {
    const root = document.documentElement;
    
    switch(theme) {
        case 'amber':
            root.style.setProperty('--pipboy-green', '#ffaa00');
            root.style.setProperty('--pipboy-yellow', '#ff7700');
            break;
        case 'blue':
            root.style.setProperty('--pipboy-green', '#0099ff');
            root.style.setProperty('--pipboy-yellow', '#66ccff');
            break;
        case 'red':
            root.style.setProperty('--pipboy-green', '#ff4444');
            root.style.setProperty('--pipboy-yellow', '#ff8888');
            break;
        default:
            root.style.setProperty('--pipboy-green', '#00b000');
            root.style.setProperty('--pipboy-yellow', '#ffcc00');
    }
}

function addAchievementStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes achievementSlide {
            0% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
            10% { transform: translateX(-50%) translateY(0); opacity: 1; }
            90% { transform: translateX(-50%) translateY(0); opacity: 1; }
            100% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        }
        
        .achievement-notification {
            position: fixed !important;
            top: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: rgba(0, 176, 0, 0.9) !important;
            border: 2px solid var(--pipboy-yellow) !important;
            border-radius: 8px !important;
            padding: 15px !important;
            z-index: 2000 !important;
            color: var(--pipboy-yellow) !important;
            font-family: 'Monofonto', 'Courier New', monospace !important;
            animation: achievementSlide 4s ease-out forwards !important;
            box-shadow: 0 0 20px rgba(255, 204, 0, 0.5) !important;
        }
    `;
    document.head.appendChild(style);
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 1.2rem; margin-bottom: 5px;">${achievement.icon} ACHIEVEMENT UNLOCKED</div>
            <div style="font-weight: bold; margin-bottom: 3px;">${achievement.name}</div>
            <div style="font-size: 0.8rem; margin-bottom: 5px;">${achievement.description}</div>
            <div style="color: var(--pipboy-green);">+${achievement.reward.amount} ${achievement.reward.currency}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
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

window.addEventListener('orientationchange', function() {
    setTimeout(() => window.scrollTo(0, 0), 100);
});

console.log("🎮 RUNNER Terminal script loaded");