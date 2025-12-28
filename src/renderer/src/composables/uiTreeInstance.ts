import { useUITree } from './useUITree'

// 创建全局单例实例
let uiTreeInstance: ReturnType<typeof useUITree> | null = null

export function getUITreeInstance(): ReturnType<typeof useUITree> {
  if (!uiTreeInstance) {
    uiTreeInstance = useUITree()
  }
  return uiTreeInstance
}

export function initializeUITree(): ReturnType<typeof useUITree> {
  const instance = getUITreeInstance()
  instance.initialize()
  return instance
}
