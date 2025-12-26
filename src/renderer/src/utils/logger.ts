/**
 * 高级日志工具
 * 提供美观、结构化的控制台输出
 */

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug' | 'api' | 'stream'

interface LogStyle {
  icon: string
  color: string
  bgColor: string
  label: string
}

const LOG_STYLES: Record<LogLevel, LogStyle> = {
  info: {
    icon: 'ℹ️',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    label: 'INFO'
  },
  success: {
    icon: '✓',
    color: '#10b981',
    bgColor: '#d1fae5',
    label: 'SUCCESS'
  },
  warning: {
    icon: '⚠️',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    label: 'WARNING'
  },
  error: {
    icon: '✗',
    color: '#ef4444',
    bgColor: '#fee2e2',
    label: 'ERROR'
  },
  debug: {
    icon: '🔍',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    label: 'DEBUG'
  },
  api: {
    icon: '🌐',
    color: '#06b6d4',
    bgColor: '#cffafe',
    label: 'API'
  },
  stream: {
    icon: '📡',
    color: '#ec4899',
    bgColor: '#fce7f3',
    label: 'STREAM'
  }
}

class Logger {
  private isDevelopment = import.meta.env.DEV
  private groupStack: string[] = []

  /**
   * 格式化时间戳
   */
  private getTimestamp(): string {
    const now = new Date()
    return now.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  /**
   * 基础日志方法
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.isDevelopment && level === 'debug') return

    const style = LOG_STYLES[level]
    const timestamp = this.getTimestamp()

    // 主标签样式
    const labelStyle = `
      background: ${style.bgColor};
      color: ${style.color};
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 11px;
    `

    // 时间戳样式
    const timeStyle = `
      color: #9ca3af;
      font-size: 10px;
      margin-left: 4px;
    `

    // 消息样式
    const messageStyle = `
      color: ${style.color};
      font-weight: 500;
    `

    console.log(`%c${style.label}%c ${timestamp} %c${style.icon} ${message}`, labelStyle, timeStyle, messageStyle)

    if (data !== undefined) {
      console.log(data)
    }
  }

  /**
   * 信息日志
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  /**
   * 成功日志
   */
  success(message: string, data?: unknown): void {
    this.log('success', message, data)
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: unknown): void {
    this.log('warning', message, data)
  }

  /**
   * 错误日志
   */
  error(message: string, error?: unknown): void {
    this.log('error', message)
    if (error) {
      console.error(error)
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  /**
   * API 请求日志
   */
  api(message: string, data?: unknown): void {
    this.log('api', message, data)
  }

  /**
   * 流式响应日志
   */
  stream(message: string, data?: unknown): void {
    this.log('stream', message, data)
  }

  /**
   * 开始一个日志组
   */
  group(title: string, collapsed = false): void {
    const style = `
      color: #6366f1;
      font-weight: bold;
      font-size: 12px;
      padding: 4px 0;
    `

    if (collapsed) {
      console.groupCollapsed(`%c▶ ${title}`, style)
    } else {
      console.group(`%c▼ ${title}`, style)
    }

    this.groupStack.push(title)
  }

  /**
   * 结束当前日志组
   */
  groupEnd(): void {
    if (this.groupStack.length > 0) {
      console.groupEnd()
      this.groupStack.pop()
    }
  }

  /**
   * API 请求详情
   */
  apiRequest(config: { provider: string; model: string; url: string; method?: string; hasApiKey?: boolean }): void {
    this.group(`🚀 API Request - ${config.provider}`, true)

    const tableData = {
      服务商: config.provider,
      模型: config.model,
      URL: config.url,
      方法: config.method || 'POST',
      'API Key': config.hasApiKey ? '✓ 已配置' : '✗ 未配置'
    }

    console.table(tableData)
    this.groupEnd()
  }

  /**
   * API 响应详情
   */
  apiResponse(config: { provider: string; status: 'success' | 'error'; duration?: number; contentLength?: number; error?: string }): void {
    const icon = config.status === 'success' ? '✓' : '✗'
    const color = config.status === 'success' ? '#10b981' : '#ef4444'

    const style = `
      color: ${color};
      font-weight: bold;
    `

    console.log(`%c${icon} API Response - ${config.provider}`, style)

    if (config.status === 'success') {
      const info = []
      if (config.duration) info.push(`⏱️ ${config.duration}ms`)
      if (config.contentLength) info.push(`📦 ${config.contentLength} chars`)
      if (info.length > 0) {
        console.log(`  ${info.join(' | ')}`)
      }
    } else if (config.error) {
      console.error(`  ❌ ${config.error}`)
    }
  }

  /**
   * 流式输出统计
   */
  streamStats(stats: { provider: string; model: string; totalChunks: number; totalChars: number; duration: number; reasoningChars?: number; contentChars?: number }): void {
    this.group(`📊 Stream Statistics - ${stats.provider}`, true)

    const tableData: Record<string, string | number> = {
      模型: stats.model,
      总块数: stats.totalChunks,
      总字符数: stats.totalChars,
      耗时: `${stats.duration}ms`,
      平均速度: `${Math.round(stats.totalChars / (stats.duration / 1000))} chars/s`
    }

    if (stats.reasoningChars !== undefined) {
      tableData['思考内容'] = `${stats.reasoningChars} chars`
    }
    if (stats.contentChars !== undefined) {
      tableData['回复内容'] = `${stats.contentChars} chars`
    }

    console.table(tableData)
    this.groupEnd()
  }

  /**
   * 设置变更日志
   */
  settingsChange(changes: Record<string, { old: unknown; new: unknown }>): void {
    this.group('⚙️ Settings Changed', true)

    Object.entries(changes).forEach(([key, { old, new: newValue }]) => {
      console.log(`%c${key}%c: %c${String(old)}%c → %c${String(newValue)}`, 'color: #6366f1; font-weight: bold', 'color: #9ca3af', 'color: #ef4444; text-decoration: line-through', 'color: #9ca3af', 'color: #10b981; font-weight: bold')
    })

    this.groupEnd()
  }

  /**
   * 性能标记
   */
  time(label: string): void {
    console.time(`⏱️ ${label}`)
  }

  /**
   * 性能标记结束
   */
  timeEnd(label: string): void {
    console.timeEnd(`⏱️ ${label}`)
  }

  /**
   * 清空控制台
   */
  clear(): void {
    console.clear()
    this.info('Console cleared')
  }

  /**
   * 打印欢迎信息
   */
  welcome(): void {
    const style = `
      color: #6366f1;
      font-size: 16px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(99, 102, 241, 0.3);
    `

    console.log(
      `%c
╔═══════════════════════════════════════════╗
║                                           ║
║     🚀 PolarisDesk v1.0.6                ║
║                                           ║
║     Multi-Provider AI Assistant          ║
║                                           ║
╚═══════════════════════════════════════════╝
      `,
      style
    )

    this.info('Application initialized')
    this.debug('Development mode enabled')
  }
}

// 导出单例
export const logger = new Logger()

// 开发环境下自动显示欢迎信息
if (import.meta.env.DEV) {
  logger.welcome()
}
