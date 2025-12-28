<div align="center">
  <div style="display: flex; justify-content: space-between; align-items: center; max-width: 800px; margin: 0 auto;">
    <h1 style="margin: 0;">PolarisDesk</h1>
    <div>
      <a href="./README.md">简体中文</a> | English
    </div>
  </div>
</div>

<div align="center">
  <img src="resources/icon.png" alt="PolarisDesk Logo" width="120" height="120">
  <p>A Modern AI Desktop Assistant</p>
  <p><em>Like the North Star, guiding your way</em></p>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Electron](https://img.shields.io/badge/Electron-37.x-47848F?logo=electron)](https://www.electronjs.org/)
  [![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
</div>

## 💫 About PolarisDesk

PolarisDesk, like the North Star guiding sailors, provides intelligent guidance and assistance for your daily work. This is an **AI-powered** desktop assistant application that can be your reliable intelligent partner for document processing, code writing, or problem-solving.

### 🤖 Supported AI Providers

<div align="center">

|      OpenAI      |  Anthropic   |     Google     |
| :--------------: | :----------: | :------------: |
|   **DeepSeek**   | **Moonshot** | **OpenRouter** |
| **SiliconCloud** |  **Ollama**  |  **Zhipu AI**  |

Supports custom endpoints compatible with OpenAI API format

</div>

## 📸 Screenshots

<table>
  <tr>
    <td width="50%">
      <h3 align="center">Main Interface</h3>
      <img src="docs/images/main-screenshot.png" alt="Main Interface">
    </td>
    <td width="50%">
      <h3 align="center">Settings</h3>
      <img src="docs/images/settings-screenshot.png" alt="Settings">
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="center">Float Window</h3>
      <img src="docs/images/float-screenshot.png" alt="Float Window">
    </td>
    <td width="50%">
      <h3 align="center">Demo</h3>
      <img src="docs/images/demo.gif" alt="Demo">
    </td>
  </tr>
</table>

## ✨ Features

- 🤖 **AI Chat** - Intelligent conversations with multiple AI models
- 🎨 **Modern UI** - Beautiful interface based on Naive UI
- 💬 **Float Window** - Convenient floating chat window
- 📝 **Markdown Rendering** - Code highlighting, math formulas (KaTeX)
- 📄 **Document Processing** - PDF, PPT, Word parsing support
- 🎬 **Video Compression** - Built-in FFmpeg video processing
- 💾 **Local Storage** - SQLite local database
- ⚡ **Performance Optimized** - Code splitting, lazy loading, virtual scrolling
- 🌐 **Internationalization** - Supports Chinese and English

## 👥 Join the Community

Welcome to join the PolarisDesk community to exchange experiences, share tips, and get help!

<div align="center">
<table>
  <tr>
    <td align="center" width="33%">
      <h3>💬 WeChat Group</h3>
      <img src="docs/images/community-wx.jpg" alt="WeChat Group QR Code" width="180"><br>
      <sub>Scan to add friend<br>Note "PolarisDesk" to join group</sub>
    </td>
    <td align="center" width="33%">
      <h3>👤 Personal WeChat</h3>
      <img src="docs/images/personal-wx.jpg" alt="Personal WeChat QR Code" width="180"><br>
      <sub>Scan to add author's WeChat<br>For communication & feedback</sub>
    </td>
    <td align="center" width="33%">
      <h3>🌐 Discord Community</h3>
      <br><br>
      <a href="https://discord.gg/6XR6b73PrE">
        <img src="https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
      </a>
      <br><br>
      <sub>Click to join Discord server<br>International community platform</sub>
    </td>
  </tr>
</table>
</div>

## 🚀 Quick Start

> 💡 **Downloading the installer?** Check out the [Installation Guide](docs/INSTALLATION.md) for detailed installation steps and troubleshooting.

### Requirements

- Node.js >= 18
- pnpm >= 8
- **macOS Developers**: Xcode Command Line Tools (for compiling native modules)
- **Windows Developers**: Visual Studio Build Tools (for compiling native modules)

```bash
# Install build tools on macOS
xcode-select --install
```

### Installation

```bash
# Clone the repository
git clone https://github.com/t8y2/PolarisDesk.git
cd PolarisDesk

# Install dependencies (native modules will be compiled automatically)
pnpm install
```

> 📝 **About Native Modules**: The project includes platform-specific native C++ modules (e.g., macOS UI Tree access) that are automatically compiled during installation. See [Native Modules Documentation](docs/NATIVE_MODULES.md) for details.

### Development

```bash
# Start development server
pnpm dev
```

### Build

```bash
# Build application
pnpm build

# Build for Windows
pnpm build:win

# Build for macOS
pnpm build:mac

# Build for Linux
pnpm build:linux
```

## 🛠️ Tech Stack

### Core

- **Electron** - Cross-platform desktop framework
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript superset
- **Vite** - Next-generation frontend build tool

### UI Components

- **Naive UI** - Vue 3 component library
- **UnoCSS** - Instant on-demand atomic CSS engine
- **Vue Virtual Scroller** - Virtual scrolling optimization

### Features

- **Markdown-it** - Markdown parser
- **Highlight.js** - Code syntax highlighting
- **KaTeX** - Math formula rendering
- **PDF.js** - PDF document rendering
- **Mammoth.js** - Word document processing
- **pptxtojson** - PPT document parsing
- **Better-SQLite3** - High-performance SQLite database
- **FFmpeg** - Video processing

## 📁 Project Structure

```
PolarisDesk/
├── src/
│   ├── main/           # Electron main process
│   │   ├── modules/    # Feature modules
│   │   ├── services/   # Service layer
│   │   └── utils/      # Utilities
│   ├── preload/        # Preload scripts
│   └── renderer/       # Renderer process (Vue app)
│       ├── components/ # Vue components
│       ├── views/      # Page views
│       ├── stores/     # Pinia state management
│       └── utils/      # Utilities
├── native/             # Native C++ modules
│   ├── mac/           # macOS native module
│   └── win/           # Windows native module
├── resources/          # App resources
├── build/             # Build config
└── dist/              # Build output
```

## ⚙️ Configuration

Application config files are located in user data directory:

- **Windows**: `%APPDATA%/polaris-desk`
- **macOS**: `~/Library/Application Support/polaris-desk`
- **Linux**: `~/.config/polaris-desk`

## 🍎 macOS Installation Guide

### Fixing "App is Damaged" Error

Since the app is not notarized by Apple, you may see a "damaged and can't be opened" message on first launch. This is a normal security prompt. Here's how to fix it:

#### Method 1: Terminal Command (Recommended)

```bash
# After downloading the .dmg file, open Terminal and run:
xattr -cr /Applications/PolarisDesk.app
```

#### Method 2: System Settings

1. Open **System Settings** > **Privacy & Security**
2. Find the blocked app notification at the bottom
3. Click **Open Anyway**

#### Method 3: Right-Click Open

1. Find PolarisDesk.app in Finder
2. Hold **Control** key and click the app icon
3. Select **Open**
4. Click **Open** in the dialog

### Why Does This Happen?

- The app is not code-signed or notarized by Apple
- This is macOS Gatekeeper's security mechanism
- The app itself is safe - the source code is fully open source

### Future Plans

We plan to add code signing and notarization in future releases to eliminate this issue.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Development Guidelines

- Use ESLint for code linting
- Use Prettier for code formatting
- Follow TypeScript type specifications
- Run `pnpm lint` and `pnpm typecheck` before committing

## 🚀 Roadmap

| Feature              | Description                                        | Status       |
| -------------------- | -------------------------------------------------- | ------------ |
| 🤖 AI-Powered CLI    | AI understands intent and executes system commands | Planned      |
| 🔌 Plugin System     | Third-party plugin support                         | Planned      |
| 🌐 Multi-language    | Internationalization                               | ✅ Completed |
| 🎙️ Voice Interaction | Voice input/output                                 | Planned      |
| 🎨 Theme Support     | More theme extensions                              | Planned      |
| 💡 More              | And more                                           | Planned      |

Developers are welcome to contribute via PR!

## 📄 License

This project is licensed under the [MIT](LICENSE) License.

## 📮 Contact

- Project Homepage: [https://github.com/t8y2/PolarisDesk](https://github.com/t8y2/PolarisDesk)
- Issue Tracker: [Issues](https://github.com/t8y2/PolarisDesk/issues)

---

<div align="center">
  Made with ❤️ by PolarisDesk
</div>
