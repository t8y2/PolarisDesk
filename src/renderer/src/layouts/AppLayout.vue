<template>
  <div class="h-screen flex flex-col bg-black">
    <AppHeader />
    <!-- 包裹main和抽屉，确保抽屉在header下方 -->
    <div class="flex-1 overflow-hidden relative">
      <main class="h-full overflow-hidden">
        <slot />
      </main>
      <!-- 历史面板 - 放在main同级，但在header下方 -->
      <HistoryPanel :is-open="showHistoryPanel" :current-conversation-id="chatStore.currentConversationId" @close="closeHistoryPanel" @load-conversation="loadHistoryConversation" @start-new-conversation="handleStartNewConversation" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import HistoryPanel from '../components/HistoryPanel.vue'
import { useChatStore } from '../stores/chatStore'

const chatStore = useChatStore()
const showHistoryPanel = ref(false)

const closeHistoryPanel = (): void => {
  showHistoryPanel.value = false
}

const loadHistoryConversation = async (conversationId: string): Promise<void> => {
  try {
    await chatStore.loadConversation(conversationId)
    showHistoryPanel.value = false
  } catch (error) {
    console.error('加载对话失败:', error)
  }
}

const handleStartNewConversation = async (): Promise<void> => {
  await chatStore.startNewConversation()
  showHistoryPanel.value = false
}

// 暴露给window，让AppHeader可以调用
if (typeof window !== 'undefined') {
  ;(window as Record<string, unknown>).__toggleHistoryPanel = (show: boolean): void => {
    showHistoryPanel.value = show
  }
  ;(window as Record<string, unknown>).__getHistoryPanelState = (): boolean => {
    return showHistoryPanel.value
  }
}
</script>
