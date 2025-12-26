<template>
  <div v-if="show" class="media-preview-modal" @click="handleClose">
    <div class="modal-backdrop"></div>
    <div class="modal-content" @click.stop>
      <button class="modal-close-btn" @click.stop="handleClose">
        <n-icon size="16">
          <Close />
        </n-icon>
      </button>
      <div class="media-container">
        <img v-if="type === 'image'" :src="src" alt="预览图片" class="preview-media" />
        <VideoPlayer v-if="type === 'video'" :src="src" :video-base64="videoBase64" class="preview-media" autoplay />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { NIcon } from 'naive-ui'
import { Close } from '@vicons/carbon'
import VideoPlayer from './VideoPlayer.vue'

interface Props {
  show: boolean
  src: string
  type: 'image' | 'video'
  videoBase64?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

function handleClose(): void {
  emit('close')
}

// 监听 show 变化来控制页面滚动
watch(
  () => props.show,
  newValue => {
    if (newValue) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }
)
</script>

<style scoped>
/* 媒体预览Modal样式 */
.media-preview-modal {
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

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.2s ease-out;
  -webkit-app-region: no-drag;
}

.modal-close-btn {
  position: absolute;
  top: -12px;
  right: -12px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10001;
  -webkit-app-region: no-drag;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
}

.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.05);
}

.media-container {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.preview-media {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
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
</style>
