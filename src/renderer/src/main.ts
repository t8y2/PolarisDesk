import './assets/main.css'
import 'uno.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n'

// 在应用创建前立即初始化CSS变量，确保布局稳定
const initializeCSSVariables = (): void => {
  try {
    const savedSettings = localStorage.getItem('polaris-desk-settings')
    let userMessageWidth = 80
    let aiMessageWidth = 75

    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      userMessageWidth = settings.userMessageWidth || 80
      aiMessageWidth = settings.aiMessageWidth || 75
    }

    // 使用 setProperty 方法设置CSS变量，确保正确更新
    document.documentElement.style.setProperty('--user-message-width', `${userMessageWidth}%`)
    document.documentElement.style.setProperty('--ai-message-width', `${aiMessageWidth}%`)

    console.log('CSS变量已初始化:', { userMessageWidth, aiMessageWidth })
  } catch (error) {
    console.error('初始化CSS变量失败:', error)
    // 发生错误时使用默认值，确保CSS变量始终存在
    document.documentElement.style.setProperty('--user-message-width', '80%')
    document.documentElement.style.setProperty('--ai-message-width', '75%')
  }
}

// 确保在创建应用之前，DOM已经完全准备好
const initializeApp = (): void => {
  // 立即设置CSS变量
  initializeCSSVariables()

  // 直接挂载应用，因为CSS变量已经在最高优先级设置
  const app = createApp(App)
  app.use(createPinia())
  app.use(i18n)
  app.mount('#app')
  console.log('应用已挂载')
}

// 更可靠的DOM准备检测
const waitForDOM = (): Promise<void> => {
  return new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve()
    } else if (document.readyState === 'interactive') {
      // DOM构建完成但资源可能还在加载
      setTimeout(resolve, 0)
    } else {
      document.addEventListener('DOMContentLoaded', () => resolve())
    }
  })
}

// 初始化应用
waitForDOM().then(() => {
  // 使用requestAnimationFrame确保在浏览器下一次重绘前初始化
  requestAnimationFrame(initializeApp)
})
