<template>
  <div class="media-action-buttons-external">
    <n-tooltip trigger="hover" placement="top" :show-arrow="false">
      <template #trigger>
        <button class="media-action-btn" @click.stop="handleReuse">
          <n-icon size="16">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </n-icon>
        </button>
      </template>
      {{ t('mediaActions.reuse') }}{{ mediaTypeName }}
    </n-tooltip>
    <n-tooltip v-if="showDownload" trigger="hover" placement="top" :show-arrow="false">
      <template #trigger>
        <button class="media-action-btn" @click.stop="handleDownload">
          <n-icon size="16">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          </n-icon>
        </button>
      </template>
      {{ t('mediaActions.download') }}{{ mediaTypeName }}
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTooltip, NIcon } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  mediaType: 'image' | 'video' | 'pdf' | 'ppt'
  showDownload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDownload: true
})

const emit = defineEmits<{
  reuse: []
  download: []
}>()

const mediaTypeName = computed(() => {
  const names = {
    image: t('mediaActions.image'),
    video: t('mediaActions.video'),
    pdf: 'PDF',
    ppt: 'PPT'
  }
  return names[props.mediaType]
})

function handleReuse(): void {
  emit('reuse')
}

function handleDownload(): void {
  emit('download')
}
</script>

<style scoped>
/* 外部媒体操作按钮 */
.media-action-buttons-external {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.media-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.media-action-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.media-action-btn:active {
  transform: scale(0.95);
}
</style>
