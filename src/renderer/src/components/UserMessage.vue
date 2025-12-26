<template>
  <div class="ml-auto flex flex-col items-end">
    <!-- 图片预览 -->
    <div v-if="message.image" class="mb-2 flex items-center gap-2 media-container">
      <MediaActionButtons media-type="image" @reuse="handleReuse('image', message.image)" @download="handleDownload(message.image, 'image')" />
      <div class="relative media-hover-container">
        <img :src="message.image" :alt="t('userMessage.uploadedImage')" class="max-w-300px max-h-200px rounded-lg shadow-md border border-neutral-700 cursor-pointer transition-all duration-200" @click="handlePreview('image', message.image)" />
        <div class="media-hover-overlay">
          <n-icon size="24" class="eye-icon">
            <View />
          </n-icon>
        </div>
      </div>
    </div>

    <!-- 视频预览 -->
    <div v-if="message.video" class="mb-2 flex items-center gap-2 media-container">
      <MediaActionButtons media-type="video" @reuse="handleReuse('video', message.video, message.videoBase64)" @download="handleDownload(message.video || message.videoBase64 || '', 'video')" />
      <div class="relative media-hover-container">
        <VideoPlayer :src="message.video" :video-base64="message.videoBase64" class="max-w-300px max-h-200px rounded-lg shadow-md border border-neutral-700 cursor-pointer transition-all duration-200" @click="handlePreview('video', message.video, message.videoBase64)" />
        <div class="media-hover-overlay">
          <n-icon size="24" class="eye-icon">
            <View />
          </n-icon>
        </div>
      </div>
    </div>

    <!-- PDF预览 -->
    <div v-if="message.pdfImages && message.pdfImages.length > 0" class="mb-2 flex items-center gap-2 media-container">
      <MediaActionButtons media-type="pdf" :show-download="false" @reuse="handleReuse('pdf', message.pdfImages, undefined, message.pdfName)" />
      <div class="user-file-card bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 flex items-center space-x-2 max-w-200px">
        <div class="text-lg w-8 h-8">
          <img src="@renderer/assets/icons/pdf3.svg" alt="PDF" class="w-full h-full" />
        </div>
        <div class="user-file-text text-neutral-300 flex-1 min-w-0">
          <div class="text-sm font-medium truncate">{{ message.pdfName || t('floating.pdfDocument') }}</div>
          <div class="user-file-meta text-xs text-neutral-400">{{ t('floating.pages', { count: message.pdfImages.length }) }}</div>
        </div>
      </div>
    </div>

    <!-- PPT预览 -->
    <div v-if="message.pptImages && message.pptImages.length > 0" class="mb-2 flex items-center gap-2 media-container">
      <MediaActionButtons media-type="ppt" :show-download="false" @reuse="handleReuse('ppt', message.pptImages, undefined, message.pptName, message.pptTotalPages)" />
      <div class="user-file-card bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 flex items-center space-x-2 max-w-200px">
        <div class="text-lg w-8 h-8">
          <img src="@renderer/assets/icons/ppt3.svg" alt="PPT" class="w-full h-full" />
        </div>
        <div class="user-file-text text-neutral-300 flex-1 min-w-0">
          <div class="text-sm font-medium truncate">{{ message.pptName || t('floating.pptDocument') }}</div>
          <div class="user-file-meta text-xs text-neutral-400">{{ t('floating.pages', { count: message.pptTotalPages || message.pptImages.length }) }}</div>
        </div>
      </div>
    </div>

    <!-- 文本内容 -->
    <div v-if="message.content" class="user-message-content bg-blue-900/80 backdrop-blur-sm text-white px-3 py-2 rounded-xl break-words border border-blue-800/50">
      {{ message.content }}
    </div>

    <!-- 时间戳 - 悬浮时显示 -->
    <div v-if="message.timestamp" class="text-xs text-neutral-500 mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity duration-200" :title="formatDetailedTime(message.timestamp)">
      {{ formatMessageTime(message.timestamp) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { View } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'
import VideoPlayer from './VideoPlayer.vue'
import MediaActionButtons from './MediaActionButtons.vue'
import { formatMessageTime, formatDetailedTime } from '../utils/timeFormat'

const { t } = useI18n()

interface Message {
  id: string
  role: 'user'
  content?: string
  image?: string
  video?: string
  videoBase64?: string
  pdfImages?: string[]
  pdfName?: string
  pptImages?: string[]
  pptName?: string
  pptTotalPages?: number
  timestamp?: number
}

interface Props {
  message: Message
}

defineProps<Props>()

const emit = defineEmits<{
  preview: [type: 'image' | 'video', src: string, videoBase64?: string]
  reuse: [type: 'image' | 'video' | 'pdf' | 'ppt', data: string | string[], videoBase64?: string, fileName?: string, totalPages?: number]
  download: [data: string, type: 'image' | 'video']
}>()

function handlePreview(type: 'image' | 'video', src: string, videoBase64?: string): void {
  emit('preview', type, src, videoBase64)
}

function handleReuse(type: 'image' | 'video' | 'pdf' | 'ppt', data: string | string[], videoBase64?: string, fileName?: string, totalPages?: number): void {
  emit('reuse', type, data, videoBase64, fileName, totalPages)
}

function handleDownload(data: string, type: 'image' | 'video'): void {
  emit('download', data, type)
}
</script>

<style scoped>
/* 媒体hover效果 */
.media-hover-container {
  position: relative;
  display: inline-block;
}

.media-hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.media-hover-container:hover .media-hover-overlay {
  opacity: 1;
}

.eye-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.media-container:hover :deep(.media-action-buttons-external) {
  opacity: 1;
  pointer-events: auto;
}

/* 浅色主题样式 */
body[data-theme='light'] .user-file-card {
  background-color: #95ec69 !important;
  border-color: transparent !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

body[data-theme='light'] .user-file-text {
  color: #1a1a1a !important;
}

body[data-theme='light'] .user-file-meta {
  color: #2d2d2d !important;
}

body[data-theme='light'] .user-message-content {
  background-color: #95ec69 !important;
  color: #1a1a1a !important;
  border-color: transparent !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}
</style>
