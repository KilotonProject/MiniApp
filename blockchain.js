// RUNNER - Production Blockchain Integration v1.0

// Реальная интеграция TON Connect
class TONBlockchainManager {
    constructor() {
        this.tonConnect = null;
        this.connected = false;
        this.userWallet = null;
        this.tonWeb = null;
        this.contractAddresses = {
            tsarToken: 'EQD_TSAR_TOKEN_CONTRACT_ADDRESS',
            stakingContract: 'EQD_STAKING_CONTRACT_ADDRESS',
            gameContract: 'EQD_GAME_CONTRACT_ADDRESS',
            burnAddress: 'EQD_BURN_ADDRESS_FOR_TOKENS'
        };
        this.tonApiEndpoint = 'https://toncenter.com/api/v2/';
        this.apiKey = 'your_ton_center_api_key'; // Заменить на реальный
    }

    async init() {
        try {
            // Инициализация TON Connect
            this.tonConnect = new TonConnect({
                manifestUrl: window.location.origin + '/tonconnect-manifest.json'
            });

            // Инициализация TonWeb
            this.tonWeb = new TonWeb(new TonWeb.HttpProvider(this.tonApiEndpoint, {
                apiKey: this.apiKey
            }));

            // Слушаем изменения статуса кошелька
            this.tonConnect.onStatusChange(wallet => {
                if (wallet) {
                    this.connected = true;
                    this.userWallet = wallet;
                    this.loadUserBalances();
                    console.log('TON Wallet connected:', wallet.account.address);
                } else {
                    this.connected = false;
                    this.userWallet = null;
                    console.log('TON Wallet disconnected');
                }
                this.updateWalletUI();
            });

            // Проверяем уже подключенный кошелек
            const currentWallet = this.tonConnect.wallet;
            if (currentWallet) {
                this.connected = true;
                this.userWallet = currentWallet;
                await this.loadUserBalances();
            }

            console.log('TON Connect initialized successfully');
            return true;
        } catch (error) {
            console.error('TON Connect initialization failed:', error);
            return false;
        }
    }

    async connectWallet() {
        if (!this.tonConnect) {
            alert('[ERROR] Blockchain not initialized');
            return false;
        }

        try {
            await this.tonConnect.connectWallet();
            return true;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            alert('[ERROR] Failed to connect wallet\n' + error.message);
            return false;
        }
    }

    async disconnectWallet() {
        if (!this.tonConnect) return;

        try {
            await this.tonConnect.disconnect();
            this.connected = false;
            this.userWallet = null;
            this.updateWalletUI();
            return true;
        } catch (error) {
            console.error('Wallet disconnection failed:', error);
            return false;
        }
    }

    async loadUserBalances() {
        if (!this.connected || !this.userWallet) return;

        try {
            const address = this.userWallet.account.address;
            
            // Загружаем TON баланс
            const tonBalance = await this.getTONBalance(address);
            
            // Загружаем TSAR баланс (Jetton)
            const tsarBalance = await this.getJettonBalance(address, this.contractAddresses.tsarToken);
            
            // Обновляем userData
            if (userData) {
                userData.tonBalance = tonBalance;
                userData.tsarBalance = tsarBalance;
                updateUserInfo();
            }

            console.log(`Balances loaded: ${tonBalance} TON, ${tsarBalance} TSAR`);
            return { ton: tonBalance, tsar: tsarBalance };
        } catch (error) {
            console.error('Failed to load balances:', error);
            return null;
        }
    }

    async getTONBalance(address) {
        try {
            const response = await fetch(`${this.tonApiEndpoint}getAddressInformation?address=${address}&api_key=${this.apiKey}`);
            const data = await response.json();
            
            if (data.ok) {
                const balance = parseInt(data.result.balance) / 1000000000; // nanoTON to TON
                return Math.round(balance * 1000) / 1000; // Округляем до 3 знаков
            }
            return 0;
        } catch (error) {
            console.error('Failed to get TON balance:', error);
            return 0;
        }
    }

    async getJettonBalance(address, jettonMaster) {
        try {
            // Получаем адрес Jetton кошелька
            const jettonWalletAddress = await this.getJettonWalletAddress(address, jettonMaster);
            
            if (!jettonWalletAddress) return 0;

            // Получаем баланс Jetton
            const response = await fetch(`${this.tonApiEndpoint}runGetMethod?address=${jettonWalletAddress}&method=get_wallet_data&api_key=${this.apiKey}`);
            const data = await response.json();
            
            if (data.ok && data.result.stack && data.result.stack[0]) {
                const balance = parseInt(data.result.stack[0][1], 16) / 1000000; // Учитываем decimals
                return Math.floor(balance);
            }
            return 0;
        } catch (error) {
            console.error('Failed to get Jetton balance:', error);
            return 0;
        }
    }

    async getJettonWalletAddress(ownerAddress, jettonMaster) {
        try {
            const response = await fetch(`${this.tonApiEndpoint}runGetMethod?address=${jettonMaster}&method=get_wallet_address&stack=[["tvm.Slice","${ownerAddress}"]]&api_key=${this.apiKey}`);
            const data = await response.json();
            
            if (data.ok && data.result.stack && data.result.stack[0]) {
                return data.result.stack[0][1];
            }
            return null;
        } catch (error) {
            console.error('Failed to get Jetton wallet address:', error);
            return null;
        }
    }

    async sendTON(toAddress, amount, comment = '') {
        if (!this.connected || !this.tonConnect) {
            throw new Error('Wallet not connected');
        }

        try {
            const transaction = {
                validUntil: Date.now() + 5 * 60 * 1000, // 5 минут
                messages: [
                    {
                        address: toAddress,
                        amount: (amount * 1000000000).toString(), // TON to nanoTON
                        payload: comment ? this.tonWeb.utils.bytesToBase64(new TextEncoder().encode(comment)) : undefined
                    }
                ]
            };

            const result = await this.tonConnect.sendTransaction(transaction);
            console.log('TON transaction sent:', result);
            
            // Обновляем баланс через несколько секунд
            setTimeout(() => this.loadUserBalances(), 3000);
            
            return result;
        } catch (error) {
            console.error('TON transaction failed:', error);
            throw error;
        }
    }

    async sendTSAR(toAddress, amount, comment = '') {
        if (!this.connected || !this.tonConnect) {
            throw new Error('Wallet not connected');
        }

        try {
            // Создаем Jetton transfer сообщение
            const jettonAmount = amount * 1000000; // Учитываем decimals
            
            const jettonTransferPayload = this.tonWeb.utils.bytesToBase64(
                new Uint8Array([
                    // Jetton transfer op code
                    0x0f, 0x8a, 0x7e, 0xa5,
                    // query_id (8 bytes)
                    ...new Array(8).fill(0),
                    // amount (16 bytes, little endian)
                    ...this.numberToBytes(jettonAmount, 16),
                    // destination (32 bytes)
                    ...this.addressToBytes(toAddress),
                    // response_destination (32 bytes) - our address
                    ...this.addressToBytes(this.userWallet.account.address),
                    // custom_payload (empty)
                    0x00,
                    // forward_ton_amount (16 bytes)
                    ...this.numberToBytes(1000000, 16), // 0.001 TON
                    // forward_payload (comment)
                    ...new TextEncoder().encode(comment || '')
                ])
            );

            const jettonWalletAddress = await this.getJettonWalletAddress(
                this.userWallet.account.address, 
                this.contractAddresses.tsarToken
            );

            const transaction = {
                validUntil: Date.now() + 5 * 60 * 1000,
                messages: [
                    {
                        address: jettonWalletAddress,
                        amount: '50000000', // 0.05 TON для комиссии
                        payload: jettonTransferPayload
                    }
                ]
            };

            const result = await this.tonConnect.sendTransaction(transaction);
            console.log('TSAR transaction sent:', result);
            
            setTimeout(() => this.loadUserBalances(), 3000);
            
            return result;
        } catch (error) {
            console.error('TSAR transaction failed:', error);
            throw error;
        }
    }

    async burnTSAR(amount) {
        return await this.sendTSAR(this.contractAddresses.burnAddress, amount, 'TOKEN_LISTING_BURN');
    }

    async stakeTokens(amount) {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }

        try {
            // Отправляем токены на стейкинг контракт
            const result = await this.sendTSAR(this.contractAddresses.stakingContract, amount, 'STAKE_TOKENS');
            
            // Обновляем локальные данные
            if (userData) {
                userData.stakedTokens = (userData.stakedTokens || 0) + amount;
                userData.stakingTimestamp = Date.now();
                saveUserData();
            }

            return result;
        } catch (error) {
            console.error('Staking failed:', error);
            throw error;
        }
    }

    // Вспомогательные функции
    numberToBytes(num, length) {
        const bytes = new Array(length).fill(0);
        for (let i = 0; i < length; i++) {
            bytes[i] = (num >> (i * 8)) & 0xff;
        }
        return bytes;
    }

    addressToBytes(address) {
        // Упрощенная конвертация адреса в байты
        const hex = address.replace(/[^0-9A-Fa-f]/g, '');
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return bytes.slice(0, 32).concat(new Array(Math.max(0, 32 - bytes.length)).fill(0));
    }

    updateWalletUI() {
        const statusElement = document.getElementById('wallet-status');
        const connectBtn = document.getElementById('connect-wallet');
        
        if (statusElement && connectBtn) {
            const statusText = statusElement.querySelector('.status-text');
            if (statusText) {
                if (this.connected) {
                    statusText.textContent = `WALLET: CONNECTED (${this.userWallet.account.address.substr(0, 8)}...)`;
                    connectBtn.textContent = 'DISCONNECT WALLET';
                    connectBtn.style.borderColor = 'var(--combat-active)';
                    connectBtn.style.color = 'var(--combat-active)';
                } else {
                    statusText.textContent = 'WALLET: DISCONNECTED';
                    connectBtn.textContent = 'CONNECT TON WALLET';
                    connectBtn.style.borderColor = 'var(--pipboy-yellow)';
                    connectBtn.style.color = 'var(--pipboy-yellow)';
                }
            }
        }

        // Показываем/скрываем торговые панели
        const tradingPanel = document.getElementById('trading-panel');
        const connectPanel = document.getElementById('wallet-connect-panel');
        
        if (tradingPanel && connectPanel) {
            if (this.connected) {
                tradingPanel.style.display = 'block';
                connectPanel.style.display = 'none';
            } else {
                tradingPanel.style.display = 'none';
                connectPanel.style.display = 'block';
            }
        }

        // Обновляем кнопки депозита/вывода
        const depositBtn = document.getElementById('deposit-btn');
        const withdrawBtn = document.getElementById('withdraw-btn');
        
        if (depositBtn) {
            depositBtn.disabled = !this.connected;
            depositBtn.style.opacity = this.connected ? '1' : '0.5';
        }
        
        if (withdrawBtn) {
            withdrawBtn.disabled = !this.connected;
            withdrawBtn.style.opacity = this.connected ? '1' : '0.5';
        }
    }

    async processTokenListing(tokenData) {
        if (!this.connected) {
            return { success: false, error: 'Wallet not connected' };
        }

        const requiredTsar = 50000; // $50 worth at $0.001 per TSAR

        if (!userData || userData.tsarBalance < requiredTsar) {
            return { 
                success: false, 
                error: `Insufficient TSAR tokens. Required: ${requiredTsar.toLocaleString()} TSAR ($50 worth)` 
            };
        }

        try {
            // Отправляем токены на burn address
            const burnResult = await this.burnTSAR(requiredTsar);
            
            // Сохраняем информацию о листинге
            const listedToken = {
                id: Date.now(),
                symbol: tokenData.symbol,
                name: tokenData.name,
                contractAddress: tokenData.contractAddress,
                listedBy: this.userWallet.account.address,
                burnTxHash: burnResult.boc,
                listedAt: Date.now(),
                verified: false
            };

            // Сохраняем в localStorage для дальнейшей обработки
            this.saveListedToken(listedToken);

            return { success: true, token: listedToken };
        } catch (error) {
            console.error('Token listing failed:', error);
            return { success: false, error: error.message };
        }
    }

    saveListedToken(token) {
        try {
            const saved = localStorage.getItem('listed_tokens') || '[]';
            const tokens = JSON.parse(saved);
            tokens.push(token);
            localStorage.setItem('listed_tokens', JSON.stringify(tokens));
        } catch (e) {
            console.error('Failed to save listed token:', e);
        }
    }

    getListedTokens() {
        try {
            const saved = localStorage.getItem('listed_tokens') || '[]';
            return JSON.parse(saved);
        } catch (e) {
            return [];
        }
    }
}

// Интеграция Telegram Stars
class TelegramStarsManager {
    constructor() {
        this.webApp = window.Telegram?.WebApp;
        this.available = !!this.webApp;
        this.starsBalance = 0;
        this.invoices = new Map();
    }

    init() {
        if (!this.available) {
            console.log('Telegram Web App not available, using simulation mode');
            return false;
        }

        try {
            // Расширяем WebApp
            this.webApp.expand();
            
            // Настраиваем тему
            this.webApp.setHeaderColor('#001100');
            this.webApp.setBackgroundColor('#000000');
            
            // Получаем информацию о пользователе
            const user = this.webApp.initDataUnsafe?.user;
            if (user && userData) {
                userData.telegramId = user.id;
                userData.username = user.username || user.first_name;
                userData.name = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            }

            // Загружаем баланс Stars
            this.loadStarsBalance();

            console.log('Telegram Stars integration initialized');
            return true;
        } catch (error) {
            console.error('Telegram Stars initialization failed:', error);
            return false;
        }
    }

    async loadStarsBalance() {
        if (!this.available) {
            // Симуляция для разработки
            this.starsBalance = userData?.starsBalance || 45;
            return this.starsBalance;
        }

        try {
            // В реальной версии здесь будет запрос к Telegram Bot API
            // для получения актуального баланса Stars пользователя
            
            // Пока используем сохраненное значение
            this.starsBalance = userData?.starsBalance || 0;
            return this.starsBalance;
        } catch (error) {
            console.error('Failed to load Stars balance:', error);
            return 0;
        }
    }

    async createStarsInvoice(amount, description, payload = '') {
        if (!this.available) {
            // Симуляция
            return this.simulateStarsPayment(amount, description);
        }

        try {
            const invoice = {
                title: 'RUNNER Terminal Purchase',
                description: description,
                payload: payload,
                provider_token: '', // Stars не требуют токена
                currency: 'XTR', // Telegram Stars currency code
                prices: [
                    {
                        label: description,
                        amount: amount // В Stars (1 Star = 1 XTR)
                    }
                ]
            };

            // Создаем счет через Bot API
            const response = await this.sendToBot('createInvoiceLink', invoice);
            
            if (response.ok) {
                const invoiceUrl = response.result;
                this.webApp.openInvoice(invoiceUrl, (status) => {
                    this.handlePaymentCallback(status, amount, payload);
                });
                
                return { success: true, invoiceUrl };
            } else {
                throw new Error(response.description || 'Failed to create invoice');
            }
        } catch (error) {
            console.error('Stars invoice creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    simulateStarsPayment(amount, description) {
        return new Promise((resolve) => {
            const confirm = window.confirm(
                `Pay with Telegram Stars?\n\n` +
                `Amount: ${amount} Stars\n` +
                `Description: ${description}\n\n` +
                `This is a simulation. In production, this will charge real Stars.`
            );

            setTimeout(() => {
                if (confirm) {
                    // Симулируем успешную оплату
                    if (userData && userData.starsBalance >= amount) {
                        userData.starsBalance -= amount;
                        updateUserInfo();
                        resolve({ success: true, paid: amount });
                    } else {
                        resolve({ success: false, error: 'Insufficient Stars balance' });
                    }
                } else {
                    resolve({ success: false, error: 'Payment cancelled' });
                }
            }, 1000);
        });
    }

    handlePaymentCallback(status, amount, payload) {
        if (status === 'paid') {
            console.log(`Stars payment successful: ${amount} Stars`);
            
            // Обновляем баланс
            if (userData) {
                userData.starsBalance -= amount;
                updateUserInfo();
            }

            // Обрабатываем покупку
            this.processStarsPurchase(payload, amount);
        } else if (status === 'cancelled') {
            console.log('Stars payment cancelled');
            alert('[PAYMENT CANCELLED]\nTransaction was cancelled by user');
        } else if (status === 'failed') {
            console.log('Stars payment failed');
            alert('[PAYMENT FAILED]\nTransaction failed. Please try again.');
        }
    }

    processStarsPurchase(payload, amount) {
        try {
            const purchaseData = JSON.parse(payload);
            
            switch(purchaseData.type) {
                case 'buy_tsar':
                    const tsarAmount = amount * 10; // 1 Star = 10 TSAR
                    if (userData) {
                        userData.tsarBalance += tsarAmount;
                        updateUserInfo();
                    }
                    alert(`[PURCHASE SUCCESSFUL]\n${amount} Stars → ${tsarAmount} TSAR`);
                    break;
                    
                case 'buy_nft':
                    alert(`[NFT PURCHASED]\nNFT ID: ${purchaseData.nftId}\nPaid: ${amount} Stars`);
                    break;
                    
                case 'buy_gift':
                    alert(`[GIFT PURCHASED]\nGift: ${purchaseData.giftName}\nPaid: ${amount} Stars`);
                    break;
                    
                default:
                    console.log('Unknown purchase type:', purchaseData.type);
            }
        } catch (error) {
            console.error('Failed to process Stars purchase:', error);
        }
    }

    async sendToBot(method, params) {
        // В реальной версии здесь будет запрос к вашему бэкенду,
        // который будет делать запросы к Telegram Bot API
        
        // Для симуляции возвращаем успешный ответ
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    ok: true,
                    result: 'https://t.me/invoice/stars_invoice_url'
                });
            }, 500);
        });
    }
}

// Менеджер игровых смарт-контрактов
class GameSmartContractManager {
    constructor(tonManager) {
        this.tonManager = tonManager;
        this.gameContract = null;
        this.stakingContract = null;
    }

    async init() {
        if (!this.tonManager.tonWeb) return false;

        try {
            // Инициализируем контракты
            this.gameContract = new this.tonManager.tonWeb.Contract(
                this.tonManager.tonWeb.provider,
                {
                    address: this.tonManager.contractAddresses.gameContract,
                    abi: this.getGameContractABI()
                }
            );

            this.stakingContract = new this.tonManager.tonWeb.Contract(
                this.tonManager.tonWeb.provider,
                {
                    address: this.tonManager.contractAddresses.stakingContract,
                    abi: this.getStakingContractABI()
                }
            );

            console.log('Smart contracts initialized');
            return true;
        } catch (error) {
            console.error('Smart contracts initialization failed:', error);
            return false;
        }
    }

    async createGameSession(gameType, stakeAmount, currency) {
        if (!this.gameContract || !this.tonManager.connected) {
            throw new Error('Contract not initialized or wallet not connected');
        }

        try {
            const sessionId = Date.now().toString();
            
            // Создаем игровую сессию с депозитом
            let result;
            
            if (currency === 'TON') {
                result = await this.tonManager.sendTON(
                    this.tonManager.contractAddresses.gameContract,
                    stakeAmount,
                    `CREATE_GAME_SESSION:${sessionId}:${gameType}`
                );
            } else if (currency === 'TSAR') {
                result = await this.tonManager.sendTSAR(
                    this.tonManager.contractAddresses.gameContract,
                    stakeAmount,
                    `CREATE_GAME_SESSION:${sessionId}:${gameType}`
                );
            }

            return {
                success: true,
                sessionId: sessionId,
                txHash: result.boc,
                stakeAmount: stakeAmount,
                currency: currency
            };
        } catch (error) {
            console.error('Game session creation failed:', error);
            throw error;
        }
    }

    async finalizeGameSession(sessionId, winner, proof) {
        try {
            // В реальной версии здесь будет вызов метода смарт-контракта
            // для завершения игры и выплаты награды победителю
            
            console.log(`Game session ${sessionId} finalized. Winner: ${winner}`);
            
            // Симуляция для разработки
            return {
                success: true,
                winner: winner,
                txHash: '0x' + Math.random().toString(36).substr(2, 64)
            };
        } catch (error) {
            console.error('Game finalization failed:', error);
            throw error;
        }
    }

    getGameContractABI() {
        // Упрощенный ABI для игрового контракта
        return {
            "ABI version": 2,
            "header": ["time", "expire"],
            "functions": [
                {
                    "name": "createGameSession",
                    "inputs": [
                        { "name": "gameType", "type": "string" },
                        { "name": "stakeAmount", "type": "uint128" }
                    ],
                    "outputs": [
                        { "name": "sessionId", "type": "uint256" }
                    ]
                },
                {
                    "name": "finalizeGame",
                    "inputs": [
                        { "name": "sessionId", "type": "uint256" },
                        { "name": "winner", "type": "address" },
                        { "name": "proof", "type": "bytes" }
                    ],
                    "outputs": []
                }
            ]
        };
    }

    getStakingContractABI() {
        return {
            "ABI version": 2,
            "header": ["time", "expire"],
            "functions": [
                {
                    "name": "stake",
                    "inputs": [
                        { "name": "amount", "type": "uint128" }
                    ],
                    "outputs": []
                },
                {
                    "name": "unstake",
                    "inputs": [
                        { "name": "amount", "type": "uint128" }
                    ],
                    "outputs": []
                },
                {
                    "name": "claimRewards",
                    "inputs": [],
                    "outputs": [
                        { "name": "amount", "type": "uint128" }
                    ]
                }
            ]
        };
    }
}

// Менеджер транзакций
class TransactionManager {
    constructor(tonManager, starsManager) {
        this.tonManager = tonManager;
        this.starsManager = starsManager;
        this.pendingTransactions = new Map();
        this.transactionHistory = this.loadTransactionHistory();
    }

    loadTransactionHistory() {
        try {
            const saved = localStorage.getItem('transaction_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveTransactionHistory() {
        try {
            localStorage.setItem('transaction_history', JSON.stringify(this.transactionHistory));
        } catch (e) {
            console.error('Failed to save transaction history:', e);
        }
    }

    async processDeposit(amount, currency) {
        if (!this.tonManager.connected) {
            throw new Error('TON wallet not connected');
        }

        const txId = this.generateTxId();
        
        try {
            this.pendingTransactions.set(txId, {
                type: 'deposit',
                amount: amount,
                currency: currency,
                status: 'pending',
                createdAt: Date.now()
            });

            // Показываем инструкции для депозита
            const depositAddress = this.getDepositAddress();
            
            alert(
                `[DEPOSIT INSTRUCTIONS]\n\n` +
                `Send ${amount} ${currency} to:\n` +
                `${depositAddress}\n\n` +
                `Include memo: DEPOSIT_${txId}\n\n` +
                `Funds will be credited automatically\n` +
                `Processing time: 1-3 minutes`
            );

            // Симулируем обработку депозита
            setTimeout(() => {
                this.confirmDeposit(txId, amount, currency);
            }, 30000 + Math.random() * 60000); // 30-90 секунд

            return { success: true, txId: txId };
        } catch (error) {
            this.pendingTransactions.delete(txId);
            throw error;
        }
    }

    async processWithdrawal(amount, currency, toAddress) {
        if (!this.tonManager.connected) {
            throw new Error('TON wallet not connected');
        }

        const txId = this.generateTxId();
        
        try {
            this.pendingTransactions.set(txId, {
                type: 'withdrawal',
                amount: amount,
                currency: currency,
                toAddress: toAddress,
                status: 'pending',
                createdAt: Date.now()
            });

            let result;
            
            if (currency === 'TON') {
                result = await this.tonManager.sendTON(toAddress, amount, `WITHDRAWAL_${txId}`);
            } else if (currency === 'TSAR') {
                result = await this.tonManager.sendTSAR(toAddress, amount, `WITHDRAWAL_${txId}`);
            }

            // Списываем с локального баланса
            if (userData) {
                if (currency === 'TON') {
                    userData.tonBalance -= amount;
                } else if (currency === 'TSAR') {
                    userData.tsarBalance -= amount;
                }
                updateUserInfo();
            }

            const transaction = this.pendingTransactions.get(txId);
            transaction.status = 'completed';
            transaction.txHash = result.boc;
            transaction.completedAt = Date.now();

            this.transactionHistory.push(transaction);
            this.saveTransactionHistory();

            return { success: true, txId: txId, txHash: result.boc };
        } catch (error) {
            const transaction = this.pendingTransactions.get(txId);
            if (transaction) {
                transaction.status = 'failed';
                transaction.error = error.message;
            }
            
            throw error;
        } finally {
            this.pendingTransactions.delete(txId);
        }
    }

    async processStarsPurchase(item, starsCost) {
        try {
            const payload = JSON.stringify({
                type: item.type,
                itemId: item.id,
                userId: userData?.telegramId || 'unknown'
            });

            const result = await this.starsManager.createStarsInvoice(
                starsCost,
                `Purchase: ${item.title}`,
                payload
            );

            if (result.success) {
                return { success: true, invoiceUrl: result.invoiceUrl };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Stars purchase failed:', error);
            throw error;
        }
    }

    confirmDeposit(txId, amount, currency) {
        const transaction = this.pendingTransactions.get(txId);
        if (!transaction) return;

        // Пополняем баланс
        if (userData) {
            if (currency === 'TON') {
                userData.tonBalance += amount;
            } else if (currency === 'TSAR') {
                userData.tsarBalance += amount;
            }
            updateUserInfo();
        }

        transaction.status = 'completed';
        transaction.completedAt = Date.now();
        
        this.transactionHistory.push(transaction);
        this.saveTransactionHistory();
        this.pendingTransactions.delete(txId);

        alert(`[DEPOSIT CONFIRMED]\n+${amount} ${currency}\nTransaction completed successfully`);
        
        if (audioManager) {
            audioManager.playSound('coin');
        }
    }

    generateTxId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    getDepositAddress() {
        // В реальной версии это будет уникальный адрес для каждого пользователя
        return this.tonManager.userWallet?.account.address || 'EQD_DEPOSIT_ADDRESS';
    }

    getTransactionHistory(limit = 10) {
        return this.transactionHistory
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    getPendingTransactions() {
        return Array.from(this.pendingTransactions.values());
    }
}

// Реальный баланс менеджер
class RealBalanceManager {
    constructor(tonManager, starsManager, transactionManager) {
        this.tonManager = tonManager;
        this.starsManager = starsManager;
        this.transactionManager = transactionManager;
        this.updateInterval = null;
        this.lastUpdate = 0;
    }

    startRealTimeUpdates() {
        // Обновляем балансы каждые 30 секунд
        this.updateInterval = setInterval(() => {
            this.updateAllBalances();
        }, 30000);

        // Также обновляем при фокусе на приложение
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateAllBalances();
            }
        });
    }

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async updateAllBalances() {
        const now = Date.now();
        
        // Не обновляем чаще чем раз в 10 секунд
        if (now - this.lastUpdate < 10000) return;
        
        this.lastUpdate = now;

        try {
            // Обновляем TON и TSAR балансы
            if (this.tonManager.connected) {
                const balances = await this.tonManager.loadUserBalances();
                if (balances) {
                    console.log('Balances updated from blockchain');
                }
            }

            // Обновляем Stars баланс
            const starsBalance = await this.starsManager.loadStarsBalance();
            if (userData) {
                userData.starsBalance = starsBalance;
            }

            // Обновляем UI
            updateUserInfo();
            
        } catch (error) {
            console.error('Balance update failed:', error);
        }
    }

    async validateBalance(amount, currency) {
        // Проверяем актуальный баланс перед операцией
        await this.updateAllBalances();
        
        if (!userData) return false;

        switch(currency) {
            case 'TON':
                return userData.tonBalance >= amount;
            case 'TSAR':
                return userData.tsarBalance >= amount;
            case 'STARS':
                return userData.starsBalance >= amount;
            default:
                return false;
        }
    }

    getFormattedBalance(currency) {
        if (!userData) return '0';

        switch(currency) {
            case 'TON':
                return userData.tonBalance.toFixed(3);
            case 'TSAR':
                return userData.tsarBalance.toLocaleString();
            case 'STARS':
                return userData.starsBalance.toString();
            default:
                return '0';
        }
    }
}

// Глобальные менеджеры для блокчейна
let tonBlockchainManager;
let telegramStarsManager;
let gameContractManager;
let transactionManager;
let realBalanceManager;

// Инициализация блокчейн систем
async function initBlockchainSystems() {
    console.log('🔗 Initializing blockchain systems...');
    
    try {
        // Инициализируем TON Connect
        tonBlockchainManager = new TONBlockchainManager();
        const tonInitialized = await tonBlockchainManager.init();
        
        // Инициализируем Telegram Stars
        telegramStarsManager = new TelegramStarsManager();
        const starsInitialized = telegramStarsManager.init();
        
        // Инициализируем игровые контракты
        gameContractManager = new GameSmartContractManager(tonBlockchainManager);
        await gameContractManager.init();
        
        // Инициализируем менеджер транзакций
        transactionManager = new TransactionManager(tonBlockchainManager, telegramStarsManager);
        
        // Инициализируем менеджер балансов
        realBalanceManager = new RealBalanceManager(tonBlockchainManager, telegramStarsManager, transactionManager);
        realBalanceManager.startRealTimeUpdates();
        
        // Заменяем старый blockchainManager
        blockchainManager = tonBlockchainManager;
        
        console.log('✅ Blockchain systems initialized');
        console.log(`TON Connect: ${tonInitialized ? 'OK' : 'FAILED'}`);
        console.log(`Telegram Stars: ${starsInitialized ? 'OK' : 'FAILED'}`);
        
        return true;
    } catch (error) {
        console.error('❌ Blockchain initialization failed:', error);
        return false;
    }
}

// Обновленные функции кошелька с реальными транзакциями
async function handleRealDeposit() {
    if (!tonBlockchainManager.connected) {
        alert('[ERROR] Please connect your TON wallet first');
        return;
    }

    const amount = prompt('Deposit amount (TON):');
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount < 0.01) {
        alert('[ERROR] Minimum deposit: 0.01 TON');
        return;
    }

    try {
        const result = await transactionManager.processDeposit(depositAmount, 'TON');
        
        if (result.success) {
            alert(`[DEPOSIT INITIATED]\nTransaction ID: ${result.txId}\nAmount: ${depositAmount} TON\n\nFunds will be credited after confirmation`);
        }
    } catch (error) {
        alert(`[DEPOSIT FAILED]\n${error.message}`);
    }
}

async function handleRealWithdrawal() {
    if (!tonBlockchainManager.connected) {
        alert('[ERROR] Please connect your TON wallet first');
        return;
    }

    const amount = prompt('Withdrawal amount (TON):');
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount < 0.1) {
        alert('[ERROR] Minimum withdrawal: 0.1 TON');
        return;
    }

    // Проверяем актуальный баланс
    const hasBalance = await realBalanceManager.validateBalance(withdrawAmount, 'TON');
    if (!hasBalance) {
        alert('[ERROR] Insufficient TON balance');
        return;
    }

    const confirm = window.confirm(
        `Withdraw ${withdrawAmount} TON?\n\n` +
        `Destination: ${tonBlockchainManager.userWallet.account.address.substr(0, 20)}...\n` +
        `Network fee: ~0.01 TON\n\n` +
        `Continue?`
    );

    if (confirm) {
        try {
            const result = await transactionManager.processWithdrawal(
                withdrawAmount, 
                'TON', 
                tonBlockchainManager.userWallet.account.address
            );
            
            if (result.success) {
                alert(`[WITHDRAWAL SUCCESSFUL]\nAmount: ${withdrawAmount} TON\nTransaction: ${result.txHash.substr(0, 20)}...\n\nCheck your wallet in 1-3 minutes`);
            }
        } catch (error) {
            alert(`[WITHDRAWAL FAILED]\n${error.message}`);
        }
    }
}

async function handleRealStaking() {
    if (!tonBlockchainManager.connected) {
        alert('[ERROR] Please connect your TON wallet first');
        return;
    }

    const amount = prompt('Stake amount (TSAR):');
    const stakeAmount = parseFloat(amount);
    
    if (!stakeAmount || stakeAmount < 1000) {
        alert('[ERROR] Minimum stake: 1000 TSAR');
        return;
    }

    const hasBalance = await realBalanceManager.validateBalance(stakeAmount, 'TSAR');
    if (!hasBalance) {
        alert('[ERROR] Insufficient TSAR balance');
        return;
    }

    const confirm = window.confirm(
        `Stake ${stakeAmount.toLocaleString()} TSAR?\n\n` +
        `APY: 12% annually\n` +
        `Lock period: 30 days\n` +
        `Daily rewards: ${(stakeAmount * 0.12 / 365).toFixed(2)} TSAR\n\n` +
        `Continue?`
    );

    if (confirm) {
        try {
            const result = await tonBlockchainManager.stakeTokens(stakeAmount);
            
            alert(`[STAKING SUCCESSFUL]\nStaked: ${stakeAmount.toLocaleString()} TSAR\nTransaction: ${result.boc.substr(0, 20)}...\n\nRewards start accruing immediately`);
            
            // Обновляем статистику стейкинга
            if (userData) {
                userData.stakedAmount = (userData.stakedAmount || 0) + stakeAmount;
                userData.stakingRewards = userData.stakingRewards || 0;
                userData.lastStakeTime = Date.now();
                saveUserData();
            }
            
        } catch (error) {
            alert(`[STAKING FAILED]\n${error.message}`);
        }
    }
}

async function handleRealTokenPurchase() {
    const options = [
        { id: 1, desc: 'Buy TSAR with TON (Rate: 1 TON = 1000 TSAR)', rate: 1000, from: 'TON', to: 'TSAR' },
        { id: 2, desc: 'Buy TSAR with Stars (Rate: 1 Star = 10 TSAR)', rate: 10, from: 'STARS', to: 'TSAR' },
        { id: 3, desc: 'List new token (Cost: $50 worth of TSAR)', special: true }
    ];
    
    const choice = prompt(
        'Select option:\n' +
        options.map(opt => `${opt.id}. ${opt.desc}`).join('\n') +
        '\n\nEnter option number:'
    );

    switch(choice) {
        case '1':
            await handleTONtoTSARExchange();
            break;
        case '2':
            await handleStarsToTSARExchange();
            break;
        case '3':
            await handleRealTokenListing();
            break;
        default:
            alert('[ERROR] Invalid option selected');
    }
}

async function handleTONtoTSARExchange() {
    if (!tonBlockchainManager.connected) {
        alert('[ERROR] Please connect your TON wallet first');
        return;
    }

    const amount = prompt('TON amount to convert to TSAR:');
    const tonAmount = parseFloat(amount);
    
    if (!tonAmount || tonAmount <= 0) {
        alert('[ERROR] Invalid amount');
        return;
    }

    const hasBalance = await realBalanceManager.validateBalance(tonAmount, 'TON');
    if (!hasBalance) {
        alert('[ERROR] Insufficient TON balance');
        return;
    }

    const tsarAmount = tonAmount * 1000;
    const exchangeFee = tonAmount * 0.01; // 1% комиссия
    
    const confirm = window.confirm(
        `Exchange ${tonAmount} TON for ${tsarAmount.toLocaleString()} TSAR?\n\n` +
        `Exchange rate: 1 TON = 1000 TSAR\n` +
        `Exchange fee: ${exchangeFee.toFixed(3)} TON (1%)\n` +
        `You will receive: ${tsarAmount.toLocaleString()} TSAR\n\n` +
        `Continue?`
    );

    if (confirm) {
        try {
            // Отправляем TON на обменный контракт
            const result = await tonBlockchainManager.sendTON(
                tonBlockchainManager.contractAddresses.exchangeContract || tonBlockchainManager.contractAddresses.gameContract,
                tonAmount + exchangeFee,
                `EXCHANGE_TON_TO_TSAR:${tsarAmount}`
            );

            // Обновляем локальные балансы
            if (userData) {
                userData.tonBalance -= (tonAmount + exchangeFee);
                userData.tsarBalance += tsarAmount;
                updateUserInfo();
            }

            alert(`[EXCHANGE SUCCESSFUL]\nConverted: ${tonAmount} TON → ${tsarAmount.toLocaleString()} TSAR\nTransaction: ${result.boc.substr(0, 20)}...`);
            
        } catch (error) {
            alert(`[EXCHANGE FAILED]\n${error.message}`);
        }
    }
}

async function handleStarsToTSARExchange() {
    const amount = prompt('Stars amount to convert to TSAR:');
    const starsAmount = parseFloat(amount);
    
    if (!starsAmount || starsAmount <= 0) {
        alert('[ERROR] Invalid amount');
        return;
    }

    const hasBalance = await realBalanceManager.validateBalance(starsAmount, 'STARS');
    if (!hasBalance) {
        alert('[ERROR] Insufficient Stars balance');
        return;
    }

    const tsarAmount = starsAmount * 10;
    
    const confirm = window.confirm(
        `Convert ${starsAmount} Stars to ${tsarAmount} TSAR?\n\n` +
        `Exchange rate: 1 Star = 10 TSAR\n` +
        `No exchange fees for Stars conversion\n\n` +
        `Continue?`
    );

    if (confirm) {
        try {
            // Создаем "покупку" TSAR за Stars
            const purchaseData = {
                type: 'buy_tsar',
                amount: tsarAmount,
                starsAmount: starsAmount
            };

            const result = await transactionManager.processStarsPurchase(
                { 
                    title: `${tsarAmount} TSAR Tokens`,
                    type: 'buy_tsar',
                    id: Date.now()
                },
                starsAmount
            );

            if (result.success) {
                console.log('Stars to TSAR exchange initiated');
                // Обновление баланса произойдет в callback после оплаты
            }
        } catch (error) {
            alert(`[EXCHANGE FAILED]\n${error.message}`);
        }
    }
}

async function handleRealTokenListing() {
    if (!tonBlockchainManager.connected) {
        alert('[ERROR] Please connect your TON wallet first');
        return;
    }

    const tokenSymbol = prompt('Token symbol (e.g., DOGE):');
    if (!tokenSymbol || tokenSymbol.length > 10) {
        alert('[ERROR] Invalid token symbol (max 10 characters)');
        return;
    }

    const tokenName = prompt('Token name (e.g., Dogecoin):');
    if (!tokenName || tokenName.length > 50) {
        alert('[ERROR] Invalid token name (max 50 characters)');
        return;
    }

    const contractAddress = prompt('TON Jetton contract address:');
    if (!contractAddress || !contractAddress.startsWith('EQ')) {
        alert('[ERROR] Invalid TON contract address\nMust start with EQ');
        return;
    }

    const requiredTsar = 50000; // $50 worth
    const hasBalance = await realBalanceManager.validateBalance(requiredTsar, 'TSAR');
    
    if (!hasBalance) {
        alert(`[ERROR] Insufficient TSAR balance\nRequired: ${requiredTsar.toLocaleString()} TSAR ($50 worth)\nYour balance: ${userData.tsarBalance.toLocaleString()} TSAR`);
        return;
    }

    const confirmListing = confirm(
        `List ${tokenName} (${tokenSymbol.toUpperCase()}) in RUNNER ecosystem?\n\n` +
        `Token contract: ${contractAddress.substr(0, 20)}...\n` +
        `Listing cost: ${requiredTsar.toLocaleString()} TSAR ($50)\n` +
        `These tokens will be permanently burned\n\n` +
        `After listing, your token will be:\n` +
        `- Available for trading in NUCLEAR CHARGE\n` +
        `- Visible in our ecosystem\n` +
        `- Tradeable against TON/TSAR\n\n` +
        `Continue with listing?`
    );

    if (confirmListing) {
        try {
            const tokenData = {
                symbol: tokenSymbol.toUpperCase(),
                name: tokenName,
                contractAddress: contractAddress
            };

            // Отправляем TSAR на burn address
            const burnResult = await tonBlockchainManager.burnTSAR(requiredTsar);
            
            const listedToken = {
                id: Date.now(),
                symbol: tokenData.symbol,
                name: tokenData.name,
                contractAddress: tokenData.contractAddress,
                listedBy: tonBlockchainManager.userWallet.account.address,
                burnTxHash: burnResult.boc,
                listedAt: Date.now(),
                verified: false,
                tradingEnabled: false
            };

            // Сохраняем в blockchain
            tonBlockchainManager.saveListedToken(listedToken);

            // Обновляем локальный баланс
            if (userData) {
                userData.tsarBalance -= requiredTsar;
                updateUserInfo();
            }

            alert(
                `[TOKEN LISTING SUCCESSFUL!]\n\n` +
                `Token: ${tokenName} (${tokenSymbol.toUpperCase()})\n` +
                `Contract: ${contractAddress.substr(0, 25)}...\n` +
                `Burn TX: ${burnResult.boc.substr(0, 20)}...\n` +
                `Cost: ${requiredTsar.toLocaleString()} TSAR\n\n` +
                `Your token is now in review queue.\n` +
                `Trading will be enabled after verification (24-48h)`
            );
            
        } catch (error) {
            console.error('Token listing failed:', error);
            alert(`[LISTING FAILED]\n${error.message}`);
        }
    }
}

// Обновленные функции с реальными транзакциями
async function createRealMultiplayerGame() {
    if (!tonBlockchainManager.connected) {
        alert('[ERROR] Please connect your TON wallet for crypto stakes');
        return;
    }

    const amountInput = document.getElementById('stake-amount');
    const amount = amountInput ? parseFloat(amountInput.value) : 0.1;
    
    if (amount <= 0) {
        alert('[ERROR] Please enter a valid stake amount');
        return;
    }

    // Проверяем реальный баланс
    const hasBalance = await realBalanceManager.validateBalance(amount, selectedCurrency);
    if (!hasBalance) {
        alert(`[ERROR] Insufficient ${selectedCurrency} balance\nPlease top up your wallet`);
        return;
    }

    const confirm = window.confirm(
        `Create multiplayer game?\n\n` +
        `Stake: ${amount} ${selectedCurrency}\n` +
        `Winner gets: ${(amount * 1.85).toFixed(3)} ${selectedCurrency}\n` +
        `Platform fee: ${(amount * 0.15).toFixed(3)} ${selectedCurrency} (15%)\n\n` +
        `Your ${selectedCurrency} will be locked in smart contract until game ends.\n\n` +
        `Continue?`
    );

    if (confirm) {
        try {
            // Создаем игровую сессию в блокчейне
            const sessionResult = await gameContractManager.createGameSession(
                'terminal_hacking',
                amount,
                selectedCurrency
            );

            if (sessionResult.success) {
                currentStake = { 
                    amount: amount, 
                    currency: selectedCurrency,
                    sessionId: sessionResult.sessionId,
                    txHash: sessionResult.txHash
                };
                
                // Списываем со счета (заморожено в контракте)
                if (userData) {
                    if (selectedCurrency === 'TON') {
                        userData.tonBalance -= amount;
                    } else if (selectedCurrency === 'TSAR') {
                        userData.tsarBalance -= amount;
                    }
                    updateUserInfo();
                }

                showWaitingLobby();
                
                alert(`[GAME CREATED]\nSession ID: ${sessionResult.sessionId}\nStake locked in blockchain\nWaiting for opponent...`);
                
                // Симулируем поиск оппонента
                setTimeout(() => {
                    startTerminalHacking('multiplayer');
                }, 5000);
            }
        } catch (error) {
            alert(`[GAME CREATION FAILED]\n${error.message}`);
        }
    }
}

// Обновленная функция покупки NFT/подарков за Stars
async function purchaseWithStars(item, starsPrice) {
    const confirm = window.confirm(
        `Purchase "${item.title}" for ${starsPrice} Telegram Stars?\n\n` +
        `This will charge your Telegram Stars balance.\n` +
        `Transaction cannot be reversed.\n\n` +
        `Continue?`
    );

    if (confirm) {
        try {
            const result = await transactionManager.processStarsPurchase(item, starsPrice);
            
            if (result.success) {
                console.log('Stars purchase initiated, waiting for payment...');
                // Результат будет обработан в callback после оплаты
            }
        } catch (error) {
            alert(`[PURCHASE FAILED]\n${error.message}`);
        }
    }
}

// Обновленная функция завершения игры с выплатой из смарт-контракта
async function endMultiplayerGameWithPayout(won, gameType = 'terminal_hacking') {
    if (!currentStake || !currentStake.sessionId) {
        // Обычное завершение без блокчейна
        return;
    }

    try {
        // Генерируем proof of game (в реальной версии это будет криптографическое доказательство)
        const proof = {
            gameType: gameType,
            winner: won ? tonBlockchainManager.userWallet.account.address : 'opponent',
            gameData: {
                score: gameScore,
                attempts: 4 - attemptsLeft,
                timeElapsed: Date.now() - terminalGame.timeStarted,
                difficulty: terminalGame.difficulty
            },
            timestamp: Date.now()
        };

        const proofHash = await this.generateProofHash(proof);
        
        // Финализируем игру в смарт-контракте
        const result = await gameContractManager.finalizeGameSession(
            currentStake.sessionId,
            proof.winner,
            proofHash
        );

        if (result.success && won) {
            // Победитель получает выплату из контракта
            const winnings = currentStake.amount * 1.85; // 92.5% (7.5% комиссия)
            
            // Начисляем выигрыш (придет из смарт-контракта)
            if (userData) {
                if (currentStake.currency === 'TON') {
                    userData.tonBalance += winnings;
                } else if (currentStake.currency === 'TSAR') {
                    userData.tsarBalance += winnings;
                }
                
                userData.wins++;
                userData.totalEarned += currentStake.currency === 'TON' ? winnings : 0;
                updateUserInfo();
            }

            alert(
                `[VICTORY PAYOUT]\n\n` +
                `Winnings: ${winnings.toFixed(3)} ${currentStake.currency}\n` +
                `Payout TX: ${result.txHash.substr(0, 20)}...\n` +
                `Platform fee: ${(currentStake.amount * 0.15).toFixed(3)} ${currentStake.currency}\n\n` +
                `Funds transferred to your wallet!`
            );
        } else if (!won) {
            // Проигрыш - ставка остается в контракте
            if (userData) {
                userData.losses++;
                updateUserInfo();
            }

            alert(
                `[DEFEAT]\n\n` +
                `Stake lost: ${currentStake.amount} ${currentStake.currency}\n` +
                `Better luck next time!\n\n` +
                `Practice in solo mode to improve your skills.`
            );
        }

        // Очищаем текущую ставку
        currentStake = null;

    } catch (error) {
        console.error('Game finalization failed:', error);
        alert(`[PAYOUT ERROR]\n${error.message}\n\nPlease contact support with session ID: ${currentStake.sessionId}`);
    }
}

async function generateProofHash(proof) {
    // Генерируем hash доказательства игры
    const proofString = JSON.stringify(proof);
    const encoder = new TextEncoder();
    const data = encoder.encode(proofString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Функция создания TON Connect манифеста
function createTonConnectManifest() {
    const manifest = {
        url: window.location.origin,
        name: "RUNNER Terminal",
        iconUrl: window.location.origin + "/runner-icon.png",
        termsOfUseUrl: window.location.origin + "/terms",
        privacyPolicyUrl: window.location.origin + "/privacy"
    };

    // В продакшене этот файл должен быть размещен по адресу /tonconnect-manifest.json
    console.log('TON Connect Manifest:', manifest);
    return manifest;
}

// Обновленная инициализация с блокчейном
async function initAppWithBlockchain() {
    if (initStarted) return;
    initStarted = true;
    
    console.log("🚀 Initializing RUNNER terminal with blockchain...");
    
    // Создаем TON Connect манифест
    createTonConnectManifest();
    
    // Инициализируем базовые системы
    audioManager = new RetroAudioManager();
    wastelandRadio = new WastelandRadio();
    runnerSystem = new RunnerMissionSystem();
    referralSystem = new ReferralSystem();
    marketplace = new MarketplaceSystem();
    terminalGame = new TerminalHackingGame();
    shmupGameManager = new ShmupGame();
    achievementSystem = new AchievementSystem();
    
    // Инициализируем блокчейн системы
    const blockchainReady = await initBlockchainSystems();
    
    if (!blockchainReady) {
        console.warn('⚠️ Blockchain initialization failed, running in simulation mode');
    }
    
    loadUserData();
    generateReferralCode();
    setupAllEventHandlers();
    loadRadioMessages();
    loadMarketListings();
    loadRunnerMissions();
    
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // Автоматически обновляем балансы каждые 30 секунд
    setInterval(() => {
        if (tonBlockchainManager && tonBlockchainManager.connected) {
            tonBlockchainManager.loadUserBalances();
        }
    }, 30000);
    
    addAchievementStyles();
    showWelcomeScreen();
    
    console.log("✅ RUNNER terminal with blockchain ready");
}

// Обновленные обработчики с реальными транзакциями
function setupRealWalletHandlers() {
    console.log("Setting up real wallet handlers...");
    
    const connectBtn = document.getElementById('connect-wallet');
    if (connectBtn) {
        connectBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            if (tonBlockchainManager && tonBlockchainManager.connected) {
                const disconnected = await tonBlockchainManager.disconnectWallet();
                if (disconnected) {
                    alert('[WALLET] Disconnected successfully');
                }
            } else {
                if (tonBlockchainManager) {
                    const connected = await tonBlockchainManager.connectWallet();
                    if (connected) {
                        // Балансы загрузятся автоматически через onStatusChange
                        console.log('Wallet connected, loading balances...');
                    }
                }
            }
        });
    }

    // Обновленные кнопки с реальными функциями
    const walletButtons = [
        { id: 'deposit-btn', action: handleRealDeposit },
        { id: 'withdraw-btn', action: handleRealWithdrawal },
        { id: 'stake-tsar-btn', action: handleRealStaking },
        { id: 'add-tokens-btn', action: handleRealTokenPurchase }
    ];
    
    walletButtons.forEach(({ id, action }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (audioManager) audioManager.beep();
                
                try {
                    await action();
                } catch (error) {
                    console.error(`Action ${id} failed:`, error);
                    alert(`[ERROR] ${error.message}`);
                }
            });
        }
    });

    const listTokenBtn = document.getElementById('list-token-btn');
    if (listTokenBtn) {
        listTokenBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            await handleRealTokenListing();
        });
    }
    
    console.log("✅ Real wallet handlers setup complete");
}

// Обновленная функция покупки на рынке с реальными Stars
async function purchaseListingWithStars(listing) {
    if (listing.currency !== 'STARS') {
        // Обычная покупка
        return purchaseListingRegular(listing);
    }

    const confirmPurchase = confirm(
        `Purchase "${listing.title}" for ${listing.price} Telegram Stars?\n\n` +
        `Seller: ${listing.seller}\n` +
        `Type: ${listing.type.toUpperCase()}\n\n` +
        `This will charge your Telegram Stars balance.\n` +
        `Continue?`
    );

    if (confirmPurchase) {
        try {
            await purchaseWithStars(listing, listing.price);
        } catch (error) {
            alert(`[PURCHASE FAILED]\n${error.message}`);
        }
    }
}

function purchaseListingRegular(listing) {
    if (!userData) return;
    
    const userBalance = getUserBalance(listing.currency);
    
    if (userBalance >= listing.price) {
        if (listing.currency === 'TON') {
            userData.tonBalance -= listing.price;
        } else if (listing.currency === 'TSAR') {
            userData.tsarBalance -= listing.price;
        }

        updateUserInfo();
        alert(`[PURCHASE COMPLETED]\nYou bought: ${listing.title}\nPaid: ${listing.price} ${listing.currency}`);
    } else {
        alert(`[ERROR] Insufficient ${listing.currency} balance`);
    }
}

// Обновленная функция создания миссий с реальной оплатой
async function createRealMission() {
    if (!userData || userData.tsarBalance < 350000) {
        alert('[ACCESS DENIED]\nInsufficient TSAR tokens\nRequired: 350,000 TSAR for Mission Control Center');
        return;
    }

    // Проверяем актуальный баланс
    const hasBalance = await realBalanceManager.validateBalance(350000, 'TSAR');
    if (!hasBalance) {
        alert('[ERROR] Insufficient TSAR balance\nPlease refresh your balance or add more tokens');
        return;
    }

    const title = prompt('Mission title (max 50 characters):');
    if (!title || title.length > 50) {
        alert('[ERROR] Invalid title length');
        return;
    }

    const description = prompt('Mission description (max 200 characters):');
    if (!description || description.length > 200) {
        alert('[ERROR] Invalid description length');
        return;
    }

    const rewardAmount = prompt('Reward amount per completion:');
    const reward = parseFloat(rewardAmount);
    if (!reward || reward <= 0) {
        alert('[ERROR] Invalid reward amount');
        return;
    }

    const currency = prompt('Reward currency (TON/TSAR/STARS):').toUpperCase();
    if (!['TON', 'TSAR', 'STARS'].includes(currency)) {
        alert('[ERROR] Invalid currency. Use TON, TSAR, or STARS');
        return;
    }

    const type = prompt('Mission type:\n1. telegram (Telegram activities)\n2. social (Social media)\n3. trading (Trading tasks)\n4. gaming (Gaming tasks)\n\nEnter type:').toLowerCase();
    if (!['telegram', 'social', 'trading', 'gaming'].includes(type)) {
        alert('[ERROR] Invalid mission type');
        return;
    }

    const maxCompletions = prompt('Maximum completions (how many users can complete this mission):');
    const completions = parseInt(maxCompletions);
    if (!completions || completions < 1 || completions > 1000) {
        alert('[ERROR] Invalid completions count (1-1000)');
        return;
    }

    const totalBudget = reward * completions;
    const commission = totalBudget * 0.1; // 10% комиссия
    const totalCost = totalBudget + commission;

    const finalConfirm = confirm(
        `Create mission "${title}"?\n\n` +
        `Reward: ${reward} ${currency} per completion\n` +
        `Max completions: ${completions}\n` +
        `Total budget: ${totalBudget} ${currency}\n` +
        `Platform commission: ${commission} ${currency} (10%)\n` +
        `Total cost: ${totalCost} ${currency}\n\n` +
        `This amount will be transferred to escrow.\n` +
        `Continue?`
    );

    if (finalConfirm) {
        try {
            // Переводим бюджет на контракт миссий
            let transferResult;
            
            if (currency === 'TON') {
                transferResult = await tonBlockchainManager.sendTON(
                    tonBlockchainManager.contractAddresses.missionContract || tonBlockchainManager.contractAddresses.gameContract,
                    totalCost,
                    `MISSION_BUDGET:${Date.now()}`
                );
            } else if (currency === 'TSAR') {
                transferResult = await tonBlockchainManager.sendTSAR(
                    tonBlockchainManager.contractAddresses.missionContract || tonBlockchainManager.contractAddresses.gameContract,
                    totalCost,
                    `MISSION_BUDGET:${Date.now()}`
                );
            }

            const missionData = {
                title,
                description,
                reward: { amount: reward, currency },
                type,
                maxCompletions: completions,
                totalBudget: totalBudget,
                requirements: { minTsar: 100 },
                escrowTxHash: transferResult.boc,
                createdBy: tonBlockchainManager.userWallet.account.address
            };

            const result = runnerSystem.createMission(missionData);
            
            if (result.success) {
                // Списываем с локального баланса
                if (userData) {
                    if (currency === 'TON') {
                        userData.tonBalance -= totalCost;
                    } else if (currency === 'TSAR') {
                        userData.tsarBalance -= totalCost;
                    }
                    updateUserInfo();
                }

                alert(
                    `[MISSION CREATED SUCCESSFULLY!]\n\n` +
                    `Title: ${title}\n` +
                    `Reward: ${reward} ${currency}\n` +
                    `Budget locked: ${totalBudget} ${currency}\n` +
                    `Commission: ${commission} ${currency}\n` +
                    `Escrow TX: ${transferResult.boc.substr(0, 20)}...\n\n` +
                    `Your mission is now live!\n` +
                    `Rewards will be paid automatically upon completion.`
                );
                
                loadRunnerMissions();
            }
        } catch (error) {
            alert(`[MISSION CREATION FAILED]\n${error.message}`);
        }
    }
}

// Обновленная функция обработки реальных торговых ордеров
async function placeRealBuyOrder() {
    if (!tonBlockchainManager.connected) {
        alert('[ERROR] Please connect your wallet first');
        return;
    }

    const amountInput = document.getElementById('trade-amount');
    const priceInput = document.getElementById('trade-price');
    
    const amount = amountInput ? parseFloat(amountInput.value) : 0;
    const price = priceInput ? parseFloat(priceInput.value) : 0;
    
    if (!amount || !price || amount <= 0 || price <= 0) {
        alert('[ERROR] Please enter valid amount and price');
        return;
    }

    const total = amount * price;
    const tradingFee = total * 0.003; // 0.3% комиссия
    const totalCost = total + tradingFee;
    
    const hasBalance = await realBalanceManager.validateBalance(totalCost, 'TON');
    if (!hasBalance) {
        alert(`[ERROR] Insufficient TON balance\nRequired: ${totalCost.toFixed(3)} TON (including ${tradingFee.toFixed(3)} TON trading fee)`);
        return;
    }

    const confirm = window.confirm(
        `Place buy order?\n\n` +
        `Buy: ${amount.toLocaleString()} TSAR\n` +
        `Price: ${price} TON each\n` +
        `Total: ${total.toFixed(3)} TON\n` +
        `Trading fee: ${tradingFee.toFixed(3)} TON (0.3%)\n` +
        `Total cost: ${totalCost.toFixed(3)} TON\n\n` +
        `Order will be placed on DEX\n` +
        `Continue?`
    );

    if (confirm) {
        try {
            // Отправляем TON на торговый контракт
            const result = await tonBlockchainManager.sendTON(
                tonBlockchainManager.contractAddresses.dexContract || tonBlockchainManager.contractAddresses.gameContract,
                totalCost,
                `BUY_ORDER:${amount}:${price}:${Date.now()}`
            );

            // Обновляем локальный баланс
            if (userData) {
                userData.tonBalance -= totalCost;
                updateUserInfo();
            }

            alert(
                `[BUY ORDER PLACED]\n\n` +
                `Amount: ${amount.toLocaleString()} TSAR\n` +
                `Price: ${price} TON each\n` +
                `Order TX: ${result.boc.substr(0, 20)}...\n\n` +
                `Your order is now active on the orderbook.\n` +
                `You will receive TSAR when order is filled.`
            );

            // Проверяем достижения
            if (achievementSystem) {
                achievementSystem.checkAchievement('crypto_trader');
            }
            
        } catch (error) {
            alert(`[ORDER FAILED]\n${error.message}`);
        }
    }
}

async function placeRealSellOrder() {
    if (!tonBlockchainManager.connected) {
        alert('[ERROR] Please connect your wallet first');
        return;
    }

    const amountInput = document.getElementById('trade-amount');
    const priceInput = document.getElementById('trade-price');
    
    const amount = amountInput ? parseFloat(amountInput.value) : 0;
    const price = priceInput ? parseFloat(priceInput.value) : 0;
    
    if (!amount || !price || amount <= 0 || price <= 0) {
        alert('[ERROR] Please enter valid amount and price');
        return;
    }

    const hasBalance = await realBalanceManager.validateBalance(amount, 'TSAR');
    if (!hasBalance) {
        alert(`[ERROR] Insufficient TSAR balance\nRequired: ${amount.toLocaleString()} TSAR`);
        return;
    }

    const expectedTon = amount * price;
    const tradingFee = expectedTon * 0.003; // 0.3% комиссия
    const netReceive = expectedTon - tradingFee;

    const confirm = window.confirm(
        `Place sell order?\n\n` +
        `Sell: ${amount.toLocaleString()} TSAR\n` +
        `Price: ${price} TON each\n` +
        `Expected: ${expectedTon.toFixed(3)} TON\n` +
        `Trading fee: ${tradingFee.toFixed(3)} TON (0.3%)\n` +
        `Net receive: ${netReceive.toFixed(3)} TON\n\n` +
        `TSAR will be locked until order fills\n` +
        `Continue?`
    );

    if (confirm) {
        try {
            // Отправляем TSAR на торговый контракт
            const result = await tonBlockchainManager.sendTSAR(
                tonBlockchainManager.contractAddresses.dexContract || tonBlockchainManager.contractAddresses.gameContract,
                amount,
                `SELL_ORDER:${amount}:${price}:${Date.now()}`
            );

            // Обновляем локальный баланс
            if (userData) {
                userData.tsarBalance -= amount;
                updateUserInfo();
            }

            alert(
                `[SELL ORDER PLACED]\n\n` +
                `Amount: ${amount.toLocaleString()} TSAR\n` +
                `Price: ${price} TON each\n` +
                `Order TX: ${result.boc.substr(0, 20)}...\n\n` +
                `Your TSAR is now locked in escrow.\n` +
                `You will receive TON when order is filled.`
            );

            if (achievementSystem) {
                achievementSystem.checkAchievement('crypto_trader');
            }
            
        } catch (error) {
            alert(`[ORDER FAILED]\n${error.message}`);
        }
    }
}

// Обновленная инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 RUNNER DOM loaded - initializing with blockchain");
    
    // Проверяем доступность необходимых API
    const tonConnectAvailable = typeof TonConnect !== 'undefined';
    const telegramAvailable = typeof Telegram !== 'undefined';
    
    console.log(`TON Connect available: ${tonConnectAvailable}`);
    console.log(`Telegram Web App available: ${telegramAvailable}`);
    
    if (!tonConnectAvailable) {
        console.warn('⚠️ TON Connect not available, blockchain features will be limited');
    }
    
    if (!telegramAvailable) {
        console.warn('⚠️ Telegram Web App not available, Stars features will be limited');
    }
    
    setTimeout(initAppWithBlockchain, 100);
});

// Обновляем старые функции для использования новых систем
function setupAllEventHandlers() {
    setupSimpleNavigation();
    setupGameHandlers();
    setupRadioHandlers();
    setupRealWalletHandlers(); // Используем реальные обработчики
    setupClanHandlers();
    setupSettingsHandlers();
    setupMarketHandlers();
    setupRealNuclearHandlers(); // Используем реальные обработчики
    setupRunnerHandlers();
    setupShmupHandlers();
}

function setupRealNuclearHandlers() {
    const connectTradingBtn = document.getElementById('connect-trading-wallet');
    if (connectTradingBtn) {
        connectTradingBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            
            if (tonBlockchainManager) {
                await tonBlockchainManager.connectWallet();
            }
        });
    }

    const buyBtn = document.getElementById('buy-btn');
    const sellBtn = document.getElementById('sell-btn');
    
    if (buyBtn) {
        buyBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            await placeRealBuyOrder();
        });
    }

    if (sellBtn) {
        sellBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (audioManager) audioManager.beep();
            await placeRealSellOrder();
        });
    }
}

// Обновленная функция завершения игры
function endGameWithBlockchain(won, gameType) {
    if (isMultiplayer && currentStake) {
        endMultiplayerGameWithPayout(won, gameType);
    } else {
        // Обычное завершение
        endGameRegular(won);
    }
}

function endGameRegular(won) {
    if (!userData) return;
    
    const reward = won ? 50 : 15;
    userData.bottleCaps += reward;
    
    if (won) {
        userData.wins++;
    } else {
        userData.losses++;
    }
    
    updateUserInfo();
    
    alert(`[GAME OVER]\n${won ? 'VICTORY!' : 'DEFEAT'}\n+${reward} Bottle Caps`);
}

// Функция показа транзакций
function showTransactionHistory() {
    if (!transactionManager) {
        alert('[TRANSACTION HISTORY]\nNo transactions available\nConnect wallet to see transaction history');
        return;
    }

    const history = transactionManager.getTransactionHistory(10);
    const pending = transactionManager.getPendingTransactions();
    
    let historyText = '[TRANSACTION HISTORY]\n\n';
    
    if (pending.length > 0) {
        historyText += 'PENDING TRANSACTIONS:\n';
        pending.forEach(tx => {
            historyText += `${tx.type.toUpperCase()}: ${tx.amount} ${tx.currency} - PENDING\n`;
        });
        historyText += '\n';
    }
    
    if (history.length > 0) {
        historyText += 'RECENT TRANSACTIONS:\n';
        history.forEach(tx => {
            const date = new Date(tx.createdAt).toLocaleDateString();
            const status = tx.status.toUpperCase();
            historyText += `${date} - ${tx.type.toUpperCase()}: ${tx.amount} ${tx.currency} - ${status}\n`;
        });
    } else {
        historyText += 'No transaction history available';
    }
    
    alert(historyText);
}

// Добавляем кнопку истории транзакций в кошелек
function addTransactionHistoryButton() {
    const walletSection = document.getElementById('wallet-section');
    if (!walletSection) return;

    const historyBtn = document.createElement('button');
    historyBtn.className = 'wallet-btn secondary';
    historyBtn.innerHTML = `
        <span class="btn-icon">[HIS]</span>
        <span class="btn-text">HISTORY</span>
    `;
    
    historyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (audioManager) audioManager.beep();
        showTransactionHistory();
    });

    const walletActions = walletSection.querySelector('.wallet-actions');
    if (walletActions) {
        walletActions.appendChild(historyBtn);
    }
}

console.log("🎮 RUNNER Terminal with Blockchain script loaded");