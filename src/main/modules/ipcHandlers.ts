import { ipcMain, desktopCapturer, screen, clipboard, dialog, app, shell, BrowserWindow } from 'electron'
import { windowManager } from './windowManager'
import { apiProxy } from './apiProxy'
import { databaseService } from '../services/database'
import { commandExecutorService } from '../services/commandExecutor'
import { createResponseWindow, createHtmlPreviewWindow } from '../utils/windowCreators'
import { logger } from '../utils/logger'
import { autoUpdaterService } from './autoUpdater'

// 创建选择界面HTML（用于截图区域选择）
function createSelectionHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.3);
          cursor: crosshair;
          user-select: none;
          overflow: hidden;
        }
        .selection {
          position: absolute;
          border: 2px solid #007ACC;
          background: rgba(0, 122, 204, 0.1);
          display: none;
          z-index: 1000;
        }
        .instructions {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          z-index: 1001;
        }
      </style>
    </head>
    <body>
      <div class="instructions">拖拽选择截图区域，ESC取消</div>
      <div class="selection" id="selection"></div>
      <script>
        const { ipcRenderer } = require('electron');
        let isSelecting = false;
        let startX, startY;
        const selection = document.getElementById('selection');

        document.addEventListener('mousedown', (e) => {
          if (e.button === 0) {
            isSelecting = true;
            startX = e.clientX;
            startY = e.clientY;
            selection.style.left = startX + 'px';
            selection.style.top = startY + 'px';
            selection.style.width = '0px';
            selection.style.height = '0px';
            selection.style.display = 'block';
          }
        });

        document.addEventListener('mousemove', (e) => {
          if (isSelecting) {
            const currentX = e.clientX;
            const currentY = e.clientY;
            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);

            selection.style.left = left + 'px';
            selection.style.top = top + 'px';
            selection.style.width = width + 'px';
            selection.style.height = height + 'px';
          }
        });

        document.addEventListener('mouseup', (e) => {
          if (e.button === 0 && isSelecting) {
            isSelecting = false;
            const currentX = e.clientX;
            const currentY = e.clientY;
            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);

            if (width > 10 && height > 10) {
              ipcRenderer.send('area-selected', { x: left, y: top, width, height });
            } else {
              ipcRenderer.send('area-selection-cancelled');
            }
          }
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            ipcRenderer.send('area-selection-cancelled');
          }
        });

        document.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          ipcRenderer.send('area-selection-cancelled');
        });
      </script>
    </body>
    </html>
  `
}

export class IpcHandlers {
  // 注册所有IPC处理器
  registerHandlers(): void {
    logger.group('注册 IPC 处理器')
    this.registerAppHandlers()
    this.registerScreenHandlers()
    this.registerApiHandlers()
    this.registerDatabaseHandlers()
    this.registerWindowHandlers()
    this.registerUtilityHandlers()
    this.registerUpdateHandlers()
    this.registerCommandHandlers()
    logger.groupEnd()
    logger.success('所有 IPC 处理器注册完成')
  }

  // 应用相关处理器
  private registerAppHandlers(): void {
    let isFirstLaunch = true
    ipcMain.handle('is-first-launch', () => {
      const result = isFirstLaunch
      isFirstLaunch = false // 第一次调用后设为false
      return result
    })

    // 监听渲染进程初始化完成通知
    ipcMain.handle('renderer-initialization-complete', () => {
      logger.success('渲染进程初始化完成')
      return true
    })

    // 获取应用版本号
    ipcMain.handle('get-app-version', () => {
      return app.getVersion()
    })

    // 打开外部链接
    ipcMain.handle('open-external', async (_, url: string) => {
      try {
        logger.ipc(`打开外部链接: ${url}`)
        await shell.openExternal(url)
      } catch (error) {
        logger.error('打开外部链接失败', error)
        throw error
      }
    })
  }

  // 屏幕相关处理器
  private registerScreenHandlers(): void {
    ipcMain.handle('get-screen-sources', async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['window', 'screen'],
          thumbnailSize: { width: 320, height: 180 }
        })
        logger.debug(`获取到 ${sources.length} 个屏幕源`)
        return sources.map(source => ({
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL()
        }))
      } catch (error) {
        logger.error('获取屏幕源失败', error)
        return []
      }
    })

    ipcMain.handle('get-clipboard-image', () => {
      try {
        const image = clipboard.readImage()
        if (image.isEmpty()) {
          return null
        }
        logger.debug('从剪贴板读取图片')
        return image.toDataURL()
      } catch (error) {
        logger.error('读取剪贴板图片失败', error)
        return null
      }
    })

    // 快速全屏截图
    ipcMain.handle('quick-screenshot', async () => {
      try {
        logger.ipc('执行快速截图')
        const allWindows = BrowserWindow.getAllWindows()

        // 保存窗口状态（透明度和位置）
        const windowStates = allWindows.map(win => ({
          opacity: win.getOpacity(),
          bounds: win.getBounds(),
          isVisible: win.isVisible()
        }))

        // 将所有可见窗口设置为完全透明，而不是隐藏
        allWindows.forEach(win => {
          if (win.isVisible()) {
            win.setOpacity(0)
          }
        })

        // 给系统一点时间来完成透明度变化（比隐藏窗口需要的时间短）
        await new Promise(resolve => setTimeout(resolve, 50))

        const display = screen.getPrimaryDisplay()
        const { width, height } = display.size

        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width, height }
        })

        // 恢复窗口透明度
        allWindows.forEach((win, index) => {
          if (windowStates[index].isVisible) {
            win.setOpacity(windowStates[index].opacity)
          }
        })

        if (sources.length === 0) {
          throw new Error('无法获取屏幕截图')
        }

        logger.success('快速截图完成')
        return sources[0].thumbnail.toDataURL()
      } catch (error) {
        // 发生错误时确保窗口恢复透明度
        const allWindows = BrowserWindow.getAllWindows()
        allWindows.forEach(win => {
          if (win.isVisible()) {
            win.setOpacity(1)
          }
        })
        logger.error('快速截图失败', error)
        throw error
      }
    })

    ipcMain.handle('get-primary-display', () => {
      return screen.getPrimaryDisplay().bounds
    })

    // 添加快速截图功能
    ipcMain.handle('capture-screen', async () => {
      try {
        // 保存当前所有窗口的可见状态和透明度
        const allWindows = BrowserWindow.getAllWindows()
        const windowStates = allWindows.map(win => ({
          opacity: win.getOpacity(),
          isVisible: win.isVisible()
        }))

        // 将所有可见窗口设置为完全透明
        allWindows.forEach(win => {
          if (win.isVisible()) {
            win.setOpacity(0)
          }
        })

        // 给系统一点时间来完成透明度变化
        await new Promise(resolve => setTimeout(resolve, 50))

        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1920, height: 1080 }
        })

        // 恢复窗口透明度
        allWindows.forEach((win, index) => {
          if (windowStates[index].isVisible) {
            win.setOpacity(windowStates[index].opacity)
          }
        })

        if (sources.length > 0) {
          // 返回第一个屏幕的截图（主屏幕）
          return sources[0].thumbnail.toDataURL()
        }
        throw new Error('No screen sources available')
      } catch (error) {
        // 发生错误时确保窗口恢复透明度
        BrowserWindow.getAllWindows().forEach(win => {
          if (win.isVisible()) {
            win.setOpacity(1)
          }
        })
        console.error('Error capturing screen:', error)
        throw error
      }
    })

    // 添加区域截图功能
    ipcMain.handle('capture-screen-area', async () => {
      try {
        return new Promise((resolve, reject) => {
          // 获取所有窗口和当前活动窗口
          const windows = BrowserWindow.getAllWindows()
          const activeWindow = BrowserWindow.getFocusedWindow()

          // 保存窗口状态
          const windowStates = windows.map(win => ({
            opacity: win.getOpacity(),
            isVisible: win.isVisible()
          }))

          // 将所有窗口设置为完全透明
          windows.forEach(win => {
            if (win.isVisible()) {
              win.setOpacity(0)
            }
          })

          // 等待透明度变化完成
          setTimeout(async () => {
            try {
              // 获取屏幕截图作为参考
              const display = screen.getPrimaryDisplay()
              const { width, height } = display.size

              const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width, height }
              })

              if (sources.length === 0) {
                throw new Error('无法获取屏幕截图')
              }

              const fullImage = sources[0].thumbnail.toDataURL()

              // 创建全屏透明选择窗口
              const selectionWindow = new BrowserWindow({
                width,
                height,
                x: 0,
                y: 0,
                frame: false,
                transparent: true,
                alwaysOnTop: true,
                skipTaskbar: true,
                resizable: false,
                movable: false,
                webPreferences: {
                  nodeIntegration: true,
                  contextIsolation: false
                }
              })

              // 设置选择窗口始终在最顶层
              selectionWindow.setAlwaysOnTop(true, 'screen-saver')

              // 加载选择界面HTML
              const selectionHtml = createSelectionHTML()
              selectionWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(selectionHtml))

              // 监听选择结果
              const handleAreaSelected = async (_, area: { x: number; y: number; width: number; height: number }): Promise<void> => {
                selectionWindow.close()

                try {
                  // 获取选择窗口的位置，将相对坐标转换为绝对坐标
                  const windowBounds = selectionWindow.getBounds()
                  const absoluteArea = {
                    x: area.x + windowBounds.x,
                    y: area.y + windowBounds.y,
                    width: area.width,
                    height: area.height
                  }

                  console.log('=== 截图区域坐标调试 (绝对坐标转换) ===')
                  console.log('选择窗口位置:', windowBounds)
                  console.log('原始相对坐标:', area)
                  console.log('转换后绝对坐标:', absoluteArea)

                  // 恢复原来活动窗口的透明度
                  if (activeWindow && !activeWindow.isDestroyed()) {
                    const activeIndex = windows.indexOf(activeWindow)
                    if (activeIndex !== -1) {
                      activeWindow.setOpacity(windowStates[activeIndex].opacity)
                    }
                    activeWindow.show()
                    activeWindow.focus()
                  }
                  // 使用转换后的绝对坐标进行截图裁剪
                  resolve({ fullImage, area: absoluteArea })
                } catch (error) {
                  // 如果原窗口有问题，恢复所有窗口
                  windows.forEach((win, index) => {
                    if (!win.isDestroyed() && windowStates[index].isVisible) {
                      win.setOpacity(windowStates[index].opacity)
                      win.show()
                    }
                  })
                  reject(error)
                }
              }

              const handleSelectionCancelled = (): void => {
                selectionWindow.close()
                // 恢复原来活动窗口的透明度
                if (activeWindow && !activeWindow.isDestroyed()) {
                  const activeIndex = windows.indexOf(activeWindow)
                  if (activeIndex !== -1) {
                    activeWindow.setOpacity(windowStates[activeIndex].opacity)
                  }
                  activeWindow.show()
                  activeWindow.focus()
                }
                reject(new Error('用户取消了区域选择'))
              }

              // 注册事件监听器
              ipcMain.once('area-selected', handleAreaSelected)
              ipcMain.once('area-selection-cancelled', handleSelectionCancelled)

              // 窗口关闭时清理
              selectionWindow.on('closed', () => {
                ipcMain.removeListener('area-selected', handleAreaSelected)
                ipcMain.removeListener('area-selection-cancelled', handleSelectionCancelled)
                // 恢复原来活动窗口的透明度
                if (activeWindow && !activeWindow.isDestroyed()) {
                  const activeIndex = windows.indexOf(activeWindow)
                  if (activeIndex !== -1) {
                    activeWindow.setOpacity(windowStates[activeIndex].opacity)
                  }
                  activeWindow.show()
                  activeWindow.focus()
                }
              })
            } catch (error) {
              // 出错时恢复所有窗口
              windows.forEach((win, index) => {
                if (!win.isDestroyed() && windowStates[index].isVisible) {
                  win.setOpacity(windowStates[index].opacity)
                  win.show()
                }
              })
              reject(error)
            }
          }, 100)
        })
      } catch (error) {
        console.error('区域截图失败:', error)
        throw error
      }
    })
  }

  // API相关处理器
  private registerApiHandlers(): void {
    // 添加API代理处理器
    ipcMain.handle('api-request', async (_, url: string, options: RequestInit) => {
      return await apiProxy.proxyApiRequest(url, options)
    })

    // 添加流式API代理处理器
    ipcMain.handle('api-stream-request', async (event, url: string, options: RequestInit, streamId: string) => {
      return await apiProxy.createStreamProxy(url, options, event.sender, streamId)
    })

    // 取消流式请求处理器
    ipcMain.handle('api-stream-cancel', async (_, streamId: string) => {
      logger.ipc(`收到取消流式请求: ${streamId}`)
      apiProxy.cancelStream(streamId)
    })

    // 取消所有流式请求处理器
    ipcMain.handle('api-stream-cancel-all', async () => {
      logger.ipc('收到取消所有流式请求')
      apiProxy.cancelAllStreams()
    })
  }

  // 数据库相关处理器
  private registerDatabaseHandlers(): void {
    ipcMain.handle('db-save-conversation', (_, conversation) => {
      return databaseService.saveConversation(conversation)
    })

    ipcMain.handle('db-save-conversation-incremental', (_, conversation) => {
      return databaseService.saveConversationIncremental(conversation)
    })

    ipcMain.handle('db-save-message', (_, conversationId: string, message) => {
      return databaseService.saveMessage(conversationId, message)
    })

    ipcMain.handle('db-save-or-update-conversation', (_, conversationId: string, title: string, timestamp: number, messageCount: number) => {
      return databaseService.saveOrUpdateConversation(conversationId, title, timestamp, messageCount)
    })

    ipcMain.handle('db-get-conversation-list', () => {
      return databaseService.getConversationList()
    })

    ipcMain.handle('db-load-conversation', (_, conversationId: string) => {
      return databaseService.loadConversation(conversationId)
    })

    ipcMain.handle('db-delete-conversation', (_, conversationId: string) => {
      return databaseService.deleteConversation(conversationId)
    })

    ipcMain.handle('db-search-conversations', (_, keyword: string) => {
      return databaseService.searchConversations(keyword)
    })

    ipcMain.handle('db-get-stats', () => {
      return databaseService.getStats()
    })

    ipcMain.handle('db-cleanup', (_, keepRecentCount: number = 100) => {
      return databaseService.cleanup(keepRecentCount)
    })

    // 设置相关处理器
    ipcMain.handle('db-save-setting', (_, key: string, value: string) => {
      return databaseService.saveSetting(key, value)
    })

    ipcMain.handle('db-get-setting', (_, key: string) => {
      return databaseService.getSetting(key)
    })

    ipcMain.handle('db-get-all-settings', () => {
      return databaseService.getAllSettings()
    })

    ipcMain.handle('db-delete-setting', (_, key: string) => {
      return databaseService.deleteSetting(key)
    })
  }

  // 窗口相关处理器
  private registerWindowHandlers(): void {
    // 窗口模式切换
    ipcMain.handle('switch-to-floating', () => {
      const mainWindow = windowManager.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide()
      }

      // 创建或显示悬浮窗，保持其原有的置顶状态
      windowManager.createFloatingWindow(true) // 用户主动切换时显示

      return true
    })

    ipcMain.handle('switch-to-main', () => {
      const floatingWindow = windowManager.getFloatingWindow()
      if (floatingWindow && !floatingWindow.isDestroyed()) {
        floatingWindow.hide() // 隐藏而不是关闭，保持窗口状态
      }

      // 显示主窗口，保持其原有的置顶状态
      const mainWindow = windowManager.getMainWindow()
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      } else {
        windowManager.createMainWindow()
      }

      return true
    })

    // 关闭悬浮窗
    ipcMain.on('close-floating-window', () => {
      const floatingWindow = windowManager.getFloatingWindow()
      if (floatingWindow) {
        floatingWindow.close()
        windowManager.setFloatingWindow(null)
      }
    })

    // 显示响应窗口
    ipcMain.handle('show-response-window', (_, response: string) => {
      // 如果已经有响应窗口，先关闭它
      const existingResponseWindow = windowManager.getResponseWindow()
      if (existingResponseWindow && !existingResponseWindow.isDestroyed()) {
        existingResponseWindow.close()
        windowManager.setResponseWindow(null)
      }

      const floatingWindow = windowManager.getFloatingWindow()
      const responseWindow = createResponseWindow(response, floatingWindow || undefined)
      windowManager.setResponseWindow(responseWindow)

      // 添加一个定时器，如果窗口长时间未关闭，自动关闭（5分钟）
      const autoCloseTimer = setTimeout(
        () => {
          if (responseWindow && !responseWindow.isDestroyed()) {
            logger.warn('自动关闭长时间未关闭的响应窗口')
            responseWindow.close()
            windowManager.setResponseWindow(null)
          }
        },
        5 * 60 * 1000
      )

      // 窗口关闭时清理
      responseWindow.on('closed', () => {
        clearTimeout(autoCloseTimer)
        windowManager.setResponseWindow(null)
      })

      return true
    })

    // 关闭响应窗口
    ipcMain.on('close-response-window', () => {
      const responseWindow = windowManager.getResponseWindow()
      if (responseWindow && !responseWindow.isDestroyed()) {
        try {
          responseWindow.close()
        } catch (error) {
          logger.error('关闭响应窗口失败', error)
          // 强制销毁
          if (responseWindow && !responseWindow.isDestroyed()) {
            responseWindow.destroy()
          }
        } finally {
          windowManager.setResponseWindow(null)
        }
      }
    })

    // 显示HTML预览窗口
    ipcMain.handle('show-html-preview', (_, htmlContent: string) => {
      // 如果已经有HTML预览窗口，先关闭它
      const existingHtmlPreviewWindow = windowManager.getHtmlPreviewWindow()
      if (existingHtmlPreviewWindow && !existingHtmlPreviewWindow.isDestroyed()) {
        existingHtmlPreviewWindow.close()
        windowManager.setHtmlPreviewWindow(null)
      }

      const htmlPreviewWindow = createHtmlPreviewWindow(htmlContent)
      windowManager.setHtmlPreviewWindow(htmlPreviewWindow)

      // 窗口关闭时清理
      htmlPreviewWindow.on('closed', () => {
        windowManager.setHtmlPreviewWindow(null)
      })

      return true
    })

    // 关闭HTML预览窗口
    ipcMain.on('close-html-preview', () => {
      const htmlPreviewWindow = windowManager.getHtmlPreviewWindow()
      if (htmlPreviewWindow && !htmlPreviewWindow.isDestroyed()) {
        htmlPreviewWindow.close()
        windowManager.setHtmlPreviewWindow(null)
      }
    })

    // 窗口置顶功能
    ipcMain.handle('toggle-always-on-top', event => {
      // 根据发送请求的窗口来处理置顶
      const senderWindow = BrowserWindow.fromWebContents(event.sender)
      if (!senderWindow) return false

      const isAlwaysOnTop = senderWindow.isAlwaysOnTop()
      senderWindow.setAlwaysOnTop(!isAlwaysOnTop)

      return !isAlwaysOnTop
    })

    ipcMain.handle('get-always-on-top-status', event => {
      // 根据发送请求的窗口来获取状态
      const senderWindow = BrowserWindow.fromWebContents(event.sender)
      if (!senderWindow) return false

      return senderWindow.isAlwaysOnTop()
    })

    // 设置窗口透明度
    ipcMain.handle('set-window-opacity', (event, opacity: number) => {
      const senderWindow = BrowserWindow.fromWebContents(event.sender)
      if (!senderWindow) return false

      // 将百分比转换为0-1的值
      const opacityValue = Math.max(0.1, Math.min(1, opacity / 100))
      senderWindow.setOpacity(opacityValue)
      logger.debug(`设置窗口透明度: ${opacity}% (${opacityValue})`)

      return true
    })

    // 获取窗口透明度
    ipcMain.handle('get-window-opacity', event => {
      const senderWindow = BrowserWindow.fromWebContents(event.sender)
      if (!senderWindow) return 100

      // 将0-1的值转换为百分比
      const opacity = Math.round(senderWindow.getOpacity() * 100)
      return opacity
    })
  }

  // 工具相关处理器
  private registerUtilityHandlers(): void {
    // 显示保存文件对话框
    ipcMain.handle('show-save-dialog', async (_, options) => {
      try {
        const result = await dialog.showSaveDialog(options)
        return result
      } catch (error) {
        logger.error('显示保存对话框失败', error)
        return { canceled: true }
      }
    })

    // IPC test
    ipcMain.on('ping', () => {
      logger.debug('收到 ping，回复 pong')
    })
  }

  // 自动更新相关处理器
  private registerUpdateHandlers(): void {
    // 检查更新
    ipcMain.handle('check-for-updates', async () => {
      try {
        await autoUpdaterService.checkForUpdates()
        return { success: true }
      } catch (error) {
        logger.error('检查更新失败', error)
        return { success: false, error: (error as Error).message }
      }
    })

    // 下载更新
    ipcMain.handle('download-update', async () => {
      try {
        await autoUpdaterService.downloadUpdate()
        return { success: true }
      } catch (error) {
        logger.error('下载更新失败', error)
        return { success: false, error: (error as Error).message }
      }
    })

    // 退出并安装更新
    ipcMain.handle('quit-and-install', () => {
      autoUpdaterService.quitAndInstall()
      return { success: true }
    })
  }

  // 命令执行相关处理器
  private registerCommandHandlers(): void {
    // 存储命令取消函数的 Map
    const commandCancelFunctions = new Map<string, () => void>()

    // 执行命令
    ipcMain.handle('execute-command', async (_, command: string) => {
      return await commandExecutorService.executeCommand(command)
    })

    // 流式执行命令
    ipcMain.handle('execute-command-stream', (event, command: string, streamId: string) => {
      const onData = (data: string, isError: boolean): void => {
        event.sender.send('command-stream-data', streamId, data, isError)
      }

      const onComplete = (exitCode: number): void => {
        event.sender.send('command-stream-complete', streamId, exitCode)
        // 清理取消函数
        commandCancelFunctions.delete(streamId)
      }

      const cancelFn = commandExecutorService.executeCommandStream(command, onData, onComplete)

      // 存储取消函数
      commandCancelFunctions.set(streamId, cancelFn)

      return { success: true }
    })

    // 取消命令执行
    ipcMain.handle('cancel-command-stream', (_, streamId: string) => {
      const cancelFn = commandCancelFunctions.get(streamId)
      if (cancelFn) {
        cancelFn()
        commandCancelFunctions.delete(streamId)
      }
      return { success: true }
    })
  }
}

export const ipcHandlers = new IpcHandlers()
