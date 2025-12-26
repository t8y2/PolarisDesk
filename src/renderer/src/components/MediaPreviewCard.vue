<template>
  <div class="media-preview-cards">
    <!-- 图片预览 -->
    <div v-if="pendingMedia.image" class="relative mb-3 inline-block">
      <img :src="pendingMedia.image" :alt="t('media.imageToSend')" class="max-w-200px max-h-150px rounded-lg shadow-md border border-neutral-700" />
      <n-button circle size="tiny" type="error" class="absolute -top-1 -right-1" @click="handleClear('image')">
        <template #icon>
          <n-icon size="12">
            <Close />
          </n-icon>
        </template>
      </n-button>
    </div>

    <!-- 视频预览 -->
    <div v-if="pendingMedia.video" class="relative mb-3 inline-block">
      <VideoPlayer :src="pendingMedia.video" :video-base64="pendingMedia.videoBase64" class="max-w-200px max-h-150px rounded-lg shadow-md border border-neutral-700" />
      <n-button circle size="tiny" type="error" class="absolute -top-1 -right-1" @click="handleClear('video')">
        <template #icon>
          <n-icon size="12">
            <Close />
          </n-icon>
        </template>
      </n-button>
    </div>

    <!-- PDF预览 -->
    <div v-if="pendingMedia.pdfImages && pendingMedia.pdfImages.length > 0" class="relative mb-3 inline-block">
      <div class="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 flex items-center space-x-2">
        <div class="text-lg w-8 h-8">
          <img src="@renderer/assets/icons/pdf3.svg" alt="PDF" class="w-full h-full" />
        </div>
        <div class="text-neutral-300">
          <div class="text-sm font-medium">{{ pendingMedia.pdfName || t('media.pdfDocument') }}</div>
          <div class="text-xs text-neutral-400">{{ t('media.pages', { count: pendingMedia.pdfImages.length }) }}</div>
        </div>
      </div>
      <n-button circle size="tiny" type="error" class="absolute -top-1 -right-1" @click="handleClear('pdf')">
        <template #icon>
          <n-icon size="12">
            <Close />
          </n-icon>
        </template>
      </n-button>
    </div>

    <!-- PPT预览 -->
    <div v-if="pendingMedia.pptImages && pendingMedia.pptImages.length > 0" class="relative mb-3 inline-block">
      <div class="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 flex items-center space-x-2">
        <div class="text-lg w-8 h-8">
          <img src="@renderer/assets/icons/ppt3.svg" alt="PPT" class="w-full h-full" />
        </div>
        <div class="text-neutral-300">
          <div class="text-sm font-medium">{{ pendingMedia.pptName || t('media.pptDocument') }}</div>
          <div class="text-xs text-neutral-400">{{ t('media.pages', { count: pendingMedia.pptTotalPages || pendingMedia.pptImages.length }) }}</div>
        </div>
      </div>
      <n-button circle size="tiny" type="error" class="absolute -top-1 -right-1" @click="handleClear('ppt')">
        <template #icon>
          <n-icon size="12">
            <Close />
          </n-icon>
        </template>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { Close } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'
import VideoPlayer from './VideoPlayer.vue'

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
}

defineProps<Props>()

const emit = defineEmits<{
  clear: [type: 'image' | 'video' | 'pdf' | 'ppt']
}>()

function handleClear(type: 'image' | 'video' | 'pdf' | 'ppt'): void {
  emit('clear', type)
}
</script>

<style scoped>
.media-preview-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
