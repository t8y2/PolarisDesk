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
   * @param maxDepth 最大递归深度（1-15），默认为 6
   */
  public getAllActiveWindows(maxDepth: number = 6): UITreeResult[] {
    if (!this.nativeModule) {
      return []
    }

    const depth = Math.max(1, Math.min(15, maxDepth))

    try {
      return this.nativeModule.getAllActiveWindows(depth)
    } catch (error) {
      console.error('Error getting all windows:', error)
      return []
    }
  }

  /**
   * 遍历策略枚举
   */
  private traversalStrategies = {
    structure: 'structure', // 结构优先：看整体布局
    interaction: 'interaction', // 交互优先：找按钮、输入框
    content: 'content', // 内容优先：提取文本
    focused: 'focused', // 焦点优先：当前操作区域
    deep: 'deep' // 深度优先：完整遍历
  } as const

  /**
   * 根据用户意图检测遍历策略
   */
  public detectTraversalStrategy(userMessage: string): string {
    const msg = userMessage.toLowerCase()

    // 结构查询
    if (/布局|结构|界面|窗口|有哪些|组成/.test(msg)) {
      return this.traversalStrategies.structure
    }

    // 交互查询
    if (/点击|按钮|输入|操作|怎么|如何|执行/.test(msg)) {
      return this.traversalStrategies.interaction
    }

    // 内容查询
    if (/内容|文字|文本|显示|写着|说|读/.test(msg)) {
      return this.traversalStrategies.content
    }

    // 焦点查询
    if (/当前|正在|现在|这个|这里/.test(msg)) {
      return this.traversalStrategies.focused
    }

    // 默认深度遍历
    return this.traversalStrategies.deep
  }

  /**
   * 将 UI 树转换为 XML 格式（用于 AI 处理）
   * 支持智能自适应遍历策略
   * @param element UI 树根元素
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
      if (el.title || el.value) return true

      const importantRoles = ['AXButton', 'AXTextField', 'AXTextArea', 'AXStaticText', 'AXLink', 'AXImage', 'AXMenuButton', 'AXPopUpButton', 'AXCheckBox', 'AXRadioButton', 'AXSlider', 'AXTable', 'AXList', 'AXMenu', 'AXMenuItem', 'AXToolbar', 'AXTab', 'AXTabGroup', 'AXWindow', 'AXDialog', 'AXSheet', 'AXTextView', 'AXWebArea', 'AXScrollArea']

      if (el.role && importantRoles.includes(el.role)) return true
      if (el.focused) return true
      if (el.children && el.children.length > 0) return true

      return false
    }

    const simplifiedRole = (role: string | undefined): string => {
      if (!role) return ''
      return role.replace(/^AX/, '').toLowerCase()
    }

    const buildAttributes = (el: UITreeElement, includeRole = true): string => {
      const attrs: string[] = []
      if (includeRole && el.role) {
        attrs.push(`role="${simplifiedRole(el.role)}"`)
      }
      if (el.title) attrs.push(`title="${escapeXml(el.title)}"`)
      if (el.value !== undefined && el.value !== '') attrs.push(`value="${escapeXml(el.value)}"`)
      if (el.description) attrs.push(`desc="${escapeXml(el.description)}"`)
      if (el.enabled === false) attrs.push(`enabled="false"`)
      if (el.focused) attrs.push(`focused="true"`)
      return attrs.length > 0 ? ' ' + attrs.join(' ') : ''
    }

    // 判断是否为纯文本元素
    const isTextElement = (el: UITreeElement): boolean => {
      const role = simplifiedRole(el.role)
      return (role === 'statictext' || role === 'textview') && !el.children?.length
    }

    // 判断元素是否只是容器（没有实际内容）
    const isContainerOnly = (el: UITreeElement): boolean => {
      const role = simplifiedRole(el.role)
      return ['group', 'scrollarea', 'splitgroup'].includes(role) && !el.title && !el.value && !el.description
    }

    // 收集直接子元素的文本内容（不递归，避免跨区域混淆）
    const collectDirectText = (children: UITreeElement[]): string[] => {
      const texts: string[] = []

      for (const child of children) {
        if (isTextElement(child)) {
          const text = String(child.value || child.title || '')
          if (text.trim().length > 0) {
            texts.push(text)
          }
        }
      }

      return texts
    }

    // 判断是否为文本密集区域（多个连续的文本元素）
    const isTextDenseArea = (children: UITreeElement[]): boolean => {
      const textElements = children.filter(c => isTextElement(c))
      // 至少 5 个文本元素，且文本元素占比超过 70%
      return textElements.length >= 5 && textElements.length / children.length > 0.7
    }

    // 使用 BFS 遍历，但保持树形结构输出
    const buildXmlRecursive = (el: UITreeElement, depth: number): string => {
      if (!isImportantElement(el)) {
        return ''
      }

      const indent = '  '.repeat(depth)
      const importantChildren = el.children?.filter(child => child && isImportantElement(child)) || []

      // 优化1: 如果只有一个文本子元素，合并到父元素
      if (importantChildren.length === 1 && isTextElement(importantChildren[0])) {
        const child = importantChildren[0]
        const attrs = buildAttributes(el)
        const textValue = child.value || child.title || ''
        return `${indent}<e${attrs}>${escapeXml(textValue)}</e>\n`
      }

      // 优化2: 跳过纯容器元素，直接展开子元素
      if (isContainerOnly(el) && importantChildren.length > 0) {
        let xml = ''
        for (const child of importantChildren) {
          xml += buildXmlRecursive(child, depth)
        }
        return xml
      }

      // 优化4: 文本密集区域聚合（只聚合直接子元素的文本）
      if (isTextDenseArea(importantChildren)) {
        const directTexts = collectDirectText(importantChildren)
        if (directTexts.length > 0) {
          const attrs = buildAttributes(el)
          const textContent = directTexts.join(' | ')

          // 过滤掉已经聚合的文本元素，保留其他元素
          const nonTextChildren = importantChildren.filter(c => !isTextElement(c))

          if (nonTextChildren.length === 0) {
            // 全是文本，直接聚合
            return `${indent}<e${attrs} text="${escapeXml(textContent)}" />\n`
          } else {
            // 有其他元素，文本作为属性，其他元素继续展开
            let xml = `${indent}<e${attrs} text="${escapeXml(textContent)}">\n`
            for (const child of nonTextChildren) {
              xml += buildXmlRecursive(child, depth + 1)
            }
            xml += `${indent}</e>\n`
            return xml
          }
        }
      }

      // 优化3: 智能合并相似元素
      const groupedChildren: Array<UITreeElement | UITreeElement[]> = []
      let i = 0
      while (i < importantChildren.length) {
        const current = importantChildren[i]
        const currentRole = simplifiedRole(current.role)

        // 检查是否可以合并（相同角色、都是叶子节点、都有标题或值）
        if ((currentRole === 'button' || currentRole === 'menuitem' || currentRole === 'tab' || currentRole === 'link') && !current.children?.length && (current.title || current.value)) {
          const group: UITreeElement[] = [current]
          let j = i + 1

          // 收集连续的相同类型元素
          while (
            j < importantChildren.length &&
            simplifiedRole(importantChildren[j].role) === currentRole &&
            !importantChildren[j].children?.length &&
            (importantChildren[j].title || importantChildren[j].value) &&
            j - i < 10 // 最多合并10个
          ) {
            group.push(importantChildren[j])
            j++
          }

          if (group.length >= 3) {
            // 至少3个才合并
            groupedChildren.push(group)
            i = j
            continue
          }
        }

        groupedChildren.push(current)
        i++
      }

      const attrs = buildAttributes(el)

      if (groupedChildren.length === 0) {
        return `${indent}<e${attrs} />\n`
      }

      let xml = `${indent}<e${attrs}>\n`

      for (const item of groupedChildren) {
        if (Array.isArray(item)) {
          // 合并的元素组
          const role = simplifiedRole(item[0].role)
          const items = item
            .map(child => {
              const label = escapeXml(child.title || child.value || '')
              return label
            })
            .filter(Boolean)
            .join(', ')
          xml += `${indent}  <e role="${role}s" items="${items}" />\n`
        } else {
          xml += buildXmlRecursive(item, depth + 1)
        }
      }

      xml += `${indent}</e>\n`
      return xml
    }

    return buildXmlRecursive(element, 0)
  }
}

// 导出单例
export const uiTreeService = new UITreeService()
