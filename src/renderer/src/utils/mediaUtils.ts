/**
 * 媒体处理相关工具
 */

export interface MediaData {
  image?: string
  video?: string
  videoBase64?: string
  pdfImages?: string[]
  pdfName?: string
  pptImages?: string[]
  pptName?: string
  pptTotalPages?: number
}

export interface MediaSetters {
  setImage: (data: string | null) => void
  setVideo: (data: string | null) => void
  setVideoBase64: (data: string | null) => void
  setPdfImages: (data: string[] | null) => void
  setPdfName: (name: string | null) => void
  setPptImages: (data: string[] | null) => void
  setPptName: (name: string | null) => void
  setPptTotalPages: (totalPages: number | null) => void
}

/**
 * 文件大小限制
 */
export const FILE_SIZE_LIMITS = {
  general: 50 * 1024 * 1024, // 50MB
  image: 10 * 1024 * 1024, // 10MB
  video: 20 * 1024 * 1024, // 20MB
  pdf: 30 * 1024 * 1024, // 30MB
  ppt: 30 * 1024 * 1024 // 30MB
} as const

/**
 * 检查文件大小是否超限
 */
export function checkFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > FILE_SIZE_LIMITS.general) {
    return {
      valid: false,
      error: '文件大小超过限制（50MB），请选择更小的文件'
    }
  }

  if (file.type.startsWith('image/') && file.size > FILE_SIZE_LIMITS.image) {
    return {
      valid: false,
      error: '图片文件大小超过限制（10MB），请选择更小的图片'
    }
  }

  if (file.type.startsWith('video/') && file.size > FILE_SIZE_LIMITS.video) {
    return {
      valid: false,
      error: '视频文件大小超过限制（20MB），请选择更小的视频或进行压缩'
    }
  }

  if (file.type === 'application/pdf' && file.size > FILE_SIZE_LIMITS.pdf) {
    return {
      valid: false,
      error: 'PDF文件大小超过限制（30MB），请选择更小的文件'
    }
  }

  if ((file.type === 'application/vnd.ms-powerpoint' || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') && file.size > FILE_SIZE_LIMITS.ppt) {
    return {
      valid: false,
      error: 'PPT文件大小超过限制（30MB），请选择更小的文件'
    }
  }

  return { valid: true }
}

/**
 * 清除除指定类型外的所有媒体
 */
export function clearOtherMedia(keepType: 'image' | 'video' | 'pdf' | 'ppt', setters: MediaSetters): void {
  if (keepType !== 'image') {
    setters.setImage(null)
  }
  if (keepType !== 'video') {
    setters.setVideo(null)
    setters.setVideoBase64(null)
  }
  if (keepType !== 'pdf') {
    setters.setPdfImages(null)
    setters.setPdfName(null)
  }
  if (keepType !== 'ppt') {
    setters.setPptImages(null)
    setters.setPptName(null)
    setters.setPptTotalPages(null)
  }
}

/**
 * 生成用户消息的描述文本
 */
export function generateMessageDescription(messageContent: string, mediaData: MediaData): string {
  if (messageContent.trim()) {
    return messageContent
  }

  if (mediaData.video) return '发送了一个视频'
  if (mediaData.image) return '发送了一张图片'
  if (mediaData.pdfImages?.length) {
    const pdfName = mediaData.pdfName || 'document.pdf'
    return `发送了PDF: ${pdfName} (${mediaData.pdfImages.length}页)`
  }
  if (mediaData.pptImages?.length) {
    const pptName = mediaData.pptName || 'presentation.ppt'
    const totalPages = mediaData.pptTotalPages || mediaData.pptImages.length
    return `发送了PPT: ${pptName} (${totalPages}页)`
  }

  return ''
}
