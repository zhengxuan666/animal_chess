class AnimalChessAI {
    constructor(game, difficulty = 'medium') {
        this.game = game;
        this.difficulty = difficulty;
        this.player = 'blue';
        
        this.difficultySettings = {
            easy: { depth: 2, randomFactor: 0.3 },
            medium: { depth: 3, randomFactor: 0.15 },
            hard: { depth: 4, randomFactor: 0.05 }
        };
        
        this.pieceValues = {
            rat: 10,
            cat: 20,
            dog: 30,
            wolf: 40,
            leopard: 50,
            tiger: 60,
            lion: 70,
            elephant: 80
        };
        
        this.positionValues = this.initializePositionValues();
    }

    initializePositionValues() {
        const values = Array(9).fill(null).map(() => Array(7).fill(0));
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 7; col++) {
                const terrain = this.game.board[row][col].terrain;
                
                switch (terrain) {
                    case this.game.terrainTypes.den:
                        values[row][col] = row === 0 ? 1000 : -1000;
                        break;
                    case this.game.terrainTypes.trap:
                        values[row][col] = row < 4 ? 20 : -20;
                        break;
                    default:
                        const distanceToEnemyDen = Math.abs(row - 8) + Math.abs(col - 3);
                        values[row][col] = Math.max(0, 10 - distanceToEnemyDen);
                        break;
                }
            }
        }
        
        return values;
    }

    makeMove() {
        console.log('AI开始思考...');
        if (this.game.currentPlayer !== this.player || this.game.gameState !== 'playing') {
            console.log('不是AI的回合或游戏已结束');
            return false;
        }

        try {
            // 获取所有可能的移动
            const allMoves = this.getAllPossibleMoves(this.game, this.player);
            console.log(`AI找到 ${allMoves.length} 个可能的移动`);
            
            if (allMoves.length === 0) {
                console.log('AI无可用移动');
                return false;
            }
            
            let bestMove;
            
            // 使用简化的AI逻辑，避免复杂的minimax可能导致的卡顿
            if (this.difficulty === 'easy') {
                // 简单模式：随机选择
                bestMove = allMoves[Math.floor(Math.random() * allMoves.length)];
                console.log('简单AI：随机选择移动');
            } else {
                // 中等和困难模式：使用评估函数
                bestMove = this.findBestMoveSimple(allMoves);
                console.log('智能AI：选择最佳移动');
            }
            
            if (bestMove) {
                const { from, to } = bestMove;
                console.log(`AI移动: (${from.row},${from.col}) -> (${to.row},${to.col})`);
                
                const result = this.game.makeMove(from.row, from.col, to.row, to.col);
                console.log('AI移动结果:', result);
                
                return result;
            }
            
        } catch (error) {
            console.error('AI移动出错:', error);
            // 出错时随机选择一个移动
            const allMoves = this.getAllPossibleMoves(this.game, this.player);
            if (allMoves.length > 0) {
                const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
                const { from, to } = randomMove;
                console.log(`AI出错后随机移动: (${from.row},${from.col}) -> (${to.row},${to.col})`);
                return this.game.makeMove(from.row, from.col, to.row, to.col);
            }
        }
        
        console.log('AI找不到有效移动');
        return false;
    }

    findBestMoveSimple(moves) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of moves) {
            let score = 0;
            const { from, to } = move;
            
            // 评估这个移动
            const fromPiece = this.game.board[from.row][from.col].piece;
            const toPiece = this.game.board[to.row][to.col].piece;
            
            // 如果能吃子，加分
            if (toPiece) {
                const attackValue = this.pieceValues[fromPiece.animal];
                const defendValue = this.pieceValues[toPiece.animal];
                
                if (fromPiece.power === toPiece.power) {
                    // 同归于尽，评估得失
                    score += (defendValue - attackValue) * 0.5; // 减少分数，因为会损失己方棋子
                    console.log(`AI考虑同归于尽: ${fromPiece.animal} vs ${toPiece.animal}，得分 +${(defendValue - attackValue) * 0.5}`);
                } else if (fromPiece.power > toPiece.power) {
                    // 能吃掉对方
                    score += defendValue * 2;
                    console.log(`AI考虑吃掉 ${toPiece.animal}，得分 +${defendValue * 2}`);
                } else {
                    // 会被吃掉，大幅减分
                    score -= attackValue * 3;
                    console.log(`AI发现会被吃掉，得分 -${attackValue * 3}`);
                }
            }
            
            // 如果移向敌方区域，加分
            if (to.row > from.row) {
                score += 10;
            }
            
            // 如果接近敌方兽穴，大大加分
            const distanceToDen = Math.abs(to.row - 8) + Math.abs(to.col - 3);
            score += (10 - distanceToDen) * 5;
            
            // 随机因子
            score += (Math.random() - 0.5) * 20;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        console.log(`最佳移动得分: ${bestScore}`);
        return bestMove;
    }

    minimax(gameState, depth, alpha, beta, isMaximizing) {
        if (depth === 0 || gameState.gameState === 'finished') {
            return { score: this.evaluatePosition(gameState) };
        }

        const currentPlayer = isMaximizing ? this.player : (this.player === 'red' ? 'blue' : 'red');
        const moves = this.getAllPossibleMoves(gameState, currentPlayer);
        
        if (moves.length === 0) {
            return { score: isMaximizing ? -Infinity : Infinity };
        }

        let bestMove = null;
        let bestScore = isMaximizing ? -Infinity : Infinity;

        for (const move of moves) {
            const newGameState = this.simulateMove(gameState, move);
            const result = this.minimax(newGameState, depth - 1, alpha, beta, !isMaximizing);
            
            const settings = this.difficultySettings[this.difficulty];
            const randomFactor = (Math.random() - 0.5) * settings.randomFactor * 100;
            const score = result.score + randomFactor;

            if (isMaximizing) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, score);
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                beta = Math.min(beta, score);
            }

            if (beta <= alpha) {
                break;
            }
        }

        return { score: bestScore, move: bestMove };
    }

    getAllPossibleMoves(gameState, player) {
        const moves = [];
        let pieceCount = 0;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 7; col++) {
                const piece = gameState.board[row][col].piece;
                if (piece && piece.player === player) {
                    pieceCount++;
                    console.log(`检查棋子 ${piece.animal} 在 (${row},${col})`);
                    const validMoves = this.getValidMovesForPiece(gameState, row, col);
                    console.log(`棋子 ${piece.animal} 有 ${validMoves.length} 个可移动位置`);
                    validMoves.forEach(move => {
                        moves.push({
                            from: { row, col },
                            to: { row: move.row, col: move.col }
                        });
                    });
                }
            }
        }
        
        console.log(`玩家 ${player} 有 ${pieceCount} 个棋子，总共 ${moves.length} 个可能移动`);
        return moves;
    }

    getValidMovesForPiece(gameState, row, col) {
        const piece = gameState.board[row][col].piece;
        if (!piece) return [];
        
        const moves = [];
        const directions = [[-1,0], [1,0], [0,-1], [0,1]];
        
        for (const [dr, dc] of directions) {
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
                    // 检查是否能进入河流
                    if (targetCell.terrain === 1 && piece.animal !== 'rat') {
                        console.log(`棋子 ${piece.animal} 不能进入河流`);
                        continue;
                    }
                    
                    if (this.canCapture(gameState, piece, targetCell.piece, targetCell.terrain)) {
                        moves.push({ row: newRow, col: newCol });
                        console.log(`有效移动: (${row},${col}) -> (${newRow},${newCol})`);
                    } else {
                        console.log(`无法吃掉目标位置的棋子`);
                    }
                }
            }
        }
        
        return moves;
    }

    canJumpRiver(gameState, row, col, dr, dc) {
        const piece = gameState.board[row][col].piece;
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
                jumpDistance++;
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

    simulateMove(gameState, move) {
        const newGameState = JSON.parse(JSON.stringify(gameState));
        
        const piece = newGameState.board[move.from.row][move.from.col].piece;
        const capturedPiece = newGameState.board[move.to.row][move.to.col].piece;
        
        newGameState.board[move.to.row][move.to.col].piece = piece;
        newGameState.board[move.from.row][move.from.col].piece = null;
        
        newGameState.currentPlayer = newGameState.currentPlayer === 'red' ? 'blue' : 'red';
        
        return newGameState;
    }

    evaluatePosition(gameState) {
        let score = 0;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = gameState.board[row][col];
                const piece = cell.piece;
                
                if (piece) {
                    const pieceValue = this.pieceValues[piece.animal];
                    const positionValue = this.positionValues[row][col];
                    const multiplier = piece.player === this.player ? 1 : -1;
                    
                    score += (pieceValue + positionValue) * multiplier;
                    
                    if (cell.terrain === 3) {
                        const enemyDen = (piece.player === 'red' && row === 0) || 
                                       (piece.player === 'blue' && row === 8);
                        if (enemyDen) {
                            score += 10000 * multiplier;
                        }
                    }
                    
                    if (cell.terrain === 2) {
                        const enemyTrap = (piece.player === 'red' && row < 4) || 
                                         (piece.player === 'blue' && row > 4);
                        if (enemyTrap) {
                            score += 50 * multiplier;
                        }
                    }
                }
            }
        }
        
        const myPieces = this.getPiecesForPlayer(gameState, this.player);
        const enemyPieces = this.getPiecesForPlayer(gameState, this.player === 'red' ? 'blue' : 'red');
        
        score += (myPieces.length - enemyPieces.length) * 100;
        
        const mobilityScore = this.getAllPossibleMoves(gameState, this.player).length * 5;
        score += mobilityScore;
        
        return score;
    }

    getPiecesForPlayer(gameState, player) {
        const pieces = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 7; col++) {
                const piece = gameState.board[row][col].piece;
                if (piece && piece.player === player) {
                    pieces.push({ ...piece, row, col });
                }
            }
        }
        return pieces;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }
}