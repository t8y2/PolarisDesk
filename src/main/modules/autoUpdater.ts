import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'
import { logger } from '../utils/logger'

class AutoUpdaterService {
  private mainWindow: BrowserWindow | null = null
  private updateCheckInProgress = false

  constructor() {
    this.setupAutoUpdater()
  }

  private setupAutoUpdater(): void {
    // 配置更新服务器（开发环境下可以配置为本地服务器）
    if (process.env.NODE_ENV === 'development') {
      // 开发环境下禁用自动更新
      autoUpdater.autoDownload = false
      autoUpdater.autoInstallOnAppQuit = false
    } else {
      // 生产环境配置
      autoUpdater.autoDownload = false // 不自动下载，让用户手动触发
      autoUpdater.autoInstallOnAppQuit = true // 退出时自动安装
    }

    // 监听更新事件
    autoUpdater.on('checking-for-update', () => {
      logger.info('正在检查更新...')
      this.sendStatusToWindow('checking-for-update', '正在检查更新...')
    })

    autoUpdater.on('update-available', info => {
      logger.success('发现新版本', { version: info.version })
      this.sendStatusToWindow('update-available', {
        message: `发现新版本 ${info.version}`,
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      })
    })

    autoUpdater.on('update-not-available', info => {
      logger.info('当前已是最新版本', { version: info.version })
      this.sendStatusToWindow('update-not-available', {
        message: '当前已是最新版本',
        version: info.version
      })
    })

    autoUpdater.on('error', err => {
      logger.error('更新检查失败', err)
      this.sendStatusToWindow('update-error', {
        message: '更新检查失败',
        error: err.message
      })
    })

    autoUpdater.on('download-progress', progressObj => {
      const logMessage = `下载速度: ${progressObj.bytesPerSecond} - 已下载 ${progressObj.percent.toFixed(2)}%`
      logger.info(logMessage)
      this.sendStatusToWindow('download-progress', {
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      })
    })

    autoUpdater.on('update-downloaded', info => {
      logger.success('更新下载完成', { version: info.version })
      this.sendStatusToWindow('update-downloaded', {
        message: `新版本 ${info.version} 已下载完成`,
        version: info.version
      })

      // 询问用户是否立即重启安装
      if (this.mainWindow) {
        dialog
          .showMessageBox(this.mainWindow, {
            type: 'info',
            title: '更新已就绪',
            message: `新版本 ${info.version} 已下载完成`,
            detail: '应用将在退出后自动安装更新。是否现在重启并安装？',
            buttons: ['稍后', '立即重启'],
            defaultId: 1,
            cancelId: 0
          })
          .then(result => {
            if (result.response === 1) {
              // 立即退出并安装
              setImmediate(() => {
                autoUpdater.quitAndInstall(false, true)
              })
            }
          })
      }
    })
  }

  /**
   * 设置主窗口引用
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * 发送更新状态到渲染进程
   */
  private sendStatusToWindow(event: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', { event, data })
    }
  }

  /**
   * 手动检查更新
   */
  async checkForUpdates(): Promise<void> {
    if (this.updateCheckInProgress) {
      logger.warn('更新检查正在进行中，跳过重复请求')
      return
    }

    try {
      this.updateCheckInProgress = true
      logger.info('开始检查更新')
      await autoUpdater.checkForUpdates()
    } catch (error) {
      logger.error('检查更新失败', error)
      throw error
    } finally {
      this.updateCheckInProgress = false
    }
  }

  /**
   * 下载更新
   */
  async downloadUpdate(): Promise<void> {
    try {
      logger.info('开始下载更新')
      await autoUpdater.downloadUpdate()
    } catch (error) {
      logger.error('下载更新失败', error)
      throw error
    }
  }

  /**
   * 退出并安装更新
   */
  quitAndInstall(): void {
    logger.info('退出应用并安装更新')
    autoUpdater.quitAndInstall(false, true)
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion(): string {
    return autoUpdater.currentVersion.version
  }
}

// 导出单例
export const autoUpdaterService = new AutoUpdaterService()
