import { onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'

/**
 * 用于初始化设置的组合函数
 * 在应用启动时调用，确保设置正确加载和同步
 */
export function useSettingsInit(): { settingsStore: ReturnType<typeof useSettingsStore> } {
  const settingsStore = useSettingsStore()
  let cleanup: (() => void) | null = null

  onMounted(async () => {
    // 加载设置（现在是异步的）
    await settingsStore.loadSettings()

    // 应用窗口透明度
    if (window.api?.setWindowOpacity) {
      window.api.setWindowOpacity(settingsStore.settings.windowOpacity)
    }

    // 设置跨窗口同步
    cleanup = settingsStore.setupCrossWindowSync()

    console.log('设置初始化完成')
  })

  onUnmounted(() => {
    // 清理跨窗口同步监听器
    if (cleanup) {
      cleanup()
    }
  })

  return {
    settingsStore
  }
}
