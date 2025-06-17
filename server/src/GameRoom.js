const WebSocket = require('ws');

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

    this.broadcast({
      type: 'playerJoined',
      playerId,
      playerCount: this.players.length,
    });

    return true;
  }

  removePlayer(ws) {
    const playerIndex = this.players.findIndex((p) => p.ws === ws);
    if (playerIndex === -1) return false;

    const player = this.players[playerIndex];
    this.players.splice(playerIndex, 1);

    this.broadcast({
      type: 'playerLeft',
      playerId: player.playerId,
      playerCount: this.players.length,
    });

    // The decision to delete the room will be handled outside
    return this.players.length === 0;
  }

  broadcast(message, excludeWs = null) {
    this.players.forEach((player) => {
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
        currentPlayer: this.currentPlayer,
      });
    }
  }

  makeMove(playerId, move) {
    if (this.gameState !== 'playing') return false;

    const playerIndex = this.players.findIndex((p) => p.playerId === playerId);
    if (playerIndex !== this.currentPlayer) return false;

    // The move is broadcast to the other player.
    const otherPlayer = this.players[1 - playerIndex];
    if (otherPlayer && otherPlayer.ws.readyState === WebSocket.OPEN) {
      otherPlayer.ws.send(
        JSON.stringify({
          type: 'move',
          playerId,
          move,
        })
      );
    }

    this.currentPlayer = 1 - this.currentPlayer;
    return true;
  }

  getPlayer(ws) {
    return this.players.find((p) => p.ws === ws);
  }

  setPlayerReady(ws) {
    const player = this.getPlayer(ws);
    if (player) {
      player.ready = true;
    }

    const allReady =
      this.players.length === 2 && this.players.every((p) => p.ready);
    if (allReady) {
      this.startGame();
    }
  }
}

module.exports = GameRoom;
