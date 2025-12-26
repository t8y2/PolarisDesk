<template>
  <video :src="currentSrc" :controls="controls" :class="videoClass" v-bind="$attrs" @error="handleVideoError" @loadstart="handleLoadStart">您的浏览器不支持视频播放。</video>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  src?: string
  videoBase64?: string
  controls?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  controls: true,
  class: ''
})

const currentSrc = ref<string>('')
const hasError = ref<boolean>(false)

const videoClass = computed(() => props.class)

const updateVideoSrc = (): void => {
  hasError.value = false

  // 优先使用 base64 data URL，更可靠
  if (props.videoBase64) {
    currentSrc.value = props.videoBase64
  }
  // 如果没有 base64 但有其他 src，则使用 src
  else if (props.src) {
    currentSrc.value = props.src
  } else {
    currentSrc.value = ''
  }
}

const handleVideoError = (): void => {
  console.warn('视频加载失败，当前 src:', currentSrc.value)
  hasError.value = true
}

const handleLoadStart = (): void => {
  hasError.value = false
}

watch(
  () => [props.src, props.videoBase64],
  () => {
    updateVideoSrc()
  },
  { immediate: true }
)

onMounted(() => {
  updateVideoSrc()
})
</script>
