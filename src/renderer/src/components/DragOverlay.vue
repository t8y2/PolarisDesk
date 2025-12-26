<template>
  <div v-if="isDragOver" class="drag-overlay-global">
    <div class="drag-indicator-global">
      <div class="drag-icon-container">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
        <div class="drag-upload-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
      </div>
      <div class="drag-text">
        <div class="drag-title">{{ t('drag.releaseToUpload') }}</div>
        <div class="drag-subtitle">{{ t('drag.supportedFormats') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  isDragOver: boolean
}

defineProps<Props>()
</script>

<style scoped>
.drag-overlay-global {
  position: fixed;
  top: 70px;
  left: 10px;
  right: 10px;
  bottom: 65px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  border: 3px dashed rgba(59, 130, 246, 0.8);
  border-radius: 20px;
  animation: dragOverlay 0.2s ease-out;
  pointer-events: none;
}

.drag-indicator-global {
  text-align: center;
  color: #60a5fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.drag-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: dragIconBounce 1s ease-in-out infinite alternate;
}

.drag-upload-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  padding: 8px;
  animation: dragUploadIconPulse 1.5s ease-in-out infinite;
}

@keyframes dragIconBounce {
  0% {
    transform: translateY(0px);
  }
  100% {
    transform: translateY(-10px);
  }
}

@keyframes dragUploadIconPulse {
  0%,
  100% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1);
  }

  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.drag-text {
  user-select: none;
}

.drag-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #60a5fa;
}

.drag-subtitle {
  font-size: 14px;
  color: #94a3b8;
  opacity: 0.9;
}

@keyframes dragOverlay {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
