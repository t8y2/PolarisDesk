import { defineStore } from 'pinia'
import { ref } from 'vue'
import { logger } from '../utils/logger'

// 基础系统提示词 - 中文版
const BASE_SYSTEM_PROMPT_ZH = `你是 Polaris，一个专业、友好且高效的 AI 桌面助手。你的目标是帮助用户解决问题、提供信息和完成任务。

## 核心能力

1. **多模态理解**：你可以理解和分析文本、图片、视频、PDF、PPT、Word 等多种格式的内容
2. **深度思考**：对于复杂问题，你会使用 <think>思考过程</think> 标签展示推理过程
3. **命令执行**：当用户需要执行系统命令时，使用 <command>命令</command> 标签

## 交互原则

- **准确性**：提供准确、可靠的信息，不确定时明确说明
- **清晰性**：用简洁明了的语言表达，避免冗长和模糊
- **有用性**：关注用户的实际需求，提供可操作的建议
- **安全性**：对于危险操作给出明确警告

## 命令执行规范

当用户需要执行系统命令时：

1. **使用标签**：将命令用 <command>命令</command> 标签包裹
2. **一命令一标签**：不要在一个标签内放多个命令
3. **只生成适用命令**：根据用户的操作系统，只生成一个适用的命令，不要列举多个系统的命令
4. **简洁准确**：命令应该可以直接执行，不需要额外修改
5. **提供说明**：在命令前后解释命令的作用和预期结果

示例：
用户：帮我列出当前目录的所有文件
你：好的，我来帮你列出当前目录的所有文件（包括隐藏文件）。

<command>ls -la</command>

这个命令会显示详细的文件列表，包括权限、所有者、大小和修改时间。

## 思考过程展示

对于需要推理的复杂问题，使用 <think> 标签：

<think>
1. 分析问题的关键点
2. 考虑可能的解决方案
3. 评估各方案的优劣
4. 得出最佳建议
</think>

然后给出你的答案和建议。`

// 基础系统提示词 - 英文版
const BASE_SYSTEM_PROMPT_EN = `You are Polaris, a professional, friendly, and efficient AI desktop assistant. Your goal is to help users solve problems, provide information, and complete tasks.

## Core Capabilities

1. **Multimodal Understanding**: You can understand and analyze various formats including text, images, videos, PDFs, PPTs, Word documents, etc.
2. **Deep Thinking**: For complex problems, use <think>thinking process</think> tags to show your reasoning
3. **Command Execution**: When users need to execute system commands, use <command>command</command> tags

## Interaction Principles

- **Accuracy**: Provide accurate and reliable information; clearly state when uncertain
- **Clarity**: Express ideas concisely and clearly, avoiding verbosity and ambiguity
- **Usefulness**: Focus on users' actual needs and provide actionable suggestions
- **Safety**: Give clear warnings for dangerous operations

## Command Execution Guidelines

When users need to execute system commands:

1. **Use Tags**: Wrap commands with <command>command</command> tags
2. **One Command Per Tag**: Don't put multiple commands in one tag
3. **Generate Only Applicable Commands**: Based on the user's operating system, generate only one applicable command, do not list commands for multiple systems
4. **Concise and Accurate**: Commands should be directly executable without modification
5. **Provide Explanation**: Explain the command's purpose and expected results

Example:
User: Help me list all files in the current directory
You: Sure, I'll help you list all files in the current directory (including hidden files).

<command>ls -la</command>

This command will display a detailed file list, including permissions, owner, size, and modification time.

## Showing Thinking Process

For complex problems requiring reasoning, use <think> tags:

<think>
1. Analyze key points of the problem
2. Consider possible solutions
3. Evaluate pros and cons of each approach
4. Arrive at the best recommendation
</think>

Then provide your answer and suggestions.`

// 获取操作系统信息
function getOSInfo(): { platform: string; description: string } {
  const platform = navigator.platform.toLowerCase()
  const userAgent = navigator.userAgent.toLowerCase()

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return { platform: 'macOS', description: 'macOS 系统' }
  } else if (platform.includes('win') || userAgent.includes('win')) {
    return { platform: 'Windows', description: 'Windows 系统' }
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    return { platform: 'Linux', description: 'Linux 系统' }
  }
  return { platform: 'Unknown', description: '未知系统' }
}

// 合并基础提示词和用户自定义提示词
export function buildSystemPrompt(userPrompt: string, language: 'zh' | 'en' = 'zh'): string {
  const basePrompt = language === 'en' ? BASE_SYSTEM_PROMPT_EN : BASE_SYSTEM_PROMPT_ZH
  const trimmedUserPrompt = userPrompt.trim()
  const osInfo = getOSInfo()

  // 添加操作系统信息
  const osInfoText =
    language === 'en'
      ? `\n## System Environment\n\n- **Operating System**: ${osInfo.platform}\n- **Important**: When generating commands, only provide commands suitable for ${osInfo.platform}. Do not include commands for other operating systems.`
      : `\n## 系统环境\n\n- **操作系统**: ${osInfo.description}\n- **重要提示**: 生成命令时，只提供适用于 ${osInfo.description} 的命令，不要包含其他操作系统的命令。`

  if (!trimmedUserPrompt) {
    return basePrompt + osInfoText
  }

  const customInstructionsLabel = language === 'en' ? '## Custom Instructions' : '## 用户自定义指令'

  return `${basePrompt}${osInfoText}

${customInstructionsLabel}

${trimmedUserPrompt}`
}

export interface AppSettings {
  // 基础设置
  starryBackground: boolean
  defaultExpandThink: boolean
  saveRecordingLocally: boolean
  autoExecuteCommands: boolean
  language: 'zh' | 'en'
  theme: 'dark' | 'light'

  // API配置
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'moonshot' | 'openrouter' | 'siliconcloud' | 'ollama' | 'zhipu' | 'custom'
  apiUrl: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  topP: number
  historyTurns: number
  systemPrompt: string

  // UI配置
  userMessageWidth: number
  aiMessageWidth: number
}

const DEFAULT_SETTINGS: AppSettings = {
  // 基础设置
  starryBackground: true,
  defaultExpandThink: true,
  saveRecordingLocally: false,
  autoExecuteCommands: false,
  language: 'zh',
  theme: 'dark',

  // API配置
  provider: 'zhipu',
  apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  apiKey: '',
  model: 'PolarisDesk',
  maxTokens: 16384,
  temperature: 0.3,
  topP: 0.6,
  historyTurns: 4,
  systemPrompt: '',

  // UI配置
  userMessageWidth: 80,
  aiMessageWidth: 75
}

const STORAGE_KEY = 'polaris-desk-settings'

// 防止重复加载的标志
let isLoading = false
let hasLoaded = false

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })

  const loadSettings = async (): Promise<void> => {
    // 如果正在加载或已经加载过，直接返回
    if (isLoading || hasLoaded) {
      logger.info('设置已加载，跳过重复加载')
      return
    }

    isLoading = true

    try {
      let savedSettings: Partial<AppSettings> | null = null

      // 优先从数据库加载设置
      if (window.api?.database) {
        try {
          const dbSettings = await window.api.database.getAllSettings()

          if (Object.keys(dbSettings).length > 0) {
            // 数据库中找到了设置
            savedSettings = {}
            for (const [key, value] of Object.entries(dbSettings)) {
              if (key in DEFAULT_SETTINGS) {
                const typedKey = key as keyof AppSettings
                try {
                  // 尝试解析 JSON 格式的值
                  savedSettings[typedKey] = JSON.parse(value as string) as never
                } catch {
                  // 如果不是 JSON，直接使用
                  savedSettings[typedKey] = value as never
                }
              }
            }
            logger.success('从数据库加载设置成功', {
              provider: savedSettings.provider,
              model: savedSettings.model,
              hasApiKey: !!savedSettings.apiKey
            })
          }
        } catch (error) {
          logger.warn('从数据库加载设置失败，回退到 localStorage', error)
        }
      }

      // 如果数据库没有设置，回退到 localStorage
      if (!savedSettings) {
        const localSettings = localStorage.getItem(STORAGE_KEY)
        if (localSettings) {
          savedSettings = JSON.parse(localSettings) as Partial<AppSettings>
          logger.info('从 localStorage 加载设置')

          // 迁移设置到数据库
          if (window.api?.database && savedSettings) {
            migrateSettingsToDatabase(savedSettings)
          }
        }
      }

      // 合并默认设置和保存的设置
      if (savedSettings) {
        settings.value = { ...DEFAULT_SETTINGS, ...savedSettings }
        logger.success('设置加载完成', {
          provider: settings.value.provider,
          model: settings.value.model,
          hasApiKey: !!settings.value.apiKey,
          apiKeyLength: settings.value.apiKey?.length || 0
        })
      } else {
        logger.info('未找到保存的设置，使用默认设置')
      }

      hasLoaded = true
    } catch (error) {
      logger.error('加载设置失败', error)
      settings.value = { ...DEFAULT_SETTINGS }
    } finally {
      isLoading = false
    }

    updateCSSVariables()
  }

  // 迁移设置到数据库
  const migrateSettingsToDatabase = async (settingsToMigrate: Partial<AppSettings>): Promise<void> => {
    if (!window.api?.database) return

    try {
      logger.info('开始迁移设置到数据库...')
      for (const [key, value] of Object.entries(settingsToMigrate)) {
        await window.api.database.saveSetting(key, JSON.stringify(value))
      }
      logger.success('设置迁移到数据库成功')
    } catch (error) {
      logger.error('迁移设置到数据库失败', error)
    }
  }

  // 保存设置到本地存储和数据库
  const saveSettings = async (): Promise<void> => {
    try {
      const settingsToSave = JSON.stringify(settings.value)

      // 保存到 localStorage
      localStorage.setItem(STORAGE_KEY, settingsToSave)

      // 验证 localStorage 保存
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== settingsToSave) {
        logger.error('设置保存验证失败')
      }

      // 同时保存到数据库
      if (window.api?.database) {
        try {
          for (const [key, value] of Object.entries(settings.value)) {
            await window.api.database.saveSetting(key, JSON.stringify(value))
          }
          logger.debug('设置已保存到数据库')
        } catch (error) {
          logger.warn('保存设置到数据库失败', error)
        }
      }

      // 保存后立即同步到 modelAPI
      updateCSSVariables()

      // 触发跨窗口同步事件
      window.dispatchEvent(
        new CustomEvent('polaris-settings-changed', {
          detail: settings.value
        })
      )

      logger.success('设置已保存', {
        provider: settings.value.provider,
        model: settings.value.model,
        hasApiKey: !!settings.value.apiKey
      })
    } catch (error) {
      logger.error('保存设置失败', error)
    }
  }

  // 更新CSS变量
  const updateCSSVariables = (): void => {
    try {
      document.documentElement.style.setProperty('--user-message-width', `${settings.value.userMessageWidth}%`)
      document.documentElement.style.setProperty('--ai-message-width', `${settings.value.aiMessageWidth}%`)
    } catch (error) {
      logger.error('更新CSS变量失败', error)
    }
  }

  // 更新单个设置
  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> => {
    const oldValue = settings.value[key]
    settings.value[key] = value

    // 特殊处理：更新 CSS 变量相关设置时立即应用
    if (key === 'userMessageWidth') {
      document.documentElement.style.setProperty('--user-message-width', `${value}%`)
      logger.debug('实时更新用户消息宽度', { value })
    } else if (key === 'aiMessageWidth') {
      document.documentElement.style.setProperty('--ai-message-width', `${value}%`)
      logger.debug('实时更新AI回复宽度', { value })
    }

    // 记录重要设置的变更
    if (['provider', 'model', 'apiUrl'].includes(key)) {
      logger.settingsChange({
        [key]: { old: oldValue, new: value }
      })
    }

    await saveSettings()
  }

  // 获取当前设置的深拷贝副本
  const getSettingsCopy = (): AppSettings => {
    return JSON.parse(JSON.stringify(settings.value))
  }

  // 从副本恢复设置
  const restoreFromCopy = async (copy: AppSettings): Promise<void> => {
    settings.value = { ...copy }
    updateCSSVariables()
    await saveSettings()
    logger.debug('已从副本恢复设置')
  }

  // 批量更新设置
  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    const changes: Record<string, { old: unknown; new: unknown }> = {}

    Object.entries(newSettings).forEach(([key, value]) => {
      const k = key as keyof AppSettings
      if (settings.value[k] !== value) {
        changes[key] = { old: settings.value[k], new: value }
      }
    })

    Object.assign(settings.value, newSettings)

    if (Object.keys(changes).length > 0) {
      logger.settingsChange(changes)
    }

    await saveSettings()
  }

  // 重置为默认设置
  const resetToDefaults = async (): Promise<void> => {
    settings.value = { ...DEFAULT_SETTINGS }
    await saveSettings()
  }

  // 监听跨窗口设置变化
  const setupCrossWindowSync = (): (() => void) => {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue) as AppSettings
          settings.value = { ...DEFAULT_SETTINGS, ...newSettings }
          updateCSSVariables()
          logger.info('接收到跨窗口设置同步')
        } catch (error) {
          logger.error('跨窗口设置同步失败', error)
        }
      }
    }

    const handleCustomEvent = (e: CustomEvent): void => {
      if (e.detail) {
        settings.value = { ...DEFAULT_SETTINGS, ...e.detail }
        updateCSSVariables()
        logger.debug('接收到自定义设置同步事件')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('polaris-settings-changed', handleCustomEvent as EventListener)

    // 返回清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('polaris-settings-changed', handleCustomEvent as EventListener)
    }
  }

  return {
    settings: settings as Readonly<typeof settings>,

    loadSettings,
    saveSettings,
    updateSetting,
    updateSettings,
    resetToDefaults,
    setupCrossWindowSync,
    getSettingsCopy,
    restoreFromCopy
  }
})

// AI 服务商预设配置
export const PROVIDER_PRESETS = {
  openai: {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true
  },
  google: {
    name: 'Google (Gemini)',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent',
    defaultModel: 'gemini-2.0-flash-exp',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true
  },
  deepseek: {
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true
  },
  moonshot: {
    name: 'Moonshot (Kimi)',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    maxTokens: 8192,
    temperature: 0.3,
    topP: 1.0,
    supportsStreaming: true
  },
  openrouter: {
    name: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true
  },
  siliconcloud: {
    name: 'SiliconCloud',
    apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true
  },
  ollama: {
    name: 'Ollama',
    apiUrl: 'http://localhost:11434/api/chat',
    defaultModel: 'llama3.2-vision',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true
  },
  zhipu: {
    name: '智谱 AI (GLM)',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4v-plus',
    maxTokens: 128000,
    temperature: 0.3,
    topP: 0.6,
    supportsStreaming: true
  },
  custom: {
    name: '自定义端点',
    apiUrl: '',
    defaultModel: '',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true
  }
} as const

// 切换服务商的辅助函数
export function switchProvider(provider: AppSettings['provider']): Partial<AppSettings> {
  const preset = PROVIDER_PRESETS[provider]
  return {
    provider,
    apiUrl: preset.apiUrl,
    model: preset.defaultModel,
    maxTokens: preset.maxTokens,
    temperature: preset.temperature,
    topP: preset.topP
  }
}

// 检查模型名称是否为视觉模型
export function isVisionModel(modelName: string): boolean {
  const visionKeywords = ['vision', 'vlm', '4v', '4o', 'gemini', 'multimodal', 'claude-3']

  const lowerModelName = modelName.toLowerCase()
  return visionKeywords.some(keyword => lowerModelName.includes(keyword))
}

// 获取模型是否支持视觉能力
export function getModelVisionCapability(modelName: string): boolean {
  return isVisionModel(modelName)
}
