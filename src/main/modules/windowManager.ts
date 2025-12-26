import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'
import type { WindowInstances } from '../types/window'
import { logger } from '../utils/logger'

export class WindowManager {
  private windows: WindowInstances = {
    mainWindow: null,
    floatingWindow: null,
    responseWindow: null,
    htmlPreviewWindow: null,
    recordingStatusWindow: null,
    recordingBorderWindow: null
  }

  private isQuitting = false

  // 获取窗口实例
  getMainWindow(): BrowserWindow | null {
    return this.windows.mainWindow
  }

  getFloatingWindow(): BrowserWindow | null {
    return this.windows.floatingWindow
  }

  getResponseWindow(): BrowserWindow | null {
    return this.windows.responseWindow
  }

  getHtmlPreviewWindow(): BrowserWindow | null {
    return this.windows.htmlPreviewWindow
  }

  getRecordingStatusWindow(): BrowserWindow | null {
    return this.windows.recordingStatusWindow
  }

  getRecordingBorderWindow(): BrowserWindow | null {
    return this.windows.recordingBorderWindow
  }

  setQuitting(quitting: boolean): void {
    this.isQuitting = quitting
  }

  isAppQuitting(): boolean {
    return this.isQuitting
  }

  // 创建主窗口
  createMainWindow(): BrowserWindow {
    logger.windowOperation({
      operation: 'create',
      windowType: 'Main Window',
      details: '1100x750'
    })

    this.windows.mainWindow = new BrowserWindow({
      width: 1100,
      height: 750,
      show: false,
      autoHideMenuBar: true,
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#000000',
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    this.windows.mainWindow.on('ready-to-show', () => {
      // 延迟显示窗口，确保渲染进程有足够时间初始化CSS变量
      setTimeout(() => {
        if (this.windows.mainWindow && !this.windows.mainWindow.isDestroyed()) {
          this.windows.mainWindow.show()
          logger.windowOperation({
            operation: 'show',
            windowType: 'Main Window'
          })
        }
      }, 100) // 延迟100ms，让渲染进程先完成基础初始化
    })

    this.windows.mainWindow.webContents.setWindowOpenHandler(details => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.windows.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      this.windows.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    // 在 macOS 上处理窗口关闭事件，隐藏而不是销毁窗口
    this.windows.mainWindow.on('close', event => {
      if (process.platform === 'darwin' && !this.isQuitting) {
        event.preventDefault()
        this.windows.mainWindow?.hide()
      }
    })

    // 窗口关闭时清理
    this.windows.mainWindow.on('closed', () => {
      logger.windowOperation({
        operation: 'close',
        windowType: 'Main Window'
      })
      this.windows.mainWindow = null
    })

    return this.windows.mainWindow
  }

  // 创建悬浮窗
  createFloatingWindow(shouldShow: boolean = true): BrowserWindow {
    if (this.windows.floatingWindow) {
      // 如果已存在但隐藏，根据参数决定是否显示
      if (!this.windows.floatingWindow.isVisible() && shouldShow) {
        this.windows.floatingWindow.show()
        logger.windowOperation({
          operation: 'show',
          windowType: 'Floating Window'
        })
      }
      if (shouldShow) {
        this.windows.floatingWindow.focus()
      }
      return this.windows.floatingWindow
    }

    logger.windowOperation({
      operation: 'create',
      windowType: 'Floating Window',
      details: '320x240'
    })

    const display = screen.getPrimaryDisplay()
    const { width: screenWidth } = display.workAreaSize

    this.windows.floatingWindow = new BrowserWindow({
      width: 320,
      height: 240,
      x: screenWidth - 340,
      y: 20,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      movable: true,
      transparent: true,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      show: false, // 初始不显示，等页面加载完成后再显示
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // 只有在shouldShow为true时，页面准备就绪后才显示窗口
    if (shouldShow) {
      this.windows.floatingWindow.once('ready-to-show', () => {
        if (this.windows.floatingWindow && !this.windows.floatingWindow.isDestroyed()) {
          this.windows.floatingWindow.show()
        }
      })
    }

    // 加载悬浮窗页面
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.windows.floatingWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/floating')
    } else {
      this.windows.floatingWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'floating'
      })
    }

    // 窗口关闭时清理
    this.windows.floatingWindow.on('closed', () => {
      logger.windowOperation({
        operation: 'close',
        windowType: 'Floating Window'
      })
      this.windows.floatingWindow = null
    })

    return this.windows.floatingWindow
  }

  // 设置窗口引用
  setMainWindow(window: BrowserWindow | null): void {
    this.windows.mainWindow = window
  }

  setFloatingWindow(window: BrowserWindow | null): void {
    this.windows.floatingWindow = window
  }

  setResponseWindow(window: BrowserWindow | null): void {
    this.windows.responseWindow = window
  }

  setHtmlPreviewWindow(window: BrowserWindow | null): void {
    this.windows.htmlPreviewWindow = window
  }

  setRecordingStatusWindow(window: BrowserWindow | null): void {
    this.windows.recordingStatusWindow = window
  }

  setRecordingBorderWindow(window: BrowserWindow | null): void {
    this.windows.recordingBorderWindow = window
  }

  // 清理所有窗口
  closeAllWindows(): void {
    Object.values(this.windows).forEach(window => {
      if (window && !window.isDestroyed()) {
        window.close()
      }
    })

    // 重置所有引用
    this.windows = {
      mainWindow: null,
      floatingWindow: null,
      responseWindow: null,
      htmlPreviewWindow: null,
      recordingStatusWindow: null,
      recordingBorderWindow: null
    }
  }

  // 获取所有活动窗口
  getAllActiveWindows(): BrowserWindow[] {
    return Object.values(this.windows).filter(window => window && !window.isDestroyed()) as BrowserWindow[]
  }
}

export const windowManager = new WindowManager()
