export default class AnimalChess {
  constructor(emitter) {
    this.emitter = emitter;
    this.currentPlayer = 'red';
    this.gameMode = 'single';
    this.gameState = 'playing';
    this.selectedPiece = null;
    this.validMoves = [];
    this.capturedPieces = { red: [], blue: [] };
    this.moveHistory = [];

    this.animals = {
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

    this.terrainTypes = {
      normal: 0,
      river: 1,
      trap: 2,
      den: 3,
    };

    this.board = this.initializeBoard();
  }

  initializeBoard() {
    const board = Array(9)
      .fill(null)
      .map(() => Array(7).fill(null));

    const terrain = [
      [0, 0, 2, 3, 2, 0, 0],
      [0, 0, 0, 2, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 0, 0, 0],
      [0, 0, 2, 3, 2, 0, 0],
    ];

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        board[row][col] = {
          piece: null,
          terrain: terrain[row][col],
        };
      }
    }

    const bluePieces = [
      { animal: 'lion', row: 0, col: 0 },
      { animal: 'tiger', row: 0, col: 6 },
      { animal: 'dog', row: 1, col: 1 },
      { animal: 'cat', row: 1, col: 5 },
      { animal: 'rat', row: 2, col: 0 },
      { animal: 'leopard', row: 2, col: 2 },
      { animal: 'wolf', row: 2, col: 4 },
      { animal: 'elephant', row: 2, col: 6 },
    ];

    const redPieces = [
      { animal: 'elephant', row: 6, col: 0 },
      { animal: 'wolf', row: 6, col: 2 },
      { animal: 'leopard', row: 6, col: 4 },
      { animal: 'rat', row: 6, col: 6 },
      { animal: 'cat', row: 7, col: 1 },
      { animal: 'dog', row: 7, col: 5 },
      { animal: 'tiger', row: 8, col: 0 },
      { animal: 'lion', row: 8, col: 6 },
    ];

    bluePieces.forEach(({ animal, row, col }) => {
      board[row][col].piece = {
        animal,
        player: 'blue',
        power: this.animals.blue[animal].power,
      };
    });

    redPieces.forEach(({ animal, row, col }) => {
      board[row][col].piece = {
        animal,
        player: 'red',
        power: this.animals.red[animal].power,
      };
    });

    return board;
  }

  selectPiece(row, col) {
    if (this.gameState !== 'playing') return false;

    const cell = this.board[row][col];

    if (this.selectedPiece) {
      if (this.selectedPiece.row === row && this.selectedPiece.col === col) {
        this.selectedPiece = null;
        this.validMoves = [];
        this.emitter.emit('stateChanged', this.getGameState());
        return true;
      }

      if (
        this.isValidMove(
          this.selectedPiece.row,
          this.selectedPiece.col,
          row,
          col
        )
      ) {
        return this.makeMove(
          this.selectedPiece.row,
          this.selectedPiece.col,
          row,
          col
        );
      }
      if (cell.piece && cell.piece.player === this.currentPlayer) {
        this.selectedPiece = { row, col };
        this.validMoves = this.getValidMoves(row, col);
        this.emitter.emit('stateChanged', this.getGameState());
        return true;
      }
    } else if (cell.piece && cell.piece.player === this.currentPlayer) {
      this.selectedPiece = { row, col };
      this.validMoves = this.getValidMoves(row, col);
      this.emitter.emit('stateChanged', this.getGameState());
      return true;
    }

    return false;
  }

  getValidMoves(row, col) {
    const { piece } = this.board[row][col];
    if (!piece) return [];

    const moves = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dr, dc] of directions) {
      let newRow = row + dr;
      let newCol = col + dc;

      if (piece.animal === 'lion' || piece.animal === 'tiger') {
        const jumpResult = this.canJumpRiver(row, col, dr, dc);
        if (jumpResult) {
          newRow = jumpResult.row;
          newCol = jumpResult.col;
        }
      }

      if (this.isValidPosition(newRow, newCol)) {
        const targetCell = this.board[newRow][newCol];

        if (!targetCell.piece || targetCell.piece.player !== piece.player) {
          if (this.canCapture(piece, targetCell.piece, targetCell.terrain)) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    }

    return moves;
  }

  canJumpRiver(row, col, dr, dc) {
    const { piece } = this.board[row][col];
    if (piece.animal !== 'lion' && piece.animal !== 'tiger') return null;

    let checkRow = row + dr;
    let checkCol = col + dc;
    let jumpDistance = 0;

    while (this.isValidPosition(checkRow, checkCol)) {
      const checkCell = this.board[checkRow][checkCol];

      if (checkCell.terrain === 1) {
        if (checkCell.piece && checkCell.piece.animal === 'rat') {
          return null;
        }
        jumpDistance += 1;
        checkRow += dr;
        checkCol += dc;
      } else {
        if (jumpDistance > 0) {
          return { row: checkRow, col: checkCol };
        }
        break;
      }
    }

    return null;
  }

  canCapture(attackPiece, defendPiece, terrain) {
    if (!defendPiece) return true;

    if (terrain === 2 && defendPiece.player !== attackPiece.player) {
      return true;
    }

    if (attackPiece.animal === 'rat' && defendPiece.animal === 'elephant') {
      return true;
    }

    if (attackPiece.animal === 'elephant' && defendPiece.animal === 'rat') {
      return false;
    }

    if (terrain === 1) {
      if (attackPiece.animal === 'rat' && defendPiece.animal !== 'rat') {
        return false;
      }
      if (attackPiece.animal !== 'rat' && defendPiece.animal === 'rat') {
        return false;
      }
    }

    return attackPiece.power >= defendPiece.power;
  }

  isValidMove(fromRow, fromCol, toRow, toCol) {
    const { piece } = this.board[fromRow][fromCol];
    if (!piece) {
      console.log('isValidMove: 起始位置没有棋子');
      return false;
    }
    if (piece.player !== this.currentPlayer) {
      console.log(
        `isValidMove: 棋子属于${piece.player}，但当前玩家是${this.currentPlayer}`
      );
      return false;
    }

    if (!this.isValidPosition(toRow, toCol)) {
      console.log('isValidMove: 目标位置超出棋盘');
      return false;
    }

    const targetCell = this.board[toRow][toCol];
    if (targetCell.piece && targetCell.piece.player === piece.player) {
      console.log('isValidMove: 目标位置有己方棋子');
      return false;
    }

    if (targetCell.terrain === 3 && targetCell.piece) {
      if (targetCell.piece.player !== piece.player) return false;
    }

    const dr = toRow - fromRow;
    const dc = toCol - fromCol;

    if (Math.abs(dr) + Math.abs(dc) !== 1) {
      if (piece.animal === 'lion' || piece.animal === 'tiger') {
        const jumpResult = this.canJumpRiver(
          fromRow,
          fromCol,
          Math.sign(dr),
          Math.sign(dc)
        );
        if (
          !jumpResult ||
          jumpResult.row !== toRow ||
          jumpResult.col !== toCol
        ) {
          return false;
        }
      } else {
        return false;
      }
    }

    if (targetCell.terrain === 1) {
      if (piece.animal !== 'rat') return false;
    }

    return this.canCapture(piece, targetCell.piece, targetCell.terrain);
  }

  makeMove(fromRow, fromCol, toRow, toCol) {
    console.log(`makeMove调用: (${fromRow},${fromCol}) -> (${toRow},${toCol})`);
    console.log(`当前玩家: ${this.currentPlayer}`);

    const { piece } = this.board[fromRow][fromCol];
    if (piece) {
      console.log(`移动的棋子: ${piece.animal}, 玩家: ${piece.player}`);
    } else {
      console.log('错误：起始位置没有棋子');
      return false;
    }

    const isValid = this.isValidMove(fromRow, fromCol, toRow, toCol);
    console.log(`移动是否有效: ${isValid}`);

    if (!isValid) {
      console.log('移动无效，拒绝执行');
      return false;
    }

    const capturedPiece = this.board[toRow][toCol].piece;
    let attackerSurvives = true;

    if (capturedPiece) {
      console.log(
        `${piece.animal}(${piece.power}) 攻击 ${capturedPiece.animal}(${capturedPiece.power})`
      );

      if (piece.power === capturedPiece.power) {
        console.log('相同战力，同归于尽！');
        attackerSurvives = false;
        this.capturedPieces[this.currentPlayer].push(capturedPiece);
        this.capturedPieces[capturedPiece.player].push(piece);
      } else {
        this.capturedPieces[this.currentPlayer].push(capturedPiece);
        console.log(`${piece.animal} 成功吃掉 ${capturedPiece.animal}`);
      }
    }

    if (attackerSurvives) {
      this.board[toRow][toCol].piece = piece;
    } else {
      this.board[toRow][toCol].piece = null;
    }
    this.board[fromRow][fromCol].piece = null;

    this.moveHistory.push({
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece,
      captured: capturedPiece,
      player: this.currentPlayer,
    });

    this.selectedPiece = null;
    this.validMoves = [];

    const winner = this.checkWinCondition();
    if (winner) {
      this.gameState = 'finished';
      this.emitter.emit('stateChanged', this.getGameState());
      this.emitter.emit('gameOver', {
        winner,
        reason: this.getWinReason(winner),
      });
      return { success: true, winner, reason: this.getWinReason(winner) };
    }

    this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
    this.emitter.emit('stateChanged', this.getGameState());
    return { success: true };
  }

  checkWinCondition() {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const cell = this.board[row][col];
        if (cell.terrain === 3) {
          if (cell.piece) {
            const { player } = cell.piece;
            const enemyDen = player === 'red' ? row === 0 : row === 8;
            if (enemyDen) {
              return player;
            }
          }
        }
      }
    }

    const redPieces = this.getPiecesForPlayer('red');
    const bluePieces = this.getPiecesForPlayer('blue');

    if (redPieces.length === 0) return 'blue';
    if (bluePieces.length === 0) return 'red';

    return null;
  }

  getWinReason(winner) {
    const loser = winner === 'red' ? 'blue' : 'red';
    const loserPieces = this.getPiecesForPlayer(loser);

    if (loserPieces.length === 0) {
      return '消灭所有敌方棋子';
    }

    return '进入敌方兽穴';
  }

  getPiecesForPlayer(player) {
    const pieces = [];
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const { piece } = this.board[row][col];
        if (piece && piece.player === player) {
          pieces.push({ ...piece, row, col });
        }
      }
    }
    return pieces;
  }

  isValidPosition(row, col) {
    return row >= 0 && row < 9 && col >= 0 && col < 7;
  }

  resetGame() {
    this.board = this.initializeBoard();
    this.currentPlayer = 'red';
    this.gameState = 'playing';
    this.selectedPiece = null;
    this.validMoves = [];
    this.capturedPieces = { red: [], blue: [] };
    this.moveHistory = [];
    this.emitter.emit('stateChanged', this.getGameState());
  }

  getGameState() {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      gameState: this.gameState,
      selectedPiece: this.selectedPiece,
      validMoves: this.validMoves,
      capturedPieces: this.capturedPieces,
      moveHistory: this.moveHistory,
    };
  }
}
