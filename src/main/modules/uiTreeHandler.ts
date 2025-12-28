import { ipcMain } from 'electron'
import { uiTreeService } from '../services/ui-tree.service'

/**
 * 注册 UI 树相关的 IPC 处理器
 */
export function registerUITreeHandlers(): void {
  // 检查是否支持 UI 树功能
  ipcMain.handle('ui-tree:is-supported', () => {
    return uiTreeService.isUITreeSupported()
  })

  // 检查辅助功能权限
  ipcMain.handle('ui-tree:check-permission', () => {
    return uiTreeService.checkAccessibilityPermission()
  })

  // 请求辅助功能权限
  ipcMain.handle('ui-tree:request-permission', () => {
    return uiTreeService.requestAccessibilityPermission()
  })

  // 获取所有窗口的简化 UI 树（用于 AI）
  ipcMain.handle('ui-tree:get-all-simplified', (_event, maxDepth?: number) => {
    try {
      const windows = uiTreeService.getAllActiveWindows(maxDepth)

      return windows
        .map(window => {
          try {
            return {
              applicationName: window.applicationName,
              bundleIdentifier: window.bundleIdentifier,
              windowTitle: window.windowTitle,
              uiTree: window.uiTree ? uiTreeService.simplifyUITree(window.uiTree) : null
            }
          } catch (error) {
            console.error('Error simplifying window UI tree:', error)
            return {
              applicationName: window.applicationName,
              bundleIdentifier: window.bundleIdentifier,
              windowTitle: window.windowTitle,
              uiTree: null,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })
        .filter(window => window.uiTree !== null) // 过滤掉没有 UI 树的窗口
    } catch (error) {
      console.error('Error getting all windows:', error)
      return []
    }
  })

  console.log('UI Tree IPC handlers registered')
}
