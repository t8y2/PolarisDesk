/**
 * 时间格式化工具函数
 */

/**
 * 格式化消息时间戳为可读字符串
 * @param timestamp 时间戳（毫秒）
 * @returns 格式化后的时间字符串
 */
export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 一分钟内
  if (diff < 60000) {
    return '刚刚'
  }

  // 一小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }

  // 一天内
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }

  // 获取时间部分
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const timeString = `${hour}:${minute}`

  // 今年内
  if (date.getFullYear() === now.getFullYear()) {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    // 昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${timeString}`
    }

    // 一周内显示星期
    if (diff < 7 * 86400000) {
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      return `${weekdays[date.getDay()]} ${timeString}`
    }

    // 其他情况显示月-日 时:分
    return `${month}-${day} ${timeString}`
  }

  // 跨年显示完整日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day} ${timeString}`
}

/**
 * 格式化消息时间戳为详细时间（用于悬停提示）
 * @param timestamp 时间戳（毫秒）
 * @returns 详细的时间字符串
 */
export function formatDetailedTime(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`
}
