<template>
  <n-modal v-model:show="visible" preset="card" :title="t('command.title')" class="command-modal" style="width: 800px">
    <div class="command-content">
      <p class="description">{{ t('command.description') }}</p>

      <div class="command-input-section">
        <n-input v-model:value="userInput" type="textarea" :placeholder="t('command.inputPlaceholder')" :autosize="{ minRows: 3, maxRows: 6 }" @keydown="handleKeyDown" />
        <n-button type="primary" :loading="isGenerating || isExecuting" :disabled="!userInput.trim()" class="mt-3" @click="handleGenerate">
          {{ isGenerating ? t('command.generating') : isExecuting ? t('command.executing') : t('common.confirm') }}
        </n-button>
      </div>

      <div v-if="generatedCommand" class="command-result mt-4">
        <div class="result-header">
          <span class="label">{{ t('command.commandGenerated') }}</span>
          <n-button-group size="small">
            <n-button :loading="isExecuting" :disabled="isExecuting" @click="handleExecute">
              {{ t('command.execute') }}
            </n-button>
            <n-button @click="handleRetry">{{ t('command.retry') }}</n-button>
          </n-button-group>
        </div>
        <n-code :code="generatedCommand" language="bash" class="mt-2" />

        <!-- 调试区域：显示原始 AI 输出 -->
        <n-collapse class="mt-3">
          <n-collapse-item title="🔍 调试：查看 AI 原始输出" name="debug">
            <n-code :code="rawAIOutput" language="text" />
          </n-collapse-item>
        </n-collapse>
      </div>

      <div v-if="commandOutput" class="command-output mt-4">
        <div class="output-header">
          <span class="label">{{ t('command.output') }}</span>
          <n-tag :type="exitCode === 0 ? 'success' : 'error'" size="small">{{ t('command.exitCode') }}: {{ exitCode }}</n-tag>
        </div>
        <n-code :code="commandOutput" language="text" class="mt-2" />
      </div>

      <div v-if="commandError" class="command-error mt-4">
        <div class="error-header">
          <span class="label">{{ t('command.error') }}</span>
        </div>
        <n-code :code="commandError" language="text" class="mt-2" />
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, useDialog, NModal, NInput, NButton, NButtonGroup, NCode, NTag, NCollapse, NCollapseItem } from 'naive-ui'
import { modelAPI } from '../utils/modelAPI'
import { useSettingsStore } from '../stores/settingsStore'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()
const settingsStore = useSettingsStore()

const visible = defineModel<boolean>('visible', { default: false })

const userInput = ref('')
const generatedCommand = ref('')
const commandOutput = ref('')
const commandError = ref('')
const isGenerating = ref(false)
const isExecuting = ref(false)
const exitCode = ref<number | null>(null)
const rawAIOutput = ref('') // 添加原始输出

const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    handleGenerate()
  }
}

const handleGenerate = async (): Promise<void> => {
  if (!userInput.value.trim()) return

  isGenerating.value = true
  generatedCommand.value = ''
  commandOutput.value = ''
  commandError.value = ''
  exitCode.value = null
  rawAIOutput.value = '' // 清空原始输出

  try {
    // 检测操作系统
    const platform = navigator.platform.toLowerCase()
    let osName = 'Linux'
    if (platform.includes('mac')) {
      osName = 'macOS'
    } else if (platform.includes('win')) {
      osName = 'Windows'
    }

    const systemPrompt = `你是一个系统命令生成器。根据用户的描述，生成可以直接在终端执行的命令。

重要规则：
1. 只输出命令本身，不要有任何解释、说明或额外文字
2. 不要使用任何标记符号（如 \`\`\`、<|>、【】等）
3. 不要包含"命令是"、"应该使用"等描述性语言
4. 确保命令在 ${osName} 系统上可以执行
5. 如果需要多个命令，用 && 连接
6. 优先使用安全的命令

示例：
用户：列出当前目录的文件
你：ls -la

用户：查看系统内存
你：free -h

用户：创建一个test文件夹
你：mkdir test

现在，用户的描述是：${userInput.value}

请直接输出命令，不要有任何其他内容：`

    let fullResponse = ''
    let reasoningContent = '' // 分离思考内容
    let actualContent = '' // 实际输出内容

    await modelAPI.chatCompletion(
      systemPrompt,
      {
        provider: settingsStore.settings.provider,
        apiUrl: settingsStore.settings.apiUrl,
        apiKey: settingsStore.settings.apiKey,
        model: settingsStore.settings.model,
        maxTokens: 512,
        temperature: 0.1,
        topP: 0.8,
        systemPrompt: ''
      },
      (chunk: string, type?: 'reasoning' | 'content') => {
        fullResponse += chunk
        if (type === 'reasoning') {
          reasoningContent += chunk
        } else {
          actualContent += chunk
        }
      }
    )

    // 保存原始输出用于调试（包含思考和输出）
    rawAIOutput.value = fullResponse
    if (reasoningContent) {
      rawAIOutput.value = `【思考过程】\n${reasoningContent}\n\n【实际输出】\n${actualContent}`
    }

    // 优先使用实际输出内容，如果没有则使用完整响应
    const contentToProcess = actualContent || fullResponse

    // 清理生成的命令 - 更激进的提取策略
    let cleaned = contentToProcess.trim()

    // 1. 移除代码块标记
    cleaned = cleaned.replace(/^```(?:bash|sh|shell|zsh)?\n?/i, '').replace(/\n?```$/i, '')

    // 2. 移除特殊标记
    cleaned = cleaned
      .replace(/<\|begin_of_box\|>/g, '')
      .replace(/<\|end_of_box\|>/g, '')
      .replace(/【.*?】/g, '')

    // 3. 尝试提取最后一个看起来像命令的部分
    const lines = cleaned
      .split('\n')
      .map(l => l.trim())
      .filter(l => l)

    // 查找最短且最像命令的行（通常命令很短）
    let commandLine = ''

    // 策略1: 查找最后一个不包含中文、句号、逗号的短行
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]
      // 跳过明显的解释性文字
      if (/[\u4e00-\u9fa5]/.test(line)) continue // 包含中文
      if (/[。，、；：""''（）]/.test(line)) continue // 包含中文标点
      if (line.length > 100) continue // 太长
      if (line.startsWith('//') || (line.startsWith('#') && !line.startsWith('#!'))) continue // 注释
      if (/^(the command|explanation|note|output):/i.test(line)) continue // 英文说明

      // 找到了可能的命令
      commandLine = line
      break
    }

    // 策略2: 如果没找到，尝试查找包含常见命令关键词的行
    if (!commandLine) {
      const commonCommands = ['ls', 'pwd', 'cd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'echo', 'grep', 'find', 'ps', 'top', 'df', 'du', 'chmod', 'chown', 'tar', 'zip', 'curl', 'wget', 'git', 'npm', 'node', 'python', 'java']
      for (const line of lines) {
        const firstWord = line.split(/\s+/)[0]
        if (commonCommands.includes(firstWord) || firstWord.startsWith('./') || firstWord.startsWith('/')) {
          commandLine = line
          break
        }
      }
    }

    // 策略3: 如果还是没找到，取最短的非中文行
    if (!commandLine) {
      const nonChineseLines = lines.filter(l => !/[\u4e00-\u9fa5]/.test(l))
      if (nonChineseLines.length > 0) {
        commandLine = nonChineseLines.reduce((shortest, current) => (current.length < shortest.length ? current : shortest))
      }
    }

    // 最后的清理
    generatedCommand.value = commandLine
      .replace(/^(命令|输出|结果)[:：]\s*/g, '')
      .replace(/^(command|output|result):\s*/i, '')
      .trim()

    if (!generatedCommand.value) {
      throw new Error('未能生成有效命令')
    }
  } catch (error) {
    message.error('生成命令失败: ' + (error as Error).message)
  } finally {
    isGenerating.value = false
  }
}

const handleExecute = (): void => {
  if (!generatedCommand.value) return

  const dangerousPatterns = [/rm\s+-rf\s+\//, /format\s+/i, /del\s+\/[sf]/i, /shutdown/i, /reboot/i]

  const isDangerous = dangerousPatterns.some(pattern => pattern.test(generatedCommand.value))

  dialog.warning({
    title: t('command.confirmExecution'),
    content: `${t('command.confirmMessage')}\n\n${generatedCommand.value}\n\n${isDangerous ? t('command.dangerWarning') : ''}`,
    positiveText: t('command.execute'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      await executeCommand()
    }
  })
}

const executeCommand = async (): Promise<void> => {
  isExecuting.value = true
  commandOutput.value = ''
  commandError.value = ''
  exitCode.value = null

  try {
    if (!window.api?.command) {
      throw new Error('命令执行功能不可用')
    }

    const result = await (
      window.api as typeof window.api & {
        command: {
          execute: (cmd: string) => Promise<{
            success: boolean
            output: string
            error?: string
            exitCode?: number
          }>
        }
      }
    ).command.execute(generatedCommand.value)

    exitCode.value = result.exitCode || 0
    commandOutput.value = result.output || ''
    commandError.value = result.error || ''

    if (result.success) {
      message.success(t('command.success'))
    } else {
      message.error(t('command.failed'))
    }
  } catch (error) {
    message.error('执行命令失败: ' + (error as Error).message)
    commandError.value = (error as Error).message
  } finally {
    isExecuting.value = false
  }
}

const handleRetry = (): void => {
  handleGenerate()
}
</script>

<style scoped>
.command-content {
  padding: 8px 0;
}

.description {
  color: var(--text-color-3);
  font-size: 14px;
  margin-bottom: 16px;
}

.command-input-section {
  margin-bottom: 16px;
}

.command-result,
.command-output,
.command-error {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  background: var(--card-color);
}

.result-header,
.output-header,
.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  font-weight: 600;
  font-size: 14px;
}
</style>
