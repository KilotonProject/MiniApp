/* ================================================================
   RUNNER Terminal v3.0 - Mobile-Optimized with Real TSAR Integration
   TSAR Contract: EQBKLYdv3bEce0nfo__qbmIK2UOCN-ShzobnlhKUOSytWg6o
   ================================================================ */

// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    // Nuke Cola CAPS (виртуальная валюта)
    CAPS_TOTAL_SUPPLY: 1000000000,
    CAPS_INITIAL_AMOUNT: 1000,
    CAPS_EARNING_MULTIPLIER: 1.0,
    CAPS_NAME: 'Nuke Cola',
    CAPS_TICKER: 'CAPS',
    
    // TSAR Token (реальный)
    TSAR_CONTRACT: 'EQBKLYdv3bEce0nfo__qbmIK2UOCN-ShzobnlhKUOSytWg6o',
    TSAR_DECIMALS: 9,
    TSAR_NOT_EARNABLE: true,
    
    // TSAR Tiers
    TSAR_TIERS: {
        BASIC: 0,
        SILVER: 10000,
        GOLD: 20000,
        DIAMOND: 50000
    },
    
    // Radio Costs (TSAR only)
    RADIO_COSTS: {
        public: 0,
        anonymous: 10000,
        sponsored: 20000
    },
    
    // Game Rewards (CAPS only)
    GAME_REWARDS: {
        'terminal-hacking': { min: 50, max: 200 },
        'wasteland-wings': { min: 100, max: 500 },
        'cyber-duel': { min: 200, max: 1000 }
    },
    
    // Updates
    PRICE_UPDATE_INTERVAL: 5000,
    CHART_UPDATE_INTERVAL: 3000,
    RADIO_UPDATE_INTERVAL: 15000,
    
    // Blockchain готовность
    BLOCKCHAIN_READY: false,
    TEST_MODE: true,
    
    // Telegram
    BOT_USERNAME: 'kiloton_runner_terminal_bot'
};

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let userData = null;
let gameActive = false;
let messageType = 'public';
let currentGame = null;
let currentTradeTab = 'buy';
let selectedTradeAmount = 100;

// Системы
let audioManager;
let capsEconomy;
let tsarManager;
let wastelandRadio;
let terminalGame;
let wingsGame;
let cyberDuel;
let missionSystem;
let chartManager;
let mobileInterface;

// ===== МОБИЛЬНЫЙ ИНТЕРФЕЙС =====
class MobileInterface {
    constructor() {
        this.currentSection = 'dashboard';
        this.setupTouchHandlers();
        this.setupNavigation();
    }
    
    setupTouchHandlers() {
        // Предотвращение зума
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Предотвращение двойного тапа
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        console.log('📱 Mobile touch handlers initialized');
    }
    
    setupNavigation() {
        document.querySelectorAll('.nav-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                
                const section = card.dataset.section;
                this.showSection(section);
                
                if (audioManager) audioManager.click();
            });
        });
        
        console.log('🧭 Mobile navigation setup complete');
    }
    
    showSection(section) {
        console.log(`📂 Mobile: Showing section ${section}`);
        
        // Убираем активные классы
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Показываем новый раздел
        const targetSection = document.getElementById(`${section}-section`);
        const navCard = document.querySelector(`[data-section="${section}"]`);
        
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
        }
        
        if (navCard) {
            navCard.classList.add('active');
        }
        
        // Загружаем контент
        this.loadSectionContent(section);
        
        // Скроллим навигацию к активной карточке
        if (navCard) {
            navCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest', 
                inline: 'center' 
            });
        }
    }
    
    loadSectionContent(section) {
        switch (section) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'games':
                this.updateGamesList();
                break;
            case 'missions':
                if (missionSystem) missionSystem.updateMissionsDisplay();
                break;
            case 'leaderboard':
                this.updateLeaderboard();
                break;
            case 'caps':
                if (capsEconomy) capsEconomy.updateDisplays();
                break;
            case 'trading':
                if (chartManager) {
                    setTimeout(() => chartManager.initChart(), 100);
                    chartManager.updateTradingInterface();
                }
                break;
            case 'tsar':
                if (tsarManager) tsarManager.updateTsarDisplays();
                break;
            case 'radio':
                if (wastelandRadio) wastelandRadio.displayMessages();
                break;
            case 'market':
                this.updateMarket();
                break;
        }
    }
    
    updateDashboard() {
        if (!userData) return;
        
        // Обновляем статистику
        const updates = {
            'dash-caps': capsEconomy ? capsEconomy.formatNumber(userData.capsBalance) : userData.capsBalance,
            'dash-tsar': tsarManager ? tsarManager.formatTsarAmount(userData.tsarBalance) : userData.tsarBalance,
            'dash-stars': userData.starsBalance || 0,
            'dash-games': userData.gamesPlayed || 0,
            'dash-winrate': this.calculateWinRate(),
            'dash-rank': capsEconomy ? capsEconomy.calculateUserRank() : '#∞',
            'dash-caps-price': capsEconomy ? capsEconomy.priceInTon.toFixed(8) : '0.00001',
            'dash-volume': capsEconomy ? capsEconomy.formatNumber(capsEconomy.volume24h) : '1.0M'
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Обновляем изменение цены
        if (capsEconomy) capsEconomy.updatePriceChange();
        
        console.log('📊 Dashboard updated');
    }
    
    calculateWinRate() {
        if (!userData || userData.gamesPlayed === 0) return '0%';
        return ((userData.gamesWon / userData.gamesPlayed) * 100).toFixed(1) + '%';
    }
    
    updateGamesList() {
        console.log('🎮 Games list updated');
    }
    
    updateLeaderboard() {
        const leaderboardData = this.generateMockLeaderboard();
        const listElement = document.getElementById('leaderboard-list');
        
        if (listElement) {
            listElement.innerHTML = leaderboardData.map((player, index) => `
                <div class="leaderboard-item">
                    <div class="rank-badge ${index < 3 ? 'top3' : ''}">${index + 1}</div>
                    <div class="player-info">
                        <div class="player-name">${player.name}</div>
                        <div class="player-stats">${player.stats}</div>
                    </div>
                    <div class="player-value">${player.value}</div>
                </div>
            `).join('');
        }
    }
    
    generateMockLeaderboard() {
        const players = [
            'VAULT_HUNTER', 'CYBER_NINJA', 'NEON_GHOST', 'DATA_NOMAD',
            'SHADOW_TRADER', 'QUANTUM_PILOT', 'DIGITAL_WARRIOR', 'CHROME_KING',
            'MATRIX_LORD', 'PLASMA_SAGE'
        ];
        
        return players.map((name, i) => ({
            name: name,
            stats: `Level ${10 - i} • ${95 - i * 5}% WR`,
            value: capsEconomy ? capsEconomy.formatNumber(50000 - i * 5000) : `${50 - i * 5}K`
        }));
    }
    
    updateMarket() {
        console.log('🛒 Market updated');
    }
}

// ===== CHART MANAGER =====
class ChartManager {
    constructor() {
        this.charts = {};
        this.priceHistory = [];
        this.maxDataPoints = 50;
        this.currentTimeframe = '1m';
        
        this.initializePriceHistory();
        this.startChartUpdates();
    }
    
    initializePriceHistory() {
        // Генерируем историю цен
        const basePrice = 0.00001;
        const now = Date.now();
        
        for (let i = this.maxDataPoints - 1; i >= 0; i--) {
            const timestamp = now - (i * 60000); // Каждую минуту
            const volatility = 0.02;
            const change = (Math.random() - 0.5) * volatility;
            const price = i === this.maxDataPoints - 1 ? 
                basePrice : 
                this.priceHistory[this.priceHistory.length - 1].price * (1 + change);
            
            this.priceHistory.push({
                timestamp: timestamp,
                price: Math.max(price, 0.000001),
                volume: Math.floor(Math.random() * 10000) + 5000
            });
        }
        
        console.log('📈 Price history initialized');
    }
    
    startChartUpdates() {
        setInterval(() => {
            this.updatePriceHistory();
            this.updateCharts();
        }, CONFIG.CHART_UPDATE_INTERVAL);
    }
    
    updatePriceHistory() {
        if (capsEconomy) {
            // Добавляем новую точку
            this.priceHistory.push({
                timestamp: Date.now(),
                price: capsEconomy.priceInTon,
                volume: capsEconomy.volume24h
            });
            
            // Ограничиваем размер
            if (this.priceHistory.length > this.maxDataPoints) {
                this.priceHistory.shift();
            }
        }
    }
    
    updateCharts() {
        // Обновляем все активные графики
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.data) {
                this.updateChartData(chart);
            }
        });
    }
    
    initChart() {
        const canvas = document.getElementById('caps-price-chart');
        if (!canvas) {
            console.error('❌ Chart canvas not found');
            return;
        }
        
        console.log('📊 Initializing CAPS price chart...');
        
        const ctx = canvas.getContext('2d');
        
        // Уничтожаем существующий график
        if (this.charts.capsPrice) {
            this.charts.capsPrice.destroy();
        }
        
        this.charts.capsPrice = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.priceHistory.map(point => 
                    new Date(point.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })
                ),
                datasets: [{
                    label: 'CAPS Price',
                    data: this.priceHistory.map(point => point.price),
                    borderColor: '#ffd700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#ffd700',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#00ff41',
                        bodyColor: '#ffffff',
                        borderColor: '#ffd700',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return 'CAPS Price';
                            },
                            label: function(context) {
                                return `${context.parsed.y.toFixed(8)} TON`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(0, 255, 65, 0.1)',
                            borderColor: '#00ff41'
                        },
                        ticks: {
                            color: '#00ff41',
                            font: {
                                family: 'Share Tech Mono',
                                size: 10
                            },
                            maxTicksLimit: 6
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(0, 255, 65, 0.1)',
                            borderColor: '#00ff41'
                        },
                        ticks: {
                            color: '#00ff41',
                            font: {
                                family: 'Share Tech Mono',
                                size: 10
                            },
                            callback: function(value) {
                                return value.toFixed(8);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        hoverRadius: 6
                    }
                }
            }
        });
        
        console.log('✅ CAPS chart initialized');
        
        // Инициализируем живой график
        this.initLiveTradingChart();
    }
    
    initLiveTradingChart() {
        const canvas = document.getElementById('live-trading-chart');
        if (!canvas) return;
        
        console.log('📊 Initializing live trading chart...');
        
        const ctx = canvas.getContext('2d');
        
        // Уничтожаем существующий
        if (this.charts.liveTrading) {
            this.charts.liveTrading.destroy();
        }
        
        this.charts.liveTrading = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Live Price',
                    data: [],
                    borderColor: '#00ff41',
                    backgroundColor: 'rgba(0, 255, 65, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#00ff41',
                        bodyColor: '#ffffff',
                        borderColor: '#00ff41',
                        borderWidth: 2,
                        cornerRadius: 10
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: true,
                        position: 'right',
                        grid: {
                            color: 'rgba(0, 255, 65, 0.2)'
                        },
                        ticks: {
                            color: '#00ff41',
                            font: { size: 9 },
                            callback: (value) => value.toFixed(6)
                        }
                    }
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                }
            }
        });
        
        // Заполняем начальными данными
        this.updateLiveChart();
        
        console.log('✅ Live trading chart initialized');
    }
    
    updateChartData(chart) {
        if (!chart || !this.priceHistory.length) return;
        
        chart.data.labels = this.priceHistory.map(point => 
            new Date(point.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        );
        
        chart.data.datasets[0].data = this.priceHistory.map(point => point.price);
        chart.update('none'); // Без анимации для производительности
    }
    
    updateLiveChart() {
        const chart = this.charts.liveTrading;
        if (!chart) return;
        
        const recentData = this.priceHistory.slice(-20); // Последние 20 точек
        
        chart.data.labels = recentData.map((_, i) => i);
        chart.data.datasets[0].data = recentData.map(point => point.price);
        
        chart.update('none');
    }
    
    updateTradingInterface() {
        // Обновляем торговый интерфейс
        const updates = {
            'trading-price': capsEconomy ? capsEconomy.priceInTon.toFixed(8) : '0.00001',
            'live-caps-price': capsEconomy ? capsEconomy.priceInTon.toFixed(8) : '0.00001',
            'trading-volume': capsEconomy ? capsEconomy.formatNumber(capsEconomy.volume24h) : '1.0M',
            'trade-caps-balance': userData ? capsEconomy.formatNumber(userData.capsBalance) : '0',
            'trade-ton-balance': userData ? userData.tonBalance.toFixed(3) : '0.000'
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Обновляем изменение цены
        if (capsEconomy) capsEconomy.updatePriceChange();
        
        console.log('📈 Trading interface updated');
    }
}

// ===== ОБНОВЛЕННАЯ CAPS ЭКОНОМИКА =====
class CapsEconomy {
    constructor() {
        this.totalSupply = CONFIG.CAPS_TOTAL_SUPPLY;
        this.circulatingSupply = 0;
        this.priceInTon = 0.00001;
        this.volume24h = 0;
        this.holders = 0;
        this.priceChange24h = 0;
        
        this.initializeEconomy();
        this.startEconomyUpdates();
    }
    
    initializeEconomy() {
        this.circulatingSupply = Math.floor(this.totalSupply * 0.12);
        this.holders = Math.floor(Math.random() * 15000) + 8000;
        this.volume24h = Math.floor(Math.random() * 2000000) + 800000;
        this.priceChange24h = (Math.random() - 0.3) * 15; // Склонность к росту
        
        console.log('🍺 Nuke Cola CAPS economy initialized');
    }
    
    startEconomyUpdates() {
        setInterval(() => {
            this.updateMarketData();
            this.updateDisplays();
            if (chartManager) chartManager.updateLiveChart();
        }, CONFIG.PRICE_UPDATE_INTERVAL);
    }
    
    updateMarketData() {
        // Реалистичная симуляция рынка
        const volatility = 0.025;
        const trend = 0.0002; // Небольшой положительный тренд
        const noise = (Math.random() - 0.5) * volatility;
        
        this.priceInTon = Math.max(
            this.priceInTon * (1 + trend + noise), 
            0.000001
        );
        
        // Обновляем объем с реалистичными флуктуациями
        const volumeChange = Math.floor((Math.random() - 0.5) * 50000);
        this.volume24h = Math.max(this.volume24h + volumeChange, 100000);
        
        // Иногда добавляем держателей
        if (Math.random() < 0.15) {
            this.holders += Math.floor(Math.random() * 15) + 1;
        }
        
        // Обновляем 24h изменение
        this.priceChange24h = (Math.random() - 0.4) * 12;
    }
    
    updateDisplays() {
        const updates = {
            'caps-price-main': `${this.priceInTon.toFixed(8)} TON`,
            'trading-price': this.priceInTon.toFixed(8),
            'live-caps-price': this.priceInTon.toFixed(8),
            'trading-volume': this.formatNumber(this.volume24h),
            'dash-caps-price': this.priceInTon.toFixed(8),
            'dash-volume': this.formatNumber(this.volume24h)
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        this.updatePriceChange();
    }
    
    updatePriceChange() {
        const changeText = `${this.priceChange24h >= 0 ? '+' : ''}${this.priceChange24h.toFixed(2)}%`;
        const changeClass = this.priceChange24h >= 0 ? 'positive' : 'negative';
        
        const changeElements = ['dash-price-change', 'trading-change'];
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
        const rank = Math.max(1, 75000 - Math.floor(userData.capsBalance / 15));
        return rank;
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.floor(num).toLocaleString();
    }
    
    earnCaps(amount, reason = 'game') {
        if (!userData) return false;
        
        const finalAmount = Math.floor(amount * CONFIG.CAPS_EARNING_MULTIPLIER);
        userData.capsBalance += finalAmount;
        userData.totalCapsEarned = (userData.totalCapsEarned || 0) + finalAmount;
        
        // Обновляем уровень
        this.updatePlayerLevel();
        
        this.saveUserData();
        this.updateUserDisplays();
        
        console.log(`🍺 Earned ${finalAmount} CAPS from ${reason}`);
        return finalAmount;
    }
    
    updatePlayerLevel() {
        if (!userData) return;
        
        // Простая система уровней
        const newLevel = Math.floor(userData.totalCapsEarned / 5000) + 1;
        if (newLevel > userData.level) {
            userData.level = newLevel;
            showNotification(`🎉 LEVEL UP!\nYou reached level ${newLevel}!`, 'success', 4000);
        }
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

// ===== ОБНОВЛЕННЫЙ TSAR MANAGER =====
class TsarManager {
    constructor() {
        this.contractAddress = CONFIG.TSAR_CONTRACT;
        this.decimals = CONFIG.TSAR_DECIMALS;
        this.realTimePrice = 0;
        this.userTsarBalance = 0;
        this.connected = false;
        
        this.initializeTsarData();
        this.startPriceUpdates();
    }
    
    initializeTsarData() {
        this.loadTsarPrice();
        this.checkUserTsarBalance();
    }
    
    startPriceUpdates() {
        // Обновляем цену TSAR каждые 30 секунд
        setInterval(() => {
            this.loadTsarPrice();
        }, 30000);
    }
    
    async loadTsarPrice() {
        try {
            // Симуляция цены TSAR (в будущем - реальный API)
            this.realTimePrice = 0.001 + Math.random() * 0.0008;
            
            // TODO: Заменить на реальный запрос к TON API
            // const response = await fetch(`${CONFIG.TON_API_URL}/getTokenData?contract=${this.contractAddress}`);
            // const data = await response.json();
            // this.realTimePrice = data.price;
            
            console.log(`📈 TSAR price: ${this.realTimePrice.toFixed(6)} TON`);
        } catch (error) {
            console.warn("⚠️ TSAR price load failed:", error);
            this.realTimePrice = 0.001;
        }
    }
    
    async checkUserTsarBalance() {
        // Пока используем локальные данные
        if (userData && userData.tsarBalance) {
            this.userTsarBalance = userData.tsarBalance;
        }
        
        // TODO: Реальная проверка баланса
        // if (this.connected && userData.tonWalletAddress) {
        //     const balance = await this.getTsarBalance(userData.tonWalletAddress);
        //     this.userTsarBalance = balance;
        //     userData.tsarBalance = balance;
        // }
        
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
        
        let tier = 'BASIC';
        if (tsarAmount >= CONFIG.TSAR_TIERS.DIAMOND) tier = 'DIAMOND';
        else if (tsarAmount >= CONFIG.TSAR_TIERS.GOLD) tier = 'GOLD';
        else if (tsarAmount >= CONFIG.TSAR_TIERS.SILVER) tier = 'SILVER';
        
        // Обновляем статус
        const statusElement = document.getElementById('tsar-status');
        if (statusElement) {
            statusElement.textContent = `${tier} MEMBER`;
        }
        
        // Обновляем тиры
        this.updateTierCards(tsarAmount);
        this.updateFeatureAccess(tsarAmount);
        
        console.log(`⭐ TSAR privileges updated: ${tier}`);
    }
    
    updateTierCards(tsarAmount) {
        document.querySelectorAll('.tier-item').forEach(item => {
            const tier = item.dataset.tier;
            const requirement = this.getTierRequirement(tier);
            
            if (tsarAmount >= requirement) {
                item.classList.add('unlocked');
            } else {
                item.classList.remove('unlocked');
            }
        });
    }
    
    getTierRequirement(tier) {
        switch (tier) {
            case 'basic': return 0;
            case 'silver': return CONFIG.TSAR_TIERS.SILVER;
            case 'gold': return CONFIG.TSAR_TIERS.GOLD;
            case 'diamond': return CONFIG.TSAR_TIERS.DIAMOND;
            default: return 0;
        }
    }
    
    updateFeatureAccess(tsarAmount) {
        // Радио функции
        const anonBtn = document.querySelector('[data-type="anonymous"]');
        const sponsorBtn = document.querySelector('[data-type="sponsored"]');
        
        if (anonBtn) {
            const canUseAnon = tsarAmount >= CONFIG.TSAR_TIERS.SILVER;
            anonBtn.disabled = !canUseAnon;
            anonBtn.style.opacity = canUseAnon ? '1' : '0.5';
        }
        
        if (sponsorBtn) {
            const canUseSponsor = tsarAmount >= CONFIG.TSAR_TIERS.GOLD;
            sponsorBtn.disabled = !canUseSponsor;
            sponsorBtn.style.opacity = canUseSponsor ? '1' : '0.5';
        }
    }
    
    formatTsarAmount(amount) {
        if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
        if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
        return Math.floor(amount).toLocaleString();
    }
    
    async buyTsarWithStars(starsAmount = 100) {
        // Заглушка для покупки TSAR за Stars
        showNotification(
            '⭐ TSAR Purchase\n\nThis feature will be available soon!\nYou will be able to buy TSAR tokens with Telegram Stars.',
            'info',
            5000
        );
        
        // TODO: Реальная интеграция
        // const invoice = await window.Telegram.WebApp.invokeCustomMethod('createInvoice', {
        //     title: 'TSAR Tokens',
        //     description: `${starsAmount * 100} TSAR tokens`,
        //     payload: JSON.stringify({ type: 'tsar_purchase', amount: starsAmount * 100 }),
        //     currency: 'XTR',
        //     prices: [{ label: 'TSAR Tokens', amount: starsAmount }]
        // });
        
        return false;
    }
    
    async connectTonWallet() {
        try {
            showNotification(
                '🔗 TON Wallet Connection\n\nBlockchain integration coming in next update!\nConnect your TON wallet to sync TSAR balance.',
                'info',
                5000
            );
            
            // TODO: TON Connect интеграция
            // const connector = new TonConnect();
            // await connector.connect();
            // this.connected = true;
            // await this.checkUserTsarBalance();
            
            return false;
        } catch (error) {
            showNotification('❌ Wallet connection failed', 'error');
            return false;
        }
    }
    
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

// ===== ОБНОВЛЕННАЯ СИСТЕМА МИССИЙ =====
class MissionSystem {
    constructor() {
        this.missions = [
            {
                id: 'first_hack',
                title: 'First Hack',
                description: 'Complete your first Terminal Hacking',
                type: 'tutorial',
                requirement: 1,
                current: 0,
                reward: 200,
                completed: false,
                trackType: 'terminal_completed',
                icon: '🔓'
            },
            {
                id: 'pilot_wings',
                title: 'Pilot Wings',
                description: 'Score 500+ in Wasteland Wings',
                type: 'challenge',
                requirement: 500,
                current: 0,
                reward: 300,
                completed: false,
                trackType: 'wings_score',
                icon: '✈️'
            },
            {
                id: 'duel_master',
                title: 'Duel Master',
                description: 'Win 3 Cyber Duels',
                type: 'challenge',
                requirement: 3,
                current: 0,
                reward: 500,
                completed: false,
                trackType: 'duel_won',
                icon: '⚔️'
            },
            {
                id: 'caps_collector',
                title: 'CAPS Collector',
                description: 'Accumulate 5,000 CAPS',
                type: 'milestone',
                requirement: 5000,
                current: 0,
                reward: 1000,
                completed: false,
                trackType: 'caps_balance',
                icon: '🍺'
            },
            {
                id: 'radio_star',
                title: 'Radio Star',
                description: 'Send 5 radio messages',
                type: 'social',
                requirement: 5,
                current: 0,
                reward: 400,
                completed: false,
                trackType: 'radio_sent',
                icon: '📻'
            },
            {
                id: 'daily_player',
                title: 'Daily Player',
                description: 'Play 5 games today',
                type: 'daily',
                requirement: 5,
                current: 0,
                reward: 600,
                completed: false,
                trackType: 'games_played',
                icon: '🎮'
            }
        ];
        
        this.loadProgress();
        this.updateMissionsDisplay();
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
            console.warn('Failed to load missions:', e);
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
            console.warn('Failed to save missions:', e);
        }
    }
    
    updateProgress(trackType, value = 1) {
        this.missions.forEach(mission => {
            if (mission.completed || mission.trackType !== trackType) return;
            
            if (trackType === 'caps_balance') {
                mission.current = userData?.capsBalance || 0;
            } else if (trackType === 'wings_score') {
                mission.current = Math.max(mission.current, value);
            } else if (trackType === 'duel_won' && value === true) {
                mission.current += 1;
            } else {
                mission.current += value;
            }
            
            if (mission.current >= mission.requirement) {
                this.completeMission(mission.id);
            }
        });
        
        this.saveProgress();
        this.updateMissionsDisplay();
    }
    
    completeMission(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.completed) return;
        
        mission.completed = true;
        
        const earnedCaps = capsEconomy.earnCaps(mission.reward, `mission-${missionId}`);
        
        showNotification(
            `🎉 MISSION COMPLETED!\n${mission.title}\n+${earnedCaps} CAPS earned!`,
            'success',
            6000
        );
        
        // Обновляем ачивки
        this.updateAchievements(mission.icon);
        
        console.log(`✅ Mission completed: ${mission.title}`);
    }
    
    updateAchievements(icon) {
        // Обновляем отображение достижений
        const achievementItems = document.querySelectorAll('.achievement-item');
        achievementItems.forEach(item => {
            const itemIcon = item.querySelector('.achievement-icon');
            if (itemIcon && itemIcon.textContent === icon) {
                item.classList.remove('locked');
                item.classList.add('unlocked');
            }
        });
    }
    
    updateMissionsDisplay() {
        const dailyContainer = document.getElementById('daily-missions');
        const challengeContainer = document.getElementById('challenge-missions');
        
        if (!dailyContainer || !challengeContainer) return;
        
        const dailyMissions = this.missions.filter(m => m.type === 'daily' || m.type === 'tutorial');
        const challengeMissions = this.missions.filter(m => m.type === 'challenge' || m.type === 'milestone' || m.type === 'social');
        
        dailyContainer.innerHTML = this.renderMissions(dailyMissions);
        challengeContainer.innerHTML = this.renderMissions(challengeMissions);
    }
    
    renderMissions(missions) {
        return missions.map(mission => {
            const progress = Math.min(mission.current, mission.requirement);
            const percentage = (progress / mission.requirement) * 100;
            
            return `
                <div class="mission-item ${mission.completed ? 'completed' : ''}">
                    <div class="mission-icon">${mission.icon}</div>
                    <div class="mission-details">
                        <div class="mission-title">${mission.title}</div>
                        <div class="mission-desc">${mission.description}</div>
                        <div class="mission-progress">
                            <span class="progress-text">${progress}/${mission.requirement}</span>
                            <span class="progress-reward">+${mission.reward} CAPS</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ===== AUDIO MANAGER =====
class AudioManager {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.masterVolume = 0.08; // Тише для мобильных
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
            console.log("🔊 Mobile audio system online");
        } catch (error) {
            console.warn("⚠️ Audio unavailable:", error);
            this.enabled = false;
        }
    }

    playSound(frequency, duration = 0.1, type = 'sine') {
        if (!this.enabled || !this.initialized || !this.context) return;
        
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
            console.warn("Audio failed:", e);
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

// ===== ИСПРАВЛЕННЫЕ ИГРЫ =====

// Terminal Hacking Game (Mobile Optimized)
class TerminalHackingGame {
    constructor() {
        this.wordLists = {
            4: ['HACK', 'CODE', 'DATA', 'BYTE', 'CORE', 'FIRE', 'WAVE', 'ZERO', 'LOCK', 'BOOT'],
            5: ['VIRUS', 'CYBER', 'LOGIN', 'ADMIN', 'GHOST', 'QUICK', 'BRAIN', 'STORM', 'POWER', 'MAGIC'],
            6: ['MATRIX', 'SYSTEM', 'ACCESS', 'SECURE', 'BYPASS', 'NEURAL', 'BINARY', 'CRYPTO', 'SHADOW', 'VECTOR'],
            7: ['NETWORK', 'PROGRAM', 'MACHINE', 'DIGITAL', 'PROCESS', 'HACKER', 'ANDROID', 'QUANTUM', 'PHOENIX', 'NEXUS'],
            8: ['PASSWORD', 'TERMINAL', 'DATABASE', 'PROTOCOL', 'MAINFRAME', 'OVERRIDE', 'BACKDOOR', 'FIREWALL', 'ALGORITHM', 'CYBERDECK']
        };
        
        this.reset();
    }
    
    reset() {
        this.currentWords = [];
        this.correctWord = '';
        this.attemptsLeft = 4;
        this.gameActive = false;
        this.startTime = 0;
        this.hintsUsed = 0;
    }
    
    startGame() {
        console.log('🖥️ Starting Terminal Hacking (Mobile)...');
        
        this.reset();
        this.gameActive = true;
        this.startTime = Date.now();
        
        this.generateWords();
        this.generateMobileHexDump();
        this.updateUI();
        
        this.addLogEntry('ROBCO INDUSTRIES (TM) TERMLINK');
        this.addLogEntry('PASSWORD REQUIRED');
        this.addLogEntry('TAP PASSWORD TO SELECT');
        
        if (audioManager) audioManager.beep();
        
        showNotification('🖥️ Terminal access required!\nFind the correct password!', 'info', 3000);
    }
    
    generateWords() {
        const playerLevel = userData?.level || 1;
        const wordLength = Math.min(4 + Math.floor(playerLevel / 3), 7); // Мобильная версия проще
        
        const availableWords = [...this.wordLists[wordLength]];
        this.currentWords = [];
        
        const wordCount = 8 + Math.floor(Math.random() * 2); // Меньше слов для мобильной
        
        for (let i = 0; i < wordCount && availableWords.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            this.currentWords.push(availableWords.splice(randomIndex, 1)[0]);
        }
        
        this.correctWord = this.currentWords[Math.floor(Math.random() * this.currentWords.length)];
        
        console.log('🔑 Correct password:', this.correctWord);
    }
    
    generateMobileHexDump() {
        const hexSection = document.getElementById('hex-section');
        if (!hexSection) return;
        
        const chars = '0123456789ABCDEF';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let html = '';
        
        const wordsToPlace = [...this.currentWords];
        this.shuffleArray(wordsToPlace);
        
        // Меньше строк для мобильной версии
        for (let line = 0; line < 12; line++) {
            const address = (0xF000 + line * 16).toString(16).toUpperCase().padStart(4, '0');
            
            let hexPart = `0x${address} `;
            for (let i = 0; i < 8; i++) { // Короче hex для мобильной
                hexPart += chars[Math.floor(Math.random() * chars.length)];
                if (i % 2 === 1) hexPart += ' ';
            }
            
            let asciiPart = '';
            let currentPos = 0;
            const lineLength = 30; // Короче строки
            
            while (currentPos < lineLength) {
                if (wordsToPlace.length > 0 && Math.random() < 0.4 && 
                    (currentPos + wordsToPlace[0].length) <= lineLength) {
                    const word = wordsToPlace.shift();
                    asciiPart += `<span class="password-word" data-word="${word}">${word}</span>`;
                    currentPos += word.length;
                }
                else if (Math.random() < 0.15 && currentPos < lineLength - 2) {
                    const brackets = ['[]', '()', '{}'];
                    const bracket = brackets[Math.floor(Math.random() * brackets.length)];
                    asciiPart += `<span class="bracket-hint">${bracket}</span>`;
                    currentPos += 2;
                }
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
        this.attachEventHandlers();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    attachEventHandlers() {
        document.querySelectorAll('.password-word').forEach(wordElement => {
            wordElement.addEventListener('click', (e) => {
                e.preventDefault();
                const word = wordElement.getAttribute('data-word');
                this.selectPassword(word);
            });
        });
        
        document.querySelectorAll('.bracket-hint').forEach(bracketElement => {
            bracketElement.addEventListener('click', (e) => {
                e.preventDefault();
                this.useBracketHint(bracketElement);
            });
        });
    }
    
    selectPassword(word) {
        if (!this.gameActive) return;
        
        // Визуальная обратная связь
        document.querySelectorAll('.password-word').forEach(w => {
            w.classList.remove('selected');
        });
        
        const selectedElement = document.querySelector(`[data-word="${word}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
        }
        
        this.addLogEntry(`> ${word}`);
        this.addLogEntry('> CHECKING...', 'system');
        
        // Вибрация на мобильных
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        setTimeout(() => {
            if (word === this.correctWord) {
                this.handleCorrectPassword(word, selectedElement);
            } else {
                this.handleIncorrectPassword(word, selectedElement);
            }
        }, 1000);
    }
    
    handleCorrectPassword(word, element) {
        if (element) {
            element.classList.add('correct');
        }
        
        this.addLogEntry('> EXACT MATCH!', 'success');
        this.addLogEntry('> ACCESS GRANTED!', 'success');
        
        if (audioManager) audioManager.success();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        
        setTimeout(() => this.endGame(true), 2000);
    }
    
    handleIncorrectPassword(word, element) {
        if (element) {
            element.classList.add('incorrect');
        }
        
        const likeness = this.calculateLikeness(word, this.correctWord);
        this.addLogEntry('> ACCESS DENIED', 'error');
        this.addLogEntry(`> LIKENESS=${likeness}`, 'error');
        
        this.attemptsLeft--;
        this.updateUI();
        
        if (audioManager) audioManager.error();
        if (navigator.vibrate) navigator.vibrate(200);
        
        if (this.attemptsLeft <= 0) {
            this.addLogEntry('> TERMINAL LOCKED', 'error');
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
        this.hintsUsed++;
        
        this.removeDudPassword();
        this.addLogEntry('> DUD REMOVED', 'system');
        
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
        }
    }
    
    addLogEntry(text, type = 'normal') {
        const logContent = document.getElementById('log-section');
        if (!logContent) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = text;
        
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
        
        // Ограничиваем для мобильной
        while (logContent.children.length > 15) {
            logContent.removeChild(logContent.children[0]);
        }
    }
    
    updateUI() {
        const attemptsElement = document.getElementById('hack-attempts');
        if (attemptsElement) {
            attemptsElement.textContent = this.attemptsLeft;
        }
    }
    
    endGame(won) {
        this.gameActive = false;
        
        if (!userData) return;
        
        // Награда с бонусами
        const baseReward = CONFIG.GAME_REWARDS['terminal-hacking'];
        const attemptBonus = won ? (this.attemptsLeft * 0.3) : 0;
        const speedBonus = won ? Math.max(0, (120000 - (Date.now() - this.startTime)) / 120000) : 0;
        const hintPenalty = this.hintsUsed * 0.1;
        
        const totalMultiplier = Math.max(0.5, 1 + attemptBonus + speedBonus - hintPenalty);
        const capsReward = Math.floor(
            (baseReward.min + Math.random() * (baseReward.max - baseReward.min)) * totalMultiplier
        );
        
        const earnedCaps = capsEconomy.earnCaps(capsReward, 'terminal-hacking');
        
        // Статистика
        userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
        if (won) userData.gamesWon = (userData.gamesWon || 0) + 1;
        
        // Миссии
        if (missionSystem) {
            missionSystem.updateProgress('terminal_completed', 1);
            missionSystem.updateProgress('games_played', 1);
        }
        
        updateUserDisplay();
        
        const resultMessage = won ? 
            `🎉 ACCESS GRANTED!\n+${earnedCaps} CAPS earned\nBonus: ${(totalMultiplier * 100 - 100).toFixed(0)}%` :
            `❌ TERMINAL LOCKED!\n+${earnedCaps} CAPS consolation`;
        
        showNotification(resultMessage, won ? 'success' : 'warning', 5000);
        
        setTimeout(() => closeGame(), 3000);
    }
}

// Wasteland Wings Game (Mobile Optimized)
class WastelandWingsGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameActive = false;
        this.gameLoop = null;
        this.reset();
    }
    
    reset() {
        this.player = {
            x: 50, y: 150, width: 20, height: 16,
            health: 100, maxHealth: 100,
            speed: 3, fireRate: 0, fireDelay: 8
        };
        
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.particles = [];
        
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.frameCount = 0;
        
        this.difficulty = {
            enemySpeed: 1.2,
            spawnRate: 100,
            enemyHealth: 1,
            enemyDamage: 8
        };
    }
    
    init() {
        this.canvas = document.getElementById('wings-canvas');
        if (!this.canvas) return false;
        
        // Мобильные размеры
        this.canvas.width = 350;
        this.canvas.height = 400;
        
        this.ctx = this.canvas.getContext('2d');
        return true;
    }
    
    startGame() {
        if (!this.init()) {
            showNotification('❌ Failed to start Wasteland Wings', 'error');
            return;
        }
        
        console.log('✈️ Starting Wasteland Wings (Mobile)...');
        
        this.reset();
        this.gameActive = true;
        this.startTime = Date.now();
        
        this.startGameLoop();
        
        if (audioManager) audioManager.powerup();
        showNotification('✈️ Wings deployed!\nDestroy enemies to earn CAPS!', 'info', 3000);
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
    }
    
    update() {
        // Спавн врагов
        if (this.frameCount % this.difficulty.spawnRate === 0) {
            this.spawnEnemy();
        }
        
        // Спавн powerups
        if (this.frameCount % 1200 === 0) {
            this.spawnPowerup();
        }
        
        this.updateGameObjects();
        this.checkCollisions();
        this.checkWaveProgression();
        
        if (this.player.fireRate > 0) {
            this.player.fireRate--;
        }
    }
    
    updateGameObjects() {
        // Пули
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.speed;
            return bullet.x < this.canvas.width + 20 && bullet.x > -20;
        });
        
        // Враги
        this.enemies = this.enemies.filter(enemy => {
            enemy.x -= enemy.speed;
            
            // Бомбардировщики стреляют
            if (enemy.type === 'bomber' && this.frameCount - enemy.lastShot > 90) {
                this.enemyShoot(enemy);
                enemy.lastShot = this.frameCount;
            }
            
            return enemy.x > -enemy.width;
        });
        
        // Powerups
        this.powerups = this.powerups.filter(powerup => {
            powerup.x -= powerup.speed;
            return powerup.x > -powerup.width;
        });
        
        // Частицы
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }
    
    spawnEnemy() {
        const enemyTypes = [
            { 
                type: 'scout', width: 12, height: 10, 
                speed: this.difficulty.enemySpeed * 1.3, 
                health: this.difficulty.enemyHealth,
                color: '#ff4444', points: 10
            },
            { 
                type: 'fighter', width: 16, height: 12, 
                speed: this.difficulty.enemySpeed, 
                health: this.difficulty.enemyHealth * 2,
                color: '#ff6600', points: 25
            },
            { 
                type: 'bomber', width: 24, height: 18, 
                speed: this.difficulty.enemySpeed * 0.8, 
                health: this.difficulty.enemyHealth * 3,
                color: '#cc3333', points: 50
            }
        ];
        
        const template = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        this.enemies.push({
            ...template,
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - template.height - 40),
            maxHealth: template.health,
            lastShot: 0
        });
    }
    
    spawnPowerup() {
        const types = [
            { type: 'health', color: '#00ff88' },
            { type: 'weapon', color: '#ffaa00' },
            { type: 'shield', color: '#00aaff' },
            { type: 'bonus', color: '#ff00ff' }
        ];
        
        const template = types[Math.floor(Math.random() * types.length)];
        
        this.powerups.push({
            ...template,
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - 80),
            width: 16, height: 16, speed: 1.5
        });
    }
    
    enemyShoot(enemy) {
        this.bullets.push({
            x: enemy.x - 10,
            y: enemy.y + enemy.height / 2,
            width: 8, height: 3,
            speed: -4,
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
                    
                    this.createHitParticles(enemy.x, enemy.y);
                    
                    if (enemy.health <= 0) {
                        this.score += enemy.points;
                        this.enemiesKilled++;
                        this.enemies.splice(e, 1);
                        
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
                if (navigator.vibrate) navigator.vibrate(100);
                
                if (this.player.health <= 0) {
                    this.endGame(false);
                    return;
                }
            }
        }
        
        // Столкновения
        for (let e = this.enemies.length - 1; e >= 0; e--) {
            const enemy = this.enemies[e];
            
            if (this.isColliding(this.player, enemy)) {
                this.enemies.splice(e, 1);
                this.player.health -= this.difficulty.enemyDamage * 2;
                
                this.createExplosionParticles(enemy.x, enemy.y);
                if (audioManager) audioManager.explosion();
                if (navigator.vibrate) navigator.vibrate([200, 50, 200]);
                
                if (this.player.health <= 0) {
                    this.endGame(false);
                    return;
                }
            }
        }
        
        // Powerups
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
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
                showNotification('💚 Health restored!', 'success', 2000);
                break;
            case 'weapon':
                this.player.fireDelay = Math.max(3, this.player.fireDelay - 1);
                showNotification('🔥 Weapon upgraded!', 'success', 2000);
                break;
            case 'shield':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
                showNotification('🛡️ Shield boost!', 'success', 2000);
                break;
            case 'bonus':
                this.score += 150;
                showNotification('💎 Bonus points!', 'success', 2000);
                break;
        }
    }
    
    checkWaveProgression() {
        if (this.enemiesKilled > 0 && this.enemiesKilled % 10 === 0) {
            this.nextWave();
        }
    }
    
    nextWave() {
        this.wave++;
        this.difficulty.enemySpeed += 0.2;
        this.difficulty.spawnRate = Math.max(50, this.difficulty.spawnRate - 8);
        this.difficulty.enemyHealth += Math.floor(this.wave / 4);
        this.difficulty.enemyDamage += 1;
        
        showNotification(`🌊 WAVE ${this.wave}!\nEnemies stronger!`, 'warning', 3000);
        if (audioManager) audioManager.powerup();
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + Math.random() * 15,
                y: y + Math.random() * 15,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 15, maxLife: 15, alpha: 1,
                color: '#ffaa00'
            });
        }
    }
    
    createExplosionParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x + Math.random() * 20,
                y: y + Math.random() * 20,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 25, maxLife: 25, alpha: 1,
                color: Math.random() < 0.5 ? '#ff4444' : '#ffaa00'
            });
        }
    }
    
    render() {
        if (!this.ctx) return;
        
        // Космический фон
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#000011');
        gradient.addColorStop(0.5, '#001122');
        gradient.addColorStop(1, '#000033');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawStarfield();
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawPowerups();
        this.drawParticles();
        this.drawMobileUI();
    }
    
    drawStarfield() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 7 + this.frameCount * 0.3) % this.canvas.width;
            const y = (i * 11) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    drawPlayer() {
        // Корпус истребителя
        this.ctx.fillStyle = '#00ff41';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Форма
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width, this.player.y + this.player.height / 2);
        this.ctx.lineTo(this.player.x, this.player.y);
        this.ctx.lineTo(this.player.x + 6, this.player.y + this.player.height / 2);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Двигатели
        this.ctx.fillStyle = '#00aaff';
        this.ctx.fillRect(this.player.x - 4, this.player.y + 3, 6, 3);
        this.ctx.fillRect(this.player.x - 4, this.player.y + 10, 6, 3);
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.fromEnemy ? '#ff4444' : '#ffff00';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // Свечение
            this.ctx.shadowColor = bullet.color || (bullet.fromEnemy ? '#ff4444' : '#ffff00');
            this.ctx.shadowBlur = 3;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Полоска здоровья
            if (enemy.maxHealth > 1) {
                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(enemy.x, enemy.y - 4, enemy.width, 2);
                this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff4444';
                this.ctx.fillRect(enemy.x, enemy.y - 4, enemy.width * healthPercent, 2);
            }
        });
    }
    
    drawPowerups() {
        this.powerups.forEach(powerup => {
            const alpha = 0.7 + 0.3 * Math.sin(this.frameCount * 0.1);
            this.ctx.globalAlpha = alpha;
            
            this.ctx.fillStyle = powerup.color;
            this.ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
            
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
    
    drawMobileUI() {
        // Полоска здоровья
        const healthBarWidth = 120;
        const healthPercent = this.player.health / this.player.maxHealth;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, healthBarWidth, 8);
        
        this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff41' : '#ff4444';
        this.ctx.fillRect(10, 10, healthBarWidth * healthPercent, 8);
        
        // Текст статистики
        this.ctx.fillStyle = '#00ff41';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(`HP: ${this.player.health}`, 10, 30);
        this.ctx.fillText(`SCORE: ${this.score}`, 10, 45);
        this.ctx.fillText(`WAVE: ${this.wave}`, 10, 60);
        
        // Мини-карта
        const miniMapSize = 50;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.canvas.width - miniMapSize - 10, 10, miniMapSize, 35);
        
        this.ctx.strokeStyle = '#00ff41';
        this.ctx.strokeRect(this.canvas.width - miniMapSize - 10, 10, miniMapSize, 35);
        
        // Враги на мини-карте
        this.enemies.forEach(enemy => {
            const miniX = this.canvas.width - miniMapSize - 10 + (enemy.x / this.canvas.width) * miniMapSize;
            const miniY = 10 + (enemy.y / this.canvas.height) * 35;
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillRect(miniX, miniY, 1, 1);
        });
        
        // Игрок на мини-карте
        const playerMiniX = this.canvas.width - miniMapSize - 10 + (this.player.x / this.canvas.width) * miniMapSize;
        const playerMiniY = 10 + (this.player.y / this.canvas.height) * 35;
        this.ctx.fillStyle = '#00ff41';
        this.ctx.fillRect(playerMiniX, playerMiniY, 2, 2);
    }
    
    // Управление
    shoot() {
        if (!this.gameActive || this.player.fireRate > 0) return;
        
        this.bullets.push({
            x: this.player.x + this.player.width,
            y: this.player.y + this.player.height / 2 - 1,
            width: 8, height: 3,
            speed: 6, fromEnemy: false
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
        const updates = {
            'wings-score': this.score,
            'wings-wave': this.wave,
            'wings-lives': Math.ceil(this.player.health / 33.33)
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    
    endGame(won = false) {
        this.gameActive = false;
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        if (!userData) return;
        
        // Награда
        const baseReward = CONFIG.GAME_REWARDS['wasteland-wings'];
        const scoreMultiplier = Math.min(this.score / 800, 4);
        const waveBonus = (this.wave - 1) * 40;
        
        const capsReward = Math.floor(
            (baseReward.min + Math.random() * (baseReward.max - baseReward.min)) * scoreMultiplier + waveBonus
        );
        
        const earnedCaps = capsEconomy.earnCaps(capsReward, 'wasteland-wings');
        
        // Статистика
        userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
        if (this.score > 300) userData.gamesWon = (userData.gamesWon || 0) + 1;
        
        // Миссии
        if (missionSystem) {
            missionSystem.updateProgress('wings_score', this.score);
            missionSystem.updateProgress('games_played', 1);
        }
        
        updateUserDisplay();
        
        const status = this.player.health > 0 ? '🏆 MISSION SUCCESS!' : '💥 AIRCRAFT DOWN!';
        const resultMessage = `${status}\nScore: ${this.score} | Wave: ${this.wave}\n+${earnedCaps} CAPS earned`;
        
        showNotification(resultMessage, this.player.health > 0 ? 'success' : 'warning', 6000);
        
        setTimeout(() => closeGame(), 4000);
    }
}

// Cyber Duel Game (Mobile Optimized)
class CyberDuelGame {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.gameActive = false;
        this.player = {
            health: 100, maxHealth: 100,
            energy: 100, maxEnergy: 100,
            shield: 0
        };
        this.opponent = {
            health: 100, maxHealth: 100,
            energy: 100, maxEnergy: 100,
            shield: 0,
            name: 'UNKNOWN', ai: true
        };
        this.round = 1;
        this.maxRounds = 6;
        this.playerTurn = true;
        this.battleLog = [];
    }
    
    startGame() {
        console.log('⚔️ Starting Cyber Duel (Mobile)...');
        
        this.reset();
        this.gameActive = true;
        this.opponent.name = this.generateOpponentName();
        
        this.updateUI();
        this.addBattleLog('⚔️ Neural link established');
        this.addBattleLog('🎯 Choose your action');
        
        if (audioManager) audioManager.powerup();
        showNotification('⚔️ Cyber Duel initiated!\nDefeat your opponent!', 'info', 3000);
    }
    
    generateOpponentName() {
        const names = [
            'CYBER_NINJA', 'DATA_GHOST', 'NEURAL_HUNTER', 'QUANTUM_WARRIOR',
            'VOID_STRIKER', 'NEON_SAMURAI', 'DIGITAL_PHANTOM', 'CHROME_KILLER'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    performAction(action) {
        if (!this.gameActive || !this.playerTurn) return;
        
        const result = this.executeAction(this.player, action);
        
        if (result.success) {
            this.addBattleLog(`🎯 You: ${action.toUpperCase()} - ${result.message}`);
            
            if (this.opponent.health <= 0) {
                this.endGame(true);
                return;
            }
            
            this.playerTurn = false;
            setTimeout(() => this.opponentTurn(), 1200);
        } else {
            this.addBattleLog(`❌ ${result.message}`);
            if (audioManager) audioManager.error();
        }
        
        this.updateUI();
    }
    
executeAction(actor, action) {
    switch (action) {
        case 'attack': {
            if (actor.energy < 20) return { success: false, message: 'Not enough energy' };
            
            actor.energy -= 20;
            const damage = 20 + Math.floor(Math.random() * 15);
            const attackTarget = actor === this.player ? this.opponent : this.player;
            
            const actualDamage = Math.max(1, damage - attackTarget.shield);
            attackTarget.health = Math.max(0, attackTarget.health - actualDamage);
            attackTarget.shield = Math.max(0, attackTarget.shield - damage);
            
            if (audioManager) audioManager.click();
            return { success: true, message: `${actualDamage} damage` };
        }
            
        case 'defend': {
            if (actor.energy < 10) return { success: false, message: 'Not enough energy' };
            
            actor.energy -= 10;
            const shieldGain = 12 + Math.floor(Math.random() * 8);
            actor.shield += shieldGain;
            
            return { success: true, message: `+${shieldGain} shield` };
        }
            
        case 'special': {
            if (actor.energy < 35) return { success: false, message: 'Not enough energy' };
            
            actor.energy -= 35;
            const specialDamage = 35 + Math.floor(Math.random() * 15);
            const specialTarget = actor === this.player ? this.opponent : this.player;
            
            specialTarget.health = Math.max(0, specialTarget.health - specialDamage);
            specialTarget.shield = 0;
            
            if (audioManager) audioManager.explosion();
            return { success: true, message: `${specialDamage} CRITICAL + shield destroyed` };
        }
            
        case 'heal': {
            if (actor.energy < 25) return { success: false, message: 'Not enough energy' };
            
            actor.energy -= 25;
            const healing = 15 + Math.floor(Math.random() * 10);
            const oldHealth = actor.health;
            actor.health = Math.min(actor.maxHealth, actor.health + healing);
            const actualHealing = actor.health - oldHealth;
            
            return { success: true, message: `+${actualHealing} health` };
        }
            
        default:
            return { success: false, message: 'Unknown action' };
    }
}
    
    opponentTurn() {
        if (!this.gameActive) return;
        
        const action = this.selectAIAction();
        const result = this.executeAction(this.opponent, action);
        
        if (result.success) {
            this.addBattleLog(`🤖 ${this.opponent.name}: ${action.toUpperCase()} - ${result.message}`);
            
            if (this.player.health <= 0) {
                this.endGame(false);
                return;
            }
        }
        
        // Восстанавливаем энергию
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 8);
        this.opponent.energy = Math.min(this.opponent.maxEnergy, this.opponent.energy + 8);
        
        this.round++;
        this.playerTurn = true;
        
        if (this.round > this.maxRounds) {
            this.endGame(this.player.health > this.opponent.health);
            return;
        }
        
        this.updateUI();
    }
    
    selectAIAction() {
        const { health, energy, shield } = this.opponent;
        const playerHealth = this.player.health;
        
        if (health < 25 && energy >= 25) return 'heal';
        if (playerHealth < 40 && energy >= 35) return 'special';
        if (shield < 8 && energy >= 10) return 'defend';
        return 'attack';
    }
    
    addBattleLog(message) {
        this.battleLog.push({ text: message, timestamp: Date.now() });
        
        if (this.battleLog.length > 8) { // Меньше для мобильной
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
        // Полоски здоровья
        const playerHealthBar = document.getElementById('player-health-bar');
        const playerEnergyBar = document.getElementById('player-energy-bar');
        const opponentHealthBar = document.getElementById('opponent-health-bar');
        const opponentEnergyBar = document.getElementById('opponent-energy-bar');
        
        if (playerHealthBar) {
            playerHealthBar.style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
        }
        if (playerEnergyBar) {
            playerEnergyBar.style.width = `${(this.player.energy / this.player.maxEnergy) * 100}%`;
        }
        if (opponentHealthBar) {
            opponentHealthBar.style.width = `${(this.opponent.health / this.opponent.maxHealth) * 100}%`;
        }
        if (opponentEnergyBar) {
            opponentEnergyBar.style.width = `${(this.opponent.energy / this.opponent.maxEnergy) * 100}%`;
        }
        
        // Общая информация
        const updates = {
            'duel-health': this.player.health,
            'duel-energy': this.player.energy,
            'duel-round': this.round,
            'opponent-name': this.opponent.name,
            'battle-status': this.playerTurn ? 'YOUR TURN' : 'OPPONENT TURN'
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        this.updateActionButtons();
    }
    
    updateActionButtons() {
        const actions = [
            { action: 'attack', cost: 20 },
            { action: 'defend', cost: 10 },
            { action: 'special', cost: 35 },
            { action: 'heal', cost: 25 }
        ];
        
        actions.forEach(({ action, cost }) => {
            const button = document.querySelector(`[onclick="duelAction('${action}')"]`);
            if (button) {
                const canUse = this.playerTurn && this.player.energy >= cost;
                button.disabled = !canUse;
                button.style.opacity = canUse ? '1' : '0.4';
            }
        });
    }
    
    endGame(won) {
        this.gameActive = false;
        
        if (!userData) return;
        
        // Награда
        const baseReward = CONFIG.GAME_REWARDS['cyber-duel'];
        const performanceMultiplier = won ? 1.8 : 0.6;
        const roundBonus = this.round * 40;
        
        const capsReward = Math.floor(
            (baseReward.min + Math.random() * (baseReward.max - baseReward.min)) * performanceMultiplier + roundBonus
        );
        
        const earnedCaps = capsEconomy.earnCaps(capsReward, 'cyber-duel');
        
        // Статистика
        userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
        if (won) userData.gamesWon = (userData.gamesWon || 0) + 1;
        
        // Миссии
        if (missionSystem) {
            missionSystem.updateProgress('duel_won', won);
            missionSystem.updateProgress('games_played', 1);
        }
        
        updateUserDisplay();
        
        const resultMessage = won ? 
            `🏆 VICTORY!\nDefeated ${this.opponent.name}!\n+${earnedCaps} CAPS earned` :
            `💀 DEFEAT!\n${this.opponent.name} wins!\n+${earnedCaps} CAPS consolation`;
        
        showNotification(resultMessage, won ? 'success' : 'warning', 6000);
        
        setTimeout(() => closeGame(), 4000);
    }
}

// ===== WASTELAND RADIO =====
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
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        
        return this.getDefaultMessages();
    }
    
    getDefaultMessages() {
        return [
            {
                id: 1,
                author: 'VAULT_DWELLER_101',
                text: 'New Nuke Cola CAPS trading opportunities! 🍺💰',
                time: this.formatTime(Date.now() - 300000),
                type: 'public',
                timestamp: Date.now() - 300000
            },
            {
                id: 2,
                author: 'ANONYMOUS_USER',
                text: 'Big announcement coming... HODL your CAPS! 🚀',
                time: this.formatTime(Date.now() - 180000),
                type: 'anonymous',
                timestamp: Date.now() - 180000
            },
            {
                id: 3,
                author: 'TERMINAL_MASTER',
                text: '[SPONSORED] 🎯 Master hacking with our training program!',
                time: this.formatTime(Date.now() - 120000),
                type: 'sponsored',
                timestamp: Date.now() - 120000
            }
        ];
    }
    
    saveMessages() {
        try {
            localStorage.setItem('wasteland_radio_v3', JSON.stringify(this.messages.slice(0, 50)));
        } catch (e) {}
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
        
        console.log(`📻 Message added: ${type}`);
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
        setInterval(() => {
            this.onlineUsers += Math.floor(Math.random() * 20) - 10;
            this.onlineUsers = Math.max(1500, Math.min(4500, this.onlineUsers));
            
            const onlineElement = document.getElementById('radio-online');
            if (onlineElement) {
                onlineElement.textContent = this.onlineUsers.toLocaleString();
            }
            
            if (Math.random() < 0.25) {
                this.addRandomMessage();
            }
        }, CONFIG.RADIO_UPDATE_INTERVAL);
    }
    
    addRandomMessage() {
        const messages = [
            'CAPS price looking bullish! 📈🍺',
            'Found legendary loot in sector 9!',
            'Who wants to duel? ⚔️',
            'New settlement needs traders!',
            'Radiation storm approaching...',
            'Best hacker competition starts!',
            'Market volume pumping! 🚀',
            'Join our wasteland expedition!'
        ];
        
        const authors = [
            'WASTELAND_TRADER', 'CYBER_SCOUT', 'NUKE_COLLECTOR', 'VAULT_EXPLORER',
            'DATA_MINER', 'CAPS_HUNTER', 'RADIO_OPERATOR', 'TERMINAL_WIZARD'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        const author = authors[Math.floor(Math.random() * authors.length)];
        
        this.addMessage(message, author, 'public');
    }
}

// ===== ОСНОВНЫЕ ФУНКЦИИ =====

// User Data Management
function loadUserData() {
    try {
        const saved = localStorage.getItem('runner_user_v3');
        if (saved) {
            userData = JSON.parse(saved);
            
            // Миграция данных
            if (!userData.capsBalance) userData.capsBalance = CONFIG.CAPS_INITIAL_AMOUNT;
            if (!userData.tsarBalance) userData.tsarBalance = 0;
            if (!userData.tonBalance) userData.tonBalance = 0;
            if (!userData.starsBalance) userData.starsBalance = 0;
            if (!userData.gamesPlayed) userData.gamesPlayed = 0;
            if (!userData.gamesWon) userData.gamesWon = 0;
            if (!userData.totalCapsEarned) userData.totalCapsEarned = CONFIG.CAPS_INITIAL_AMOUNT;
            if (!userData.radioMessagesSent) userData.radioMessagesSent = 0;
        }
    } catch (e) {
        console.warn('Failed to load user data:', e);
    }
    
    if (!userData) {
        userData = {
            id: 'dweller_' + Date.now(),
            name: 'DWELLER_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            
            // Nuke Cola CAPS (заработать можно)
            capsBalance: CONFIG.CAPS_INITIAL_AMOUNT,
            totalCapsEarned: CONFIG.CAPS_INITIAL_AMOUNT,
            
            // Реальные токены (только покупка)
            tsarBalance: 0,
            tonBalance: 0,
            starsBalance: 0,
            
            // Статистика
            level: 1,
            gamesPlayed: 0,
            gamesWon: 0,
            referrals: 0,
            radioMessagesSent: 0,
            
            // Настройки
            created: Date.now(),
            lastActive: Date.now(),
            soundEnabled: true,
            theme: 'cyber'
        };
        
        console.log('👤 New vault dweller created:', userData.name);
        showNotification(`🎉 Welcome to RUNNER Terminal!\n🍺 You received ${CONFIG.CAPS_INITIAL_AMOUNT} Nuke Cola CAPS!`, 'success', 8000);
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
        console.error('❌ Save failed:', e);
    }
}

function updateUserDisplay() {
    if (!userData) return;
    
    const updates = {
        'header-caps': capsEconomy ? capsEconomy.formatNumber(userData.capsBalance) : userData.capsBalance,
        'header-tsar': tsarManager ? tsarManager.formatTsarAmount(userData.tsarBalance) : userData.tsarBalance,
        'header-level': userData.level,
        'dash-caps': capsEconomy ? capsEconomy.formatNumber(userData.capsBalance) : userData.capsBalance,
        'dash-tsar': tsarManager ? tsarManager.formatTsarAmount(userData.tsarBalance) : userData.tsarBalance,
        'dash-stars': userData.starsBalance || 0,
        'dash-games': userData.gamesPlayed || 0,
        'user-caps-display': capsEconomy ? capsEconomy.formatNumber(userData.capsBalance) : userData.capsBalance,
        'tsar-display': tsarManager ? tsarManager.formatTsarAmount(userData.tsarBalance) : userData.tsarBalance,
        'dweller-name': userData.name,
        'profile-level': userData.level,
        'profile-games': userData.gamesPlayed || 0,
        'profile-caps-earned': capsEconomy ? capsEconomy.formatNumber(userData.totalCapsEarned) : userData.totalCapsEarned,
        'profile-referrals': userData.referrals || 0
    };
    
    Object.entries(updates).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    // Винрейт
    const winRate = userData.gamesPlayed > 0 ? 
        ((userData.gamesWon / userData.gamesPlayed) * 100).toFixed(1) : 0;
    
    ['dash-winrate', 'profile-winrate'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = `${winRate}%`;
    });
    
    // Обновляем TSAR привилегии
    if (tsarManager) {
        tsarManager.userTsarBalance = userData.tsarBalance;
        tsarManager.updatePrivileges();
    }
    
    console.log('📊 Mobile display updated');
}

// ===== TRADING FUNCTIONS =====
function setTradeAmount(amount) {
    if (amount === 'max') {
        selectedTradeAmount = userData?.capsBalance || 0;
    } else {
        selectedTradeAmount = amount;
    }
    
    // Обновляем активную кнопку
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const targetBtn = document.querySelector(`[onclick="setTradeAmount(${amount === 'max' ? "'max'" : amount})"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    updateTradeCalculations();
    console.log(`💱 Trade amount set: ${selectedTradeAmount}`);
}

function setMaxCaps() {
    setTradeAmount('max');
}

function setMarketPrice() {
    const priceInput = document.getElementById('trade-price-input');
    if (priceInput && capsEconomy) {
        priceInput.value = capsEconomy.priceInTon.toFixed(8);
        updateTradeCalculations();
    }
}

function updateTradeCalculations() {
    const amount = selectedTradeAmount;
    const price = capsEconomy ? capsEconomy.priceInTon : 0.00001;
    const fee = amount * price * CONFIG.CAPS_TRADING_FEE;
    const total = amount * price + fee;
    
    const updates = {
        'order-total': `${total.toFixed(6)} TON`,
        'order-fee': `${fee.toFixed(6)} TON`
    };
    
    Object.entries(updates).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function quickTrade(type) {
    if (!userData || selectedTradeAmount <= 0) {
        showNotification('❌ Invalid trade amount', 'error');
        return;
    }
    
    const amount = selectedTradeAmount;
    const price = capsEconomy ? capsEconomy.priceInTon : 0.00001;
    
    if (type === 'sell') {
        if (userData.capsBalance < amount) {
            showNotification('❌ Insufficient CAPS balance', 'error');
            return;
        }
        
        // Симуляция продажи
        userData.capsBalance -= amount;
        userData.tonBalance = (userData.tonBalance || 0) + (amount * price * 0.999); // -0.1% комиссия
        
        showNotification(`📉 SOLD!\n${amount} CAPS → ${(amount * price).toFixed(6)} TON`, 'success');
    } else {
        const requiredTon = amount * price;
        if ((userData.tonBalance || 0) < requiredTon) {
            showNotification('❌ Insufficient TON balance', 'error');
            return;
        }
        
        // Симуляция покупки
        userData.tonBalance -= requiredTon;
        userData.capsBalance += amount;
        
        showNotification(`📈 BOUGHT!\n${requiredTon.toFixed(6)} TON → ${amount} CAPS`, 'success');
    }
    
    saveUserData();
    updateUserDisplay();
    
    if (chartManager) {
        chartManager.updateTradingInterface();
    }
    
    console.log(`💱 Quick trade: ${type} ${amount} CAPS`);
}

// ===== RADIO FUNCTIONS =====
function sendRadioMessage() {
    const messageInput = document.getElementById('radio-message-input');
    if (!messageInput || !wastelandRadio) return;
    
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        showNotification('❌ Message cannot be empty', 'error');
        return;
    }
    
    if (!userData) return;
    
    const cost = CONFIG.RADIO_COSTS[messageType];
    
    if (messageType === 'anonymous' && userData.tsarBalance < cost) {
        showNotification(`❌ Anonymous messages require ${cost.toLocaleString()} TSAR`, 'error');
        return;
    }
    
    if (messageType === 'sponsored' && userData.tsarBalance < cost) {
        showNotification(`❌ Sponsored messages require ${cost.toLocaleString()} TSAR`, 'error');
        return;
    }
    
    // Списываем TSAR
    if (cost > 0) {
        const spendResult = tsarManager.spendTsar(cost, `radio-${messageType}`);
        if (!spendResult.success) {
            showNotification(`❌ ${spendResult.message}`, 'error');
            return;
        }
    }
    
    wastelandRadio.addMessage(messageText, userData.name, messageType);
    
    messageInput.value = '';
    const charCount = document.getElementById('char-count');
    if (charCount) charCount.textContent = '0/200';
    
    userData.radioMessagesSent = (userData.radioMessagesSent || 0) + 1;
    
    if (missionSystem) {
        missionSystem.updateProgress('radio_sent', 1);
    }
    
    updateUserDisplay();
    showNotification('📻 Message transmitted!', 'success');
    
    console.log(`📻 Radio message sent: ${messageType}`);
}

// ===== GLOBAL FUNCTIONS =====
window.startGame = function(gameType) {
    console.log(`🎮 Starting ${gameType}...`);
    
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
            
        default:
            showNotification(`🚧 ${gameType} coming soon!`, 'info');
    }
};

window.closeGame = function() {
    console.log('🚪 Closing game...');
    
    if (terminalGame) terminalGame.gameActive = false;
    if (wingsGame) wingsGame.gameActive = false;
    if (cyberDuel) cyberDuel.gameActive = false;
    
    document.querySelectorAll('.game-modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    currentGame = null;
    if (audioManager) audioManager.beep();
};

window.duelAction = function(action) {
    if (cyberDuel && cyberDuel.gameActive && cyberDuel.playerTurn) {
        cyberDuel.performAction(action);
    }
};

window.wingsAction = function(action) {
    if (!wingsGame || !wingsGame.gameActive) return;
    
    if (action === 'shoot') {
        wingsGame.shoot();
    } else {
        wingsGame.movePlayer(action);
    }
};

window.buyTsarWithStars = function() {
    if (tsarManager) tsarManager.buyTsarWithStars();
};

window.connectTonWallet = function() {
    if (tsarManager) tsarManager.connectTonWallet();
};

window.setTradeAmount = setTradeAmount;
window.setMaxCaps = setMaxCaps;
window.setMarketPrice = setMarketPrice;
window.quickTrade = quickTrade;

function openGameModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        currentGame = modalId;
        
        // Скрываем системную навигацию на время игры
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.disableClosingConfirmation();
        }
        
        console.log(`🎯 Game opened: ${modalId}`);
    }
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
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
    
    // Вибрация для важных уведомлений
    if (type === 'success' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    } else if (type === 'error' && navigator.vibrate) {
        navigator.vibrate(200);
    }
    
    console.log(`📢 Notification: ${message} (${type})`);
}

// ===== EVENT HANDLERS =====
function setupEventHandlers() {
    console.log('🔧 Setting up mobile event handlers...');
    
    // Радио типы сообщений
    document.querySelectorAll('.msg-type').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.msg-type').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            messageType = btn.dataset.type;
            
            if (audioManager) audioManager.click();
        });
    });
    
    // Кнопка отправки радио
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
        
        // Enter для отправки на мобильных
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendRadioMessage();
            }
        });
    }
    
    // Управление играми
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = btn.dataset.action;
            wingsAction(action);
        });
        
        // Тач события для лучшей отзывчивости
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btn.classList.add('pressed');
        });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            btn.classList.remove('pressed');
        });
    });
    
    // Торговые табы
    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentTradeTab = tab.dataset.tab;
            if (audioManager) audioManager.click();
        });
    });
    
    // Timeframe селектор
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (chartManager) {
                chartManager.currentTimeframe = btn.dataset.tf;
                chartManager.updateCharts();
            }
        });
    });
    
    console.log('✅ Mobile event handlers ready');
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initializeApp() {
    console.log('🚀 Initializing RUNNER Terminal Mobile v3.0...');
    
    // Инициализация систем
    audioManager = new AudioManager();
    capsEconomy = new CapsEconomy();
    tsarManager = new TsarManager();
    wastelandRadio = new WastelandRadio();
    terminalGame = new TerminalHackingGame();
    wingsGame = new WastelandWingsGame();
    cyberDuel = new CyberDuelGame();
    missionSystem = new MissionSystem();
    chartManager = new ChartManager();
    mobileInterface = new MobileInterface();
    
    // Загружаем данные
    loadUserData();
    
    // Настройка событий
    setupEventHandlers();
    
    // Аудио инициализация при касании
    const initAudio = () => {
        if (audioManager) audioManager.init();
    };
    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('click', initAudio, { once: true });
    
    // Telegram интеграция
    if (window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        webApp.ready();
        webApp.expand();
        webApp.enableClosingConfirmation();
        
        // Цветовая схема
        webApp.setHeaderColor('#0a0a0a');
        webApp.setBackgroundColor('#0a0a0a');
        
        const telegramUser = webApp.initDataUnsafe?.user;
        if (telegramUser && userData) {
            userData.name = telegramUser.username || userData.name;
            userData.telegramId = telegramUser.id;
            userData.firstName = telegramUser.first_name;
            saveUserData();
            console.log('📱 Telegram user integrated:', telegramUser.username);
        }
        
        // Haptic feedback
        webApp.HapticFeedback?.impactOccurred('light');
    }
    
    console.log('✅ RUNNER Terminal Mobile v3.0 ready!');
    console.log(`📄 TSAR Contract: ${CONFIG.TSAR_CONTRACT}`);
    console.log(`🍺 Nuke Cola CAPS initialized`);
    
    showNotification('🚀 RUNNER Terminal v3.0\n🍺 Earn Nuke Cola CAPS playing games!\n⭐ Use TSAR for premium features!', 'success', 6000);
}

// ===== ЗАПУСК =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

console.log('🎮 RUNNER Terminal Mobile v3.0 - Ready for blockchain integration!');