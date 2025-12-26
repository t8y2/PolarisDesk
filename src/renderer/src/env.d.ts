/// <reference types="vite/client" />

// 消息类型定义
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

// 对话历史类型定义
interface ConversationHistory {
  id: string
  title: string
  messages: ChatMessage[]
  timestamp: number
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, never>, Record<string, never>, any>
  export default component
}

// Window API types for Electron
interface Window {
  api?: {
    getScreenSources: () => Promise<Array<{ id: string; name: string; thumbnail: string }>>
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

    getClipboardImage: () => Promise<string | null>
    quickScreenshot: () => Promise<string>
    switchToFloating: () => Promise<boolean>
    switchToMain: () => Promise<boolean>
    onQuickScreenshot: (callback: () => void) => void
    offQuickScreenshot: (callback: () => void) => void
    moveFloatingWindow: (deltaX: number, deltaY: number) => void
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

    // 系统默认浏览器打开外部链接
    openExternal: (url: string) => Promise<void>

    // 屏幕录制功能
    startScreenRecording: () => Promise<boolean>
    stopScreenRecording: () => Promise<Buffer | null>
    startAreaScreenRecording: (area: { x: number; y: number; width: number; height: number }) => Promise<boolean>
    selectRecordingArea: () => Promise<{ x: number; y: number; width: number; height: number }>
    saveRecordingToFile: (recordingBuffer: Buffer) => Promise<{ success: boolean; filePath?: string; message: string }>
    onRecordingStateChange: (callback: (isRecording: boolean) => void) => void
    offRecordingStateChange: (callback: (isRecording: boolean) => void) => void

    // 数据库相关功能
    database: {
      saveConversation: (conversation: ConversationHistory) => Promise<boolean>
      saveConversationIncremental: (conversation: ConversationHistory) => Promise<boolean>
      getConversationList: () => Promise<Array<{ id: string; title: string; timestamp: number; messageCount: number }>>
      loadConversation: (conversationId: string) => Promise<ConversationHistory | null>
      deleteConversation: (conversationId: string) => Promise<boolean>
      searchConversations: (keyword: string) => Promise<Array<{ id: string; title: string; timestamp: number; messageCount: number }>>
      getStats: () => Promise<{ totalConversations: number; totalMessages: number; dbSize: string }>
      cleanup: (keepRecentCount?: number) => Promise<boolean>
    }
  }
}
