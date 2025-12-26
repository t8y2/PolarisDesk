/**
 * 截图功能组合函数
 */

export function useScreenshot(): {
  handleAreaScreenshot: (setImage: (data: string | null) => void) => Promise<void>
  handleQuickScreenshot: (setImage: (data: string | null) => void) => Promise<void>
} {
  // 区域截图处理
  const handleAreaScreenshot = async (setImage: (data: string | null) => void): Promise<void> => {
    try {
      if (window.api?.captureScreenArea) {
        const result = await window.api.captureScreenArea()
        if (result && result.fullImage && result.area) {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()

          img.onload = () => {
            canvas.width = result.area.width
            canvas.height = result.area.height
            ctx?.drawImage(img, result.area.x, result.area.y, result.area.width, result.area.height, 0, 0, result.area.width, result.area.height)
            setImage(canvas.toDataURL())
          }

          img.src = result.fullImage
        }
      }
    } catch (error) {
      console.error('区域截图失败:', error)
      throw error
    }
  }

  // 全屏截图处理
  const handleQuickScreenshot = async (setImage: (data: string | null) => void): Promise<void> => {
    try {
      // 检查是否在Electron环境中
      if (window.api && 'quickScreenshot' in window.api) {
        // 使用快速截图API
        const imageDataUrl = await (window.api as { quickScreenshot: () => Promise<string> }).quickScreenshot()
        setImage(imageDataUrl)
      } else if (window.api && 'captureScreen' in window.api) {
        // 使用原有的截图API
        const imageDataUrl = await (window.api as { captureScreen: () => Promise<string> }).captureScreen()
        setImage(imageDataUrl)
      } else {
        // 回退到浏览器API
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })

        const video = document.createElement('video')
        video.srcObject = stream

        await new Promise<void>(resolve => {
          video.onloadedmetadata = () => {
            video.play()
            resolve()
          }
        })

        await new Promise(resolve => setTimeout(resolve, 100))

        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          setImage(canvas.toDataURL('image/png'))
          stream.getTracks().forEach(track => track.stop())
        }
      }
    } catch (error) {
      console.error('截图失败:', error)
      throw error
    }
  }

  return {
    handleAreaScreenshot,
    handleQuickScreenshot
  }
}
