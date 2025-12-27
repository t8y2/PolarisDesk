<template>
  <div class="flex flex-col w-100%">
    <!-- 思考块 -->
    <ThinkBlock :content="thinkContent" :is-generating="isGenerating" />

    <!-- AI回复内容 -->
    <div v-if="mainContent.trim()" class="flex items-start w-full mb-2">
      <div class="ai-message-container bg-neutral-900/80 backdrop-blur-sm px-3 w-full py-1 rounded-xl shadow-sm border border-neutral-800/60">
        <MarkdownRenderer
          :content="mainContent"
          class="prose prose-sm max-w-none prose-headings:text-white prose-p:text-neutral-200 prose-code:bg-neutral-700/60 prose-code:text-neutral-100 prose-code:px-1 prose-code:rounded prose-code:break-words prose-strong:text-white prose-em:text-neutral-200 prose-p:my-2 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-blockquote:text-neutral-300 prose-blockquote:border-neutral-600 prose-hr:border-neutral-600 prose-th:text-white prose-td:text-neutral-200 prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 ai-response" />
      </div>
    </div>

    <!-- 命令块 - 移到回复内容下面 -->
    <CommandBlock :key="`commands-${message.id}-${commandBlocks.length}`" :commands="commandBlocks" :message-id="message.id" />

    <!-- 答案块 -->
    <AnswerBlock v-if="answerBoxes.length > 0" :answers="answerBoxes" />

    <!-- AI回复时间 - 悬浮时显示 -->
    <div v-if="message.timestamp" class="text-xs text-neutral-500 mt-1 ml-0 w-[70%] opacity-0 group-hover:opacity-100 transition-opacity duration-200" :title="formatDetailedTime(message.timestamp)">
      {{ formatMessageTime(message.timestamp) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import MarkdownRenderer from './MarkdownRenderer.vue'
import ThinkBlock from './ThinkBlock.vue'
import AnswerBlock from './AnswerBlock.vue'
import CommandBlock from './CommandBlock.vue'
import { formatMessageTime, formatDetailedTime } from '../utils/timeFormat'
import { extractCommands, removeCommandBlocks } from '../utils/commandExtractor'

interface Message {
  id: string
  role: 'assistant'
  content?: string
  timestamp?: number
}

interface Props {
  message: Message
  isGenerating?: boolean
  extractThinkContent: (content: string) => string
  removeThinkContent: (content: string) => string
  extractAnswerBoxes: (content: string) => string[]
  removeAnswerBoxes: (content: string) => string
}

const props = withDefaults(defineProps<Props>(), {
  isGenerating: false
})

const thinkContent = computed(() => {
  return props.extractThinkContent(props.message.content || '')
})

const commandBlocks = computed(() => {
  const commands = extractCommands(props.message.content || '')
  
  // 输出调试信息到控制台
  if (props.message.content) {
    console.group('🤖 AI 回复消息')
    console.log('消息 ID:', props.message.id)
    console.log('完整内容:', props.message.content)
    console.log('提取的命令:', commands)
    console.log('是否包含 <command> 标签:', props.message.content.includes('<command>'))
    console.groupEnd()
  }
  
  return commands
})

// 监听内容变化，确保响应式更新
watch(() => props.message.content, (newContent, oldContent) => {
  if (newContent && newContent.includes('<command>')) {
    console.log('🔄 检测到命令标签，触发更新')
    console.log('旧内容长度:', oldContent?.length || 0)
    console.log('新内容长度:', newContent.length)
    console.log('命令数量:', extractCommands(newContent).length)
  }
}, { immediate: true })

const mainContent = computed(() => {
  let content = props.removeThinkContent(props.message.content || '')
  content = removeCommandBlocks(content)
  content = props.removeAnswerBoxes(content)
  return content
})

const answerBoxes = computed(() => {
  return props.extractAnswerBoxes(props.message.content || '')
})
</script>

<style scoped>
/* AI回复文本颜色修复 */
:deep(.ai-response) {
  color: #e5e7eb !important;
}

/* 只对非代码元素应用继承颜色，避免影响代码高亮 */
:deep(.ai-response p),
:deep(.ai-response span:not(.hljs *)),
:deep(.ai-response div:not(.code-block-wrapper):not(.code-header):not(.hljs)) {
  color: inherit !important;
}

:deep(.ai-response h1),
:deep(.ai-response h2),
:deep(.ai-response h3),
:deep(.ai-response h4),
:deep(.ai-response h5),
:deep(.ai-response h6) {
  color: #ffffff !important;
  margin-top: 1em !important;
  margin-bottom: 0.5em !important;
}

:deep(.ai-response p) {
  color: #e5e7eb !important;
  margin: 0.5em 0 !important;
}

:deep(.ai-response code:not(.hljs)) {
  color: #f3f4f6 !important;
  background-color: rgba(75, 85, 99, 0.6) !important;
  padding: 2px 4px !important;
  border-radius: 3px !important;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
  word-wrap: break-word !important;
  word-break: break-all !important;
  white-space: pre-wrap !important;
  display: inline !important;
  max-width: 100% !important;
}

/* KaTeX 数学公式样式 - 确保不被行内代码样式影响 */
:deep(.ai-response .katex) {
  font-family: KaTeX_Main, 'Times New Roman', serif !important;
  font-size: 1.1em !important;
  color: #e5e7eb !important;
  background: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  word-wrap: normal !important;
  word-break: normal !important;
  white-space: nowrap !important;
  display: inline !important;
  max-width: none !important;
}

:deep(.ai-response .katex-display) {
  display: block !important;
  text-align: center !important;
  margin: 1em 0 !important;
  white-space: normal !important;
}

/* 确保 KaTeX 内部元素不被代码样式影响 */
:deep(.ai-response .katex *) {
  font-family: inherit !important;
  color: inherit !important;
  background: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  word-wrap: normal !important;
  word-break: normal !important;
  white-space: normal !important;
}

/* 重置代码块的 prose 样式 */
:deep(.ai-response pre) {
  background: none !important;
  border: none !important;
  border-radius: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.ai-response pre code) {
  color: inherit !important;
  background: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  display: block !important;
}

/* 确保代码块容器样式 */
:deep(.ai-response .code-block-wrapper) {
  margin: 1em 0 !important;
  border: 1px solid #404040 !important;
  border-radius: 6px !important;
  background: #1e1e1e !important;
  overflow: hidden !important;
  max-width: 100% !important;
  width: 100% !important;
}

:deep(.ai-response .code-header) {
  background: #2d2d30 !important;
  border-bottom: 1px solid #404040 !important;
  padding: 8px 16px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

:deep(.ai-response .language-label) {
  color: #cccccc !important;
  font-weight: 500 !important;
  font-size: 12px !important;
}

/* 代码操作按钮样式 */
:deep(.ai-response .code-actions) {
  display: flex !important;
  gap: 8px !important;
}

:deep(.ai-response .copy-button),
:deep(.ai-response .preview-button) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 4px !important;
  padding: 4px 6px !important;
  color: #cccccc !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  font-size: 11px !important;
}

:deep(.ai-response .copy-button:hover),
:deep(.ai-response .preview-button:hover) {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: #ffffff !important;
}

/* 确保代码高亮样式优先级 */
:deep(.ai-response .hljs) {
  background: #1e1e1e !important;
  color: #d4d4d4 !important;
  padding: 1em !important;
  border-radius: 0 0 6px 6px !important;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  display: block !important;
  overflow-x: auto !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  word-break: break-all !important;
}

/* 代码块滚动条样式 */
:deep(.ai-response .hljs::-webkit-scrollbar) {
  height: 2px !important;
}

:deep(.ai-response .hljs::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: 2px !important;
}

:deep(.ai-response .hljs::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.2) !important;
  border-radius: 2px !important;
}

:deep(.ai-response .hljs::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.3) !important;
}

/* 确保语法高亮颜色正确应用 - 提高优先级 */
:deep(.ai-response .hljs .hljs-keyword),
:deep(.ai-response .hljs .hljs-selector-tag),
:deep(.ai-response .hljs .hljs-literal),
:deep(.ai-response .hljs .hljs-section),
:deep(.ai-response .hljs .hljs-link) {
  color: #569cd6 !important;
}

:deep(.ai-response .hljs .hljs-string),
:deep(.ai-response .hljs .hljs-title),
:deep(.ai-response .hljs .hljs-name),
:deep(.ai-response .hljs .hljs-type),
:deep(.ai-response .hljs .hljs-attribute),
:deep(.ai-response .hljs .hljs-symbol),
:deep(.ai-response .hljs .hljs-bullet),
:deep(.ai-response .hljs .hljs-addition),
:deep(.ai-response .hljs .hljs-variable),
:deep(.ai-response .hljs .hljs-template-tag),
:deep(.ai-response .hljs .hljs-template-variable) {
  color: #ce9178 !important;
}

:deep(.ai-response .hljs .hljs-comment),
:deep(.ai-response .hljs .hljs-quote),
:deep(.ai-response .hljs .hljs-deletion),
:deep(.ai-response .hljs .hljs-meta) {
  color: #6a9955 !important;
}

:deep(.ai-response .hljs .hljs-number),
:deep(.ai-response .hljs .hljs-literal) {
  color: #b5cea8 !important;
}

:deep(.ai-response .hljs .hljs-function) {
  color: #dcdcaa !important;
}

:deep(.ai-response .hljs .hljs-built_in) {
  color: #4ec9b0 !important;
}

:deep(.ai-response .hljs .hljs-class .hljs-title) {
  color: #4ec9b0 !important;
}

:deep(.ai-response .hljs .hljs-tag) {
  color: #569cd6 !important;
}

:deep(.ai-response .hljs .hljs-tag .hljs-name) {
  color: #569cd6 !important;
}

:deep(.ai-response .hljs .hljs-tag .hljs-attr) {
  color: #92c5f8 !important;
}

:deep(.ai-response strong),
:deep(.ai-response b) {
  color: #ffffff !important;
}

:deep(.ai-response em),
:deep(.ai-response i) {
  color: #e5e7eb !important;
}

:deep(.ai-response ul),
:deep(.ai-response ol) {
  margin: 0.5em 0 !important;
  padding-left: 1.5em !important;
}

:deep(.ai-response ul li),
:deep(.ai-response ol li) {
  color: #e5e7eb !important;
  margin: 0.25em 0 !important;
}

:deep(.ai-response a) {
  color: #60a5fa !important;
}

:deep(.ai-response blockquote) {
  color: #d1d5db !important;
  border-left: 4px solid #6b7280 !important;
  padding-left: 1em !important;
  margin: 1em 0 !important;
  font-style: italic !important;
}

:deep(.ai-response hr) {
  border: none !important;
  border-top: 1px solid #6b7280 !important;
  margin: 2em 0 !important;
}

:deep(.ai-response table) {
  border-collapse: collapse !important;
  width: 100% !important;
  margin: 1em 0 !important;
}

:deep(.ai-response table th) {
  color: #ffffff !important;
  background-color: rgba(75, 85, 99, 0.3) !important;
  border: 1px solid #6b7280 !important;
  padding: 8px 12px !important;
}

:deep(.ai-response table td) {
  color: #e5e7eb !important;
  border: 1px solid #6b7280 !important;
  padding: 8px 12px !important;
}

/* 浅色主题样式 */
body[data-theme='light'] .ai-message-container {
  background-color: #ffffff !important;
  border-color: transparent !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

body[data-theme='light'] :deep(.ai-response) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.ai-response *) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.ai-response p),
body[data-theme='light'] :deep(.ai-response span:not(.hljs *)),
body[data-theme='light'] :deep(.ai-response div:not(.code-block-wrapper):not(.code-header):not(.hljs)) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.ai-response h1),
body[data-theme='light'] :deep(.ai-response h2),
body[data-theme='light'] :deep(.ai-response h3),
body[data-theme='light'] :deep(.ai-response h4),
body[data-theme='light'] :deep(.ai-response h5),
body[data-theme='light'] :deep(.ai-response h6) {
  color: #1a1a1a !important;
  font-weight: 600 !important;
}

body[data-theme='light'] :deep(.ai-response p) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.ai-response code:not(.hljs)) {
  color: #1a1a1a !important;
  background-color: rgba(229, 231, 235, 0.8) !important;
}

body[data-theme='light'] :deep(.ai-response strong) {
  color: #1a1a1a !important;
  font-weight: 600 !important;
}

body[data-theme='light'] :deep(.ai-response em) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.ai-response a) {
  color: #2563eb !important;
}

body[data-theme='light'] :deep(.ai-response blockquote) {
  color: #4b5563 !important;
  border-left-color: #d1d5db !important;
}

body[data-theme='light'] :deep(.ai-response hr) {
  border-color: #d1d5db !important;
}

body[data-theme='light'] :deep(.ai-response ul),
body[data-theme='light'] :deep(.ai-response ol),
body[data-theme='light'] :deep(.ai-response li) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.ai-response table) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.ai-response table th) {
  color: #1a1a1a !important;
  background-color: rgba(243, 244, 246, 0.8) !important;
  border-color: #d1d5db !important;
  font-weight: 600 !important;
}

body[data-theme='light'] :deep(.ai-response table td) {
  color: #1a1a1a !important;
  border-color: #d1d5db !important;
}

/* 浅色主题 - 代码块 */
body[data-theme='light'] :deep(.ai-response pre) {
  background-color: #1f2937 !important;
}

body[data-theme='light'] :deep(.ai-response .hljs) {
  background-color: #1f2937 !important;
  color: #e5e7eb !important;
}

body[data-theme='light'] :deep(.ai-response .code-block-wrapper) {
  background-color: #1f2937 !important;
}

body[data-theme='light'] :deep(.ai-response .code-header) {
  background-color: #374151 !important;
  color: #e5e7eb !important;
}

/* 浅色主题 - Prose 类覆盖 */
body[data-theme='light'] :deep(.prose) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.prose-headings\:text-white h1),
body[data-theme='light'] :deep(.prose-headings\:text-white h2),
body[data-theme='light'] :deep(.prose-headings\:text-white h3),
body[data-theme='light'] :deep(.prose-headings\:text-white h4),
body[data-theme='light'] :deep(.prose-headings\:text-white h5),
body[data-theme='light'] :deep(.prose-headings\:text-white h6) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.prose-p\:text-neutral-200 p) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.prose-strong\:text-white strong) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.prose-em\:text-neutral-200 em) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.prose-a\:text-blue-400 a) {
  color: #2563eb !important;
}

body[data-theme='light'] :deep(.prose-blockquote\:text-neutral-300 blockquote) {
  color: #4b5563 !important;
}

body[data-theme='light'] :deep(.prose-th\:text-white th) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.prose-td\:text-neutral-200 td) {
  color: #1a1a1a !important;
}

/* 浅色主题 - 最高优先级覆盖所有 prose 类 */
body[data-theme='light'] .ai-response,
body[data-theme='light'] .ai-response *,
body[data-theme='light'] .ai-response p,
body[data-theme='light'] .ai-response span,
body[data-theme='light'] .ai-response div,
body[data-theme='light'] .ai-response h1,
body[data-theme='light'] .ai-response h2,
body[data-theme='light'] .ai-response h3,
body[data-theme='light'] .ai-response h4,
body[data-theme='light'] .ai-response h5,
body[data-theme='light'] .ai-response h6,
body[data-theme='light'] .ai-response li,
body[data-theme='light'] .ai-response td,
body[data-theme='light'] .ai-response th,
body[data-theme='light'] .ai-response strong,
body[data-theme='light'] .ai-response em {
  color: #1a1a1a !important;
}

body[data-theme='light'] .ai-response a {
  color: #2563eb !important;
}

body[data-theme='light'] .ai-response blockquote {
  color: #4b5563 !important;
}

body[data-theme='light'] .ai-response code:not(.hljs) {
  color: #1a1a1a !important;
  background-color: rgba(229, 231, 235, 0.8) !important;
}
</style>
