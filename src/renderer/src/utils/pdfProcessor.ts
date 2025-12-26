import * as pdfjsLib from 'pdfjs-dist'

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()

export interface PdfProcessingOptions {
  maxPages?: number
  maxPixels?: number
  outputFormat?: 'jpeg' | 'png'
  quality?: number
}

export interface PdfProcessingResult {
  images: string[]
  totalPages: number
  processedPages: number
  fileName: string // 添加文件名字段
}

/**
 * 处理PDF文件，转换为图片序列
 * @param file PDF文件
 * @param options 处理选项
 * @returns 处理结果
 */
export async function processPdfToImages(file: File, options: PdfProcessingOptions = {}): Promise<PdfProcessingResult> {
  const {
    maxPages = 60, // 默认最大60页
    maxPixels = 400000, // 默认400k像素
    outputFormat = 'jpeg',
    quality = 0.8
  } = options

  try {
    // 读取PDF文件
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const totalPages = pdf.numPages
    const pagesToProcess = Math.min(totalPages, maxPages)

    console.log(`PDF有${totalPages}页，将处理前${pagesToProcess}页`)

    const images: string[] = []

    // 先获取所有页面的原始尺寸来计算总token
    const pageViewports: Array<{ width: number; height: number }> = []
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.0 })
      pageViewports.push({ width: viewport.width, height: viewport.height })
      page.cleanup()
    }

    // 计算所有页面的总像素数（按28x28像素=1token计算）
    let totalTokens = 0
    for (const viewport of pageViewports) {
      const area = viewport.width * viewport.height
      totalTokens += area / (28 * 28)
    }

    // 如果总token不超过24k，则不需要缩放
    let localMaxPixels: number
    if (totalTokens <= 24000) {
      localMaxPixels = 33177600 // 8k resolution (约3840x2160的4倍)
    } else {
      // 否则计算每页的最大像素数，确保总token约为24k
      localMaxPixels = Math.min(maxPixels, Math.floor((24000 * 28 * 28) / pagesToProcess))
    }

    console.log(`总估算token: ${Math.ceil(totalTokens)}, 每页最大像素: ${localMaxPixels}`)

    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.0 })

        // 按比例缩放图片，使宽*高 <= localMaxPixels
        const currentPixels = viewport.width * viewport.height
        let scale = 1.0

        if (currentPixels > localMaxPixels) {
          scale = Math.sqrt(localMaxPixels / currentPixels)
          // 确保缩放后的尺寸至少为1像素
          scale = Math.max(scale, 1 / Math.max(viewport.width, viewport.height))
        }

        const scaledViewport = page.getViewport({ scale })

        // 创建canvas
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        if (!context) {
          throw new Error('无法获取canvas上下文')
        }

        canvas.width = Math.floor(scaledViewport.width)
        canvas.height = Math.floor(scaledViewport.height)

        // 渲染页面
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas
        }

        await page.render(renderContext).promise

        // 转换为图片
        const imageDataUrl = canvas.toDataURL(`image/${outputFormat}`, quality)
        images.push(imageDataUrl)

        console.log(`处理完成第${pageNum}页，尺寸: ${canvas.width}x${canvas.height}`)

        // 清理页面对象
        page.cleanup()
      } catch (error) {
        console.error(`处理第${pageNum}页时出错:`, error)
        // 继续处理下一页
      }
    }

    // 清理PDF对象
    pdf.cleanup()

    return {
      images,
      totalPages,
      processedPages: images.length,
      fileName: file.name // 添加文件名
    }
  } catch (error) {
    console.error('PDF处理失败:', error)
    throw new Error(`PDF处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 验证PDF文件
 * @param file 文件对象
 * @returns 是否为有效的PDF文件
 */
export function validatePdfFile(file: File): boolean {
  // 检查文件类型
  if (file.type !== 'application/pdf') {
    return false
  }

  // 检查文件扩展名
  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith('.pdf')) {
    return false
  }

  return true
}

/**
 * 估算处理后的图片token数量
 * @param images 图片数组
 * @returns 估算的token数量
 */
export function estimateImageTokens(images: string[]): number {
  // 粗略估算：每个图片按其实际像素数除以(28*28)来计算token
  let totalTokens = 0

  for (const image of images) {
    // 从base64数据估算图片大小（这是一个粗略的估算）
    const base64Length = image.split(',')[1]?.length || 0
    const estimatedBytes = (base64Length * 3) / 4

    // 假设是JPEG压缩，粗略估算像素数
    const estimatedPixels = estimatedBytes * 2 // 很粗略的估算
    totalTokens += estimatedPixels / (28 * 28)
  }

  return Math.ceil(totalTokens)
}
