/* ================================================================
   RUNNER Terminal v3.0 - Real TSAR Token Integration
   TSAR Contract: EQBKLYdv3bEce0nfo__qbmIK2UOCN-ShzobnlhKUOSytWg6o
   ================================================================ */

// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    // CAPS Economy (виртуальная валюта для игр)
    CAPS_TOTAL_SUPPLY: 1000000000,    // 1 миллиард CAPS
    CAPS_INITIAL_AMOUNT: 1000,        // Начальные CAPS
    CAPS_EARNING_MULTIPLIER: 1.0,     // Множитель заработка CAPS
    
    // TSAR Token (реальный TON токен)
    TSAR_CONTRACT: 'EQBKLYdv3bEce0nfo__qbmIK2UOCN-ShzobnlhKUOSytWg6o',
    TSAR_DECIMALS: 9,                 // Decimals TSAR токена
    TSAR_NOT_EARNABLE: true,          // TSAR нельзя заработать в играх!
    
    // TSAR Privilege Tiers
    TSAR_TIERS: {
        BASIC: 0,                     // Базовый уровень
        SILVER: 10000,                // 10K TSAR - анонимные сообщения
        GOLD: 20000,                  // 20K TSAR - спонсорские + фьючерсы
        DIAMOND: 50000                // 50K TSAR - кастомные игры + листинги
    },
    
    // Radio Costs (только TSAR!)
    RADIO_COSTS: {
        public: 0,                    // Бесплатно
        anonymous: 10000,             // 10K TSAR
        sponsored: 20000              // 20K TSAR
    },
    
    // Games (награды только CAPS!)
    GAME_REWARDS: {
        'terminal-hacking': { min: 50, max: 200 },
        'wasteland-wings': { min: 100, max: 500 },
        'cyber-duel': { min: 200, max: 1000 }
    },
    
    // Trading (CAPS отдельно от TSAR)
    CAPS_TRADING_FEE: 0.001,          // 0.1% комиссия
    MIN_CAPS_TRADE: 10,               // Минимум 10 CAPS
    
    // Referrals (только CAPS!)
    REFERRAL_REWARD_CAPS: 2500,       // 2500 CAPS за реферала
    
    // Updates
    PRICE_UPDATE_INTERVAL: 3000,
    RADIO_UPDATE_INTERVAL: 15000,
    
    // Telegram
    BOT_USERNAME: 'kiloton_runner_terminal_bot',
    
    // API
    TON_API_URL: 'https://toncenter.com/api/v2',
    DTON_API_URL: 'https://dton.io/graphql'
};

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let userData = null;
let gameActive = false;
let messageType = 'public';
let soundEnabled = true;
let currentGame = null;

// Системы
let audioManager;
let capsEconomy;
let tsarManager;
let wastelandRadio;
let terminalGame;
let wingsGame;
let cyberDuel;
let missionSystem;
let chartEngine;

// ===== УПРАВЛЕНИЕ АУДИО =====
class AudioManager {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.masterVolume = 0.1;
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
            console.log("🔊 Audio system online");
        } catch (error) {
            console.warn("⚠️ Audio unavailable:", error);
            this.enabled = false;
        }
    }

    playSound(frequency, duration = 0.1, type = 'sine') {
        if (!this.enabled || !this.initialized || !this.context || !soundEnabled) return;
        
        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.type = type;
            osc.frequency.value = frequency;
            
            gain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            osc.start();
            osc.stop(this.context.currentTime + duration);
        } catch (e) {
            console.warn("Audio playback failed:", e);
        }
    }

    // Игровые звуки
    beep() { this.playSound(800, 0.1); }
    success() { this.playSound(600, 0.3); }
    error() { this.playSound(200, 0.3); }
    shoot() { this.playSound(1000, 0.1, 'sawtooth'); }
    explosion() { this.playSound(150, 0.5, 'square'); }
    powerup() { this.playSound(1200, 0.4); }
    click() { this.playSound(400, 0.05); }
}

// ===== CAPS ЭКОНОМИКА (ВИРТУАЛЬНАЯ) =====
class CapsEconomy {
    constructor() {
        this.totalSupply = CONFIG.CAPS_TOTAL_SUPPLY;
        this.circulatingSupply = 0;
        this.priceInTon = 0.00001; // Базовая цена CAPS в TON
        this.volume24h = 0;
        this.holders = 0;
        
        this.initializeEconomy();
        this.startEconomyUpdates();
    }
    
    initializeEconomy() {
        // Инициализируем экономику
        this.circulatingSupply = Math.floor(this.totalSupply * 0.1); // 10% в обороте
        this.holders = Math.floor(Math.random() * 10000) + 5000;
        this.volume24h = Math.floor(Math.random() * 1000000) + 500000;
    }
    
    startEconomyUpdates() {
        setInterval(() => {
            this.updateMarketData();
            this.updateDisplays();
        }, CONFIG.PRICE_UPDATE_INTERVAL);
    }
    
    updateMarketData() {
        // Симуляция рыночной активности
        const volatility = 0.02; // 2% волатильность
        const change = (Math.random() - 0.5) * volatility;
        this.priceInTon = Math.max(this.priceInTon * (1 + change), 0.000001);
        
        // Обновляем объем торгов
        this.volume24h += Math.floor(Math.random() * 10000);
        
        // Иногда добавляем новых держателей
        if (Math.random() < 0.1) {
            this.holders += Math.floor(Math.random() * 10) + 1;
        }
    }
    
    updateDisplays() {
        // Обновляем все элементы с данными CAPS
        const updates = {
            'caps-price-main': `${this.priceInTon.toFixed(8)} TON`,
            'dash-caps-price': this.priceInTon.toFixed(8),
            'trading-volume-display': this.formatNumber(this.volume24h),
            'caps-rank': `#${this.calculateUserRank()}`
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Обновляем изменение цены
        this.updatePriceChange();
    }
    
    updatePriceChange() {
        // Симулируем изменение цены за 24 часа
        const change = (Math.random() - 0.4) * 10; // Склонность к росту
        const changeElements = ['dash-price-change', 'trading-change'];
        const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        const changeClass = change >= 0 ? 'positive' : 'negative';
        
        changeElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = changeText;
                element.className = `price-change ${changeClass}`;
            }
        });
    }
    
    calculateUserRank() {
        if (!userData) return '∞';
        
        // Примерный расчет ранга на основе CAPS
        const rank = Math.max(1, 50000 - Math.floor(userData.capsBalance / 20));
        return rank;
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.floor(num).toLocaleString();
    }
    
    // Получение CAPS (только через игры и активности)
    earnCaps(amount, reason = 'game') {
        if (!userData) return false;
        
        const finalAmount = Math.floor(amount * CONFIG.CAPS_EARNING_MULTIPLIER);
        userData.capsBalance += finalAmount;
        userData.totalCapsEarned = (userData.totalCapsEarned || 0) + finalAmount;
        
        this.saveUserData();
        this.updateUserDisplays();
        
        console.log(`💰 Earned ${finalAmount} CAPS from ${reason}`);
        return finalAmount;
    }
    
    spendCaps(amount, reason = 'purchase') {
        if (!userData || userData.capsBalance < amount) return false;
        
        userData.capsBalance -= amount;
        this.saveUserData();
        this.updateUserDisplays();
        
        console.log(`💸 Spent ${amount} CAPS on ${reason}`);
        return true;
    }
    
    saveUserData() {
        saveUserData();
    }
    
    updateUserDisplays() {
        updateUserDisplay();
    }
}

// ===== TSAR МЕНЕДЖЕР (РЕАЛЬНЫЙ ТОКЕН) =====
class TsarManager {
    constructor() {
        this.contractAddress = CONFIG.TSAR_CONTRACT;
        this.decimals = CONFIG.TSAR_DECIMALS;
        this.realTimePrice = 0;
        this.connected = false;
        this.userTsarBalance = 0;
        
        this.initializeTsarData();
    }
    
    initializeTsarData() {
        // Загружаем данные TSAR токена
        this.loadTsarPrice();
        this.checkUserTsarBalance();
    }
    
    async loadTsarPrice() {
        try {
            // Здесь должен быть реальный API запрос к TON blockchain
            // Пока используем заглушку
            this.realTimePrice = 0.001 + Math.random() * 0.0005; // ~0.001 TON
            console.log(`📈 TSAR price loaded: ${this.realTimePrice.toFixed(6)} TON`);
        } catch (error) {
            console.warn("⚠️ Failed to load TSAR price:", error);
            this.realTimePrice = 0.001; // Fallback цена
        }
    }
    
    async checkUserTsarBalance() {
        // Здесь должна быть проверка реального баланса через TON API
        // Пока используем локальные данные
        if (userData && userData.tsarBalance) {
            this.userTsarBalance = userData.tsarBalance;
        }
        
        this.updateTsarDisplays();
        this.updatePrivileges();
    }
    
    updateTsarDisplays() {
        const elements = {
            'header-tsar': this.formatTsarAmount(this.userTsarBalance),
            'tsar-display': this.formatTsarAmount(this.userTsarBalance),
            'tsar-main-balance': this.formatTsarAmount(this.userTsarBalance),
            'dash-tsar': this.formatTsarAmount(this.userTsarBalance)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    
    updatePrivileges() {
        const tsarAmount = this.userTsarBalance;
        
        // Определяем уровень привилегий
        let tier = 'BASIC';
        if (tsarAmount >= CONFIG.TSAR_TIERS.DIAMOND) tier = 'DIAMOND';
        else if (tsarAmount >= CONFIG.TSAR_TIERS.GOLD) tier = 'GOLD';
        else if (tsarAmount >= CONFIG.TSAR_TIERS.SILVER) tier = 'SILVER';
        
        // Обновляем статус
        const statusElement = document.getElementById('tsar-status');
        if (statusElement) {
            statusElement.textContent = `${tier} MEMBER`;
        }
        
        // Обновляем доступные функции
        this.updateFeatureAccess(tsarAmount);
        
        console.log(`⭐ TSAR tier updated: ${tier} (${tsarAmount} TSAR)`);
    }
    
    updateFeatureAccess(tsarAmount) {
        // Анонимные сообщения
        const anonBtn = document.querySelector('[data-type="anonymous"]');
        if (anonBtn) {
            if (tsarAmount >= CONFIG.TSAR_TIERS.SILVER) {
                anonBtn.disabled = false;
                anonBtn.style.opacity = '1';
            } else {
                anonBtn.disabled = true;
                anonBtn.style.opacity = '0.5';
            }
        }
        
        // Спонсорские сообщения
        const sponsorBtn = document.querySelector('[data-type="sponsored"]');
        if (sponsorBtn) {
            if (tsarAmount >= CONFIG.TSAR_TIERS.GOLD) {
                sponsorBtn.disabled = false;
                sponsorBtn.style.opacity = '1';
            } else {
                sponsorBtn.disabled = true;
                sponsorBtn.style.opacity = '0.5';
            }
        }
        
        // Фьючерсы (пока отключены, но готовы)
        const futuresBtn = document.getElementById('open-futures');
        if (futuresBtn) {
            if (tsarAmount >= CONFIG.TSAR_TIERS.GOLD) {
                futuresBtn.disabled = false;
                futuresBtn.textContent = 'OPEN FUTURES';
            } else {
                futuresBtn.disabled = true;
                futuresBtn.textContent = 'REQUIRES 20K TSAR';
            }
        }
    }
    
    formatTsarAmount(amount) {
        if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
        if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
        return Math.floor(amount).toLocaleString();
    }
    
    // TSAR можно только купить, не заработать!
    async buyTsarWithStars(starsAmount) {
        // Здесь будет интеграция с Telegram Stars
        showNotification('⭐ TSAR purchase with Telegram Stars coming soon!', 'info');
        return false;
    }
    
    async connectTonWallet() {
        try {
            // Здесь будет реальная интеграция с TON Connect
            showNotification('🔗 TON Wallet integration coming soon!', 'info');
            return false;
        } catch (error) {
            showNotification('❌ Failed to connect wallet', 'error');
            return false;
        }
    }
    
    // Трата TSAR (только на премиум функции)
    spendTsar(amount, reason = 'premium') {
        if (!userData || userData.tsarBalance < amount) {
            return { success: false, message: 'Insufficient TSAR balance' };
        }
        
        userData.tsarBalance -= amount;
        this.userTsarBalance = userData.tsarBalance;
        
        this.updateTsarDisplays();
        this.updatePrivileges();
        this.saveUserData();
        
        return { success: true, message: `Spent ${amount} TSAR on ${reason}` };
    }
    
    saveUserData() {
        saveUserData();
    }
}

// ===== ИСПРАВЛЕННАЯ ИГРА TERMINAL HACKING =====
class TerminalHackingGame {
    constructor() {
        this.wordLists = {
            4: ['HACK', 'CODE', 'DATA', 'BYTE', 'CORE', 'FIRE', 'WAVE', 'ZERO', 'LOCK', 'BOOT'],
            5: ['VIRUS', 'CYBER', 'LOGIN', 'ADMIN', 'GHOST', 'QUICK', 'BRAIN', 'STORM', 'POWER', 'MAGIC'],
            6: ['MATRIX', 'SYSTEM', 'ACCESS', 'SECURE', 'BYPASS', 'NEURAL', 'BINARY', 'CRYPTO', 'SHADOW', 'VECTOR'],
            7: ['NETWORK', 'PROGRAM', 'MACHINE', 'DIGITAL', 'PROCESS', 'HACKER', 'ANDROID', 'QUANTUM', 'PHOENIX', 'NEXUS'],
            8: ['PASSWORD', 'TERMINAL', 'DATABASE', 'PROTOCOL', 'MAINFRAME', 'OVERRIDE', 'BACKDOOR', 'FIREWALL', 'ALGORITHM', 'CYBERDECK']
        };
        
        this.currentWords = [];
        this.correctWord = '';
        this.attemptsLeft = 4;
        this.gameActive = false;
        this.startTime = 0;
    }
    
    startGame() {
        this.resetGame();
        this.gameActive = true;
        this.startTime = Date.now();
        this.attemptsLeft = 4;
        
        this.generateWords();
        this.generateHexDump();
        this.updateUI();
        this.addLogEntry('ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL');
        this.addLogEntry('PASSWORD REQUIRED');
        this.addLogEntry('SELECT PASSWORD FROM TERMINAL');
        
        console.log('🔑 Terminal game started. Correct password:', this.correctWord);
        
        if (audioManager) audioManager.beep();
    }
    
    generateWords() {
        // Выбираем сложность по уровню игрока
        const playerLevel = userData?.level || 1;
        const wordLength = Math.min(4 + Math.floor(playerLevel / 5), 8);
        
        const availableWords = [...this.wordLists[wordLength]];
        this.currentWords = [];
        
        // Выбираем 10-12 слов
        const wordCount = 10 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < wordCount && availableWords.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            this.currentWords.push(availableWords.splice(randomIndex, 1)[0]);
        }
        
        // Выбираем правильный пароль
        this.correctWord = this.currentWords[Math.floor(Math.random() * this.currentWords.length)];
        
        console.log('📝 Generated words:', this.currentWords);
        console.log('✅ Correct password:', this.correctWord);
    }
    
    generateHexDump() {
        const hexSection = document.getElementById('hex-section');
        if (!hexSection) {
            console.error('❌ Hex section not found!');
            return;
        }
        
        console.log('🔧 Generating hex dump...');
        
        const chars = '0123456789ABCDEF';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';
        let html = '';
        
        // Перемешиваем слова для размещения
        const wordsToPlace = [...this.currentWords];
        this.shuffleArray(wordsToPlace);
        
        // Генерируем 20 строк hex дампа
        for (let line = 0; line < 20; line++) {
            const address = (0xF000 + line * 16).toString(16).toUpperCase().padStart(4, '0');
            
            // Генерируем hex часть
            let hexPart = `0x${address} `;
            for (let i = 0; i < 16; i++) {
                hexPart += chars[Math.floor(Math.random() * chars.length)];
                if (i % 2 === 1) hexPart += ' ';
            }
            
            // Генерируем ASCII часть с паролями
            let asciiPart = '';
            let currentPos = 0;
            const lineLength = 50;
            
            while (currentPos < lineLength) {
                // 30% шанс разместить пароль, если есть
                if (wordsToPlace.length > 0 && Math.random() < 0.3 && (currentPos + wordsToPlace[0].length) <= lineLength) {
                    const word = wordsToPlace.shift();
                    asciiPart += `<span class="password-word" data-word="${word}">${word}</span>`;
                    currentPos += word.length;
                    console.log(`🔤 Placed word: ${word} at line ${line}`);
                }
                // 10% шанс разместить подсказку
                else if (Math.random() < 0.1 && currentPos < lineLength - 2) {
                    const brackets = ['[]', '()', '{}'];
                    const bracket = brackets[Math.floor(Math.random() * brackets.length)];
                    asciiPart += `<span class="bracket-hint">${bracket}</span>`;
                    currentPos += 2;
                }
                // Обычный символ
                else {
                    asciiPart += symbols[Math.floor(Math.random() * symbols.length)];
                    currentPos++;
                }
            }
            
            html += `
                <div class="hex-line">
                    <span class="hex-address">${hexPart}</span>
                    <span class="hex-ascii">${asciiPart}</span>
                </div>
            `;
        }
        
        hexSection.innerHTML = html;
        console.log('✅ Hex dump generated successfully');
        
        // Привязываем обработчики событий
        this.attachEventHandlers();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    attachEventHandlers() {
        // Обработчики для паролей
        document.querySelectorAll('.password-word').forEach(wordElement => {
            wordElement.addEventListener('click', (e) => {
                e.preventDefault();
                const word = wordElement.getAttribute('data-word');
                console.log(`🎯 Selected word: ${word}`);
                this.selectPassword(word);
            });
        });
        
        // Обработчики для подсказок
        document.querySelectorAll('.bracket-hint').forEach(bracketElement => {
            bracketElement.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔧 Used bracket hint');
                this.useBracketHint(bracketElement);
            });
        });
        
        console.log('🎮 Event handlers attached to terminal game');
    }
    
    selectPassword(word) {
        if (!this.gameActive) {
            console.log('❌ Game not active');
            return;
        }
        
        console.log(`🔍 Checking password: ${word} vs ${this.correctWord}`);
        
        // Убираем выделение с других слов
        document.querySelectorAll('.password-word').forEach(w => {
            w.classList.remove('selected');
        });
        
        // Выделяем выбранное слово
        const selectedElement = document.querySelector(`[data-word="${word}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            console.log('✅ Word selected in UI');
        }
        
        this.addLogEntry(`> ${word}`);
        this.addLogEntry('> Checking...');
        
        setTimeout(() => {
            if (word === this.correctWord) {
                this.handleCorrectPassword(word, selectedElement);
            } else {
                this.handleIncorrectPassword(word, selectedElement);
            }
        }, 800);
    }
    
    handleCorrectPassword(word, element) {
        console.log('🎉 Correct password!');
        
        if (element) {
            element.classList.add('correct');
        }
        
        this.addLogEntry('> Exact match!', 'success');
        this.addLogEntry('> Access granted!', 'success');
        this.addLogEntry('> Terminal unlocked!', 'success');
        
        if (audioManager) audioManager.success();
        
        setTimeout(() => {
            this.endGame(true);
        }, 2000);
    }
    
    handleIncorrectPassword(word, element) {
        console.log('❌ Incorrect password');
        
        if (element) {
            element.classList.add('incorrect');
        }
        
        const likeness = this.calculateLikeness(word, this.correctWord);
        this.addLogEntry('> Entry denied', 'error');
        this.addLogEntry(`> Likeness=${likeness}`, 'error');
        
        this.attemptsLeft--;
        this.updateUI();
        
        if (audioManager) audioManager.error();
        
        if (this.attemptsLeft <= 0) {
            this.addLogEntry('> Terminal locked', 'error');
            this.addLogEntry('> Access denied', 'error');
            setTimeout(() => this.endGame(false), 1500);
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
    
    useBracketHint(element) {
        if (!this.gameActive || element.classList.contains('used')) return;
        
        element.classList.add('used');
        element.style.color = '#666666';
        element.style.opacity = '0.3';
        element.style.cursor = 'default';
        
        this.removeDudPassword();
        this.addLogEntry('> Dud removed', 'system');
        
        if (audioManager) audioManager.click();
    }
    
    removeDudPassword() {
        const availablePasswords = Array.from(document.querySelectorAll('.password-word'))
            .filter(element => 
                !element.classList.contains('incorrect') && 
                !element.classList.contains('correct') && 
                !element.classList.contains('removed') &&
                element.getAttribute('data-word') !== this.correctWord
            );
        
        if (availablePasswords.length > 0) {
            const randomDud = availablePasswords[Math.floor(Math.random() * availablePasswords.length)];
            randomDud.classList.add('removed');
            console.log('🗑️ Removed dud:', randomDud.getAttribute('data-word'));
        }
    }
    
    addLogEntry(text, type = 'normal') {
        const logContent = document.getElementById('log-section');
        if (!logContent) {
            console.error('❌ Log section not found!');
            return;
        }
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = text;
        
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
        
        // Ограничиваем количество записей
        while (logContent.children.length > 25) {
            logContent.removeChild(logContent.children[0]);
        }
        
        console.log(`📝 Log: ${text} (${type})`);
    }
    
    updateUI() {
        const attemptsElement = document.getElementById('hack-attempts');
        if (attemptsElement) {
            attemptsElement.textContent = this.attemptsLeft;
        }
        
        console.log(`🎯 Attempts remaining: ${this.attemptsLeft}`);
    }
    
    endGame(won) {
        this.gameActive = false;
        console.log(`🏁 Game ended. Won: ${won}`);
        
        if (!userData) return;
        
        // Рассчитываем награду только в CAPS
        const baseReward = CONFIG.GAME_REWARDS['terminal-hacking'];
        const attemptBonus = won ? (this.attemptsLeft * 0.25) : 0; // Бонус за оставшиеся попытки
        const timeBonus = won ? Math.max(0, (180000 - (Date.now() - this.startTime)) / 180000) : 0; // Бонус за скорость
        
        const totalMultiplier = 1 + attemptBonus + timeBonus;
        const capsReward = Math.floor((baseReward.min + Math.random() * (baseReward.max - baseReward.min)) * totalMultiplier);
        
        // Выдаем награду только в CAPS
        const earnedCaps = capsEconomy.earnCaps(capsReward, 'terminal-hacking');
        
        // Обновляем статистику
        userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
        if (won) {
            userData.gamesWon = (userData.gamesWon || 0) + 1;
        }
        
        // Обновляем прогресс миссий
        if (missionSystem) {
            missionSystem.updateProgress('terminal_completed', 1);
        }
        
        // Обновляем отображение
        const capsEarnedElement = document.getElementById('game-caps-earned');
        if (capsEarnedElement) {
            capsEarnedElement.textContent = earnedCaps;
        }
        
        updateUserDisplay();
        
        const resultMessage = won ? 
            `🎉 ACCESS GRANTED!\nTerminal hacked successfully!\n+${earnedCaps} CAPS earned` :
            `❌ TERMINAL LOCKED!\nBetter luck next time!\n+${earnedCaps} CAPS consolation reward`;
        
        showNotification(resultMessage, won ? 'success' : 'warning', 4000);
        
        // Автоматически закрываем игру через 3 секунды
        setTimeout(() => {
            this.closeGame();
        }, 3000);
    }
    
    resetGame() {
        this.gameActive = false;
        this.currentWords = [];
        this.correctWord = '';
        this.attemptsLeft = 4;
        this.startTime = 0;
        
        // Очищаем UI
        const hexSection = document.getElementById('hex-section');
        const logSection = document.getElementById('log-section');
        const capsEarned = document.getElementById('game-caps-earned');
        
        if (hexSection) hexSection.innerHTML = '';
        if (logSection) logSection.innerHTML = '';
        if (capsEarned) capsEarned.textContent = '0';
        
        console.log('🔄 Terminal game reset');
    }
    
    closeGame() {
        this.resetGame();
        closeGame();
    }
}

// ===== УЛУЧШЕННАЯ ИГРА WASTELAND WINGS =====
class WastelandWingsGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameActive = false;
        this.gameLoop = null;
        
        // Игровые объекты
        this.player = {
            x: 50, y: 200, width: 25, height: 20,
            health: 100, maxHealth: 100,
            speed: 4, fireRate: 0, fireDelay: 10
        };
        
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.particles = [];
        
        // Игровые данные
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.startTime = 0;
        
        // Настройки сложности
        this.difficulty = {
            enemySpeed: 1.5,
            spawnRate: 120, // frames между спавном
            enemyHealth: 1,
            enemyDamage: 10
        };
        
        this.frameCount = 0;
    }
    
    init() {
        this.canvas = document.getElementById('wings-canvas');
        if (!this.canvas) {
            console.error('❌ Wings canvas not found!');
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d');
        console.log('✈️ Wasteland Wings initialized');
        return true;
    }
    
    startGame() {
        if (!this.init()) {
            showNotification('❌ Failed to initialize Wasteland Wings', 'error');
            return;
        }
        
        console.log('🚁 Starting Wasteland Wings...');
        
        this.resetGameState();
        this.gameActive = true;
        this.startTime = Date.now();
        
        this.updateUI();
        this.startGameLoop();
        
        if (audioManager) audioManager.powerup();
        
        showNotification('✈️ Wasteland Wings started! Destroy enemies to earn CAPS!', 'info', 3000);
    }
    
    resetGameState() {
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.frameCount = 0;
        
        this.player = {
            x: 50, y: 200, width: 25, height: 20,
            health: 100, maxHealth: 100,
            speed: 4, fireRate: 0, fireDelay: 10
        };
        
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.particles = [];
        
        this.difficulty = {
            enemySpeed: 1.5,
            spawnRate: 120,
            enemyHealth: 1,
            enemyDamage: 10
        };
        
        console.log('🔄 Game state reset');
    }
    
    startGameLoop() {
        const gameLoop = () => {
            if (!this.gameActive) return;
            
            this.frameCount++;
            this.update();
            this.render();
            this.gameLoop = requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
        console.log('🔁 Game loop started');
    }
    
    update() {
        // Спавн врагов
        if (this.frameCount % this.difficulty.spawnRate === 0) {
            this.spawnEnemy();
        }
        
        // Спавн powerup'ов
        if (this.frameCount % 1800 === 0) { // Каждые 30 секунд
            this.spawnPowerup();
        }
        
        // Обновляем все объекты
        this.updateBullets();
        this.updateEnemies();
        this.updatePowerups();
        this.updateParticles();
        
        // Проверяем коллизии
        this.checkCollisions();
        
        // Проверяем смену волны
        this.checkWaveProgression();
        
        // Уменьшаем fire rate
        if (this.player.fireRate > 0) {
            this.player.fireRate--;
        }
    }
    
    spawnEnemy() {
        const enemyTypes = [
            { 
                type: 'scout', 
                width: 15, height: 12, 
                speed: this.difficulty.enemySpeed * 1.5, 
                health: this.difficulty.enemyHealth,
                color: '#ff4444',
                points: 10
            },
            { 
                type: 'fighter', 
                width: 20, height: 16, 
                speed: this.difficulty.enemySpeed, 
                health: this.difficulty.enemyHealth * 2,
                color: '#ff6600',
                points: 25
            },
            { 
                type: 'bomber', 
                width: 30, height: 24, 
                speed: this.difficulty.enemySpeed * 0.7, 
                health: this.difficulty.enemyHealth * 3,
                color: '#cc3333',
                points: 50
            }
        ];
        
        const enemyTemplate = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        const enemy = {
            ...enemyTemplate,
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - enemyTemplate.height - 50),
            maxHealth: enemyTemplate.health,
            lastShot: 0
        };
        
        this.enemies.push(enemy);
    }
    
    spawnPowerup() {
        const powerupTypes = [
            { type: 'health', color: '#00ff88', icon: '💚' },
            { type: 'weapon', color: '#ffaa00', icon: '🔥' },
            { type: 'shield', color: '#00aaff', icon: '🛡️' },
            { type: 'bonus', color: '#ff00ff', icon: '💎' }
        ];
        
        const powerupTemplate = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        const powerup = {
            ...powerupTemplate,
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - 100),
            width: 20, height: 20,
            speed: 2
        };
        
        this.powerups.push(powerup);
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.speed;
            return bullet.x < this.canvas.width + 10;
        });
    }
    
    updateEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            enemy.x -= enemy.speed;
            
            // Враги иногда стреляют (только бомбардировщики)
            if (enemy.type === 'bomber' && this.frameCount - enemy.lastShot > 120) {
                this.enemyShoot(enemy);
                enemy.lastShot = this.frameCount;
            }
            
            return enemy.x > -enemy.width;
        });
    }
    
    updatePowerups() {
        this.powerups = this.powerups.filter(powerup => {
            powerup.x -= powerup.speed;
            return powerup.x > -powerup.width;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }
    
    enemyShoot(enemy) {
        // Враги стреляют в сторону игрока
        this.bullets.push({
            x: enemy.x,
            y: enemy.y + enemy.height / 2,
            width: 6, height: 3,
            speed: -3, // Летит влево
            fromEnemy: true,
            color: '#ff4444'
        });
    }
    
    checkCollisions() {
        // Пули игрока vs враги
        for (let b = this.bullets.length - 1; b >= 0; b--) {
            const bullet = this.bullets[b];
            if (bullet.fromEnemy) continue;
            
            for (let e = this.enemies.length - 1; e >= 0; e--) {
                const enemy = this.enemies[e];
                
                if (this.isColliding(bullet, enemy)) {
                    this.bullets.splice(b, 1);
                    enemy.health--;
                    
                    // Создаем частицы попадания
                    this.createHitParticles(enemy.x, enemy.y);
                    
                    if (enemy.health <= 0) {
                        this.score += enemy.points;
                        this.enemiesKilled++;
                        this.enemies.splice(e, 1);
                        
                        // Создаем частицы взрыва
                        this.createExplosionParticles(enemy.x, enemy.y);
                        
                        if (audioManager) audioManager.explosion();
                    } else {
                        if (audioManager) audioManager.click();
                    }
                    
                    break;
                }
            }
        }
        
        // Пули врагов vs игрок
        for (let b = this.bullets.length - 1; b >= 0; b--) {
            const bullet = this.bullets[b];
            if (!bullet.fromEnemy) continue;
            
            if (this.isColliding(bullet, this.player)) {
                this.bullets.splice(b, 1);
                this.player.health -= this.difficulty.enemyDamage;
                
                this.createHitParticles(this.player.x, this.player.y);
                
                if (audioManager) audioManager.error();
                
                if (this.player.health <= 0) {
                    this.endGame(false);
                    return;
                }
            }
        }
        
        // Игрок vs враги (столкновение)
        for (let e = this.enemies.length - 1; e >= 0; e--) {
            const enemy = this.enemies[e];
            
            if (this.isColliding(this.player, enemy)) {
                this.enemies.splice(e, 1);
                this.player.health -= this.difficulty.enemyDamage * 2; // Двойной урон при столкновении
                
                this.createExplosionParticles(enemy.x, enemy.y);
                
                if (audioManager) audioManager.explosion();
                
                if (this.player.health <= 0) {
                    this.endGame(false);
                    return;
                }
            }
        }
        
        // Игрок vs powerups
        for (let p = this.powerups.length - 1; p >= 0; p--) {
            const powerup = this.powerups[p];
            
            if (this.isColliding(this.player, powerup)) {
                this.powerups.splice(p, 1);
                this.handlePowerup(powerup);
                
                if (audioManager) audioManager.powerup();
            }
        }
        
        this.updateUI();
    }
    
    handlePowerup(powerup) {
        switch (powerup.type) {
            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
                showNotification('💚 Health restored!', 'success', 2000);
                break;
            case 'weapon':
                this.player.fireDelay = Math.max(3, this.player.fireDelay - 2);
                showNotification('🔥 Weapon upgraded!', 'success', 2000);
                break;
            case 'shield':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
                showNotification('🛡️ Shield activated!', 'success', 2000);
                break;
            case 'bonus':
                this.score += 100;
                showNotification('💎 Bonus points!', 'success', 2000);
                break;
        }
    }
    
    checkWaveProgression() {
        // Новая волна каждые 15 убитых врагов
        if (this.enemiesKilled > 0 && this.enemiesKilled % 15 === 0) {
            this.nextWave();
        }
    }
    
    nextWave() {
        this.wave++;
        
        // Увеличиваем сложность
        this.difficulty.enemySpeed += 0.3;
        this.difficulty.spawnRate = Math.max(60, this.difficulty.spawnRate - 10);
        this.difficulty.enemyHealth += Math.floor(this.wave / 3);
        this.difficulty.enemyDamage += 2;
        
        showNotification(`🌊 WAVE ${this.wave}!\nEnemies getting stronger!`, 'warning', 3000);
        
        if (audioManager) audioManager.powerup();
        
        console.log(`🌊 Wave ${this.wave} started`);
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x + Math.random() * 20,
                y: y + Math.random() * 20,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 20,
                maxLife: 20,
                alpha: 1,
                color: '#ffaa00'
            });
        }
    }
    
    createExplosionParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x + Math.random() * 30,
                y: y + Math.random() * 30,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                alpha: 1,
                color: Math.random() < 0.5 ? '#ff4444' : '#ffaa00'
            });
        }
    }
    
    render() {
        if (!this.ctx) return;
        
        // Очищаем экран с градиентом
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#000011');
        gradient.addColorStop(0.5, '#001122');
        gradient.addColorStop(1, '#000033');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем звезды
        this.drawStarfield();
        
        // Рисуем игровые объекты
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawPowerups();
        this.drawParticles();
        this.drawUI();
    }
    
    drawStarfield() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 7 + this.frameCount * 0.5) % this.canvas.width;
            const y = (i * 13) % this.canvas.height;
            const size = Math.random() < 0.1 ? 2 : 1;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    drawPlayer() {
        // Основной корпус
        this.ctx.fillStyle = '#00ff41';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Форма истребителя
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width, this.player.y + this.player.height / 2);
        this.ctx.lineTo(this.player.x, this.player.y);
        this.ctx.lineTo(this.player.x + 8, this.player.y + this.player.height / 2);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Двигатели
        this.ctx.fillStyle = '#00aaff';
        this.ctx.fillRect(this.player.x - 5, this.player.y + 4, 8, 4);
        this.ctx.fillRect(this.player.x - 5, this.player.y + 12, 8, 4);
        
        // Эффект двигателей
        if (this.frameCount % 6 < 3) {
            this.ctx.fillStyle = '#0088ff';
            this.ctx.fillRect(this.player.x - 8, this.player.y + 5, 6, 2);
            this.ctx.fillRect(this.player.x - 8, this.player.y + 13, 6, 2);
        }
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.fromEnemy ? '#ff4444' : '#ffff00';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // Эффект свечения
            this.ctx.shadowColor = bullet.color || (bullet.fromEnemy ? '#ff4444' : '#ffff00');
            this.ctx.shadowBlur = 5;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            // Основной корпус
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Полоска здоровья для крупных врагов
            if (enemy.maxHealth > 1) {
                const healthPercent = enemy.health / enemy.maxHealth;
                const barWidth = enemy.width;
                const barHeight = 3;
                
                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(enemy.x, enemy.y - 5, barWidth, barHeight);
                
                this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff4444';
                this.ctx.fillRect(enemy.x, enemy.y - 5, barWidth * healthPercent, barHeight);
            }
        });
    }
    
    drawPowerups() {
        this.powerups.forEach(powerup => {
            // Мерцающий эффект
            const alpha = 0.7 + 0.3 * Math.sin(this.frameCount * 0.1);
            this.ctx.globalAlpha = alpha;
            
            this.ctx.fillStyle = powerup.color;
            this.ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
            
            // Свечение
            this.ctx.shadowColor = powerup.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
            this.ctx.shadowBlur = 0;
            
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, 2, 2);
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawUI() {
        // Полоска здоровья
        const healthBarWidth = 150;
        const healthBarHeight = 10;
        const healthPercent = this.player.health / this.player.maxHealth;
        
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(10, 10, healthBarWidth, healthBarHeight);
        
        this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff41' : '#ff4444';
        this.ctx.fillRect(10, 10, healthBarWidth * healthPercent, healthBarHeight);
        
        // Текст здоровья
        this.ctx.fillStyle = '#00ff41';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`HEALTH: ${this.player.health}`, 10, 35);
        
        // Мини-карта
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.canvas.width - 80, 10, 70, 50);
        
        this.ctx.strokeStyle = '#00ff41';
        this.ctx.strokeRect(this.canvas.width - 80, 10, 70, 50);
        
        // Показываем врагов на мини-карте
        this.enemies.forEach(enemy => {
            const miniX = this.canvas.width - 80 + (enemy.x / this.canvas.width) * 70;
            const miniY = 10 + (enemy.y / this.canvas.height) * 50;
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillRect(miniX, miniY, 2, 2);
        });
        
        // Игрок на мини-карте
        const playerMiniX = this.canvas.width - 80 + (this.player.x / this.canvas.width) * 70;
        const playerMiniY = 10 + (this.player.y / this.canvas.height) * 50;
        this.ctx.fillStyle = '#00ff41';
        this.ctx.fillRect(playerMiniX, playerMiniY, 3, 3);
    }
    
    // Управление
    shoot() {
        if (!this.gameActive || this.player.fireRate > 0) return;
        
        this.bullets.push({
            x: this.player.x + this.player.width,
            y: this.player.y + this.player.height / 2 - 2,
            width: 10, height: 4,
            speed: 8,
            fromEnemy: false
        });
        
        this.player.fireRate = this.player.fireDelay;
        
        if (audioManager) audioManager.shoot();
    }
    
    movePlayer(direction) {
        if (!this.gameActive) return;
        
        const speed = this.player.speed;
        const margin = 5;
        
        switch (direction) {
            case 'up':
                this.player.y = Math.max(margin, this.player.y - speed);
                break;
            case 'down':
                this.player.y = Math.min(this.canvas.height - this.player.height - margin, this.player.y + speed);
                break;
            case 'left':
                this.player.x = Math.max(margin, this.player.x - speed);
                break;
            case 'right':
                this.player.x = Math.min(this.canvas.width - this.player.width - margin, this.player.x + speed);
                break;
        }
    }
    
    updateUI() {
        const scoreElement = document.getElementById('wings-score');
        const livesElement = document.getElementById('wings-lives'); 
        const waveElement = document.getElementById('wings-wave');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (livesElement) livesElement.textContent = Math.ceil(this.player.health / 33.33); // 3 жизни = 100 HP
        if (waveElement) waveElement.textContent = this.wave;
    }
    
    endGame(won = false) {
        this.gameActive = false;
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        console.log(`🏁 Wasteland Wings ended. Score: ${this.score}, Wave: ${this.wave}`);
        
        if (!userData) return;
        
        // Рассчитываем награду только в CAPS
        const baseReward = CONFIG.GAME_REWARDS['wasteland-wings'];
        const scoreMultiplier = Math.min(this.score / 1000, 3); // Максимум 3x
        const waveBonus = (this.wave - 1) * 50; // Бонус за волны
        
        const capsReward = Math.floor(
            (baseReward.min + Math.random() * (baseReward.max - baseReward.min)) * scoreMultiplier + waveBonus
        );
        
        // Выдаем награду
        const earnedCaps = capsEconomy.earnCaps(capsReward, 'wasteland-wings');
        
        // Обновляем статистику
        userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
        if (this.score > 500) { // Считаем победой если набрали 500+ очков
            userData.gamesWon = (userData.gamesWon || 0) + 1;
        }
        
        // Обновляем прогресс миссий
        if (missionSystem) {
            missionSystem.updateProgress('wings_score', this.score);
        }
        
        updateUserDisplay();
        
        const status = this.player.health > 0 ? '🏆 MISSION COMPLETE!' : '💥 AIRCRAFT DESTROYED!';
        const resultMessage = `${status}\nScore: ${this.score} | Wave: ${this.wave}\n+${earnedCaps} CAPS earned`;
        
        showNotification(resultMessage, this.player.health > 0 ? 'success' : 'warning', 5000);
        
        setTimeout(() => {
            this.closeGame();
        }, 4000);
    }
    
    closeGame() {
        this.resetGameState();
        closeGame();
    }
}

// ===== НОВАЯ ИГРА CYBER DUEL =====
class CyberDuelGame {
    constructor() {
        this.gameActive = false;
        this.isMultiplayer = true; // Всегда мультиплеер
        
        // Состояние игры
        this.player = {
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            shield: 0
        };
        
        this.opponent = {
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            shield: 0,
            name: 'UNKNOWN',
            ai: true // Пока ИИ противник
        };
        
        this.round = 1;
        this.maxRounds = 5;
        this.playerTurn = true;
        this.battleLog = [];
        
        // ИИ настройки
        this.aiDifficulty = 'normal';
        this.aiActions = ['attack', 'defend', 'special', 'heal'];
    }
    
    startGame() {
        console.log('⚔️ Starting Cyber Duel...');
        
        this.resetGame();
        this.gameActive = true;
        this.findOpponent();
        
        if (audioManager) audioManager.powerup();
    }
    
    resetGame() {
        this.player = {
            health: 100, maxHealth: 100,
            energy: 100, maxEnergy: 100,
            shield: 0
        };
        
        this.opponent = {
            health: 100, maxHealth: 100,
            energy: 100, maxEnergy: 100,
            shield: 0,
            name: this.generateOpponentName(),
            ai: true
        };
        
        this.round = 1;
        this.playerTurn = true;
        this.battleLog = [];
        
        this.updateUI();
        this.addBattleLog('⚔️ Cyber Duel initiated');
        this.addBattleLog('🎯 Choose your action');
    }
    
    generateOpponentName() {
        const names = [
            'CYBER_NINJA', 'DATA_GHOST', 'NEURAL_HUNTER', 'QUANTUM_WARRIOR',
            'VOID_STRIKER', 'NEON_SAMURAI', 'DIGITAL_PHANTOM', 'CHROME_KILLER',
            'MATRIX_REBEL', 'SHADOW_HACKER', 'PLASMA_KNIGHT', 'BINARY_BLADE'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    findOpponent() {
        this.addBattleLog('🔍 Searching for opponent...');
        
        setTimeout(() => {
            this.addBattleLog(`🤖 Opponent found: ${this.opponent.name}`);
            this.addBattleLog('⚡ Neural link established');
            this.addBattleLog('🥊 Battle begins!');
            this.updateUI();
        }, 2000);
    }
    
    // Игровые действия
    performAction(action) {
        if (!this.gameActive || !this.playerTurn) return;
        
        console.log(`🎮 Player action: ${action}`);
        
        const result = this.executeAction(this.player, action, 'Player');
        
        if (result.success) {
            this.addBattleLog(`🎯 You used ${action.toUpperCase()}: ${result.message}`);
            
            // Проверяем конец игры
            if (this.opponent.health <= 0) {
                this.endGame(true);
                return;
            }
            
            // Ход противника
            this.playerTurn = false;
            setTimeout(() => {
                this.opponentTurn();
            }, 1500);
        } else {
            this.addBattleLog(`❌ ${result.message}`);
            if (audioManager) audioManager.error();
        }
        
        this.updateUI();
    }
    
    executeAction(actor, action, actorName) {
        switch (action) {
            case 'attack':
                if (actor.energy < 20) {
                    return { success: false, message: 'Not enough energy' };
                }
                
                actor.energy -= 20;
                const damage = 25 + Math.floor(Math.random() * 15); // 25-40 урона
                const target = actor === this.player ? this.opponent : this.player;
                
                // Учитываем щит
                const actualDamage = Math.max(1, damage - target.shield);
                target.health = Math.max(0, target.health - actualDamage);
                target.shield = Math.max(0, target.shield - damage);
                
                if (audioManager) audioManager.click();
                
                return { 
                    success: true, 
                    message: `${actualDamage} damage dealt${target.shield > 0 ? ' (shield absorbed some)' : ''}` 
                };
                
            case 'defend':
                if (actor.energy < 10) {
                    return { success: false, message: 'Not enough energy' };
                }
                
                actor.energy -= 10;
                const shieldGain = 15 + Math.floor(Math.random() * 10); // 15-25 щита
                actor.shield += shieldGain;
                
                return { success: true, message: `Shield increased (+${shieldGain} points)` };
                
            case 'special':
                if (actor.energy < 40) {
                    return { success: false, message: 'Not enough energy' };
                }
                
                actor.energy -= 40;
                const specialDamage = 40 + Math.floor(Math.random() * 20); // 40-60 урона
                const specialTarget = actor === this.player ? this.opponent : this.player;
                
                specialTarget.health = Math.max(0, specialTarget.health - specialDamage);
                specialTarget.shield = 0; // Спец атака убирает щит
                
                if (audioManager) audioManager.explosion();
                
                return { success: true, message: `CRITICAL HIT! ${specialDamage} damage + shield destroyed` };
                
            case 'heal':
                if (actor.energy < 30) {
                    return { success: false, message: 'Not enough energy' };
                }
                
                actor.energy -= 30;
                const oldHealth = actor.health;
                const healing = 20 + Math.floor(Math.random() * 15); // 20-35 лечения
                actor.health = Math.min(actor.maxHealth, actor.health + healing);
                const actualHealing = actor.health - oldHealth;
                
                return { success: true, message: `Restored ${actualHealing} health` };
                
            default:
                return { success: false, message: 'Unknown action' };
        }
    }
    
    opponentTurn() {
        if (!this.gameActive) return;
        
        // ИИ выбирает действие
        const action = this.selectAIAction();
        const result = this.executeAction(this.opponent, action, 'Opponent');
        
        if (result.success) {
            this.addBattleLog(`🤖 ${this.opponent.name} used ${action.toUpperCase()}: ${result.message}`);
            
            // Проверяем конец игры
            if (this.player.health <= 0) {
                this.endGame(false);
                return;
            }
        }
        
        // Восстанавливаем энергию обоим
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 10);
        this.opponent.energy = Math.min(this.opponent.maxEnergy, this.opponent.energy + 10);
        
        // Следующий раунд
        this.round++;
        this.playerTurn = true;
        
        // Проверяем лимит раундов
        if (this.round > this.maxRounds) {
            const playerWon = this.player.health > this.opponent.health;
            this.endGame(playerWon);
            return;
        }
        
        this.updateUI();
    }
    
    selectAIAction() {
        const opponentState = this.opponent;
        const playerState = this.player;
        
        // Простая ИИ логика
        if (opponentState.health < 30 && opponentState.energy >= 30) {
            return 'heal'; // Лечимся если мало HP
        }
        
        if (playerState.health < 50 && opponentState.energy >= 40) {
            return 'special'; // Добиваем если у игрока мало HP
        }
        
        if (opponentState.shield < 10 && opponentState.energy >= 10) {
            return 'defend'; // Защищаемся если нет щита
        }
        
        // Иначе атакуем
        return 'attack';
    }
    
    addBattleLog(message) {
        this.battleLog.push({
            text: message,
            timestamp: Date.now()
        });
        
        // Ограничиваем лог
        if (this.battleLog.length > 10) {
            this.battleLog.shift();
        }
        
        this.updateBattleLogDisplay();
    }
    
    updateBattleLogDisplay() {
        const logContent = document.getElementById('battle-log-content');
        if (!logContent) return;
        
        logContent.innerHTML = this.battleLog.map(entry => 
            `<div class="log-entry">${entry.text}</div>`
        ).join('');
        
        logContent.scrollTop = logContent.scrollHeight;
    }
    
    updateUI() {
        // Здоровье игрока
        const playerHealthBar = document.getElementById('player-health-bar');
        const playerEnergyBar = document.getElementById('player-energy-bar');
        
        if (playerHealthBar) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            playerHealthBar.style.width = `${healthPercent}%`;
        }
        
        if (playerEnergyBar) {
            const energyPercent = (this.player.energy / this.player.maxEnergy) * 100;
            playerEnergyBar.style.width = `${energyPercent}%`;
        }
        
        // Здоровье противника
        const opponentHealthBar = document.getElementById('opponent-health-bar');
        const opponentEnergyBar = document.getElementById('opponent-energy-bar');
        
        if (opponentHealthBar) {
            const healthPercent = (this.opponent.health / this.opponent.maxHealth) * 100;
            opponentHealthBar.style.width = `${healthPercent}%`;
        }
        
        if (opponentEnergyBar) {
            const energyPercent = (this.opponent.energy / this.opponent.maxEnergy) * 100;
            opponentEnergyBar.style.width = `${energyPercent}%`;
        }
        
        // Общая информация
        const healthElement = document.getElementById('duel-health');
        const energyElement = document.getElementById('duel-energy');
        const roundElement = document.getElementById('duel-round');
        const opponentNameElement = document.getElementById('opponent-name');
        const battleStatusElement = document.getElementById('battle-status');
        
        if (healthElement) healthElement.textContent = this.player.health;
        if (energyElement) energyElement.textContent = this.player.energy;
        if (roundElement) roundElement.textContent = this.round;
        if (opponentNameElement) opponentNameElement.textContent = this.opponent.name;
        
        if (battleStatusElement) {
            battleStatusElement.textContent = this.playerTurn ? 'YOUR TURN' : 'OPPONENT TURN';
        }
        
        // Обновляем доступность кнопок действий
        this.updateActionButtons();
    }
    
    updateActionButtons() {
        const actions = [
            { action: 'attack', cost: 20 },
            { action: 'defend', cost: 10 },
            { action: 'special', cost: 40 },
            { action: 'heal', cost: 30 }
        ];
        
        actions.forEach(({ action, cost }) => {
            const button = document.querySelector(`[onclick="duelAction('${action}')"]`);
            if (button) {
                const canUse = this.playerTurn && this.player.energy >= cost;
                button.disabled = !canUse;
                button.style.opacity = canUse ? '1' : '0.5';
            }
        });
    }
    
    endGame(won) {
        this.gameActive = false;
        console.log(`🏁 Cyber Duel ended. Won: ${won}`);
        
        if (!userData) return;
        
        // Рассчитываем награду только в CAPS
        const baseReward = CONFIG.GAME_REWARDS['cyber-duel'];
        const performanceMultiplier = won ? 1.5 : 0.5;
        const roundBonus = this.round * 50;
        
        const capsReward = Math.floor(
            (baseReward.min + Math.random() * (baseReward.max - baseReward.min)) * performanceMultiplier + roundBonus
        );
        
        // Выдаем награду
        const earnedCaps = capsEconomy.earnCaps(capsReward, 'cyber-duel');
        
        // Обновляем статистику
        userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
        if (won) {
            userData.gamesWon = (userData.gamesWon || 0) + 1;
        }
        
        // Обновляем прогресс миссий
        if (missionSystem) {
            missionSystem.updateProgress('duel_completed', 1);
        }
        
        updateUserDisplay();
        
        const resultMessage = won ? 
            `🏆 VICTORY!\nYou defeated ${this.opponent.name}!\n+${earnedCaps} CAPS earned` :
            `💀 DEFEAT!\n${this.opponent.name} won this time!\n+${earnedCaps} CAPS consolation`;
        
        showNotification(resultMessage, won ? 'success' : 'warning', 5000);
        
        setTimeout(() => {
            this.closeGame();
        }, 4000);
    }
    
    closeGame() {
        this.resetGame();
        closeGame();
    }
}

// ===== РАДИО СИСТЕМА =====
class WastelandRadio {
    constructor() {
        this.messages = this.loadMessages();
        this.nextId = this.getNextId();
        this.onlineUsers = 2847;
        
        this.startRadioUpdates();
    }
    
    loadMessages() {
        try {
            const saved = localStorage.getItem('wasteland_radio_v3');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load radio messages:', e);
        }
        
        return this.getDefaultMessages();
    }
    
    getDefaultMessages() {
        return [
            {
                id: 1,
                author: 'VAULT_DWELLER_101',
                text: 'New CAPS trading opportunities in sector 7! 💰',
                time: this.formatTime(Date.now() - 300000),
                type: 'public',
                timestamp: Date.now() - 300000
            },
            {
                id: 2,
                author: 'ANONYMOUS_USER',
                text: 'Big announcement coming soon... HODL your CAPS! 🚀',
                time: this.formatTime(Date.now() - 180000),
                type: 'anonymous',
                timestamp: Date.now() - 180000
            },
            {
                id: 3,
                author: 'TERMINAL_MASTER',
                text: '[SPONSORED] 🎯 Learn advanced hacking techniques! Join our training program!',
                time: this.formatTime(Date.now() - 120000),
                type: 'sponsored',
                timestamp: Date.now() - 120000
            }
        ];
    }
    
    saveMessages() {
        try {
            localStorage.setItem('wasteland_radio_v3', JSON.stringify(this.messages.slice(0, 100)));
        } catch (e) {
            console.warn('Failed to save radio messages:', e);
        }
    }
    
    getNextId() {
        return this.messages.length > 0 ? Math.max(...this.messages.map(m => m.id)) + 1 : 1;
    }
    
    addMessage(text, author, type = 'public') {
        const message = {
            id: this.nextId++,
            author: type === 'anonymous' ? 'ANONYMOUS_USER' : author,
            text: text.substring(0, 200),
            time: this.formatTime(Date.now()),
            type: type,
            timestamp: Date.now()
        };
        
        this.messages.unshift(message);
        this.saveMessages();
        this.displayMessages();
        
        console.log(`📻 Message added: ${type} by ${author}`);
        return message;
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    displayMessages() {
        const feedElement = document.getElementById('radio-feed');
        if (!feedElement) return;
        
        feedElement.innerHTML = this.messages.map(msg => `
            <div class="radio-message ${msg.type}">
                <div class="message-header">
                    <span class="message-author">${msg.author}</span>
                    <span class="message-time">${msg.time}</span>
                </div>
                <div class="message-text">${msg.text}</div>
            </div>
        `).join('');
        
        feedElement.scrollTop = 0;
    }
    
    startRadioUpdates() {
        // Обновляем количество онлайн пользователей
        setInterval(() => {
            this.onlineUsers += Math.floor(Math.random() * 20) - 10;
            this.onlineUsers = Math.max(1000, Math.min(5000, this.onlineUsers));
            
            const onlineElement = document.getElementById('radio-online');
            if (onlineElement) {
                onlineElement.textContent = this.onlineUsers.toLocaleString();
            }
            
            // Иногда добавляем случайные сообщения
            if (Math.random() < 0.2) {
                this.addRandomMessage();
            }
        }, CONFIG.RADIO_UPDATE_INTERVAL);
    }
    
    addRandomMessage() {
        const messages = [
            'Market looking bullish today! 📈',
            'Found legendary loot in the north!',
            'Anyone up for some dueling?',
            'New settlement discovered!',
            'CAPS price breaking resistance!',
            'Radiation storm incoming...',
            'Trading volume is pumping! 🚀',
            'Who wants to party up?',
            'Best hacker wins the prize!'
        ];
        
        const authors = [
            'WANDERER_X', 'SCAV_KING', 'TRADER_99', 'VAULT_HUNTER',
            'NEON_GHOST', 'CAPS_LORD', 'CYBER_MONK', 'DATA_NOMAD'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        const author = authors[Math.floor(Math.random() * authors.length)];
        
        this.addMessage(message, author, 'public');
    }
}

// ===== СИСТЕМА МИССИЙ =====
class MissionSystem {
    constructor() {
        this.missions = [
            {
                id: 'terminal_novice',
                title: 'Terminal Novice',
                description: 'Complete 3 Terminal Hacking games',
                type: 'daily',
                requirement: 3,
                current: 0,
                reward: 500,
                completed: false,
                trackType: 'terminal_completed'
            },
            {
                id: 'wings_pilot',
                title: 'Wings Pilot',
                description: 'Score 1000+ in Wasteland Wings',
                type: 'challenge',
                requirement: 1000,
                current: 0,
                reward: 750,
                completed: false,
                trackType: 'wings_score'
            },
            {
                id: 'duel_warrior',
                title: 'Cyber Warrior',
                description: 'Win 5 Cyber Duels',
                type: 'weekly',
                requirement: 5,
                current: 0,
                reward: 1200,
                completed: false,
                trackType: 'duel_won'
            },
            {
                id: 'radio_broadcaster',
                title: 'Radio Star',
                description: 'Send 10 radio messages',
                type: 'weekly',
                requirement: 10,
                current: 0,
                reward: 800,
                completed: false,
                trackType: 'radio_sent'
            },
            {
                id: 'caps_collector',
                title: 'CAPS Collector',
                description: 'Accumulate 10,000 CAPS',
                type: 'milestone',
                requirement: 10000,
                current: 0,
                reward: 2000,
                completed: false,
                trackType: 'caps_balance'
            }
        ];
        
        this.loadProgress();
        this.checkMissions();
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('mission_progress_v3');
            if (saved) {
                const progress = JSON.parse(saved);
                this.missions.forEach(mission => {
                    const savedMission = progress.find(p => p.id === mission.id);
                    if (savedMission) {
                        mission.current = savedMission.current || 0;
                        mission.completed = savedMission.completed || false;
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to load mission progress:', e);
        }
    }
    
    saveProgress() {
        try {
            const progress = this.missions.map(m => ({
                id: m.id,
                current: m.current,
                completed: m.completed
            }));
            localStorage.setItem('mission_progress_v3', JSON.stringify(progress));
        } catch (e) {
            console.warn('Failed to save mission progress:', e);
        }
    }
    
    updateProgress(trackType, value) {
        this.missions.forEach(mission => {
            if (mission.completed || mission.trackType !== trackType) return;
            
            if (trackType === 'caps_balance') {
                mission.current = userData?.capsBalance || 0;
            } else {
                mission.current += (value || 1);
            }
            
            // Проверяем завершение
            if (mission.current >= mission.requirement) {
                this.completeMission(mission.id);
            }
        });
        
        this.saveProgress();
        this.checkMissions();
    }
    
    completeMission(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.completed) return;
        
        mission.completed = true;
        
        // Выдаем награду в CAPS
        const earnedCaps = capsEconomy.earnCaps(mission.reward, `mission-${missionId}`);
        
        showNotification(
            `🎉 MISSION COMPLETED!\n${mission.title}\n+${earnedCaps} CAPS earned!`,
            'success',
            5000
        );
        
        console.log(`✅ Mission completed: ${mission.title}`);
    }
    
    checkMissions() {
        // Проверяем текущие значения
        if (userData) {
            this.updateProgress('caps_balance', 0); // Обновляем без изменения значения
        }
    }
}

// ===== ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ =====
function loadUserData() {
    try {
        const saved = localStorage.getItem('runner_user_v3');
        if (saved) {
            userData = JSON.parse(saved);
            
            // Миграция данных
            if (!userData.capsBalance) userData.capsBalance = CONFIG.CAPS_INITIAL_AMOUNT;
            if (!userData.tsarBalance) userData.tsarBalance = 0; // TSAR не выдается бесплатно!
            if (!userData.gamesPlayed) userData.gamesPlayed = 0;
            if (!userData.gamesWon) userData.gamesWon = 0;
            if (!userData.totalCapsEarned) userData.totalCapsEarned = 0;
        }
    } catch (e) {
        console.warn('Failed to load user data:', e);
    }
    
    if (!userData) {
        userData = {
            id: 'dweller_' + Date.now(),
            name: 'DWELLER_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            
            // Игровая валюта (можно заработать)
            capsBalance: CONFIG.CAPS_INITIAL_AMOUNT,
            totalCapsEarned: CONFIG.CAPS_INITIAL_AMOUNT,
            
            // Реальные токены (только покупка)
            tsarBalance: 0,              // Реальный TSAR токен
            tonBalance: 0,               // TON
            starsBalance: 0,             // Telegram Stars
            
            // Статистика
            level: 1,
            gamesPlayed: 0,
            gamesWon: 0,
            referrals: 0,
            radioMessagesSent: 0,
            
            // Временные метки
            created: Date.now(),
            lastActive: Date.now(),
            
            // Настройки
            soundEnabled: true,
            theme: 'cyber'
        };
        
        console.log('👤 New user created:', userData.name);
        showNotification(`🎉 Welcome to RUNNER Terminal!\nYou received ${CONFIG.CAPS_INITIAL_AMOUNT} CAPS to start!`, 'success', 6000);
    }
    
    saveUserData();
    updateUserDisplay();
}

function saveUserData() {
    if (!userData) return;
    
    userData.lastActive = Date.now();
    
    try {
        localStorage.setItem('runner_user_v3', JSON.stringify(userData));
    } catch (e) {
        console.error('❌ Failed to save user data:', e);
    }
}

function updateUserDisplay() {
    if (!userData) return;
    
    // Основные балансы
    const updates = {
        'header-caps': capsEconomy ? capsEconomy.formatNumber(userData.capsBalance) : userData.capsBalance,
        'header-tsar': tsarManager ? tsarManager.formatTsarAmount(userData.tsarBalance) : userData.tsarBalance,
        'header-level': userData.level,
        'dash-caps': capsEconomy ? capsEconomy.formatNumber(userData.capsBalance) : userData.capsBalance,
        'dash-tsar': tsarManager ? tsarManager.formatTsarAmount(userData.tsarBalance) : userData.tsarBalance,
        'dash-stars': userData.starsBalance,
        'dash-games': userData.gamesPlayed,
        'dash-rank': capsEconomy ? capsEconomy.calculateUserRank() : '#∞',
        'user-caps-display': capsEconomy ? capsEconomy.formatNumber(userData.capsBalance) : userData.capsBalance,
        'tsar-display': tsarManager ? tsarManager.formatTsarAmount(userData.tsarBalance) : userData.tsarBalance,
        'portfolio-caps': capsEconomy ? capsEconomy.formatNumber(userData.capsBalance) : userData.capsBalance,
        'portfolio-ton': userData.tonBalance.toFixed(3)
    };
    
    Object.entries(updates).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    // Винрейт
    const winRate = userData.gamesPlayed > 0 ? 
        ((userData.gamesWon / userData.gamesPlayed) * 100).toFixed(1) : 0;
    
    const winRateElements = ['dash-winrate', 'profile-winrate'];
    winRateElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = `${winRate}%`;
    });
    
    // Обновляем привилегии TSAR
    if (tsarManager) {
        tsarManager.userTsarBalance = userData.tsarBalance;
        tsarManager.updatePrivileges();
    }
    
    console.log('📊 User display updated');
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====

// Функции для HTML onclick
window.startGame = function(gameType) {
    console.log(`🎮 Starting game: ${gameType}`);
    
    switch (gameType) {
        case 'terminal-hacking':
            openGameModal('terminal-hacking-modal');
            if (terminalGame) terminalGame.startGame();
            break;
            
        case 'wasteland-wings':
            openGameModal('wasteland-wings-modal');
            if (wingsGame) wingsGame.startGame();
            break;
            
        case 'cyber-duel':
            openGameModal('cyber-duel-modal');
            if (cyberDuel) cyberDuel.startGame();
            break;
            
        case 'caps-trading':
            openGameModal('caps-trading-modal');
            if (chartEngine) {
                setTimeout(() => chartEngine.initChart(), 100);
            }
            break;
            
        default:
            showNotification(`🚧 Game ${gameType} not implemented yet`, 'info');
    }
};

window.closeGame = function() {
    console.log('🚪 Closing game...');
    
    // Останавливаем все игры
    if (terminalGame) terminalGame.gameActive = false;
    if (wingsGame) wingsGame.gameActive = false;
    if (cyberDuel) cyberDuel.gameActive = false;
    
    // Закрываем все модальные окна
    document.querySelectorAll('.game-modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    currentGame = null;
    
    if (audioManager) audioManager.beep();
};

// Функции для Terminal Hacking
window.selectPassword = function(word) {
    if (terminalGame) {
        terminalGame.selectPassword(word);
    }
};

window.useBracketHint = function(element) {
    if (terminalGame) {
        terminalGame.useBracketHint(element);
    }
};

// Функции для Wasteland Wings
window.wingsAction = function(action) {
    if (!wingsGame || !wingsGame.gameActive) return;
    
    switch (action) {
        case 'shoot':
            wingsGame.shoot();
            break;
        case 'up':
        case 'down':
        case 'left':
        case 'right':
            wingsGame.movePlayer(action);
            break;
    }
};

// Функции для Cyber Duel
window.duelAction = function(action) {
    if (cyberDuel && cyberDuel.gameActive && cyberDuel.playerTurn) {
        cyberDuel.performAction(action);
    }
};

// TSAR функции
window.buyTsarWithStars = function() {
    if (tsarManager) {
        tsarManager.buyTsarWithStars();
    }
};

window.connectTonWallet = function() {
    if (tsarManager) {
        tsarManager.connectTonWallet();
    }
};

// ===== ОСНОВНЫЕ ФУНКЦИИ =====
function openGameModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        currentGame = modalId;
        console.log(`🎯 Opened modal: ${modalId}`);
    }
}

function showSection(section) {
    console.log(`📂 Showing section: ${section}`);
    
    // Убираем активный класс со всех разделов
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Убираем активный класс с кнопок навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранный раздел
    const targetSection = document.getElementById(`${section}-section`);
    const navButton = document.querySelector(`[data-section="${section}"]`);
    
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    if (navButton) {
        navButton.classList.add('active');
    }
    
    // Загружаем контент раздела
    loadSectionContent(section);
    
    if (audioManager) audioManager.beep();
}

function loadSectionContent(section) {
    switch (section) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'radio':
            if (wastelandRadio) wastelandRadio.displayMessages();
            break;
        case 'caps':
            if (capsEconomy) capsEconomy.updateDisplays();
            break;
        case 'tsar':
            if (tsarManager) tsarManager.updateTsarDisplays();
            break;
    }
}

function updateDashboard() {
    if (!userData) return;
    
    // Обновляем дашборд
    const dailyProgress = {
        games: Math.min(userData.gamesPlayed || 0, 5),
        caps: userData.totalCapsEarned || 0,
        radio: Math.min(userData.radioMessagesSent || 0, 10)
    };
    
    const dailyElements = {
        'daily-games': `${dailyProgress.games}/5`,
        'daily-caps': capsEconomy ? capsEconomy.formatNumber(dailyProgress.caps) : dailyProgress.caps,
        'daily-radio': `${dailyProgress.radio}/10`
    };
    
    Object.entries(dailyElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-system');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Показываем с анимацией
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Автоматически убираем
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
    
    console.log(`📢 Notification: ${message} (${type})`);
}

// ===== РАДИО ФУНКЦИИ =====
function sendRadioMessage() {
    const messageInput = document.getElementById('radio-message-input');
    if (!messageInput || !wastelandRadio) return;
    
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        showNotification('❌ Message cannot be empty', 'error');
        return;
    }
    
    if (!userData) return;
    
    // Проверяем стоимость и возможность отправки
    const cost = CONFIG.RADIO_COSTS[messageType];
    
    if (messageType === 'anonymous' && userData.tsarBalance < cost) {
        showNotification(`❌ Anonymous messages require ${cost.toLocaleString()} TSAR tokens`, 'error');
        return;
    }
    
    if (messageType === 'sponsored' && userData.tsarBalance < cost) {
        showNotification(`❌ Sponsored messages require ${cost.toLocaleString()} TSAR tokens`, 'error');
        return;
    }
    
    // Списываем TSAR за премиум сообщения
    if (cost > 0) {
        const spendResult = tsarManager.spendTsar(cost, `radio-${messageType}`);
        if (!spendResult.success) {
            showNotification(`❌ ${spendResult.message}`, 'error');
            return;
        }
    }
    
    // Добавляем сообщение
    wastelandRadio.addMessage(messageText, userData.name, messageType);
    
    // Очищаем форму
    messageInput.value = '';
    const charCount = document.getElementById('char-count');
    if (charCount) charCount.textContent = '0/200';
    
    // Обновляем статистику
    userData.radioMessagesSent = (userData.radioMessagesSent || 0) + 1;
    
    // Обновляем прогресс миссий
    if (missionSystem) {
        missionSystem.updateProgress('radio_sent', 1);
    }
    
    updateUserDisplay();
    showNotification('📻 Message transmitted successfully!', 'success');
    
    console.log(`📻 Radio message sent: ${messageType}`);
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupEventHandlers() {
    console.log('🔧 Setting up event handlers...');
    
    setupNavigation();
    setupRadioHandlers();
    setupGameControls();
    setupTsarHandlers();
}

function setupNavigation() {
    // Навигационные кнопки
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const section = btn.dataset.section;
            showSection(section);
        });
    });
    
    console.log('🧭 Navigation handlers set up');
}

function setupRadioHandlers() {
    // Типы сообщений
    document.querySelectorAll('.msg-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.msg-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            messageType = btn.dataset.type;
            
            if (audioManager) audioManager.click();
            console.log(`📻 Message type changed to: ${messageType}`);
        });
    });
    
    // Кнопка отправки
    const transmitBtn = document.getElementById('transmit-btn');
    if (transmitBtn) {
        transmitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sendRadioMessage();
        });
    }
    
    // Счетчик символов
    const messageInput = document.getElementById('radio-message-input');
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            const count = this.value.length;
            const counter = document.getElementById('char-count');
            if (counter) {
                counter.textContent = `${count}/200`;
            }
        });
    }
    
    console.log('📻 Radio handlers set up');
}

function setupGameControls() {
    // Управление Wasteland Wings
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = btn.dataset.action;
            
            if (action === 'shoot') {
                if (wingsGame) wingsGame.shoot();
            } else {
                if (wingsGame) wingsGame.movePlayer(action);
            }
        });
    });
    
    console.log('🎮 Game control handlers set up');
}

function setupTsarHandlers() {
    // Покупка TSAR
    const buyTsarBtns = document.querySelectorAll('[onclick*="buyTsarWithStars"]');
    buyTsarBtns.forEach(btn => {
        btn.removeAttribute('onclick'); // Убираем старые обработчики
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (tsarManager) tsarManager.buyTsarWithStars();
        });
    });
    
    // Подключение кошелька
    const connectBtns = document.querySelectorAll('[onclick*="connectTonWallet"]');
    connectBtns.forEach(btn => {
        btn.removeAttribute('onclick'); // Убираем старые обработчики
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (tsarManager) tsarManager.connectTonWallet();
        });
    });
    
    console.log('⭐ TSAR handlers set up');
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initializeApp() {
    console.log('🚀 Initializing RUNNER Terminal v3.0...');
    
    // Создаем все системы
    audioManager = new AudioManager();
    capsEconomy = new CapsEconomy();
    tsarManager = new TsarManager();
    wastelandRadio = new WastelandRadio();
    terminalGame = new TerminalHackingGame();
    wingsGame = new WastelandWingsGame();
    cyberDuel = new CyberDuelGame();
    missionSystem = new MissionSystem();
    
    // Загружаем пользовательские данные
    loadUserData();
    
    // Настраиваем обработчики
    setupEventHandlers();
    
    // Показываем дашборд по умолчанию
    showSection('dashboard');
    
    // Инициализируем аудио при первом взаимодействии
    const initAudio = () => {
        if (audioManager) audioManager.init();
    };
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
    
    // Интеграция с Telegram
    if (window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        webApp.ready();
        webApp.expand();
        
        const telegramUser = webApp.initDataUnsafe?.user;
        if (telegramUser && userData) {
            userData.name = telegramUser.username || userData.name;
            userData.telegramId = telegramUser.id;
            userData.firstName = telegramUser.first_name;
            saveUserData();
            console.log('📱 Telegram user integrated:', telegramUser.username);
        }
    }
    
    console.log('✅ RUNNER Terminal v3.0 initialized successfully!');
    showNotification('🎮 RUNNER Terminal v3.0 online!\nEarn CAPS, trade, and dominate the wasteland!', 'success', 4000);
}

// ===== ЗАПУСК =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Предотвращение зума на мобильных
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

console.log('🎮 RUNNER Terminal v3.0 - Script loaded with real TSAR token integration');
console.log('📄 TSAR Contract:', CONFIG.TSAR_CONTRACT);