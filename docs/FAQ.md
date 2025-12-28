# 常见问题解答 (FAQ)

## 🍎 macOS 相关问题

### 为什么提示"应用已损坏，无法打开"？

由于应用未经过 Apple 公证，首次打开时可能会提示"已损坏，无法打开"。这是正常的安全提示，请按以下步骤解决：

#### 方法 1: 使用终端命令（推荐）

```bash
# 下载 .dmg 文件后，打开终端执行：
xattr -cr /Applications/PolarisDesk.app
```

#### 方法 2: 系统设置

1. 打开 **系统设置** > **隐私与安全性**
2. 在底部找到被阻止的应用提示
3. 点击 **仍要打开**

#### 方法 3: 右键打开

1. 在 Finder 中找到 PolarisDesk.app
2. 按住 **Control** 键点击应用图标
3. 选择 **打开**
4. 在弹出的对话框中点击 **打开**

### 为什么会出现这个问题？

- 应用未经过 Apple 的代码签名和公证流程
- 这是 macOS Gatekeeper 的安全机制
- 应用本身是安全的，源代码完全开源

### 未来计划

我们计划在后续版本中添加代码签名和公证，届时将不再出现此问题。

## 🪟 Windows 相关问题

### 如何解决 Windows Defender 拦截？

Windows Defender 可能会将未签名的应用标记为潜在威胁。你可以：

1. 点击"更多信息"
2. 选择"仍要运行"

或者将应用添加到 Windows Defender 的排除列表中。

## 🔧 安装和使用问题

### 原生模块编译失败怎么办？

请参考 [原生模块文档](NATIVE_MODULES.md) 了解详细的编译要求和故障排除方法。

### 如何配置 AI 服务？

1. 打开应用设置
2. 选择你想使用的 AI 服务商
3. 输入对应的 API Key
4. 保存配置即可开始使用

### 数据存储在哪里？

应用数据存储在以下位置：

- **Windows**: `%APPDATA%/polaris-desk`
- **macOS**: `~/Library/Application Support/polaris-desk`
- **Linux**: `~/.config/polaris-desk`

## 💬 更多问题？

如果你的问题没有在这里找到答案，欢迎：

- 查看 [安装指南](INSTALLATION.md)
- 提交 [Issue](https://github.com/t8y2/PolarisDesk/issues)
- 加入我们的社区交流群（见 README）
