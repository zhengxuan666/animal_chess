const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const webSocketHandler = require('./webSocketHandler');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../../client')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

webSocketHandler(wss);

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
