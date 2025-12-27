/**
 * Word 文档处理器 - 将 Word 文件转换为图片序列
 * 使用 mammoth.js 将 docx 转换为 HTML，然后渲染为图片
 */

import mammoth from 'mammoth'

export interface WordProcessingResult {
  images: string[]
  fileName: string
  totalPages: number
}

/**
 * 验证 Word 文件
 * @param file 文件对象
 * @returns 是否为有效的 Word 文件
 */
export function validateWordFile(file: File): boolean {
  const validTypes = [
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ]

  const validExtensions = ['.doc', '.docx']
  const fileName = file.name.toLowerCase()

  return validTypes.includes(file.type) && validExtensions.some(ext => fileName.endsWith(ext))
}

/**
 * 处理 Word 文件，转换为图片序列
 * @param file Word 文件
 * @returns Promise<WordProcessingResult>
 */
export async function processWordToImages(file: File): Promise<WordProcessingResult> {
  console.log('开始处理 Word 文件:', file.name, 'type:', file.type, 'size:', file.size)

  // 检查文件类型
  const validTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

  if (!validTypes.includes(file.type)) {
    console.error('不支持的文件类型:', file.type)
    throw new Error('不支持的 Word 文件格式')
  }

  // 检查文件大小（30MB限制）
  const maxSize = 30 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('Word 文件过大，请选择小于30MB的文件')
  }

  try {
    console.log('读取文件为 ArrayBuffer...')
    // 将文件转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    console.log('ArrayBuffer 大小:', arrayBuffer.byteLength)

    console.log('使用 mammoth 转换为 HTML...')
    // 使用 mammoth 将 docx 转换为 HTML
    const result = await mammoth.convertToHtml({ arrayBuffer })
    const htmlContent = result.value
    console.log('HTML 内容长度:', htmlContent.length)
    console.log('HTML 内容预览:', htmlContent.substring(0, 200))

    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('Word 文件内容为空')
    }

    console.log('开始将 HTML 转换为图片...')
    // 将 HTML 内容分页并转换为图片
    const images = await convertHtmlToImages(htmlContent)
    console.log('生成了', images.length, '张图片')

    if (images.length === 0) {
      throw new Error('无法从 Word 文件中提取内容')
    }

    return {
      images,
      fileName: file.name,
      totalPages: images.length
    }
  } catch (error) {
    console.error('Word 处理失败:', error)

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Word 处理失败：未知错误')
  }
}

/**
 * 将 HTML 内容转换为图片序列
 * @param htmlContent HTML 内容
 * @returns Promise<string[]>
 */
async function convertHtmlToImages(htmlContent: string): Promise<string[]> {
  const images: string[] = []

  // 创建临时容器来渲染 HTML
  const container = document.createElement('div')
  container.innerHTML = htmlContent
  container.style.cssText = `
    width: 800px;
    padding: 40px;
    font-family: Arial, 'Microsoft YaHei', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #000;
    background: #fff;
    position: absolute;
    left: -9999px;
    top: 0;
  `

  // 添加样式
  const style = document.createElement('style')
  style.textContent = `
    h1 { font-size: 24px; font-weight: bold; margin: 20px 0 10px; }
    h2 { font-size: 20px; font-weight: bold; margin: 18px 0 9px; }
    h3 { font-size: 18px; font-weight: bold; margin: 16px 0 8px; }
    h4 { font-size: 16px; font-weight: bold; margin: 14px 0 7px; }
    p { margin: 10px 0; }
    ul, ol { margin: 10px 0; padding-left: 30px; }
    li { margin: 5px 0; }
    table { border-collapse: collapse; margin: 10px 0; }
    td, th { border: 1px solid #ddd; padding: 8px; }
    img { max-width: 100%; height: auto; }
  `
  container.appendChild(style)

  document.body.appendChild(container)

  try {
    // 分页处理：每个页面最大高度
    const pageHeight = 1100 // A4 纸张高度（像素）
    const pageWidth = 800

    // 获取所有子元素
    const elements = Array.from(container.children).filter(el => el !== style)

    let currentPageElements: HTMLElement[] = []
    let currentHeight = 0

    for (const element of elements) {
      const el = element as HTMLElement
      const elementHeight = el.offsetHeight

      // 如果当前元素加上已有高度超过页面高度，则创建新页面
      if (currentHeight + elementHeight > pageHeight && currentPageElements.length > 0) {
        // 渲染当前页面
        const pageImage = await renderPageToImage(currentPageElements, pageWidth, currentHeight)
        if (pageImage) {
          images.push(pageImage)
        }

        // 重置当前页面
        currentPageElements = [el]
        currentHeight = elementHeight
      } else {
        currentPageElements.push(el)
        currentHeight += elementHeight
      }
    }

    // 渲染最后一页
    if (currentPageElements.length > 0) {
      const pageImage = await renderPageToImage(currentPageElements, pageWidth, currentHeight)
      if (pageImage) {
        images.push(pageImage)
      }
    }

    // 如果没有生成任何页面，至少生成一个包含所有内容的页面
    if (images.length === 0) {
      const fullImage = await renderFullContentToImage(container, pageWidth)
      if (fullImage) {
        images.push(fullImage)
      }
    }
  } finally {
    // 清理临时容器
    document.body.removeChild(container)
  }

  return images
}

/**
 * 将页面元素渲染为图片
 * @param elements 页面元素数组
 * @param width 页面宽度
 * @param height 页面高度
 * @returns Promise<string | null>
 */
async function renderPageToImage(elements: HTMLElement[], width: number, height: number): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('无法获取 canvas 上下文')
    }

    // 设置 canvas 尺寸
    canvas.width = width
    canvas.height = Math.min(height + 80, 1200) // 添加一些边距

    // 设置背景色
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 渲染每个元素
    let currentY = 40
    for (const element of elements) {
      await renderElementToCanvas(ctx, element, 40, currentY, width - 80)
      currentY += element.offsetHeight
    }

    return canvas.toDataURL('image/jpeg', 0.85)
  } catch (error) {
    console.error('渲染页面失败:', error)
    return null
  }
}

/**
 * 将完整内容渲染为单个图片
 * @param container 容器元素
 * @param width 宽度
 * @returns Promise<string | null>
 */
async function renderFullContentToImage(container: HTMLElement, width: number): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('无法获取 canvas 上下文')
    }

    const height = Math.min(container.offsetHeight + 80, 3000) // 最大高度限制

    canvas.width = width
    canvas.height = height

    // 设置背景色
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 渲染内容
    const elements = Array.from(container.children).filter(el => el.tagName !== 'STYLE') as HTMLElement[]
    let currentY = 40

    for (const element of elements) {
      await renderElementToCanvas(ctx, element, 40, currentY, width - 80)
      currentY += element.offsetHeight
    }

    return canvas.toDataURL('image/jpeg', 0.85)
  } catch (error) {
    console.error('渲染完整内容失败:', error)
    return null
  }
}

/**
 * 将 HTML 元素渲染到 canvas
 * @param ctx canvas 上下文
 * @param element HTML 元素
 * @param x X 坐标
 * @param y Y 坐标
 * @param maxWidth 最大宽度
 */
async function renderElementToCanvas(ctx: CanvasRenderingContext2D, element: HTMLElement, x: number, y: number, maxWidth: number): Promise<void> {
  const tagName = element.tagName.toLowerCase()
  const text = element.textContent || ''

  // 设置字体样式
  let fontSize = 14
  let fontWeight = 'normal'
  const lineHeight = 1.6

  if (tagName === 'h1') {
    fontSize = 24
    fontWeight = 'bold'
  } else if (tagName === 'h2') {
    fontSize = 20
    fontWeight = 'bold'
  } else if (tagName === 'h3') {
    fontSize = 18
    fontWeight = 'bold'
  } else if (tagName === 'h4') {
    fontSize = 16
    fontWeight = 'bold'
  }

  ctx.font = `${fontWeight} ${fontSize}px Arial, 'Microsoft YaHei', sans-serif`
  ctx.fillStyle = '#000000'
  ctx.textBaseline = 'top'

  // 文本换行处理
  const lines = wrapText(ctx, text, maxWidth)
  const lineHeightPx = fontSize * lineHeight

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeightPx)
  }
}

/**
 * 文本换行处理
 * @param ctx canvas 上下文
 * @param text 文本内容
 * @param maxWidth 最大宽度
 * @returns 换行后的文本数组
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }

    let currentLine = ''
    const words = paragraph.split('')

    for (const char of words) {
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines
}
