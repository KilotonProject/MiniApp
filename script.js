// RUNNER TERMINAL - Gaming Platform v2.1
let userData = null;
let menuOpen = false;
let gameActive = false;
let isMultiplayer = false;
let gameWords = [];
let correctPassword = '';
let attemptsLeft = 4;
let currentStake = { amount: 0, currency: 'TON' };
let gameTimer = null;
let turnTimer = null;
let timeLeft = 300;
let turnTimeLeft = 30;
let selectedCurrency = 'TON';
let playerTurn = true;
let gameScore = 0;

// Ретро звуковая система
class RetroAudioManager {
    constructor() {
        this.context = null;
        this.enabled = true;
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            this.enabled = false;
        }
    }

    // Ретро терминальный звук
    beep() {
        if (!this.context || !this.enabled) return;
        
        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.context.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.05);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, this.context.currentTime);
            
            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.1);
        } catch (e) {
            console.log('Audio error:', e);
        }
    }
    
    // Звук печатания
    type() {
        if (!this.context || !this.enabled) return;
        
        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.type = 'square';
            osc.frequency.value = 1200 + Math.random() * 400;
            
            gain.gain.setValueAtTime(0.05, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.03);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.03);
        } catch (e) {}
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
            status: 'waiting',
            opponentName: null
        };
        return this.currentGame;
    }

    simulateOpponent() {
        const delay = 2000 + Math.random() * 3000;
        setTimeout(() => {
            if (this.currentGame && this.currentGame.status === 'waiting') {
                this.currentGame.status = 'playing';
                this.currentGame.opponentName = 'VAULT_DWELLER_' + Math.floor(Math.random() * 1000);
                startGameSession();
            }
        }, delay);
    }

    simulateOpponentTurn() {
        if (!gameActive || !isMultiplayer || playerTurn) return;
        
        const delay = 3000 + Math.random() * 8000;
        this.opponentTimer = setTimeout(() => {
            if (gameActive && !playerTurn) {
                this.performOpponentMove();
            }
        }, delay);
    }

    performOpponentMove() {
        const wrongWords = gameWords.filter(w => w !== correctPassword);
        if (wrongWords.length === 0) return;
        
        const selectedWord = wrongWords[Math.floor(Math.random() * wrongWords.length)];
        
        addLogEntry(`Opponent selected: ${selectedWord}`, 'opponent');
        updateOpponentStatus('CHECKING...');
        
        setTimeout(() => {
            if (selectedWord === correctPassword) {
                addLogEntry('Opponent found correct password!', 'error');
                endGame(false);
            } else {
                const matches = getMatchingPositions(selectedWord, correctPassword);
                addLogEntry(`Opponent failed - Likeness: ${matches}`, 'opponent');
                
                // Уменьшаем попытки оппонента
                let oppAttempts = document.getElementById('opponent-attempts').textContent.match(/\[X\]/g).length;
                oppAttempts = Math.max(0, oppAttempts - 1);
                
                let squares = '';
                for (let i = 0; i < 4; i++) {
                    squares += i < oppAttempts ? '[X]' : '[ ]';
                }
                document.getElementById('opponent-attempts').textContent = squares;
                
                updateOpponentStatus('WAITING');
                playerTurn = true;
                updateTurnIndicator();
                startTurnTimer();
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
const audioManager = new RetroAudioManager();
const multiplayerManager = new MultiplayerManager();

function initApp() {
    console.log("Initializing RUNNER terminal...");
    
    // Инициализируем звук после пользовательского взаимодействия
    document.addEventListener('click', () => audioManager.init(), { once: true });
    document.addEventListener('touchstart', () => audioManager.init(), { once: true });
    
    loadUserData();
    setupAllEventHandlers();
    
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    showWelcomeScreen();
}

function loadUserData() {
    userData = {
        name: "RUNNER Player",
        tonBalance: 0.542,
        tsarBalance: 1250,
        level: 15,
        xp: 1250,
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
    document.getElementById('time-display').textContent = `[TIME] ${timeStr}`;
}

// Ретро приветственный экран с печатающимся текстом
function showWelcomeScreen() {
    hideAllScreens();
    document.getElementById('welcome-screen').classList.add('active');
    
    // Последовательность печатающихся строк
    const bootMessages = [
        'INITIALIZING RUNNER TERMINAL...',
        'LOADING BLOCKCHAIN PROTOCOLS...',
        'CONNECTING TO TON NETWORK......OK',
        'LOADING TSAR TOKEN SYSTEM......OK',  
        'CHECKING GAMING MODULES........OK',
        'SYSTEM DIAGNOSTICS............OK',
        'TERMINAL READY FOR OPERATION',
        'WELCOME TO RUNNER GAMING PLATFORM'
    ];
    
    let currentLine = 0;
    
    function typeNextLine() {
        if (currentLine >= bootMessages.length) {
            showRunnerLogo();
            return;
        }
        
        const lineElement = document.getElementById(`boot-line-${currentLine + 1}`);
        const message = bootMessages[currentLine];
        
        // Определяем стиль строки
        if (message.includes('OK')) {
            lineElement.className = 'boot-line success';
        } else if (message.includes('WELCOME')) {
            lineElement.className = 'boot-line yellow';
        } else {
            lineElement.className = 'boot-line';
        }
        
        typeText(lineElement, message, () => {
            currentLine++;
            setTimeout(typeNextLine, 500);
        });
    }
    
    // Начинаем через секунду
    setTimeout(typeNextLine, 1000);
}

function typeText(element, text, callback) {
    element.textContent = '';
    let i = 0;
    
    const typeInterval = setInterval(() => {
        audioManager.type();
        element.textContent += text[i];
        i++;
        
        if (i >= text.length) {
            clearInterval(typeInterval);
            if (callback) setTimeout(callback, 200);
        }
    }, 50);
}

function showRunnerLogo() {
    document.getElementById('runner-logo-section').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('continue-section').style.display = 'block';
        
        // Обработчик продолжения
        const continueHandler = (e) => {
            e.preventDefault();
            audioManager.beep();
            hideAllScreens();
            document.getElementById('main-screen').classList.add('active');
            showSection('stat');
        };
        
        const continueSection = document.getElementById('continue-section');
        continueSection.addEventListener('click', continueHandler);
        continueSection.addEventListener('touchstart', continueHandler);
        
        // Также обработчик для всего документа
        document.addEventListener('keydown', continueHandler, { once: true });
        
    }, 2000);
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

function setupAllEventHandlers() {
    setupNavigation();
    setupGameHandlers();
    setupMultiplayerHandlers();
    enhanceUserExperience();
}

function setupNavigation() {
    // Исправленная навигация
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenuBtn = document.getElementById('close-menu');
    
    // Обработчик меню с правильной логикой
    function toggleMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        audioManager.beep();
        
        if (menuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }
    
    function closeMenuHandler(e) {
        e.preventDefault();
        e.stopPropagation();
        audioManager.beep();
        closeMenu();
    }
    
    // Удаляем старые обработчики и добавляем новые
    menuToggle.removeEventListener('click', toggleMenu);
    menuToggle.removeEventListener('touchstart', toggleMenu);
    closeMenuBtn.removeEventListener('click', closeMenuHandler);
    closeMenuBtn.removeEventListener('touchstart', closeMenuHandler);
    
    menuToggle.addEventListener('click', toggleMenu);
    menuToggle.addEventListener('touchstart', toggleMenu);
    closeMenuBtn.addEventListener('click', closeMenuHandler);
    closeMenuBtn.addEventListener('touchstart', closeMenuHandler);
    
    // Навигационные кнопки
    document.querySelectorAll('.nav-btn').forEach(button => {
        function navHandler(e) {
            e.preventDefault();
            e.stopPropagation();
            audioManager.beep();
            
            const section = button.getAttribute('data-section');
            showSection(section);
            closeMenu();
        }
        
        button.removeEventListener('click', navHandler);
        button.removeEventListener('touchstart', navHandler);
        button.addEventListener('click', navHandler);
        button.addEventListener('touchstart', navHandler);
    });
}

function openMenu() {
    const nav = document.getElementById('pipboy-nav');
    const toggle = document.getElementById('menu-toggle');
    
    nav.classList.add('open');
    toggle.style.display = 'none';
    menuOpen = true;
}

function closeMenu() {
    const nav = document.getElementById('pipboy-nav');
    const toggle = document.getElementById('menu-toggle');
    
    nav.classList.remove('open');
    toggle.style.display = 'flex';
    menuOpen = false;
}

function showSection(section) {
    document.querySelectorAll('.section-content').forEach(sec => {
        sec.classList.remove('active');
    });
    
    document.getElementById('default-content').style.display = 'none';
    
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

function setupGameHandlers() {
    // Запуск игры
    const gameBtn = document.getElementById('terminal-hack-btn');
    function gameHandler(e) {
        e.preventDefault();
        audioManager.beep();
        showGameScreen();
    }
    
    gameBtn.removeEventListener('click', gameHandler);
    gameBtn.removeEventListener('touchstart', gameHandler);
    gameBtn.addEventListener('click', gameHandler);
    gameBtn.addEventListener('touchstart', gameHandler);

    // Возврат
    const backBtn = document.getElementById('back-to-arcade');
    function backHandler(e) {
        e.preventDefault();
        audioManager.beep();
        resetGame();
        hideAllScreens();
        document.getElementById('main-screen').classList.add('active');
        showSection('gameboy');
    }
    
    backBtn.removeEventListener('click', backHandler);
    backBtn.removeEventListener('touchstart', backHandler);
    backBtn.addEventListener('click', backHandler);
    backBtn.addEventListener('touchstart', backHandler);

    // Режимы
    setupModeHandlers();
}

function setupModeHandlers() {
    const soloBtn = document.getElementById('solo-mode-btn');
    const mpBtn = document.getElementById('multiplayer-mode-btn');
    
    function soloHandler(e) {
        e.preventDefault();
        audioManager.beep();
        selectGameMode('solo');
    }
    
    function mpHandler(e) {
        e.preventDefault();
        audioManager.beep();
        selectGameMode('multiplayer');
    }
    
    soloBtn.removeEventListener('click', soloHandler);
    soloBtn.removeEventListener('touchstart', soloHandler);
    mpBtn.removeEventListener('click', mpHandler);
    mpBtn.removeEventListener('touchstart', mpHandler);
    
    soloBtn.addEventListener('click', soloHandler);
    soloBtn.addEventListener('touchstart', soloHandler);
    mpBtn.addEventListener('click', mpHandler);
    mpBtn.addEventListener('touchstart', mpHandler);
}

function setupMultiplayerHandlers() {
    // Валюта
    document.querySelectorAll('.crypto-option').forEach(btn => {
        function handler(e) {
            e.preventDefault();
            audioManager.beep();
            
            document.querySelectorAll('.crypto-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            selectedCurrency = btn.getAttribute('data-currency');
            document.getElementById('currency-display').textContent = selectedCurrency;
        }
        
        btn.removeEventListener('click', handler);
        btn.removeEventListener('touchstart', handler);
        btn.addEventListener('click', handler);
        btn.addEventListener('touchstart', handler);
    });

    // Кнопки мультиплеера
    const buttons = [
        { id: 'create-game', handler: createMultiplayerGame },
        { id: 'find-game', handler: showAvailableGames },
        { id: 'back-to-modes', handler: showModeSelector },
        { id: 'cancel-waiting', handler: cancelWaiting }
    ];
    
    buttons.forEach(({ id, handler }) => {
        const element = document.getElementById(id);
        if (element) {
            function eventHandler(e) {
                e.preventDefault();
                audioManager.beep();
                handler();
            }
            
            element.removeEventListener('click', eventHandler);
            element.removeEventListener('touchstart', eventHandler);
            element.addEventListener('click', eventHandler);
            element.addEventListener('touchstart', eventHandler);
        }
    });
}

function showGameScreen() {
    hideAllScreens();
    document.getElementById('game-screen').classList.add('active');
    showModeSelector();
    gameScore = 0;
    updateScoreDisplay();
}

function showModeSelector() {
    document.getElementById('mode-selector').style.display = 'block';
    document.getElementById('multiplayer-setup').style.display = 'none';
    document.getElementById('waiting-lobby').style.display = 'none';
    document.getElementById('gaming-area').style.display = 'none';
}

function selectGameMode(mode) {
    isMultiplayer = mode === 'multiplayer';
    
    if (mode === 'solo') {
        startGameSession();
    } else {
        showMultiplayerSetup();
    }
}

function showMultiplayerSetup() {
    document.getElementById('mode-selector').style.display = 'none';
    document.getElementById('multiplayer-setup').style.display = 'block';
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
    multiplayerManager.createGame(currentStake);
    
    showWaitingLobby();
    multiplayerManager.simulateOpponent();
}

function showAvailableGames() {
    alert('No games available.\nCreate your own game!');
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
    
    initializeGame();
}

function initializeGame() {
    gameActive = true;
    attemptsLeft = 4;
    timeLeft = 300;
    turnTimeLeft = 30;
    playerTurn = true;
    
    // Настройка интерфейса
    document.getElementById('mode-badge').textContent = isMultiplayer ? 'VERSUS' : 'SOLO';
    
    if (isMultiplayer) {
        document.getElementById('opponent-side').style.display = 'flex';
        document.getElementById('stake-info').style.display = 'block';
        document.getElementById('stake-info').textContent = `${currentStake.amount} ${currentStake.currency}`;
        document.getElementById('opponent-label').textContent = multiplayerManager.currentGame?.opponentName || 'OPPONENT';
    } else {
        document.getElementById('opponent-side').style.display = 'none';
        document.getElementById('stake-info').style.display = 'none';
    }
    
    // Сброс статусов
    updatePlayerStatus('READY');
    updateOpponentStatus('READY');
    updateAttempts(4, 'player');
    updateAttempts(4, 'opponent');
    updateTurnIndicator();
    
    // Генерируем игру
    generateGameField();
    generateHintBrackets();
    
    // Запускаем таймеры
    startMainTimer();
    startTurnTimer();
    
    // Очищаем лог
    clearLog();
    addLogEntry('RUNNER Terminal access initiated', 'system');
    addLogEntry(`Password database: ${gameWords.length} entries loaded`, 'system');
    addLogEntry(isMultiplayer ? 'Multiplayer duel started' : 'Solo practice mode', 'system');
    addLogEntry('Your turn - select password', 'success');
}

function generateGameField() {
    const wordLists = {
        6: ['RUNNER', 'ACCESS', 'SECURE', 'MATRIX', 'CIPHER', 'BINARY', 'SYNTAX', 'VECTOR', 'KERNEL', 'BUFFER'],
        7: ['COMMAND', 'NETWORK', 'PROGRAM', 'PROCESS', 'CONNECT', 'SESSION', 'EXECUTE', 'MACHINE', 'CONTROL', 'SCANNER'],
        8: ['PASSWORD', 'SECURITY', 'DATABASE', 'TERMINAL', 'PROTOCOL', 'FUNCTION', 'VARIABLE', 'COMPILER', 'OPERATOR', 'REGISTRY']
    };
    
    const wordLength = [6, 7, 8][Math.floor(Math.random() * 3)];
    const availableWords = [...wordLists[wordLength]];
    const numWords = 6;
    
    gameWords = [];
    for (let i = 0; i < numWords; i++) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        gameWords.push(availableWords.splice(randomIndex, 1)[0]);
    }
    
    correctPassword = gameWords[Math.floor(Math.random() * gameWords.length)];
    console.log("Correct password:", correctPassword);
    
    const passwordGrid = document.getElementById('password-grid');
    passwordGrid.innerHTML = gameWords.map(word => 
        `<div class="password-item" data-word="${word}">${word}</div>`
    ).join('');
    
    setupPasswordHandlers();
}

function generateHintBrackets() {
    const bracketContainer = document.getElementById('bracket-container');
    const brackets = ['( )', '[ ]', '{ }', '< >'];
    
    bracketContainer.innerHTML = brackets.map((bracket, index) => 
        `<div class="hint-bracket" data-bracket="${index}">${bracket}</div>`
    ).join('');
    
    setupBracketHandlers();
}

function setupPasswordHandlers() {
    document.querySelectorAll('.password-item').forEach(item => {
        function handler(e) {
            e.preventDefault();
            if (!gameActive || !playerTurn) return;
            
            audioManager.beep();
            const word = item.getAttribute('data-word');
            attemptPassword(word, item);
        }
        
        item.removeEventListener('click', handler);
        item.removeEventListener('touchstart', handler);
        item.addEventListener('click', handler);
        item.addEventListener('touchstart', handler);
    });
}

function setupBracketHandlers() {
    document.querySelectorAll('.hint-bracket').forEach(bracket => {
        function handler(e) {
            e.preventDefault();
            if (!gameActive || !playerTurn || bracket.classList.contains('used')) return;
            
            audioManager.beep();
            useBracketHint(bracket);
        }
        
        bracket.removeEventListener('click', handler);
        bracket.removeEventListener('touchstart', handler);
        bracket.addEventListener('click', handler);
        bracket.addEventListener('touchstart', handler);
    });
}

function attemptPassword(selectedWord, element) {
    if (!gameActive || !playerTurn) return;
    
    playerTurn = false;
    element.classList.add('selected');
    updatePlayerStatus('CHECKING...');
    updateTurnIndicator();
    
    // Отключаем все пароли
    document.querySelectorAll('.password-item').forEach(item => {
        item.classList.add('disabled');
    });
    
    addLogEntry(`You selected: ${selectedWord}`, 'normal');
    document.getElementById('last-attempt').textContent = `Attempting: ${selectedWord}`;
    
    setTimeout(() => {
        if (selectedWord === correctPassword) {
            element.classList.remove('selected');
            element.classList.add('correct');
            addLogEntry('SUCCESS: Password correct!', 'success');
            updatePlayerStatus('ACCESS GRANTED');
            document.getElementById('hint-text').textContent = 'Terminal access granted!';
            gameScore += 100;
            updateScoreDisplay();
            endGame(true);
        } else {
            element.classList.remove('selected');
            element.classList.add('incorrect');
            attemptsLeft--;
            updateAttempts(attemptsLeft, 'player');
            updatePlayerStatus('ACCESS DENIED');
            
            const matches = getMatchingPositions(selectedWord, correctPassword);
            addLogEntry(`Access denied - Likeness: ${matches}`, 'error');
            document.getElementById('hint-text').textContent = `${matches} characters match correct password`;
            
            if (attemptsLeft <= 0) {
                addLogEntry('All attempts failed - terminal locked', 'error');
                endGame(false);
            } else {
                // Включаем пароли обратно
                setTimeout(() => {
                    document.querySelectorAll('.password-item').forEach(item => {
                        if (!item.classList.contains('correct') && !item.classList.contains('incorrect')) {
                            item.classList.remove('disabled');
                        }
                    });
                    
                    if (isMultiplayer) {
                        playerTurn = false;
                        updateTurnIndicator();
                        updateOpponentStatus('THINKING...');
                        addLogEntry('Opponent\'s turn', 'system');
                        multiplayerManager.simulateOpponentTurn();
                    } else {
                        playerTurn = true;
                        updateTurnIndicator();
                        updatePlayerStatus('READY');
                        startTurnTimer();
                    }
                }, 2000);
            }
        }
    }, 1000);
}

function useBracketHint(bracket) {
    bracket.classList.add('used');
    
    if (Math.random() < 0.5 && attemptsLeft < 4) {
        attemptsLeft++;
        updateAttempts(attemptsLeft, 'player');
        addLogEntry('Hint found: Attempt restored', 'success');
        bracket.style.background = 'rgba(0, 255, 0, 0.3)';
        document.getElementById('hint-text').textContent = 'Dud removed! Attempt restored.';
    } else {
        addLogEntry('Hint found: No effect', 'error');
        bracket.style.background = 'rgba(255, 102, 0, 0.3)';
        document.getElementById('hint-text').textContent = 'No useful data found.';
    }
}

function updateTurnIndicator() {
    const turnText = document.querySelector('.turn-text');
    
    if (!isMultiplayer) {
        turnText.textContent = 'YOUR TURN';
        turnText.style.color = 'var(--pipboy-yellow)';
    } else {
        if (playerTurn) {
            turnText.textContent = 'YOUR TURN';
            turnText.style.color = 'var(--pipboy-yellow)';
        } else {
            turnText.textContent = 'OPPONENT\'S TURN';
            turnText.style.color = '#ff6600';
        }
    }
}

function startTurnTimer() {
    if (turnTimer) clearInterval(turnTimer);
    
    turnTimeLeft = 30;
    
    turnTimer = setInterval(() => {
        turnTimeLeft--;
        document.getElementById('turn-timer').textContent = `${turnTimeLeft}s`;
        
        if (turnTimeLeft <= 10) {
            document.getElementById('turn-timer').classList.add('warning');
        }
        
        if (turnTimeLeft <= 0) {
            if (playerTurn) {
                // Время истекло - случайный выбор
                const availableWords = document.querySelectorAll('.password-item:not(.disabled):not(.correct):not(.incorrect)');
                if (availableWords.length > 0) {
                    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
                    const word = randomWord.getAttribute('data-word');
                    attemptPassword(word, randomWord);
                }
            }
            clearInterval(turnTimer);
        }
    }, 1000);
}

function startMainTimer() {
    if (gameTimer) clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        timeLeft--;
        updateMainTimerDisplay();
        
        if (timeLeft <= 0) {
            addLogEntry('Session timeout - access denied', 'error');
            endGame(false);
        }
    }, 1000);
}

function updateMainTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('main-timer').textContent = display;
}

function updatePlayerStatus(status) {
    document.getElementById('player-status').textContent = status;
}

function updateOpponentStatus(status) {
    if (isMultiplayer) {
        document.getElementById('opponent-status').textContent = status;
    }
}

function updateAttempts(attempts, player) {
    let squares = '';
    for (let i = 0; i < 4; i++) {
        squares += i < attempts ? '[X]' : '[ ]';
    }
    
    const elementId = player === 'player' ? 'player-attempts' : 'opponent-attempts';
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = squares;
    }
}

function updateScoreDisplay() {
    document.getElementById('score-display').textContent = `SCORE: ${gameScore}`;
}

function endGame(won) {
    gameActive = false;
    playerTurn = false;
    
    if (gameTimer) clearInterval(gameTimer);
    if (turnTimer) clearInterval(turnTimer);
    
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
            gameScore += 200;
            
            alert(`[VICTORY!]\n\nYou won ${currentStake.amount} ${currentStake.currency}!\n+50 XP | Score: ${gameScore}\n\nNew balance: ${currentStake.currency === 'TON' ? userData.tonBalance.toFixed(3) : userData.tsarBalance} ${currentStake.currency}`);
        } else {
            if (currentStake.currency === 'TON') {
                userData.tonBalance = Math.max(0, userData.tonBalance - currentStake.amount);
            } else {
                userData.tsarBalance = Math.max(0, userData.tsarBalance - currentStake.amount);
            }
            userData.losses++;
            userData.xp += 10;
            
            alert(`[DEFEAT!]\n\nYou lost ${currentStake.amount} ${currentStake.currency}\n+10 XP | Score: ${gameScore}\n\nRemaining: ${currentStake.currency === 'TON' ? userData.tonBalance.toFixed(3) : userData.tsarBalance} ${currentStake.currency}`);
        }
    } else {
        if (won) {
            userData.xp += 25;
            gameScore += 100;
            alert(`[ACCESS GRANTED!]\n\n+25 XP | Score: ${gameScore}\nTerminal successfully hacked!`);
        } else {
            userData.xp += 5;
            alert(`[ACCESS DENIED]\n\n+5 XP | Score: ${gameScore}\nTry again!`);
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
    playerTurn = true;
    
    if (gameTimer) clearInterval(gameTimer);
    if (turnTimer) clearInterval(turnTimer);
    
    multiplayerManager.stopSimulation();
    multiplayerManager.currentGame = null;
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
    const logEntries = document.getElementById('log-entries');
    if (logEntries) {
        logEntries.innerHTML = '';
    }
}

function addLogEntry(message, type = 'normal') {
    const logEntries = document.getElementById('log-entries');
    if (!logEntries) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    
    logEntries.appendChild(entry);
    logEntries.scrollTop = logEntries.scrollHeight;
    
    if (logEntries.children.length > 12) {
        logEntries.removeChild(logEntries.children[0]);
    }
}

function enhanceUserExperience() {
    const supportsVibration = 'vibrate' in navigator;
    
    // Touch feedback
    document.querySelectorAll('button, .password-item, .hint-bracket').forEach(element => {
        element.addEventListener('touchstart', function() {
            if (supportsVibration) {
                navigator.vibrate(8);
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('game-screen').classList.contains('active')) {
            resetGame();
            hideAllScreens();
            document.getElementById('main-screen').classList.add('active');
            showSection('gameboy');
        }
    });
    
    // Предотвращаем случайный zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log("RUNNER DOM loaded");
    initApp();
});

// Дополнительная инициализация для надежности
window.addEventListener('load', function() {
    if (!userData) {
        setTimeout(initApp, 200);
    }
});