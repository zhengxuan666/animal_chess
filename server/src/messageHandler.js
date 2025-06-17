const GameRoom = require('./GameRoom');
const { generateRoomId, generatePlayerId } = require('./utils'); // We will create this utils file later

const sendError = (ws, code, message) => {
  ws.send(
    JSON.stringify({
      type: 'error',
      code,
      message,
    })
  );
};

const handleCreateRoom = (ws, message, rooms, players) => {
  const roomId = generateRoomId();
  console.log(`<<<<< Room created: ${roomId} >>>>>`);
  const playerId = generatePlayerId();
  const room = new GameRoom(roomId);
  rooms.set(roomId, room);

  room.addPlayer(ws, playerId);
  players.set(ws, { roomId, playerId });

  ws.send(
    JSON.stringify({
      type: 'roomCreated',
      roomId,
      playerId,
    })
  );
};

const handleJoinRoom = (ws, message, rooms, players) => {
  const { roomId } = message;
  const room = rooms.get(roomId);

  if (!room) {
    return sendError(ws, 'ROOM_NOT_FOUND', '房间不存在或已关闭。');
  }

  if (room.players.length >= 2) {
    return sendError(ws, 'ROOM_FULL', '房间已满。');
  }

  const playerId = generatePlayerId();
  room.addPlayer(ws, playerId);
  players.set(ws, { roomId, playerId });

  ws.send(
    JSON.stringify({
      type: 'roomJoined',
      roomId,
      playerId,
    })
  );

  if (room.players.length === 2) {
    // The readiness check will trigger the game start
  }
  return undefined;
};

const handleReady = (ws, message, rooms, players) => {
  const playerData = players.get(ws);
  if (!playerData) return;

  const room = rooms.get(playerData.roomId);
  if (room) {
    room.setPlayerReady(ws);
  }
};

const handleMove = (ws, message, rooms, players) => {
  const playerData = players.get(ws);
  if (!playerData) return;

  const room = rooms.get(playerData.roomId);
  if (room) {
    room.makeMove(playerData.playerId, message.move);
  }
};

const handleGameOver = (ws, message, rooms, players) => {
  const playerData = players.get(ws);
  if (!playerData) return;

  const room = rooms.get(playerData.roomId);
  if (room) {
    room.broadcast({
      type: 'gameOver',
      winner: message.winner,
      reason: message.reason,
    });
  }
};

const messageHandlers = new Map([
  ['createRoom', handleCreateRoom],
  ['joinRoom', handleJoinRoom],
  ['ready', handleReady],
  ['move', handleMove],
  ['gameOver', handleGameOver],
]);

module.exports = { messageHandlers, sendError };
