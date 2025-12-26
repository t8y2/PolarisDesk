# PolarisDesk

[English](./README.en.md) | 简体中文

<div align="center">
  <img src="resources/icon.png" alt="PolarisDesk Logo" width="120" height="120">
  <p>一个现代化的 AI 桌面助手应用</p>
  <p><em>如北极星般，为您指引方向</em></p>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Electron](https://img.shields.io/badge/Electron-37.x-47848F?logo=electron)](https://www.electronjs.org/)
  [![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
</div>

## 💫 关于 PolarisDesk

PolarisDesk（北极星桌面）寓意如同北极星为航海者指引方向一样，为你的日常工作提供智能指引和辅助。这是一款 **AI 驱动**的桌面助手应用，无论是文档处理、代码编写还是问题解答，PolarisDesk 都能成为你可靠的智能伙伴。

### 🤖 支持的 AI 服务商

<div align="center">

| OpenAI | Anthropic | Google |
|:------:|:---------:|:------:|
| **DeepSeek** | **Moonshot** | **OpenRouter** |
| **SiliconCloud** | **Ollama** | **智谱 AI** |

支持自定义兼容 OpenAI API 格式的服务

</div>

## 📸 应用预览

<table>
  <tr>
    <td width="50%">
      <h3 align="center">主界面</h3>
      <img src="docs/images/main-screenshot.png" alt="主界面">
    </td>
    <td width="50%">
      <h3 align="center">设置界面</h3>
      <img src="docs/images/settings-screenshot.png" alt="设置界面">
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="center">悬浮窗</h3>
      <img src="docs/images/float-screenshot.png" alt="悬浮窗">
    </td>
    <td width="50%">
      <h3 align="center">功能演示</h3>
      <img src="docs/images/demo.gif" alt="功能演示">
    </td>
  </tr>
</table>

## ✨ 特性

- 🤖 **AI 对话** - 支持多种 AI 模型的智能对话
- 🎨 **现代界面** - 基于 Naive UI 的精美用户界面
- 💬 **悬浮窗口** - 便捷的悬浮聊天窗口
- 📝 **Markdown 渲染** - 支持代码高亮、数学公式（KaTeX）
- 📄 **文档处理** - 支持 PDF、PPT 等文档解析
- 🎬 **视频压缩** - 内置 FFmpeg 视频处理功能
- 💾 **本地存储** - 使用 SQLite 本地数据库
- ⚡ **性能优化** - 代码分割、懒加载、虚拟滚动
- 🌐 **国际化** - 支持中英文双语切换

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装

```bash
# 克隆项目
git clone https://github.com/t8y2/PolarisDesk.git
cd PolarisDesk

# 安装依赖
pnpm install
```

### 开发

```bash
# 启动开发服务器
pnpm dev
```

### 构建

```bash
# 构建应用
pnpm build

# 构建 Windows 版本
pnpm build:win

# 构建 macOS 版本
pnpm build:mac

# 构建 Linux 版本
pnpm build:linux
```

## 🛠️ 技术栈

### 核心框架
- **Electron** - 跨平台桌面应用框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具

### UI 组件
- **Naive UI** - Vue 3 组件库
- **UnoCSS** - 即时按需原子化 CSS 引擎
- **Vue Virtual Scroller** - 虚拟滚动优化

### 功能库
- **Markdown-it** - Markdown 解析器
- **Highlight.js** - 代码语法高亮
- **KaTeX** - 数学公式渲染
- **PDF.js** - PDF 文档渲染
- **Better-SQLite3** - 高性能 SQLite 数据库
- **FFmpeg** - 视频处理

## 📁 项目结构

```
PolarisDesk/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── modules/    # 功能模块
│   │   ├── services/   # 服务层
│   │   └── utils/      # 工具函数
│   ├── preload/        # 预加载脚本
│   └── renderer/       # 渲染进程（Vue 应用）
│       ├── components/ # Vue 组件
│       ├── views/      # 页面视图
│       ├── stores/     # Pinia 状态管理
│       └── utils/      # 工具函数
├── resources/          # 应用资源
├── build/             # 构建配置
└── dist/              # 构建输出
```

## ⚙️ 配置

应用配置文件位于用户数据目录：

- **Windows**: `%APPDATA%/polaris-desk`
- **macOS**: `~/Library/Application Support/polaris-desk`
- **Linux**: `~/.config/polaris-desk`

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 开发规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 TypeScript 类型规范
- 提交前运行 `pnpm lint` 和 `pnpm typecheck`

## 🚀 后期规划

| 功能 | 描述 | 状态 |
|------|------|------|
| 🤖 AI 驱动命令行 | AI 理解意图并执行系统命令 | 规划中 |
| 🔌 插件系统 | 支持第三方插件扩展 | 规划中 |
| 🌐 多语言支持 | 国际化界面 | ✅ 已完成 |
| 🎙️ 语音交互 | 语音输入输出 | 规划中 |
| 🎨 主题支持 | 支持更多主题扩展 | 规划中 |
| 💡 More | 更多 | 规划中 |


欢迎开发者提交 PR 参与贡献！

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。


## 📮 联系方式

- 项目主页: [https://github.com/t8y2/PolarisDesk](https://github.com/t8y2/PolarisDesk)
- 问题反馈: [Issues](https://github.com/t8y2/PolarisDesk/issues)

---

<div align="center">
  Made with ❤️ by PolarisDesk
</div>
