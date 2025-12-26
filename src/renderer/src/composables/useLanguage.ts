import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../stores/settingsStore'

export function useLanguage() {
  const { locale } = useI18n()
  const settingsStore = useSettingsStore()

  // 初始化语言
  const initLanguage = () => {
    locale.value = settingsStore.settings.language
  }

  // 监听设置变化
  watch(
    () => settingsStore.settings.language,
    (newLang) => {
      locale.value = newLang
    }
  )

  // 切换语言
  const switchLanguage = async (lang: 'zh' | 'en') => {
    await settingsStore.updateSetting('language', lang)
  }

  return {
    locale,
    initLanguage,
    switchLanguage
  }
}
