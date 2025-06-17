class AnimalChessAI {
  constructor(emitter, difficulty = 'medium') {
    this.emitter = emitter;
    this.difficulty = difficulty;
    this.player = 'blue';
    this.game = null;

    this.difficultySettings = {
      easy: { depth: 2, randomFactor: 0.3 },
      medium: { depth: 3, randomFactor: 0.15 },
      hard: { depth: 4, randomFactor: 0.05 },
    };

    this.pieceValues = {
      rat: 10,
      cat: 20,
      dog: 30,
      wolf: 40,
      leopard: 50,
      tiger: 60,
      lion: 70,
      elephant: 80,
    };

    this.positionValues = null;

    this.emitter.on('stateChanged', (gameState) => {
      this.game = gameState;
      if (!this.positionValues) {
        this.initializePositionValues();
      }
      if (
        this.game.currentPlayer === this.player &&
        this.game.gameState === 'playing'
      ) {
        setTimeout(() => this.makeMove(), 500);
      }
    });
  }

  initializePositionValues() {
    const values = Array(9)
      .fill(null)
      .map(() => Array(7).fill(0));

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const { terrain } = this.game.board[row][col];

        switch (terrain) {
          case 3: // den
            values[row][col] = row === 0 ? 1000 : -1000;
            break;
          case 2: // trap
            values[row][col] = row < 4 ? 20 : -20;
            break;
          default: {
            const distanceToEnemyDen = Math.abs(row - 8) + Math.abs(col - 3);
            values[row][col] = Math.max(0, 10 - distanceToEnemyDen);
            break;
          }
        }
      }
    }

    this.positionValues = values;
  }

  makeMove() {
    console.log('AI开始思考...');
    if (
      !this.game ||
      this.game.currentPlayer !== this.player ||
      this.game.gameState !== 'playing'
    ) {
      console.log('不是AI的回合或游戏已结束');
      return false;
    }

    try {
      const allMoves = this.getAllPossibleMoves(this.game, this.player);
      console.log(`AI找到 ${allMoves.length} 个可能的移动`);

      if (allMoves.length === 0) {
        console.log('AI无可用移动');
        return false;
      }

      let bestMove;

      if (this.difficulty === 'easy') {
        bestMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        console.log('简单AI：随机选择移动');
      } else {
        bestMove = this.findBestMoveSimple(allMoves);
        console.log('智能AI：选择最佳移动');
      }

      if (bestMove) {
        const { from, to } = bestMove;
        console.log(
          `AI移动: (${from.row},${from.col}) -> (${to.row},${to.col})`
        );
        this.emitter.emit('aiMoved', { from, to });
        return true;
      }
    } catch (error) {
      console.error('AI移动出错:', error);
      const allMoves = this.getAllPossibleMoves(this.game, this.player);
      if (allMoves.length > 0) {
        const randomMove =
          allMoves[Math.floor(Math.random() * allMoves.length)];
        const { from, to } = randomMove;
        console.log(
          `AI出错后随机移动: (${from.row},${from.col}) -> (${to.row},${to.col})`
        );
        this.emitter.emit('aiMoved', { from, to });
        return true;
      }
    }

    console.log('AI找不到有效移动');
    return false;
  }

  findBestMoveSimple(moves) {
    let bestMove = null;
    let bestScore = -Infinity;

    moves.forEach((move) => {
      let score = 0;
      const { from, to } = move;

      const fromPiece = this.game.board[from.row][from.col].piece;
      const toPiece = this.game.board[to.row][to.col].piece;

      if (toPiece) {
        const attackValue = this.pieceValues[fromPiece.animal];
        const defendValue = this.pieceValues[toPiece.animal];

        if (fromPiece.power === toPiece.power) {
          score += (defendValue - attackValue) * 0.5;
        } else if (fromPiece.power > toPiece.power) {
          score += defendValue * 2;
        } else {
          score -= attackValue * 3;
        }
      }

      if (to.row > from.row) {
        score += 10;
      }

      const distanceToDen = Math.abs(to.row - 8) + Math.abs(to.col - 3);
      score += (10 - distanceToDen) * 5;

      score += (Math.random() - 0.5) * 20;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    });

    return bestMove;
  }

  getAllPossibleMoves(gameState, player) {
    const moves = [];
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const { piece } = gameState.board[row][col];
        if (piece && piece.player === player) {
          const validMoves = this.getValidMovesForPiece(gameState, row, col);
          validMoves.forEach((move) => {
            moves.push({
              from: { row, col },
              to: { row: move.row, col: move.col },
            });
          });
        }
      }
    }
    return moves;
  }

  getValidMovesForPiece(gameState, row, col) {
    const { piece } = gameState.board[row][col];
    if (!piece) return [];

    const moves = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (let i = 0; i < directions.length; i += 1) {
      const [dr, dc] = directions[i];
      let newRow = row + dr;
      let newCol = col + dc;

      if (piece.animal === 'lion' || piece.animal === 'tiger') {
        const jumpResult = this.canJumpRiver(gameState, row, col, dr, dc);
        if (jumpResult) {
          newRow = jumpResult.row;
          newCol = jumpResult.col;
        }
      }

      if (this.isValidPosition(newRow, newCol)) {
        const targetCell = gameState.board[newRow][newCol];

        if (!targetCell.piece || targetCell.piece.player !== piece.player) {
          if (targetCell.terrain === 1 && piece.animal !== 'rat') {
            continue;
          }

          if (
            this.canCapture(
              gameState,
              piece,
              targetCell.piece,
              targetCell.terrain
            )
          ) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    }

    return moves;
  }

  canJumpRiver(gameState, row, col, dr, dc) {
    const { piece } = gameState.board[row][col];
    if (piece.animal !== 'lion' && piece.animal !== 'tiger') return null;

    let checkRow = row + dr;
    let checkCol = col + dc;
    let jumpDistance = 0;

    while (this.isValidPosition(checkRow, checkCol)) {
      const checkCell = gameState.board[checkRow][checkCol];

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

  canCapture(gameState, attackPiece, defendPiece, terrain) {
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

  isValidPosition(row, col) {
    return row >= 0 && row < 9 && col >= 0 && col < 7;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }
}

export default AnimalChessAI;
