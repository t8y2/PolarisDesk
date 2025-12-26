/**
 * 错误处理工具
 */

interface ErrorInfo {
  message: string
  type: 'network' | 'server' | 'client' | 'unknown'
  code?: string | number
}

/**
 * 错误分类器
 */
function categorizeError(error: unknown): ErrorInfo {
  if (!(error instanceof Error)) {
    return {
      message: '发生了未知错误',
      type: 'unknown'
    }
  }

  const message = error.message

  // 网络错误
  if (message.includes('网络') || message.includes('network') || message.includes('fetch')) {
    return {
      message: '网络连接出现问题，请检查网络连接后重试',
      type: 'network'
    }
  }

  // 超时错误
  if (message.includes('timeout')) {
    return {
      message: '请求超时，请稍后重试',
      type: 'network'
    }
  }

  // HTTP状态码错误
  if (message.includes('500')) {
    if (message.includes('string indices must be integers')) {
      return {
        message: '服务器处理消息格式时出现错误，请检查输入内容或稍后重试',
        type: 'server',
        code: 500
      }
    }
    return {
      message: '服务器内部错误，请稍后重试',
      type: 'server',
      code: 500
    }
  }

  if (message.includes('403')) {
    return {
      message: '访问被拒绝，请检查API密钥或权限设置',
      type: 'client',
      code: 403
    }
  }

  if (message.includes('404')) {
    return {
      message: 'API端点未找到，请检查服务器地址配置',
      type: 'client',
      code: 404
    }
  }

  if (message.includes('400')) {
    // 尝试解析错误详情
    try {
      const match = message.match(/"message":"([^"]+)"/)
      if (match && match[1]) {
        return {
          message: match[1],
          type: 'client',
          code: 400
        }
      }
    } catch {
      // 解析失败，返回默认消息
    }
    return {
      message: '请求参数错误，请检查配置',
      type: 'client',
      code: 400
    }
  }

  if (message.includes('429')) {
    // 尝试解析限流错误详情
    try {
      const match = message.match(/"message":"([^"]+)"/)
      if (match && match[1]) {
        return {
          message: match[1],
          type: 'client',
          code: 429
        }
      }
    } catch {
      // 解析失败，返回默认消息
    }
    return {
      message: '请求频率过高，请稍后重试',
      type: 'client',
      code: 429
    }
  }

  // 取消错误
  if (error.name === 'AbortError') {
    return {
      message: '请求已取消',
      type: 'client'
    }
  }

  // 默认错误
  return {
    message: '抱歉，发生了错误，请稍后再试',
    type: 'unknown'
  }
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  return categorizeError(error).message
}
