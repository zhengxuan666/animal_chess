class GameRenderer {
  constructor(canvas, emitter) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.emitter = emitter;
    this.game = null;

    this.cellSize = 60;
    this.padding = 40;
    this.boardWidth = 7 * this.cellSize;
    this.boardHeight = 9 * this.cellSize;

    this.colors = {
      background: '#F4A460',
      boardLine: '#8B4513',
      river: '#4169E1',
      trap: '#DC143C',
      den: '#FFD700',
      selected: '#32CD32',
      validMove: '#90EE90',
      redPiece: '#DC143C',
      bluePiece: '#4169E1',
      pieceText: '#FFFFFF',
    };

    this.setupCanvas();
    this.bindEvents();

    this.emitter.on('stateChanged', (gameState) => {
      this.game = gameState;
      this.render();
      this.updateCapturedPieces();
      this.updateGameStatus();
    });

    this.emitter.on('gameOver', ({ winner, reason }) => {
      this.showGameOverModal(winner, reason);
    });
  }

  setupCanvas() {
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth || 600;
    const containerHeight = container.clientHeight || 700;

    const scale = Math.min(
      containerWidth / (this.boardWidth + 2 * this.padding),
      containerHeight / (this.boardHeight + 2 * this.padding),
      1
    );

    this.cellSize = Math.max(Math.floor(60 * scale), 40);
    this.padding = Math.max(Math.floor(40 * scale), 20);
    this.boardWidth = 7 * this.cellSize;
    this.boardHeight = 9 * this.cellSize;

    this.canvas.width = this.boardWidth + 2 * this.padding;
    this.canvas.height = this.boardHeight + 2 * this.padding;

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  bindEvents() {
    console.log('绑定Canvas点击事件');
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();

      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const col = Math.floor((x - this.padding) / this.cellSize);
      const row = Math.floor((y - this.padding) / this.cellSize);

      console.log(
        `Canvas点击: 原始(${e.clientX - rect.left}, ${e.clientY - rect.top}) 缩放后(${x}, ${y}) -> 格子(${row}, ${col})`
      );
      console.log(
        `Canvas尺寸: ${this.canvas.width}x${this.canvas.height}, 显示尺寸: ${rect.width}x${rect.height}`
      );

      if (row >= 0 && row < 9 && col >= 0 && col < 7) {
        console.log('有效点击，发出 pieceSelected 事件');
        this.emitter.emit('pieceSelected', { row, col });
      } else {
        console.log('点击位置超出棋盘范围');
      }
    });

    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.render();
    });
  }

  render() {
    if (!this.game) return;
    console.log('开始渲染');
    this.clearCanvas();
    this.drawBoard();
    this.drawTerrain();
    this.drawPieces();
    this.drawSelection();
    this.drawValidMoves();
    console.log('渲染完成');
  }

  clearCanvas() {
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBoard() {
    this.ctx.strokeStyle = this.colors.boardLine;
    this.ctx.lineWidth = 2;

    for (let row = 0; row <= 9; row += 1) {
      const y = this.padding + row * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding, y);
      this.ctx.lineTo(this.padding + this.boardWidth, y);
      this.ctx.stroke();
    }

    for (let col = 0; col <= 7; col += 1) {
      const x = this.padding + col * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.padding);
      this.ctx.lineTo(x, this.padding + this.boardHeight);
      this.ctx.stroke();
    }
  }

  drawTerrain() {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const cell = this.game.board[row][col];
        const x = this.padding + col * this.cellSize;
        const y = this.padding + row * this.cellSize;

        switch (cell.terrain) {
          case 1: // river
            this.ctx.fillStyle = this.colors.river;
            this.ctx.fillRect(
              x + 2,
              y + 2,
              this.cellSize - 4,
              this.cellSize - 4
            );
            break;
          case 2: // trap
            this.ctx.fillStyle = this.colors.trap;
            this.ctx.fillRect(
              x + 5,
              y + 5,
              this.cellSize - 10,
              this.cellSize - 10
            );
            break;
          case 3: // den
            this.ctx.fillStyle = this.colors.den;
            this.ctx.fillRect(
              x + 5,
              y + 5,
              this.cellSize - 10,
              this.cellSize - 10
            );
            this.ctx.fillStyle = '#000000';
            this.ctx.font = `${Math.floor(this.cellSize * 0.2)}px Arial`;
            this.ctx.fillText(
              '穴',
              x + this.cellSize / 2,
              y + this.cellSize / 2
            );
            break;
          default:
            break;
        }
      }
    }
  }

  drawPieces() {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const { piece } = this.game.board[row][col];
        if (piece) {
          this.drawPiece(piece, row, col);
        }
      }
    }
  }

  drawPiece(piece, row, col) {
    const x = this.padding + col * this.cellSize + this.cellSize / 2;
    const y = this.padding + row * this.cellSize + this.cellSize / 2;
    const radius = this.cellSize * 0.35;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle =
      piece.player === 'red' ? this.colors.redPiece : this.colors.bluePiece;
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = this.colors.pieceText;
    this.ctx.font = `bold ${Math.floor(this.cellSize * 0.25)}px Arial`;

    const animalData = this.getAnimalData(piece.player, piece.animal);
    if (animalData) {
      this.ctx.fillText(animalData.symbol, x, y);
    }

    this.ctx.font = `${Math.floor(this.cellSize * 0.15)}px Arial`;
    this.ctx.fillText(piece.power, x, y + radius * 0.7);
  }

  getAnimalData(player, animalName) {
    const animals = {
      red: {
        rat: { power: 1, name: '鼠', symbol: '鼠' },
        cat: { power: 2, name: '猫', symbol: '猫' },
        dog: { power: 3, name: '狗', symbol: '狗' },
        wolf: { power: 4, name: '狼', symbol: '狼' },
        leopard: { power: 5, name: '豹', symbol: '豹' },
        tiger: { power: 6, name: '虎', symbol: '虎' },
        lion: { power: 7, name: '狮', symbol: '狮' },
        elephant: { power: 8, name: '象', symbol: '象' },
      },
      blue: {
        rat: { power: 1, name: '鼠', symbol: '鼠' },
        cat: { power: 2, name: '猫', symbol: '猫' },
        dog: { power: 3, name: '狗', symbol: '狗' },
        wolf: { power: 4, name: '狼', symbol: '狼' },
        leopard: { power: 5, name: '豹', symbol: '豹' },
        tiger: { power: 6, name: '虎', symbol: '虎' },
        lion: { power: 7, name: '狮', symbol: '狮' },
        elephant: { power: 8, name: '象', symbol: '象' },
      },
    };
    return animals[player] ? animals[player][animalName] : null;
  }

  drawSelection() {
    if (this.game.selectedPiece) {
      const { row, col } = this.game.selectedPiece;
      const x = this.padding + col * this.cellSize;
      const y = this.padding + row * this.cellSize;

      this.ctx.strokeStyle = this.colors.selected;
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
    }
  }

  drawValidMoves() {
    this.game.validMoves.forEach((move) => {
      const x = this.padding + move.col * this.cellSize + this.cellSize / 2;
      const y = this.padding + move.row * this.cellSize + this.cellSize / 2;

      this.ctx.beginPath();
      this.ctx.arc(x, y, this.cellSize * 0.15, 0, 2 * Math.PI);
      this.ctx.fillStyle = this.colors.validMove;
      this.ctx.fill();
      this.ctx.strokeStyle = this.colors.selected;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
  }

  getCellFromPosition(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const col = Math.floor((canvasX - this.padding) / this.cellSize);
    const row = Math.floor((canvasY - this.padding) / this.cellSize);

    if (row >= 0 && row < 9 && col >= 0 && col < 7) {
      return { row, col };
    }
    return null;
  }

  updateCapturedPieces() {
    if (!this.game) return;
    const redCaptured = document.getElementById('redCaptured');
    const blueCaptured = document.getElementById('blueCaptured');

    redCaptured.innerHTML = '';
    blueCaptured.innerHTML = '';

    this.game.capturedPieces.red.forEach((piece) => {
      const pieceElement = document.createElement('div');
      pieceElement.className = 'captured-piece';
      pieceElement.style.backgroundColor = this.colors.bluePiece;
      const animalData = this.getAnimalData(piece.player, piece.animal);
      pieceElement.textContent = animalData ? animalData.symbol : '?';
      redCaptured.appendChild(pieceElement);
    });

    this.game.capturedPieces.blue.forEach((piece) => {
      const pieceElement = document.createElement('div');
      pieceElement.className = 'captured-piece';
      pieceElement.style.backgroundColor = this.colors.redPiece;
      const animalData = this.getAnimalData(piece.player, piece.animal);
      pieceElement.textContent = animalData ? animalData.symbol : '?';
      blueCaptured.appendChild(pieceElement);
    });
  }

  updateGameStatus() {
    if (!this.game) return;
    const currentPlayerElement = document.getElementById('currentPlayer');
    const gameModeElement = document.getElementById('gameMode');

    if (this.game.gameState === 'playing') {
      currentPlayerElement.textContent =
        this.game.currentPlayer === 'red' ? '红方回合' : '蓝方回合';
    } else if (this.game.gameState === 'finished') {
      const { winner } = this.game;
      currentPlayerElement.textContent = `游戏结束 - ${winner === 'red' ? '红方' : '蓝方'}获胜`;
    }

    gameModeElement.textContent =
      this.game.gameMode === 'single' ? '单人模式' : '联机模式';
  }

  showModal(title, message, showCancel = true, onConfirm = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalConfirm.textContent = '确定';
    modalCancel.style.display = showCancel ? 'inline-block' : 'none';

    const newModalConfirm = modalConfirm.cloneNode(true);
    modalConfirm.parentNode.replaceChild(newModalConfirm, modalConfirm);

    if (onConfirm) {
      newModalConfirm.addEventListener('click', () => {
        this.hideModal();
        onConfirm();
      });
    } else {
      newModalConfirm.addEventListener('click', () => {
        this.hideModal();
      });
    }

    modal.classList.remove('hidden');
  }

  showGameOverModal(winner, reason) {
    this.showModal(
      '游戏结束',
      `${winner === 'red' ? '红方' : '蓝方'}获胜！\n获胜原因：${reason}`,
      false
    );
  }

  showPlayerLeftModal(restartCallback) {
    this.showModal(
      '对手离开',
      '对手已离开游戏\n是否重新开始？',
      true,
      restartCallback
    );

    const modalConfirm = document.getElementById('modalConfirm');
    modalConfirm.textContent = '重新开始';
  }

  hideModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
  }
}

export default GameRenderer;
