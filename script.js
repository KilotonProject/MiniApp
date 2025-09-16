// KILOTON RUNNER - Unified Terminal Hacking v2.1
// Глобальные переменные
let userData = null;
let menuOpen = false;
let gameActive = false;
let isMultiplayer = false;
let gameMode = 'solo'; // 'solo' или 'multiplayer'
let currentGame = null;
let playerRole = null;
let gameWords = [];
let correctPassword = '';
let attemptsLeft = 4;
let currentStake = { amount: 0, currency: 'TON' };
let gameTimer = null;
let timeLeft = 300; // 5 минут

// Упрощенная звуковая система - только щелчки
class SimpleAudioManager {
    constructor() {
        this.context = null;
        this.initialized = false;
        this.masterVolume = 0.15;
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (error) {
            console.log("Audio not available");
        }
    }

    click() {
        if (!this.context) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.value = 800;
        
        gainNode.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.08);
    }
}

// Мультиплеер менеджер (улучшенная симуляция)
class MultiplayerManager {
    constructor() {
        this.games = [];
        this.currentGame = null;
        this.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        this.opponentSimulation = null;
    }

    createGame(stake) {
        const gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        const game = {
            id: gameCode,
            host: this.playerId,
            hostName: userData.name || 'YOU',
            stake: stake,
            status: 'waiting',
            guest: null,
            guestName: null,
            round: 1,
            scores: { host: 0, guest: 0 },
            gameState: 'waiting'
        };
        
        this.games.push(game);
        this.currentGame = game;
        return game;
    }

    joinGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (game && game.status === 'waiting') {
            game.guest = this.playerId;
            game.guestName = userData.name || 'YOU';
            game.status = 'playing';
            this.currentGame = game;
            return game;
        }
        return null;
    }

    getAvailableGames() {
        // Генерируем случайные игры для демонстрации
        const mockGames = [];
        for (let i = 0; i < 3; i++) {
            const currencies = ['TON', 'TSAR'];
            const amounts = [0.1, 0.25, 0.5, 1.0, 100, 250, 500];
            const currency = currencies[Math.floor(Math.random() * currencies.length)];
            const amount = amounts[Math.floor(Math.random() * amounts.length)];
            
            mockGames.push({
                id: Math.random().toString(36).substr(2, 6).toUpperCase(),
                hostName: 'PLAYER_' + Math.floor(Math.random() * 1000),
                stake: { amount, currency },
                status: 'waiting'
            });
        }
        
        return mockGames.concat(this.games.filter(g => g.status === 'waiting' && g.host !== this.playerId));
    }

    simulateOpponent() {
        if (this.currentGame && this.currentGame.status === 'waiting') {
            // Симулируем присоединение через 2-5 секунд
            const delay = 2000 + Math.random() * 3000;
            setTimeout(() => {
                if (this.currentGame && this.currentGame.status === 'waiting') {
                    this.currentGame.guest = 'ai_opponent';
                    this.currentGame.guestName = 'VAULT_DWELLER_' + Math.floor(Math.random() * 1000);
                    this.currentGame.status = 'playing';
                    startGame();
                }
            }, delay);
        }
    }

    simulateOpponentActions() {
        if (!this.currentGame || !gameActive || !isMultiplayer) return;
        
        // Симулируем действия оппонента с задержкой
        const delay = 2000 + Math.random() * 8000; // 2-10 секунд
        this.opponentSimulation = setTimeout(() => {
            if (gameActive && isMultiplayer) {
                this.performOpponentAction();
            }
        }, delay);
    }

    performOpponentAction() {
        if (!gameActive) return;
        
        // Случайно выбираем слово
        const availableWords = gameWords.filter(word => word !== correctPassword);
        const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        
        // Обновляем прогресс оппонента
        updateOpponentProgress(60);
        addLogEntry(`Opponent selected: ${randomWord}`, 'opponent');
        
        // Показываем выделение слова оппонентом
        highlightOpponentChoice(randomWord);
        
        setTimeout(() => {
            if (randomWord === correctPassword) {
                // Оппонент выиграл
                addLogEntry('Opponent found correct password!', 'error');
                endGame(false);
            } else {
                // Оппонент ошибся
                const matches = getMatchingPositions(randomWord, correctPassword);
                addLogEntry(`Opponent failed. Likeness: ${matches}`, 'opponent');
                updateOpponentProgress(100);
                
                // Продолжаем симуляцию
                if (gameActive) {
                    this.simulateOpponentActions();
                }
            }
        }, 1000);
    }

    stopOpponentSimulation() {
        if (this.opponentSimulation) {
            clearTimeout(this.opponentSimulation);
            this.opponentSimulation = null;
        }
    }
}

// Инициализация систем
const audioManager = new SimpleAudioManager();
const multiplayerManager = new MultiplayerManager();

// Функция инициализации приложения
function initApp() {
    console.log("Initializing Vault-Tec unified gaming terminal...");
    
    audioManager.init();
    loadUserData();
    setupNavigation();
    setupGameHandlers();
    enhanceUserExperience();
    
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    showWelcomeScreen();
    
    console.log("Vault-Tec terminal initialized successfully");
}

// Загрузка данных пользователя
function loadUserData() {
    userData = {
        name: "Vault Resident",
        tonBalance: 0.542,
        tsarBalance: 1250,
        level: 15,
        xp: 1250,
        nextLevelXp: 2000,
        wins: 23,
        losses: 7,
        terminalsHacked: 15
    };
    
    updateUserInfo();
}

// Обновление информации пользователя
function updateUserInfo() {
    if (userData) {
        document.getElementById('balance-display').textContent = `TON: ${userData.tonBalance}`;
        document.getElementById('clan-display').textContent = `W/L: ${userData.wins}/${userData.losses}`;
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
    hideAllScreens();
    document.getElementById('welcome-screen').classList.add('active');
    
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.animation = 'loading 3s ease-in-out forwards';
    
    setTimeout(() => {
        hideAllScreens();
        document.getElementById('main-screen').classList.add('active');
        showSection('stat');
    }, 3000);
}

// Скрыть все экраны
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Настройка навигации
function setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenuBtn = document.getElementById('close-menu');
    const navButtons = document.querySelectorAll('.nav-btn');
    
    menuToggle.addEventListener('click', function() {
        audioManager.click();
        if (menuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    closeMenuBtn.addEventListener('click', function() {
        audioManager.click();
        closeMenu();
    });
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            audioManager.click();
            const section = this.getAttribute('data-section');
            showSection(section);
            closeMenu();
        });
    });
}

// Функции меню
function openMenu() {
    const pipboyNav = document.getElementById('pipboy-nav');
    const menuToggle = document.getElementById('menu-toggle');
    
    pipboyNav.classList.add('open');
    menuToggle.style.display = 'none';
    menuOpen = true;
}

function closeMenu() {
    const pipboyNav = document.getElementById('pipboy-nav');
    const menuToggle = document.getElementById('menu-toggle');
    
    pipboyNav.classList.remove('open');
    menuToggle.style.display = 'flex';
    menuOpen = false;
}

// Показать раздел
function showSection(section) {
    const allSections = document.querySelectorAll('.section-content');
    allSections.forEach(sec => sec.classList.remove('active'));
    
    document.getElementById('default-content').style.display = 'none';
    
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Настройка обработчиков игры
function setupGameHandlers() {
    // Запуск игры
    document.getElementById('terminal-hack-btn').addEventListener('click', function() {
        audioManager.click();
        showGameScreen();
    });

    document.getElementById('coming-soon-btn').addEventListener('click', function() {
        audioManager.click();
        alert('This feature is coming soon!');
    });

    // Возврат в аркаду
    document.getElementById('back-to-arcade').addEventListener('click', function() {
        audioManager.click();
        resetGame();
        hideAllScreens();
        document.getElementById('main-screen').classList.add('active');
        showSection('gameboy');
    });

    // Выбор режима
    document.getElementById('solo-mode-btn').addEventListener('click', function() {
        audioManager.click();
        selectGameMode('solo');
    });

    document.getElementById('multiplayer-mode-btn').addEventListener('click', function() {
        audioManager.click();
        selectGameMode('multiplayer');
    });

    // Настройки мультиплеера
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            audioManager.click();
            document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const currency = this.getAttribute('data-currency');
            document.getElementById('currency-display').textContent = currency;
        });
    });

    document.getElementById('create-game').addEventListener('click', function() {
        audioManager.click();
        createMultiplayerGame();
    });

    document.getElementById('find-game').addEventListener('click', function() {
        audioManager.click();
        showAvailableGames();
    });

    document.getElementById('back-to-modes').addEventListener('click', function() {
        audioManager.click();
        showModeSelector();
    });

    document.getElementById('cancel-waiting').addEventListener('click', function() {
        audioManager.click();
        cancelWaiting();
    });
}

// Показать экран игры
function showGameScreen() {
    hideAllScreens();
    document.getElementById('game-screen').classList.add('active');
    showModeSelector();
}

// Показать выбор режима
function showModeSelector() {
    document.getElementById('mode-selector').style.display = 'block';
    document.getElementById('multiplayer-setup').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'none';
    document.getElementById('gaming-area').style.display = 'none';
}

// Выбрать режим игры
function selectGameMode(mode) {
    gameMode = mode;
    isMultiplayer = mode === 'multiplayer';
    
    if (mode === 'solo') {
        startSoloGame();
    } else {
        showMultiplayerSetup();
    }
}

// Показать настройки мультиплеера
function showMultiplayerSetup() {
    document.getElementById('mode-selector').style.display = 'none';
    document.getElementById('multiplayer-setup').style.display = 'block';
    document.getElementById('available-games').style.display = 'none';
}

// Создать мультиплеер игру
function createMultiplayerGame() {
    const amount = parseFloat(document.getElementById('stake-amount').value);
    const currency = document.querySelector('.currency-btn.active').getAttribute('data-currency');
    
    if (amount <= 0) {
        alert('Please enter a valid stake amount');
        return;
    }

    const balance = currency === 'TON' ? userData.tonBalance : userData.tsarBalance;
    if (amount > balance) {
        alert(`Insufficient ${currency} balance`);
        return;
    }

    currentStake = { amount, currency };
    currentGame = multiplayerManager.createGame(currentStake);
    
    showWaitingLobby();
    multiplayerManager.simulateOpponent();
}

// Показать доступные игры
function showAvailableGames() {
    const gamesContainer = document.getElementById('games-container');
    const availableGames = multiplayerManager.getAvailableGames();
    
    if (availableGames.length === 0) {
        gamesContainer.innerHTML = '<p style="text-align: center; color: var(--pipboy-green); padding: 20px;">No games available</p>';
    } else {
        gamesContainer.innerHTML = availableGames.map(game => `
            <div class="game-listing" onclick="joinMultiplayerGame('${game.id}')">
                <div class="listing-info">
                    <div class="listing-stake">${game.stake.amount} ${game.stake.currency}</div>
                    <div class="listing-host">Host: ${game.hostName}</div>
                </div>
                <button class="join-game-btn" onclick="event.stopPropagation(); joinMultiplayerGame('${game.id}')">JOIN</button>
            </div>
        `).join('');
    }
    
    document.getElementById('available-games').style.display = 'block';
}

// Присоединиться к игре
function joinMultiplayerGame(gameId) {
    audioManager.click();
    
    const game = multiplayerManager.joinGame(gameId);
    if (game) {
        currentStake = game.stake;
        currentGame = game;
        
        const balance = game.stake.currency === 'TON' ? userData.tonBalance : userData.tsarBalance;
        if (game.stake.amount > balance) {
            alert(`Insufficient ${game.stake.currency} balance`);
            return;
        }
        
        startGame();
    } else {
        alert('Failed to join game');
    }
}

// Показать лобби ожидания
function showWaitingLobby() {
    document.getElementById('multiplayer-setup').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'flex';
    
    document.getElementById('lobby-game-code').textContent = currentGame.id;
    document.getElementById('lobby-stake').textContent = `${currentStake.amount} ${currentStake.currency}`;
}

// Отменить ожидание
function cancelWaiting() {
    multiplayerManager.currentGame = null;
    currentGame = null;
    showMultiplayerSetup();
}

// Запустить соло игру
function startSoloGame() {
    isMultiplayer = false;
    startGame();
}

// Запустить игру
function startGame() {
    document.getElementById('mode-selector').style.display = 'none';
    document.getElementById('multiplayer-setup').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'none';
    document.getElementById('gaming-area').style.display = 'flex';
    
    initializeGame();
}

// Инициализация игры
function initializeGame() {
    gameActive = true;
    attemptsLeft = 4;
    timeLeft = 300; // 5 минут
    
    // Настройка интерфейса
    document.getElementById('mode-display').textContent = isMultiplayer ? 'MULTIPLAYER' : 'SOLO MODE';
    document.getElementById('round-display').textContent = 'ROUND 1';
    
    if (isMultiplayer) {
        document.getElementById('opponent-status').style.display = 'flex';
        document.getElementById('stake-display').style.display = 'block';
        document.getElementById('stake-display').textContent = `STAKE: ${currentStake.amount} ${currentStake.currency}`;
        document.getElementById('opponent-name').textContent = currentGame ? currentGame.guestName : 'OPPONENT';
    } else {
        document.getElementById('opponent-status').style.display = 'none';
        document.getElementById('stake-display').style.display = 'none';
    }
    
    // Сброс интерфейса
    updatePlayerProgress(0);
    updateOpponentProgress(0);
    updateAttempts(4);
    
    // Генерируем игровое поле
    generateTerminalField();
    
    // Запускаем таймер
    startGameTimer();
    
    // Очищаем лог
    clearLog();
    addLogEntry('Terminal access initiated', 'system');
    addLogEntry(`${gameWords.length} passwords detected`, 'system');
    addLogEntry('Select password to attempt access', 'system');
    
    // Запускаем симуляцию оппонента в мультиплеере
    if (isMultiplayer) {
        multiplayerManager.simulateOpponentActions();
    }
}

// Генерация игрового поля
function generateTerminalField() {
    const wordLists = {
        6: ['SYSTEM', 'ACCESS', 'SECURE', 'MATRIX', 'CIPHER', 'BINARY', 'SYNTAX', 'VECTOR', 'KERNEL', 'BUFFER'],
        7: ['COMMAND', 'NETWORK', 'PROGRAM', 'PROCESS', 'CONNECT', 'SESSION', 'EXECUTE', 'MACHINE', 'CONTROL', 'SCANNER'],
        8: ['PASSWORD', 'SECURITY', 'DATABASE', 'TERMINAL', 'PROTOCOL', 'FUNCTION', 'VARIABLE', 'COMPILER', 'OPERATOR', 'REGISTRY']
    };
    
    const wordLength = [6, 7, 8][Math.floor(Math.random() * 3)];
    const availableWords = [...wordLists[wordLength]];
    const numWords = 5 + Math.floor(Math.random() * 3);
    
    gameWords = [];
    for (let i = 0; i < numWords; i++) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        gameWords.push(availableWords.splice(randomIndex, 1)[0]);
    }
    
    correctPassword = gameWords[Math.floor(Math.random() * gameWords.length)];
    console.log("Correct password:", correctPassword);
    
    const fillerChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~';
    
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    
    leftPanel.innerHTML = '';
    rightPanel.innerHTML = '';
    
    let currentWordIndex = 0;
    let leftContent = '';
    let rightContent = '';
    
    for (let i = 0; i < 17; i++) {
        const hexAddress = '0x' + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
        
        let lineContent = '';
        let charsInLine = 0;
        const maxCharsPerLine = 12;
        
        while (charsInLine < maxCharsPerLine) {
            if (currentWordIndex < gameWords.length && Math.random() < 0.3 && (maxCharsPerLine - charsInLine) >= gameWords[currentWordIndex].length) {
                lineContent += `<span class="terminal-word" data-word="${gameWords[currentWordIndex]}">${gameWords[currentWordIndex]}</span>`;
                charsInLine += gameWords[currentWordIndex].length;
                currentWordIndex++;
            } else if (Math.random() < 0.15) {
                const bracketContent = fillerChars.charAt(Math.floor(Math.random() * fillerChars.length));
                lineContent += `<span class="terminal-bracket" data-bracket="true">[${bracketContent}]</span>`;
                charsInLine += 3;
            } else {
                const randomChar = Math.random() < 0.7 ? 
                    fillerChars.charAt(Math.floor(Math.random() * fillerChars.length)) :
                    String.fromCharCode(65 + Math.floor(Math.random() * 26));
                lineContent += `<span class="terminal-symbol">${randomChar}</span>`;
                charsInLine++;
            }
        }
        
        const fullLine = `<div class="terminal-line">
            <span class="hex-address">${hexAddress}</span>
            <span class="terminal-content">${lineContent}</span>
        </div>`;
        
        if (i % 2 === 0) {
            leftContent += fullLine;
        } else {
            rightContent += fullLine;
        }
    }
    
    leftPanel.innerHTML = leftContent;
    rightPanel.innerHTML = rightContent;
    
    setupTerminalEventHandlers();
}

// Настройка обработчиков терминала
function setupTerminalEventHandlers() {
    document.querySelectorAll('.terminal-word').forEach(word => {
        word.addEventListener('click', function() {
            if (!gameActive) return;
            
            audioManager.click();
            const selectedWord = this.getAttribute('data-word');
            attemptPassword(selectedWord, this);
        });
    });
    
    document.querySelectorAll('.terminal-bracket').forEach(bracket => {
        bracket.addEventListener('click', function() {
            if (!gameActive || this.classList.contains('used')) return;
            
            audioManager.click();
            
            if (Math.random() < 0.4 && attemptsLeft < 4) {
                attemptsLeft = Math.min(4, attemptsLeft + 1);
                updateAttempts(attemptsLeft);
                addLogEntry('Dud removed - attempt restored', 'success');
                this.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
            } else {
                addLogEntry('Access denied', 'error');
                this.style.backgroundColor = 'rgba(255, 102, 0, 0.3)';
            }
            
            this.classList.add('used');
        });
    });
}

// Попытка пароля
function attemptPassword(selectedWord, element) {
    if (!gameActive) return;
    
    element.classList.add('selected');
    updatePlayerProgress(50);
    
    addLogEntry(`Password attempt: ${selectedWord}`, 'normal');
    
    setTimeout(() => {
        if (selectedWord === correctPassword) {
            element.classList.add('correct');
            addLogEntry('ACCESS GRANTED!', 'success');
            updatePlayerProgress(100);
            endGame(true);
        } else {
            element.classList.add('incorrect');
            attemptsLeft--;
            updateAttempts(attemptsLeft);
            updatePlayerProgress(75);
            
            const matches = getMatchingPositions(selectedWord, correctPassword);
            addLogEntry(`Entry denied - Likeness: ${matches}`, 'error');
            
            if (attemptsLeft <= 0) {
                addLogEntry('Terminal locked - access denied', 'error');
                endGame(false);
            }
        }
        
        element.classList.remove('selected');
    }, 500);
}

// Завершение игры
function endGame(won) {
    gameActive = false;
    
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    multiplayerManager.stopOpponentSimulation();
    
    setTimeout(() => {
        if (isMultiplayer) {
            showMultiplayerResult(won);
        } else {
            showSoloResult(won);
        }
    }, 2000);
}

// Результат соло игры
function showSoloResult(won) {
    if (won) {
        userData.xp += 25;
        userData.terminalsHacked++;
        alert('🎉 ACCESS GRANTED! 🎉\n\n+25 XP\nTerminal successfully hacked!');
    } else {
        userData.xp += 5;
        alert('❌ ACCESS DENIED ❌\n\nTerminal locked.\n\n+5 XP for effort');
    }
    
    updateUserInfo();
    resetGame();
    showModeSelector();
}

// Результат мультиплеер игры
function showMultiplayerResult(won) {
    if (won) {
        if (currentStake.currency === 'TON') {
            userData.tonBalance += currentStake.amount;
        } else {
            userData.tsarBalance += currentStake.amount;
        }
        userData.wins++;
        userData.xp += 50;
        
        alert(`🎉 VICTORY! 🎉\n\nYou won ${currentStake.amount} ${currentStake.currency}!\n+50 XP\n\nNew balance: ${currentStake.currency === 'TON' ? userData.tonBalance.toFixed(3) : userData.tsarBalance} ${currentStake.currency}`);
    } else {
        if (currentStake.currency === 'TON') {
            userData.tonBalance -= currentStake.amount;
        } else {
            userData.tsarBalance -= currentStake.amount;
        }
        userData.losses++;
        userData.xp += 10;
        
        alert(`💀 DEFEAT! 💀\n\nYou lost ${currentStake.amount} ${currentStake.currency}\n+10 XP\n\nRemaining: ${currentStake.currency === 'TON' ? userData.tonBalance.toFixed(3) : userData.tsarBalance} ${currentStake.currency}`);
    }
    
    updateUserInfo();
    resetGame();
    showModeSelector();
}

// Сброс игры
function resetGame() {
    gameActive = false;
    isMultiplayer = false;
    currentGame = null;
    gameWords = [];
    correctPassword = '';
    attemptsLeft = 4;
    timeLeft = 300;
    
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    multiplayerManager.stopOpponentSimulation();
    multiplayerManager.currentGame = null;
}

// Таймер игры
function startGameTimer() {
    if (gameTimer) clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        if (!gameActive) {
            clearInterval(gameTimer);
            return;
        }
        
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            addLogEntry('Time expired - access denied', 'error');
            endGame(false);
        }
    }, 1000);
}

// Обновление таймера
function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('terminal-timer');
    timerElement.textContent = display;
    
    if (timeLeft <= 30) {
        timerElement.className = 'terminal-timer critical';
    } else if (timeLeft <= 60) {
        timerElement.className = 'terminal-timer warning';
    } else {
        timerElement.className = 'terminal-timer';
    }
}

// Обновление прогресса игрока
function updatePlayerProgress(percentage) {
    document.getElementById('your-progress-fill').style.width = percentage + '%';
    
    let status = 'Searching...';
    if (percentage >= 100) status = 'Complete';
    else if (percentage >= 75) status = 'Analyzing...';
    else if (percentage >= 50) status = 'Processing...';
    else if (percentage >= 25) status = 'Working...';
    
    document.querySelector('#your-progress .progress-text').textContent = status;
}

// Обновление прогресса оппонента
function updateOpponentProgress(percentage) {
    if (!isMultiplayer) return;
    
    document.getElementById('opponent-progress-fill').style.width = percentage + '%';
    
    let status = 'Searching...';
    if (percentage >= 100) status = 'Complete';
    else if (percentage >= 75) status = 'Analyzing...';
    else if (percentage >= 50) status = 'Processing...';
    else if (percentage >= 25) status = 'Working...';
    
    document.querySelector('#opponent-progress .progress-text').textContent = status;
}

// Обновление попыток
function updateAttempts(attempts) {
    let squares = '';
    for (let i = 0; i < 4; i++) {
        squares += i < attempts ? '■ ' : '□ ';
    }
    
    document.getElementById('your-attempts').textContent = squares.trim();
    
    if (isMultiplayer) {
        // Симулируем попытки оппонента
        const opponentAttempts = 3 + Math.floor(Math.random() * 2);
        let opponentSquares = '';
        for (let i = 0; i < 4; i++) {
            opponentSquares += i < opponentAttempts ? '■ ' : '□ ';
        }
        document.getElementById('opponent-attempts').textContent = opponentSquares.trim();
    }
}

// Подсветка выбора оппонента
function highlightOpponentChoice(word) {
    document.querySelectorAll('.terminal-word').forEach(wordElement => {
        if (wordElement.getAttribute('data-word') === word) {
            wordElement.classList.add('opponent-selected');
            setTimeout(() => {
                wordElement.classList.remove('opponent-selected');
            }, 2000);
        }
    });
}

// Совпадающие позиции
function getMatchingPositions(word1, word2) {
    let matches = 0;
    const minLength = Math.min(word1.length, word2.length);
    
    for (let i = 0; i < minLength; i++) {
        if (word1[i] === word2[i]) {
            matches++;
        }
    }
    
    return matches;
}

// Система логов
function clearLog() {
    document.getElementById('log-content').innerHTML = '';
}

function addLogEntry(message, type = 'normal') {
    const logContent = document.getElementById('log-content');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
    
    if (logContent.children.length > 15) {
        logContent.removeChild(logContent.children[0]);
    }
}

// Улучшение пользовательского опыта
function enhanceUserExperience() {
    const supportsVibration = 'vibrate' in navigator;
    
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            if (supportsVibration) {
                navigator.vibrate(10);
            }
            
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (document.getElementById('game-screen').classList.contains('active')) {
                document.getElementById('back-to-arcade').click();
            }
        }
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    initApp();
});