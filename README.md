# Mint

> 个人专属工具集 — 基于 Electron 的离线桌面应用

一个集成了待办清单、Markdown 编辑器和系统信息查看的个人效率工具，所有数据完全本地存储，零网络请求，保护隐私安全。

## 功能特性

### 📋 待办清单
- 完整的增删改查（CRUD）操作
- 三种筛选模式：全部 / 未完成 / 已完成
- 数据持久化到本地磁盘，Electron/浏览器环境全兼容
- 键盘快捷操作，支持回车添加

### ✍️ Markdown 编辑器
- 左右分栏：左侧 CodeMirror 6 编辑器 + 右侧实时预览
- 文件管理：创建、打开、删除 Markdown 文件
- 自动保存，500ms 防抖
- GitHub-Flavored Markdown 支持
- 代码语法高亮（highlight.js）

### 🎨 主题系统
- 三套内置主题：薄荷绿 / 暗夜紫 / 暖白
- 首次加载自动检测系统颜色模式
- 主题偏好持久化保存
- CSS 自定义属性驱动的全量主题切换

### ⚙️ 设置页
- 主题切换器
- 存储目录路径查看与复制
- 系统信息（操作系统、CPU、Electron/Chromium/Node 版本）
- 应用版本信息

### 🏠 首页仪表盘
- 快速导航卡片
- 状态概览（工具数量、本地存储、网络请求数）

### 🖥️ 桌面体验
- macOS 隐藏标题栏 + 可折叠侧边栏（52px / 210px）
- 窗口拖拽区域
- 离线优先，完全本地运行

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 31 |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| CSS 框架 | Tailwind CSS 3 |
| Markdown 编辑 | CodeMirror 6 (`@uiw/react-codemirror`) |
| Markdown 渲染 | `marked` + `highlight.js` |
| 打包工具 | electron-builder 24 |
| 包管理器 | pnpm |

## 项目结构

```
electron-test/
├── index.html                    # 入口 HTML
├── package.json                  # 项目配置 + electron-builder 配置
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
├── tailwind.config.js            # Tailwind 主题配置
├── postcss.config.js             # PostCSS 配置
├── electron/                     # Electron 主进程 (JS)
│   ├── main.js                   # 主进程：窗口创建、IPC 处理
│   └── preload.js                # 预加载脚本：contextBridge API
├── src/                          # 渲染进程 (React + TypeScript)
│   ├── main.tsx                  # React 入口
│   ├── App.tsx                   # 根组件：侧边栏 + 路由
│   ├── App.css                   # Tailwind 指令 + Markdown 样式
│   ├── types/
│   │   └── electron.d.ts         # Window.electronAPI 类型声明
│   ├── hooks/
│   │   └── useFileStorage.ts     # 持久化存储 Hook
│   ├── themes/
│   │   ├── index.ts              # 主题定义
│   │   ├── ThemeContext.tsx       # 主题上下文
│   │   └── ThemeSwitcher.tsx     # 主题切换组件
│   └── tools/                    # 功能模块
│       ├── HomePage/             # 首页仪表盘
│       ├── TodoList/             # 待办清单
│       ├── MarkdownTool/         # Markdown 编辑器
│       └── Settings/             # 设置页
└── build/
    └── icon.png                  # 应用图标
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

启动 Vite 开发服务器和 Electron 窗口，支持热更新。

### 构建打包

```bash
# macOS (DMG)
pnpm build:mac

# Windows (NSIS 安装包 + 便携版)
pnpm build:win

# 全平台
pnpm build:all
```

构建产物输出到 `dist/` 目录。

## 架构设计

```
┌──────────────────────────────────────────────────┐
│              Electron Main Process                │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ BrowserWindow│  │  IPC Handlers             │  │
│  │ 1200×800     │  │  storage:read/write       │  │
│  │ hiddenInset  │  │  markdown:list/read/...   │  │
│  │ ctxIsolation │  │  system:cpu               │  │
│  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                     │                   │
│         │  Preload Bridge     │  File I/O         │
│         │  contextBridge      │  userData/        │
│         │                     │    data/*.json    │
│         │                     │    markdown/*.md  │
├─────────┼─────────────────────┼───────────────────┤
│         │     Renderer        │                   │
│         ▼                     ▼                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  React App (Vite + TypeScript)              │ │
│  │  ThemeProvider → App → Tool Pages           │ │
│  │  window.electronAPI.*                       │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**数据流：**
1. React 组件通过 `window.electronAPI.*` 调用预加载桥接层暴露的 API
2. 预加载脚本通过 `contextBridge` 安全地暴露 IPC 通道
3. 主进程 IPC 处理器执行文件 I/O 操作
4. `useFileStorage` Hook 提供统一存储接口，浏览器环境自动降级为 localStorage

**安全策略：**
- `contextIsolation: true` — 渲染进程无法直接访问 Node.js API
- `nodeIntegration: false` — 渲染进程禁用 Node.js
- 所有系统访问通过预加载桥接层，使用显式通道白名单
- 无外部网络请求，完全离线运行

## 数据存储

所有数据存储在系统用户数据目录：

| 数据类型 | 存储路径 |
|---|---|
| 待办清单 | `userData/data/todos.json` |
| Markdown 文件 | `userData/markdown/*.md` |
| 主题偏好 | localStorage |

- **macOS**: `~/Library/Application Support/Mint/`
- **Windows**: `%APPDATA%/Mint/`

## License

MIT