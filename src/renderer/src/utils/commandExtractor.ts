/**
 * 命令状态接口
 */
export interface CommandState {
  command: string
  executed?: boolean
  dismissed?: boolean
  exitCode?: number
  output?: string
  error?: string
}

/**
 * 从 AI 回复中提取命令块
 * 格式: <command>命令内容</command>
 * 或带状态: <command executed="true" exitCode="0">命令内容<output>输出</output><error>错误</error></command>
 */
export function extractCommands(content: string): CommandState[] {
  // 先移除 <think> 标签内的内容，避免误匹配
  const contentWithoutThink = content.replace(/<think>[\s\S]*?<\/think>/g, '')

  const commands: CommandState[] = []
  const regex = /<command([^>]*)>([\s\S]*?)<\/command>/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(contentWithoutThink)) !== null) {
    const attributes = match[1]
    const innerContent = match[2]

    // 提取命令文本（去除 output 和 error 标签）
    const commandText = innerContent
      .replace(/<output>[\s\S]*?<\/output>/g, '')
      .replace(/<error>[\s\S]*?<\/error>/g, '')
      .trim()

    // 清理命令文本：
    // 1. 移除可能的注释（# 开头的行）
    // 2. 移除多余的换行和空格
    // 3. 只保留第一行作为命令（如果有多行）
    const lines = commandText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))

    if (lines.length === 0) continue

    // 只取第一行作为命令
    const command = lines[0].trim()
    if (!command) continue

    const state: CommandState = { command }

    // 解析属性
    if (attributes) {
      const executedMatch = attributes.match(/executed="([^"]*)"/)
      const dismissedMatch = attributes.match(/dismissed="([^"]*)"/)
      const exitCodeMatch = attributes.match(/exitCode="([^"]*)"/)

      if (executedMatch) state.executed = executedMatch[1] === 'true'
      if (dismissedMatch) state.dismissed = dismissedMatch[1] === 'true'
      if (exitCodeMatch) state.exitCode = parseInt(exitCodeMatch[1])
    }

    // 提取 output 和 error（从原始内容中提取，不是从 contentWithoutThink）
    const outputMatch = innerContent.match(/<output>([\s\S]*?)<\/output>/)
    const errorMatch = innerContent.match(/<error>([\s\S]*?)<\/error>/)

    if (outputMatch) state.output = unescapeHtml(outputMatch[1])
    if (errorMatch) state.error = unescapeHtml(errorMatch[1])

    commands.push(state)
  }

  // 只返回最后一个命令（通常是最完整或最推荐的版本）
  return commands.length > 0 ? [commands[commands.length - 1]] : []
}

/**
 * 移除命令块标记，保留其他内容
 */
export function removeCommandBlocks(content: string): string {
  return content.replace(/<command[^>]*>[\s\S]*?<\/command>/g, '').trim()
}

/**
 * 更新消息中的命令状态
 */
export function updateCommandState(content: string, commandText: string, state: Partial<Omit<CommandState, 'command'>>): string {
  const escapedCommand = escapeRegExp(commandText)
  const regex = new RegExp(`<command([^>]*)>${escapedCommand}(?:<output>[\\s\\S]*?<\\/output>)?(?:<error>[\\s\\S]*?<\\/error>)?<\\/command>`, 'g')

  return content.replace(regex, (fullMatch, attributes) => {
    // 解析现有属性
    const attrs: Record<string, string> = {}

    if (attributes) {
      const attrRegex = /(\w+)="([^"]*)"/g
      let attrMatch: RegExpExecArray | null
      while ((attrMatch = attrRegex.exec(attributes)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2]
      }
    }

    // 更新状态
    if (state.executed !== undefined) attrs.executed = String(state.executed)
    if (state.dismissed !== undefined) attrs.dismissed = String(state.dismissed)
    if (state.exitCode !== undefined) attrs.exitCode = String(state.exitCode)

    // 构建新的属性字符串
    const newAttrs = Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')

    // 构建输出和错误标签
    let innerContent = commandText
    if (state.output) {
      innerContent += `<output>${escapeHtml(state.output)}</output>`
    }
    if (state.error) {
      innerContent += `<error>${escapeHtml(state.error)}</error>`
    }

    return `<command ${newAttrs}>${innerContent}</command>`
  })
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * 反转义 HTML 特殊字符
 */
function unescapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'"
  }
  return text.replace(/&(?:amp|lt|gt|quot|#039);/g, m => map[m])
}

/**
 * 检测内容是否可能包含命令意图
 */
export function hasCommandIntent(content: string): boolean {
  const commandKeywords = ['执行', '运行', '命令', '帮我', '帮忙', '列出', '显示', '查看', '创建', '删除', '查找', '搜索', '安装', '启动', '停止', 'execute', 'run', 'command', 'list', 'show', 'create', 'delete', 'find', 'search', 'install']

  const lowerContent = content.toLowerCase()
  return commandKeywords.some(keyword => lowerContent.includes(keyword))
}
