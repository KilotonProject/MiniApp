// KILOTON TERMINAL - Gaming Platform v2.1
let userData = null;
let menuOpen = false;
let gameActive = false;
let isMultiplayer = false;
let gameWords = [];
let correctPassword = '';
let attemptsLeft = 4;
let currentStake = { amount: 0, currency: 'TON' };
let gameTimer = null;
let timeLeft = 300;
let selectedCurrency = 'TON';

// Упрощенная звуковая система
class SimpleAudioManager {
    constructor() {
        this.context = null;
        this.initialized = false;
        this.enabled = true;
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (error) {
            console.log("Audio not available");
            this.enabled = false;
        }
    }

    click() {
        if (!this.context || !this.enabled) return;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.value = 800;
            
            gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + 0.05);
        } catch (error) {
            console.log("Audio error:", error);
        }
    }
}

// Мультиплеер система
class MultiplayerManager {
    constructor() {
        this.currentGame = null;
        this.opponentTimer = null;
    }

    createGame(stake) {
        this.currentGame = {
            id: Math.random().toString(36).substr(2, 6).toUpperCase(),
            stake: stake,
            status: 'waiting'
        };
        return this.currentGame;
    }

    simulateOpponent() {
        const delay = 3000 + Math.random() * 4000;
        setTimeout(() => {
            if (this.currentGame && this.currentGame.status === 'waiting') {
                this.currentGame.status = 'playing';
                this.currentGame.opponentName = 'KILOTON_PLAYER_' + Math.floor(Math.random() * 1000);
                startGameSession();
            }
        }, delay);
    }

    simulateOpponentActions() {
        if (!gameActive || !isMultiplayer) return;
        
        const delay = 5000 + Math.random() * 10000;
        this.opponentTimer = setTimeout(() => {
            if (gameActive && isMultiplayer) {
                this.performOpponentMove();
            }
        }, delay);
    }

    performOpponentMove() {
        const wrongWords = gameWords.filter(w => w !== correctPassword);
        const selectedWord = wrongWords[Math.floor(Math.random() * wrongWords.length)];
        
        addLogEntry(`Opponent selected: ${selectedWord}`, 'opponent');
        updateOpponentProgress(75);
        
        setTimeout(() => {
            const matches = getMatchingPositions(selectedWord, correctPassword);
            addLogEntry(`Opponent failed - Likeness: ${matches}`, 'opponent');
            updateOpponentProgress(100);
            
            if (gameActive) {
                this.simulateOpponentActions();
            }
        }, 1500);
    }

    stopSimulation() {
        if (this.opponentTimer) {
            clearTimeout(this.opponentTimer);
            this.opponentTimer = null;
        }
    }
}

// Инициализация
const audioManager = new SimpleAudioManager();
const multiplayerManager = new MultiplayerManager();

// Основная инициализация
function initApp() {
    console.log("Initializing KILOTON terminal...");
    
    // Инициализируем аудио с задержкой для мобильных
    setTimeout(() => {
        audioManager.init();
    }, 1000);
    
    loadUserData();
    setupEventHandlers();
    
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    showWelcomeScreen();
    
    console.log("KILOTON terminal ready");
}

// Данные пользователя
function loadUserData() {
    userData = {
        name: "KILOTON Player",
        tonBalance: 0.542,
        tsarBalance: 1250,
        level: 15,
        xp: 1250,
        nextLevelXp: 2000,
        wins: 23,
        losses: 7,
        gamesPlayed: 30
    };
    
    updateUserInfo();
}

function updateUserInfo() {
    if (userData) {
        document.getElementById('balance-display').textContent = `TON: ${userData.tonBalance}`;
        document.getElementById('clan-display').textContent = `W/L: ${userData.wins}/${userData.losses}`;
    }
}

function updateDateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('time-display').textContent = `🕐 ${timeStr}`;
}

// Приветственный экран с улучшенной анимацией
function showWelcomeScreen() {
    hideAllScreens();
    document.getElementById('welcome-screen').classList.add('active');
    
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const bootComplete = document.getElementById('boot-complete');
    
    // Анимация загрузки
    progressFill.style.animation = 'loading 4s ease-in-out forwards';
    
    // Обновляем текст прогресса
    const loadingTexts = [
        'INITIALIZING KILOTON TERMINAL...',
        'CONNECTING TO TON BLOCKCHAIN...',
        'LOADING TSAR TOKEN PROTOCOL...',
        'SYSTEM READY'
    ];
    
    let textIndex = 0;
    const textInterval = setInterval(() => {
        if (textIndex < loadingTexts.length) {
            progressText.textContent = loadingTexts[textIndex];
            textIndex++;
        } else {
            clearInterval(textInterval);
        }
    }, 1000);
    
    // Показываем кнопку завершения через 4 секунды
    setTimeout(() => {
        progressText.style.display = 'none';
        bootComplete.style.display = 'block';
        
        // Обработчик клика для продолжения
        const continueHandler = () => {
            hideAllScreens();
            document.getElementById('main-screen').classList.add('active');
            showSection('stat');
            
            // Удаляем обработчики
            bootComplete.removeEventListener('click', continueHandler);
            bootComplete.removeEventListener('touchstart', continueHandler);
        };
        
        bootComplete.addEventListener('click', continueHandler);
        bootComplete.addEventListener('touchstart', continueHandler);
        
    }, 4000);
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Настройка всех обработчиков событий
function setupEventHandlers() {
    // Навигация
    setupNavigation();
    
    // Игровые обработчики
    setupGameHandlers();
    
    // Обработчики мультиплеера
    setupMultiplayerHandlers();
    
    // Общие улучшения UX
    enhanceUserExperience();
}

function setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenuBtn = document.getElementById('close-menu');
    const navButtons = document.querySelectorAll('.nav-btn');
    
    // Меню - с поддержкой touch событий
    menuToggle.addEventListener('click', handleMenuToggle);
    menuToggle.addEventListener('touchstart', handleMenuToggle);
    
    closeMenuBtn.addEventListener('click', handleMenuClose);
    closeMenuBtn.addEventListener('touchstart', handleMenuClose);
    
    // Навигационные кнопки
    navButtons.forEach(button => {
        const handler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            audioManager.click();
            const section = this.getAttribute('data-section');
            showSection(section);
            closeMenu();
        };
        
        button.addEventListener('click', handler);
        button.addEventListener('touchstart', handler);
    });
}

function handleMenuToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    audioManager.click();
    
    if (menuOpen) {
        closeMenu();
    } else {
        openMenu();
    }
}

function handleMenuClose(e) {
    e.preventDefault();
    e.stopPropagation();
    audioManager.click();
    closeMenu();
}

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

function showSection(section) {
    const allSections = document.querySelectorAll('.section-content');
    allSections.forEach(sec => sec.classList.remove('active'));
    
    document.getElementById('default-content').style.display = 'none';
    
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

function setupGameHandlers() {
    // Запуск игры
    const gameBtn = document.getElementById('terminal-hack-btn');
    const clickHandler = function(e) {
        e.preventDefault();
        audioManager.click();
        showGameScreen();
    };
    
    gameBtn.addEventListener('click', clickHandler);
    gameBtn.addEventListener('touchstart', clickHandler);

    // Возврат в аркаду
    const backBtn = document.getElementById('back-to-arcade');
    const backHandler = function(e) {
        e.preventDefault();
        audioManager.click();
        resetGame();
        hideAllScreens();
        document.getElementById('main-screen').classList.add('active');
        showSection('gameboy');
    };
    
    backBtn.addEventListener('click', backHandler);
    backBtn.addEventListener('touchstart', backHandler);

    // Выбор режимов
    const soloBtn = document.getElementById('solo-mode-btn');
    const mpBtn = document.getElementById('multiplayer-mode-btn');
    
    const soloHandler = function(e) {
        e.preventDefault();
        audioManager.click();
        selectGameMode('solo');
    };
    
    const mpHandler = function(e) {
        e.preventDefault();
        audioManager.click();
        selectGameMode('multiplayer');
    };
    
    soloBtn.addEventListener('click', soloHandler);
    soloBtn.addEventListener('touchstart', soloHandler);
    mpBtn.addEventListener('click', mpHandler);
    mpBtn.addEventListener('touchstart', mpHandler);
}

function setupMultiplayerHandlers() {
    // Выбор валюты
    document.querySelectorAll('.currency-btn').forEach(btn => {
        const handler = function(e) {
            e.preventDefault();
            audioManager.click();
            
            document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            selectedCurrency = this.getAttribute('data-currency');
            document.getElementById('currency-display').textContent = selectedCurrency;
        };
        
        btn.addEventListener('click', handler);
        btn.addEventListener('touchstart', handler);
    });

    // Остальные кнопки мультиплеера
    setupMultiplayerButtons();
}

function setupMultiplayerButtons() {
    const buttons = [
        { id: 'create-game', handler: createMultiplayerGame },
        { id: 'find-game', handler: showAvailableGames },
        { id: 'back-to-modes', handler: showModeSelector },
        { id: 'cancel-waiting', handler: cancelWaiting }
    ];
    
    buttons.forEach(({ id, handler }) => {
        const element = document.getElementById(id);
        if (element) {
            const eventHandler = function(e) {
                e.preventDefault();
                audioManager.click();
                handler();
            };
            
            element.addEventListener('click', eventHandler);
            element.addEventListener('touchstart', eventHandler);
        }
    });
}

function showGameScreen() {
    hideAllScreens();
    document.getElementById('game-screen').classList.add('active');
    showModeSelector();
}

function showModeSelector() {
    document.getElementById('mode-selector').style.display = 'block';
    document.getElementById('multiplayer-setup').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'none';
    document.getElementById('gaming-area').style.display = 'none';
}

function selectGameMode(mode) {
    if (mode === 'solo') {
        isMultiplayer = false;
        startGameSession();
    } else {
        isMultiplayer = true;
        showMultiplayerSetup();
    }
}

function showMultiplayerSetup() {
    document.getElementById('mode-selector').style.display = 'none';
    document.getElementById('multiplayer-setup').style.display = 'block';
    document.getElementById('available-games').style.display = 'none';
}

function createMultiplayerGame() {
    const amount = parseFloat(document.getElementById('stake-amount').value);
    
    if (amount <= 0) {
        alert('Please enter a valid stake amount');
        return;
    }

    const balance = selectedCurrency === 'TON' ? userData.tonBalance : userData.tsarBalance;
    if (amount > balance) {
        alert(`Insufficient ${selectedCurrency} balance`);
        return;
    }

    currentStake = { amount, currency: selectedCurrency };
    const game = multiplayerManager.createGame(currentStake);
    
    showWaitingLobby();
    multiplayerManager.simulateOpponent();
}

function showAvailableGames() {
    // Показываем список доступных игр (пока заглушка)
    const gamesContainer = document.getElementById('games-container');
    gamesContainer.innerHTML = `
        <div class="game-listing" style="text-align: center; padding: 20px; color: var(--pipboy-green);">
            <p>No games available at the moment</p>
            <p style="font-size: 0.7rem; margin-top: 10px;">Try creating your own game!</p>
        </div>
    `;
    
    document.getElementById('available-games').style.display = 'block';
}

function showWaitingLobby() {
    document.getElementById('multiplayer-setup').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'flex';
    
    document.getElementById('lobby-game-code').textContent = multiplayerManager.currentGame.id;
    document.getElementById('lobby-stake').textContent = `${currentStake.amount} ${currentStake.currency}`;
}

function cancelWaiting() {
    multiplayerManager.currentGame = null;
    showMultiplayerSetup();
}

function startGameSession() {
    document.getElementById('mode-selector').style.display = 'none';
    document.getElementById('multiplayer-setup').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'none';
    document.getElementById('gaming-area').style.display = 'flex';
    
    initializeGameSession();
}

function initializeGameSession() {
    gameActive = true;
    attemptsLeft = 4;
    timeLeft = 300;
    
    // Настройка интерфейса
    document.getElementById('mode-display').textContent = isMultiplayer ? 'MULTIPLAYER' : 'SOLO MODE';
    
    if (isMultiplayer) {
        document.getElementById('opponent-status').style.display = 'flex';
        document.getElementById('stake-display').style.display = 'block';
        document.getElementById('stake-display').textContent = `STAKE: ${currentStake.amount} ${currentStake.currency}`;
        document.getElementById('opponent-name').textContent = multiplayerManager.currentGame?.opponentName || 'OPPONENT';
    } else {
        document.getElementById('opponent-status').style.display = 'none';
        document.getElementById('stake-display').style.display = 'none';
    }
    
    // Сброс прогресса
    updatePlayerProgress(0);
    updateOpponentProgress(0);
    updateAttempts(4);
    
    // Генерируем поле
    generateGameField();
    
    // Запускаем таймер
    startTimer();
    
    // Очищаем и инициализируем лог
    clearLog();
    addLogEntry('KILOTON Terminal access initiated', 'system');
    addLogEntry(`Password database loaded: ${gameWords.length} entries`, 'system');
    addLogEntry('Select password to attempt access', 'system');
    
    // Запускаем симуляцию оппонента
    if (isMultiplayer) {
        multiplayerManager.simulateOpponentActions();
    }
}

function generateGameField() {
    const wordLists = {
        6: ['KILOTON', 'ACCESS', 'SECURE', 'MATRIX', 'CIPHER', 'BINARY', 'SYNTAX', 'VECTOR', 'KERNEL', 'BUFFER'],
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
    
    for (let i = 0; i < 16; i++) {
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
                const randomChar = fillerChars.charAt(Math.floor(Math.random() * fillerChars.length));
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
    
    setupTerminalHandlers();
}

function setupTerminalHandlers() {
    document.querySelectorAll('.terminal-word').forEach(word => {
        const handler = function(e) {
            e.preventDefault();
            if (!gameActive) return;
            
            audioManager.click();
            const selectedWord = this.getAttribute('data-word');
            attemptPassword(selectedWord, this);
        };
        
        word.addEventListener('click', handler);
        word.addEventListener('touchstart', handler);
    });
    
    document.querySelectorAll('.terminal-bracket').forEach(bracket => {
        const handler = function(e) {
            e.preventDefault();
            if (!gameActive || this.classList.contains('used')) return;
            
            audioManager.click();
            
            if (Math.random() < 0.4 && attemptsLeft < 4) {
                attemptsLeft = Math.min(4, attemptsLeft + 1);
                updateAttempts(attemptsLeft);
                addLogEntry('Dud removed - attempt restored', 'success');
                this.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
            } else {
                addLogEntry('No effect', 'error');
                this.style.backgroundColor = 'rgba(255, 102, 0, 0.3)';
            }
            
            this.classList.add('used');
        };
        
        bracket.addEventListener('click', handler);
        bracket.addEventListener('touchstart', handler);
    });
}

function attemptPassword(selectedWord, element) {
    if (!gameActive) return;
    
    element.classList.add('selected');
    updatePlayerProgress(60);
    
    addLogEntry(`Password attempt: ${selectedWord}`, 'normal');
    
    setTimeout(() => {
        if (selectedWord === correctPassword) {
            element.classList.add('correct');
            addLogEntry('SUCCESS: Access granted!', 'success');
            updatePlayerProgress(100);
            endGame(true);
        } else {
            element.classList.add('incorrect');
            attemptsLeft--;
            updateAttempts(attemptsLeft);
            updatePlayerProgress(80);
            
            const matches = getMatchingPositions(selectedWord, correctPassword);
            addLogEntry(`Access denied - Likeness: ${matches}`, 'error');
            
            if (attemptsLeft <= 0) {
                addLogEntry('Terminal locked - all attempts failed', 'error');
                endGame(false);
            }
        }
        
        setTimeout(() => {
            element.classList.remove('selected');
        }, 500);
    }, 500);
}

function endGame(won) {
    gameActive = false;
    
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    multiplayerManager.stopSimulation();
    
    setTimeout(() => {
        showGameResult(won);
    }, 2000);
}

function showGameResult(won) {
    if (isMultiplayer) {
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
                userData.tonBalance = Math.max(0, userData.tonBalance - currentStake.amount);
            } else {
                userData.tsarBalance = Math.max(0, userData.tsarBalance - currentStake.amount);
            }
            userData.losses++;
            userData.xp += 10;
            
            alert(`💀 DEFEAT! 💀\n\nYou lost ${currentStake.amount} ${currentStake.currency}\n+10 XP\n\nRemaining: ${currentStake.currency === 'TON' ? userData.tonBalance.toFixed(3) : userData.tsarBalance} ${currentStake.currency}`);
        }
    } else {
        if (won) {
            userData.xp += 25;
            alert('🎉 ACCESS GRANTED! 🎉\n\n+25 XP\nTerminal successfully hacked!');
        } else {
            userData.xp += 5;
            alert('❌ ACCESS DENIED ❌\n\nTerminal locked.\n\n+5 XP for effort');
        }
    }
    
    updateUserInfo();
    resetGame();
    showModeSelector();
}

function resetGame() {
    gameActive = false;
    isMultiplayer = false;
    gameWords = [];
    correctPassword = '';
    attemptsLeft = 4;
    timeLeft = 300;
    selectedCurrency = 'TON';
    
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    multiplayerManager.stopSimulation();
    multiplayerManager.currentGame = null;
}

function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        if (!gameActive) {
            clearInterval(gameTimer);
            return;
        }
        
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            addLogEntry('Time expired - access denied', 'error');
            endGame(false);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('terminal-timer');
    if (timerElement) {
        timerElement.textContent = display;
        
        if (timeLeft <= 30) {
            timerElement.className = 'terminal-timer critical';
        } else if (timeLeft <= 60) {
            timerElement.className = 'terminal-timer warning';
        } else {
            timerElement.className = 'terminal-timer';
        }
    }
}

function updatePlayerProgress(percentage) {
    const fillElement = document.getElementById('your-progress-fill');
    if (fillElement) {
        fillElement.style.width = percentage + '%';
    }
    
    let status = 'Ready';
    if (percentage >= 100) status = 'Complete';
    else if (percentage >= 80) status = 'Finalizing';
    else if (percentage >= 60) status = 'Processing';
    else if (percentage >= 30) status = 'Working';
    
    const textElement = document.querySelector('#your-progress .progress-text');
    if (textElement) {
        textElement.textContent = status;
    }
}

function updateOpponentProgress(percentage) {
    if (!isMultiplayer) return;
    
    const fillElement = document.getElementById('opponent-progress-fill');
    if (fillElement) {
        fillElement.style.width = percentage + '%';
    }
    
    let status = 'Ready';
    if (percentage >= 100) status = 'Complete';
    else if (percentage >= 80) status = 'Finalizing';
    else if (percentage >= 60) status = 'Processing';
    else if (percentage >= 30) status = 'Working';
    
    const textElement = document.querySelector('#opponent-progress .progress-text');
    if (textElement) {
        textElement.textContent = status;
    }
}

function updateAttempts(attempts) {
    let squares = '';
    for (let i = 0; i < 4; i++) {
        squares += i < attempts ? '■ ' : '□ ';
    }
    
    const attemptsElement = document.getElementById('your-attempts');
    if (attemptsElement) {
        attemptsElement.textContent = squares.trim();
    }
}

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

function clearLog() {
    const logContent = document.getElementById('log-content');
    if (logContent) {
        logContent.innerHTML = '';
    }
}

function addLogEntry(message, type = 'normal') {
    const logContent = document.getElementById('log-content');
    if (!logContent) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
    
    if (logContent.children.length > 15) {
        logContent.removeChild(logContent.children[0]);
    }
}

function enhanceUserExperience() {
    const supportsVibration = 'vibrate' in navigator;
    
    // Добавляем touch feedback
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('touchstart', function() {
            if (supportsVibration) {
                navigator.vibrate(10);
            }
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', function() {
            if (supportsVibration) {
                navigator.vibrate(10);
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (document.getElementById('game-screen').classList.contains('active')) {
                resetGame();
                hideAllScreens();
                document.getElementById('main-screen').classList.add('active');
                showSection('gameboy');
            }
        }
    });
    
    // Предотвращаем zoom на iOS
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log("KILOTON DOM loaded");
    
    // Добавляем небольшую задержку для мобильных браузеров
    setTimeout(() => {
        initApp();
    }, 100);
});

// Дополнительная инициализация для мобильных
window.addEventListener('load', function() {
    console.log("KILOTON window loaded");
    
    // Убеждаемся что все работает на мобильных
    setTimeout(() => {
        if (!userData) {
            console.log("Reinitializing...");
            initApp();
        }
    }, 500);
});

// Обработка ориентации экрана
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});