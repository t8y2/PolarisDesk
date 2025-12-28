<template>
  <div v-if="commands.length > 0" class="command-blocks">
    <div v-for="(cmd, index) in commands" :key="index" class="command-block">
      <div class="command-header">
        <div class="header-left">
          <span class="command-icon">$</span>
          <span class="command-text">{{ cmd.command }}</span>
        </div>
        <div class="command-actions">
          <!-- 未执行且未取消：显示复制、执行和取消按钮 -->
          <template v-if="!cmd.executed && !cmd.executing && !cmd.dismissed">
            <button class="action-btn copy-btn" :title="t('command.copy')" @click="copyCommand(cmd.command)">
              <span v-if="copiedCommand === cmd.command" class="i-carbon-checkmark text-16px"></span>
              <span v-else class="i-carbon-copy text-16px"></span>
            </button>
            <button class="action-btn execute-btn" @click="executeCommand(index)">
              <span class="i-carbon-play text-14px"></span>
              <span class="btn-text">{{ t('command.run') }}</span>
            </button>
            <button class="action-btn dismiss-btn" @click="dismissCommand(index)">
              <span class="i-carbon-close text-16px"></span>
            </button>
          </template>
          <!-- 执行中状态：显示中止按钮 -->
          <button v-if="cmd.executing" class="action-btn cancel-btn" @click="cancelExecution(index)">
            <span class="i-carbon-renew animate-spin text-14px"></span>
            <span class="btn-text">{{ t('command.running') }}</span>
          </button>
          <!-- 已取消状态：显示取消标签 -->
          <span v-if="cmd.dismissed" class="status-badge dismissed">{{ t('command.dismissed') }}</span>
          <!-- 已完成状态：显示状态标签 -->
          <span v-if="cmd.executed && !cmd.dismissed" :class="['status-badge', cmd.exitCode === 0 ? 'success' : 'error']">
            {{ cmd.exitCode === 0 ? `✓ ${t('command.successBadge')}` : `✗ ${t('command.failedBadge')}` }}
          </span>
        </div>
      </div>

      <!-- 执行结果 -->
      <div v-if="cmd.output || cmd.error" class="command-output">
        <div v-if="cmd.output" class="output-section">
          <pre class="output-text">{{ cmd.output }}</pre>
        </div>
        <div v-if="cmd.error" class="error-section">
          <pre class="error-text">{{ cmd.error }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDialog, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { updateCommandState, type CommandState } from '../utils/commandExtractor'

const { t } = useI18n()
const message = useMessage()

// 复制状态
const copiedCommand = ref<string | null>(null)

interface Command extends CommandState {
  executing: boolean
}

interface Props {
  commands: CommandState[]
  messageId: string
}

const props = defineProps<Props>()
const dialog = useDialog()
const chatStore = useChatStore()
const settingsStore = useSettingsStore()

// 强制刷新触发器
const refreshTrigger = ref(0)

// 执行状态映射表 - 存储临时的执行中状态和输出结果
const executionStates = ref<
  Map<
    string,
    {
      executing: boolean
      executed?: boolean
      dismissed?: boolean
      exitCode?: number
      output?: string
      error?: string
      abortController?: AbortController
    }
  >
>(new Map())

// 转换为命令对象 - 响应式计算
const commands = computed<Command[]>(() => {
  // 使用 refreshTrigger 来强制重新计算（通过访问它的值）
  void refreshTrigger.value

  return props.commands.map(cmd => {
    const execState = executionStates.value.get(cmd.command) || {
      executing: false,
      executed: undefined,
      dismissed: undefined,
      exitCode: undefined,
      output: undefined,
      error: undefined
    }

    // 优先使用 executionStates 中的状态，然后是 props.commands 中的持久化状态
    return {
      ...cmd,
      executing: execState.executing ?? false,
      executed: execState.executed ?? cmd.executed,
      dismissed: execState.dismissed ?? cmd.dismissed,
      exitCode: execState.exitCode ?? cmd.exitCode,
      // 如果有临时输出，使用临时输出；否则使用持久化的输出
      output: execState.output || cmd.output,
      error: execState.error || cmd.error
    }
  })
})

// 监听 props.commands 变化，输出调试信息
// watch(
//   () => props.commands,
//   newCommands => {
//     console.log(
//       '🔄 CommandBlock: 命令列表更新',
//       newCommands.map(cmd => ({
//         command: cmd.command,
//         executed: cmd.executed,
//         dismissed: cmd.dismissed
//       }))
//     )
//   },
//   { immediate: true, deep: true }
// )

// 更新消息中的命令状态
const updateMessageCommandState = (commandText: string, state: Partial<Omit<CommandState, 'command'>>): void => {
  const messageIndex = chatStore.messages.findIndex(msg => msg.id === props.messageId)
  if (messageIndex !== -1) {
    const currentMessage = chatStore.messages[messageIndex]
    const updatedContent = updateCommandState(currentMessage.content || '', commandText, state)

    // 创建新的消息对象以触发响应式更新
    const newMessage = {
      ...currentMessage,
      content: updatedContent
    }

    // 使用 splice 替换消息以确保响应式更新
    chatStore.messages.splice(messageIndex, 1, newMessage)

    // 保存到存储
    chatStore.saveToStorage()

    // 强制刷新 commands 计算属性
    refreshTrigger.value++

    // 输出调试信息
    console.log('✅ 命令状态已更新:', {
      command: commandText,
      state,
      messageId: props.messageId,
      updatedContent: updatedContent.substring(0, 200) + '...',
      refreshTrigger: refreshTrigger.value
    })
  } else {
    console.error('❌ 未找到消息:', props.messageId)
  }
}

const executeCommand = (index: number): void => {
  const cmd = commands.value[index]

  // 危险命令检测
  const dangerousPatterns = [/rm\s+-rf\s+\//, /format\s+/i, /del\s+\/[sf]/i, /shutdown/i, /reboot/i]

  const isDangerous = dangerousPatterns.some(pattern => pattern.test(cmd.command))

  // 如果是危险命令，始终需要确认
  // 如果不是危险命令且没有开启静默执行，直接执行
  if (!isDangerous && !settingsStore.settings.autoExecuteCommands) {
    doExecute(index)
    return
  }

  // 危险命令或开启了静默执行时，显示确认对话框
  dialog.warning({
    title: t('command.confirmExecution'),
    content: `${t('command.confirmMessage')}\n\n${cmd.command}\n\n${isDangerous ? t('command.dangerWarning') : ''}`,
    positiveText: t('command.execute'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      await doExecute(index)
    }
  })
}

// 复制命令到剪贴板
const copyCommand = async (command: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(command)
    copiedCommand.value = command
    message.success(t('command.copied'))

    // 2秒后重置复制状态
    setTimeout(() => {
      if (copiedCommand.value === command) {
        copiedCommand.value = null
      }
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败')
  }
}

const doExecute = async (index: number): Promise<void> => {
  const cmd = commands.value[index]
  const cmdText = cmd.command

  console.log('🚀 开始执行命令:', cmdText, '索引:', index)

  // 创建 AbortController 用于取消
  const abortController = new AbortController()

  // 更新执行状态
  executionStates.value.set(cmdText, {
    executing: true,
    abortController
  })

  console.log('⏳ 执行状态已设置为 executing')

  try {
    // 类型断言：window.api 包含 command 属性
    const api = window.api as typeof window.api & {
      command: {
        execute: (command: string) => Promise<{
          success: boolean
          output: string
          error?: string
          exitCode?: number
        }>
      }
    }

    if (!api?.command) {
      throw new Error('命令执行功能不可用')
    }

    // 检查是否已被取消
    if (abortController.signal.aborted) {
      throw new Error('命令执行已取消')
    }

    const result = await api.command.execute(cmdText)

    console.log('✅ 命令执行完成:', result)

    // 再次检查是否已被取消
    if (abortController.signal.aborted) {
      throw new Error('命令执行已取消')
    }

    // 清除执行状态，但保留输出结果
    executionStates.value.set(cmdText, {
      executing: false,
      executed: true,
      exitCode: result.exitCode || 0,
      output: result.output || '',
      error: result.error || ''
    })

    // 强制刷新界面
    refreshTrigger.value++

    console.log('📝 准备更新消息状态...')

    // 更新消息中的命令状态（持久化）
    updateMessageCommandState(cmdText, {
      executed: true,
      exitCode: result.exitCode || 0,
      output: result.output || '',
      error: result.error || ''
    })

    console.log('✨ 状态更新完成')
  } catch (error) {
    const errorMsg = (error as Error).message

    console.error('❌ 命令执行失败:', errorMsg)

    // 清除执行状态，但保留错误信息
    executionStates.value.set(cmdText, {
      executing: false,
      executed: true,
      exitCode: 1,
      error: errorMsg
    })

    // 强制刷新界面
    refreshTrigger.value++

    // 更新消息中的命令状态（持久化）
    updateMessageCommandState(cmdText, {
      executed: true,
      exitCode: 1,
      error: errorMsg
    })
  }
}

const cancelExecution = (index: number): void => {
  const cmd = commands.value[index]
  const cmdText = cmd.command
  const state = executionStates.value.get(cmdText)

  if (state?.abortController) {
    state.abortController.abort()

    // 保留错误信息
    executionStates.value.set(cmdText, {
      executing: false,
      executed: true,
      exitCode: 130,
      error: '用户中止执行'
    })

    // 强制刷新界面
    refreshTrigger.value++

    // 更新消息中的命令状态（持久化）
    updateMessageCommandState(cmdText, {
      executed: true,
      exitCode: 130, // 130 是 SIGINT 的退出码
      error: '用户中止执行'
    })
  }
}

const dismissCommand = (index: number): void => {
  const cmd = commands.value[index]
  const cmdText = cmd.command

  // 更新本地状态
  executionStates.value.set(cmdText, {
    executing: false,
    dismissed: true
  })

  // 强制刷新界面
  refreshTrigger.value++

  // 更新消息中的命令状态（持久化）
  updateMessageCommandState(cmdText, {
    dismissed: true
  })
}

// 自动执行命令
const autoExecuteCommands = (): void => {
  if (!settingsStore.settings.autoExecuteCommands) {
    return
  }

  // 找到所有未执行且未取消的命令
  const commandsToExecute: number[] = []

  commands.value.forEach((cmd, index) => {
    // 检查命令是否已经执行过、正在执行或已取消
    if (cmd.executed || cmd.executing || cmd.dismissed) {
      console.log('⏭️ 跳过已处理的命令:', cmd.command, { executed: cmd.executed, executing: cmd.executing, dismissed: cmd.dismissed })
      return
    }

    // 检查是否为危险命令
    const dangerousPatterns = [/rm\s+-rf\s+\//, /format\s+/i, /del\s+\/[sf]/i, /shutdown/i, /reboot/i]

    const isDangerous = dangerousPatterns.some(pattern => pattern.test(cmd.command))

    // 危险命令不自动执行，需要用户手动确认
    if (isDangerous) {
      console.warn('⚠️ 检测到危险命令，跳过自动执行:', cmd.command)
      return
    }

    commandsToExecute.push(index)
  })

  // 延迟执行，避免同时执行多个命令
  commandsToExecute.forEach((index, i) => {
    setTimeout(() => {
      console.log('🚀 自动执行命令:', commands.value[index].command)
      doExecute(index)
    }, i * 100) // 每个命令间隔100ms
  })
}

// 监听命令列表变化，自动执行新命令
watch(
  () => props.commands,
  (newCommands, oldCommands) => {
    // 只在有新命令添加时触发自动执行
    if (newCommands.length > (oldCommands?.length || 0)) {
      autoExecuteCommands()
    }
  },
  { deep: true }
)

// 组件挂载时检查是否需要自动执行
onMounted(() => {
  autoExecuteCommands()
})
</script>

<style scoped>
.command-blocks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
  width: 100%;
}

.command-block {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', monospace;
  transition: all 0.2s ease;
}

.command-block:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.command-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 36px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.command-icon {
  color: #10b981;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.command-text {
  color: #e5e7eb;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', monospace;
}

.command-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.copy-btn {
  background: rgba(107, 114, 128, 0.15);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.3);
  padding: 4px 8px;
}

.copy-btn:hover {
  background: rgba(107, 114, 128, 0.25);
  color: #d1d5db;
}

.execute-btn {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.execute-btn:hover {
  background: rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.5);
}

.dismiss-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
}

.dismiss-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e5e7eb;
}

.cancel-btn {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.cancel-btn:hover {
  background: rgba(251, 191, 36, 0.25);
}

.btn-text {
  font-size: 12px;
  line-height: 1;
}

.spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.status-badge.success {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-badge.dismissed {
  background: rgba(107, 114, 128, 0.15);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.command-output {
  max-height: 400px;
  overflow-y: auto;
}

.output-section,
.error-section {
  padding: 12px;
}

.output-section {
  background: rgba(0, 0, 0, 0.2);
}

.error-section {
  background: rgba(239, 68, 68, 0.05);
  border-top: 1px solid rgba(239, 68, 68, 0.2);
}

.output-text,
.error-text {
  margin: 0;
  padding: 0;
  font-size: 12px;
  line-height: 1.6;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', monospace;
  white-space: pre-wrap;
  word-break: break-word;
  color: #d1d5db;
}

.error-text {
  color: #fca5a5;
}

/* 滚动条样式 */
.command-output::-webkit-scrollbar {
  width: 8px;
}

.command-output::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.command-output::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.command-output::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 浅色主题 */
body[data-theme='light'] .command-block {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.1);
}

body[data-theme='light'] .command-block:hover {
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.04);
}

body[data-theme='light'] .command-header {
  background: rgba(0, 0, 0, 0.04);
  border-bottom-color: rgba(0, 0, 0, 0.08);
}

body[data-theme='light'] .command-icon {
  color: #059669;
}

body[data-theme='light'] .command-text {
  color: #1f2937;
}

body[data-theme='light'] .copy-btn {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border-color: rgba(107, 114, 128, 0.3);
}

body[data-theme='light'] .copy-btn:hover {
  background: rgba(107, 114, 128, 0.2);
  color: #374151;
}

body[data-theme='light'] .execute-btn {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border-color: rgba(59, 130, 246, 0.3);
}

body[data-theme='light'] .execute-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

body[data-theme='light'] .dismiss-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  border-color: rgba(0, 0, 0, 0.1);
}

body[data-theme='light'] .dismiss-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
}

body[data-theme='light'] .cancel-btn {
  background: rgba(251, 191, 36, 0.1);
  color: #d97706;
}

body[data-theme='light'] .status-badge.success {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

body[data-theme='light'] .status-badge.error {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

body[data-theme='light'] .status-badge.dismissed {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

body[data-theme='light'] .output-section {
  background: rgba(0, 0, 0, 0.03);
}

body[data-theme='light'] .error-section {
  background: rgba(239, 68, 68, 0.05);
}

body[data-theme='light'] .output-text {
  color: #374151;
}

body[data-theme='light'] .error-text {
  color: #dc2626;
}

body[data-theme='light'] .command-output::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

body[data-theme='light'] .command-output::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
}

body[data-theme='light'] .command-output::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
