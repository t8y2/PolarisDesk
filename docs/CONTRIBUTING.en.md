# Contributing Guide

Thank you for considering contributing to PolarisDesk!

## 🤝 How to Contribute

### Submit Code

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Report Issues

If you find a bug or have a feature suggestion, please submit it in [Issues](https://github.com/t8y2/PolarisDesk/issues).

## 📝 Development Guidelines

- Use ESLint for code linting
- Use Prettier for code formatting
- Follow TypeScript type specifications
- Run `pnpm lint` and `pnpm typecheck` before committing

## 🛠️ Development Environment Setup

### Requirements

- Node.js >= 18
- pnpm >= 8
- **macOS Developers**: Xcode Command Line Tools (for compiling native modules)
- **Windows Developers**: Visual Studio Build Tools (for compiling native modules)

```bash
# Install build tools on macOS
xcode-select --install
```

### Install Dependencies

```bash
# Clone the repository
git clone https://github.com/t8y2/PolarisDesk.git
cd PolarisDesk

# Install dependencies (native modules will be compiled automatically)
pnpm install
```

> 📝 **About Native Modules**: The project includes platform-specific native C++ modules (e.g., macOS UI Tree access) that are automatically compiled during installation. See [Native Modules Documentation](NATIVE_MODULES.md) for details.

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

## ⚙️ Configuration

Application config files are located in user data directory:

- **Windows**: `%APPDATA%/polaris-desk`
- **macOS**: `~/Library/Application Support/polaris-desk`
- **Linux**: `~/.config/polaris-desk`
