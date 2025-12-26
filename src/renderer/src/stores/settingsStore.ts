import { defineStore } from 'pinia'
import { ref } from 'vue'
import { logger } from '../utils/logger'

export interface AppSettings {
  // 基础设置
  starryBackground: boolean
  defaultExpandThink: boolean
  saveRecordingLocally: boolean
  language: 'zh' | 'en'

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
  language: 'zh',

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
                  savedSettings[typedKey] = JSON.parse(value) as never
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
