/**
 * 文件处理相关的组合函数
 */
import { useMessage } from 'naive-ui'
import { processPdfToImages, validatePdfFile, type PdfProcessingResult } from '../utils/pdfProcessor'
import { processPptToImages, validatePptFile, type PptProcessingResult } from '../utils/pptProcessor'
import { processWordToImages, validateWordFile, type WordProcessingResult } from '../utils/wordProcessor'
import { checkFileSize, clearOtherMedia, type MediaSetters } from '../utils/mediaUtils'

export function useFileProcessing(): {
  processFile: (
    file: File,
    setImage: (data: string | null) => void,
    setVideo: (data: string | null) => void,
    setVideoBase64: (data: string | null) => void,
    setPdfImages: (data: string[] | null) => void,
    setPdfName: (name: string | null) => void,
    setPptImages: (data: string[] | null) => void,
    setPptName: (name: string | null) => void,
    setPptTotalPages: (totalPages: number | null) => void,
    setWordImages?: (data: string[] | null) => void,
    setWordName?: (name: string | null) => void,
    setWordTotalPages?: (totalPages: number | null) => void
  ) => Promise<void>
  handlePaste: (event: ClipboardEvent, processFileCallback: (file: File) => void | Promise<void>) => Promise<void>
} {
  const message = useMessage()

  const processFile = async (
    file: File,
    setImage: (data: string | null) => void,
    setVideo: (data: string | null) => void,
    setVideoBase64: (data: string | null) => void,
    setPdfImages: (data: string[] | null) => void,
    setPdfName: (name: string | null) => void,
    setPptImages: (data: string[] | null) => void,
    setPptName: (name: string | null) => void,
    setPptTotalPages: (totalPages: number | null) => void,
    setWordImages?: (data: string[] | null) => void,
    setWordName?: (name: string | null) => void,
    setWordTotalPages?: (totalPages: number | null) => void
  ): Promise<void> => {
    console.log('processFile 被调用，文件信息:', {
      name: file.name,
      type: file.type,
      size: file.size,
      hasWordCallbacks: !!(setWordImages && setWordName && setWordTotalPages)
    })

    // 创建setters对象
    const setters: MediaSetters = {
      setImage,
      setVideo,
      setVideoBase64,
      setPdfImages,
      setPdfName,
      setPptImages,
      setPptName,
      setPptTotalPages,
      setWordImages,
      setWordName,
      setWordTotalPages
    }
    // 检查文件大小
    const sizeCheck = checkFileSize(file)
    if (!sizeCheck.valid) {
      message.error(sizeCheck.error!)
      return
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => {
        clearOtherMedia('image', setters)
        setters.setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('video/')) {
      const reader = new FileReader()
      reader.onload = e => {
        const result = e.target?.result as string
        clearOtherMedia('video', setters)
        setters.setVideo(result)
        setters.setVideoBase64(result)
      }
      reader.readAsDataURL(file)
    } else if (file.type === 'application/pdf') {
      if (!validatePdfFile(file)) {
        message.error('无效的PDF文件')
        return
      }

      try {
        const result: PdfProcessingResult = await processPdfToImages(file, {
          maxPages: 60, // 最大60页
          maxPixels: 400000, // 每页最大400k像素
          outputFormat: 'jpeg',
          quality: 0.8
        })

        if (result.images.length === 0) {
          message.error('PDF处理失败：无法提取页面')
          return
        }

        clearOtherMedia('pdf', setters)
        setters.setPdfImages(result.images)
        setters.setPdfName(result.fileName)

        if (result.processedPages < result.totalPages) {
          message.warning(`PDF处理完成：共${result.totalPages}页，仅处理前${result.processedPages}页`)
        } else {
          message.success(`PDF处理完成：共${result.totalPages}页，已处理${result.processedPages}页`)
        }
      } catch (error) {
        console.error('PDF处理失败:', error)
        message.error(`PDF处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    } else if (file.type === 'application/vnd.ms-powerpoint' || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      if (!validatePptFile(file)) {
        message.error('无效的PPT文件')
        return
      }

      try {
        const result: PptProcessingResult = await processPptToImages(file)

        if (result.images.length === 0) {
          message.error('PPT处理失败：无法提取页面')
          return
        }

        clearOtherMedia('ppt', setters)
        setters.setPptImages(result.images)
        setters.setPptName(result.fileName)
        setters.setPptTotalPages(result.totalPages)

        message.success(`PPT处理完成：共${result.totalPages}页`)
      } catch (error) {
        console.error('PPT处理失败:', error)
        message.error(`PPT处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    } else if (
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      if (!validateWordFile(file)) {
        message.error('无效的 Word 文件')
        return
      }

      try {
        const result: WordProcessingResult = await processWordToImages(file)

        if (result.images.length === 0) {
          message.error('Word 处理失败：无法提取内容')
          return
        }

        clearOtherMedia('word', setters)
        if (setWordImages) setWordImages(result.images)
        if (setWordName) setWordName(result.fileName)
        if (setWordTotalPages) setWordTotalPages(result.totalPages)

        message.success(`Word 处理完成：共${result.totalPages}页`)
      } catch (error) {
        console.error('Word 处理失败:', error)
        message.error(`Word 处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    } else {
      message.error('不支持的文件类型，请选择图片、视频、PDF、PPT 或 Word 文件')
    }
  }

  const handlePaste = async (event: ClipboardEvent, processFileCallback: (file: File) => void | Promise<void>): Promise<void> => {
    const clipboardData = event.clipboardData
    if (!clipboardData) return

    const files = Array.from(clipboardData.files)
    if (files.length > 0) {
      event.preventDefault()
      const file = files[0]
      await processFileCallback(file)
    }
  }

  return {
    processFile,
    handlePaste
  }
}
