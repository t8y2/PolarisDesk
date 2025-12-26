<template>
  <div class="chat-view flex flex-col h-full w-full overflow-hidden relative" :class="{ 'bg-black': settingsStore.settings.theme === 'dark' }" @dragover="handleDragOver" @dragenter="handleDragEnter" @dragleave="handleDragLeave" @drop="handleDrop">
    <!-- 全局星空背景层 -->
    <StarryBackground :enabled="settingsStore.settings.starryBackground" />

    <!-- 全局拖拽提示层 -->
    <DragOverlay :is-drag-over="isDragOver" />

    <!-- 聊天消息区域 - 使用虚拟滚动优化 -->
    <DynamicScroller v-if="chatStore.messages.length > 20" ref="messagesContainer" :items="chatStore.messages" :min-item-size="80" class="messages-container flex-1 p-4 pb-0 relative z-10 virtual-scroller" :class="{ 'drag-over': isDragOver, 'bg-gradient-to-br from-neutral-950/30 to-black/20': settingsStore.settings.theme === 'dark' }" key-field="id">
      <template #default="{ item: msg, index, active }">
        <DynamicScrollerItem :item="msg" :active="active" :size-dependencies="[msg.content, msg.image, msg.video, msg.pdfImages, msg.pptImages]" :data-index="index">
          <div :id="`message-${msg.id}`" class="mb-2 relative z-10 group" :class="msg.role">
            <div class="flex items-start">
              <!-- 用户消息 -->
              <UserMessage v-if="msg.role === 'user'" :message="msg" @preview="openPreview" @reuse="reuseMedia" @download="downloadMedia" />

              <!-- AI回复 -->
              <AssistantMessage v-else :message="msg" :is-generating="chatStore.isGenerating" :extract-think-content="extractThinkContent" :remove-think-content="removeThinkContent" :extract-answer-boxes="extractAnswerBoxes" :remove-answer-boxes="removeAnswerBoxes" />
            </div>
          </div>
        </DynamicScrollerItem>
      </template>

      <!-- 加载状态 -->
      <template #after>
        <LoadingIndicator :is-loading="chatStore.isLoading" />
      </template>
    </DynamicScroller>

    <!-- 消息少于20条时使用普通滚动 -->
    <div v-else ref="messagesContainer" class="messages-container flex-1 overflow-y-auto p-4 pb-0 relative z-10" :class="{ 'drag-over': isDragOver, 'bg-gradient-to-br from-neutral-950/30 to-black/20': settingsStore.settings.theme === 'dark' }">
      <div v-for="msg in chatStore.messages" :id="`message-${msg.id}`" :key="msg.id" class="mb-2 relative z-10 group" :class="msg.role">
        <div class="flex items-start">
          <!-- 用户消息 -->
          <UserMessage v-if="msg.role === 'user'" :message="msg" @preview="openPreview" @reuse="reuseMedia" @download="downloadMedia" />

          <!-- AI回复 -->
          <AssistantMessage v-else :message="msg" :is-generating="chatStore.isGenerating" :extract-think-content="extractThinkContent" :remove-think-content="removeThinkContent" :extract-answer-boxes="extractAnswerBoxes" :remove-answer-boxes="removeAnswerBoxes" />
        </div>
      </div>

      <!-- 加载状态 -->
      <LoadingIndicator :is-loading="chatStore.isLoading" />
    </div>

    <!-- 输入区域 -->
    <ChatInput
      v-model="inputText"
      :pending-media="chatStore.pendingMedia"
      :is-loading="chatStore.isLoading"
      :is-generating="chatStore.isGenerating"
      :is-quick-capturing="isQuickCapturing"
      :is-area-capturing="isAreaCapturing"
      :is-file-uploading="isFileUploading"
      :supports-vision="supportsVision"
      @send="sendMessage"
      @stop="stopGeneration"
      @quick-capture="captureScreen"
      @area-capture="captureScreenArea"
      @upload-file="uploadFile"
      @clear-media="handleClearMedia"
      @keydown="handleKeydown"
      @paste="handleInputPaste"
      @file-select="handleFileSelect" />

    <!-- 媒体预览Modal -->
    <MediaPreviewModal :show="showPreview" :src="previewSrc" :type="previewType" :video-base64="previewVideoBase64" @close="closePreview" />

    <!-- HTML预览Modal -->
    <div v-if="showHtmlPreview" class="html-preview-modal" @click="closeHtmlPreview">
      <div class="modal-backdrop"></div>
      <div class="modal-content html-preview-content" @click.stop>
        <div class="html-preview-header">
          <h3>{{ t('chatView.htmlPreview') }}</h3>
          <button class="modal-close-btn" @click.stop="closeHtmlPreview">
            <n-icon size="18">
              <Close />
            </n-icon>
          </button>
        </div>
        <div class="html-preview-container">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="rendered-content" v-html="htmlPreviewContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '../assets/themes/one-dark-pro.css'
import { ref, computed, nextTick, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useMessage, NIcon } from 'naive-ui'
import { Close } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'
import { useChatFunctions } from '../composables/useChatFunctions'
import { getModelVisionCapability, useSettingsStore } from '../stores/settingsStore'

// 代码分割：懒加载组件
import StarryBackground from '../components/StarryBackground.vue'
import DragOverlay from '../components/DragOverlay.vue'
import LoadingIndicator from '../components/LoadingIndicator.vue'
import ChatInput from '../components/ChatInput.vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// 懒加载大型组件
const UserMessage = defineAsyncComponent(() => import('../components/UserMessage.vue'))
const AssistantMessage = defineAsyncComponent(() => import('../components/AssistantMessage.vue'))
const MediaPreviewModal = defineAsyncComponent(() => import('../components/MediaPreviewModal.vue'))

const { t } = useI18n()
const message = useMessage()
const settingsStore = useSettingsStore()

const supportsVision = computed(() => {
  return getModelVisionCapability(settingsStore.settings.model)
})

const { chatStore, extractThinkContent, removeThinkContent, extractAnswerBoxes, removeAnswerBoxes, processFile, handlePaste, sendMessage: sendMessageCore, handleKeyDown: handleKeyDownCore, handleQuickScreenshot: handleQuickScreenshotCore, handleAreaScreenshot: handleAreaScreenshotCore, cleanup, cancelCurrentRequest } = useChatFunctions()

const inputText = ref('')
const isQuickCapturing = ref(false)
const isAreaCapturing = ref(false)
const isFileUploading = ref(false)
const isDragOver = ref(false)
let dragCounter = 0

const showPreview = ref(false)
const previewSrc = ref('')
const previewType = ref<'image' | 'video'>('image')
const previewVideoBase64 = ref('')

const showHtmlPreview = ref(false)
const htmlPreviewContent = ref('')

const messagesContainer = ref<HTMLElement>()
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

watch(
  () => chatStore.messages.length,
  () => nextTick(() => scrollToBottom()),
  { flush: 'post' }
)
watch(
  () => chatStore.messages,
  () => nextTick(() => scrollToBottom()),
  { deep: true, immediate: true, flush: 'post' }
)
watch(
  () => chatStore.isLoading,
  () => nextTick(() => scrollToBottom()),
  { flush: 'post' }
)

watch(
  () => chatStore.isGenerating,
  isGenerating => {
    if (isGenerating) {
      const scrollInterval = setInterval(() => {
        if (!chatStore.isGenerating) {
          clearInterval(scrollInterval)
          return
        }
        const thinkContents = document.querySelectorAll('.think-content-generating')
        thinkContents.forEach(element => {
          if (element instanceof HTMLElement) {
            element.scrollTop = element.scrollHeight
          }
        })
        scrollToBottom()
      }, 100)
      ;(chatStore as Record<string, unknown>)._scrollInterval = scrollInterval
    } else {
      if ((chatStore as Record<string, unknown>)._scrollInterval) {
        clearInterval((chatStore as Record<string, unknown>)._scrollInterval as number)
        delete (chatStore as Record<string, unknown>)._scrollInterval
      }
    }
  }
)

async function handleInputPaste(event: ClipboardEvent): Promise<void> {
  await handlePaste(event, (file: File) => {
    processFile(
      file,
      (data: string | null) => chatStore.setPendingMedia({ image: data || undefined }),
      (data: string | null) => chatStore.setPendingMedia({ video: data || undefined }),
      (data: string | null) => chatStore.setPendingMedia({ videoBase64: data || undefined }),
      (data: string[] | null) => chatStore.setPendingMedia({ pdfImages: data || undefined }),
      (name: string | null) => chatStore.setPendingMedia({ pdfName: name || undefined }),
      (data: string[] | null) => chatStore.setPendingMedia({ pptImages: data || undefined }),
      (name: string | null) => chatStore.setPendingMedia({ pptName: name || undefined }),
      (totalPages: number | null) => chatStore.setPendingMedia({ pptTotalPages: totalPages || undefined }),
      (data: string[] | null) => chatStore.setPendingMedia({ wordImages: data || undefined }),
      (name: string | null) => chatStore.setPendingMedia({ wordName: name || undefined }),
      (totalPages: number | null) => chatStore.setPendingMedia({ wordTotalPages: totalPages || undefined })
    )
  })
}

function handleScroll(): void {
  const container = messagesContainer.value
  if (!container) return
  container.classList.add('scrolling')
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => container.classList.remove('scrolling'), 200)
}

onMounted(() => {
  if (messagesContainer.value) messagesContainer.value.addEventListener('scroll', handleScroll)
  document.addEventListener('keydown', handleGlobalKeydown)
  window.electron.ipcRenderer.on('trigger-quick-screenshot', (): void => captureScreen())
  window.electron.ipcRenderer.on('trigger-area-screenshot', (): void => captureScreenArea())
  window.addEventListener('storage', handleStorageClearEvent)
  chatStore.addWelcomeMessageIfNeeded()
  nextTick().then((): void => setTimeout((): void => scrollToBottom(), 300))
  ;(window as Record<string, unknown>).copyCode = (codeId: string): void => {
    const codeElement = document.getElementById(codeId)
    if (codeElement) {
      navigator.clipboard
        .writeText(codeElement.textContent || '')
        .then((): void => message.success(t('chatView.codeCopied'), { duration: 1500 }))
        .catch((): void => message.error(t('chatView.copyFailed')))
    }
  }
  ;(window as Record<string, unknown>).openHtmlPreview = (codeId: string): void => openHtmlPreview(codeId)
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'polaris-chat-switch-to-message' && e.newValue) handleSwitchToMessage()
  })
  handleSwitchToMessage()
})

const handleGlobalKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    if (showHtmlPreview.value) closeHtmlPreview()
    else if (showPreview.value) closePreview()
  }
}

function handleSwitchToMessage(): void {
  const switchData = localStorage.getItem('polaris-chat-switch-to-message')
  if (switchData) {
    try {
      const { messageId } = JSON.parse(switchData)
      localStorage.removeItem('polaris-chat-switch-to-message')
      const attemptScroll = (attempts = 0): void => {
        const messageElement = document.getElementById(`message-${messageId}`)
        if (messageElement && messagesContainer.value) {
          if (messagesContainer.value.scrollHeight > 0) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            messageElement.style.transition = 'all 0.2s ease'
            messageElement.style.backgroundColor = 'rgba(59, 130, 246, 0.3)'
            messageElement.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)'
            messageElement.style.borderRadius = '8px'
            setTimeout(() => {
              messageElement.style.transition = 'all 0.5s ease'
              messageElement.style.backgroundColor = ''
              messageElement.style.boxShadow = ''
              messageElement.style.borderRadius = ''
            }, 1500)
          } else if (attempts < 10) setTimeout(() => attemptScroll(attempts + 1), 100)
        } else if (attempts < 10) setTimeout(() => attemptScroll(attempts + 1), 100)
      }
      nextTick(() => setTimeout(() => attemptScroll(), 50))
    } catch (error) {
      console.error('解析切换消息数据失败:', error)
    }
  }
}

onUnmounted(() => {
  if (messagesContainer.value) messagesContainer.value.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) clearTimeout(scrollTimeout)
  document.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('storage', handleStorageClearEvent)
  document.body.style.overflow = 'auto'
  cleanup()
})

async function captureScreen(): Promise<void> {
  try {
    isQuickCapturing.value = true
    await handleQuickScreenshotCore((data: string | null) => {
      chatStore.setPendingMedia({
        image: data || undefined,
        video: undefined,
        videoBase64: undefined,
        pdfImages: undefined,
        pdfName: undefined,
        pptImages: undefined,
        pptName: undefined
      })
    })
  } finally {
    isQuickCapturing.value = false
  }
}

async function captureScreenArea(): Promise<void> {
  try {
    isAreaCapturing.value = true
    await handleAreaScreenshotCore((data: string | null) => {
      chatStore.setPendingMedia({
        image: data || undefined,
        video: undefined,
        videoBase64: undefined,
        pdfImages: undefined,
        pdfName: undefined,
        pptImages: undefined,
        pptName: undefined
      })
    })
  } finally {
    isAreaCapturing.value = false
  }
}

function uploadFile(): void {
  // 允许所有模型上传文件
}

async function handleFileSelect(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    message.error(t('chatView.fileSizeExceeded50MB'))
    ;(event.target as HTMLInputElement).value = ''
    return
  }
  try {
    isFileUploading.value = true
    if (file.type.startsWith('image/')) {
      const imageMaxSize = 10 * 1024 * 1024
      if (file.size > imageMaxSize) {
        message.error(t('chatView.imageSizeExceeded10MB'))
        ;(event.target as HTMLInputElement).value = ''
        return
      }
      const reader = new FileReader()
      reader.onload = e => {
        chatStore.setPendingMedia({
          image: e.target?.result as string,
          video: undefined,
          videoBase64: undefined,
          pdfImages: undefined,
          pdfName: undefined,
          pptImages: undefined,
          pptName: undefined,
          wordImages: undefined,
          wordName: undefined
        })
        message.success(t('chatView.imageUploadSuccess'))
        // 重置 file input
        ;(event.target as HTMLInputElement).value = ''
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('video/')) {
      const videoMaxSize = 20 * 1024 * 1024
      if (file.size > videoMaxSize) {
        message.error(t('chatView.videoSizeExceeded20MB'))
        ;(event.target as HTMLInputElement).value = ''
        return
      }
      const reader = new FileReader()
      reader.onload = e => {
        const result = e.target?.result as string
        chatStore.setPendingMedia({
          video: result,
          videoBase64: result,
          image: undefined,
          pdfImages: undefined,
          pdfName: undefined,
          pptImages: undefined,
          pptName: undefined,
          wordImages: undefined,
          wordName: undefined
        })
        message.success(t('chatView.videoUploadSuccess'))
        // 重置 file input
        ;(event.target as HTMLInputElement).value = ''
      }
      reader.readAsDataURL(file)
    } else if (file.type === 'application/pdf' || file.type === 'application/vnd.ms-powerpoint' || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      await processFile(
        file,
        (data: string | null) => chatStore.setPendingMedia({ image: data || undefined }),
        (data: string | null) => chatStore.setPendingMedia({ video: data || undefined }),
        (data: string | null) => chatStore.setPendingMedia({ videoBase64: data || undefined }),
        (data: string[] | null) => chatStore.setPendingMedia({ pdfImages: data || undefined }),
        (name: string | null) => chatStore.setPendingMedia({ pdfName: name || undefined }),
        (data: string[] | null) => chatStore.setPendingMedia({ pptImages: data || undefined }),
        (name: string | null) => chatStore.setPendingMedia({ pptName: name || undefined }),
        (totalPages: number | null) => chatStore.setPendingMedia({ pptTotalPages: totalPages || undefined }),
        (data: string[] | null) => chatStore.setPendingMedia({ wordImages: data || undefined }),
        (name: string | null) => chatStore.setPendingMedia({ wordName: name || undefined }),
        (totalPages: number | null) => chatStore.setPendingMedia({ wordTotalPages: totalPages || undefined })
      )
      // 重置 file input
      ;(event.target as HTMLInputElement).value = ''
    } else {
      message.error(t('chatView.unsupportedFileType'))
      ;(event.target as HTMLInputElement).value = ''
    }
  } catch (error) {
    console.error('文件上传处理失败:', error)
    message.error(t('chatView.fileProcessFailed'))
    ;(event.target as HTMLInputElement).value = ''
  } finally {
    isFileUploading.value = false
  }
}

function handleClearMedia(type: 'image' | 'video' | 'pdf' | 'ppt' | 'word'): void {
  switch (type) {
    case 'image':
      chatStore.setPendingMedia({ image: undefined })
      break
    case 'video':
      if (chatStore.pendingMedia.video && chatStore.pendingMedia.video.startsWith('blob:')) {
        URL.revokeObjectURL(chatStore.pendingMedia.video)
      }
      chatStore.setPendingMedia({ video: undefined, videoBase64: undefined })
      break
    case 'pdf':
      chatStore.setPendingMedia({ pdfImages: undefined, pdfName: undefined })
      break
    case 'ppt':
      chatStore.setPendingMedia({ pptImages: undefined, pptName: undefined, pptTotalPages: undefined })
      break
    case 'word':
      chatStore.setPendingMedia({ wordImages: undefined, wordName: undefined, wordTotalPages: undefined })
      break
  }
}

function reuseMedia(mediaType: 'image' | 'video' | 'pdf' | 'ppt' | 'word', mediaData: string | string[], videoBase64?: string, fileName?: string, totalPages?: number): void {
  try {
    chatStore.clearPendingMedia()
    switch (mediaType) {
      case 'image':
        if (typeof mediaData === 'string') {
          chatStore.setPendingMedia({ image: mediaData })
          message.success(t('floating.imageAdded'))
        }
        break
      case 'video':
        if (typeof mediaData === 'string') {
          chatStore.setPendingMedia({ video: mediaData, videoBase64: videoBase64 || undefined })
          message.success(t('floating.videoAdded'))
        }
        break
      case 'pdf':
        if (Array.isArray(mediaData)) {
          chatStore.setPendingMedia({ pdfImages: mediaData, pdfName: fileName || t('floating.pdfDocument') })
          message.success(t('floating.pdfAdded'))
        }
        break
      case 'ppt':
        if (Array.isArray(mediaData)) {
          chatStore.setPendingMedia({ pptImages: mediaData, pptName: fileName || t('floating.pptDocument'), pptTotalPages: totalPages })
          message.success(t('floating.pptAdded'))
        }
        break
      case 'word':
        if (Array.isArray(mediaData)) {
          chatStore.setPendingMedia({ wordImages: mediaData, wordName: fileName || t('floating.wordDocument'), wordTotalPages: totalPages })
          message.success(t('floating.wordAdded'))
        }
        break
    }
  } catch (error) {
    console.error('复用媒体失败:', error)
    message.error(t('floating.reuseMediaFailed'))
  }
}

function downloadMedia(mediaData: string, mediaType: 'image' | 'video'): void {
  try {
    if (!mediaData) {
      message.error(t('floating.invalidMediaData'))
      return
    }
    const link = document.createElement('a')
    link.style.display = 'none'
    if (mediaData.startsWith('data:')) {
      link.href = mediaData
    } else if (mediaData.startsWith('blob:')) {
      link.href = mediaData
    } else {
      message.error(t('floating.unsupportedMediaFormat'))
      return
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const extension = mediaType === 'image' ? 'png' : 'mp4'
    link.download = `media_${timestamp}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('下载失败:', error)
    message.error(t('floating.downloadFailed'))
  }
}

function handleDragEnter(event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer?.types.includes('Files')) {
    dragCounter++
    isDragOver.value = true
  }
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer?.types.includes('Files')) {
    event.dataTransfer.dropEffect = 'copy'
    if (!isDragOver.value) {
      dragCounter++
      isDragOver.value = true
    }
  }
}

function handleDragLeave(event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    isDragOver.value = false
  }
}

async function handleDrop(event: DragEvent): Promise<void> {
  event.preventDefault()
  event.stopPropagation()
  dragCounter = 0
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return
  const file = files[0]
  const allowedTypes = ['image/', 'video/', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  const isAllowedType = allowedTypes.some(type => file.type.startsWith(type) || file.type === type)
  if (!isAllowedType) {
    message.error('不支持的文件类型，请拖入图片、视频、PDF、PPT或Word文件')
    return
  }
  isFileUploading.value = true
  try {
    const mockEvent = { target: { files: [file], value: '' } } as unknown as Event
    await handleFileSelect(mockEvent)
  } catch (error) {
    console.error('拖拽文件处理失败:', error)
    message.error('文件处理失败，请重试')
  } finally {
    isFileUploading.value = false
  }
}

async function sendMessage(): Promise<void> {
  await sendMessageCore(
    inputText.value.trim(),
    chatStore.pendingMedia.image || '',
    chatStore.pendingMedia.video || '',
    chatStore.pendingMedia.videoBase64 || '',
    chatStore.pendingMedia.pdfImages || [],
    chatStore.pendingMedia.pdfName || '',
    chatStore.pendingMedia.pptImages || [],
    chatStore.pendingMedia.pptName || '',
    chatStore.pendingMedia.pptTotalPages || null,
    chatStore.pendingMedia.wordImages || [],
    chatStore.pendingMedia.wordName || '',
    chatStore.pendingMedia.wordTotalPages || null,
    () => {
      inputText.value = ''
    },
    scrollToBottom
  )
}

function stopGeneration(): void {
  cancelCurrentRequest()
  message.info('已停止生成')
}

async function handleKeydown(event: KeyboardEvent): Promise<void> {
  await handleKeyDownCore(event, sendMessage)
}

function scrollToBottom(): void {
  if (messagesContainer.value) {
    // 检查是否是虚拟滚动容器
    if ('scrollToBottom' in messagesContainer.value) {
      // DynamicScroller 实例
      nextTick(() => {
        const scroller = messagesContainer.value as InstanceType<typeof DynamicScroller>
        scroller.scrollToBottom()
      })
    } else {
      // 普通 div 元素
      const container = messagesContainer.value as HTMLElement
      container.scrollTop = container.scrollHeight
    }
  }
}

function openPreview(type: 'image' | 'video', src: string, videoBase64?: string): void {
  previewSrc.value = src
  previewType.value = type
  previewVideoBase64.value = videoBase64 || ''
  showPreview.value = true
}

function closePreview(): void {
  showPreview.value = false
  previewSrc.value = ''
}

function openHtmlPreview(codeId: string): void {
  const codeElement = document.getElementById(codeId)
  if (codeElement) {
    const htmlCode = codeElement.textContent || ''
    if (window.api && (window.api as Record<string, unknown>).showHtmlPreview) {
      ;((window.api as Record<string, unknown>).showHtmlPreview as (html: string) => Promise<void>)(htmlCode).catch((error: Error) => {
        console.error('打开HTML预览窗口失败:', error)
        fallbackToInlinePreview(htmlCode)
      })
    } else {
      fallbackToInlinePreview(htmlCode)
    }
  }
}

function fallbackToInlinePreview(htmlCode: string): void {
  htmlPreviewContent.value = htmlCode
  showHtmlPreview.value = true
  document.body.style.overflow = 'hidden'
}

function closeHtmlPreview(): void {
  showHtmlPreview.value = false
  htmlPreviewContent.value = ''
  document.body.style.overflow = 'auto'
}

function handleStorageClearEvent(event: StorageEvent): void {
  if (event.key === 'polaris-chat-messages-cleared' && event.newValue) {
    inputText.value = ''
    chatStore.clearPendingMedia()
  }
}
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

/* 滚动容器样式 */
.flex-1.overflow-y-auto::-webkit-scrollbar,
.virtual-scroller::-webkit-scrollbar {
  width: 6px;
}

.flex-1.overflow-y-auto::-webkit-scrollbar-track,
.virtual-scroller::-webkit-scrollbar-track {
  background: transparent;
}

.flex-1.overflow-y-auto::-webkit-scrollbar-thumb,
.virtual-scroller::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
  transition: background 0.5s ease-out;
}

.flex-1.overflow-y-auto.scrolling::-webkit-scrollbar-thumb,
.virtual-scroller.scrolling::-webkit-scrollbar-thumb {
  background: rgba(64, 64, 64, 0.7);
  transition: background 0.2s ease-in;
}

.flex-1.overflow-y-auto.scrolling::-webkit-scrollbar-thumb:hover,
.virtual-scroller.scrolling::-webkit-scrollbar-thumb:hover {
  background: rgba(82, 82, 82, 0.8);
}

/* 虚拟滚动内部元素样式 */
:deep(.vue-recycle-scroller__item-wrapper) {
  overflow: visible !important;
}
:deep(.vue-recycle-scroller__item-view) {
  overflow: visible !important;
}

.drag-over {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.04)) !important;
  position: relative;
}
.katex-display {
  text-align: center;
  margin: 1em 0;
  overflow-x: auto;
  overflow-y: hidden;
}
.katex .base,
.katex .mord,
.katex .mrel,
.katex .mbin,
.katex .mop,
.katex .mopen,
.katex .mclose,
.katex .mpunct {
  color: inherit;
}
.html-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
  -webkit-app-region: no-drag;
}
.html-preview-modal .modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.html-preview-content {
  position: relative;
  width: 90vw;
  height: 90vh;
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: scaleIn 0.2s ease-out;
  -webkit-app-region: no-drag;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}
.html-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  border-radius: 12px 12px 0 0;
}
.html-preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.html-preview-container {
  flex: 1;
  overflow: auto;
  background: white;
}
.rendered-content {
  padding: 20px;
  min-height: 100%;
}
.rendered-content * {
  max-width: 100%;
  word-wrap: break-word;
}
.modal-close-btn {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}
.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 浅色主题样式 */
body[data-theme='light'] .chat-view,
body[data-theme='light'] .messages-container {
  background-color: rgb(237, 237, 237) !important;
}

/* 浅色主题滚动条 */
body[data-theme='light'] .messages-container.scrolling::-webkit-scrollbar-thumb,
body[data-theme='light'] .virtual-scroller.scrolling::-webkit-scrollbar-thumb {
  background: rgba(160, 160, 160, 0.5) !important;
}

body[data-theme='light'] .messages-container.scrolling::-webkit-scrollbar-thumb:hover,
body[data-theme='light'] .virtual-scroller.scrolling::-webkit-scrollbar-thumb:hover {
  background: rgba(120, 120, 120, 0.6) !important;
}

body[data-theme='light'] .drag-over {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.06)) !important;
}
</style>
