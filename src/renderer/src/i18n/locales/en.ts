export default {
  app: {
    name: 'PolarisDesk',
    slogan: 'Like the North Star, guiding your way',
    loading: 'Starting application...'
  },
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    search: 'Search',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info'
  },
  header: {
    newConversation: 'New Conversation',
    history: 'History',
    settings: 'Model and App Settings',
    switchToFloating: 'Switch to Floating Window',
    privacyMode: 'Privacy Mode',
    privacyModeActive: 'Privacy Mode (Not Saved)',
    pin: 'Pin Window',
    unpin: 'Unpin Window'
  },
  chat: {
    inputPlaceholder: 'Type a message...',
    send: 'Send',
    newChat: 'New Chat',
    clearHistory: 'Clear History',
    thinking: 'Thinking...',
    generating: 'Generating...',
    copyCode: 'Copy Code',
    copied: 'Copied',
    retry: 'Retry',
    stop: 'Stop',
    expand: 'Expand',
    collapse: 'Collapse'
  },
  chatInput: {
    placeholder: 'Type your question...',
    send: 'Send',
    stop: 'Stop',
    quickScreenshot: 'Quick Screenshot',
    regionScreenshot: 'Region Screenshot',
    uploadFile: 'Upload File'
  },
  media: {
    imageToSend: 'Image to send',
    pdfDocument: 'PDF Document',
    pptDocument: 'PPT Document',
    pages: '{count} pages'
  },
  drag: {
    releaseToUpload: 'Release to upload',
    supportedFormats: 'Supports images, videos, PDF, PPT files'
  },
  think: {
    thinking: 'Thinking',
    thinkingProcess: 'Thinking Process',
    expand: 'Expand',
    collapse: 'Collapse'
  },
  answer: {
    label: 'Answer'
  },
  mediaActions: {
    reuse: 'Reuse',
    download: 'Download',
    image: 'Image',
    video: 'Video'
  },
  settings: {
    title: 'Settings',
    basic: 'Basic Settings',
    api: 'API Configuration',
    ui: 'UI Configuration',
    about: 'About',

    // Tabs
    modelSettings: 'Model Settings',
    appSettings: 'App Settings',
    systemPromptTab: 'System Prompt',
    aboutTab: 'About',

    // Basic settings
    generalSettings: 'General Settings',
    language: 'Language',
    theme: 'Theme',
    starryBackground: 'Starry Background',
    defaultExpandThink: 'Expand Thinking Process by Default',
    saveRecordingLocally: 'Save Recording Locally',

    // API configuration
    connectionSettings: 'Connection Settings',
    provider: 'AI Provider',
    apiUrl: 'API URL',
    apiKey: 'API Key',
    apiKeyRequired: 'API Key (Required)',
    getKey: 'Get Key',
    model: 'Model',
    modelPlaceholder: 'Enter model name, e.g. gpt-4o-mini',
    modelTip: 'Tip: LLM models only support text content, VLM models support images and text',
    maxTokens: 'Max Tokens',
    temperature: 'Temperature',
    topP: 'Top P',
    historyTurns: 'History Turns',
    historyTurnsTip: 'Controls the number of historical conversation turns sent to AI. 0 means no history',
    generationParams: 'Generation Parameters',

    // UI configuration
    userMessageWidth: 'User Message Width',
    aiMessageWidth: 'AI Message Width',

    // Shortcuts
    shortcuts: 'Shortcuts',
    quickScreenshot: 'Quick Screenshot',
    quickSwitchWindow: 'Quick Switch Window',
    newConversation: 'New Conversation',
    regionScreenshot: 'Region Screenshot',
    openHistory: 'Open History',
    sendMessage: 'Send Message',
    lineBreak: 'Line Break',
    pasteImage: 'Paste Image',

    // System prompt
    systemPromptLabel: 'System Prompt',
    systemPromptPlaceholder: 'Enter system prompt, e.g.: You are a professional assistant, please answer questions in a concise and clear manner...',
    systemPromptTip: 'Tip:',
    systemPromptTip1: 'System prompt affects AI response style and behavior',
    systemPromptTip2: 'Keep it concise, overly long prompts may affect performance',
    systemPromptTip3: 'Changes will be applied to new conversations immediately',

    // About
    appName: 'App Name',
    currentVersion: 'Current Version',
    githubRepo: 'GitHub Repository',
    checkUpdate: 'Check for Updates',
    checking: 'Checking...',
    newVersion: 'New Version',
    downloadUpdate: 'Download Update',
    downloading: 'Downloading...',
    restartAndInstall: 'Restart and Install',
    updateNotes: 'Update Notes:',
    updateNote1: 'Click "Check for Updates" to manually check for new versions',
    updateNote2: 'You can choose to download and install after finding a new version',
    updateNote3: 'Updates will be automatically installed after restart',

    // Providers
    providers: {
      openai: 'OpenAI',
      anthropic: 'Anthropic (Claude)',
      google: 'Google (Gemini)',
      deepseek: 'DeepSeek',
      moonshot: 'Moonshot (Kimi)',
      openrouter: 'OpenRouter',
      siliconcloud: 'SiliconCloud',
      ollama: 'Ollama',
      zhipu: 'Zhipu AI (GLM)',
      custom: 'Custom Endpoint'
    },

    // Theme options
    themes: {
      dark: 'Dark',
      light: 'Light'
    }
  },
  history: {
    title: 'History',
    clear: 'Clear',
    clearAllTip: 'Clear all history',
    clearAllTitle: 'Confirm Clear',
    clearAllContent: 'Are you sure you want to clear all history? This action cannot be undone.',
    clearAll: 'Confirm Clear',
    clearAllSuccess: 'History cleared',
    clearAllFailed: 'Failed to clear, please try again',
    searchPlaceholder: 'Search conversations...',
    loading: 'Loading...',
    newConversation: 'New Conversation',
    current: 'Current',
    messageCount: '{count} messages',
    noMatch: 'No matching conversations found',
    empty: 'No history yet',
    tryOtherKeywords: 'Try using other keywords',
    emptyTip: 'New conversations will be automatically saved here',
    deleteConfirmTitle: 'Confirm Delete',
    deleteConfirmContent: 'Are you sure you want to delete conversation "{title}"?',
    delete: 'Delete',
    deleteSuccess: 'Deleted successfully',
    deleteFailed: 'Delete failed',
    loadFailed: 'Failed to load history',
    justNow: 'Just now',
    minutesAgo: '{minutes} minutes ago',
    hoursAgo: '{hours} hours ago'
  },
  messages: {
    settingsSaved: 'Settings saved and applied immediately',
    newConversationStarted: 'New conversation started',
    privacyModeEnabled: 'Privacy mode enabled, this conversation will not be saved',
    privacyModeDisabled: 'Privacy mode disabled',
    windowPinned: 'Window pinned',
    windowUnpinned: 'Window unpinned',
    providerSwitched: 'Switched to {provider}, please configure the corresponding API Key',
    checking: 'Checking...',
    updateAvailable: 'New version {version} available',
    updateDownloaded: 'Update downloaded, click install button to restart the app',
    updateDownloadedReady: 'Update downloaded, ready to install',
    latestVersion: 'You are using the latest version',
    updateFailed: 'Update failed',
    cannotOpenBrowser: 'Cannot open browser page'
  },
  error: {
    networkError: 'Network Error',
    apiError: 'API Error',
    fileError: 'File Error',
    unknownError: 'Unknown Error',
    loadFailed: 'Load Failed',
    saveFailed: 'Save Failed',
    saveSettingsFailed: 'Failed to save settings',
    checkUpdateFailed: 'Failed to check for updates',
    downloadUpdateFailed: 'Failed to download update',
    installUpdateFailed: 'Failed to install update'
  },
  floating: {
    newConversation: 'New Conversation (Ctrl+Shift+N)',
    privacyMode: 'Privacy Mode',
    privacyModeActive: 'Privacy Mode (Not Saved)',
    pin: 'Pin Window',
    unpin: 'Unpin Window',
    switchToMain: 'Switch to Main Window',
    close: 'Close Floating Window',
    releaseToUpload: 'Release to upload',
    supportedFormats: 'Supports images/videos/PDF/PPT',
    clickToSwitchMain: 'Click to switch to main window',
    clickToViewFull: 'Click to switch to main window and view full reply',
    reuseImage: 'Reuse Image',
    downloadImage: 'Download Image',
    reuseVideo: 'Reuse Video',
    downloadVideo: 'Download Video',
    reusePdf: 'Reuse PDF',
    reusePpt: 'Reuse PPT',
    pdfDocument: 'PDF Document',
    pptDocument: 'PPT Document',
    pages: '{count} pages',
    imageSelected: 'Image selected',
    videoSelected: 'Video selected',
    clickSendToUpload: 'Click send button to upload and analyze',
    thinking: 'Thinking...',
    polarisThinking: 'Polaris is thinking...',
    inputPlaceholder: 'Type a message... Supports Ctrl+V paste or drag and drop files',
    processing: 'Processing...',
    uploadFile: 'Upload File',
    quickScreenshot: 'Quick Screenshot',
    regionScreenshot: 'Region Screenshot',
    rightClickToSwitch: '(Right-click to switch)',
    stopGeneration: 'Stop Generation',
    sendMessage: 'Send Message',
    imageAdded: 'Image added to input',
    videoAdded: 'Video added to input',
    pdfAdded: 'PDF added to input',
    pptAdded: 'PPT added to input',
    invalidMediaData: 'Invalid media data',
    unsupportedMediaFormat: 'Unsupported media format',
    reuseMediaFailed: 'Failed to reuse media, please try again',
    downloadFailed: 'Download failed, please try again',
    generationStopped: 'Generation stopped'
  },
  chatView: {
    htmlPreview: 'HTML Preview',
    codeCopied: 'Code copied to clipboard',
    copyFailed: 'Copy failed',
    fileSizeExceeded50MB: 'File size exceeds limit (50MB), please select a smaller file',
    imageSizeExceeded10MB: 'Image file size exceeds limit (10MB), please select a smaller image',
    videoSizeExceeded20MB: 'Video file size exceeds limit (20MB), please select a smaller video or compress it',
    unsupportedFileType: 'Unsupported file type, please select image, video, PDF or PPT file',
    fileProcessFailed: 'File processing failed, please try again',
    imageUploadSuccess: 'Image uploaded successfully',
    videoUploadSuccess: 'Video uploaded successfully'
  },
  userMessage: {
    uploadedImage: 'User uploaded image'
  },
  welcome: {
    message: 'Hello! I am PolarisDesk, I can help you analyze images, videos and answer questions. You can take screenshots, upload images/videos or chat with me directly.'
  }
}
