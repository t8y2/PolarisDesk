// AI 服务商配置工具

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

export const PROVIDERS: Record<ProviderType, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  google: {
    name: 'Google (Gemini)',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent',
    defaultModel: 'gemini-2.0-flash-exp',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  deepseek: {
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  moonshot: {
    name: 'Moonshot (Kimi)',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    maxTokens: 8192,
    temperature: 0.3,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  openrouter: {
    name: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  siliconcloud: {
    name: 'SiliconCloud',
    apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  },
  ollama: {
    name: 'Ollama',
    apiUrl: 'http://localhost:11434/api/chat',
    defaultModel: 'llama3.2-vision',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: false
  },
  zhipu: {
    name: '智谱 AI (GLM)',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4.6v',
    maxTokens: 16384,
    temperature: 0.3,
    topP: 0.6,
    supportsStreaming: true,
    requiresApiKey: true
  },
  custom: {
    name: '自定义端点',
    apiUrl: '',
    defaultModel: '',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    supportsStreaming: true,
    requiresApiKey: true
  }
}
