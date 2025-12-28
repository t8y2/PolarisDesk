import { logger } from './logger'

/**
 * AI 识别结果
 */
export interface IntentDetectionResult {
  depth: number // 推荐的遍历深度
  targetApp?: string // 目标应用名称（如果能识别出来）
  strategy: 'structure' | 'interaction' | 'content' | 'focused' | 'default' // 策略类型
  confidence: number // 置信度 0-1
}

/**
 * 使用 AI 精准识别用户意图
 * @param userMessage 用户消息
 * @param apiSettings API 配置
 * @param activeWindows 当前活动窗口列表
 * @returns 识别结果
 */
export async function detectIntentByAI(
  userMessage: string,
  apiSettings: {
    provider: string
    apiUrl: string
    apiKey: string
    model: string
  },
  activeWindows: Array<{ app: string; title: string }>
): Promise<IntentDetectionResult> {
  try {
    const windowsList = activeWindows.map(w => `- ${w.app}: ${w.title}`).join('\n')

    // 调试：打印发送给 AI 的信息
    logger.info('🔍 发送给 AI 的信息:', {
      userMessage,
      windowsCount: activeWindows.length,
      windowsList
    })

    const prompt = `分析用户问题，返回JSON格式结果。

窗口列表：
${windowsList}

用户问题：${userMessage}

直接返回JSON，不要解释：{"depth":数字,"targetApp":"应用名或null","strategy":"类型","confidence":数字}

规则：
- depth: 内容查询=8，交互=5，结构=3，默认=6
- targetApp: 用户提到的应用名（支持部分匹配），从窗口列表找完整名称，找不到返回null
- strategy: content/interaction/structure/focused/default
- confidence: 0-1

例子：
问："clash有什么" 窗口有"Clash Verge" 
答：{"depth":8,"targetApp":"Clash Verge","strategy":"content","confidence":0.9}

现在分析并只返回JSON：`

    const requestBody = buildRequestBody(prompt, apiSettings)
    const headers = buildHeaders(apiSettings)

    // Google API 需要在 URL 中添加 API key
    let apiUrl = apiSettings.apiUrl
    if (apiSettings.provider === 'google') {
      apiUrl = apiUrl.replace('{model}', apiSettings.model)
      apiUrl += `?key=${apiSettings.apiKey}`
    }

    // 使用主进程的 API 代理来避免 CORS 问题
    const response = await window.api.apiRequest(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const resultText = extractTextFromResponse(response.data as Record<string, unknown>, apiSettings.provider)

    // 调试：打印 AI 返回的原始文本
    logger.info('🔍 AI 返回的原始文本:', resultText)

    // 如果 AI 返回空或无效，直接使用正则降级
    if (!resultText || resultText.trim() === '{}' || resultText.trim() === '') {
      logger.warn('⚠️ AI 返回空结果，直接使用正则降级')
      return detectIntentByRegex(userMessage, activeWindows)
    }

    // 解析 JSON 结果
    const result = parseIntentResult(resultText)

    logger.info('✨ AI 精准识别成功:', result)
    return result
  } catch (error) {
    logger.warn('AI 精准识别失败，使用降级方案', error)
    return detectIntentByRegex(userMessage, activeWindows)
  }
}

/**
 * 解析 AI 返回的 JSON 结果
 */
function parseIntentResult(text: string): IntentDetectionResult {
  try {
    const cleanText = text
      .replace(/<\|begin_of_box\|>/g, '')
      .replace(/<\|end_of_box\|>/g, '')
      .trim()

    // 尝试提取 JSON（可能包含在 markdown 代码块中）
    const jsonMatch = cleanText.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      logger.warn('未找到 JSON，原始文本:', text)
      throw new Error('No JSON found in response')
    }

    let jsonStr = jsonMatch[0]

    // 如果 JSON 不完整，尝试修复（补全缺失的引号和括号）
    if (!jsonStr.endsWith('}')) {
      // 检查是否缺少结束引号
      const lastQuote = jsonStr.lastIndexOf('"')
      const lastColon = jsonStr.lastIndexOf(':')
      if (lastColon > lastQuote) {
        // 缺少值的结束引号，添加默认值
        jsonStr += '","confidence":0.5}'
      } else {
        // 只是缺少结束括号
        jsonStr += '}'
      }
      logger.info('🔧 修复不完整的 JSON:', jsonStr)
    }

    const parsed = JSON.parse(jsonStr)
    logger.info('📊 解析后的 JSON:', parsed)

    // 处理 targetApp：可能是 null、"null"、undefined 或实际的应用名
    let targetApp: string | undefined
    if (parsed.targetApp && parsed.targetApp !== 'null' && parsed.targetApp !== 'undefined') {
      targetApp = String(parsed.targetApp).trim()
    }

    const result = {
      depth: Math.max(3, Math.min(8, parseInt(parsed.depth) || 6)),
      targetApp,
      strategy: parsed.strategy || 'default',
      confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.5))
    }

    logger.info('✅ 最终解析结果:', result)
    return result
  } catch (error) {
    logger.warn('解析 AI 结果失败，使用默认值', error)
    return {
      depth: 6,
      strategy: 'default',
      confidence: 0.3
    }
  }
}

/**
 * 正则匹配方式检测意图（降级方案）
 */
export function detectIntentByRegex(userMessage: string, activeWindows: Array<{ app: string; title: string }>): IntentDetectionResult {
  const msg = userMessage.toLowerCase()

  // 提取用户消息中的关键词（去除常见的连接词和疑问词）
  const keywords = msg
    .replace(/[，。！？、；：""''（）《》【】]/g, ' ') // 替换中文标点为空格
    .replace(/里有/g, ' ') // 处理"里有"这种组合
    .replace(/有什么/g, ' ') // 处理"有什么"
    .replace(/是什么/g, ' ') // 处理"是什么"
    .replace(/里面/g, ' ') // 处理"里面"
    .split(/\s+/) // 按空格分割
    .filter(word => word.length > 1 && !['的', '里', '面', '中', '在', '有', '是', '了', '吗', '呢', '啊', '什么', '哪些', '怎么', '如何', '告诉', '我'].includes(word))

  logger.info('🔍 正则匹配 - 提取的关键词:', keywords)

  // 尝试识别目标应用（更智能的匹配）
  let targetApp: string | undefined
  let matchReason = ''

  for (const window of activeWindows) {
    const appLower = window.app.toLowerCase()
    const titleLower = window.title.toLowerCase()

    // 完全匹配：用户消息包含完整的应用名
    if (msg.includes(appLower)) {
      targetApp = window.app
      matchReason = `完全匹配: "${msg}" 包含 "${appLower}"`
      break
    }

    // 部分匹配：检查应用名是否包含用户提到的关键词
    for (const keyword of keywords) {
      // 关键词长度至少2个字符，避免误匹配
      if (keyword.length >= 2) {
        if (appLower.includes(keyword)) {
          targetApp = window.app
          matchReason = `部分匹配: 应用名 "${appLower}" 包含关键词 "${keyword}"`
          break
        }
        // 反向匹配：关键词包含应用名（如 "clashverge" 包含 "clash"）
        if (keyword.includes(appLower) && appLower.length >= 3) {
          targetApp = window.app
          matchReason = `反向匹配: 关键词 "${keyword}" 包含应用名 "${appLower}"`
          break
        }
      }
    }

    if (targetApp) break

    // 标题匹配（优先级最低）
    if (titleLower && msg.includes(titleLower)) {
      targetApp = window.app
      matchReason = `标题匹配: "${msg}" 包含 "${titleLower}"`
      break
    }
  }

  if (targetApp) {
    logger.success(`🎯 正则匹配成功: ${targetApp} (${matchReason})`)
  } else {
    logger.info('ℹ️ 正则匹配未找到目标应用')
  }

  // 结构查询
  if (/布局|结构|界面|窗口|有哪些|组成/.test(msg)) {
    return { depth: 3, targetApp, strategy: 'structure', confidence: 0.7 }
  }
  // 交互查询
  else if (/点击|按钮|输入|操作|怎么|如何|执行/.test(msg)) {
    return { depth: 5, targetApp, strategy: 'interaction', confidence: 0.7 }
  }
  // 内容查询
  else if (/内容|文字|文本|显示|写着|说|读|里面/.test(msg)) {
    return { depth: 8, targetApp, strategy: 'content', confidence: 0.7 }
  }
  // 焦点查询
  else if (/当前|正在|现在|这个|这里/.test(msg)) {
    return { depth: 5, targetApp, strategy: 'focused', confidence: 0.7 }
  }

  // 默认
  return { depth: 6, targetApp, strategy: 'default', confidence: 0.5 }
}

/**
 * 构建请求体
 */
function buildRequestBody(prompt: string, apiSettings: { provider: string; model: string }): Record<string, unknown> {
  const messages = [{ role: 'user', content: prompt }]

  switch (apiSettings.provider) {
    case 'anthropic':
      return {
        model: apiSettings.model,
        max_tokens: 150, // 增加到 150，给 AI 足够空间
        temperature: 0,
        messages,
        stream: false // 明确禁用流式输出
      }

    case 'google':
      return {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 150, // 增加到 150
          responseMimeType: 'application/json'
        }
      }

    default: {
      const body: Record<string, unknown> = {
        model: apiSettings.model,
        messages,
        max_tokens: 150, // 增加到 150
        temperature: 0,
        stream: false // 明确禁用流式输出
      }

      // 尝试启用 JSON 模式（如果模型支持）
      if (apiSettings.model.includes('gpt-4') || apiSettings.model.includes('gpt-3.5')) {
        body.response_format = { type: 'json_object' }
      }

      return body
    }
  }
}

/**
 * 构建请求头
 */
function buildHeaders(apiSettings: { provider: string; apiKey: string }): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  switch (apiSettings.provider) {
    case 'anthropic':
      headers['x-api-key'] = apiSettings.apiKey
      headers['anthropic-version'] = '2023-06-01'
      break

    case 'google':
      // Google 使用 URL 参数传递 API key
      break

    default:
      headers['Authorization'] = `Bearer ${apiSettings.apiKey}`
  }

  return headers
}

/**
 * 从响应中提取文本
 */
function extractTextFromResponse(data: Record<string, unknown>, provider: string): string {
  try {
    // 调试：打印完整的 API 响应
    logger.info('🔍 API 完整响应:', JSON.stringify(data, null, 2))

    let result = ''
    switch (provider) {
      case 'anthropic':
        result = (data.content as Array<{ text?: string }>)?.[0]?.text?.trim() || '{}'
        break

      case 'google':
        result = (data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>)?.[0]?.content?.parts?.[0]?.text?.trim() || '{}'
        break

      default: {
        const choices = data.choices as Array<{ message?: { content?: string; reasoning_content?: string } }>
        const message = choices?.[0]?.message

        if (message) {
          result = message.content?.trim() || message.reasoning_content?.trim() || '{}'
        } else {
          result = '{}'
        }
        break
      }
    }

    logger.info('🔍 提取的文本内容:', result)
    return result
  } catch (error) {
    logger.error('❌ 提取响应文本失败:', error)
    return '{}'
  }
}

/**
 * 正则匹配方式检测深度（备用方案，已废弃，使用 detectIntentByRegex 代替）
 */
export function detectUITreeDepthByRegex(userMessage: string): number {
  return detectIntentByRegex(userMessage, []).depth
}
