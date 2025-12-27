# 安装说明

## 下载

访问 [GitHub Releases](https://github.com/t8y2/PolarisDesk/releases) 下载最新版本。

## Windows

1. 下载 `.exe` 安装包
2. 双击运行安装
3. 按照向导完成安装

::: tip Windows Defender
首次运行可能会提示安全警告，点击"更多信息" → "仍要运行"即可。
:::

## macOS

1. 下载 `.dmg` 文件
2. 打开 DMG，拖动到 Applications
3. 从 Launchpad 启动

### 解决"应用已损坏"

由于应用未经 Apple 公证，首次打开可能提示已损坏。解决方法：

```bash
xattr -cr /Applications/PolarisDesk.app
```

或者：

1. 打开 **系统设置** > **隐私与安全性**
2. 找到被阻止的应用
3. 点击 **仍要打开**

## Linux

### AppImage（推荐）

```bash
chmod +x PolarisDesk-x.x.x.AppImage
./PolarisDesk-x.x.x.AppImage
```

### Debian/Ubuntu

```bash
sudo dpkg -i PolarisDesk-x.x.x.deb
```

## 配置文件位置

- **Windows**: `%APPDATA%/polaris-desk`
- **macOS**: `~/Library/Application Support/polaris-desk`
- **Linux**: `~/.config/polaris-desk`

## 卸载

### Windows

通过"控制面板" > "程序和功能"卸载

### macOS

将 Applications 中的 PolarisDesk.app 拖到废纸篓

### Linux

```bash
# AppImage
rm PolarisDesk-x.x.x.AppImage

# Debian/Ubuntu
sudo apt remove polaris-desk
```
