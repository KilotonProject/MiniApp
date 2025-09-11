// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Обработчик события готовности
tg.ready();

// Глобальные переменные
let userData = null;
let currentSection = null;

// Функция инициализации приложения
function initApp() {
    // Загружаем данные пользователя (заглушка)
    loadUserData();
    
    // Запускаем приветственный экран
    showWelcomeScreen();
    
    // Устанавливаем обновление времени
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // Настройка обработчиков навигации
    setupNavigation();
}

// Загрузка данных пользователя
function loadUserData() {
    // В реальном приложении здесь будет запрос к API бота
    userData = {
        name: "Vault Resident",
        balance: 42.5,
        clan: "Wastelanders",
        level: 15,
        energy: 85,
        maxEnergy: 100,
        xp: 1250,
        nextLevelXp: 2000
    };
    
    updateUserInfo();
}

// Обновление информации пользователя
function updateUserInfo() {
    if (userData) {
        document.getElementById('balance-display').textContent = `BAL: ${userData.balance} TON`;
        document.getElementById('clan-display').textContent = `CLAN: ${userData.clan}`;
    }
}

// Обновление даты и времени
function updateDateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('time-display').textContent = `🕐 ${timeStr}`;
}

// Показать приветственный экран
function showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainScreen = document.getElementById('main-screen');
    
    welcomeScreen.classList.add('active');
    mainScreen.classList.remove('active');
    
    // Через 3 секунды переключаем на главный экран
    setTimeout(() => {
        welcomeScreen.classList.remove('active');
        mainScreen.classList.add('active');
        showSection('stat'); // По умолчанию показываем раздел STAT
    }, 3000);
}

// Настройка навигации
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Анимация нажатия кнопки
            this.classList.add('active');
            setTimeout(() => {
                this.classList.remove('active');
            }, 300);
        });
    });
}

// Показать раздел
function showSection(section) {
    // Скрываем все разделы
    const allSections = document.querySelectorAll('.section-content');
    allSections.forEach(sec => sec.classList.remove('active'));
    
    // Показываем выбранный раздел
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        // Если раздел не существует, создаем его
        createSectionContent(section);
    }
    
    currentSection = section;
}

// Создание контента для разделов
function createSectionContent(section) {
    const contentArea = document.getElementById('content-area');
    
    // Удаляем старый контент
    const oldContent = document.getElementById(`${section}-section`);
    if (oldContent) {
        oldContent.remove();
    }
    
    // Создаем новый контент
    const sectionContent = document.createElement('div');
    sectionContent.id = `${section}-section`;
    sectionContent.classList.add('section-content', 'active');
    
    // Заполняем контент в зависимости от раздела
    switch(section) {
        case 'stat':
            sectionContent.innerHTML = `
                <h2>STATUS REPORT</h2>
                <div class="stat-item">
                    <div class="stat-label">LEVEL</div>
                    <div class="stat-value">${userData.level}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">EXPERIENCE</div>
                    <div class="stat-value">${userData.xp}/${userData.nextLevelXp} XP</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">ENERGY</div>
                    <div class="stat-value">${userData.energy}/${userData.maxEnergy}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">TON BALANCE</div>
                    <div class="stat-value">${userData.balance} TON</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">CLAN AFFILIATION</div>
                    <div class="stat-value">${userData.clan}</div>
                </div>
            `;
            break;
            
        case 'wallet':
            sectionContent.innerHTML = `
                <h2>WALLET MANAGEMENT</h2>
                <p>Your cryptocurrency wallet details will appear here.</p>
                <div class="stat-item">
                    <div class="stat-label">TON BALANCE</div>
                    <div class="stat-value">${userData.balance} TON</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">TSAR TOKENS</div>
                    <div class="stat-value">0 TSAR</div>
                </div>
            `;
            break;
            
        case 'runner':
            sectionContent.innerHTML = `
                <h2>QUEST BOARD</h2>
                <p>Available missions and tasks will appear here.</p>
                <div class="stat-item">
                    <div class="stat-label">ACTIVE QUESTS</div>
                    <div class="stat-value">3</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">COMPLETED</div>
                    <div class="stat-value">27</div>
                </div>
            `;
            break;
            
        default:
            sectionContent.innerHTML = `
                <h2>${section.toUpperCase()} SECTION</h2>
                <p>This section is under development. Check back later.</p>
            `;
    }
    
    contentArea.appendChild(sectionContent);
}

// Функция для отправки данных в бота
function sendData(action, data = {}) {
    const payload = {
        action: action,
        timestamp: new Date().getTime(),
        user: tg.initDataUnsafe.user,
        ...data
    };
    
    tg.sendData(JSON.stringify(payload));
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    
    // Добавляем эффект печатания для текста
    const welcomeText = document.querySelector('.glowing-text');
    welcomeText.style.opacity = '0';
    welcomeText.style.transition = 'opacity 2s ease-in-out';
    
    setTimeout(() => {
        welcomeText.style.opacity = '1';
    }, 500);
    
    // Показываем кнопку отправки, если это веб-приложение Telegram
    if (tg.platform !== 'unknown') {
        document.querySelector('.pipboy-button').style.display = 'block';
    }
});

// Обработчик получения данных от бота
tg.onEvent('webAppDataReceived', (event) => {
    console.log('Data received from bot:', event);
    // Обработайте данные от бота здесь
});