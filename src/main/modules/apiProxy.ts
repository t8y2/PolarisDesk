import { logger } from '../utils/logger'

export class ApiProxy {
  // 活跃的流式请求映射，用于管理和取消请求
  private activeStreams = new Map<string, AbortController>()

  // 添加API代理功能
  async proxyApiRequest(url: string, options: RequestInit): Promise<{ ok: boolean; status: number; data: unknown }> {
    const startTime = Date.now()

    try {
      logger.apiRequest({
        method: options.method || 'POST',
        url,
        hasBody: !!options.body
      })

      const response = await fetch(url, options)
      const duration = Date.now() - startTime

      logger.apiResponse({
        status: response.status,
        statusText: response.statusText,
        duration
      })

      const contentType = response.headers.get('content-type')
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
        logger.debug('JSON 响应已解析')
      } else {
        const text = await response.text()
        logger.warn('收到非 JSON 格式响应')
        data = { error: '服务器返回非JSON格式响应', content: text }
      }

      return {
        ok: response.ok,
        status: response.status,
        data: data
      }
    } catch (error) {
      logger.error('API 请求失败', error)
      throw error
    }
  }

  // 取消指定的流式请求
  cancelStream(streamId: string): void {
    const controller = this.activeStreams.get(streamId)
    if (controller) {
      logger.warn(`取消流式请求: ${streamId}`)
      controller.abort()
      this.activeStreams.delete(streamId)
    }
  }

  // 取消所有活跃的流式请求
  cancelAllStreams(): void {
    logger.warn(`取消所有活跃的流式请求 (${this.activeStreams.size} 个)`)
    for (const [, controller] of this.activeStreams) {
      controller.abort()
    }
    this.activeStreams.clear()
  }

  // 添加流式API代理功能
  async createStreamProxy(url: string, options: RequestInit, webContents: Electron.WebContents, streamId: string): Promise<{ ok: boolean; status: number }> {
    const startTime = Date.now()
    let chunkCount = 0

    try {
      logger.apiRequest({
        method: options.method || 'POST',
        url,
        streamId,
        hasBody: !!options.body
      })

      const controller = new AbortController()
      this.activeStreams.set(streamId, controller)

      const requestOptions = {
        ...options,
        signal: controller.signal
      }

      const response = await fetch(url, requestOptions)

      logger.apiResponse({
        status: response.status,
        statusText: response.statusText,
        isStream: true
      })

      if (!response.ok) {
        this.activeStreams.delete(streamId)

        // 尝试读取错误详情
        try {
          const errorText = await response.text()
          logger.error('流式 API 请求失败', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          })
          webContents.send('stream-error', streamId, `HTTP ${response.status}: ${errorText}`)
        } catch {
          logger.error('流式 API 请求失败', {
            status: response.status,
            statusText: response.statusText
          })
          webContents.send('stream-error', streamId, `HTTP ${response.status}: ${response.statusText}`)
        }

        return { ok: false, status: response.status }
      }

      if (!response.body) {
        this.activeStreams.delete(streamId)
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      logger.stream(`开始接收流式数据: ${streamId}`)

      try {
        while (true) {
          if (controller.signal.aborted) {
            logger.warn(`流式请求已被取消: ${streamId}`)
            break
          }

          const { done, value } = await reader.read()

          if (done) {
            const duration = Date.now() - startTime
            logger.streamStats({
              streamId,
              totalChunks: chunkCount,
              status: 'completed'
            })
            logger.success(`流式响应完成，耗时 ${duration}ms`)

            // 通知渲染进程流式响应结束
            webContents.send('stream-chunk', streamId, null, true)
            break
          }

          chunkCount++

          // 将数据块发送到渲染进程
          const chunk = decoder.decode(value, { stream: true })
          webContents.send('stream-chunk', streamId, chunk, false)
        }
      } finally {
        reader.releaseLock()
        this.activeStreams.delete(streamId)
      }

      return { ok: true, status: response.status }
    } catch (error) {
      this.activeStreams.delete(streamId)

      if (error instanceof Error && error.name === 'AbortError') {
        logger.streamStats({
          streamId,
          totalChunks: chunkCount,
          status: 'cancelled'
        })
        webContents.send('stream-chunk', streamId, null, true)
        return { ok: false, status: 499 } // 499 Client Closed Request
      }

      logger.error('流式 API 请求失败', error)
      logger.streamStats({
        streamId,
        totalChunks: chunkCount,
        status: 'error'
      })

      const errorMessage = error instanceof Error ? error.message : String(error)
      webContents.send('stream-error', streamId, errorMessage)
      throw error
    }
  }
}

export const apiProxy = new ApiProxy()
