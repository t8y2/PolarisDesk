import { globalShortcut } from 'electron'
import { windowManager } from './windowManager'

export class ShortcutManager {
  // 注册全局快捷键
  registerGlobalShortcuts(): void {
    // Cmd+Shift+C 快速切换悬浮窗
    globalShortcut.register('CommandOrControl+Shift+C', () => {
      const floatingWindow = windowManager.getFloatingWindow()
      const mainWindow = windowManager.getMainWindow()

      if (floatingWindow) {
        if (floatingWindow.isVisible()) {
          // 隐藏悬浮窗，显示主窗口
          floatingWindow.hide()
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
          }
        } else {
          // 显示悬浮窗，隐藏主窗口
          if (mainWindow) {
            mainWindow.hide()
          }
          floatingWindow.show()
          floatingWindow.focus()
        }
      } else {
        // 创建悬浮窗，隐藏主窗口
        if (mainWindow) {
          mainWindow.hide()
        }
        windowManager.createFloatingWindow(true) // 用户主动切换时显示
      }
    })

    // Cmd+Shift+S 快速截图
    globalShortcut.register('CommandOrControl+Shift+S', () => {
      // 触发快速截图
      const mainWindow = windowManager.getMainWindow()
      const floatingWindow = windowManager.getFloatingWindow()

      if (mainWindow && mainWindow.isVisible()) {
        mainWindow.webContents.send('trigger-quick-screenshot')
      } else if (floatingWindow && floatingWindow.isVisible()) {
        floatingWindow.webContents.send('trigger-quick-screenshot')
      }
    })

    // Cmd+Shift+N 新建对话
    globalShortcut.register('CommandOrControl+Shift+N', () => {
      const mainWindow = windowManager.getMainWindow()
      const floatingWindow = windowManager.getFloatingWindow()

      if (mainWindow && mainWindow.isVisible()) {
        mainWindow.webContents.send('trigger-new-conversation')
      } else if (floatingWindow && floatingWindow.isVisible()) {
        floatingWindow.webContents.send('trigger-new-conversation')
      }
    })

    // Cmd+Shift+X 区域截图
    globalShortcut.register('CommandOrControl+Shift+X', () => {
      const mainWindow = windowManager.getMainWindow()
      const floatingWindow = windowManager.getFloatingWindow()

      if (mainWindow && mainWindow.isVisible()) {
        mainWindow.webContents.send('trigger-area-screenshot')
      } else if (floatingWindow && floatingWindow.isVisible()) {
        floatingWindow.webContents.send('trigger-area-screenshot')
      }
    })

    // Cmd+Shift+H 打开历史面板
    globalShortcut.register('CommandOrControl+Shift+H', () => {
      const mainWindow = windowManager.getMainWindow()
      const floatingWindow = windowManager.getFloatingWindow()

      // 只在主窗口中触发历史面板，因为悬浮窗没有历史面板
      if (mainWindow) {
        mainWindow.webContents.send('trigger-history-panel')
        // 如果当前显示的是悬浮窗，切换到主窗口
        if (floatingWindow && floatingWindow.isVisible()) {
          floatingWindow.hide()
          mainWindow.show()
          mainWindow.focus()
        }
      }
    })
  }

  // 注销所有全局快捷键
  unregisterAllShortcuts(): void {
    globalShortcut.unregisterAll()
  }
}

export const shortcutManager = new ShortcutManager()
