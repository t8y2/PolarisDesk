/**
 * 文本处理相关的组合函数
 */
import { ref } from 'vue'
import removeMarkdown from 'remove-markdown'
import { useSettingsStore } from '../stores/settingsStore'

export interface ThinkBlockState {
  expandedThinkBlocks: ReturnType<typeof ref<Map<string, boolean>>>
  toggleThinkExpanded: (messageId: string) => void
  isThinkExpanded: (messageId: string) => boolean
  extractThinkContent: (text: string) => string
  removeThinkContent: (text: string) => string
}

export interface AnswerBoxState {
  extractAnswerBoxes: (text: string) => string[]
  removeAnswerBoxes: (text: string) => string
  formatAnswerBoxes: (text: string) => string
}

export function useTextProcessing(): ThinkBlockState & AnswerBoxState {
  // 思考块展开状态 - 使用 Map 来区分展开(true)、收起(false)、未设置(undefined)
  const expandedThinkBlocks = ref<Map<string, boolean>>(new Map())

  // 获取 settingsStore
  const settingsStore = useSettingsStore()

  // 思考块相关函数
  const extractThinkContent = (text: string): string => {
    const regex = /<think([\s\S]*?)<\/think>/i
    const thinkMatch = text.match(regex)
    if (!thinkMatch) return ''

    // 移除 markdown 语法，转换为纯文本
    const rawContent = thinkMatch[1].trim()
    return removeMarkdown(rawContent)
  }

  const removeThinkContent = (text: string): string => {
    const regex = /<think[\s\S]*?<\/think>/gi
    return text.replace(regex, '').trim()
  }

  const toggleThinkExpanded = (messageId: string): void => {
    const currentState = expandedThinkBlocks.value.get(messageId)
    if (currentState === true) {
      // 当前是展开状态，切换为收起
      expandedThinkBlocks.value.set(messageId, false)
    } else {
      // 当前是收起状态或未设置，切换为展开
      expandedThinkBlocks.value.set(messageId, true)
    }
  }

  const isThinkExpanded = (messageId: string): boolean => {
    // 如果用户手动设置过展开状态，使用用户设置
    const userSetting = expandedThinkBlocks.value.get(messageId)
    if (userSetting !== undefined) {
      return userSetting
    }

    // 否则使用全局设置的默认值（从 settingsStore 读取）
    return settingsStore.settings.defaultExpandThink
  }

  // 答案块相关函数
  const extractAnswerBoxes = (text: string): string[] => {
    const answerBoxRegex = /<\|begin_of_box\|>\s*(.*?)\s*<\|end_of_box\|>/gs
    const answers: string[] = []
    let match
    while ((match = answerBoxRegex.exec(text)) !== null) {
      answers.push(match[1].trim())
    }
    return answers
  }

  const removeAnswerBoxes = (text: string): string => {
    // 移除答案块标记，但保留内容
    return text.replace(/<\|begin_of_box\|>\s*(.*?)\s*<\|end_of_box\|>/gs, '$1').trim()
  }

  const formatAnswerBoxes = (text: string): string => {
    return text.replace(/<\|begin_of_box\|>\s*(.*?)\s*<\|end_of_box\|>/gs, '【答案：$1】')
  }

  return {
    // 思考块相关
    expandedThinkBlocks,
    extractThinkContent,
    removeThinkContent,
    toggleThinkExpanded,
    isThinkExpanded,

    // 答案块相关
    extractAnswerBoxes,
    removeAnswerBoxes,
    formatAnswerBoxes
  }
}
