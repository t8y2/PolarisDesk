import { ElectronAPI } from '@electron-toolkit/preload'

// 定义消息类型
interface ChatMessage {
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
  timestamp?: number
}

// 定义对话历史类型
interface ConversationHistory {
  id: string
  title: string
  messages: ChatMessage[]
  timestamp: number
  messageCount: number
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getScreenSources: () => Promise<
        Array<{
          id: string
          name: string
          thumbnail: string
        }>
      >
      getPrimaryDisplay: () => Promise<{
        x: number
        y: number
        width: number
        height: number
      }>
      captureScreen: () => Promise<string>
      captureScreenArea: () => Promise<{
        fullImage: string
        area: { x: number; y: number; width: number; height: number }
      }>
      apiRequest: (
        url: string,
        options: RequestInit
      ) => Promise<{
        ok: boolean
        status: number
        data: unknown
      }>

      // 流式API请求
      apiStreamRequest: (
        url: string,
        options: RequestInit,
        streamId: string
      ) => Promise<{
        ok: boolean
        status: number
      }>
      apiStreamCancel: (streamId: string) => Promise<void>
      apiStreamCancelAll: () => Promise<void>
      onStreamChunk: (callback: (streamId: string, chunk: string | null, isDone: boolean) => void) => (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
      onStreamError: (callback: (streamId: string, error: string) => void) => (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
      offStreamChunk: (wrappedCallback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => void
      offStreamError: (wrappedCallback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => void

      // 粘贴板图片
      getClipboardImage: () => Promise<string | null>

      // 快速截图
      quickScreenshot: () => Promise<string>

      // 窗口模式切换
      switchToFloating: () => Promise<boolean>
      switchToMain: () => Promise<boolean>

      // 渲染进程初始化完成通知
      rendererInitializationComplete: () => Promise<boolean>

      // 监听快捷键触发的截图
      onQuickScreenshot: (callback: () => void) => void
      offQuickScreenshot: (callback: () => void) => void

      // 悬浮窗控制
      closeFloatingWindow: () => void

      // 响应窗口控制
      showResponseWindow: (response: string) => Promise<void>
      closeResponseWindow: () => void

      // HTML预览窗口控制
      showHtmlPreview: (htmlContent: string) => Promise<boolean>
      closeHtmlPreview: () => void

      // 窗口置顶功能
      toggleAlwaysOnTop: () => Promise<boolean>
      getAlwaysOnTopStatus: () => Promise<boolean>

      // 置顶状态刷新监听
      onRefreshPinStatus: (callback: () => void) => void
      offRefreshPinStatus: (callback: () => void) => void

      // 系统功能
      openExternal: (url: string) => Promise<void>

      // 数据库相关功能
      database: {
        saveConversation: (conversation: ConversationHistory) => Promise<boolean>
        saveConversationIncremental: (conversation: ConversationHistory) => Promise<boolean>
        saveMessage: (conversationId: string, message: ChatMessage) => Promise<boolean>
        saveOrUpdateConversation: (conversationId: string, title: string, timestamp: number, messageCount: number) => Promise<boolean>
        getConversationList: () => Promise<Array<{ id: string; title: string; timestamp: number; messageCount: number }>>
        loadConversation: (conversationId: string) => Promise<ConversationHistory | null>
        deleteConversation: (conversationId: string) => Promise<boolean>
        searchConversations: (keyword: string) => Promise<Array<{ id: string; title: string; timestamp: number; messageCount: number }>>
        getStats: () => Promise<{ totalConversations: number; totalMessages: number; dbSize: string }>
        cleanup: (keepRecentCount?: number) => Promise<boolean>
      }

      // 获取应用版本号
      getAppVersion: () => Promise<string>
    }
  }
}
