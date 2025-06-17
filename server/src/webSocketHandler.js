const { messageHandlers, sendError } = require('./messageHandler');

const rooms = new Map();
const players = new Map();

function handleConnection(ws) {
  console.log('新客户端连接');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const handler = messageHandlers.get(message.type);

      if (handler) {
        handler(ws, message, rooms, players);
      } else {
        sendError(
          ws,
          'UNKNOWN_MESSAGE_TYPE',
          `未知的消息类型: ${message.type}`
        );
      }
    } catch (error) {
      console.error('消息处理错误:', error);
      sendError(ws, 'INVALID_MESSAGE_FORMAT', '无效的消息格式。');
    }
  });

  ws.on('close', () => {
    console.log('客户端断开连接');
    const playerData = players.get(ws);
    if (playerData) {
      const room = rooms.get(playerData.roomId);
      if (room) {
        // removePlayer returns true if the room becomes empty
        if (room.removePlayer(ws)) {
          rooms.delete(room.id);
          console.log(`房间 ${room.id} 已被清理。`);
        }
      }
      players.delete(ws);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });
}

// Cleanup interval for empty rooms
setInterval(() => {
  const now = Date.now();
  Array.from(rooms.entries()).forEach(([roomId, room]) => {
    // If the room is empty and older than 5 minutes, remove it.
    if (room.players.length === 0 && now - room.createdAt > 300000) {
      rooms.delete(roomId);
      console.log(`过期房间 ${roomId} 已被清理。`);
    }
  });
}, 60000);

module.exports = (wss) => {
  wss.on('connection', handleConnection);
};
