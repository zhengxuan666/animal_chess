# 斗兽棋 | Animal Chess

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-latest-blueviolet.svg)](https://vitejs.dev/)

## 🚀 项目简介

这是一个基于 HTML5 和 WebSocket 实现的经典斗兽棋网页游戏。项目近期进行了**全面的架构重构**，旨在提供一个更加模块化、事件驱动且高度稳定的实时联机对战平台。无论是单人与智能 AI 对弈，还是与朋友在局域网内实时联机，都能获得流畅而愉快的游戏体验。

我们致力于打造一个代码结构清晰、易于维护和扩展的现代化 Web 应用。

## ✨ 主要特性

* **完整的斗兽棋规则实现**
  * 8 种动物棋子：象、狮、虎、豹、狼、狗、猫、鼠。
  * 特殊地形：河流、陷阱、兽穴。
  * 特殊规则：鼠克象、跳河、陷阱等。
* **智能 AI 对手**
  * 支持简单、中等、困难多种难度。
  * 基于 Minimax 算法实现，提供富有挑战性的单人游戏体验。
* **高性能实时联机模式**
  * 基于 WebSocket 的实时通信，确保毫秒级的游戏同步。
  * **智能房间管理系统**：支持创建、加入房间，并自动清理空闲房间，优化服务器资源。
  * **局域网联机支持**：服务器监听 `0.0.0.0`，方便在同一局域网内的设备进行对战。
  * **标准化错误处理**：提供清晰的错误反馈，增强系统健壮性。
* **现代化前端架构**
  * **事件驱动设计**：引入 `EventEmitter` 实现发布/订阅模式，大幅降低模块间耦合，提升代码可维护性。
  * **响应式设计**：完美适配桌面和移动设备，提供一致的用户体验。
  * **Canvas 渲染**：利用 HTML5 Canvas 绘制游戏界面，确保流畅的动画和高性能表现。
  * **触屏友好**：优化移动端操作体验。
* **高效开发工具链**
  * **Vite 开发服务器**：提供极速的热模块更新（HMR）和开发体验。
  * **ESLint & Prettier**：集成代码规范检查和格式化工具，保证代码质量和风格统一。

## 🛠️ 技术栈

* **前端**:
  * HTML5, CSS3, 原生 JavaScript
  * **Vite**: 极速前端开发服务器与打包工具
  * **EventEmitter**: 实现事件驱动架构
  * HTML5 Canvas: 游戏图形渲染
* **后端**:
  * Node.js
  * Express: 用于提供静态文件服务
  * `ws`: 高性能 WebSocket 库
* **开发工具**:
  * ESLint: 代码风格检查
  * Prettier: 代码格式化

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/animal-chess.git
cd animal-chess
```

### 2. 安装依赖

```bash
npm install
```

### 3. 运行项目

#### 生产环境 (Production)

在生产环境中，Node.js 服务器将同时提供前端静态文件和 WebSocket 服务。

```bash
npm start
```

服务器启动后，在浏览器中访问：`http://localhost:3001`

#### 开发环境 (Development)

为了获得最佳开发体验，您需要同时启动后端服务器和前端开发服务器。请打开两个终端窗口。

**终端 1: 启动后端服务器**

```bash
npm start
```

**终端 2: 启动前端开发服务器 (Vite)**

```bash
npm run dev
```

前端开发服务器启动后，通常会自动在浏览器中打开 `http://localhost:5173` (Vite 默认端口，可能会有变化)。前端会自动连接到运行在 `3001` 端口的后端服务器。

### 4. 代码质量与格式化

```bash
# 运行 ESLint 检查代码规范
npm run lint

# 运行 Prettier 自动格式化代码
npm run format
```

## 📂 项目结构

项目经过精心重构，采用清晰的模块化结构，便于理解和维护：

```
animal_chess/
├── client/                     # 前端应用 (由 Vite 构建和管理)
│   ├── css/                    # 样式文件
│   ├── js/                     # 核心 JavaScript 逻辑
│   │   ├── EventEmitter.js     # 事件发射器，实现事件驱动架构
│   │   ├── ai.js               # AI 逻辑
│   │   ├── gameLogic.js        # 游戏核心规则
│   │   ├── gameRenderer.js     # Canvas 渲染器
│   │   ├── multiplayer.js      # 联机模式客户端逻辑
│   │   └── main.js             # 前端入口文件，集成 EventEmitter
│   └── index.html              # 前端主页面
├── server/                     # 后端 Node.js 应用
│   └── src/                    # 后端源代码
│       ├── index.js            # 服务器入口文件 (Express & WebSocket 初始化)
│       ├── webSocketHandler.js # 负责 WebSocket 连接的建立与管理
│       ├── messageHandler.js   # 处理所有传入的 WebSocket 消息，路由到相应逻辑
│       ├── GameRoom.js         # 游戏房间类定义，管理房间内游戏状态和玩家
│       └── utils.js            # 通用工具函数 (如 ID 生成、辅助方法)
├── index.html                  # Vite 开发环境入口
├── vite.config.js              # Vite 配置文件
├── package.json                # 项目依赖和脚本配置
├── .eslintrc.json              # ESLint 配置文件
├── .prettierrc.json            # Prettier 配置文件
├── ANALYSIS.md                 # 重构分析文档
└── README.md                   # 项目说明文档
```

## 🎮 游戏规则

### 棋子战力

1. **鼠**（1） - 可以克制象，可以进入河流
2. **猫**（2） - 可以克制鼠
3. **狗**（3）
4. **狼**（4）
5. **豹**（5）
6. **虎**（6） - 可以跳跃河流
7. **狮**（7） - 可以跳跃河流
8. **象**（8） - 被鼠克制

### 特殊地形

* **河流**（蓝色）: 只有鼠可以进入，虎和狮可以跳跃。
* **陷阱**（红色）: 敌方棋子进入后战力变为 0。
* **兽穴**（金色）: 己方棋子不能进入，敌方进入即获胜。

### 获胜条件

1. 将任意己方棋子移动到敌方兽穴。
2. 吃掉敌方所有棋子。

## 📡 API 接口 (WebSocket)

客户端与服务器通过 WebSocket 进行实时通信，消息格式为 JSON 对象。

### 客户端发送消息类型

* `createRoom`: 创建新房间。
* `joinRoom`: 加入指定房间。
* `move`: 玩家移动棋子。
* `gameOver`: 客户端通知游戏结束。

### 服务器响应消息类型

* `roomCreated`: 房间创建成功，返回房间 ID。
* `roomJoined`: 加入房间成功，返回房间信息。
* `gameStart`: 游戏开始通知。
* `move`: 对手移动棋子。
* `gameOver`: 游戏结束通知，包含胜负信息。
* `error`: 发生错误时的统一响应，包含错误码和消息。
* `playerDisconnected`: 玩家断开连接通知。

## 🤝 贡献

我们非常欢迎社区的贡献！如果您有任何 Bug 报告、功能建议或代码改进，请随时通过 Issue 或 Pull Request 提交。

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。