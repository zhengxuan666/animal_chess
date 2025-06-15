# 斗兽棋游戏

一个基于HTML5和WebSocket的斗兽棋网页游戏，支持单人和联机模式。

## 功能特点

- ✅ **完整的斗兽棋规则实现**
  - 8种动物棋子：象、狮、虎、豹、狼、狗、猫、鼠
  - 特殊地形：河流、陷阱、兽穴
  - 特殊规则：鼠克象、跳河、陷阱等

- ✅ **单人模式**
  - 智能AI对手（简单/中等/困难）
  - Minimax算法实现

- ✅ **联机模式**
  - 基于WebSocket的实时对战
  - 房间系统，支持创建和加入房间
  - 无需数据库，服务器内存存储

- ✅ **响应式设计**
  - 支持桌面和移动设备
  - Canvas绘制，流畅的游戏体验
  - 触屏友好的操作

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (原生)
- **后端**: Node.js, Express, WebSocket (ws)
- **渲染**: HTML5 Canvas
- **部署**: 静态文件 + Node.js服务器

## 安装和运行

### 1. 安装依赖
\`\`\`bash
npm install
\`\`\`

### 2. 启动服务器
\`\`\`bash
npm start
\`\`\`

### 3. 访问游戏
打开浏览器访问：http://localhost:3001

## 开发模式

### 启动后端服务器
\`\`\`bash
npm run dev
\`\`\`

### 启动前端开发服务器（可选）
\`\`\`bash
npm run serve
\`\`\`

## 游戏规则

### 棋子战力
1. 鼠（1） - 可以克制象，可以进入河流
2. 猫（2） - 可以克制鼠
3. 狗（3）
4. 狼（4）
5. 豹（5）
6. 虎（6） - 可以跳跃河流
7. 狮（7） - 可以跳跃河流
8. 象（8） - 被鼠克制

### 特殊地形
- **河流（蓝色）**: 只有鼠可以进入，虎和狮可以跳跃
- **陷阱（红色）**: 敌方棋子进入后战力变为0
- **兽穴（金色）**: 己方棋子不能进入，敌方进入即获胜

### 获胜条件
1. 将任意己方棋子移动到敌方兽穴
2. 吃掉敌方所有棋子

## 文件结构

\`\`\`
animal_chess/
├── client/                 # 前端文件
│   ├── index.html         # 主页面
│   ├── css/
│   │   └── style.css      # 样式文件
│   └── js/
│       ├── gameLogic.js   # 游戏逻辑核心
│       ├── gameRenderer.js # Canvas渲染器
│       ├── ai.js          # AI对手实现
│       ├── multiplayer.js # 联机客户端
│       └── main.js        # 主程序入口
├── server/                # 后端文件
│   └── src/
│       └── server.js      # WebSocket服务器
├── package.json           # 项目配置
└── README.md             # 说明文档
\`\`\`

## API接口

### WebSocket消息格式

#### 客户端发送
- \`createRoom\` - 创建房间
- \`joinRoom\` - 加入房间
- \`move\` - 移动棋子
- \`gameOver\` - 游戏结束

#### 服务器响应
- \`roomCreated\` - 房间创建成功
- \`roomJoined\` - 加入房间成功
- \`gameStart\` - 游戏开始
- \`move\` - 对手移动
- \`gameOver\` - 游戏结束
- \`error\` - 错误消息

## 部署

### 生产环境部署
1. 设置环境变量 \`PORT\`
2. 运行 \`npm start\`
3. 服务器会同时提供静态文件和WebSocket服务

### Docker部署（可选）
\`\`\`dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
\`\`\`

## 贡献

欢迎提交Issue和Pull Request来改进游戏！

## 许可证

MIT License