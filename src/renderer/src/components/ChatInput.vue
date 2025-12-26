<template>
  <div class="input-area-container">
    <!-- 媒体预览卡片 -->
    <MediaPreviewCard :pending-media="pendingMedia" @clear="handleClearMedia" />

    <!-- 输入框和按钮 -->
    <div class="flex items-end space-x-3">
      <div class="flex space-x-2">
        <n-tooltip trigger="hover" placement="top" :show-arrow="false" :delay="500">
          <template #trigger>
            <n-button circle :loading="isQuickCapturing" :disabled="isAnyOperationInProgress && !isQuickCapturing" class="action-button" @click="handleQuickCapture">
              <template #icon>
                <n-icon>
                  <Camera />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('chatInput.quickScreenshot') }}
        </n-tooltip>

        <n-tooltip trigger="hover" placement="top" :show-arrow="false" :delay="500">
          <template #trigger>
            <n-button circle :loading="isAreaCapturing" :disabled="isAnyOperationInProgress && !isAreaCapturing" class="action-button" @click="handleAreaCapture">
              <template #icon>
                <n-icon>
                  <Cut />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('chatInput.regionScreenshot') }}
        </n-tooltip>

        <n-tooltip trigger="hover" placement="top" :show-arrow="false" :delay="500">
          <template #trigger>
            <n-button circle :loading="isFileUploading" class="action-button" @click="handleUploadFile">
              <template #icon>
                <n-icon>
                  <Document />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('chatInput.uploadFile') }}
        </n-tooltip>
      </div>

      <n-input ref="inputRef" v-model:value="inputText" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" :placeholder="t('chatInput.placeholder')" class="flex-1 custom-input" @keydown="handleKeydown" @paste="handlePaste" />

      <!-- 根据生成状态显示发送或停止按钮 -->
      <n-button v-if="isGenerating" type="error" class="send-button stop-button" @click="handleStop">
        <template #icon>
          <n-icon>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </n-icon>
        </template>
        {{ t('chatInput.stop') }}
      </n-button>
      <n-button v-else type="primary" :disabled="!canSend" class="send-button" @click="handleSend">
        <template #icon>
          <div v-if="isLoading" class="send-loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="15 5" />
            </svg>
          </div>
          <n-icon v-else>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </n-icon>
        </template>
        {{ t('chatInput.send') }}
      </n-button>
    </div>

    <!-- 隐藏的文件输入 -->
    <input ref="fileInputRef" type="file" accept="image/*,video/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" style="display: none" @change="handleFileSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NButton, NTooltip, NIcon } from 'naive-ui'
import { Camera, Document } from '@vicons/carbon'
import { Cut } from '@vicons/tabler'
import { useI18n } from 'vue-i18n'
import MediaPreviewCard from './MediaPreviewCard.vue'

const { t } = useI18n()

interface PendingMedia {
  image?: string
  video?: string
  videoBase64?: string
  pdfImages?: string[]
  pdfName?: string
  pptImages?: string[]
  pptName?: string
  pptTotalPages?: number
}

interface Props {
  pendingMedia: PendingMedia
  isLoading: boolean
  isGenerating: boolean
  isQuickCapturing: boolean
  isAreaCapturing: boolean
  isFileUploading: boolean
  supportsVision: boolean
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  send: []
  stop: []
  quickCapture: []
  areaCapture: []
  uploadFile: []
  clearMedia: [type: 'image' | 'video' | 'pdf' | 'ppt']
  keydown: [event: KeyboardEvent]
  paste: [event: ClipboardEvent]
  fileSelect: [event: Event]
}>()

const inputRef = ref()
const fileInputRef = ref<HTMLInputElement>()

const inputText = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const canSend = computed(() => {
  return (inputText.value.trim() || props.pendingMedia.image || props.pendingMedia.video || (props.pendingMedia.pdfImages && props.pendingMedia.pdfImages.length > 0) || (props.pendingMedia.pptImages && props.pendingMedia.pptImages.length > 0)) && !props.isLoading && !props.isGenerating
})

const isAnyOperationInProgress = computed(() => {
  return props.isQuickCapturing || props.isAreaCapturing
})

function handleSend(): void {
  emit('send')
}

function handleStop(): void {
  emit('stop')
}

function handleQuickCapture(): void {
  emit('quickCapture')
}

function handleAreaCapture(): void {
  emit('areaCapture')
}

function handleUploadFile(): void {
  emit('uploadFile')
  fileInputRef.value?.click()
}

function handleClearMedia(type: 'image' | 'video' | 'pdf' | 'ppt'): void {
  emit('clearMedia', type)
}

function handleKeydown(event: KeyboardEvent): void {
  emit('keydown', event)
}

function handlePaste(event: ClipboardEvent): void {
  emit('paste', event)
}

function handleFileSelect(event: Event): void {
  emit('fileSelect', event)
}

// 暴露方法供父组件调用
defineExpose({
  inputRef,
  fileInputRef,
  focus: () => inputRef.value?.focus()
})
</script>

<style scoped>
/* 底部输入区域美化 */
.input-area-container {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 16px;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 -4px 30px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* 操作按钮样式 */
:deep(.action-button) {
  background: transparent !important;
  border: none !important;
  color: rgba(255, 255, 255, 0.6) !important;
  transition: all 0.2s ease !important;
}

:deep(.action-button:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: white !important;
}

:deep(.action-button:active) {
  transform: scale(0.95);
}

/* 自定义输入框样式 */
:deep(.custom-input) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

:deep(.custom-input:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
}

:deep(.custom-input:focus-within) {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(96, 165, 250, 0.5) !important;
  box-shadow:
    0 0 0 2px rgba(96, 165, 250, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

/* 发送按钮样式 */
:deep(.send-button) {
  background: rgba(96, 165, 250, 0.6) !important;
  border: 1px solid rgba(96, 165, 250, 0.3) !important;
  border-radius: 8px !important;
  padding: 0 20px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
  color: white !important;
}

:deep(.send-button:hover:not(:disabled)) {
  background: rgba(96, 165, 250, 0.8) !important;
  border-color: rgba(96, 165, 250, 0.5) !important;
  box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3) !important;
}

:deep(.send-button:active:not(:disabled)) {
  transform: scale(0.98);
}

:deep(.send-button:disabled) {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

/* 停止按钮样式 */
:deep(.send-button.stop-button) {
  background: rgba(251, 146, 60, 0.7) !important;
  border: 1px solid rgba(251, 146, 60, 0.3) !important;
}

:deep(.send-button.stop-button:hover) {
  background: rgba(251, 146, 60, 0.85) !important;
  border-color: rgba(251, 146, 60, 0.5) !important;
  box-shadow: 0 2px 8px rgba(251, 146, 60, 0.3) !important;
}

/* 发送按钮 loading 样式 */
.send-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
}

.send-loading svg {
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
</style>
