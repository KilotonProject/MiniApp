// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Обработчик события готовности
tg.ready();

// Основные переменные
let currentSection = 'stat';
let userData = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Запускаем экран загрузки
    setTimeout(initApp, 3000);
    
    // Обновляем время каждую секунду
    setInterval(updateTime, 1000);
    
    // Имитация изменения баланса и других показателей
    setInterval(updateFooterStats, 5000);
    
    // Добавляем обработчики навигации
    initNavigation();
});

// Инициализация приложения после загрузки
function initApp() {
    // Скрываем экран загрузки
    document.getElementById('loading-screen').classList.remove('visible');
    document.getElementById('loading-screen').classList.add('hidden');
    
    // Показываем главный экран
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('main-screen').classList.add('visible');
    
    // Загружаем данные пользователя
    loadUserData();
    
    // Показываем раздел по умолчанию
    showSection('stat');
}

// Загрузка данных пользователя
function loadUserData() {
    // В реальном приложении здесь будет запрос к API бота
    // Сейчас используем заглушку
    userData = {
        username: "VaultDweller",
        level: 15,
        xp: 1250,
        xpNeeded: 2000,
        energy: 85,
        maxEnergy: 110,
        balance: 42.75,
        clan: "Brotherhood of Steel",
        referrals: 7,
        achievements: 12,
        questsCompleted: 23
    };
    
    // Обновляем данные в футере
    updateFooterStats();
}

// Обновление времени
function updateTime() {
    const now = new Date();
    const timeString = `🕐 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    document.getElementById('current-time').textContent = timeString;
}

// Обновление статистики в футере
function updateFooterStats() {
    if (userData) {
        // Случайные колебания для эффекта "помех"
        const randomBalance = (userData.balance + (Math.random() * 0.2 - 0.1)).toFixed(2);
        const randomClan = Math.floor(userData.clan.length + Math.random() * 5);
        
        document.getElementById('footer-balance').textContent = `BALANCE: ${randomBalance} TON`;
        document.getElementById('footer-clan').textContent = `CLAN: ${randomClan}`;
        
        // Случайное мерцание
        if (Math.random() > 0.7) {
            const footerItems = document.querySelectorAll('.frame-text');
            footerItems.forEach(item => {
                item.style.opacity = '0.5';
                setTimeout(() => {
                    item.style.opacity = '1';
                }, 100);
            });
        }
    }
}

// Инициализация навигации
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Эффект нажатия
            this.classList.add('active');
            setTimeout(() => {
                this.classList.remove('active');
            }, 300);
        });
        
        // Эффект при наведении
        button.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 15px #00FF00';
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
            this.style.transform = '';
        });
    });
}

// Показать выбранный раздел
function showSection(section) {
    currentSection = section;
    const contentArea = document.getElementById('content-area');
    
    // Очищаем область контента
    contentArea.innerHTML = '';
    
    // Загружаем соответствующий контент
    switch(section) {
        case 'stat':
            loadStatSection(contentArea);
            break;
        case 'wallet':
            loadWalletSection(contentArea);
            break;
        case 'runner':
            loadRunnerSection(contentArea);
            break;
        case 'shop':
            loadShopSection(contentArea);
            break;
        case 'inventory':
            loadInventorySection(contentArea);
            break;
        case 'radio':
            loadRadioSection(contentArea);
            break;
        case 'settings':
            loadSettingsSection(contentArea);
            break;
        default:
            loadStatSection(contentArea);
    }
    
    // Подсвечиваем активную кнопку
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        if (button.getAttribute('data-section') === section) {
            button.style.background = 'linear-gradient(to bottom, #004400, #002200)';
            button.style.boxShadow = '0 0 10px #00FF00';
        } else {
            button.style.background = '';
            button.style.boxShadow = '';
        }
    });
}

// Загрузка раздела STAT
function loadStatSection(container) {
    if (!userData) return;
    
    const progressPercent = Math.min(100, (userData.xp / userData.xpNeeded) * 100);
    
    container.innerHTML = `
        <div class="stat-container">
            <div class="stat-row">
                <span class="stat-label">Username:</span>
                <span class="stat-value">${userData.username}</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">Level:</span>
                <span class="stat-value">${userData.level}</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">XP:</span>
                <span class="stat-value">${userData.xp}/${userData.xpNeeded}</span>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">Energy:</span>
                <span class="stat-value">${userData.energy}/${userData.maxEnergy}</span>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(userData.energy / userData.maxEnergy) * 100}%"></div>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">Balance:</span>
                <span class="stat-value">${userData.balance} TON</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">Clan:</span>
                <span class="stat-value">${userData.clan}</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">Referrals:</span>
                <span class="stat-value">${userData.referrals}</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">Achievements:</span>
                <span class="stat-value">${userData.achievements}/50</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">Quests Completed:</span>
                <span class="stat-value">${userData.questsCompleted}</span>
            </div>
        </div>
    `;
}

// Заглушки для других разделов
function loadWalletSection(container) {
    container.innerHTML = `
        <div class="stat-container">
            <div class="stat-row">
                <span class="stat-label">Wallet Section</span>
                <span class="stat-value">Coming Soon</span>
            </div>
        </div>
    `;
}

function loadRunnerSection(container) {
    container.innerHTML = `
        <div class="stat-container">
            <div class="stat-row">
                <span class="stat-label">Runner Section</span>
                <span class="stat-value">Coming Soon</span>
            </div>
        </div>
    `;
}

function loadShopSection(container) {
    container.innerHTML = `
        <div class="stat-container">
            <div class="stat-row">
                <span class="stat-label">Shop Section</span>
                <span class="stat-value">Coming Soon</span>
            </div>
        </div>
    `;
}

function loadInventorySection(container) {
    container.innerHTML = `
        <div class="stat-container">
            <div class="stat-row">
                <span class="stat-label">Inventory Section</span>
                <span class="stat-value">Coming Soon</span>
            </div>
        </div>
    `;
}

function loadRadioSection(container) {
    container.innerHTML = `
        <div class="stat-container">
            <div class="stat-row">
                <span class="stat-label">Radio Section</span>
                <span class="stat-value">Coming Soon</span>
            </div>
        </div>
    `;
}

function loadSettingsSection(container) {
    container.innerHTML = `
        <div class="stat-container">
            <div class="stat-row">
                <span class="stat-label">Settings Section</span>
                <span class="stat-value">Coming Soon</span>
            </div>
        </div>
    `;
}

// Функция для отправки данных в бота
function sendData(action, data = {}) {
    const payload = {
        action: action,
        timestamp: new Date().getTime(),
        user: tg.initDataUnsafe.user,
        ...data
    };
    
    // Отправляем данные в бота
    tg.sendData(JSON.stringify(payload));
}

// Обработчик получения данных от бота
tg.onEvent('webAppDataReceived', (event) => {
    console.log('Data received from bot:', event);
    // Обработайте данные от бота здесь
});