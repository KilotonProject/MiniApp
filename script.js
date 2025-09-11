// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Обработчик события готовности
tg.ready();

// Переменные для управления состоянием
let currentSection = 'stat';

// Функция для отображения главного экрана
function showMainScreen() {
    document.getElementById('welcomeScreen').style.display = 'none';
    const mainScreen = document.getElementById('mainScreen');
    mainScreen.style.display = 'flex';
    
    // Анимация появления
    setTimeout(() => {
        mainScreen.style.opacity = '1';
    }, 100);
    
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // Обновлять время каждую минуту
    
    // Запускаем анимацию печатающего текста для заголовка
    const header = document.querySelector('.header h1');
    header.classList.add('typewriter');
}

// Функция для обновления времени в нижнем колонтитуле
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    document.getElementById('currentTime').textContent = timeString;
}

// Функция для загрузки контента раздела
function loadSection(section) {
    const contentArea = document.getElementById('contentArea');
    
    // Анимация исчезновения текущего контента
    contentArea.style.opacity = '0';
    
    setTimeout(() => {
        // Очищаем текущий контент
        contentArea.innerHTML = '';
        
        // В зависимости от раздела загружаем соответствующий контент
        switch(section) {
            case 'stat':
                contentArea.innerHTML = `
                    <div class="content-header">
                        <h2>USER PROFILE</h2>
                    </div>
                    <div class="profile-info">
                        <div class="info-row">
                            <span class="label">LEVEL:</span>
                            <span class="value">15</span>
                        </div>
                        <div class="info-row">
                            <span class="label">XP:</span>
                            <span class="value">1250/2000</span>
                        </div>
                        <div class="info-row">
                            <span class="label">ENERGY:</span>
                            <span class="value">85/120</span>
                        </div>
                        <div class="info-row">
                            <span class="label">TON BALANCE:</span>
                            <span class="value">45.75</span>
                        </div>
                        <div class="info-row">
                            <span class="label">TSAR BALANCE:</span>
                            <span class="value">120</span>
                        </div>
                        <div class="info-row">
                            <span class="label">REFERRALS:</span>
                            <span class="value">8</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 62.5%;"></div>
                    </div>
                `;
                break;
            case 'wallet':
                contentArea.innerHTML = '<h2>WALLET</h2><p>Your wallet and tokens information will be displayed here.</p>';
                break;
            case 'runner':
                contentArea.innerHTML = '<h2>RUNNER</h2><p>Your tasks and missions will be displayed here.</p>';
                break;
            case 'shop':
                contentArea.innerHTML = '<h2>SHOP</h2><p>Items for sale will be displayed here.</p>';
                break;
            case 'inventory':
                contentArea.innerHTML = '<h2>INVENTORY</h2><p>Your items and NFTs will be displayed here.</p>';
                break;
            case 'radio':
                contentArea.innerHTML = '<h2>RADIO</h2><p>Audio and podcasts will be available here.</p>';
                break;
            case 'settings':
                contentArea.innerHTML = '<h2>SETTINGS</h2><p>App settings will be displayed here.</p>';
                break;
            default:
                contentArea.innerHTML = '<h2>WELCOME</h2><p>Select a section from the menu.</p>';
        }
        
        // Анимация появления нового контента
        setTimeout(() => {
            contentArea.style.opacity = '1';
        }, 50);
        
    }, 300);
}

// Обработчики для навигационных кнопок
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const section = this.getAttribute('data-section');
        
        // Эффект вибрации (если поддерживается)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Эффект статического шума при нажатии
        const noiseEffect = document.createElement('div');
        noiseEffect.style.position = 'absolute';
        noiseEffect.style.top = '0';
        noiseEffect.style.left = '0';
        noiseEffect.style.width = '100%';
        noiseEffect.style.height = '100%';
        noiseEffect.style.background = 'radial-gradient(circle, rgba(0,255,0,0.2) 0%, transparent 70%)';
        noiseEffect.style.pointerEvents = 'none';
        noiseEffect.style.zIndex = '15';
        noiseEffect.style.opacity = '0';
        noiseEffect.style.animation = 'static-pulse 0.5s forwards';
        
        document.querySelector('.pipboy').appendChild(noiseEffect);
        
        // Удаляем эффект после завершения анимации
        setTimeout(() => {
            document.querySelector('.pipboy').removeChild(noiseEffect);
        }, 500);
        
        // Загружаем выбранный раздел
        loadSection(section);
        currentSection = section;
    });
});

// Добавляем стиль для эффекта статического импульса
const style = document.createElement('style');
style.textContent = `
    @keyframes static-pulse {
        0% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 0.7; transform: scale(1.2); }
        100% { opacity: 0; transform: scale(1.5); }
    }
`;
document.head.appendChild(style);

// Ждем 5 секунд и показываем главный экран
setTimeout(showMainScreen, 5000);

// Добавим анимацию появления текста на приветственном экране
document.addEventListener('DOMContentLoaded', function() {
    const welcomeText = document.querySelector('.glowing-text');
    welcomeText.style.opacity = '0';
    welcomeText.style.transition = 'opacity 2s ease-in-out';
    
    setTimeout(() => {
        welcomeText.style.opacity = '1';
    }, 500);
    
    // Инициализируем первый раздел
    loadSection(currentSection);
});