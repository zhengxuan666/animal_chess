class GameApp {
    constructor() {
        console.log('GameApp 初始化开始...');
        
        this.game = new AnimalChess();
        console.log('AnimalChess 创建完成');
        
        this.canvas = document.getElementById('chessCanvas');
        if (!this.canvas) {
            console.error('找不到 Canvas 元素');
            return;
        }
        console.log('Canvas 元素获取成功');
        
        this.renderer = new GameRenderer(this.canvas, this.game);
        console.log('GameRenderer 创建完成');
        
        this.ai = new AnimalChessAI(this.game, 'medium');
        console.log('AI 创建完成');
        
        this.multiplayer = new MultiplayerClient(this.game, this.renderer);
        console.log('Multiplayer 创建完成');
        
        this.originalSelectPiece = this.game.selectPiece.bind(this.game);
        this.originalMakeMove = this.game.makeMove.bind(this.game);
        
        this.setupGame();
        this.bindEvents();
        
        console.log('开始初始渲染...');
        this.renderer.render();
        this.renderer.updateGameStatus();
        console.log('GameApp 初始化完成');
    }

    setupGame() {
        this.game.selectPiece = (row, col) => {
            // 单人模式下只能操作红方
            if (this.game.gameMode === 'single' && this.game.currentPlayer === 'blue') {
                console.log('单人模式下轮到AI，无法操作');
                return false;
            }
            
            // 联机模式检查
            if (this.game.gameMode === 'multi' && !this.multiplayer.canMakeMove()) {
                console.log('联机模式下不是你的回合');
                return false;
            }
            
            // 如果点击的是对方棋子，检查是否是要移动到该位置（吃子）
            const cell = this.game.board[row][col];
            if (cell.piece && cell.piece.player !== this.game.currentPlayer) {
                // 如果已经选择了己方棋子，这可能是要移动到对方棋子位置（吃子）
                if (this.game.selectedPiece) {
                    console.log('尝试移动到对方棋子位置（吃子）');
                    // 让原始的selectPiece方法处理这个移动
                } else {
                    console.log('不能选择对方的棋子作为起始位置');
                    return false;
                }
            }
            
            const result = this.originalSelectPiece(row, col);
            console.log('selectPiece返回结果:', result);
            
            if (result && typeof result === 'object' && result.success) {
                this.renderer.updateCapturedPieces();
                
                if (result.winner) {
                    this.renderer.showGameOverModal(result.winner, result.reason);
                    if (this.game.gameMode === 'multi') {
                        this.multiplayer.sendGameOver(result.winner, result.reason);
                    }
                } else {
                    this.renderer.updateGameStatus();
                    
                    if (this.game.gameMode === 'multi') {
                        const lastMove = this.game.moveHistory[this.game.moveHistory.length - 1];
                        if (lastMove) {
                            this.multiplayer.sendMove({
                                from: lastMove.from,
                                to: lastMove.to
                            });
                        }
                    } else if (this.game.gameMode === 'single' && this.game.currentPlayer === 'blue') {
                        console.log('轮到AI下棋, 当前玩家:', this.game.currentPlayer);
                        console.log('游戏状态:', this.game.gameState);
                        setTimeout(() => {
                            try {
                                const aiResult = this.ai.makeMove();
                                console.log('AI下棋结果:', aiResult);
                                this.renderer.render();
                                this.renderer.updateGameStatus();
                                this.renderer.updateCapturedPieces();
                                
                                const winner = this.game.checkWinCondition();
                                if (winner) {
                                    this.renderer.showGameOverModal(winner, this.game.getWinReason(winner));
                                }
                            } catch (error) {
                                console.error('AI执行出错:', error);
                            }
                        }, 800);
                    }
                }
            }
            
            return result;
        };
    }

    bindEvents() {
        console.log('绑定事件开始...');
        
        const singlePlayerBtn = document.getElementById('singlePlayerBtn');
        const multiPlayerBtn = document.getElementById('multiPlayerBtn');
        const restartBtn = document.getElementById('restartBtn');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');

        if (singlePlayerBtn) {
            singlePlayerBtn.addEventListener('click', () => {
                console.log('单人游戏按钮被点击');
                this.startSinglePlayer();
            });
            console.log('单人游戏按钮事件绑定成功');
        } else {
            console.error('找不到单人游戏按钮');
        }

        if (multiPlayerBtn) {
            multiPlayerBtn.addEventListener('click', () => {
                console.log('联机游戏按钮被点击');
                this.showMultiplayerOptions();
            });
            console.log('联机游戏按钮事件绑定成功');
        } else {
            console.error('找不到联机游戏按钮');
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                console.log('重新开始按钮被点击');
                this.restartGame();
            });
            console.log('重新开始按钮事件绑定成功');
        } else {
            console.error('找不到重新开始按钮');
        }

        if (modalConfirm) {
            modalConfirm.addEventListener('click', () => {
                this.renderer.hideModal();
            });
        }

        if (modalCancel) {
            modalCancel.addEventListener('click', () => {
                this.renderer.hideModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.renderer.hideModal();
            }
        });
        
        console.log('事件绑定完成');
    }

    startSinglePlayer() {
        console.log('开始单人游戏');
        this.multiplayer.disconnect();
        this.game.gameMode = 'single';
        this.game.resetGame();
        console.log('游戏重置完成');
        this.renderer.render();
        this.renderer.updateGameStatus();
        this.renderer.updateCapturedPieces();
        console.log('单人游戏初始化完成');
    }

    async showMultiplayerOptions() {
        try {
            await this.multiplayer.connect();
            
            const choice = await this.showChoiceModal(
                '联机模式',
                '选择游戏方式：',
                '创建房间',
                '加入房间'
            );
            
            if (choice === 'confirm') {
                this.multiplayer.createRoom();
            } else if (choice === 'cancel') {
                this.showJoinRoomModal();
            }
        } catch (error) {
            console.error('连接失败:', error);
            this.renderer.showModal('连接失败', '无法连接到服务器，请检查网络连接或稍后重试。');
        }
    }

    showJoinRoomModal() {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');
        
        modalTitle.textContent = '加入房间';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '请输入6位房间号';
        input.maxLength = 6;
        input.style.cssText = 'width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; font-size: 16px;';
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        modalMessage.innerHTML = '';
        modalMessage.appendChild(input);
        
        modalConfirm.textContent = '加入';
        modalCancel.textContent = '取消';
        modalCancel.style.display = 'inline-block';
        
        const confirmHandler = () => {
            const roomId = input.value.trim();
            if (roomId.length === 6) {
                this.multiplayer.joinRoom(roomId);
                modalConfirm.removeEventListener('click', confirmHandler);
                this.renderer.hideModal();
            } else {
                input.style.borderColor = '#ff0000';
                setTimeout(() => {
                    input.style.borderColor = '#ccc';
                }, 2000);
            }
        };
        
        modalConfirm.addEventListener('click', confirmHandler);
        
        modal.classList.remove('hidden');
        setTimeout(() => input.focus(), 100);
    }

    showChoiceModal(title, message, confirmText, cancelText) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modalTitle');
            const modalMessage = document.getElementById('modalMessage');
            const modalConfirm = document.getElementById('modalConfirm');
            const modalCancel = document.getElementById('modalCancel');
            
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modalConfirm.textContent = confirmText;
            modalCancel.textContent = cancelText;
            modalCancel.style.display = 'inline-block';
            
            const confirmHandler = () => {
                modalConfirm.removeEventListener('click', confirmHandler);
                modalCancel.removeEventListener('click', cancelHandler);
                this.renderer.hideModal();
                resolve('confirm');
            };
            
            const cancelHandler = () => {
                modalConfirm.removeEventListener('click', confirmHandler);
                modalCancel.removeEventListener('click', cancelHandler);
                this.renderer.hideModal();
                resolve('cancel');
            };
            
            modalConfirm.addEventListener('click', confirmHandler);
            modalCancel.addEventListener('click', cancelHandler);
            
            modal.classList.remove('hidden');
        });
    }

    restartGame() {
        if (this.game.gameMode === 'multi' && this.multiplayer.connected) {
            this.renderer.showModal('提示', '联机模式下无法重新开始游戏', false);
            return;
        }
        
        // 断开联机连接（如果有的话）
        if (this.multiplayer.connected) {
            this.multiplayer.disconnect();
        }
        
        this.game.gameMode = 'single';
        this.game.resetGame();
        this.renderer.render();
        this.renderer.updateGameStatus();
        this.renderer.updateCapturedPieces();
        console.log('游戏重新开始');
    }

    setAIDifficulty(difficulty) {
        this.ai.setDifficulty(difficulty);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new GameApp();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            console.log('Service Worker registration failed');
        });
    }
});