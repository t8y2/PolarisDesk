# 贡献指南

感谢你考虑为 PolarisDesk 做出贡献！

## 🤝 如何贡献

### 提交代码

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 报告问题

如果你发现了 bug 或有功能建议，请在 [Issues](https://github.com/t8y2/PolarisDesk/issues) 中提交。

## 📝 开发规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 TypeScript 类型规范
- 提交前运行 `pnpm lint` 和 `pnpm typecheck`

## 🛠️ 开发环境设置

### 环境要求

- Node.js >= 18
- pnpm >= 8
- **macOS 开发者**: Xcode Command Line Tools（用于编译原生模块）
- **Windows 开发者**: Visual Studio Build Tools（用于编译原生模块）

```bash
# macOS 安装构建工具
xcode-select --install
```

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/t8y2/PolarisDesk.git
cd PolarisDesk

# 安装依赖（会自动编译原生模块）
pnpm install
```

> 📝 **关于原生模块**: 项目包含平台特定的原生 C++ 模块（如 macOS 的 UI Tree 访问），安装时会自动编译。详见 [原生模块文档](NATIVE_MODULES.md)。

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
├── native/             # 原生 C++ 模块
│   ├── mac/           # macOS 原生模块
│   └── win/           # Windows 原生模块
├── resources/          # 应用资源
├── build/             # 构建配置
└── dist/              # 构建输出
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
- **Mammoth.js** - Word 文档处理
- **pptxtojson** - PPT 文档解析
- **Better-SQLite3** - 高性能 SQLite 数据库
- **FFmpeg** - 视频处理

## ⚙️ 配置

应用配置文件位于用户数据目录：

- **Windows**: `%APPDATA%/polaris-desk`
- **macOS**: `~/Library/Application Support/polaris-desk`
- **Linux**: `~/.config/polaris-desk`
