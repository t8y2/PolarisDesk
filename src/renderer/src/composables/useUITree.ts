import { ref } from 'vue'
import { logger } from '../utils/logger'

export function useUITree(): {
  isSupported: Ref<boolean>
  hasPermission: Ref<boolean>
  isChecking: Ref<boolean>
  initialize: () => Promise<void>
  requestPermission: () => Promise<boolean>
  getAllWindowsForAI: (maxDepth?: number) => Promise<string | null>
} {
  const isSupported = ref(false)
  const hasPermission = ref(false)
  const isChecking = ref(false)

  /**
   * 初始化 UI 树功能
   */
  const initialize = async (): Promise<void> => {
    try {
      if (!window.api?.uiTree) {
        logger.warn('UI Tree API 不可用')
        console.log('⚠️ UI Tree API 不可用')
        return
      }

      isSupported.value = await window.api.uiTree.isSupported()

      if (isSupported.value) {
        hasPermission.value = await window.api.uiTree.checkPermission()
        logger.info(`UI Tree 功能已初始化 - 支持: ${isSupported.value}, 权限: ${hasPermission.value}`)
        console.log('✅ UI Tree 功能已初始化:', {
          isSupported: isSupported.value,
          hasPermission: hasPermission.value
        })

        if (!hasPermission.value) {
          console.log('⚠️ 需要授予辅助功能权限：系统设置 > 隐私与安全性 > 辅助功能')
        }
      } else {
        console.log('⚠️ UI Tree 功能不支持（可能不是 macOS 或原生模块未编译）')
      }
    } catch (error) {
      logger.error('初始化 UI Tree 功能失败', error)
      console.error('❌ 初始化 UI Tree 功能失败:', error)
    }
  }

  /**
   * 请求辅助功能权限
   */
  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!window.api?.uiTree) {
        logger.error('UI Tree API 不可用')
        return false
      }

      const granted = await window.api.uiTree.requestPermission()
      hasPermission.value = granted

      if (!granted) {
        logger.warn('需要授予辅助功能权限：系统设置 > 隐私与安全性 > 辅助功能')
      }

      return granted
    } catch (error) {
      logger.error('请求辅助功能权限失败', error)
      return false
    }
  }

  /**
   * 获取所有活动窗口的 UI 树（简化版，用于 AI，返回 XML 格式）
   */
  const getAllWindowsForAI = async (maxDepth: number = 6): Promise<string | null> => {
    if (!isSupported.value || !hasPermission.value) {
      return null
    }

    try {
      isChecking.value = true
      const windows = await window.api.uiTree.getAllSimplified(maxDepth)

      if (!windows || windows.length === 0) {
        return null
      }

      // 构建简洁的 XML 格式
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<windows>\n'

      for (const window of windows) {
        const escapeXml = (str: string | undefined): string => {
          if (!str) return ''
          return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
        }

        xml += `  <w app="${escapeXml(window.applicationName)}" title="${escapeXml(window.windowTitle)}">\n`

        if (window.uiTree) {
          // uiTree 已经是 XML 字符串，需要缩进
          const indentedTree = window.uiTree
            .split('\n')
            .map(line => (line ? '    ' + line : ''))
            .join('\n')
          xml += indentedTree
        }

        xml += '  </w>\n'
      }

      xml += '</windows>'

      return xml
    } catch (error) {
      logger.error('获取所有窗口 UI 树失败', error)
      return null
    } finally {
      isChecking.value = false
    }
  }

  return {
    isSupported,
    hasPermission,
    isChecking,
    initialize,
    requestPermission,
    getAllWindowsForAI
  }
}
