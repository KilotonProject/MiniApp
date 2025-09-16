// RUNNER TERMINAL - Simple Working Version v2.1
let userData = null;
let menuOpen = false;
let messageType = 'public';
let currentLanguage = 'en';
let soundEnabled = true;
let gameScore = 0;

// Упрощенная звуковая система
class SimpleAudio {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (error) {
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
            
            gain.gain.setValueAtTime(0.05, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.08);
        } catch (e) {}
    }
    
    playWelcomeMelody() {
        if (!this.enabled || !this.initialized || !this.context) return;
        
        const notes = [220, 246, 261, 293, 261, 220];
        let time = this.context.currentTime + 0.5;
        
        notes.forEach((note, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.type = 'triangle';
            osc.frequency.value = note;
            
            gain.gain.setValueAtTime(0.03, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
            
            osc.start(time);
            osc.stop(time + 0.4);
            
            time += 0.5;
        });
    }
}

// Упрощенная система радио
class SimpleRadio {
    constructor() {
        this.messages = [
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
            }
        ];
        this.nextId = 3;
    }

    addMessage(text, author, type = 'public') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const message = {
            id: this.nextId++,
            author: type === 'anonymous' ? 'ANONYMOUS_USER' : author,
            text: text.substring(0, 200),
            time: timeStr,
            type: type
        };
        
        this.messages.unshift(message);
        return message;
    }

    getMessages() {
        return this.messages;
    }
}

// Простые классы-заглушки
class SimpleMultiplayer {
    constructor() {
        this.currentGame = null;
    }
    
    stopSimulation() {}
}

class SimpleMarket {
    constructor() {
        this.listings = [
            {
                title: 'Rare Terminal Skin',
                description: 'Unique blue-glow terminal theme',
                price: 100,
                currency: 'TSAR',
                seller: 'TECH_TRADER_99'
            }
        ];
    }
    
    getListings() {
        return this.listings;
    }
}

class SimpleCrafting {
    constructor() {}
    
    canCraft() {
        return userData && userData.tsarBalance >= 500000;
    }
}

// Инициализация
const audioManager = new SimpleAudio();
const radioManager = new SimpleRadio();
const multiplayerManager = new SimpleMultiplayer();
const tradingPost = new SimpleMarket();
const craftingManager = new SimpleCrafting();

let initStarted = false;

function initApp() {
    if (initStarted) {
        console.log("Init already started, skipping...");
        return;
    }
    
    initStarted = true;
    console.log("🚀 Starting RUNNER terminal initialization...");
    
    loadUserData();
    setupEventHandlers();
    loadRadioMessages();
    loadMarketListings();
    
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    showWelcomeScreen();
    
    console.log("✅ RUNNER terminal ready");
}

function loadUserData() {
    userData = {
        name: "RUNNER_PLAYER",
        tonBalance: 0.542,
        tsarBalance: 1250,
        starsBalance: 45,
        bottleCaps: 1250,
        level: 15,
        wins: 23,
        losses: 7,
        clan: null
    };
    
    updateUserInfo();
}

function updateUserInfo() {
    if (userData) {
        const balanceDisplay = document.getElementById('balance-display');
        const capsDisplay = document.getElementById('caps-display');
        
        if (balanceDisplay) balanceDisplay.textContent = `TON: ${userData.tonBalance}`;
        if (capsDisplay) capsDisplay.textContent = `CAPS: ${userData.bottleCaps}`;
        
        const balanceItems = document.querySelectorAll('.crypto-amount');
        if (balanceItems.length >= 3) {
            balanceItems[0].textContent = userData.tonBalance.toString();
            balanceItems[1].textContent = userData.tsarBalance.toLocaleString();
            balanceItems[2].textContent = userData.starsBalance.toString();
        }
        
        const capsValue = document.getElementById('caps-value');
        if (capsValue) {
            capsValue.textContent = userData.bottleCaps.toString();
        }
        
        const clanStatus = document.getElementById('clan-status');
        if (clanStatus) {
            clanStatus.textContent = userData.clan || 'NO CLAN';
        }
        
        updateCraftingAccess();
    }
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
    
    const initAudio = () => {
        audioManager.init().then(() => {
            setTimeout(() => {
                audioManager.playWelcomeMelody();
            }, 1000);
        });
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
        if (currentLine >= bootMessages.length) {
            showContinuePrompt();
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
            setTimeout(typeNextLine, 500);
        });
    }
    
    setTimeout(typeNextLine, 1000);
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
                setTimeout(callback, 200);
            }
        }
    }, 60);
}

function showContinuePrompt() {
    const progressText = document.getElementById('progress-text');
    const continueSection = document.getElementById('continue-section');
    
    if (progressText) {
        progressText.textContent = 'SYSTEM READY';
    }
    
    if (continueSection) {
        continueSection.style.display = 'block';
        
        const continueHandler = (e) => {
            e.preventDefault();
            
            if (!audioManager.initialized) {
                audioManager.init();
            }
            audioManager.beep();
            
            hideAllScreens();
            document.getElementById('main-screen').classList.add('active');
            showSection('stat');
            
            continueSection.removeEventListener('click', continueHandler);
            continueSection.removeEventListener('touchstart', continueHandler);
            document.removeEventListener('keydown', keyHandler);
        };
        
        const keyHandler = continueHandler;
        
        continueSection.addEventListener('click', continueHandler);
        continueSection.addEventListener('touchstart', continueHandler);
        document.addEventListener('keydown', keyHandler);
    }
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

function setupEventHandlers() {
    console.log("🔧 Setting up simple event handlers...");
    
    setupSimpleNavigation();
    setupGameHandlers();
    setupRadioHandlers();
    setupWalletHandlers();
    setupClanHandlers();
    setupSettingsHandlers();
    setupMarketHandlers();
    setupNuclearHandlers();
    
    console.log("✅ All handlers setup complete");
}

// НОВАЯ ПРОСТАЯ НАВИГАЦИЯ БЕЗ ПРОБЛЕМ
function setupSimpleNavigation() {
    console.log("🔧 Setting up SIMPLE navigation...");
    
    const menuBtn = document.getElementById('simple-menu-toggle');
    const closeBtn = document.getElementById('simple-close');
    const nav = document.getElementById('simple-nav');
    
    if (!menuBtn || !closeBtn || !nav) {
        console.error("❌ Simple menu elements not found!");
        return;
    }
    
    console.log("✅ Simple menu elements found");
    
    // Открытие меню
    function openSimpleMenu() {
        console.log("📂 Opening simple menu");
        nav.style.display = 'block';
        menuOpen = true;
        console.log("✅ Simple menu opened");
    }
    
    // Закрытие меню
    function closeSimpleMenu() {
        console.log("📁 Closing simple menu");
        nav.style.display = 'none';
        menuOpen = false;
        console.log("✅ Simple menu closed");
    }
    
    // Обработчики
    menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("🔄 Simple menu button clicked");
        audioManager.beep();
        
        if (menuOpen) {
            closeSimpleMenu();
        } else {
            openSimpleMenu();
        }
    });
    
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("❌ Simple close button clicked");
        audioManager.beep();
        closeSimpleMenu();
    });
    
    // Навигационные кнопки
    document.querySelectorAll('.simple-nav-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const section = button.getAttribute('data-section');
            console.log(`🎯 Simple nav to: ${section}`);
            
            audioManager.beep();
            showSection(section);
            closeSimpleMenu();
        });
    });
    
    console.log("✅ Simple navigation setup complete");
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
        console.log(`✅ Section activated: ${section}`);
    } else {
        console.error(`❌ Section not found: ${section}`);
    }
}

function setupGameHandlers() {
    const terminalBtn = document.getElementById('terminal-hack-btn');
    if (terminalBtn) {
        terminalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            showGameScreen();
        });
    }

    const gameButtons = ['chess-btn', 'shmup-btn', 'battle-arena-btn'];
    gameButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                audioManager.beep();
                alert('[GAME]\nComing in future updates!');
            });
        }
    });

    const backBtn = document.getElementById('back-to-arcade');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            hideAllScreens();
            document.getElementById('main-screen').classList.add('active');
            showSection('gameboy');
        });
    }

    const soloBtn = document.getElementById('solo-mode-btn');
    const mpBtn = document.getElementById('multiplayer-mode-btn');
    
    if (soloBtn) {
        soloBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            alert('[SOLO MODE]\nFeature in development!');
        });
    }

    if (mpBtn) {
        mpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            alert('[MULTIPLAYER MODE]\nFeature in development!');
        });
    }
}

function setupRadioHandlers() {
    document.querySelectorAll('.message-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            
            document.querySelectorAll('.message-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            messageType = btn.getAttribute('data-type');
        });
    });

    const sendBtn = document.getElementById('send-message');
    if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            sendRadioMessage();
        });
    }

    const refreshBtn = document.getElementById('refresh-radio');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
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
    const buttons = ['deposit-btn', 'withdraw-btn', 'stake-tsar-btn', 'add-tokens-btn'];
    
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                audioManager.beep();
                alert(`[${id.toUpperCase()}]\nFeature coming soon!`);
            });
        }
    });
}

function setupClanHandlers() {
    const createBtn = document.getElementById('create-clan-btn');
    if (createBtn) {
        createBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            
            const clanName = prompt('Enter clan name (3-20 characters):');
            if (clanName && clanName.length >= 3 && clanName.length <= 20) {
                if (userData.tsarBalance >= 1000) {
                    userData.tsarBalance -= 1000;
                    userData.clan = clanName.toUpperCase();
                    updateUserInfo();
                    alert(`[SUCCESS] Clan "${userData.clan}" created!\n1000 TSAR spent`);
                } else {
                    alert('[ERROR] Insufficient TSAR tokens\nRequired: 1000 TSAR');
                }
            }
        });
    }

    const joinBtn = document.getElementById('join-clan-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            alert('[JOIN CLAN]\nFeature coming soon!');
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
            
            if (soundEnabled) {
                audioManager.beep();
            }
        });
    }

    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            audioManager.beep();
            alert(`[LANGUAGE] Changed to ${e.target.value.toUpperCase()}`);
        });
    }
}

function setupMarketHandlers() {
    const createBtn = document.getElementById('create-shop-btn');
    if (createBtn) {
        createBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            alert('[CREATE SHOP]\nMarketplace feature coming soon!');
        });
    }

    const browseBtn = document.getElementById('browse-market-btn');
    if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            alert('[BROWSE MARKET]\nShowing available listings.');
        });
    }
}

function setupNuclearHandlers() {
    const buyBtn = document.getElementById('buy-btn');
    const sellBtn = document.getElementById('sell-btn');
    
    if (buyBtn) {
        buyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            alert('[BUY ORDER]\nCrypto trading coming soon!');
        });
    }

    if (sellBtn) {
        sellBtn.addEventListener('click', (e) => {
            e.preventDefault();
            audioManager.beep();
            alert('[SELL ORDER]\nCrypto trading coming soon!');
        });
    }
}

function sendRadioMessage() {
    const messageInput = document.getElementById('radio-message');
    if (!messageInput) return;
    
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        alert('[ERROR] Message cannot be empty');
        return;
    }

    if (messageType === 'anonymous' && userData.tsarBalance < 5000) {
        alert('[ERROR] Insufficient TSAR tokens\nRequired: 5000 TSAR');
        return;
    }

    if (messageType === 'sponsored' && userData.tsarBalance < 10000) {
        alert('[ERROR] Insufficient TSAR tokens\nRequired: 10000 TSAR');
        return;
    }

    if (messageType === 'anonymous') {
        userData.tsarBalance -= 5000;
        alert('[SUCCESS] Anonymous message posted\n5000 TSAR burned');
    } else if (messageType === 'sponsored') {
        userData.tsarBalance -= 10000;
        alert('[SUCCESS] Sponsored message posted\n10000 TSAR burned');
    }

    radioManager.addMessage(messageText, userData.name, messageType);
    
    messageInput.value = '';
    const counter = document.getElementById('char-counter');
    if (counter) {
        counter.textContent = '0/200';
    }
    
    updateUserInfo();
    loadRadioMessages();
}

function loadRadioMessages() {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent) return;
    
    const messages = radioManager.getMessages();
    
    feedContent.innerHTML = messages.map(msg => `
        <div class="radio-message ${msg.type}">
            <div class="message-header">
                <span class="message-author ${msg.type}">${msg.author}</span>
                <span class="message-time">${msg.time}</span>
            </div>
            <div class="message-text">${msg.text}</div>
        </div>
    `).join('');
}

function loadMarketListings() {
    const listingsContainer = document.getElementById('listings-container');
    if (!listingsContainer) return;
    
    const listings = tradingPost.getListings();
    
    listingsContainer.innerHTML = listings.map(listing => `
        <div class="market-listing">
            <div class="listing-header">
                <span class="listing-title">${listing.title}</span>
                <span class="listing-price">${listing.price} ${listing.currency}</span>
            </div>
            <div class="listing-description">${listing.description}</div>
            <div class="listing-seller">Seller: ${listing.seller}</div>
        </div>
    `).join('');
}

function updateCraftingAccess() {
    const hasAccess = craftingManager.canCraft();
    const craftStatus = document.getElementById('craft-status');
    
    if (craftStatus) {
        if (hasAccess) {
            craftStatus.textContent = 'UNLOCKED';
            craftStatus.style.color = 'var(--pipboy-green)';
        } else {
            craftStatus.textContent = 'LOCKED';
            craftStatus.style.color = '#ff6600';
        }
    }
}

function showGameScreen() {
    hideAllScreens();
    document.getElementById('game-screen').classList.add('active');
    gameScore = 0;
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
        scoreDisplay.textContent = `SCORE: ${gameScore}`;
    }
    alert('[TERMINAL HACKING]\nGame feature in development!');
}

// Инициализация (предотвращаем двойную)
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 RUNNER DOM loaded");
    setTimeout(initApp, 100);
});

// Убираем повторную инициализацию в window.load