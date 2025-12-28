/* eslint-disable @typescript-eslint/no-require-imports */
let nativeModule

try {
  // 尝试加载编译后的原生模块
  nativeModule = require('./build/Release/ui_tree_mac.node')
} catch (err) {
  console.error('Failed to load native module:', err.message)
  console.error('Please run: cd native/mac && npm install')

  // 提供一个降级实现
  nativeModule = {
    checkAccessibilityPermission: () => {
      throw new Error('Native module not compiled. Please run: cd native/mac && npm install')
    },
    requestAccessibilityPermission: () => {
      throw new Error('Native module not compiled. Please run: cd native/mac && npm install')
    },
    getAllActiveWindows: () => {
      throw new Error('Native module not compiled. Please run: cd native/mac && npm install')
    }
  }
}

module.exports = nativeModule
