/**
 * 主进程高级日志工具
 * 提供美观、结构化的控制台输出
 */

import chalk from 'chalk'

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug' | 'api' | 'stream' | 'ipc' | 'window'

interface LogStyle {
  icon: string
  color: (text: string) => string
  label: string
}

const LOG_STYLES: Record<LogLevel, LogStyle> = {
  info: {
    icon: 'ℹ️',
    color: chalk.blue,
    label: 'INFO'
  },
  success: {
    icon: '✓',
    color: chalk.green,
    label: 'SUCCESS'
  },
  warning: {
    icon: '⚠️',
    color: chalk.yellow,
    label: 'WARNING'
  },
  error: {
    icon: '✗',
    color: chalk.red,
    label: 'ERROR'
  },
  debug: {
    icon: '🔍',
    color: chalk.magenta,
    label: 'DEBUG'
  },
  api: {
    icon: '🌐',
    color: chalk.cyan,
    label: 'API'
  },
  stream: {
    icon: '📡',
    color: chalk.magentaBright,
    label: 'STREAM'
  },
  ipc: {
    icon: '⚡',
    color: chalk.blueBright,
    label: 'IPC'
  },
  window: {
    icon: '🪟',
    color: chalk.cyanBright,
    label: 'WINDOW'
  }
}

class MainLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private groupLevel = 0

  /**
   * 格式化时间戳
   */
  private getTimestamp(): string {
    const now = new Date()
    return chalk.gray(
      now.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      })
    )
  }

  /**
   * 获取缩进
   */
  private getIndent(): string {
    return '  '.repeat(this.groupLevel)
  }

  /**
   * 基础日志方法
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.isDevelopment && level === 'debug') return

    const style = LOG_STYLES[level]
    const timestamp = this.getTimestamp()
    const indent = this.getIndent()

    // 构建日志行
    const labelPart = chalk.bold(style.color(`[${style.label}]`))
    const messagePart = style.color(`${style.icon} ${message}`)

    console.log(`${indent}${labelPart} ${timestamp} ${messagePart}`)

    if (data !== undefined) {
      if (typeof data === 'object') {
        console.log(chalk.gray(JSON.stringify(data, null, 2)))
      } else {
        console.log(chalk.gray(String(data)))
      }
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
      if (error instanceof Error) {
        console.error(chalk.red(`  ${error.name}: ${error.message}`))
        if (error.stack) {
          console.error(chalk.gray(error.stack))
        }
      } else {
        console.error(chalk.red(String(error)))
      }
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  /**
   * API 日志
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
   * IPC 通信日志
   */
  ipc(message: string, data?: unknown): void {
    this.log('ipc', message, data)
  }

  /**
   * 窗口管理日志
   */
  window(message: string, data?: unknown): void {
    this.log('window', message, data)
  }

  /**
   * 开始一个日志组
   */
  group(title: string): void {
    const indent = this.getIndent()
    console.log(`${indent}${chalk.bold.cyan('▼')} ${chalk.bold(title)}`)
    this.groupLevel++
  }

  /**
   * 结束当前日志组
   */
  groupEnd(): void {
    if (this.groupLevel > 0) {
      this.groupLevel--
    }
  }

  /**
   * API 请求详情
   */
  apiRequest(config: { method?: string; url: string; streamId?: string; hasBody?: boolean }): void {
    this.group(`🚀 API Request`)
    this.info(`Method: ${config.method || 'POST'}`)
    this.info(`URL: ${config.url}`)
    if (config.streamId) {
      this.info(`Stream ID: ${config.streamId}`)
    }
    if (config.hasBody) {
      this.info('Body: ✓ Present')
    }
    this.groupEnd()
  }

  /**
   * API 响应详情
   */
  apiResponse(config: { status: number; statusText?: string; duration?: number; isStream?: boolean }): void {
    const statusColor = config.status >= 200 && config.status < 300 ? chalk.green : chalk.red
    this.info(`Response: ${statusColor(config.status)} ${config.statusText || ''}`)
    if (config.duration) {
      this.info(`Duration: ${config.duration}ms`)
    }
    if (config.isStream) {
      this.stream('Stream mode enabled')
    }
  }

  /**
   * 流式统计
   */
  streamStats(stats: { streamId: string; totalChunks: number; status: 'completed' | 'cancelled' | 'error' }): void {
    this.group(`📊 Stream Statistics`)
    this.info(`Stream ID: ${stats.streamId}`)
    this.info(`Total Chunks: ${stats.totalChunks}`)

    if (stats.status === 'completed') {
      this.success('Status: Completed')
    } else if (stats.status === 'cancelled') {
      this.warn('Status: Cancelled')
    } else {
      this.error('Status: Error')
    }

    this.groupEnd()
  }

  /**
   * IPC 事件日志
   */
  ipcEvent(config: { channel: string; direction: 'receive' | 'send'; data?: unknown }): void {
    const arrow = config.direction === 'receive' ? '⬅️' : '➡️'
    const message = `${arrow} ${config.channel}`
    this.ipc(message, config.data)
  }

  /**
   * 窗口操作日志
   */
  windowOperation(config: { operation: 'create' | 'show' | 'hide' | 'close' | 'focus'; windowType: string; details?: string }): void {
    const operations = {
      create: '🆕 Created',
      show: '👁️ Shown',
      hide: '🙈 Hidden',
      close: '❌ Closed',
      focus: '🎯 Focused'
    }

    const message = `${operations[config.operation]} ${config.windowType}`
    this.window(message, config.details)
  }

  /**
   * 数据库操作日志
   */
  database(operation: string, details?: unknown): void {
    this.info(`💾 Database: ${operation}`, details)
  }

  /**
   * 性能标记
   */
  time(label: string): void {
    console.time(chalk.cyan(`⏱️  ${label}`))
  }

  /**
   * 性能标记结束
   */
  timeEnd(label: string): void {
    console.timeEnd(chalk.cyan(`⏱️  ${label}`))
  }

  /**
   * 分隔线
   */
  separator(): void {
    console.log(chalk.gray('─'.repeat(60)))
  }

  /**
   * 打印欢迎信息
   */
  welcome(): void {
    console.log(
      chalk.bold.cyan(`
╔═══════════════════════════════════════════╗
║                                           ║
║     🚀 Polaris Desk  v1.0.0.               ║
║                                           ║
║     Main Process Initialized              ║
║                                           ║
╚═══════════════════════════════════════════╝
      `)
    )
    this.info('Application starting...')
    if (this.isDevelopment) {
      this.debug('Development mode enabled')
    }
    this.separator()
  }

  /**
   * 打印启动完成信息
   */
  ready(): void {
    this.separator()
    this.success('Application ready!')
    this.info(`Process ID: ${process.pid}`)
    this.info(`Node version: ${process.version}`)
    this.info(`Electron version: ${process.versions.electron}`)
    this.separator()
  }
}

// 导出单例
export const logger = new MainLogger()

// 自动显示欢迎信息
logger.welcome()
