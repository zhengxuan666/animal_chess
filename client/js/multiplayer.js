class MultiplayerClient {
    constructor(game, renderer) {
        this.game = game;
        this.renderer = renderer;
        this.ws = null;
        this.roomId = null;
        this.playerId = null;
        this.playerColor = null;
        this.isHost = false;
        this.connected = false;
        
        this.serverUrl = this.getServerUrl();
    }

    getServerUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : ':3001';
        return `${protocol}//${host}${port}`;
    }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.serverUrl);
                
                this.ws.onopen = () => {
                    console.log('连接到服务器成功');
                    this.connected = true;
                    this.updateConnectionStatus('已连接');
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('解析消息错误:', error);
                    }
                };

                this.ws.onclose = () => {
                    console.log('与服务器断开连接');
                    this.connected = false;
                    this.updateConnectionStatus('连接断开');
                    this.showModal('连接断开', '与服务器的连接已断开，请刷新页面重试。');
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket错误:', error);
                    this.connected = false;
                    this.updateConnectionStatus('连接错误');
                    reject(error);
                };

                setTimeout(() => {
                    if (!this.connected) {
                        reject(new Error('连接超时'));
                    }
                }, 5000);

            } catch (error) {
                reject(error);
            }
        });
    }

    createRoom() {
        if (!this.connected) {
            this.showModal('错误', '请先连接到服务器');
            return;
        }

        this.isHost = true;
        this.playerColor = 'red';
        this.send({
            type: 'createRoom'
        });
    }

    joinRoom(roomId) {
        if (!this.connected) {
            this.showModal('错误', '请先连接到服务器');
            return;
        }

        if (!roomId || roomId.length !== 6) {
            this.showModal('错误', '请输入有效的房间号（6位字符）');
            return;
        }

        this.isHost = false;
        this.playerColor = 'blue';
        this.send({
            type: 'joinRoom',
            roomId: roomId.toUpperCase()
        });
    }

    handleMessage(message) {
        switch (message.type) {
            case 'roomCreated':
                this.roomId = message.roomId;
                this.playerId = message.playerId;
                this.showModal('房间创建成功', `房间号: ${this.roomId}\n等待其他玩家加入...`);
                this.updateConnectionStatus(`房间: ${this.roomId} (等待对手)`);
                break;

            case 'roomJoined':
                this.roomId = message.roomId;
                this.playerId = message.playerId;
                this.updateConnectionStatus(`房间: ${this.roomId} (已加入)`);
                break;

            case 'playerJoined':
                if (message.playerCount === 2) {
                    this.hideModal();
                    this.updateConnectionStatus(`房间: ${this.roomId} (游戏准备)`);
                }
                break;

            case 'gameStart':
                this.game.gameMode = 'multi';
                this.game.resetGame();
                this.hideModal();
                this.updateConnectionStatus(`房间: ${this.roomId} (游戏中)`);
                this.renderer.render();
                this.renderer.updateGameStatus();
                break;

            case 'move':
                if (message.playerId !== this.playerId) {
                    const move = message.move;
                    this.game.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
                    this.renderer.render();
                    this.renderer.updateGameStatus();
                    this.renderer.updateCapturedPieces();
                }
                break;

            case 'gameOver':
                this.game.gameState = 'finished';
                const winner = message.winner === this.playerColor ? '你' : '对手';
                this.renderer.showGameOverModal(winner, message.reason);
                this.renderer.updateGameStatus();
                break;

            case 'playerLeft':
                this.game.gameState = 'finished';
                this.renderer.showPlayerLeftModal(() => {
                    // 重新开始游戏的回调
                    this.disconnect();
                    this.game.gameMode = 'single';
                    this.game.resetGame();
                    this.renderer.render();
                    this.renderer.updateGameStatus();
                    this.renderer.updateCapturedPieces();
                });
                break;

            case 'error':
                this.showModal('错误', message.message);
                break;
        }
    }

    sendMove(move) {
        if (this.connected && this.roomId) {
            this.send({
                type: 'move',
                move: move
            });
        }
    }

    sendGameOver(winner, reason) {
        if (this.connected && this.roomId) {
            this.send({
                type: 'gameOver',
                winner: winner,
                reason: reason
            });
        }
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    showModal(title, message) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalCancel = document.getElementById('modalCancel');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalCancel.style.display = 'inline-block';
        
        modal.classList.remove('hidden');
    }

    hideModal() {
        const modal = document.getElementById('modal');
        modal.classList.add('hidden');
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.roomId = null;
        this.playerId = null;
        this.playerColor = null;
        this.isHost = false;
        this.updateConnectionStatus('');
    }

    isMyTurn() {
        return this.game.currentPlayer === this.playerColor;
    }

    canMakeMove() {
        return this.connected && 
               this.roomId && 
               this.game.gameMode === 'multi' && 
               this.game.gameState === 'playing' && 
               this.isMyTurn();
    }
}