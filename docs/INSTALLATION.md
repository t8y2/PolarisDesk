# PolarisDesk 安装指南 / Installation Guide

[English](#english) | [简体中文](#简体中文)

---

## 简体中文

### Windows 安装

1. 从 [Releases](https://github.com/t8y2/PolarisDesk/releases) 页面下载最新的 `.exe` 文件
2. 双击运行安装程序
3. 按照安装向导完成安装
4. 首次运行时，Windows Defender 可能会显示警告，点击"更多信息"然后"仍要运行"

### macOS 安装

#### 下载和安装

1. 从 [Releases](https://github.com/t8y2/PolarisDesk/releases) 页面下载最新的 `.dmg` 文件
2. 双击打开 `.dmg` 文件
3. 将 PolarisDesk.app 拖拽到 Applications 文件夹

#### 解决"应用已损坏"问题

由于应用未经过 Apple 公证，首次打开时会提示"已损坏，无法打开"。这是正常的安全提示，请选择以下任一方法解决：

##### 方法 1: 使用终端命令（推荐，最快捷）

打开终端（Terminal），复制粘贴以下命令并回车：

```bash
xattr -cr /Applications/PolarisDesk.app
```

执行后即可正常打开应用。

##### 方法 2: 通过系统设置

1. 尝试打开 PolarisDesk（会显示"已损坏"提示）
2. 打开 **系统设置** > **隐私与安全性**
3. 滚动到底部，找到关于 PolarisDesk 的提示
4. 点击 **仍要打开** 按钮
5. 在弹出的确认对话框中再次点击 **打开**

##### 方法 3: 右键菜单打开

1. 在 Finder 中找到 Applications 文件夹中的 PolarisDesk.app
2. 按住 **Control** 键，点击应用图标（或右键点击）
3. 在菜单中选择 **打开**
4. 在弹出的对话框中点击 **打开** 按钮

#### 为什么会出现这个问题？

- **未经公证**: 应用没有经过 Apple 的公证流程
- **安全机制**: macOS Gatekeeper 会阻止未经公证的应用
- **应用安全**: 应用本身是安全的，所有源代码都是开源的
- **未来计划**: 我们计划在后续版本中添加代码签名和公证

### Linux 安装

目前暂不提供预编译的 Linux 版本，请从源码构建：

```bash
# 克隆仓库
git clone https://github.com/t8y2/PolarisDesk.git
cd PolarisDesk

# 安装依赖
pnpm install

# 构建应用
pnpm build:linux
```

构建完成后，安装包位于 `dist/` 目录。

---

## English

### Windows Installation

1. Download the latest `.exe` file from the [Releases](https://github.com/t8y2/PolarisDesk/releases) page
2. Double-click to run the installer
3. Follow the installation wizard to complete the installation
4. On first run, Windows Defender may show a warning - click "More info" then "Run anyway"

### macOS Installation

#### Download and Install

1. Download the latest `.dmg` file from the [Releases](https://github.com/t8y2/PolarisDesk/releases) page
2. Double-click to open the `.dmg` file
3. Drag PolarisDesk.app to the Applications folder

#### Fixing "App is Damaged" Error

Since the app is not notarized by Apple, you'll see a "damaged and can't be opened" message on first launch. This is a normal security prompt. Choose any of the following methods to fix it:

##### Method 1: Terminal Command (Recommended, Fastest)

Open Terminal and copy-paste this command:

```bash
xattr -cr /Applications/PolarisDesk.app
```

After running this command, you can open the app normally.

##### Method 2: System Settings

1. Try to open PolarisDesk (you'll see the "damaged" message)
2. Open **System Settings** > **Privacy & Security**
3. Scroll to the bottom and find the notification about PolarisDesk
4. Click the **Open Anyway** button
5. Click **Open** again in the confirmation dialog

##### Method 3: Right-Click Menu

1. Find PolarisDesk.app in the Applications folder in Finder
2. Hold the **Control** key and click the app icon (or right-click)
3. Select **Open** from the menu
4. Click the **Open** button in the dialog

#### Why Does This Happen?

- **Not Notarized**: The app hasn't gone through Apple's notarization process
- **Security Mechanism**: macOS Gatekeeper blocks non-notarized apps
- **App Safety**: The app itself is safe - all source code is open source
- **Future Plans**: We plan to add code signing and notarization in future releases

### Linux Installation

Pre-built Linux packages are not currently available. Please build from source:

```bash
# Clone the repository
git clone https://github.com/t8y2/PolarisDesk.git
cd PolarisDesk

# Install dependencies
pnpm install

# Build the application
pnpm build:linux
```

After building, the package will be in the `dist/` directory.

---

## 常见问题 / FAQ

### Q: 应用安全吗？/ Is the app safe?

A: 是的，完全安全。所有源代码都在 GitHub 上开源，您可以自行审查。未经公证只是因为 Apple 开发者账号需要年费。

Yes, completely safe. All source code is open source on GitHub and you can review it yourself. The lack of notarization is simply because an Apple Developer account requires an annual fee.

### Q: 为什么不进行代码签名？/ Why not code sign?

A: Apple 开发者账号需要每年 $99 USD。作为开源项目，我们暂时没有这个预算。如果您愿意赞助，我们会优先添加代码签名。

An Apple Developer account costs $99 USD per year. As an open source project, we don't currently have this budget. If you'd like to sponsor us, we'll prioritize adding code signing.

### Q: 每次更新都要重新执行命令吗？/ Do I need to run the command after every update?

A: 是的，每次下载新版本后都需要重新执行 `xattr -cr` 命令。

Yes, you'll need to run the `xattr -cr` command again after downloading each new version.

### Q: 有其他安装方式吗？/ Are there other installation methods?

A: 目前只提供直接下载安装。未来可能会支持 Homebrew 等包管理器。

Currently only direct download is available. We may support package managers like Homebrew in the future.

---

## 需要帮助？/ Need Help?

如果遇到安装问题，请：
If you encounter installation issues, please:

1. 查看 [Issues](https://github.com/t8y2/PolarisDesk/issues) 中是否有类似问题
   Check if there are similar issues in [Issues](https://github.com/t8y2/PolarisDesk/issues)

2. 创建新的 Issue 并提供：
   Create a new Issue with:
   - 操作系统版本 / OS version
   - 错误截图 / Error screenshots
   - 详细的错误信息 / Detailed error messages

3. 加入讨论区寻求帮助
   Join the discussion forum for help
