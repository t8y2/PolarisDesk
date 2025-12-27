import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { logger } from '../utils/logger'

const execAsync = promisify(exec)

export interface CommandResult {
  success: boolean
  output: string
  error?: string
  exitCode?: number
}

export class CommandExecutorService {
  // 执行命令并返回结果
  async executeCommand(command: string): Promise<CommandResult> {
    try {
      logger.info(`执行命令: ${command}`)

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30秒超时
        maxBuffer: 1024 * 1024 * 10 // 10MB 缓冲区
      })

      const output = stdout || stderr
      logger.success(`命令执行成功: ${command.substring(0, 50)}...`)

      return {
        success: true,
        output: output.trim(),
        exitCode: 0
      }
    } catch (error: any) {
      logger.error(`命令执行失败: ${command}`, error)

      return {
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
        exitCode: error.code || 1
      }
    }
  }

  // 流式执行命令（实时输出）
  executeCommandStream(command: string, onData: (data: string, isError: boolean) => void, onComplete: (exitCode: number) => void): () => void {
    logger.info(`流式执行命令: ${command}`)

    // 解析命令和参数
    const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || []
    const cmd = parts[0]
    const args = parts.slice(1).map(arg => arg.replace(/^"|"$/g, ''))

    const childProcess = spawn(cmd, args, {
      shell: true,
      env: process.env
    })

    childProcess.stdout.on('data', (data: Buffer) => {
      const output = data.toString()
      logger.debug(`命令输出: ${output.substring(0, 100)}`)
      onData(output, false)
    })

    childProcess.stderr.on('data', (data: Buffer) => {
      const output = data.toString()
      logger.debug(`命令错误输出: ${output.substring(0, 100)}`)
      onData(output, true)
    })

    childProcess.on('close', (code: number | null) => {
      logger.info(`命令执行完成，退出码: ${code}`)
      onComplete(code || 0)
    })

    childProcess.on('error', (error: Error) => {
      logger.error('命令执行出错', error)
      onData(`执行错误: ${error.message}`, true)
      onComplete(1)
    })

    // 返回取消函数
    return () => {
      if (!childProcess.killed) {
        logger.warn('终止命令执行')
        childProcess.kill()
      }
    }
  }
}

export const commandExecutorService = new CommandExecutorService()
