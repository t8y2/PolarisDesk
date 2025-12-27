// AI 服务商配置工具
import i18n from '../i18n'

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'moonshot' | 'openrouter' | 'siliconcloud' | 'ollama' | 'zhipu' | 'custom'

export interface ProviderConfig {
  name: string
  apiUrl: string
  defaultModel: string
  maxTokens: number
  temperature: number
  topP: number
  supportsStreaming: boolean
  requiresApiKey: boolean
}

// 获取服务商名称（支持 i18n）
function getProviderName(key: ProviderType): string {
  return i18n.global.t(`settings.providers.${key}`)
}

export const PROVIDERS: Record<ProviderType, ProviderConfig> = {
  openai: {
    get name() {
      return getProviderName('openai')
    },
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  anthropic: {
    get name() {
      return getProviderName('anthropic')
    },
    apiUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  google: {
    get name() {
      return getProviderName('google')
    },
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent',
    defaultModel: 'gemini-2.0-flash-exp',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  deepseek: {
    get name() {
      return getProviderName('deepseek')
    },
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  moonshot: {
    get name() {
      return getProviderName('moonshot')
    },
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    maxTokens: 8192,
    temperature: 0.3,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  openrouter: {
    get name() {
      return getProviderName('openrouter')
    },
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  siliconcloud: {
    get name() {
      return getProviderName('siliconcloud')
    },
    apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  ollama: {
    get name() {
      return getProviderName('ollama')
    },
    apiUrl: 'http://localhost:11434/api/chat',
    defaultModel: 'llama3.2-vision',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: false
  },
  zhipu: {
    get name() {
      return getProviderName('zhipu')
    },
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4.6v',
    maxTokens: 16384,
    temperature: 0.3,
    topP: 0.6,
    supportsStreaming: true,
    requiresApiKey: true
  },
  custom: {
    get name() {
      return getProviderName('custom')
    },
    apiUrl: '',
    defaultModel: '',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  }
}
