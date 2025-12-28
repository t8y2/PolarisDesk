import { app } from 'electron'
import * as path from 'path'

interface UITreeBounds {
  x: number
  y: number
  width: number
  height: number
}

interface UITreeElement {
  role?: string
  roleDescription?: string
  title?: string
  value?: string | number
  description?: string
  help?: string
  bounds?: UITreeBounds
  enabled?: boolean
  focused?: boolean
  children?: UITreeElement[]
  childrenTruncated?: boolean
  totalChildrenCount?: number
}

interface UITreeResult {
  applicationName?: string
  bundleIdentifier?: string
  processId?: number
  windowTitle?: string
  uiTree?: UITreeElement
  error?: string
  hasPermission?: boolean
}

interface NativeUITreeModule {
  checkAccessibilityPermission: () => boolean
  requestAccessibilityPermission: () => boolean
  getAllActiveWindows: (maxDepth?: number) => UITreeResult[]
}

class UITreeService {
  private nativeModule: NativeUITreeModule | null = null
  private isSupported = false

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    // 只在 macOS 上加载原生模块
    if (process.platform !== 'darwin') {
      console.log('UI Tree service is only supported on macOS')
      return
    }

    try {
      let modulePath: string

      if (app.isPackaged) {
        // 生产环境：从 resources 目录加载
        modulePath = path.join(process.resourcesPath, 'native', 'mac')
      } else {
        // 开发环境：从项目根目录加载
        // __dirname 在开发模式下是 src/main/services
        // 需要回到项目根目录
        modulePath = path.join(app.getAppPath(), 'native', 'mac')
      }

      console.log('Attempting to load UI Tree module from:', modulePath)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      this.nativeModule = require(modulePath)
      this.isSupported = true
      console.log('✅ UI Tree native module loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load UI Tree native module:', error)
      console.log('UI Tree functionality will not be available')
    }
  }

  /**
   * 检查是否支持 UI 树功能
   */
  public isUITreeSupported(): boolean {
    return this.isSupported && this.nativeModule !== null
  }

  /**
   * 检查是否有辅助功能权限
   */
  public checkAccessibilityPermission(): boolean {
    if (!this.nativeModule) {
      return false
    }

    try {
      return this.nativeModule.checkAccessibilityPermission()
    } catch (error) {
      console.error('Error checking accessibility permission:', error)
      return false
    }
  }

  /**
   * 请求辅助功能权限（会弹出系统对话框）
   */
  public requestAccessibilityPermission(): boolean {
    if (!this.nativeModule) {
      return false
    }

    try {
      return this.nativeModule.requestAccessibilityPermission()
    } catch (error) {
      console.error('Error requesting accessibility permission:', error)
      return false
    }
  }

  /**
   * 获取所有活动窗口的 UI 树
   * @param maxDepth 最大递归深度（1-10），默认为 3
   */
  public getAllActiveWindows(maxDepth: number = 3): UITreeResult[] {
    if (!this.nativeModule) {
      return []
    }

    const depth = Math.max(1, Math.min(10, maxDepth))

    try {
      return this.nativeModule.getAllActiveWindows(depth)
    } catch (error) {
      console.error('Error getting all windows:', error)
      return []
    }
  }

  /**
   * 将 UI 树转换为简化的 JSON 格式（用于 AI 处理）
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public simplifyUITree(element: UITreeElement | null | undefined): any {
    // 处理 null 或 undefined 元素
    if (!element) {
      return null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const simplified: any = {}

    if (element.role) simplified.role = element.role
    if (element.title) simplified.title = element.title
    if (element.value !== undefined && element.value !== '') simplified.value = element.value
    if (element.description) simplified.description = element.description
    if (element.enabled !== undefined) simplified.enabled = element.enabled
    if (element.focused) simplified.focused = element.focused

    if (element.children && element.children.length > 0) {
      // 过滤掉 null 元素并递归简化
      simplified.children = element.children.map(child => this.simplifyUITree(child)).filter(child => child !== null)
    }

    return simplified
  }
}

// 导出单例
export const uiTreeService = new UITreeService()
