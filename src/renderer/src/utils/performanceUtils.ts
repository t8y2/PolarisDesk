/**
 * 性能优化工具函数
 */

/**
 * 防抖函数 - 延迟执行，多次调用只执行最后一次
 */
export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(this, args)
      timeout = null
    }, wait)
  }
}

/**
 * 节流函数 - 限制执行频率
 */
export function throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 请求动画帧节流 - 使用RAF优化性能
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(func: T): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      func.apply(this, args)
      rafId = null
    })
  }
}

/**
 * 批量处理 - 将多个操作合并为一次执行
 */
export function batchProcess<T>(processor: (items: T[]) => void, delay: number = 100): (item: T) => void {
  let items: T[] = []
  let timer: ReturnType<typeof setTimeout> | null = null

  return (item: T) => {
    items.push(item)
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      processor(items)
      items = []
      timer = null
    }, delay)
  }
}

/**
 * 内存优化的JSON序列化
 */
export function safeStringify(obj: unknown, maxSize: number = 5000000): string {
  try {
    const str = JSON.stringify(obj)
    if (str.length > maxSize) {
      console.warn(`JSON数据过大 (${str.length} bytes)，尝试简化...`)
      // 返回简化版本
      return JSON.stringify({
        _simplified: true,
        _originalSize: str.length,
        _message: '数据已简化'
      })
    }
    return str
  } catch (error) {
    console.error('JSON序列化失败:', error)
    return '{}'
  }
}

/**
 * 懒加载图片
 */
export function lazyLoadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(src)
    img.onerror = reject
    img.src = src
  })
}

/**
 * 分块处理大数组
 */
export async function processInChunks<T, R>(items: T[], processor: (item: T) => R | Promise<R>, chunkSize: number = 10): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const chunkResults = await Promise.all(chunk.map(processor))
    results.push(...chunkResults)
    // 让出主线程
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  return results
}

/**
 * 内存缓存（带过期时间）
 */
export class MemoryCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>()

  set(key: string, value: T, ttl: number = 60000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    return item.value
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>()

  start(label: string): void {
    this.marks.set(label, performance.now())
  }

  end(label: string): number {
    const start = this.marks.get(label)
    if (!start) {
      console.warn(`性能标记 "${label}" 不存在`)
      return 0
    }
    const duration = performance.now() - start
    this.marks.delete(label)
    return duration
  }

  measure(label: string, fn: () => void): number {
    const start = performance.now()
    fn()
    const duration = performance.now() - start
    console.log(`[性能] ${label}: ${duration.toFixed(2)}ms`)
    return duration
  }

  async measureAsync(label: string, fn: () => Promise<void>): Promise<number> {
    const start = performance.now()
    await fn()
    const duration = performance.now() - start
    console.log(`[性能] ${label}: ${duration.toFixed(2)}ms`)
    return duration
  }
}
