<template>
  <n-select
    v-model:value="currentLanguage"
    :options="languageOptions"
    size="small"
    style="width: 120px"
    @update:value="handleLanguageChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NSelect } from 'naive-ui'
import { useLanguage } from '../composables/useLanguage'

const { locale, switchLanguage } = useLanguage()

const currentLanguage = computed({
  get: () => locale.value,
  set: (value) => {
    switchLanguage(value as 'zh' | 'en')
  }
})

const languageOptions = [
  { label: '简体中文', value: 'zh' },
  { label: 'English', value: 'en' }
]

const handleLanguageChange = (value: string) => {
  switchLanguage(value as 'zh' | 'en')
}
</script>
