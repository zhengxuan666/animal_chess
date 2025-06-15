const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../../client')));

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});

const wss = new WebSocket.Server({ server });

const rooms = new Map();
const players = new Map();

class GameRoom {
    constructor(id) {
        this.id = id;
        this.players = [];
        this.gameState = null;
        this.currentPlayer = 0;
        this.createdAt = Date.now();
    }

    addPlayer(ws, playerId) {
        if (this.players.length >= 2) return false;
        
        this.players.push({ ws, playerId, ready: false });
        players.set(ws, { roomId: this.id, playerId });
        
        this.broadcast({
            type: 'playerJoined',
            playerId,
            playerCount: this.players.length
        });
        
        return true;
    }

    removePlayer(ws) {
        const playerIndex = this.players.findIndex(p => p.ws === ws);
        if (playerIndex === -1) return;
        
        const player = this.players[playerIndex];
        this.players.splice(playerIndex, 1);
        players.delete(ws);
        
        this.broadcast({
            type: 'playerLeft',
            playerId: player.playerId,
            playerCount: this.players.length
        });
        
        if (this.players.length === 0) {
            rooms.delete(this.id);
        }
    }

    broadcast(message, excludeWs = null) {
        this.players.forEach(player => {
            if (player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        });
    }

    startGame() {
        if (this.players.length === 2) {
            this.gameState = 'playing';
            this.broadcast({
                type: 'gameStart',
                currentPlayer: this.currentPlayer
            });
        }
    }

    makeMove(playerId, move) {
        if (this.gameState !== 'playing') return false;
        
        const playerIndex = this.players.findIndex(p => p.playerId === playerId);
        if (playerIndex !== this.currentPlayer) return false;
        
        this.broadcast({
            type: 'move',
            playerId,
            move,
            currentPlayer: this.currentPlayer
        });
        
        this.currentPlayer = 1 - this.currentPlayer;
        return true;
    }
}

function generateRoomId() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function generatePlayerId() {
    return Math.random().toString(36).substr(2, 8);
}

wss.on('connection', (ws) => {
    console.log('新客户端连接');
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'createRoom':
                    const roomId = generateRoomId();
                    const playerId = generatePlayerId();
                    const room = new GameRoom(roomId);
                    rooms.set(roomId, room);
                    
                    room.addPlayer(ws, playerId);
                    
                    ws.send(JSON.stringify({
                        type: 'roomCreated',
                        roomId,
                        playerId
                    }));
                    break;
                    
                case 'joinRoom':
                    const targetRoom = rooms.get(message.roomId);
                    if (!targetRoom) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '房间不存在'
                        }));
                        break;
                    }
                    
                    const newPlayerId = generatePlayerId();
                    if (targetRoom.addPlayer(ws, newPlayerId)) {
                        ws.send(JSON.stringify({
                            type: 'roomJoined',
                            roomId: message.roomId,
                            playerId: newPlayerId
                        }));
                        
                        if (targetRoom.players.length === 2) {
                            targetRoom.startGame();
                        }
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '房间已满'
                        }));
                    }
                    break;
                    
                case 'ready':
                    const playerData = players.get(ws);
                    if (playerData) {
                        const gameRoom = rooms.get(playerData.roomId);
                        if (gameRoom) {
                            const player = gameRoom.players.find(p => p.playerId === playerData.playerId);
                            if (player) {
                                player.ready = true;
                                
                                const allReady = gameRoom.players.length === 2 && 
                                               gameRoom.players.every(p => p.ready);
                                
                                if (allReady) {
                                    gameRoom.startGame();
                                }
                            }
                        }
                    }
                    break;
                    
                case 'move':
                    const movePlayerData = players.get(ws);
                    if (movePlayerData) {
                        const moveRoom = rooms.get(movePlayerData.roomId);
                        if (moveRoom) {
                            moveRoom.makeMove(movePlayerData.playerId, message.move);
                        }
                    }
                    break;
                    
                case 'gameOver':
                    const gameOverPlayerData = players.get(ws);
                    if (gameOverPlayerData) {
                        const gameOverRoom = rooms.get(gameOverPlayerData.roomId);
                        if (gameOverRoom) {
                            gameOverRoom.broadcast({
                                type: 'gameOver',
                                winner: message.winner,
                                reason: message.reason
                            });
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('消息处理错误:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: '服务器错误'
            }));
        }
    });
    
    ws.on('close', () => {
        console.log('客户端断开连接');
        const playerData = players.get(ws);
        if (playerData) {
            const room = rooms.get(playerData.roomId);
            if (room) {
                room.removePlayer(ws);
            }
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
    });
});

setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
        if (room.players.length === 0 && now - room.createdAt > 300000) {
            rooms.delete(roomId);
        }
    }
}, 60000);