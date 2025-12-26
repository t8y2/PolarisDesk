/**
 * PPT处理器 - 将PPT文件转换为图片序列
 * 基于PDF处理逻辑，但适配PPT文件格式
 */

import { parse } from 'pptxtojson'

/**
 * PPT幻灯片数据接口
 */
interface SlideData {
  fill?: unknown
  elements?: unknown[]
  layoutElements?: unknown[]
  note?: string
  title?: string
  content?: unknown
  shapes?: unknown[]
  images?: unknown[]
  [key: string]: unknown
}

/**
 * PPT解析结果接口
 */
interface PptParseResult {
  slides: SlideData[]
  [key: string]: unknown
}

export interface PptProcessingResult {
  images: string[]
  fileName: string
  totalPages: number
}

/**
 * 验证PPT文件
 * @param file 文件对象
 * @returns 是否为有效的PPT文件
 */
export function validatePptFile(file: File): boolean {
  const validTypes = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']

  const validExtensions = ['.ppt', '.pptx']
  const fileName = file.name.toLowerCase()

  return validTypes.includes(file.type) && validExtensions.some(ext => fileName.endsWith(ext))
}

/**
 * 处理PPT文件，转换为图片序列
 * @param file PPT文件
 * @returns Promise<PptProcessingResult>
 */
export async function processPptToImages(file: File): Promise<PptProcessingResult> {
  // 检查文件类型
  const validTypes = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']

  if (!validTypes.includes(file.type)) {
    throw new Error('不支持的PPT文件格式')
  }

  // 检查文件大小（30MB限制）
  const maxSize = 30 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('PPT文件过大，请选择小于30MB的文件')
  }

  try {
    // 将文件转换为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // 使用pptxtojson解析PPT文件
    const pptData = (await parse(arrayBuffer)) as unknown as PptParseResult

    if (!pptData || !pptData.slides || !Array.isArray(pptData.slides)) {
      throw new Error('PPT文件解析失败：无效的文件结构')
    }

    // 将每张幻灯片转换为图片
    const images: string[] = []
    const slides = pptData.slides

    for (let i = 0; i < slides.length; i++) {
      try {
        const slideImage = await convertSlideToImage(slides[i], i + 1)
        if (slideImage) {
          images.push(slideImage)
        }
      } catch (error) {
        console.warn(`处理第${i + 1}张幻灯片时出错:`, error)
        // 继续处理下一张幻灯片
      }
    }

    if (images.length === 0) {
      throw new Error('无法从PPT文件中提取任何图片')
    }

    // 应用智能压缩
    const compressedImages = compressPptImages(images)

    return {
      images: compressedImages,
      fileName: file.name,
      totalPages: slides.length
    }
  } catch (error) {
    console.error('PPT处理失败:', error)

    if (error instanceof Error) {
      throw error
    }

    throw new Error('PPT处理失败：未知错误')
  }
}

/**
 * 将幻灯片数据转换为图片
 * @param slide 幻灯片数据
 * @param slideNumber 幻灯片编号
 * @returns Promise<string | null>
 */
async function convertSlideToImage(slide: SlideData, slideNumber: number): Promise<string | null> {
  try {
    // 创建一个canvas来渲染幻灯片
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('无法获取canvas上下文')
    }

    // 设置canvas大小（16:9比例，适合PPT）
    const width = 1280
    const height = 720
    canvas.width = width
    canvas.height = height

    // 设置背景色为白色
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // 渲染幻灯片内容
    await renderSlideContent(ctx, slide, width, height)

    // 转换为图片
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch (error) {
    console.error(`转换第${slideNumber}张幻灯片失败:`, error)
    return null
  }
}

/**
 * 渲染幻灯片内容到canvas
 * @param ctx canvas上下文
 * @param slide 幻灯片数据
 * @param width canvas宽度
 * @param height canvas高度
 */
async function renderSlideContent(ctx: CanvasRenderingContext2D, slide: SlideData, width: number, height: number): Promise<void> {
  // 设置基本字体
  ctx.font = '24px Arial, sans-serif'
  ctx.fillStyle = '#000000'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  let currentY = 50 // 起始Y位置
  const leftMargin = 50
  const rightMargin = width - 50
  const lineHeight = 40

  let hasContent = false // 标记是否有内容

  try {
    // 渲染标题
    if (slide.title) {
      ctx.font = 'bold 36px Arial, sans-serif'
      ctx.fillStyle = '#000000'
      const titleText = typeof slide.title === 'string' ? slide.title : JSON.stringify(slide.title)
      const wrappedTitle = wrapText(ctx, titleText, rightMargin - leftMargin)

      for (const line of wrappedTitle) {
        ctx.fillText(line, leftMargin, currentY)
        currentY += lineHeight + 10
      }
      currentY += 20 // 标题后额外间距
      hasContent = true
    }

    // 渲染内容 - 检查多种可能的字段
    const contentSources = [slide.elements, slide.layoutElements, slide.content, slide.shapes, slide.text, slide.body]

    for (const contentSource of contentSources) {
      if (contentSource && Array.isArray(contentSource) && contentSource.length > 0) {
        ctx.font = '24px Arial, sans-serif'
        ctx.fillStyle = '#333333'

        for (const item of contentSource) {
          if (typeof item === 'string') {
            const wrappedContent = wrapText(ctx, item, rightMargin - leftMargin)
            for (const line of wrappedContent) {
              ctx.fillText(line, leftMargin, currentY)
              currentY += lineHeight
            }
            hasContent = true
          } else if (item && typeof item === 'object') {
            // 处理对象类型的内容 - 检查更多可能的文本字段
            let text = item.text || item.rawText || item.textBody

            // 如果没有找到直接的文本字段，检查content字段
            if (!text && item.content) {
              if (typeof item.content === 'string') {
                // 如果content是HTML，提取纯文本
                text = extractTextFromHtml(item.content)
              } else {
                text = String(item.content)
              }
            }

            // 最后尝试其他字段
            if (!text) {
              text = item.value || item.data
            }

            if (text && typeof text === 'string' && text.trim()) {
              const wrappedContent = wrapText(ctx, text, rightMargin - leftMargin)
              for (const line of wrappedContent) {
                ctx.fillText(line, leftMargin, currentY)
                currentY += lineHeight
              }
              hasContent = true
            } else if (item.children && Array.isArray(item.children)) {
              // 递归处理嵌套的子元素
              for (const child of item.children) {
                let childText = child.text || child.content || child.value
                if (childText && typeof childText === 'string') {
                  // 如果是HTML内容，提取纯文本
                  if (childText.includes('<') && childText.includes('>')) {
                    childText = extractTextFromHtml(childText)
                  }
                  if (childText.trim()) {
                    const wrappedContent = wrapText(ctx, childText, rightMargin - leftMargin)
                    for (const line of wrappedContent) {
                      ctx.fillText(line, leftMargin, currentY)
                      currentY += lineHeight
                    }
                    hasContent = true
                  }
                }
              }
            }
          }
          currentY += 10 // 项目间距
        }
        break // 找到内容后就不再查找其他字段
      }
    }

    // 检查备注字段
    if (!hasContent && slide.note && typeof slide.note === 'string') {
      ctx.font = '20px Arial, sans-serif'
      ctx.fillStyle = '#666666'
      ctx.fillText('备注:', leftMargin, currentY)
      currentY += lineHeight

      const wrappedNote = wrapText(ctx, slide.note, rightMargin - leftMargin)
      for (const line of wrappedNote) {
        ctx.fillText(line, leftMargin, currentY)
        currentY += lineHeight
      }
      hasContent = true
    }

    // 如果没有找到任何内容，显示幻灯片名称或索引
    if (!hasContent) {
      ctx.font = '20px Arial, sans-serif'
      ctx.fillStyle = '#666666'
      ctx.fillText('空白幻灯片', leftMargin, currentY)
      hasContent = true
    }

    // 如果幻灯片有图片，尝试渲染（这部分比较复杂，暂时简化处理）
    if (slide.images && Array.isArray(slide.images)) {
      // 在右下角显示图片数量提示
      ctx.font = '16px Arial, sans-serif'
      ctx.fillStyle = '#666666'
      ctx.textAlign = 'right'
      ctx.fillText(`包含 ${slide.images.length} 张图片`, rightMargin, height - 30)
      ctx.textAlign = 'left' // 恢复对齐方式
    }
  } catch (error) {
    console.warn('渲染幻灯片内容时出错:', error)
    // 如果渲染失败，至少显示一个错误消息
    ctx.font = '24px Arial, sans-serif'
    ctx.fillStyle = '#ff0000'
    ctx.fillText('幻灯片内容解析失败', leftMargin, currentY)
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.fillText(`错误: ${errorMessage}`, leftMargin, currentY + lineHeight)
  }
}

/**
 * 从HTML内容中提取纯文本
 * @param htmlContent HTML内容
 * @returns 纯文本内容
 */
function extractTextFromHtml(htmlContent: string): string {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return ''
  }

  try {
    // 创建一个临时的DOM元素来解析HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent

    // 获取纯文本内容
    const textContent = tempDiv.textContent || tempDiv.innerText || ''

    // 清理多余的空白字符
    return textContent.replace(/\s+/g, ' ').trim()
  } catch (error) {
    console.warn('HTML解析失败:', error)
    // 如果HTML解析失败，尝试简单的正则表达式清理
    return htmlContent
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
}

/**
 * 文本换行处理
 * @param ctx canvas上下文
 * @param text 文本内容
 * @param maxWidth 最大宽度
 * @returns 换行后的文本数组
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : [text]
}

/**
 * 智能压缩PPT图片序列
 * 类似PDF的压缩逻辑，控制在合理的token范围内
 * @param images 原始图片数组
 * @param maxImages 最大images数量
 * @returns 压缩后的图片数组
 */
export function compressPptImages(images: string[], maxImages: number = 40): string[] {
  if (images.length === 0) return []
  if (images.length <= maxImages) {
    return images
  }

  // 智能选择关键页面
  const compressed: string[] = []
  const totalPages = images.length

  // 总是包含第一页和最后一页
  compressed.push(images[0])
  if (totalPages > 1) {
    compressed.push(images[totalPages - 1])
  }

  // 如果还有空间，等间隔选择中间的页面
  const remainingSlots = maxImages - compressed.length
  if (remainingSlots > 0 && totalPages > 2) {
    const middlePages = images.slice(1, -1)
    const step = Math.max(1, Math.floor(middlePages.length / remainingSlots))

    for (let i = 0; i < middlePages.length && compressed.length < maxImages; i += step) {
      compressed.push(middlePages[i])
    }
  }
  // 按原始顺序排序
  const sortedCompressed = compressed.sort((a, b) => {
    return images.indexOf(a) - images.indexOf(b)
  })

  console.log(`PPT智能压缩: ${images.length}页 -> ${sortedCompressed.length}页`)
  return sortedCompressed
}
