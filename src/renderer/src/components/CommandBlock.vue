<template>
  <div v-if="commands.length > 0" class="command-blocks mb-3">
    <div v-for="(cmd, index) in commands" :key="index" class="command-block mb-2">
      <div class="command-header">
        <div class="header-left">
          <span class="command-icon">⚡</span>
          <span class="command-label">检测到命令</span>
        </div>
        <div class="command-actions">
          <!-- 未执行且未取消：显示执行和取消按钮 -->
          <template v-if="!cmd.executed && !cmd.executing && !cmd.dismissed">
            <n-button
              size="tiny"
              type="primary"
              @click="executeCommand(index)"
            >
              执行
            </n-button>
            <n-button
              size="tiny"
              @click="dismissCommand(index)"
            >
              取消
            </n-button>
          </template>
          <!-- 执行中状态：显示中止按钮 -->
          <n-button
            v-if="cmd.executing"
            size="tiny"
            type="warning"
            @click="cancelExecution(index)"
          >
            中止
          </n-button>
          <!-- 已取消状态：显示取消标签 -->
          <n-tag v-if="cmd.dismissed" type="default" size="small">
            已取消
          </n-tag>
          <!-- 已完成状态：显示状态标签 -->
          <n-tag v-if="cmd.executed && !cmd.dismissed" :type="cmd.exitCode === 0 ? 'success' : 'error'" size="small">
            {{ cmd.exitCode === 0 ? '✓ 成功' : '✗ 失败' }}
          </n-tag>
        </div>
      </div>
      <div class="command-content">
        <n-code :code="cmd.command" language="bash" class="command-code" />
      </div>
      
      <!-- 执行结果 -->
      <div v-if="cmd.output || cmd.error" class="command-result">
        <div v-if="cmd.output" class="result-output">
          <div class="result-label">输出：</div>
          <n-code :code="cmd.output" language="text" />
        </div>
        <div v-if="cmd.error" class="result-error">
          <div class="result-label">错误：</div>
          <n-code :code="cmd.error" language="text" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NButton, NCode, NTag, useMessage, useDialog } from 'naive-ui'
import { useChatStore } from '../stores/chatStore'
import { updateCommandState, type CommandState } from '../utils/commandExtractor'

interface Command extends CommandState {
  executing: boolean
}

interface Props {
  commands: CommandState[]
  messageId: string
}

const props = defineProps<Props>()
const message = useMessage()
const dialog = useDialog()
const chatStore = useChatStore()

// 执行状态映射表 - 存储临时的执行中状态和输出结果
const executionStates = ref<Map<string, {
  executing: boolean
  output?: string
  error?: string
  abortController?: AbortController
}>>(new Map())

// 转换为命令对象 - 响应式计算
const commands = computed<Command[]>(() => {
  return props.commands.map(cmd => {
    const execState = executionStates.value.get(cmd.command) || {
      executing: false
    }
    return {
      ...cmd,
      executing: execState.executing,
      // 如果有临时输出，使用临时输出；否则使用持久化的输出
      output: execState.output || cmd.output,
      error: execState.error || cmd.error
    }
  })
})

// 监听 props.commands 变化，输出调试信息
watch(() => props.commands, (newCommands) => {
  console.log('🔄 CommandBlock: 命令列表更新', newCommands)
}, { immediate: true, deep: true })

// 更新消息中的命令状态
const updateMessageCommandState = (commandText: string, state: Partial<Omit<CommandState, 'command'>>) => {
  const messageIndex = chatStore.messages.findIndex(msg => msg.id === props.messageId)
  if (messageIndex !== -1) {
    const currentMessage = chatStore.messages[messageIndex]
    const updatedContent = updateCommandState(currentMessage.content || '', commandText, state)
    chatStore.messages[messageIndex] = {
      ...currentMessage,
      content: updatedContent
    }
    chatStore.saveToStorage()
  }
}

const executeCommand = (index: number) => {
  const cmd = commands.value[index]
  
  // 危险命令检测
  const dangerousPatterns = [
    /rm\s+-rf\s+\//,
    /format\s+/i,
    /del\s+\/[sf]/i,
    /shutdown/i,
    /reboot/i
  ]
  
  const isDangerous = dangerousPatterns.some(pattern => pattern.test(cmd.command))
  
  dialog.warning({
    title: '确认执行',
    content: `即将执行以下命令：\n\n${cmd.command}\n\n${isDangerous ? '⚠️ 警告：此命令可能会修改系统文件或设置，请谨慎确认' : ''}`,
    positiveText: '执行',
    negativeText: '取消',
    onPositiveClick: async () => {
      await doExecute(index)
    }
  })
}

const doExecute = async (index: number) => {
  const cmd = commands.value[index]
  const cmdText = cmd.command
  
  // 创建 AbortController 用于取消
  const abortController = new AbortController()
  
  // 更新执行状态
  executionStates.value.set(cmdText, {
    executing: true,
    abortController
  })
  
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
    
    // 再次检查是否已被取消
    if (abortController.signal.aborted) {
      throw new Error('命令执行已取消')
    }
    
    // 清除执行状态，但保留输出结果
    executionStates.value.set(cmdText, {
      executing: false,
      output: result.output || '',
      error: result.error || ''
    })
    
    // 更新消息中的命令状态（持久化）
    updateMessageCommandState(cmdText, {
      executed: true,
      exitCode: result.exitCode || 0,
      output: result.output || '',
      error: result.error || ''
    })
    
    if (result.success) {
      message.success('命令执行成功')
    } else {
      message.error('命令执行失败')
    }
  } catch (error) {
    const errorMsg = (error as Error).message
    
    // 清除执行状态，但保留错误信息
    executionStates.value.set(cmdText, {
      executing: false,
      error: errorMsg
    })
    
    // 如果是取消操作，不显示错误
    if (errorMsg !== '命令执行已取消') {
      message.error('执行命令失败: ' + errorMsg)
    }
    
    // 更新消息中的命令状态（持久化）
    updateMessageCommandState(cmdText, {
      executed: true,
      exitCode: 1,
      error: errorMsg
    })
  }
}

const cancelExecution = (index: number) => {
  const cmd = commands.value[index]
  const cmdText = cmd.command
  const state = executionStates.value.get(cmdText)
  
  if (state?.abortController) {
    state.abortController.abort()
    message.info('已中止命令执行')
    
    // 保留错误信息
    executionStates.value.set(cmdText, {
      executing: false,
      error: '用户中止执行'
    })
    
    // 更新消息中的命令状态（持久化）
    updateMessageCommandState(cmdText, {
      executed: true,
      exitCode: 130, // 130 是 SIGINT 的退出码
      error: '用户中止执行'
    })
  }
}

const dismissCommand = (index: number) => {
  const cmd = commands.value[index]
  const cmdText = cmd.command
  
  // 更新消息中的命令状态（持久化）
  updateMessageCommandState(cmdText, {
    dismissed: true
  })
  
  message.info('已取消命令')
}
</script>

<style scoped>
.command-blocks {
  width: 70%;
  margin-left: 0;
}

.command-block {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  padding: 12px;
  backdrop-filter: blur(10px);
}

.command-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #60a5fa;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.command-icon {
  font-size: 16px;
}

.command-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-x: auto;
}

.command-code {
  font-size: 13px;
  min-width: 0;
}

/* 命令代码块的滚动条样式 */
.command-content :deep(.n-code) {
  overflow-x: auto;
  max-width: 100%;
}

.command-content :deep(.n-code pre) {
  white-space: pre;
  word-wrap: normal;
  overflow-x: auto;
}

/* 自定义滚动条样式 */
.command-content::-webkit-scrollbar,
.command-content :deep(.n-code)::-webkit-scrollbar,
.command-content :deep(.n-code pre)::-webkit-scrollbar {
  height: 6px;
}

.command-content::-webkit-scrollbar-track,
.command-content :deep(.n-code)::-webkit-scrollbar-track,
.command-content :deep(.n-code pre)::-webkit-scrollbar-track {
  background: rgba(59, 130, 246, 0.1);
  border-radius: 3px;
}

.command-content::-webkit-scrollbar-thumb,
.command-content :deep(.n-code)::-webkit-scrollbar-thumb,
.command-content :deep(.n-code pre)::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.4);
  border-radius: 3px;
}

.command-content::-webkit-scrollbar-thumb:hover,
.command-content :deep(.n-code)::-webkit-scrollbar-thumb:hover,
.command-content :deep(.n-code pre)::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.6);
}

.command-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.command-result {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(59, 130, 246, 0.2);
  overflow-x: auto;
}

.result-output,
.result-error {
  margin-bottom: 8px;
  overflow-x: auto;
}

/* 结果输出的滚动条样式 */
.result-output :deep(.n-code),
.result-error :deep(.n-code) {
  overflow-x: auto;
  max-width: 100%;
}

.result-output :deep(.n-code pre),
.result-error :deep(.n-code pre) {
  white-space: pre;
  word-wrap: normal;
  overflow-x: auto;
}

.result-output::-webkit-scrollbar,
.result-error::-webkit-scrollbar,
.result-output :deep(.n-code)::-webkit-scrollbar,
.result-error :deep(.n-code)::-webkit-scrollbar {
  height: 6px;
}

.result-output::-webkit-scrollbar-track,
.result-error::-webkit-scrollbar-track,
.result-output :deep(.n-code)::-webkit-scrollbar-track,
.result-error :deep(.n-code)::-webkit-scrollbar-track {
  background: rgba(59, 130, 246, 0.1);
  border-radius: 3px;
}

.result-output::-webkit-scrollbar-thumb,
.result-error::-webkit-scrollbar-thumb,
.result-output :deep(.n-code)::-webkit-scrollbar-thumb,
.result-error :deep(.n-code)::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.4);
  border-radius: 3px;
}

.result-output::-webkit-scrollbar-thumb:hover,
.result-error::-webkit-scrollbar-thumb:hover,
.result-output :deep(.n-code)::-webkit-scrollbar-thumb:hover,
.result-error :deep(.n-code)::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.6);
}

.result-label {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 4px;
}

.result-error .result-label {
  color: #f87171;
}

/* 浅色主题 */
body[data-theme='light'] .command-block {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 51, 234, 0.08));
  border-color: rgba(59, 130, 246, 0.4);
}

body[data-theme='light'] .command-header {
  color: #2563eb;
}

body[data-theme='light'] .result-label {
  color: #6b7280;
}

body[data-theme='light'] .result-error .result-label {
  color: #dc2626;
}
</style>
