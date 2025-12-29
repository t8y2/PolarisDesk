<template>
  <div v-if="content.trim()" class="mb-2">
    <n-collapse :default-expanded-names="defaultExpanded ? ['think'] : []" :arrow-placement="'right'" class="think-collapse">
      <n-collapse-item name="think" class="think-collapse-item">
        <template #header>
          <div class="think-header">
            <!-- 思考中动画加载器 -->
            <div v-if="isGenerating" class="think-icon-wrapper">
              <ThinkingLoader :size="0.2" :speed="2" />
            </div>
            <!-- 完成图标 -->
            <span v-else class="think-icon">✓</span>
            <span class="think-label" :class="{ 'thinking-blink': isGenerating }">
              {{ isGenerating ? t('think.thinking') : t('think.thinkingComplete') }}
            </span>
          </div>
        </template>
        <div class="think-content" :class="{ 'think-content-generating': isGenerating }">
          <div class="prose prose-sm max-w-none prose-p:text-neutral-400 prose-p:my-1 whitespace-pre-wrap text-neutral-400 text-sm leading-5">
            {{ content }}
            <span v-if="isGenerating" class="loading-dots"></span>
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script setup lang="ts">
import { NCollapse, NCollapseItem } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import ThinkingLoader from './ThinkingLoader.vue'

const { t } = useI18n()

interface Props {
  content: string
  isGenerating?: boolean
  defaultExpanded?: boolean
}

withDefaults(defineProps<Props>(), {
  isGenerating: false,
  defaultExpanded: true
})
</script>

<style scoped>
/* 思考块折叠面板样式 */
:deep(.think-collapse) {
  background: transparent !important;
  border: none !important;
}

:deep(.think-collapse-item) {
  background: rgba(147, 51, 234, 0.1) !important;
  backdrop-filter: blur(8px) !important;
  border: 1px solid rgba(147, 51, 234, 0.2) !important;
  border-radius: 12px !important;
  overflow: hidden !important;
}

:deep(.think-collapse-item .n-collapse-item__header) {
  background: transparent !important;
  padding: 6px 12px !important;
  font-size: 0.875rem !important;
  border: none !important;
  min-height: unset !important;
  line-height: 1.2 !important;
}

:deep(.think-collapse-item .n-collapse-item__header:hover) {
  background: rgba(147, 51, 234, 0.05) !important;
}

:deep(.think-collapse-item .n-collapse-item__header-main) {
  flex: 1 !important;
}

:deep(.think-collapse-item .n-collapse-item__arrow) {
  color: rgb(147, 51, 234) !important;
  font-size: 16px !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.think-collapse-item .n-collapse-item__content-wrapper) {
  border-top: 1px solid rgba(147, 51, 234, 0.15) !important;
}

:deep(.think-collapse-item .n-collapse-item__content-inner) {
  padding: 8px 12px !important;
}

.think-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  user-select: none;
}

.think-icon-wrapper {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.think-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.think-label {
  color: rgb(196, 181, 253);
  font-weight: 500;
  flex: 1;
  font-size: 0.875rem;
}

/* 思考中闪烁动画 */
.thinking-blink {
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.think-content {
  font-size: 0.875rem;
}

/* 生成中的思考块有固定高度和滚动 */
.think-content-generating {
  max-height: 300px;
  overflow-y: auto;
}

.think-content-generating::-webkit-scrollbar {
  width: 4px;
}

.think-content-generating::-webkit-scrollbar-track {
  background: transparent;
}

.think-content-generating::-webkit-scrollbar-thumb {
  background: rgba(147, 51, 234, 0.3);
  border-radius: 2px;
}

.think-content-generating::-webkit-scrollbar-thumb:hover {
  background: rgba(147, 51, 234, 0.5);
}

.think-content .prose {
  font-size: 0.8rem;
  line-height: 1.5;
}

/* 加载动画 */
.loading-dots::after {
  content: '';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%,
  20% {
    content: '.';
  }
  40% {
    content: '..';
  }
  60%,
  100% {
    content: '...';
  }
}

/* 浅色主题样式 */
body[data-theme='light'] :deep(.think-collapse-item) {
  background: rgba(149, 236, 105, 0.12) !important;
  border-color: rgba(149, 236, 105, 0.3) !important;
}

body[data-theme='light'] :deep(.think-collapse-item .n-collapse-item__header:hover) {
  background: rgba(149, 236, 105, 0.08) !important;
}

body[data-theme='light'] :deep(.think-collapse-item .n-collapse-item__arrow) {
  color: #15803d !important;
}

body[data-theme='light'] :deep(.think-collapse-item .n-collapse-item__content-wrapper) {
  border-top-color: rgba(149, 236, 105, 0.25) !important;
}

body[data-theme='light'] .think-label {
  color: #15803d !important;
  font-weight: 600 !important;
}

body[data-theme='light'] .think-content,
body[data-theme='light'] .think-content .prose,
body[data-theme='light'] .think-content *,
body[data-theme='light'] .think-content div {
  color: #1a1a1a !important;
}

body[data-theme='light'] .think-content-generating::-webkit-scrollbar-thumb {
  background: rgba(149, 236, 105, 0.4);
}

body[data-theme='light'] .think-content-generating::-webkit-scrollbar-thumb:hover {
  background: rgba(149, 236, 105, 0.6);
}

/* 浅色主题加载器颜色 */
body[data-theme='light'] .think-icon-wrapper :deep(.thinking-loader) {
  --color-one: #15803d;
  --color-two: #95ec69;
  --color-three: #15803d80;
  --color-four: #95ec6980;
  --color-five: #15803d40;
}
</style>
