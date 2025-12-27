import type { ModelRequest } from '../types'
import { logger } from './logger'

// 定义设置接口
interface APISettings {
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'moonshot' | 'openrouter' | 'siliconcloud' | 'ollama' | 'zhipu' | 'custom'
  apiUrl: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  topP: number
  systemPrompt: string
}

export class ModelAPI {
  // 根据服务商构建请求体
  private buildRequestBody(request: ModelRequest, settings: APISettings): Record<string, unknown> {
    const baseRequest: Record<string, unknown> = {
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens
    }

    switch (settings.provider) {
      case 'anthropic':
        // Anthropic 使用不同的格式
        return {
          model: settings.model,
          max_tokens: settings.maxTokens,
          temperature: settings.temperature,
          top_p: settings.topP,
          messages: request.messages,
          stream: true
        }

      case 'google':
        // Google Gemini 使用不同的格式
        return {
          contents: this.convertToGeminiFormat(request.messages),
          generationConfig: {
            temperature: settings.temperature,
            topP: settings.topP,
            maxOutputTokens: settings.maxTokens
          }
        }

      case 'ollama':
        // Ollama 使用不同的格式
        return {
          model: settings.model,
          messages: request.messages,
          stream: true,
          options: {
            temperature: settings.temperature,
            top_p: settings.topP,
            num_predict: settings.maxTokens
          }
        }

      default:
        // OpenAI 兼容格式 (openai, deepseek, moonshot, openrouter, siliconcloud, zhipu, custom)
        return {
          ...baseRequest,
          messages: request.messages,
          stream: true,
          top_p: settings.topP
        }
    }
  }

  // 转换消息格式为 Gemini 格式
  private convertToGeminiFormat(messages: ModelRequest['messages']): unknown[] {
    return messages.map(msg => {
      const content = Array.isArray(msg.content) ? msg.content : [{ type: 'text' as const, text: String(msg.content) }]

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: content.map(c => {
          if (c.type === 'text') {
            return { text: c.text }
          } else if (c.type === 'image_url' && c.image_url) {
            return {
              inlineData: {
                mimeType: 'image/jpeg',
                data: c.image_url.url
              }
            }
          }
          return { text: '' }
        })
      }
    })
  }

  // 根据服务商构建请求头
  private buildHeaders(settings: APISettings): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    switch (settings.provider) {
      case 'anthropic':
        headers['x-api-key'] = settings.apiKey
        headers['anthropic-version'] = '2023-06-01'
        break

      case 'google':
        // Google 使用 URL 参数传递 API key
        break

      case 'ollama':
        // Ollama 本地运行，不需要 API key
        break

      default:
        // 其他服务商使用 Bearer token
        if (settings.apiKey) {
          headers['Authorization'] = `Bearer ${settings.apiKey}`
        }
        break
    }

    // OpenRouter 需要额外的头
    if (settings.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://github.com/your-app'
      headers['X-Title'] = 'PolarisDesk'
    }

    return headers
  }

  // 根据服务商构建 API URL
  private buildApiUrl(settings: APISettings): string {
    let url = settings.apiUrl

    // Google Gemini 需要替换模型名称到 URL 中
    if (settings.provider === 'google') {
      url = url.replace('{model}', settings.model)
      // 添加 API key 作为查询参数
      url += `?key=${settings.apiKey}`
    }

    return url
  }

  // 解析流式响应
  private parseStreamChunk(provider: string, data: string, onChunk: (chunk: string, type?: 'reasoning' | 'content') => void): void {
    try {
      const parsed = JSON.parse(data)

      switch (provider) {
        case 'anthropic': {
          // Anthropic 的流式格式
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            onChunk(parsed.delta.text, 'content')
          }
          break
        }

        case 'google': {
          // Google Gemini 的流式格式
          if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
            onChunk(parsed.candidates[0].content.parts[0].text, 'content')
          }
          break
        }

        case 'ollama': {
          // Ollama 的流式格式
          if (parsed.message?.content) {
            onChunk(parsed.message.content, 'content')
          }
          break
        }

        default: {
          // OpenAI 兼容格式
          const delta = parsed.choices?.[0]?.delta
          if (delta) {
            const content = delta.content || ''
            const reasoningContent = delta.reasoning_content || ''

            if (reasoningContent) {
              onChunk(reasoningContent, 'reasoning')
            }
            if (content) {
              onChunk(content, 'content')
            }
          }
          break
        }
      }
    } catch (parseError) {
      logger.debug('解析 SSE 数据失败', { data, error: parseError })
    }
  }

  // 流式调用方法，支持实时响应回调
  async callModelStream(request: ModelRequest, settings: APISettings, onChunk: (chunk: string, type?: 'reasoning' | 'content') => void, signal?: AbortSignal): Promise<string> {
    try {
      // 构建请求配置
      const requestWithConfig = this.buildRequestBody(request, settings)
      const headers = this.buildHeaders(settings)
      const apiUrl = this.buildApiUrl(settings)

      // 输出完整的 API 请求信息用于调试
      console.log('========== API 请求详情 ==========')
      console.log('Provider:', settings.provider)
      console.log('Model:', settings.model)
      console.log('API URL:', apiUrl)
      console.log('请求体:', JSON.stringify(requestWithConfig, null, 2))
      console.log('消息数量:', request.messages.length)
      request.messages.forEach((msg, index) => {
        console.log(`消息 ${index} (${msg.role}):`)
        if (Array.isArray(msg.content)) {
          msg.content.forEach((item, itemIndex) => {
            if (item.type === 'text') {
              console.log(`  - 文本内容 ${itemIndex}:`, item.text?.substring(0, 100))
            } else if (item.type === 'image_url') {
              console.log(`  - 图片 ${itemIndex}:`, item.image_url?.url?.substring(0, 50) + '...')
            } else if (item.type === 'video_url') {
              console.log(`  - 视频 ${itemIndex}:`, item.video_url?.url?.substring(0, 50) + '...')
            }
          })
        } else {
          console.log('  - 内容:', msg.content)
        }
      })
      console.log('===================================')

      // 使用新的日志系统
      logger.apiRequest({
        provider: settings.provider,
        model: settings.model,
        url: apiUrl,
        method: 'POST',
        hasApiKey: !!settings.apiKey
      })

      // 检查是否有主进程代理可用
      if (window.api?.apiStreamRequest) {
        // 使用主进程的流式代理
        logger.stream('使用主进程代理发送流式请求')

        const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const fullContent = ''
        let buffer = ''
        const startTime = Date.now()
        let chunkCount = 0
        let reasoningChars = 0
        let contentChars = 0

        return new Promise<string>((resolve, reject) => {
          let streamChunkWrapper: ((event: Electron.IpcRendererEvent, ...args: unknown[]) => void) | null = null
          let streamErrorWrapper: ((event: Electron.IpcRendererEvent, ...args: unknown[]) => void) | null = null

          // 设置流数据处理器
          const handleStreamChunk = (id: string, chunk: string | null, isDone: boolean): void => {
            if (id !== streamId) return

            if (isDone) {
              // 流式响应结束
              const duration = Date.now() - startTime

              logger.streamStats({
                provider: settings.provider,
                model: settings.model,
                totalChunks: chunkCount,
                totalChars: fullContent.length,
                duration,
                reasoningChars,
                contentChars
              })

              if (streamChunkWrapper && window.api?.offStreamChunk) {
                window.api.offStreamChunk(streamChunkWrapper)
              }
              if (streamErrorWrapper && window.api?.offStreamError) {
                window.api.offStreamError(streamErrorWrapper)
              }

              // 处理缓冲区中剩余的不完整数据
              if (buffer.trim()) {
                logger.warn('流式响应结束时缓冲区有未完成数据', { buffer })
              }

              resolve(fullContent)
              return
            }

            if (chunk) {
              // 将新数据添加到缓冲区
              buffer += chunk

              // 按行处理数据
              const lines = buffer.split('\n')

              // 保留最后一行（可能不完整）
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim()

                  // 流式结束标志
                  if (data === '[DONE]' || !data) {
                    continue
                  }

                  chunkCount++

                  // 使用统一的解析方法，并统计字符数
                  this.parseStreamChunk(settings.provider, data, (chunk: string, type?: 'reasoning' | 'content') => {
                    if (type === 'reasoning') {
                      reasoningChars += chunk.length
                    } else {
                      contentChars += chunk.length
                    }
                    onChunk(chunk, type)
                  })
                }
              }
            }
          }

          // 设置错误处理器
          const handleStreamError = (id: string, error: string): void => {
            if (id !== streamId) return

            logger.error('流式请求失败', error)

            if (streamChunkWrapper && window.api?.offStreamChunk) {
              window.api.offStreamChunk(streamChunkWrapper)
            }
            if (streamErrorWrapper && window.api?.offStreamError) {
              window.api.offStreamError(streamErrorWrapper)
            }
            reject(new Error(error))
          }

          // 注册事件监听器并获取包装器
          if (window.api?.onStreamChunk) {
            streamChunkWrapper = window.api.onStreamChunk(handleStreamChunk)
          }
          if (window.api?.onStreamError) {
            streamErrorWrapper = window.api.onStreamError(handleStreamError)
          }

          // 发起流式API请求
          if (window.api?.apiStreamRequest) {
            window.api
              .apiStreamRequest(
                apiUrl,
                {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(requestWithConfig)
                },
                streamId
              )
              .catch(error => {
                logger.error('发起流式请求失败', error)
                if (streamChunkWrapper && window.api?.offStreamChunk) {
                  window.api.offStreamChunk(streamChunkWrapper)
                }
                if (streamErrorWrapper && window.api?.offStreamError) {
                  window.api.offStreamError(streamErrorWrapper)
                }
                reject(error)
              })
          } else {
            reject(new Error('流式API不可用'))
          }

          // 处理取消信号
          if (signal) {
            signal.addEventListener('abort', (): void => {
              logger.warn('用户取消了流式请求', { streamId })
              // 通知主进程取消流式请求
              if (window.api?.apiStreamCancel) {
                window.api.apiStreamCancel(streamId).catch((error: Error) => {
                  logger.error('取消流式请求失败', error)
                })
              }
              if (streamChunkWrapper && window.api?.offStreamChunk) {
                window.api.offStreamChunk(streamChunkWrapper)
              }
              if (streamErrorWrapper && window.api?.offStreamError) {
                window.api.offStreamError(streamErrorWrapper)
              }
              reject(new DOMException('Aborted', 'AbortError'))
            })
          }
        })
      } else {
        logger.warn('主进程代理不可用，降级使用浏览器 fetch')
        // 使用浏览器fetch，处理SSE流
        const startTime = Date.now()
        let chunkCount = 0
        let reasoningChars = 0
        let contentChars = 0

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestWithConfig),
          signal
        })

        if (!response.ok) {
          // 尝试读取错误响应
          let errorDetail = ''
          try {
            const errorText = await response.text()
            errorDetail = errorText
            logger.error('API 请求失败', {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            })
          } catch {
            logger.error('API 请求失败', {
              status: response.status,
              statusText: response.statusText
            })
          }
          throw new Error(`HTTP error! status: ${response.status}, detail: ${errorDetail}`)
        }

        if (!response.body) {
          throw new Error('Response body is null')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        const fullContent = ''
        let buffer = '' // 用于处理不完整的 chunk

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              const duration = Date.now() - startTime

              logger.streamStats({
                provider: settings.provider,
                model: settings.model,
                totalChunks: chunkCount,
                totalChars: fullContent.length,
                duration,
                reasoningChars,
                contentChars
              })

              break
            }

            // 将新数据添加到缓冲区
            buffer += decoder.decode(value, { stream: true })

            // 按行处理数据
            const lines = buffer.split('\n')

            // 保留最后一行（可能不完整）
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()

                // 流式结束标志
                if (data === '[DONE]' || !data) {
                  continue
                }

                chunkCount++

                // 使用统一的解析方法，并统计字符数
                this.parseStreamChunk(settings.provider, data, (chunk: string, type?: 'reasoning' | 'content') => {
                  if (type === 'reasoning') {
                    reasoningChars += chunk.length
                  } else {
                    contentChars += chunk.length
                  }
                  onChunk(chunk, type)
                })
              }
            }
          }

          // 处理缓冲区中剩余的不完整数据
          if (buffer.trim()) {
            logger.warn('流式响应结束时缓冲区有未完成数据', { buffer })
          }
        } finally {
          reader.releaseLock()
        }

        return fullContent
      }
    } catch (error) {
      logger.error('流式模型调用失败', error)
      throw error
    }
  }

  async analyzeImage(imageBase64: string, prompt: string, settings: APISettings, onChunk: (chunk: string, type?: 'reasoning' | 'content') => void, signal?: AbortSignal): Promise<string> {
    const messages: Array<{
      role: 'user' | 'system'
      content: Array<{
        type: 'text' | 'image_url'
        text?: string
        image_url?: { url: string }
      }>
    }> = []

    // 添加系统提示词（如果有的话）
    if (settings.systemPrompt.trim()) {
      messages.push({
        role: 'system',
        content: [{ type: 'text', text: settings.systemPrompt }]
      })
    }

    // 添加用户消息
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'image_url',
          image_url: {
            url: imageBase64
          }
        }
      ]
    })

    const request: ModelRequest = {
      messages
    }

    return await this.callModelStream(request, settings, onChunk, signal)
  }

  async analyzeImages(images: string[], prompt: string, settings: APISettings, onChunk: (chunk: string, type?: 'reasoning' | 'content') => void, signal?: AbortSignal): Promise<string> {
    const content: Array<{
      type: 'text' | 'image_url'
      text?: string
      image_url?: { url: string }
    }> = [
      {
        type: 'text',
        text: prompt
      }
    ]

    // 添加所有图片
    images.forEach(image => {
      content.push({
        type: 'image_url',
        image_url: {
          url: image
        }
      })
    })

    const messages: Array<{
      role: 'user' | 'system'
      content: Array<{
        type: 'text' | 'image_url'
        text?: string
        image_url?: { url: string }
      }>
    }> = []

    // 添加系统提示词（如果有的话）
    if (settings.systemPrompt.trim()) {
      messages.push({
        role: 'system',
        content: [{ type: 'text', text: settings.systemPrompt }]
      })
    }

    // 添加用户消息
    messages.push({
      role: 'user',
      content
    })

    const request: ModelRequest = {
      messages
    }

    return await this.callModelStream(request, settings, onChunk, signal)
  }

  async analyzeVideo(videoBase64: string, prompt: string, settings: APISettings, onChunk: (chunk: string, type?: 'reasoning' | 'content') => void, signal?: AbortSignal): Promise<string> {
    const messages: Array<{
      role: 'user' | 'system'
      content: Array<{
        type: 'text' | 'video_url'
        text?: string
        video_url?: { url: string }
      }>
    }> = []

    // 添加系统提示词（如果有的话）
    if (settings.systemPrompt.trim()) {
      messages.push({
        role: 'system',
        content: [{ type: 'text', text: settings.systemPrompt }]
      })
    }

    // 添加用户消息
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'video_url',
          video_url: {
            url: videoBase64
          }
        }
      ]
    })

    const request: ModelRequest = {
      messages
    }

    return await this.callModelStream(request, settings, onChunk, signal)
  }

  async analyzeText(text: string, settings: APISettings, onChunk: (chunk: string, type?: 'reasoning' | 'content') => void, signal?: AbortSignal): Promise<string> {
    const request: ModelRequest = {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: text
            }
          ]
        }
      ]
    }

    return await this.callModelStream(request, settings, onChunk, signal)
  }

  async chatCompletion(message: string, settings: APISettings, onChunk: (chunk: string, type?: 'reasoning' | 'content') => void, signal?: AbortSignal): Promise<string> {
    const request: ModelRequest = {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: message
            }
          ]
        }
      ]
    }

    return await this.callModelStream(request, settings, onChunk, signal)
  }

  // 带历史上下文的对话完成
  async chatCompletionWithHistory(messages: Array<{ role: 'user' | 'assistant'; content: string; image?: string; video?: string; pdfImages?: string[]; pptImages?: string[]; wordImages?: string[] }>, settings: APISettings, onChunk: (chunk: string, type?: 'reasoning' | 'content') => void, signal?: AbortSignal): Promise<string> {
    console.log('chatCompletionWithHistory 被调用，消息数量:', messages.length)
    messages.forEach((msg, index) => {
      console.log(`消息 ${index}:`, {
        role: msg.role,
        hasContent: !!msg.content,
        hasImage: !!msg.image,
        hasVideo: !!msg.video,
        pdfImagesCount: msg.pdfImages?.length || 0,
        pptImagesCount: msg.pptImages?.length || 0,
        wordImagesCount: msg.wordImages?.length || 0
      })
    })

    // 构建符合API格式的消息数组
    const apiMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: Array<{ type: 'text' | 'image_url' | 'video_url'; text?: string; image_url?: { url: string }; video_url?: { url: string } }> }> = []

    if (settings.systemPrompt.trim()) {
      apiMessages.push({
        role: 'system',
        content: [{ type: 'text', text: settings.systemPrompt }]
      })
    }

    // 添加历史消息
    apiMessages.push(
      ...messages.map(msg => {
        const content: Array<{ type: 'text' | 'image_url' | 'video_url'; text?: string; image_url?: { url: string }; video_url?: { url: string } }> = []

        if (msg.content) {
          content.push({
            type: 'text',
            text: msg.content
          })
        }

        if (msg.image) {
          content.push({
            type: 'image_url',
            image_url: { url: msg.image }
          })
        }

        if (msg.video) {
          content.push({
            type: 'video_url',
            video_url: { url: msg.video }
          })
        }

        if (msg.pdfImages && msg.pdfImages.length > 0) {
          console.log('添加 PDF 图片:', msg.pdfImages.length, '张')
          msg.pdfImages.forEach(image => {
            content.push({
              type: 'image_url',
              image_url: { url: image }
            })
          })
        }

        if (msg.pptImages && msg.pptImages.length > 0) {
          console.log('添加 PPT 图片:', msg.pptImages.length, '张')
          msg.pptImages.forEach(image => {
            content.push({
              type: 'image_url',
              image_url: { url: image }
            })
          })
        }

        if (msg.wordImages && msg.wordImages.length > 0) {
          console.log('添加 Word 图片:', msg.wordImages.length, '张')
          msg.wordImages.forEach(image => {
            content.push({
              type: 'image_url',
              image_url: { url: image }
            })
          })
        }

        console.log('消息内容项数量:', content.length)
        return {
          role: msg.role,
          content
        }
      })
    )

    console.log('最终 API 消息数量:', apiMessages.length)
    apiMessages.forEach((msg, index) => {
      console.log(`API 消息 ${index}:`, {
        role: msg.role,
        contentItems: msg.content.length,
        types: msg.content.map(c => c.type)
      })
    })

    const request: ModelRequest = {
      messages: apiMessages
    }

    return await this.callModelStream(request, settings, onChunk, signal)
  }
}

export const modelAPI = new ModelAPI()
