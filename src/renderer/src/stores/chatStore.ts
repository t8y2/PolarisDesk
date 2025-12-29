import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import i18n from '../i18n'

// 生成唯一ID的函数
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 消息类型定义
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  image?: string
  video?: string
  videoBase64?: string
  pdfImages?: string[]
  pdfName?: string
  pptImages?: string[]
  pptName?: string
  pptTotalPages?: number
  wordImages?: string[]
  wordName?: string
  wordTotalPages?: number
  timestamp?: number
}

// 待发送媒体类型定义
export interface PendingMedia {
  image?: string
  video?: string
  videoBase64?: string
  pdfImages?: string[]
  pdfName?: string
  pptImages?: string[]
  pptName?: string
  pptTotalPages?: number
  wordImages?: string[]
  wordName?: string
  wordTotalPages?: number
}

// 对话历史类型定义
export interface ConversationHistory {
  id: string
  title: string
  messages: ChatMessage[]
  timestamp: number
}

// Store ID 常量，确保所有窗口使用相同的 Store ID
const STORE_ID = 'chat'

// 本地存储键名常量
const KEYS = {
  MESSAGES: 'polaris-chat-messages',
  LOADING: 'polaris-chat-loading',
  WELCOME: 'polaris-chat-welcome-added',
  LAST_MESSAGE: 'polaris-chat-last-message',
  PENDING_MEDIA: 'polaris-chat-pending-media'
}

// 欢迎消息标识（用于识别欢迎消息，不依赖具体语言）
const WELCOME_MESSAGE_ID_PREFIX = 'welcome_msg'

// 获取当前语言的欢迎消息
function getWelcomeMessage(): string {
  return i18n.global.t('welcome.message')
}

export const useChatStore = defineStore(STORE_ID, () => {
  // ========== 状态定义 ==========
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const isGenerating = ref(false) // 是否正在生成回复（包括思考）
  const welcomeAdded = ref(false)
  const currentConversationId = ref<string | null>(null)
  const pendingMedia = ref<PendingMedia>({})
  const isPrivateMode = ref(false) // 隐私对话模式

  // ========== 计算属性 ==========

  // 过滤后的真实消息（排除欢迎消息）
  const realMessages = computed(() => {
    return messages.value.filter(msg => {
      // 通过 ID 前缀识别欢迎消息
      if (msg.id.startsWith(WELCOME_MESSAGE_ID_PREFIX)) {
        return false
      }
      return true
    })
  })

  // 检查是否有完整对话
  const hasCompleteConversation = computed(() => {
    const hasUserMessage = realMessages.value.some(msg => msg.role === 'user')
    const hasAssistantMessage = realMessages.value.some(msg => msg.role === 'assistant' && msg.content.trim().length > 0)
    return hasUserMessage && hasAssistantMessage
  })

  // ========== 初始化 ==========

  const initFromStorage = (): void => {
    try {
      const storedMessages = localStorage.getItem(KEYS.MESSAGES)
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages)
        if (Array.isArray(parsed)) {
          messages.value = parsed
        }
      }

      const storedLoading = localStorage.getItem(KEYS.LOADING)
      if (storedLoading) {
        isLoading.value = JSON.parse(storedLoading)
      } else {
        isLoading.value = false
        localStorage.setItem(KEYS.LOADING, JSON.stringify(false))
      }

      const storedWelcomeAdded = localStorage.getItem(KEYS.WELCOME)
      if (storedWelcomeAdded) {
        welcomeAdded.value = JSON.parse(storedWelcomeAdded)
      }

      const storedPendingMedia = localStorage.getItem(KEYS.PENDING_MEDIA)
      if (storedPendingMedia) {
        pendingMedia.value = JSON.parse(storedPendingMedia)
      }
    } catch (error) {
      console.error('Error loading chat data from storage:', error)
      isLoading.value = false
      localStorage.setItem(KEYS.LOADING, JSON.stringify(false))
    }
  }

  const initialize = async (): Promise<void> => {
    // 先从 storage 加载上次的对话
    initFromStorage()

    // 安全检查：确保加载状态的正确性
    if (messages.value.length === 0 && isLoading.value) {
      console.warn('检测到异常状态：无消息但处于加载中，重置加载状态')
      isLoading.value = false
      localStorage.setItem(KEYS.LOADING, JSON.stringify(false))
    }

    // 如果有完整的对话，保存它
    if (hasCompleteConversation.value) {
      console.log('应用启动：保存上次对话到历史记录')
      await saveCurrentConversation()
    }

    // 清空当前消息，开始新对话
    messages.value = []
    welcomeAdded.value = false
    currentConversationId.value = null
    clearPendingMedia()

    // 清理本地存储
    localStorage.removeItem(KEYS.MESSAGES)
    localStorage.setItem(KEYS.WELCOME, JSON.stringify(false))
    localStorage.setItem(KEYS.LOADING, JSON.stringify(false))
    isLoading.value = false

    setupMessageListeners()

    // 添加欢迎消息，开始新对话
    addWelcomeMessageIfNeeded()

    const isFloating = window.location.hash === '#/floating' || window.location.hash === '#floating'
    console.log(`Chat store initialized in ${isFloating ? 'floating window' : 'main window'} - 新对话已开始`)
  }

  // ========== 消息管理 ==========

  const addUserMessage = (content: string, image?: string, video?: string, videoBase64?: string, pdfImages?: string[], pdfName?: string, pptImages?: string[], pptName?: string, pptTotalPages?: number, wordImages?: string[], wordName?: string, wordTotalPages?: number): void => {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: content || (video ? '发送了一个视频' : image ? '发送了一张图片' : pdfImages?.length ? `发送了PDF: ${pdfName || 'document.pdf'} (${pdfImages.length}页)` : pptImages?.length ? `发送了PPT: ${pptName || 'presentation.ppt'} (${pptTotalPages || pptImages.length}页)` : wordImages?.length ? `发送了Word: ${wordName || 'document.docx'} (${wordTotalPages || wordImages.length}页)` : ''),
      image,
      video,
      videoBase64,
      pdfImages,
      pdfName,
      pptImages,
      pptName,
      pptTotalPages,
      wordImages,
      wordName,
      wordTotalPages,
      timestamp: Date.now()
    }

    messages.value.push(message)
    clearPendingMedia()
    saveToStorage()
    syncMessageToOtherWindows('user', message)
  }

  const addAssistantMessage = (content: string): string => {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content,
      timestamp: Date.now()
    }

    messages.value.push(message)
    saveToStorage()

    // 输出到控制台用于调试
    console.group('💬 新增 AI 消息')
    console.log('消息 ID:', message.id)
    console.log('内容长度:', content.length)
    console.log('完整内容:', content)
    console.log('包含 <command> 标签:', content.includes('<command>'))
    console.log('包含 <think> 标签:', content.includes('<think>'))
    console.groupEnd()

    // 只在消息内容不为空时同步
    if (content.trim().length > 0) {
      syncMessageToOtherWindows('assistant', message)
    }

    return message.id
  }

  const updateAssistantMessageContent = (messageId: string, content: string): void => {
    const messageIndex = messages.value.findIndex(msg => msg.id === messageId)
    if (messageIndex !== -1) {
      // 直接修改content属性，避免创建新对象
      messages.value[messageIndex].content = content

      // 输出更新日志（仅在内容较长时输出，避免流式输出时刷屏）
      if (content.length > 100 && content.length % 500 < 50) {
        console.log('📝 更新 AI 消息:', messageId, '长度:', content.length)
      }
    }
  }

  const removeMessage = (messageId: string): void => {
    const messageIndex = messages.value.findIndex(msg => msg.id === messageId)
    if (messageIndex !== -1) {
      messages.value.splice(messageIndex, 1)
      saveToStorage()
      syncMessageToOtherWindows('remove', { messageId })
    }
  }

  const addWelcomeMessageIfNeeded = (): void => {
    if (!welcomeAdded.value && messages.value.length === 0) {
      messages.value.push({
        id: `${WELCOME_MESSAGE_ID_PREFIX}_${Date.now()}`,
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: Date.now()
      })
      welcomeAdded.value = true
      saveToStorage()
    }
  }

  // 更新欢迎消息（当语言切换时调用）
  const updateWelcomeMessage = (): void => {
    const welcomeMsg = messages.value.find(msg => msg.id.startsWith(WELCOME_MESSAGE_ID_PREFIX))
    if (welcomeMsg) {
      welcomeMsg.content = getWelcomeMessage()
      saveToStorage()
    }
  }

  // ========== 状态管理 ==========

  const setLoading = (loading: boolean): void => {
    isLoading.value = loading
    localStorage.setItem(KEYS.LOADING, JSON.stringify(loading))
  }

  const setGenerating = (generating: boolean): void => {
    isGenerating.value = generating
  }

  const clearMessages = async (): Promise<void> => {
    await startNewConversation()
  }

  // ========== 存储管理 ==========

  // 防抖保存，避免频繁写入localStorage
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  const saveToStorage = (): void => {
    // 隐私模式下不保存消息
    if (isPrivateMode.value) {
      return
    }

    // 清除之前的定时器
    if (saveTimer) {
      clearTimeout(saveTimer)
    }

    // 延迟保存，合并多次调用
    saveTimer = setTimeout(() => {
      try {
        const messagesData = JSON.stringify(messages.value)

        // 数据过大时保存简化版本
        if (messagesData.length > 4000000) {
          console.warn('消息数据过大，正在保存简化版本...')
          const simplifiedMessages = messages.value.map(msg => ({
            ...msg,
            image: msg.image && msg.image.length > 100000 ? undefined : msg.image,
            video: undefined,
            videoBase64: undefined,
            pdfImages: msg.pdfImages && msg.pdfImages.some(img => img.length > 50000) ? undefined : msg.pdfImages,
            pptImages: msg.pptImages && msg.pptImages.some(img => img.length > 50000) ? undefined : msg.pptImages
          }))
          localStorage.setItem(KEYS.MESSAGES, JSON.stringify(simplifiedMessages))
        } else {
          localStorage.setItem(KEYS.MESSAGES, messagesData)
        }

        localStorage.setItem(KEYS.WELCOME, JSON.stringify(welcomeAdded.value))
      } catch (error) {
        console.error('保存聊天数据失败:', error)
        // 降级保存纯文本版本
        try {
          const textOnlyMessages = messages.value.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }))
          localStorage.setItem(KEYS.MESSAGES, JSON.stringify(textOnlyMessages))
        } catch (secondError) {
          console.error('无法保存任何聊天数据:', secondError)
        }
      }
      saveTimer = null
    }, 300) // 300ms防抖
  }

  // ========== 同步机制 ==========

  const syncMessageToOtherWindows = (type: 'user' | 'assistant' | 'remove' | 'update', data: { message?: ChatMessage; messageId?: string; content?: string }): void => {
    try {
      let syncData: Record<string, unknown>

      if (type === 'user' && data.message) {
        const msg = data.message
        syncData = {
          type: 'user',
          message: {
            ...msg,
            videoBase64: msg.videoBase64 ? '[视频数据已省略]' : undefined,
            image: msg.image && msg.image.length > 100000 ? '[图片数据已省略]' : msg.image,
            pdfImages: msg.pdfImages && msg.pdfImages.some(img => img.length > 50000) ? ['[PDF图片数据已省略]'] : msg.pdfImages,
            pptImages: msg.pptImages && msg.pptImages.some(img => img.length > 50000) ? ['[PPT图片数据已省略]'] : msg.pptImages
          },
          timestamp: Date.now()
        }
      } else if (type === 'assistant' && data.message) {
        syncData = {
          type: 'assistant',
          message: data.message,
          timestamp: Date.now()
        }
      } else if (type === 'update' && data.messageId && data.content !== undefined) {
        syncData = {
          type: 'update',
          messageId: data.messageId,
          content: data.content,
          timestamp: Date.now()
        }
      } else if (type === 'remove' && data.messageId) {
        syncData = {
          type: 'remove',
          messageId: data.messageId,
          timestamp: Date.now()
        }
      } else {
        return
      }

      const syncString = JSON.stringify(syncData)

      // 检查数据大小
      if (syncString.length > 1000000) {
        if (type === 'user' && data.message) {
          syncData = {
            type: 'user',
            message: {
              id: data.message.id,
              role: data.message.role,
              content: data.message.content,
              timestamp: data.message.timestamp,
              hasMedia: true
            },
            timestamp: Date.now()
          }
        } else if (type === 'update' && data.content) {
          syncData = {
            type: 'update',
            messageId: data.messageId,
            content: data.content.substring(0, 50000) + '\n\n[内容过长，已截断...]',
            truncated: true,
            timestamp: Date.now()
          }
        }
      }

      localStorage.setItem(KEYS.LAST_MESSAGE, JSON.stringify(syncData))
    } catch (error) {
      console.warn('无法同步消息到其他窗口:', error)
    }
  }

  const setupMessageListeners = (): void => {
    window.addEventListener('storage', event => {
      // 处理新消息同步
      if (event.key === KEYS.LAST_MESSAGE && event.newValue) {
        try {
          const data = JSON.parse(event.newValue)

          if (data.type === 'assistant' && data.message) {
            const exists = messages.value.some(msg => msg.timestamp === data.message.timestamp && msg.role === data.message.role && msg.content === data.message.content)
            if (!exists) {
              messages.value.push(data.message)
              saveToStorage()
            }
          } else if (data.type === 'update' && data.messageId && data.content !== undefined) {
            const messageIndex = messages.value.findIndex(msg => msg.id === data.messageId)
            if (messageIndex !== -1) {
              messages.value[messageIndex].content = data.content
              saveToStorage()
            }
          } else if (data.type === 'remove' && data.messageId) {
            const messageIndex = messages.value.findIndex(msg => msg.id === data.messageId)
            if (messageIndex !== -1) {
              messages.value.splice(messageIndex, 1)
              saveToStorage()
            }
          } else if (data.type === 'user' && data.message) {
            const exists = messages.value.some(msg => msg.timestamp === data.message.timestamp && msg.role === data.message.role && msg.content === data.message.content)
            if (!exists) {
              messages.value.push(data.message)
              saveToStorage()
            }
          }
        } catch (error) {
          console.error('Error processing message:', error)
        }
      }

      // 处理加载状态变化
      if (event.key === KEYS.LOADING && event.newValue) {
        try {
          const loading = JSON.parse(event.newValue)
          if (typeof loading === 'boolean') {
            isLoading.value = loading
          }
        } catch (error) {
          console.error('Error processing loading state:', error)
        }
      }

      // 处理消息列表直接更新
      if (event.key === KEYS.MESSAGES && event.newValue) {
        try {
          const newMessages = JSON.parse(event.newValue)
          if (Array.isArray(newMessages)) {
            if (messages.value.length !== newMessages.length || JSON.stringify(messages.value) !== JSON.stringify(newMessages)) {
              messages.value = newMessages
            }
          }
        } catch (error) {
          console.error('Error processing messages update:', error)
        }
      }

      // 处理待发送媒体变化
      if (event.key === KEYS.PENDING_MEDIA) {
        try {
          if (event.newValue) {
            const newPendingMedia = JSON.parse(event.newValue)
            if (typeof newPendingMedia === 'object') {
              pendingMedia.value = newPendingMedia
            }
          } else {
            pendingMedia.value = {}
          }
        } catch (error) {
          console.error('Error processing pending media update:', error)
        }
      }
    })
  }

  // ========== 媒体管理 ==========

  const setPendingMedia = (media: Partial<PendingMedia>): void => {
    pendingMedia.value = { ...pendingMedia.value, ...media }
    localStorage.setItem(KEYS.PENDING_MEDIA, JSON.stringify(pendingMedia.value))
  }

  const clearPendingMedia = (): void => {
    pendingMedia.value = {}
    localStorage.removeItem(KEYS.PENDING_MEDIA)
  }

  const hasPendingMedia = (): boolean => {
    return !!(pendingMedia.value.image || pendingMedia.value.video || (pendingMedia.value.pdfImages && pendingMedia.value.pdfImages.length > 0) || (pendingMedia.value.pptImages && pendingMedia.value.pptImages.length > 0) || (pendingMedia.value.wordImages && pendingMedia.value.wordImages.length > 0))
  }

  // ========== 对话管理 ==========

  const generateConversationTitle = (): string => {
    const firstUserMessage = messages.value.find(msg => msg.role === 'user')
    if (firstUserMessage) {
      const content = firstUserMessage.content
      return content.length > 30 ? content.substring(0, 30) + '...' : content || '新对话'
    }
    return '新对话'
  }

  const getHistoryForAPI = (maxTurns: number = 4): Array<{ role: 'user' | 'assistant'; content: string; image?: string; video?: string; pdfImages?: string[]; pptImages?: string[]; wordImages?: string[] }> => {
    const maxMessages = maxTurns * 2 + 1
    const recentMessages = realMessages.value.slice(-maxMessages)

    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      image: msg.image,
      video: msg.videoBase64 || (msg.video && msg.video.startsWith('data:') ? msg.video : undefined),
      pdfImages: msg.pdfImages,
      pptImages: msg.pptImages,
      wordImages: msg.wordImages
    }))
  }

  const loadLatestConversation = async (): Promise<boolean> => {
    try {
      if (window.api?.database) {
        const conversations = await window.api.database.getConversationList()
        if (conversations.length > 0) {
          const latest = conversations.sort((a, b) => b.timestamp - a.timestamp)[0]
          console.log('自动加载最新对话:', latest.title)
          return await loadConversation(latest.id)
        }
      }

      const history: ConversationHistory[] = JSON.parse(localStorage.getItem('polaris-chat-history') || '[]')
      if (history.length > 0) {
        const latest = history.sort((a, b) => b.timestamp - a.timestamp)[0]
        console.log('从localStorage自动加载最新对话:', latest.title)
        return await loadConversation(latest.id)
      }
    } catch (error) {
      console.error('加载最新对话失败:', error)
    }
    return false
  }

  const startNewConversation = async (): Promise<void> => {
    // 保存当前完整对话
    if (hasCompleteConversation.value) {
      console.log('保存当前完整对话到历史记录')
      await saveCurrentConversation()
    }

    // 取消所有请求
    window.dispatchEvent(new CustomEvent('cancel-current-request'))
    if (window.api?.apiStreamCancelAll) {
      try {
        await window.api.apiStreamCancelAll()
        console.log('已取消所有主进程流式请求')
      } catch (error) {
        console.warn('取消主进程流式请求失败:', error)
      }
    }

    // 重置状态
    messages.value = []
    welcomeAdded.value = false
    isLoading.value = false
    currentConversationId.value = null
    clearPendingMedia()

    // 清理本地存储
    localStorage.removeItem(KEYS.MESSAGES)
    localStorage.setItem(KEYS.WELCOME, JSON.stringify(false))
    localStorage.setItem(KEYS.LOADING, JSON.stringify(false))

    addWelcomeMessageIfNeeded()
  }

  const getConversationHistory = (): Array<{ id: string; title: string; timestamp: number; messageCount: number }> => {
    if (window.api?.database) {
      return []
    }

    const history: ConversationHistory[] = JSON.parse(localStorage.getItem('polaris-chat-history') || '[]')
    return history.map((conv: ConversationHistory) => ({
      id: conv.id,
      title: conv.title,
      timestamp: conv.timestamp,
      messageCount: conv.messages?.length || 0
    }))
  }

  const getConversationHistoryAsync = async (): Promise<Array<{ id: string; title: string; timestamp: number; messageCount: number }>> => {
    if (window.api?.database) {
      try {
        return await window.api.database.getConversationList()
      } catch (error) {
        console.error('从数据库获取对话历史失败:', error)
      }
    }
    return getConversationHistory()
  }

  const loadConversation = async (conversationId: string): Promise<boolean> => {
    try {
      window.dispatchEvent(new CustomEvent('cancel-current-request'))

      if (window.api?.apiStreamCancelAll) {
        try {
          await window.api.apiStreamCancelAll()
          console.log('加载对话时已取消所有主进程流式请求')
        } catch (error) {
          console.warn('加载对话时取消主进程流式请求失败:', error)
        }
      }

      if (window.api?.database) {
        const conversation = await window.api.database.loadConversation(conversationId)
        if (conversation) {
          messages.value = conversation.messages || []
          welcomeAdded.value = messages.value.length > 0
          currentConversationId.value = conversationId
          isLoading.value = false
          saveToStorage()
          return true
        }
      }

      const history: ConversationHistory[] = JSON.parse(localStorage.getItem('polaris-chat-history') || '[]')
      const conversation = history.find((conv: ConversationHistory) => conv.id === conversationId)

      if (conversation) {
        messages.value = conversation.messages || []
        welcomeAdded.value = messages.value.length > 0
        currentConversationId.value = conversationId
        isLoading.value = false
        saveToStorage()
        return true
      }
    } catch (error) {
      console.error('加载对话失败:', error)
    }
    return false
  }

  const deleteConversation = async (conversationId: string): Promise<boolean> => {
    try {
      if (window.api?.database) {
        return await window.api.database.deleteConversation(conversationId)
      }

      const history: ConversationHistory[] = JSON.parse(localStorage.getItem('polaris-chat-history') || '[]')
      const filteredHistory = history.filter((conv: ConversationHistory) => conv.id !== conversationId)
      localStorage.setItem('polaris-chat-history', JSON.stringify(filteredHistory))
      return true
    } catch (error) {
      console.error('删除对话失败:', error)
      return false
    }
  }

  const saveCurrentConversation = async (): Promise<void> => {
    // 隐私模式下不保存对话
    if (isPrivateMode.value) {
      console.log('隐私模式：跳过保存对话历史')
      return
    }

    if (realMessages.value.length === 0 || !hasCompleteConversation.value) {
      console.log('跳过保存：对话不完整')
      return
    }

    if (!currentConversationId.value) {
      currentConversationId.value = generateMessageId()
    }

    // 清理消息数据
    const cleanMessages: ChatMessage[] = realMessages.value.map(msg => ({
      id: String(msg.id || ''),
      role: (msg.role as 'user' | 'assistant') || 'user',
      content: String(msg.content || ''),
      image: msg.image ? String(msg.image) : undefined,
      video: msg.video ? String(msg.video) : undefined,
      videoBase64: msg.videoBase64 ? String(msg.videoBase64) : undefined,
      pdfImages: msg.pdfImages ? [...msg.pdfImages] : undefined,
      pdfName: msg.pdfName ? String(msg.pdfName) : undefined,
      pptImages: msg.pptImages ? [...msg.pptImages] : undefined,
      pptName: msg.pptName ? String(msg.pptName) : undefined,
      pptTotalPages: msg.pptTotalPages ? Number(msg.pptTotalPages) : undefined,
      timestamp: Number(msg.timestamp || Date.now())
    }))

    const conversation = {
      id: currentConversationId.value,
      title: generateConversationTitle(),
      messages: cleanMessages,
      timestamp: Date.now(),
      messageCount: cleanMessages.length
    }

    if (window.api?.database) {
      try {
        await window.api.database.saveConversationIncremental(conversation)
      } catch (error) {
        console.error('保存对话到数据库失败:', error)
        await saveToLocalStorage(conversation)
      }
    } else {
      await saveToLocalStorage(conversation)
    }
  }

  const saveToLocalStorage = async (conversation: ConversationHistory): Promise<void> => {
    try {
      const history: ConversationHistory[] = JSON.parse(localStorage.getItem('polaris-chat-history') || '[]')
      const existingIndex = history.findIndex(conv => conv.id === conversation.id)

      if (existingIndex >= 0) {
        history[existingIndex] = conversation
      } else {
        history.unshift(conversation)
        if (history.length > 20) {
          history.splice(20)
        }
      }

      localStorage.setItem('polaris-chat-history', JSON.stringify(history))
    } catch (error) {
      console.error('保存对话到localStorage失败:', error)
    }
  }

  const switchToMessageAndScroll = (messageId: string): void => {
    localStorage.setItem(
      'polaris-chat-switch-to-message',
      JSON.stringify({
        messageId,
        timestamp: Date.now()
      })
    )
  }

  // 切换隐私模式
  const togglePrivateMode = (): void => {
    isPrivateMode.value = !isPrivateMode.value
    console.log(`隐私模式已${isPrivateMode.value ? '开启' : '关闭'}`)
  }

  // 初始化
  initialize()

  return {
    // 状态
    messages,
    isLoading,
    isGenerating,
    welcomeAdded,
    currentConversationId,
    pendingMedia,
    isPrivateMode,

    // 计算属性
    realMessages,
    hasCompleteConversation,

    // 消息管理
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessageContent,
    removeMessage,
    addWelcomeMessageIfNeeded,
    updateWelcomeMessage,

    // 状态管理
    setLoading,
    setGenerating,
    clearMessages,

    // 存储管理
    saveToStorage,

    // 媒体管理
    setPendingMedia,
    clearPendingMedia,
    hasPendingMedia,

    // 对话管理
    getHistoryForAPI,
    loadLatestConversation,
    startNewConversation,
    getConversationHistory,
    getConversationHistoryAsync,
    loadConversation,
    deleteConversation,
    saveCurrentConversation,
    switchToMessageAndScroll,
    togglePrivateMode
  }
})
