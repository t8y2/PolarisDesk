<template>
  <DynamicScroller ref="scroller" :items="messages" :min-item-size="80" :buffer="200" :page-mode="false" class="flex-1 p-4 pb-0 bg-gradient-to-br from-neutral-950/30 to-black/20 relative z-10 virtual-scroller" :class="{ 'drag-over': isDragOver }" key-field="id">
    <template #default="{ item: msg, index, active }">
      <DynamicScrollerItem :item="msg" :active="active" :size-dependencies="[msg.content, msg.image, msg.video, msg.pdfImages, msg.pptImages]" :data-index="index">
        <div :id="`message-${msg.id}`" class="mb-2 relative z-10 group" :class="msg.role">
          <div class="flex items-start">
            <!-- 用户消息 -->
            <UserMessage v-if="msg.role === 'user'" :message="msg" @preview="handlePreview" @reuse="handleReuse" @download="handleDownload" />

            <!-- AI回复 -->
            <AssistantMessage v-else :message="msg" :is-generating="isGenerating" :extract-think-content="extractThinkContent" :remove-think-content="removeThinkContent" :extract-answer-boxes="extractAnswerBoxes" :remove-answer-boxes="removeAnswerBoxes" />
          </div>
        </div>
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, defineAsyncComponent } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// 从 chatStore 导入正确的类型
import type { ChatMessage } from '../stores/chatStore'

// 懒加载组件
const UserMessage = defineAsyncComponent(() => import('./UserMessage.vue'))
const AssistantMessage = defineAsyncComponent(() => import('./AssistantMessage.vue'))

interface Props {
  messages: ChatMessage[]
  isGenerating: boolean
  isDragOver: boolean
  extractThinkContent: (content: string) => string
  removeThinkContent: (content: string) => string
  extractAnswerBoxes: (content: string) => string
  removeAnswerBoxes: (content: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  preview: [data: { type: 'image' | 'video'; src: string; videoBase64?: string }]
  reuse: [data: { mediaType: 'image' | 'video' | 'pdf' | 'ppt'; mediaData: string | string[]; videoBase64?: string; fileName?: string; totalPages?: number }]
  download: [data: { mediaData: string; mediaType: 'image' | 'video' }]
}>()

const scroller = ref<InstanceType<typeof DynamicScroller>>()

// 事件处理器
const handlePreview = (type: 'image' | 'video', src: string, videoBase64?: string): void => {
  emit('preview', { type, src, videoBase64 })
}

const handleReuse = (mediaType: 'image' | 'video' | 'pdf' | 'ppt' | 'word', mediaData: string | string[], videoBase64?: string, fileName?: string, totalPages?: number): void => {
  emit('reuse', { mediaType, mediaData, videoBase64, fileName, totalPages })
}

const handleDownload = (mediaData: string, mediaType: 'image' | 'video'): void => {
  emit('download', { mediaData, mediaType })
}

// 滚动到底部
const scrollToBottom = (): void => {
  nextTick(() => {
    if (scroller.value) {
      scroller.value.scrollToBottom()
    }
  })
}

// 滚动到指定消息
const scrollToMessage = (messageId: string): void => {
  const index = props.messages.findIndex(m => m.id === messageId)
  if (index !== -1 && scroller.value) {
    scroller.value.scrollToItem(index)
  }
}

// 监听消息变化，自动滚动（防抖优化）
let scrollTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => props.messages.length,
  () => {
    if (scrollTimer) {
      clearTimeout(scrollTimer)
    }
    scrollTimer = setTimeout(() => {
      scrollToBottom()
      scrollTimer = null
    }, 100)
  }
)

// 暴露方法给父组件
defineExpose({
  scrollToBottom,
  scrollToMessage
})
</script>

<style scoped>
.user {
  max-width: var(--user-message-width, 80%);
  margin-left: auto;
  margin-right: 0;
}

.assistant {
  max-width: var(--ai-message-width, 75%);
  margin-left: 0;
  margin-right: auto;
}

.drag-over {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.04)) !important;
  position: relative;
}

/* 虚拟滚动容器样式 */
.virtual-scroller {
  overflow-y: auto;
}

.virtual-scroller::-webkit-scrollbar {
  width: 6px;
}

.virtual-scroller::-webkit-scrollbar-track {
  background: transparent;
}

.virtual-scroller::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
  transition: background 0.5s ease-out;
}

.virtual-scroller.scrolling::-webkit-scrollbar-thumb {
  background: rgba(64, 64, 64, 0.7);
  transition: background 0.2s ease-in;
}

.virtual-scroller.scrolling::-webkit-scrollbar-thumb:hover {
  background: rgba(82, 82, 82, 0.8);
}

:deep(.vue-recycle-scroller__item-wrapper) {
  overflow: visible;
}

:deep(.vue-recycle-scroller__item-view) {
  overflow: visible;
}
</style>
