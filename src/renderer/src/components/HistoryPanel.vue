<template>
  <n-drawer v-model:show="modalVisible" :width="500" placement="right" :closable="true" @update:show="handleModalClose">
    <n-drawer-content :title="t('history.title')" :native-scrollbar="false" closable>
      <template #header>
        <div class="flex justify-start items-center gap-2 history-header">
          <span>{{ t('history.title') }}</span>
          <n-tooltip trigger="hover" placement="top" :show-arrow="false">
            <template #trigger>
              <n-button type="warning" ghost size="small" :disabled="historyData.length === 0" @click="clearAllHistory">{{ t('history.clear') }}</n-button>
            </template>
            {{ t('history.clearAllTip') }}
          </n-tooltip>
        </div>
      </template>
      <!-- 搜索框 -->
      <div style="margin-bottom: 16px">
        <n-input v-model:value="searchText" :placeholder="t('history.searchPlaceholder')" clearable>
          <template #prefix>
            <n-icon>
              <SearchIcon />
            </n-icon>
          </template>
        </n-input>
      </div>

      <!-- 内容区域 -->
      <div class="history-scroll-container">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-container">
          <n-spin size="medium" />
          <p style="margin-top: 16px; color: #999">{{ t('history.loading') }}</p>
        </div>

        <!-- 历史记录列表 -->
        <div v-else-if="displayList.length > 0" class="history-list">
          <div v-for="item in displayList" :key="item.id" class="history-item" @click="loadConversation(item.id)">
            <div class="history-item-content">
              <!-- 主要内容区域 -->
              <div class="history-item-main">
                <div style="display: flex; align-items: center; gap: 8px">
                  <h4 class="history-item-title">
                    {{ item.title || t('history.newConversation') }}
                  </h4>
                  <!-- 当前对话标识 -->
                  <span v-if="item.id === props.currentConversationId" class="current-badge">{{ t('history.current') }}</span>
                  <span class="history-item-meta">{{ formatDate(item.timestamp) }} · {{ t('history.messageCount', { count: item.messageCount }) }}</span>
                </div>
              </div>
              <!-- 删除按钮区域 - 悬浮时显示 -->
              <div class="history-item-actions">
                <n-button size="small" circle quaternary class="delete-btn" @click.stop="deleteItem(item.id)">
                  <template #icon>
                    <n-icon>
                      <DeleteIcon />
                    </n-icon>
                  </template>
                </n-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <n-icon size="48" style="color: #ccc; margin-bottom: 16px">
            <ChatIcon />
          </n-icon>
          <h3 style="margin: 0 0 8px 0; color: #666">
            {{ searchText ? t('history.noMatch') : t('history.empty') }}
          </h3>
          <p style="margin: 0; color: #999; font-size: 14px">
            {{ searchText ? t('history.tryOtherKeywords') : t('history.emptyTip') }}
          </p>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted, h, type VNode } from 'vue'
import { NDrawer, NDrawerContent, NInput, NIcon, NSpin, NButton, NTooltip, useMessage, useDialog } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const SearchIcon = (): VNode => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [h('path', { d: 'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z' })])

const ChatIcon = (): VNode => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [h('path', { d: 'M12,3C17.5,3 22,6.58 22,11C22,15.42 17.5,19 12,19C10.76,19 9.57,18.82 8.47,18.5C5.55,21 2,21 2,21C4.33,18.67 4.7,17.1 4.75,16.5C3.05,15.07 2,13.13 2,11C2,6.58 6.5,3 12,3Z' })])

const DeleteIcon = (): VNode => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [h('path', { d: 'M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z' })])

interface HistoryItem {
  id: string
  title: string
  timestamp: number
  messageCount: number
}

interface StoredConversation {
  id: string
  title: string
  timestamp: number
  messages?: unknown[]
}

interface DatabaseAPI {
  getConversationList: () => Promise<HistoryItem[]>
  deleteConversation: (id: string) => Promise<boolean>
}

interface WindowAPI {
  api?: {
    database?: DatabaseAPI
  }
}

const props = defineProps<{
  isOpen: boolean
  currentConversationId?: string | null
}>()

const emit = defineEmits<{
  close: []
  loadConversation: [id: string]
  startNewConversation: []
}>()

const message = useMessage()
const dialog = useDialog()
const historyData = ref<HistoryItem[]>([])
const isLoading = ref(false)
const searchText = ref('')
const modalVisible = ref(false)

const displayList = computed(() => {
  let filteredData = historyData.value

  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    filteredData = historyData.value.filter(item => item.title.toLowerCase().includes(keyword))
  }

  // 将当前对话置顶
  if (props.currentConversationId) {
    const currentIndex = filteredData.findIndex(item => item.id === props.currentConversationId)
    if (currentIndex > 0) {
      // 如果当前对话不在第一位，将其移到第一位
      const currentItem = filteredData[currentIndex]
      filteredData = [currentItem, ...filteredData.filter(item => item.id !== props.currentConversationId)]
    }
  }

  return filteredData
})

const loadData = async (): Promise<void> => {
  console.log('开始加载历史数据')
  isLoading.value = true

  try {
    // 尝试从数据库加载
    const windowAPI = window as WindowAPI
    if (windowAPI.api?.database) {
      const result = await windowAPI.api.database.getConversationList()
      console.log('数据库返回:', result)

      if (Array.isArray(result)) {
        historyData.value = result
        console.log('成功加载', result.length, '条记录')
      } else {
        console.warn('数据库返回格式错误:', result)
        historyData.value = []
      }
    } else {
      console.log('数据库API不可用，尝试localStorage')
      loadFromLocalStorage()
    }
  } catch (error) {
    console.error('加载失败:', error)
    message.error(t('history.loadFailed'))
    loadFromLocalStorage()
  } finally {
    isLoading.value = false
  }
}

const loadFromLocalStorage = (): void => {
  try {
    const stored = localStorage.getItem('polaris-chat-history')
    if (stored) {
      const parsed = JSON.parse(stored)
      historyData.value = parsed.map((item: StoredConversation) => ({
        id: item.id,
        title: item.title,
        timestamp: item.timestamp,
        messageCount: item.messages?.length || 0
      }))
      console.log('从localStorage加载了', historyData.value.length, '条记录')
    } else {
      historyData.value = []
    }
  } catch (error) {
    console.error('localStorage加载失败:', error)
    historyData.value = []
  }
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return t('history.justNow')
  if (diff < 3600000) return t('history.minutesAgo', { minutes: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('history.hoursAgo', { hours: Math.floor(diff / 3600000) })

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  if (date.getFullYear() === now.getFullYear()) {
    return `${month}-${day} ${hour}:${minute}`
  }

  return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}`
}

const loadConversation = (id: string): void => {
  console.log('加载对话:', id)
  emit('loadConversation', id)
  // 不要立即关闭Modal，让父组件来控制关闭时机
}

const deleteItem = (id: string): void => {
  const item = historyData.value.find(h => h.id === id)
  if (!item) return

  dialog.warning({
    title: t('history.deleteConfirmTitle'),
    content: t('history.deleteConfirmContent', { title: item.title }),
    positiveText: t('history.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        // 检查是否删除的是当前对话
        const isCurrentConversation = id === props.currentConversationId

        const windowAPI = window as WindowAPI
        if (windowAPI.api?.database) {
          const success = await windowAPI.api.database.deleteConversation(id)
          if (success) {
            historyData.value = historyData.value.filter(h => h.id !== id)
            message.success(t('history.deleteSuccess'))

            // 如果删除的是当前对话，通知开始新对话
            if (isCurrentConversation) {
              emit('startNewConversation')
            }
          } else {
            message.error(t('history.deleteFailed'))
          }
        } else {
          // 从localStorage删除
          historyData.value = historyData.value.filter(h => h.id !== id)
          message.success(t('history.deleteSuccess'))

          // 如果删除的是当前对话，通知开始新对话
          if (isCurrentConversation) {
            emit('startNewConversation')
          }
        }
      } catch (error) {
        console.error('删除失败:', error)
        message.error(t('history.deleteFailed'))
      }
    }
  })
}

const clearAllHistory = (): void => {
  if (historyData.value.length === 0) return

  dialog.warning({
    title: t('history.clearAllTitle'),
    content: t('history.clearAllContent'),
    positiveText: t('history.clearAll'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        const windowAPI = window as WindowAPI

        // 先删除数据库中的所有对话
        if (windowAPI.api?.database) {
          const deletePromises = historyData.value.map(item => windowAPI.api!.database!.deleteConversation(item.id))
          await Promise.all(deletePromises)
        }

        // 清空localStorage中的历史记录
        localStorage.removeItem('polaris-chat-history')

        // 清空本地数组
        historyData.value = []

        // 通知开始新对话并关闭模态框
        emit('startNewConversation')
        emit('close')

        message.success(t('history.clearAllSuccess'))
      } catch (error) {
        console.error('清空历史记录失败:', error)
        message.error(t('history.clearAllFailed'))
      }
    }
  })
}

const handleModalClose = (visible: boolean): void => {
  if (!visible) {
    emit('close')
  }
}

watch(
  () => props.isOpen,
  newVal => {
    modalVisible.value = newVal
    if (newVal) {
      loadData()
    }
  }
)

watch(
  () => searchText.value,
  () => {}
)

onMounted(() => {
  modalVisible.value = props.isOpen
  if (props.isOpen) {
    loadData()
  }
})
</script>

<style>
.history-scroll-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.loading-container {
  text-align: center;
  padding: 40px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.history-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.history-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.history-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.history-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>

<style scoped>
.history-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;
  overflow: hidden;
  cursor: pointer;
}

.history-item:hover {
  border-color: #18a058;
}

.history-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.history-item-main {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
}

.history-item-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.current-badge {
  font-size: 12px;
  color: #18a058;
  background: rgba(24, 160, 88, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  font-weight: 500;
}

.history-item-meta {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.history-item-actions {
  padding: 12px 16px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.history-item:hover .history-item-actions {
  opacity: 1;
}

.delete-btn {
  color: #ff4757 !important;
}

.delete-btn:hover {
  background-color: rgba(255, 71, 87, 0.1) !important;
}

[data-theme='dark'] .history-item-title {
  color: #e0e0e0;
}

.history-header {
  position: relative;
  z-index: 100;
}
</style>
