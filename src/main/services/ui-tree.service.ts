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
   * 将 UI 树转换为 XML 格式（用于 AI 处理）
   * 使用广度优先搜索（BFS）从顶层窗口开始遍历
   * 过滤掉不重要的元素，只保留有意义的交互元素
   */
  public simplifyUITreeToXML(element: UITreeElement | null | undefined): string {
    if (!element) {
      return ''
    }

    const escapeXml = (str: string | number | undefined): string => {
      if (str === undefined || str === null) return ''
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
    }

    // 判断元素是否重要（值得保留）
    const isImportantElement = (el: UITreeElement): boolean => {
      // 保留有标题或值的元素
      if (el.title || el.value) return true

      // 保留重要的角色类型
      const importantRoles = ['AXButton', 'AXTextField', 'AXTextArea', 'AXStaticText', 'AXLink', 'AXImage', 'AXMenuButton', 'AXPopUpButton', 'AXCheckBox', 'AXRadioButton', 'AXSlider', 'AXTable', 'AXList', 'AXMenu', 'AXMenuItem', 'AXToolbar', 'AXTab', 'AXTabGroup', 'AXWindow', 'AXDialog', 'AXSheet']

      if (el.role && importantRoles.includes(el.role)) return true

      // 保留聚焦的元素
      if (el.focused) return true

      // 如果有子元素，可能需要保留作为容器
      if (el.children && el.children.length > 0) return true

      return false
    }

    const buildAttributes = (el: UITreeElement): string => {
      const attrs: string[] = []
      if (el.role) {
        // 简化角色名称，去掉 AX 前缀
        const simplifiedRole = el.role.replace(/^AX/, '').toLowerCase()
        attrs.push(`role="${simplifiedRole}"`)
      }
      if (el.title) attrs.push(`title="${escapeXml(el.title)}"`)
      if (el.value !== undefined && el.value !== '') attrs.push(`value="${escapeXml(el.value)}"`)
      if (el.description) attrs.push(`desc="${escapeXml(el.description)}"`)
      if (el.enabled === false) attrs.push(`enabled="false"`)
      if (el.focused) attrs.push(`focused="true"`)
      return attrs.length > 0 ? ' ' + attrs.join(' ') : ''
    }

    // 使用 BFS 遍历，但保持树形结构输出
    const buildXmlRecursive = (el: UITreeElement, depth: number): string => {
      // 过滤掉不重要的元素
      if (!isImportantElement(el)) {
        return ''
      }

      const indent = '  '.repeat(depth)
      const attrs = buildAttributes(el)

      // 过滤子元素
      const importantChildren = el.children?.filter(child => child && isImportantElement(child)) || []
      const hasChildren = importantChildren.length > 0

      if (!hasChildren) {
        return `${indent}<e${attrs} />\n`
      }

      let xml = `${indent}<e${attrs}>\n`

      // BFS: 先处理所有直接子元素
      for (const child of importantChildren) {
        xml += buildXmlRecursive(child, depth + 1)
      }

      xml += `${indent}</e>\n`
      return xml
    }

    return buildXmlRecursive(element, 0)
  }
}

// 导出单例
export const uiTreeService = new UITreeService()
