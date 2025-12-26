<template>
  <div v-if="isLoading" class="mb-2 assistant relative z-10">
    <div class="flex items-start">
      <div class="flex items-start w-full">
        <div class="bg-neutral-900/80 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-sm border border-neutral-800/60 flex items-center space-x-2 inline-flex">
          <div class="loading-indicator">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="loading-text">{{ loadingText }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isLoading: boolean
  loadingText?: string
}

withDefaults(defineProps<Props>(), {
  loadingText: 'Polaris正在思考中...'
})
</script>

<style scoped>
.assistant {
  max-width: var(--ai-message-width, 75%);
  margin-left: 0;
  margin-right: auto;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(96, 165, 250, 0.8);
  animation: loadingDot 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loadingDot {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }

  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loading-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
}
</style>
