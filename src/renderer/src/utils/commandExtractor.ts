/**
 * 从 AI 回复中提取命令块
 * 格式: <command>命令内容</command>
 */
export function extractCommands(content: string): string[] {
  const commands: string[] = []
  const regex = /<command>([\s\S]*?)<\/command>/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const command = match[1].trim()
    if (command) {
      commands.push(command)
    }
  }

  return commands
}

/**
 * 移除命令块标记，保留其他内容
 */
export function removeCommandBlocks(content: string): string {
  return content.replace(/<command>[\s\S]*?<\/command>/g, '').trim()
}

/**
 * 检测内容是否可能包含命令意图
 */
export function hasCommandIntent(content: string): boolean {
  const commandKeywords = [
    '执行', '运行', '命令', '帮我', '帮忙',
    '列出', '显示', '查看', '创建', '删除',
    '查找', '搜索', '安装', '启动', '停止',
    'execute', 'run', 'command', 'list', 'show',
    'create', 'delete', 'find', 'search', 'install'
  ]

  const lowerContent = content.toLowerCase()
  return commandKeywords.some(keyword => lowerContent.includes(keyword))
}
