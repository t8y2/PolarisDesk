<template>
  <div v-for="(answer, index) in answers" :key="`answer-${index}`" class="bg-green-800/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-600/40 answer-block mb-2">
    <div class="answer-header select-none">
      <span class="answer-label">{{ t('answer.label') }}</span>
    </div>
    <div class="answer-content">
      <MarkdownRenderer :content="answer" class="prose prose-sm max-w-none prose-p:text-green-100 prose-p:my-1 prose-strong:text-green-100 prose-em:text-green-100 prose-headings:text-green-100 prose-code:bg-green-900/40 prose-code:text-green-100 prose-ul:text-green-100 prose-ol:text-green-100 prose-li:text-green-100 text-green-100 text-sm leading-5 font-medium" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MarkdownRenderer from './MarkdownRenderer.vue'

const { t } = useI18n()

interface Props {
  answers: string[]
}

defineProps<Props>()
</script>

<style scoped>
/* 答案块样式 */
.answer-block {
  font-size: 0.875rem;
  position: relative;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  font-size: 0.8rem;
}

.answer-label {
  color: rgb(34, 197, 94);
  font-weight: 500;
  flex: 1;
}

.answer-content {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(34, 197, 94, 0.2);
}

.answer-content .prose {
  font-size: 0.8rem;
  line-height: 1.4;
}
</style>
