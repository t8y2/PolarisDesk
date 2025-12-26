import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zh from './locales/zh'

export type MessageSchema = typeof zh

const i18n = createI18n<[MessageSchema], 'zh' | 'en'>({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'zh',
  messages: {
    zh,
    en
  }
})

export default i18n
