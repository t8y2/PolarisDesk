<template>
  <div v-if="content.trim()" class="mb-2">
    <div class="bg-purple-900/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-purple-800/15 think-block">
      <div class="think-header select-none">
        <span class="think-icon">✨</span>
        <span class="think-label">
          {{ isGenerating ? t('think.thinking') : t('think.thinkingProcess') }}
        </span>
        <button class="think-toggle" @click="toggleExpanded">
          <span v-if="isExpanded">{{ t('think.collapse') }}</span>
          <span v-else>{{ t('think.expand') }}</span>
        </button>
      </div>
      <div class="think-content-wrapper" :class="{ 'is-expanded': isExpanded }">
        <div class="think-content" :class="{ 'think-content-generating': isGenerating }">
          <div class="prose prose-sm max-w-none prose-p:text-neutral-400 prose-p:my-1 whitespace-pre-wrap text-neutral-400 text-sm leading-5">
            {{ content }}
            <span v-if="isGenerating" class="loading-dots"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  content: string
  isGenerating?: boolean
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isGenerating: false,
  defaultExpanded: true
})

const isExpanded = ref(props.defaultExpanded)

function toggleExpanded(): void {
  isExpanded.value = !isExpanded.value
}

// 暴露方法供父组件调用
defineExpose({
  toggleExpanded,
  isExpanded
})
</script>

<style scoped>
/* 思考块样式 */
.think-block {
  font-size: 0.875rem;
  position: relative;
}

.think-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  font-size: 0.8rem;
}

.think-icon {
  font-size: 14px;
}

.think-label {
  color: rgb(156, 163, 175);
  font-weight: 500;
  flex: 1;
}

.think-toggle {
  background: none;
  border: none;
  color: rgb(96, 165, 250);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.think-toggle:hover {
  background: rgba(96, 165, 250, 0.1);
  color: rgb(147, 197, 253);
}

/* 使用 Grid 实现平滑的展开/收起动画 */
.think-content-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.think-content-wrapper.is-expanded {
  grid-template-rows: 1fr;
}

.think-content {
  min-height: 0;
  margin-top: 0;
  padding-top: 0;
  border-top: 1px solid transparent;
  transition:
    margin-top 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    padding-top 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    border-top-color 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.think-content-wrapper.is-expanded .think-content {
  margin-top: 8px;
  padding-top: 8px;
  border-top-color: rgba(115, 115, 115, 0.3);
}

/* 生成中的思考块有固定高度和滚动 */
.think-content-generating {
  max-height: 300px;
  overflow-y: auto;
}

.think-content-generating::-webkit-scrollbar {
  width: 0;
  display: none;
}

.think-content .prose {
  font-size: 0.8rem;
  line-height: 1.4;
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
</style>
