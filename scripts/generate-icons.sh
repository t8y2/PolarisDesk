#!/bin/bash

# 图标生成脚本
# 用法: ./scripts/generate-icons.sh

set -e

echo "--- 开始生成应用图标 ---"

# 检查依赖
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo "[错误] 未找到 $1"
    echo "请安装: brew install $2"
    exit 1
  fi
}

# macOS 图标生成
generate_mac_icon() {
  local source="$1"
  local output="build/icon.icns"

  echo "正在生成 macOS 图标..."

  # 创建临时目录
  local iconset="build/icon.iconset"
  mkdir -p "$iconset"

  # 生成各种尺寸
  sips -z 16 16     "$source" --out "$iconset/icon_16x16.png" > /dev/null
  sips -z 32 32     "$source" --out "$iconset/icon_16x16@2x.png" > /dev/null
  sips -z 32 32     "$source" --out "$iconset/icon_32x32.png" > /dev/null
  sips -z 64 64     "$source" --out "$iconset/icon_32x32@2x.png" > /dev/null
  sips -z 128 128   "$source" --out "$iconset/icon_128x128.png" > /dev/null
  sips -z 256 256   "$source" --out "$iconset/icon_128x128@2x.png" > /dev/null
  sips -z 256 256   "$source" --out "$iconset/icon_256x256.png" > /dev/null
  sips -z 512 512   "$source" --out "$iconset/icon_256x256@2x.png" > /dev/null
  sips -z 512 512   "$source" --out "$iconset/icon_512x512.png" > /dev/null
  sips -z 1024 1024 "$source" --out "$iconset/icon_512x512@2x.png" > /dev/null

  # 转换为 .icns
  iconutil -c icns "$iconset" -o "$output"

  # 清理临时文件
  rm -rf "$iconset"

  echo "[成功] macOS 图标已生成: $output"
}

# Windows 图标生成
generate_win_icon() {
  local source="$1"
  local output="build/icon.ico"

  echo "正在生成 Windows 图标..."

  # 使用 ImageMagick 或 sips + png2ico
  if command -v magick &> /dev/null; then
    magick "$source" -define icon:auto-resize=256,128,64,48,32,16 "$output"
  elif command -v convert &> /dev/null; then
    convert "$source" -define icon:auto-resize=256,128,64,48,32,16 "$output"
  else
    echo "[警告] 未找到 ImageMagick，将使用基础转换 (可能不包含所有尺寸)"
    sips -s format ico "$source" --out "$output" > /dev/null
  fi

  echo "[成功] Windows 图标已生成: $output"
}

# 主逻辑
main() {
  # 切换到项目根目录 (假设脚本在 scripts/ 目录下)
  cd "$(dirname "$0")/.."

  # 检查源文件
  if [ -f "resources/icon-mac.png" ] && [ -f "resources/icon-win.png" ]; then
    echo "模式: 使用分离的图标源文件 (推荐)"
    generate_mac_icon "resources/icon-mac.png"
    generate_win_icon "resources/icon-win.png"
  elif [ -f "resources/icon.png" ]; then
    echo "模式: 使用统一图标源文件"
    generate_mac_icon "resources/icon.png"
    generate_win_icon "resources/icon.png"
  else
    echo "[错误] 未找到图标源文件"
    echo "请在 resources 目录下准备以下文件之一："
    echo "  1. icon-mac.png 和 icon-win.png"
    echo "  2. icon.png"
    exit 1
  fi

  echo ""
  echo "--- 图标生成完成 ---"
  echo "生成的文件列表："
  ls -lh build/icon.* | awk '{print "  " $9 " (" $5 ")"}'
}

main
