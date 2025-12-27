import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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

// Custom APIs for renderer
const api = {
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  getPrimaryDisplay: () => ipcRenderer.invoke('get-primary-display'),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  captureScreenArea: () => ipcRenderer.invoke('capture-screen-area'),
  apiRequest: (url: string, options: RequestInit) => ipcRenderer.invoke('api-request', url, options),

  // 流式API请求
  apiStreamRequest: (url: string, options: RequestInit, streamId: string) => ipcRenderer.invoke('api-stream-request', url, options, streamId),
  apiStreamCancel: (streamId: string) => ipcRenderer.invoke('api-stream-cancel', streamId),
  apiStreamCancelAll: () => ipcRenderer.invoke('api-stream-cancel-all'),
  onStreamChunk: (callback: (streamId: string, chunk: string | null, isDone: boolean) => void) => {
    const wrappedCallback = (_: Electron.IpcRendererEvent, streamId: string, chunk: string | null, isDone: boolean): void => callback(streamId, chunk, isDone)
    ipcRenderer.on('stream-chunk', wrappedCallback)
    return wrappedCallback
  },
  onStreamError: (callback: (streamId: string, error: string) => void) => {
    const wrappedCallback = (_: Electron.IpcRendererEvent, streamId: string, error: string): void => callback(streamId, error)
    ipcRenderer.on('stream-error', wrappedCallback)
    return wrappedCallback
  },
  offStreamChunk: (wrappedCallback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.removeListener('stream-chunk', wrappedCallback),
  offStreamError: (wrappedCallback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.removeListener('stream-error', wrappedCallback),

  // 粘贴板图片
  getClipboardImage: () => ipcRenderer.invoke('get-clipboard-image'),

  // 快速截图
  quickScreenshot: () => ipcRenderer.invoke('quick-screenshot'),

  // 窗口模式切换
  switchToFloating: () => ipcRenderer.invoke('switch-to-floating'),
  switchToMain: () => ipcRenderer.invoke('switch-to-main'),

  // 渲染进程初始化完成通知
  rendererInitializationComplete: () => ipcRenderer.invoke('renderer-initialization-complete'),

  // 监听快捷键触发的截图
  onQuickScreenshot: (callback: () => void) => ipcRenderer.on('trigger-quick-screenshot', callback),
  offQuickScreenshot: (callback: () => void) => ipcRenderer.removeListener('trigger-quick-screenshot', callback),

  // 悬浮窗控制
  closeFloatingWindow: () => ipcRenderer.send('close-floating-window'),

  // 响应窗口控制
  showResponseWindow: (response: string) => ipcRenderer.invoke('show-response-window', response),
  closeResponseWindow: () => ipcRenderer.send('close-response-window'),

  // HTML预览窗口控制
  showHtmlPreview: (htmlContent: string) => ipcRenderer.invoke('show-html-preview', htmlContent),
  closeHtmlPreview: () => ipcRenderer.send('close-html-preview'),

  // 窗口置顶功能
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  getAlwaysOnTopStatus: () => ipcRenderer.invoke('get-always-on-top-status'),

  // 置顶状态刷新监听
  onRefreshPinStatus: (callback: () => void) => ipcRenderer.on('refresh-pin-status', callback),
  offRefreshPinStatus: (callback: () => void) => ipcRenderer.removeListener('refresh-pin-status', callback),

  // 系统功能
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // 数据库相关功能
  database: {
    saveConversation: (conversation: ConversationHistory) => ipcRenderer.invoke('db-save-conversation', conversation),
    saveConversationIncremental: (conversation: ConversationHistory) => ipcRenderer.invoke('db-save-conversation-incremental', conversation),
    saveMessage: (conversationId: string, message: ChatMessage) => ipcRenderer.invoke('db-save-message', conversationId, message),
    saveOrUpdateConversation: (conversationId: string, title: string, timestamp: number, messageCount: number) => ipcRenderer.invoke('db-save-or-update-conversation', conversationId, title, timestamp, messageCount),
    getConversationList: () => ipcRenderer.invoke('db-get-conversation-list'),
    loadConversation: (conversationId: string) => ipcRenderer.invoke('db-load-conversation', conversationId),
    deleteConversation: (conversationId: string) => ipcRenderer.invoke('db-delete-conversation', conversationId),
    searchConversations: (keyword: string) => ipcRenderer.invoke('db-search-conversations', keyword),
    getStats: () => ipcRenderer.invoke('db-get-stats'),
    cleanup: (keepRecentCount?: number) => ipcRenderer.invoke('db-cleanup', keepRecentCount),
    cleanupDuplicates: () => ipcRenderer.invoke('db-cleanup-duplicates'),
    // 设置相关功能
    saveSetting: (key: string, value: string) => ipcRenderer.invoke('db-save-setting', key, value),
    getSetting: (key: string) => ipcRenderer.invoke('db-get-setting', key),
    getAllSettings: () => ipcRenderer.invoke('db-get-all-settings'),
    deleteSetting: (key: string) => ipcRenderer.invoke('db-delete-setting', key)
  },

  // 获取应用版本号
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 检查是否是首次启动
  isFirstLaunch: () => ipcRenderer.invoke('is-first-launch'),

  // 自动更新相关
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    onUpdateStatus: (callback: (event: string, data: unknown) => void) => {
      const wrappedCallback = (_: Electron.IpcRendererEvent, status: { event: string; data: unknown }): void => callback(status.event, status.data)
      ipcRenderer.on('update-status', wrappedCallback)
      return wrappedCallback
    },
    offUpdateStatus: (wrappedCallback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.removeListener('update-status', wrappedCallback)
  },

  // 命令执行相关
  command: {
    execute: (command: string) => ipcRenderer.invoke('execute-command', command),
    executeStream: (command: string, streamId: string) => ipcRenderer.invoke('execute-command-stream', command, streamId),
    cancelStream: (streamId: string) => ipcRenderer.invoke('cancel-command-stream', streamId),
    onStreamData: (callback: (streamId: string, data: string, isError: boolean) => void) => {
      const wrappedCallback = (_: Electron.IpcRendererEvent, streamId: string, data: string, isError: boolean): void => callback(streamId, data, isError)
      ipcRenderer.on('command-stream-data', wrappedCallback)
      return wrappedCallback
    },
    onStreamComplete: (callback: (streamId: string, exitCode: number) => void) => {
      const wrappedCallback = (_: Electron.IpcRendererEvent, streamId: string, exitCode: number): void => callback(streamId, exitCode)
      ipcRenderer.on('command-stream-complete', wrappedCallback)
      return wrappedCallback
    },
    offStreamData: (wrappedCallback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.removeListener('command-stream-data', wrappedCallback),
    offStreamComplete: (wrappedCallback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.removeListener('command-stream-complete', wrappedCallback)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
