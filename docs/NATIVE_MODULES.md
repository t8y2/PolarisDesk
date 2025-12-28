# 原生模块构建指南

## 概述

PolarisDesk 使用原生 C++ 模块来实现平台特定功能（如 macOS 的 UI Tree 访问）。

## 目录结构

```
native/
├── mac/          # macOS 原生模块
│   ├── ui-tree.mm       # Objective-C++ 实现
│   ├── ui-tree.h        # 头文件
│   ├── binding.gyp      # node-gyp 构建配置
│   └── package.json     # 模块依赖
└── win/          # Windows 原生模块
    ├── ui-tree.cpp      # C++ 实现
    ├── ui-tree.h        # 头文件
    ├── binding.gyp      # node-gyp 构建配置
    └── package.json     # 模块依赖
```

## 构建流程

### 自动构建

项目已配置自动构建流程：

```bash
# 安装依赖时自动构建
pnpm install

# 手动重新构建所有原生模块
pnpm run rebuild

# 只构建原生模块
pnpm run rebuild:native

# 只构建 macOS 模块
pnpm run rebuild:native:mac

# 只构建 Windows 模块
pnpm run rebuild:native:win
```

### 手动构建（macOS）

如果自动构建失败，可以手动构建：

```bash
cd native/mac
npm install
```

### 手动构建（Windows）

如果自动构建失败，可以手动构建：

```bash
cd native/win
npm install
```

## 前置要求

### macOS

- Xcode Command Line Tools
- Node.js 开发环境
- Python 3（node-gyp 需要）

安装 Xcode Command Line Tools：

```bash
xcode-select --install
```

### Windows

- Visual Studio 2019 或更高版本（或 Visual Studio Build Tools）
- Windows 10 SDK 或更高版本
- Node.js 开发环境
- Python 3（node-gyp 需要）

安装 Visual Studio Build Tools：

1. 下载 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
2. 安装时选择 "使用 C++ 的桌面开发" 工作负载
3. 确保包含 Windows 10 SDK

或使用 Chocolatey 安装：

```powershell
choco install visualstudio2019buildtools visualstudio2019-workload-vctools windows-sdk-10.0
```

## 打包配置

原生模块在 `electron-builder.yml` 中的配置：

1. **包含编译后的 .node 文件**：

   ```yaml
   files:
     - 'native/**/*.node'
   ```

2. **排除源代码和依赖**：

   ```yaml
   files:
     - '!native/**/node_modules/**'
     - '!native/**/*.{mm,h,cc,cpp}'
   ```

3. **解压到 asar 外部**（提高加载性能）：
   ```yaml
   asarUnpack:
     - native/**/*.node
   ```

## 开发注意事项

1. **跨平台兼容**：原生模块只在对应平台可用，需要提供降级方案
2. **版本匹配**：确保 Electron 版本与 node-gyp 编译的 Node.js ABI 版本匹配
3. **CI/CD**：在 CI 环境中需要安装对应平台的构建工具

## 平台特定说明

### macOS

- 使用 Accessibility API 访问 UI 元素
- 需要用户授予辅助功能权限
- 在系统偏好设置 > 安全性与隐私 > 隐私 > 辅助功能中授权

### Windows

- 使用 UI Automation API 访问 UI 元素
- 不需要特殊权限，默认可用
- 支持 Windows 7 及以上版本（需要 `_WIN32_WINNT=0x0601`）
- 使用 COM 组件，需要初始化 COM 环境

## 故障排查

### 编译失败

1. 检查是否安装了构建工具（Xcode/Visual Studio）
2. 清理并重新构建：

   **macOS:**

   ```bash
   cd native/mac
   rm -rf build node_modules
   npm install
   ```

   **Windows:**

   ```powershell
   cd native/win
   Remove-Item -Recurse -Force build, node_modules
   npm install
   ```

### 运行时加载失败

1. 检查 `.node` 文件是否存在：

   **macOS:**

   ```bash
   ls native/mac/build/Release/ui_tree_mac.node
   ```

   **Windows:**

   ```powershell
   dir native\win\build\Release\ui_tree_win.node
   ```

2. 检查 Electron 版本是否匹配：
   ```bash
   pnpm run rebuild
   ```

### 打包后无法使用

1. 确认 `electron-builder.yml` 中包含了 `.node` 文件
2. 检查是否在 `asarUnpack` 中配置了原生模块路径
