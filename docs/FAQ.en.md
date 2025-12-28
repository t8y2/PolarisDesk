# Frequently Asked Questions (FAQ)

## 🍎 macOS Issues

### Why does it say "App is damaged and can't be opened"?

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

## 🪟 Windows Issues

### How to fix Windows Defender blocking?

Windows Defender may flag unsigned apps as potential threats. You can:

1. Click "More info"
2. Select "Run anyway"

Or add the app to Windows Defender's exclusion list.

## 🔧 Installation & Usage Issues

### Native module compilation failed?

Please refer to the [Native Modules Documentation](NATIVE_MODULES.md) for detailed compilation requirements and troubleshooting.

### How to configure AI services?

1. Open app settings
2. Select your preferred AI provider
3. Enter the corresponding API Key
4. Save the configuration and start using

### Where is the data stored?

Application data is stored in:

- **Windows**: `%APPDATA%/polaris-desk`
- **macOS**: `~/Library/Application Support/polaris-desk`
- **Linux**: `~/.config/polaris-desk`

## 💬 More Questions?

If you can't find an answer here, feel free to:

- Check the [Installation Guide](INSTALLATION.md)
- Submit an [Issue](https://github.com/t8y2/PolarisDesk/issues)
- Join our community (see README)
