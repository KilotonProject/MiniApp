// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Обработчик события готовности
tg.ready();

// Основная функция инициализации
document.addEventListener('DOMContentLoaded', function() {
    // Сначала показываем приветственный экран
    showWelcomeScreen();
    
    // Через 5 секунд переключаем на главный экран
    setTimeout(() => {
        showMainScreen();
        initializeMainScreen();
    }, 5000);
    
    // Обновляем время в реальном времени
    setInterval(updateStatusBar, 1000);
});

// Показать приветственный экран
function showWelcomeScreen() {
    document.getElementById('welcome-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
}

// Показать главный экран
function showMainScreen() {
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
}

// Инициализация главного экрана
function initializeMainScreen() {
    // Добавляем обработчики для кнопок навигации
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем активный класс к нажатой кнопке
            this.classList.add('active');
            
            // Показываем соответствующий раздел
            const sectionId = this.getAttribute('data-section') + '-content';
            showContentSection(sectionId);
            
            // Эффект при нажатии
            this.style.boxShadow = '0 0 25px #00ff00';
            setTimeout(() => {
                this.style.boxShadow = '';
            }, 300);
        });
    });
    
    // Загружаем данные пользователя
    loadUserData();
}

// Показать раздел контента
function showContentSection(sectionId) {
    // Скрываем все разделы
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => section.classList.remove('active'));
    
    // Показываем выбранный раздел
    document.getElementById(sectionId).classList.add('active');
}

// Загрузка данных пользователя
function loadUserData() {
    // Здесь будет загрузка данных из Telegram Web App или API
    // Пока используем заглушки
    document.getElementById('user-level').textContent = '5';
    document.getElementById('user-xp').textContent = '750/1000';
    document.getElementById('user-energy').textContent = '85/110';
    document.getElementById('user-ton').textContent = '55.5';
    document.getElementById('user-tsar').textContent = '12';
    document.getElementById('user-refs').textContent = '3';
    
    // Обновляем баланс в статус баре
    document.getElementById('balance').textContent = 'BAL: 55.5';
}

// Обновление статус бара
function updateStatusBar() {
    const now = new Date();
    const timeString = `🕐 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    document.getElementById('time').textContent = timeString;
    
    // Случайное мерцание статус бара
    if (Math.random() > 0.8) {
        const statusItems = document.querySelectorAll('.status-item');
        statusItems.forEach(item => {
            item.style.opacity = Math.random() > 0.5 ? 0.7 : 1;
        });
        
        // Случайный статический шум
        if (Math.random() > 0.9) {
            showStaticNoise();
        }
    }
}

// Эффект статического шума
function showStaticNoise() {
    const noise = document.createElement('div');
    noise.style.position = 'absolute';
    noise.style.top = '0';
    noise.style.left = '0';
    noise.style.width = '100%';
    noise.style.height = '100%';
    noise.style.background = 'repeating-linear-gradient(45deg, rgba(0, 255, 0, 0.1), transparent 5px)';
    noise.style.zIndex = '10';
    noise.style.pointerEvents = 'none';
    document.getElementById('main-screen').appendChild(noise);
    
    setTimeout(() => {
        noise.remove();
    }, 100);
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
    // Здесь можно обработать данные, полученные от бота
});