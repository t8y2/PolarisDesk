import { app } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { windowManager } from './modules/windowManager'
import { shortcutManager } from './modules/shortcutManager'
import { ipcHandlers } from './modules/ipcHandlers'
import { databaseService } from './services/database'
import { checkFFmpegAvailability } from './utils/videoCompress'
import { logger } from './utils/logger'
import { autoUpdaterService } from './modules/autoUpdater'

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  // 初始化 FFmpeg（确保视频压缩功能在应用启动时就检查）
  try {
    const ffmpegReady = await checkFFmpegAvailability()
    if (ffmpegReady) {
      logger.success('FFmpeg 初始化成功，视频压缩功能已就绪')
    } else {
      logger.warn('FFmpeg 不可用，视频压缩功能将被跳过')
    }
  } catch (error) {
    logger.error('FFmpeg 初始化失败', error)
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 注册全局快捷键
  logger.info('注册全局快捷键...')
  shortcutManager.registerGlobalShortcuts()

  // 注册所有IPC处理器
  logger.info('注册 IPC 处理器...')
  ipcHandlers.registerHandlers()

  // 创建主窗口
  logger.info('创建主窗口...')
  windowManager.createMainWindow()

  // 设置自动更新服务的主窗口引用
  const mainWindow = windowManager.getMainWindow()
  if (mainWindow) {
    autoUpdaterService.setMainWindow(mainWindow)
  }

  logger.ready()

  // 延迟预创建悬浮窗，确保主窗口完全稳定后再创建
  setTimeout(() => {
    const mainWindow = windowManager.getMainWindow()
    if (!windowManager.getFloatingWindow() && mainWindow && !mainWindow.isDestroyed()) {
      windowManager.createFloatingWindow(false) // 预创建时不显示
    }
  }, 1500) // 增加延迟至1.5秒，避免与主窗口初始化冲突

  app.on('activate', function () {
    const mainWindow = windowManager.getMainWindow()
    const floatingWindow = windowManager.getFloatingWindow()

    // 如果悬浮窗存在且未被销毁（包括最小化状态）
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      // 如果悬浮窗被最小化，恢复它
      if (floatingWindow.isMinimized()) {
        floatingWindow.restore()
        floatingWindow.focus()
        // 确保主窗口隐藏
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
          mainWindow.hide()
        }
        return
      }
      // 如果悬浮窗可见，聚焦它并确保主窗口隐藏
      if (floatingWindow.isVisible()) {
        floatingWindow.focus()
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
          mainWindow.hide()
        }
        return
      }
      // 如果悬浮窗被隐藏（用户切换到主窗口），继续显示主窗口
    }

    // 检查主窗口是否存在，如果不存在则重新创建
    if (!mainWindow || mainWindow.isDestroyed()) {
      windowManager.createMainWindow()
    } else if (mainWindow) {
      // 如果主窗口存在但被隐藏，则显示它
      mainWindow.show()
      mainWindow.focus()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出时清理全局快捷键和关闭数据库
app.on('before-quit', () => {
  logger.info('应用准备退出...')
  windowManager.setQuitting(true)
})

app.on('will-quit', () => {
  logger.info('清理资源...')
  shortcutManager.unregisterAllShortcuts()
  databaseService.close()
  logger.success('应用已退出')
})
