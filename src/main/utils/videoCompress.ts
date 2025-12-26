import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import ffmpeg from 'fluent-ffmpeg'
import { exec } from 'child_process'
import { promisify } from 'util'
import { app } from 'electron'

const execAsync = promisify(exec)

// 尝试引入静态 FFmpeg
let staticFFmpegPath: string | null = null

async function initializeFFmpeg(): Promise<void> {
  console.log('开始初始化静态 FFmpeg...')
  try {
    const ffmpegStatic = await import('ffmpeg-static-electron')
    console.log('成功导入 ffmpeg-static-electron 模块:', ffmpegStatic)

    let candidatePath: string | null = null

    if (ffmpegStatic.default && typeof ffmpegStatic.default === 'object' && ffmpegStatic.default.path) {
      // 处理对象格式：{ path: '/path/to/ffmpeg' }
      candidatePath = ffmpegStatic.default.path
      console.log('获取到静态 FFmpeg 路径（对象格式）:', candidatePath)
    } else if (ffmpegStatic.default && typeof ffmpegStatic.default === 'string') {
      // 处理字符串格式
      candidatePath = ffmpegStatic.default
      console.log('获取到静态 FFmpeg 路径（字符串格式）:', candidatePath)
    } else if (ffmpegStatic.path) {
      // 处理直接导出 path 的情况
      candidatePath = ffmpegStatic.path
      console.log('获取到静态 FFmpeg 路径（直接导出）:', candidatePath)
    }

    if (candidatePath) {
      const resolvedPath = await resolveFFmpegPath(candidatePath)
      console.log('解析后的 FFmpeg 路径:', resolvedPath)

      // 检查文件是否存在并且是可执行的
      if (fs.existsSync(resolvedPath)) {
        // 确保文件有执行权限
        try {
          fs.chmodSync(resolvedPath, 0o755)
          console.log('已设置 FFmpeg 执行权限')
        } catch (chmodError) {
          console.warn('设置执行权限失败:', chmodError)
        }

        staticFFmpegPath = resolvedPath
        ffmpeg.setFfmpegPath(resolvedPath)
        console.log('已设置静态 FFmpeg 路径:', staticFFmpegPath)
      } else {
        console.warn('静态 FFmpeg 文件不存在:', resolvedPath)
        staticFFmpegPath = null
      }
    } else {
      console.warn('ffmpeg-static-electron 模块未返回有效路径:', ffmpegStatic)
    }
  } catch (error) {
    console.warn('无法加载静态 FFmpeg:', error instanceof Error ? error.message : '未知错误')
  }
}

// 路径解析函数，处理生产环境的路径调整
async function resolveFFmpegPath(originalPath: string): Promise<string> {
  // 在开发环境下直接使用原路径
  if (!app.isPackaged) {
    return originalPath
  }

  // 在生产环境下，需要处理 asar 打包的路径
  const resourcesPath = process.resourcesPath

  // 如果路径包含 node_modules，需要重新定位到解包的位置
  if (originalPath.includes('node_modules')) {
    // 提取相对于 node_modules 的部分
    const nodeModulesIndex = originalPath.indexOf('node_modules')
    const relativePath = originalPath.substring(nodeModulesIndex)

    // 在生产环境下，解包的 node_modules 会在 app.asar.unpacked 目录下
    const unpackedPath = path.join(resourcesPath, 'app.asar.unpacked', relativePath)

    if (fs.existsSync(unpackedPath)) {
      return unpackedPath
    }

    // 备选路径：直接在 resources 目录下
    const altPath = path.join(resourcesPath, relativePath)
    if (fs.existsSync(altPath)) {
      return altPath
    }
  }

  // 如果都不行，返回原路径
  return originalPath
}

// 初始化 FFmpeg（在需要时调用）

// 检查 FFmpeg 是否可用
let ffmpegAvailable: boolean | null = null

export async function checkFFmpegAvailability(): Promise<boolean> {
  if (ffmpegAvailable !== null) {
    return ffmpegAvailable
  }

  // 等待 FFmpeg 初始化完成
  await initializeFFmpeg()

  try {
    if (staticFFmpegPath) {
      // 如果有静态 FFmpeg，直接检查文件是否存在
      if (fs.existsSync(staticFFmpegPath)) {
        ffmpegAvailable = true
        console.log('静态 FFmpeg 可用，视频压缩功能已启用')
        return ffmpegAvailable
      }
    }

    // 尝试系统 FFmpeg
    await execAsync('ffmpeg -version')
    ffmpegAvailable = true
    console.log('系统 FFmpeg 可用，视频压缩功能已启用')
  } catch (error) {
    ffmpegAvailable = false
    console.warn('FFmpeg 不可用，将跳过视频压缩:', error instanceof Error ? error.message : '未知错误')
  }

  return ffmpegAvailable
}

export interface VideoCompressOptions {
  // 输出质量 (0-51, 越小质量越好，推荐25-32用于平衡质量和文件大小)
  crf?: number
  // 最大宽度 (推荐720p-1080p，过高分辨率会显著增加base64大小)
  maxWidth?: number
  // 最大高度 (推荐720p-1080p，过高分辨率会显著增加base64大小)
  maxHeight?: number
  // 目标文件大小（字节）- 谨慎使用，可能影响清晰度
  targetSize?: number
  // 是否保持原始帧率 (false可显著减少文件大小)
  keepOriginalFramerate?: boolean
  // 输出格式
  outputFormat?: 'mp4' | 'webm'
}

export interface VideoCompressResult {
  success: boolean
  compressedBuffer?: Buffer
  originalSize: number
  compressedSize?: number
  compressionRatio?: number
  error?: string
}

/**
 * 主要压缩方法
 */
async function compressVideoMain(
  inputPath: string,
  outputPath: string,
  options: {
    crf: number
    maxWidth?: number
    maxHeight?: number
    targetSize?: number
    keepOriginalFramerate: boolean
  }
): Promise<Buffer> {
  const { crf, maxWidth, maxHeight, targetSize, keepOriginalFramerate } = options

  return new Promise<Buffer>((resolve, reject) => {
    // 创建基础 FFmpeg 命令，使用更简单的设置
    let command = ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('64k') // 降低音频比特率
      .outputOptions([
        `-crf ${crf}`,
        `-preset fast`, // 使用快速预设，减少出错概率
        `-movflags +faststart`,
        `-pix_fmt yuv420p`,
        `-profile:v baseline`, // 使用更兼容的基线配置
        `-level 3.1` // 降低级别，提高兼容性
      ])

    // 设置视频分辨率 - 使用更简单的方法
    if (maxWidth && maxHeight) {
      // 直接使用 size() 方法，更稳定
      command = command.size(`${maxWidth}x${maxHeight}`)
    }

    // 设置帧率
    if (!keepOriginalFramerate) {
      command = command.fps(15) // 降低帧率到 15fps
    }

    // 如果设置了目标大小，计算目标比特率
    if (targetSize) {
      // 粗略估算：假设视频时长为 10 秒
      const estimatedDuration = 10
      const targetBitrate = Math.floor((targetSize * 8) / estimatedDuration / 1000) // kbps
      command = command.videoBitrate(Math.max(targetBitrate, 200)) // 最低 200k
    }

    command
      .on('start', commandLine => {
        console.log('FFmpeg 命令:', commandLine)
      })
      .on('progress', progress => {
        if (progress.percent) {
          console.log(`压缩进度: ${Math.round(progress.percent)}%`)
        }
      })
      .on('stderr', stderrLine => {
        console.log('FFmpeg stderr:', stderrLine)
      })
      .on('end', async () => {
        try {
          // 检查输出文件是否存在且有内容
          if (!fs.existsSync(outputPath)) {
            reject(new Error('输出文件不存在'))
            return
          }

          const stats = await fs.promises.stat(outputPath)
          if (stats.size === 0) {
            reject(new Error('输出文件为空'))
            return
          }

          const compressedBuffer = await fs.promises.readFile(outputPath)
          resolve(compressedBuffer)
        } catch (error) {
          reject(error)
        }
      })
      .on('error', (error, stdout, stderr) => {
        console.error('FFmpeg error:', error)
        console.error('FFmpeg stdout:', stdout)
        console.error('FFmpeg stderr:', stderr)
        reject(error)
      })
      .save(outputPath)
  })
}

/**
 * 备用压缩方法 - 使用更简单的设置
 */
async function compressVideoFallback(
  inputPath: string,
  outputPath: string,
  options: {
    crf: number
    maxWidth?: number
    maxHeight?: number
    keepOriginalFramerate: boolean
  }
): Promise<Buffer> {
  const { crf, maxWidth, maxHeight, keepOriginalFramerate } = options

  return new Promise<Buffer>((resolve, reject) => {
    // 使用最简单的设置，最大化兼容性
    let command = ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        `-crf ${Math.min(crf + 5, 35)}`, // 稍微降低质量
        `-preset ultrafast`, // 使用最快预设
        `-pix_fmt yuv420p`,
        `-profile:v baseline`, // 最兼容的配置
        `-level 3.0`
      ])

    // 简化的分辨率设置
    if (maxWidth && maxHeight) {
      command = command.size(`${maxWidth}x${maxHeight}`)
    }

    // 设置帧率
    if (!keepOriginalFramerate) {
      command = command.fps(10) // 更低的帧率
    }

    command
      .on('start', commandLine => {
        console.log('备用 FFmpeg 命令:', commandLine)
      })
      .on('progress', progress => {
        if (progress.percent) {
          console.log(`备用压缩进度: ${Math.round(progress.percent)}%`)
        }
      })
      .on('end', async () => {
        try {
          const compressedBuffer = await fs.promises.readFile(outputPath)
          resolve(compressedBuffer)
        } catch (error) {
          reject(error)
        }
      })
      .on('error', (error, stdout, stderr) => {
        console.error('备用 FFmpeg error:', error)
        console.error('备用 FFmpeg stdout:', stdout)
        console.error('备用 FFmpeg stderr:', stderr)
        reject(error)
      })
      .save(outputPath)
  })
}

/**
 * 超简单压缩方法 - 最小配置，最大兼容性
 */
async function compressVideoMinimal(
  inputPath: string,
  outputPath: string,
  options: {
    crf: number
    maxWidth?: number
    maxHeight?: number
  }
): Promise<Buffer> {
  const { crf, maxWidth, maxHeight } = options

  return new Promise<Buffer>((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .videoCodec('libx264')
      .outputOptions([
        `-crf ${Math.min(crf + 10, 40)}`, // 进一步降低质量
        `-preset ultrafast`,
        `-pix_fmt yuv420p`
      ])

    // 最简单的尺寸设置
    if (maxWidth && maxHeight) {
      command = command.size(`${Math.min(maxWidth, 640)}x${Math.min(maxHeight, 480)}`)
    }

    command
      .on('start', commandLine => {
        console.log('超简单 FFmpeg 命令:', commandLine)
      })
      .on('end', async () => {
        try {
          const compressedBuffer = await fs.promises.readFile(outputPath)
          resolve(compressedBuffer)
        } catch (error) {
          reject(error)
        }
      })
      .on('error', error => {
        console.error('超简单 FFmpeg error:', error)
        reject(error)
      })
      .save(outputPath)
  })
}

/**
 * 压缩视频文件
 * @param inputBuffer 输入视频的 Buffer
 * @param options 压缩选项
 * @returns 压缩结果
 */
export async function compressVideo(inputBuffer: Buffer, options: VideoCompressOptions = {}): Promise<VideoCompressResult> {
  const originalSize = inputBuffer.length

  // 首先检查 FFmpeg 是否可用
  const isFFmpegAvailable = await checkFFmpegAvailability()
  if (!isFFmpegAvailable) {
    console.log('FFmpeg 不可用，跳过视频压缩，返回原始数据')
    return {
      success: true,
      compressedBuffer: inputBuffer,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      error: 'FFmpeg not available, compression skipped'
    }
  }

  const {
    crf = 25, // 适中的质量，更好的压缩比
    maxWidth = 1280, // 降低默认分辨率以减少文件大小
    maxHeight = 720, // 720p 对于 AI 分析仍然足够清晰
    targetSize,
    keepOriginalFramerate = false, // 默认降低帧率以减少大小
    outputFormat = 'mp4'
  } = options

  console.log(`开始压缩视频，原始大小: ${(originalSize / 1024 / 1024).toFixed(2)}MB`)

  // 创建临时文件路径
  const tempDir = os.tmpdir()
  const inputPath = path.join(tempDir, `recording_input_${Date.now()}.mov`)
  const outputPath = path.join(tempDir, `recording_output_${Date.now()}.${outputFormat}`)

  try {
    // 将 Buffer 写入临时文件
    await fs.promises.writeFile(inputPath, inputBuffer)

    // 验证输入文件是否有效
    const stats = await fs.promises.stat(inputPath)
    if (stats.size === 0) {
      throw new Error('输入文件为空')
    }

    console.log(`临时输入文件创建成功: ${inputPath}, 大小: ${stats.size} 字节`)

    // 首先尝试主要压缩方法
    try {
      const compressedBuffer = await compressVideoMain(inputPath, outputPath, {
        crf,
        maxWidth,
        maxHeight,
        targetSize,
        keepOriginalFramerate
      })

      const compressedSize = compressedBuffer.length
      const compressionRatio = originalSize / compressedSize

      console.log(`压缩完成:`)
      console.log(`  原始大小: ${(originalSize / 1024 / 1024).toFixed(2)}MB`)
      console.log(`  压缩大小: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`)
      console.log(`  压缩比例: ${compressionRatio.toFixed(2)}:1`)
      console.log(`  大小减少: ${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`)

      return {
        success: true,
        compressedBuffer,
        originalSize,
        compressedSize,
        compressionRatio
      }
    } catch (mainError) {
      console.warn('主要压缩方法失败，尝试备用方法:', mainError)

      // 清理输出文件
      if (fs.existsSync(outputPath)) {
        await fs.promises.unlink(outputPath)
      }

      try {
        // 尝试备用压缩方法
        const compressedBuffer = await compressVideoFallback(inputPath, outputPath, {
          crf,
          maxWidth,
          maxHeight,
          keepOriginalFramerate
        })

        const compressedSize = compressedBuffer.length
        const compressionRatio = originalSize / compressedSize

        console.log(`备用方法压缩完成:`)
        console.log(`  原始大小: ${(originalSize / 1024 / 1024).toFixed(2)}MB`)
        console.log(`  压缩大小: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`)
        console.log(`  压缩比例: ${compressionRatio.toFixed(2)}:1`)

        return {
          success: true,
          compressedBuffer,
          originalSize,
          compressedSize,
          compressionRatio
        }
      } catch (fallbackError) {
        console.warn('备用压缩方法也失败，尝试超简单方法:', fallbackError)

        // 清理输出文件
        if (fs.existsSync(outputPath)) {
          await fs.promises.unlink(outputPath)
        }

        // 尝试超简单压缩方法
        const compressedBuffer = await compressVideoMinimal(inputPath, outputPath, {
          crf,
          maxWidth,
          maxHeight
        })

        const compressedSize = compressedBuffer.length
        const compressionRatio = originalSize / compressedSize

        console.log(`超简单方法压缩完成:`)
        console.log(`  原始大小: ${(originalSize / 1024 / 1024).toFixed(2)}MB`)
        console.log(`  压缩大小: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`)
        console.log(`  压缩比例: ${compressionRatio.toFixed(2)}:1`)

        return {
          success: true,
          compressedBuffer,
          originalSize,
          compressedSize,
          compressionRatio
        }
      }
    }
  } catch (error) {
    console.error('视频压缩失败:', error)
    return {
      success: false,
      originalSize,
      error: error instanceof Error ? error.message : '未知错误'
    }
  } finally {
    // 清理临时文件
    try {
      if (fs.existsSync(inputPath)) {
        await fs.promises.unlink(inputPath)
      }
      if (fs.existsSync(outputPath)) {
        await fs.promises.unlink(outputPath)
      }
    } catch (cleanupError) {
      console.warn('清理临时文件失败:', cleanupError)
    }
  }
}

/**
 * 自动选择最佳压缩设置
 * @param originalSize 原始文件大小（字节）
 * @returns 优化的压缩选项
 */
export function getOptimalCompressOptions(originalSize: number): VideoCompressOptions {
  const sizeMB = originalSize / 1024 / 1024

  if (sizeMB < 5) {
    // 小文件：轻度压缩，适度降低分辨率
    return {
      crf: 23, // 高质量
      maxWidth: 1280, // 720p，减少base64大小
      maxHeight: 720,
      keepOriginalFramerate: true
    }
  } else if (sizeMB < 15) {
    // 中等文件：中度压缩，明确限制分辨率
    return {
      crf: 26, // 中高质量
      maxWidth: 1280, // 强制缩放到720p
      maxHeight: 720,
      keepOriginalFramerate: false
    }
  } else if (sizeMB < 50) {
    // 大文件：较强压缩，但保持AI可分析的清晰度
    return {
      crf: 28, // 中等质量
      maxWidth: 1280, // 720p，平衡质量和大小
      maxHeight: 720,
      keepOriginalFramerate: false
    }
  } else {
    // 超大文件：激进压缩，优先考虑文件大小
    return {
      crf: 30, // 较低质量但仍可接受
      maxWidth: 960, // 更小的分辨率
      maxHeight: 540,
      keepOriginalFramerate: false
    }
  }
}

/**
 * 针对高分辨率视频（如3024×1964）的优化压缩设置
 * 专门用于减少base64编码后的大小
 * @param originalSize 原始文件大小（字节）
 * @returns 优化的压缩选项
 */
export function getHighResolutionOptimalOptions(originalSize: number): VideoCompressOptions {
  const sizeMB = originalSize / 1024 / 1024

  if (sizeMB < 10) {
    return {
      crf: 28, // 中等质量，优先考虑大小
      maxWidth: 1280, // 强制缩放到720p
      maxHeight: 720,
      keepOriginalFramerate: false // 降低帧率
    }
  } else if (sizeMB < 30) {
    return {
      crf: 30, // 较低质量但仍可接受
      maxWidth: 960, // 更小的分辨率
      maxHeight: 540,
      keepOriginalFramerate: false
    }
  } else {
    return {
      crf: 32, // 激进压缩
      maxWidth: 854, // 480p，大幅减少文件大小
      maxHeight: 480,
      keepOriginalFramerate: false
    }
  }
}
