// Глобальные переменные
let userData = null;
let currentSection = null;
let menuOpen = false;
let gameState = null;
let gameTimer = null;

// Функция инициализации приложения
function initApp() {
    // Загружаем данные пользователя
    loadUserData();
    
    // Запускаем приветственный экран
    showWelcomeScreen();
    
    // Устанавливаем обновление времени
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // Настройка обработчиков навигации
    setupNavigation();
    
    // Настройка обработчиков для игры
    setupGameHandlers();
}

// Загрузка данных пользователя
function loadUserData() {
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
        showSection('stat');
    }, 3000);
}

// Настройка навигации
function setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenuBtn = document.getElementById('close-menu');
    const pipboyNav = document.getElementById('pipboy-nav');
    const navButtons = document.querySelectorAll('.nav-btn');
    
    // Обработчик открытия/закрытия меню
    menuToggle.addEventListener('click', function() {
        if (menuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Обработчик закрытия меню
    closeMenuBtn.addEventListener('click', function() {
        closeMenu();
    });
    
    // Обработчики для кнопок навигации
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
            closeMenu();
        });
    });
}

// Функция открытия меню
function openMenu() {
    const pipboyNav = document.getElementById('pipboy-nav');
    const menuToggle = document.getElementById('menu-toggle');
    
    pipboyNav.classList.add('open');
    menuToggle.style.display = 'none';
    menuOpen = true;
}

// Функция закрытия меню
function closeMenu() {
    const pipboyNav = document.getElementById('pipboy-nav');
    const menuToggle = document.getElementById('menu-toggle');
    
    pipboyNav.classList.remove('open');
    menuToggle.style.display = 'flex';
    menuOpen = false;
}

// Показать раздел
function showSection(section) {
    // Скрываем все разделы
    const allSections = document.querySelectorAll('.section-content');
    allSections.forEach(sec => sec.classList.remove('active'));
    
    // Скрываем дефолтный текст
    document.getElementById('default-content').style.display = 'none';
    
    // Показываем выбранный раздел
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    currentSection = section;
}

// Настройка обработчиков для игры
function setupGameHandlers() {
    // Обработчики для игровых элементов
    const gameItems = document.querySelectorAll('.game-item');
    gameItems.forEach(item => {
        item.addEventListener('click', function() {
            const game = this.getAttribute('data-game');
            if (game === 'wasteland-duel') {
                showGameScreen('wasteland-duel');
            } else if (game === 'coming-soon') {
                alert('More games coming soon!');
            }
        });
    });

    // Обработчик для кнопки назад в игре
    const backButton = document.getElementById('back-to-gameboy');
    if (backButton) {
        backButton.addEventListener('click', function() {
            // Останавливаем игру если она запущена
            if (gameTimer) {
                clearInterval(gameTimer);
                gameTimer = null;
            }
            
            showSection('gameboy');
            document.getElementById('wasteland-duel-screen').classList.remove('active');
        });
    }
}

// Функция показа экрана игры
function showGameScreen(game) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем экран игры
    if (game === 'wasteland-duel') {
        document.getElementById('wasteland-duel-screen').classList.add('active');
        initWastelandDuel();
    }
}

// Инициализация игры Wasteland Duel
function initWastelandDuel() {
    // Инициализируем элементы игры
    const moveButtons = document.querySelectorAll('.move-btn');
    const playerSprite = document.getElementById('player-sprite');
    const enemySprite = document.getElementById('enemy-sprite');
    const playerHealth = document.getElementById('player-health-fill');
    const enemyHealth = document.getElementById('enemy-health-fill');
    const playerEnergy = document.getElementById('player-energy-fill');
    const enemyEnergy = document.getElementById('enemy-energy-fill');
    const playerAction = document.getElementById('player-action');
    const enemyAction = document.getElementById('enemy-action');
    const timerElement = document.getElementById('timer');
    const roundElement = document.getElementById('round-number');
    
    // Инициализируем состояние игры
    gameState = {
        playerHealth: 100,
        enemyHealth: 100,
        playerEnergy: 100,
        enemyEnergy: 100,
        round: 1,
        timeLeft: 5,
        playerMove: null,
        enemyMove: null
    };
    
    // Обновляем интерфейс
    updateGameUI();
    
    // Сбрасываем действия
    playerAction.textContent = '[?????]';
    enemyAction.textContent = '[?????]';
    roundElement.textContent = gameState.round;
    
    // Убираем все классы анимаций
    playerSprite.classList.remove('player-attack', 'player-hit', 'player-charge');
    enemySprite.classList.remove('enemy-attack', 'enemy-hit', 'enemy-charge');
    
    // Назначаем обработчики для кнопок действий
    moveButtons.forEach(button => {
        // Сначала удаляем старые обработчики
        button.removeEventListener('click', handleMoveButtonClick);
        // Затем добавляем новые
        button.addEventListener('click', handleMoveButtonClick);
    });
    
    // Запускаем таймер
    startGameTimer();
}

// Обработчик клика по кнопке действия
function handleMoveButtonClick() {
    if (gameState.timeLeft > 0 && !gameState.playerMove) {
        const move = this.getAttribute('data-move');
        makeMove(move);
    }
}

// Запуск таймера игры
function startGameTimer() {
    const timerElement = document.getElementById('timer');
    
    // Останавливаем предыдущий таймер если он есть
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    gameState.timeLeft = 5;
    updateTimerDisplay();
    
    gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameTimer);
            // Если игрок не сделал ход, выбираем случайное действие
            if (!gameState.playerMove) {
                const moves = ['ATK', 'DEF', 'CHR', 'SPEC'];
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                makeMove(randomMove);
            }
        }
    }, 1000);
}

// Обновление отображения таймера
function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `00:0${gameState.timeLeft}`;
}

// Выполнение действия
function makeMove(move) {
    const playerAction = document.getElementById('player-action');
    const playerSprite = document.getElementById('player-sprite');
    
    // Сохраняем ход игрока
    gameState.playerMove = move;
    playerAction.textContent = `[${move}]`;
    
    // Анимация в зависимости от действия
    playerSprite.classList.remove('player-attack', 'player-hit', 'player-charge');
    
    if (move === 'ATK') {
        playerSprite.classList.add('player-attack');
    } else if (move === 'CHR' || move === 'SPEC') {
        playerSprite.classList.add('player-charge');
    }
    
    // ИИ противника выбирает действие
    setTimeout(() => {
        const enemyMoves = ['ATK', 'DEF', 'CHR', 'SPEC'];
        const enemyMove = enemyMoves[Math.floor(Math.random() * enemyMoves.length)];
        const enemyAction = document.getElementById('enemy-action');
        const enemySprite = document.getElementById('enemy-sprite');
        
        // Сохраняем ход противника
        gameState.enemyMove = enemyMove;
        enemyAction.textContent = `[${enemyMove}]`;
        
        // Анимация противника
        enemySprite.classList.remove('enemy-attack', 'enemy-hit', 'enemy-charge');
        
        if (enemyMove === 'ATK') {
            enemySprite.classList.add('enemy-attack');
        } else if (enemyMove === 'CHR' || enemyMove === 'SPEC') {
            enemySprite.classList.add('enemy-charge');
        }
        
        // Определяем результат раунда
        setTimeout(() => {
            resolveRound();
        }, 500);
    }, 1000);
}

// Определение результата раунда
function resolveRound() {
    const playerMove = gameState.playerMove;
    const enemyMove = gameState.enemyMove;
    const playerSprite = document.getElementById('player-sprite');
    const enemySprite = document.getElementById('enemy-sprite');
    
    // Простая логика боя
    let playerDamage = 0;
    let enemyDamage = 0;
    let playerEnergyChange = 0;
    let enemyEnergyChange = 0;
    
    // Логика для игрока
    if (playerMove === 'ATK') {
        if (enemyMove === 'DEF') {
            playerDamage = 0;
            enemyDamage = 5; // Небольшой урон через защиту
        } else if (enemyMove === 'CHR') {
            playerDamage = 0;
            enemyDamage = 20; // Двойной урон
        } else {
            playerDamage = 0;
            enemyDamage = 10; // Обычный урон
        }
        playerEnergyChange = -10;
    } else if (playerMove === 'DEF') {
        if (enemyMove === 'ATK') {
            playerDamage = 5;
            enemyDamage = 0;
        } else if (enemyMove === 'SPEC') {
            playerDamage = 15;
            enemyDamage = 0;
        } else {
            playerDamage = 0;
            enemyDamage = 0;
        }
    } else if (playerMove === 'CHR') {
        if (enemyMove === 'ATK') {
            playerDamage = 20;
            enemyDamage = 0;
        } else {
            playerDamage = 0;
            enemyDamage = 0;
        }
        playerEnergyChange = 20;
    } else if (playerMove === 'SPEC') {
        if (gameState.playerEnergy >= 30) {
            if (enemyMove === 'DEF') {
                playerDamage = 0;
                enemyDamage = 25; // Особый урон через защиту
            } else if (enemyMove === 'CHR') {
                playerDamage = 0;
                enemyDamage = 0; // Особый прием бесполезен против зарядки
            } else {
                playerDamage = 0;
                enemyDamage = 20; // Обычный особый урон
            }
            playerEnergyChange = -30;
        } else {
            // Недостаточно энергии
            playerDamage = 0;
            enemyDamage = 0;
        }
    }
    
    // Применяем изменения
    gameState.playerHealth = Math.max(0, gameState.playerHealth - playerDamage);
    gameState.enemyHealth = Math.max(0, gameState.enemyHealth - enemyDamage);
    gameState.playerEnergy = Math.max(0, Math.min(100, gameState.playerEnergy + playerEnergyChange));
    gameState.enemyEnergy = Math.max(0, Math.min(100, gameState.enemyEnergy + enemyEnergyChange));
    
    // Обновляем интерфейс
    updateGameUI();
    
    // Анимация получения урона
    if (playerDamage > 0) {
        playerSprite.classList.add('player-hit');
    }
    if (enemyDamage > 0) {
        enemySprite.classList.add('enemy-hit');
    }
    
    // Проверяем условия победы
    setTimeout(() => {
        if (gameState.playerHealth <= 0 || gameState.enemyHealth <= 0) {
            // Конец игры
            if (gameState.playerHealth <= 0 && gameState.enemyHealth <= 0) {
                alert('Draw! Both players defeated.');
            } else if (gameState.playerHealth <= 0) {
                alert('You lost! Try again.');
            } else {
                alert('You won! Congratulations.');
                // Награда за победу
                if (userData) {
                    userData.xp += 50;
                    userData.balance += 5;
                    updateUserInfo();
                }
            }
            
            // Перезапускаем игру через 2 секунды
            setTimeout(() => {
                initWastelandDuel();
            }, 2000);
        } else {
            // Новый раунд
            gameState.round++;
            gameState.playerMove = null;
            gameState.enemyMove = null;
            
            document.getElementById('round-number').textContent = gameState.round;
            document.getElementById('player-action').textContent = '[?????]';
            document.getElementById('enemy-action').textContent = '[?????]';
            
            // Запускаем таймер
            startGameTimer();
        }
    }, 1500);
}

// Обновление интерфейса игры
function updateGameUI() {
    document.getElementById('player-health-fill').style.width = `${gameState.playerHealth}%`;
    document.getElementById('enemy-health-fill').style.width = `${gameState.enemyHealth}%`;
    document.getElementById('player-energy-fill').style.width = `${gameState.playerEnergy}%`;
    document.getElementById('enemy-energy-fill').style.width = `${gameState.enemyEnergy}%`;
}

// Инициализируем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    
    // Добавляем эффект печатания для текста
    const welcomeText = document.querySelector('.glowing-text');
    if (welcomeText) {
        welcomeText.style.opacity = '0';
        welcomeText.style.transition = 'opacity 2s ease-in-out';
        
        setTimeout(() => {
            welcomeText.style.opacity = '1';
        }, 500);
    }
});

// Обработчик получения данных от бота Telegram
if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.onEvent('webAppDataReceived', (event) => {
        console.log('Data received from bot:', event);
    });
}