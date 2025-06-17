import EventEmitter from './EventEmitter.js';
import AnimalChess from './gameLogic.js';
import GameRenderer from './gameRenderer.js';
import AnimalChessAI from './ai.js';
import MultiplayerClient from './multiplayer.js';

class GameApp {
  constructor() {
    console.log('GameApp 初始化开始...');

    this.emitter = new EventEmitter();
    this.game = new AnimalChess(this.emitter);

    this.canvas = document.getElementById('chessCanvas');
    if (!this.canvas) {
      console.error('找不到 Canvas 元素');
      return;
    }

    this.renderer = new GameRenderer(this.canvas, this.emitter);
    this.ai = new AnimalChessAI(this.emitter, 'medium');
    this.multiplayer = new MultiplayerClient(this.emitter);

    this.bindAppEvents();
    this.bindDOMEvents();

    this.emitter.emit('stateChanged', this.game.getGameState());
    console.log('GameApp 初始化完成');
  }

  bindAppEvents() {
    this.emitter.on('pieceSelected', ({ row, col }) => {
      if (
        this.game.gameMode === 'single' &&
        this.game.currentPlayer === 'blue'
      ) {
        return;
      }
      if (this.game.gameMode === 'multi' && !this.multiplayer.canMakeMove()) {
        return;
      }
      const move = this.game.selectPiece(row, col);
      if (move && move.success && this.game.gameMode === 'multi') {
        const lastMove =
          this.game.moveHistory[this.game.moveHistory.length - 1];
        this.emitter.emit('playerMoved', {
          from: lastMove.from,
          to: lastMove.to,
        });
      }
    });

    this.emitter.on('aiMoved', ({ from, to }) => {
      this.game.makeMove(from.row, from.col, to.row, to.col);
    });

    this.emitter.on('opponentMoved', ({ from, to }) => {
      this.game.makeMove(from.row, from.col, to.row, to.col);
    });

    this.emitter.on('startSinglePlayer', () => {
      this.startSinglePlayer();
    });

    this.emitter.on('startMultiplayer', () => {
      this.game.gameMode = 'multi';
      this.game.resetGame();
    });

    this.emitter.on('playerLeft', () => {
      this.multiplayer.showPlayerLeftModal(() => {
        this.multiplayer.disconnect();
        this.startSinglePlayer();
      });
    });
  }

  bindDOMEvents() {
    const singlePlayerBtn = document.getElementById('singlePlayerBtn');
    const multiPlayerBtn = document.getElementById('multiPlayerBtn');
    const restartBtn = document.getElementById('restartBtn');

    if (singlePlayerBtn) {
      singlePlayerBtn.addEventListener('click', () => this.startSinglePlayer());
    }

    if (multiPlayerBtn) {
      multiPlayerBtn.addEventListener('click', () =>
        this.showMultiplayerOptions()
      );
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restartGame());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.renderer.hideModal();
      }
    });
  }

  startSinglePlayer() {
    console.log('开始单人游戏');
    this.multiplayer.disconnect();
    this.game.gameMode = 'single';
    this.game.resetGame();
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
      this.renderer.showModal(
        '连接失败',
        '无法连接到服务器，请检查网络连接或稍后重试。'
      );
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
    input.style.cssText =
      'width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; font-size: 16px;';
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });

    modalMessage.innerHTML = '';
    modalMessage.appendChild(input);

    modalConfirm.textContent = '加入';
    modalCancel.textContent = '取消';
    modalCancel.style.display = 'inline-block';

    const newModalConfirm = modalConfirm.cloneNode(true);
    modalConfirm.parentNode.replaceChild(newModalConfirm, modalConfirm);

    const confirmHandler = () => {
      const roomId = input.value.trim();
      if (roomId.length === 6) {
        this.multiplayer.joinRoom(roomId);
        this.renderer.hideModal();
      } else {
        input.style.borderColor = '#ff0000';
        setTimeout(() => {
          input.style.borderColor = '#ccc';
        }, 2000);
      }
    };

    newModalConfirm.addEventListener('click', confirmHandler);

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

      const newModalConfirm = modalConfirm.cloneNode(true);
      modalConfirm.parentNode.replaceChild(newModalConfirm, modalConfirm);
      const newModalCancel = modalCancel.cloneNode(true);
      modalCancel.parentNode.replaceChild(newModalCancel, modalCancel);

      const confirmHandler = () => {
        resolve('confirm');
        this.renderer.hideModal();
      };

      const cancelHandler = () => {
        resolve('cancel');
        this.renderer.hideModal();
      };

      newModalConfirm.addEventListener('click', confirmHandler, { once: true });
      newModalCancel.addEventListener('click', cancelHandler, { once: true });

      modal.classList.remove('hidden');
    });
  }

  restartGame() {
    if (this.game.gameMode === 'multi' && this.multiplayer.connected) {
      this.renderer.showModal('提示', '联机模式下无法重新开始游戏', false);
      return;
    }

    if (this.multiplayer.connected) {
      this.multiplayer.disconnect();
    }

    this.game.gameMode = 'single';
    this.game.resetGame();
    console.log('游戏重新开始');
  }

  setAIDifficulty(difficulty) {
    this.ai.setDifficulty(difficulty);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});
