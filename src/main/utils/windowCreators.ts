import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import type { RecordingArea } from '../types/window'

// 创建录制状态窗口
export function createRecordingStatusWindow(x?: number, y?: number): BrowserWindow {
  const display = screen.getPrimaryDisplay()
  const { width: screenWidth } = display.workAreaSize

  // 如果没有指定位置，使用默认位置（右上角）
  const windowX = x !== undefined ? x : screenWidth - 300
  const windowY = y !== undefined ? y : 20

  const recordingStatusWindow = new BrowserWindow({
    width: 280,
    height: 50,
    x: windowX,
    y: windowY,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    transparent: true,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // 创建录制状态窗口的HTML内容
  const statusHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        width: 100%;
        height: 100vh;
        background: transparent;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
        overflow: hidden;
        cursor: move;
        -webkit-app-region: drag;
      }
      .recording-container {
        background: rgba(0, 0, 0, 0.85);
        border-radius: 18px;
        padding: 6px 12px;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 4px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .recording-dot {
        width: 10px;
        height: 10px;
        background: #ff4444;
        border-radius: 50%;
        animation: dotPulse 1.5s infinite;
        flex-shrink: 0;
      }
      .recording-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }
      .recording-text {
        color: rgba(255, 255, 255, 0.9);
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
      }
      .recording-time {
        font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
        font-size: 14px;
        font-weight: 600;
        color: white;
        letter-spacing: 0.5px;
        min-width: 45px;
      }
      .stop-button {
        background: rgba(220, 53, 69, 0.9);
        border: none;
        border-radius: 12px;
        color: white;
        cursor: pointer;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s ease;
        -webkit-app-region: no-drag;
        white-space: nowrap;
      }
      .stop-button:hover {
        background: rgba(220, 53, 69, 1);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
      }
      .stop-button:active {
        transform: translateY(0);
      }
      .cancel-button {
        background: rgba(100, 100, 100, 0.6);
        border: none;
        border-radius: 12px;
        color: white;
        cursor: pointer;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s ease;
        -webkit-app-region: no-drag;
        white-space: nowrap;
      }
      .cancel-button:hover {
        background: rgba(100, 100, 100, 0.8);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(100, 100, 100, 0.3);
      }
      .cancel-button:active {
        transform: translateY(0);
      }
      @keyframes dotPulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.1);
        }
      }
    </style>
  </head>
  <body>
    <div class="recording-container">
      <div class="recording-dot"></div>
      <div class="recording-info">
        <span class="recording-text" id="recording-type">录制中</span>
        <span class="recording-time" id="recording-time">00:01</span>
      </div>
      <button class="cancel-button" onclick="cancelRecording()" title="取消录制，不保存">取消</button>
      <button class="stop-button" onclick="stopRecording()" title="结束录制并保存">结束</button>
    </div>
    <script>
      const { ipcRenderer } = require('electron');

      let startTime = new Date();
      let timerInterval = null;

      function updateTimer() {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        document.getElementById('recording-time').textContent =
          \`\${minutes.toString().padStart(2, '0')}:\${remainingSeconds.toString().padStart(2, '0')}\`;
      }

      function startTimer() {
        startTime = new Date();
        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
      }

      function stopTimer() {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }

      function stopRecording() {
        ipcRenderer.send('stop-recording-from-status');
      }

      function cancelRecording() {
        ipcRenderer.send('cancel-recording-from-status');
      }

      function updateRecordingType(type) {
        const typeElement = document.getElementById('recording-type');
        typeElement.textContent = type === 'screen' ? '录制中' : '录制中';
      }

      // 监听主进程的消息
      ipcRenderer.on('start-recording-timer', (_, type) => {
        updateRecordingType(type);
        startTimer();
      });

      ipcRenderer.on('stop-recording-timer', () => {
        stopTimer();
      });

      ipcRenderer.on('update-recording-type', (_, type) => {
        updateRecordingType(type);
      });

      // 启动计时器
      startTimer();
    </script>
  </body>
  </html>`

  recordingStatusWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(statusHtml))

  // 设置录制状态窗口为最高层级，确保不被边框遮挡
  if (process.platform === 'darwin') {
    recordingStatusWindow.setAlwaysOnTop(true, 'floating')
  }

  return recordingStatusWindow
}

// 创建录制边框窗口
export function createRecordingBorderWindows(area?: RecordingArea): BrowserWindow | null {
  const display = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = display.bounds
  console.log('边框窗口屏幕信息:', {
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor
  })

  // 边框参数
  const borderGap = 1
  const borderWidth = 2

  // 如果没有指定区域，使用全屏（全屏时不显示边框）
  if (!area) {
    return null
  }

  const recordingArea = area
  console.log('创建录制边框，原始区域:', recordingArea)

  // 修复边框位置：如果录制区域在底部，边框也需要相应调整
  // 计算 Dock 高度对边框位置的影响
  const menuBarHeight = display.workArea.y - display.bounds.y
  const dockHeight = display.bounds.height - display.workArea.height - menuBarHeight
  const areaBottom = recordingArea.y + recordingArea.height
  const screenBottom = display.bounds.height
  const isInDockArea = areaBottom > screenBottom - dockHeight - 50

  // 边框需要匹配实际的录制区域显示位置
  // 如果录制区域在底部，边框可能需要向下偏移来匹配
  let borderY = recordingArea.y
  if (isInDockArea && dockHeight > 0) {
    // 向下调整边框位置以匹配实际录制位置
    borderY = recordingArea.y + dockHeight
    console.log('底部录制区域检测到，调整边框 Y 位置:', {
      原始Y: recordingArea.y,
      调整后Y: borderY,
      调整量: dockHeight
    })
  }

  // 计算边框窗口的范围（包含录制区域和边框）
  const borderWindowArea = {
    x: recordingArea.x - borderGap - borderWidth,
    y: borderY - borderGap - borderWidth,
    width: recordingArea.width + (borderGap + borderWidth) * 2,
    height: recordingArea.height + (borderGap + borderWidth) * 2
  }

  console.log('边框窗口区域:', borderWindowArea)
  console.log('屏幕尺寸:', { screenWidth, screenHeight })

  // 确保边框不超出屏幕范围，但要更智能地处理底部边框
  const borderExceedsLeft = borderWindowArea.x < 0
  const borderExceedsTop = borderWindowArea.y < 0
  const borderExceedsRight = borderWindowArea.x + borderWindowArea.width > screenWidth
  const borderExceedsBottom = borderWindowArea.y + borderWindowArea.height > screenHeight

  console.log('边框位置检查:', {
    borderWindowArea,
    exceedsLeft: borderExceedsLeft,
    exceedsTop: borderExceedsTop,
    exceedsRight: borderExceedsRight,
    exceedsBottom: borderExceedsBottom
  })

  // 如果边框在底部稍微超出屏幕，我们调整边框大小而不是完全隐藏
  if (borderExceedsLeft || borderExceedsTop || borderExceedsRight) {
    console.log('边框在左/上/右侧超出屏幕范围，不显示边框')
    return null
  }

  // 如果底部超出，调整高度而不是完全隐藏
  if (borderExceedsBottom) {
    const availableHeight = screenHeight - borderWindowArea.y
    if (availableHeight > 20) {
      // 确保至少有 20px 高度
      borderWindowArea.height = availableHeight
      console.log('调整边框高度以适应屏幕:', {
        原始高度: borderWindowArea.height,
        调整后高度: availableHeight
      })
    } else {
      console.log('底部空间不足，不显示边框')
      return null
    }
  }

  const recordingBorderWindow = new BrowserWindow({
    x: borderWindowArea.x,
    y: borderWindowArea.y,
    width: borderWindowArea.width,
    height: borderWindowArea.height,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    transparent: true,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    focusable: false,
    acceptFirstMouse: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // 设置窗口级别 - 使用高层级确保边框始终可见，但低于录制状态窗口
  if (process.platform === 'darwin') {
    recordingBorderWindow.setWindowButtonVisibility(false)
    recordingBorderWindow.setAlwaysOnTop(true, 'screen-saver')
    recordingBorderWindow.setVisibleOnAllWorkspaces(true)
    recordingBorderWindow.setIgnoreMouseEvents(true)
  } else {
    // 非 macOS 平台也设置置顶
    recordingBorderWindow.setAlwaysOnTop(true)
  }

  // 创建边框的HTML内容 - 边框容器位置确保边框内边缘对齐录制区域
  const borderHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        width: 100%;
        height: 100vh;
        background: transparent;
        overflow: hidden;
        pointer-events: none;
        border-radius: 0 !important;
        -webkit-border-radius: 0 !important;
        -moz-border-radius: 0 !important;
      }
      .border-container {
        position: absolute;
        left: ${borderGap}px;
        top: ${borderGap}px;
        width: ${recordingArea.width + borderWidth * 2}px;
        height: ${recordingArea.height + borderWidth * 2}px;
        border: ${borderWidth}px solid #ED3321;
        background: transparent;
        border-radius: 0 !important;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div class="border-container"></div>
  </body>
  </html>`

  console.log('边框HTML参数:', {
    borderGap,
    borderWidth,
    containerWidth: recordingArea.width + borderWidth * 2,
    containerHeight: recordingArea.height + borderWidth * 2
  })

  recordingBorderWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(borderHtml))

  return recordingBorderWindow
}

// 创建响应窗口
export function createResponseWindow(response: string, floatingWindow?: BrowserWindow): BrowserWindow {
  // 获取悬浮窗位置，计算响应窗口位置
  let responseX = 50
  let responseY = 100

  if (floatingWindow && !floatingWindow.isDestroyed()) {
    const floatingBounds = floatingWindow.getBounds()
    responseX = floatingBounds.x - 410 // 紧贴左侧，留10px间距
    responseY = floatingBounds.y // 与悬浮窗顶部对齐
  }

  const responseWindow = new BrowserWindow({
    width: 400,
    height: 350,
    x: responseX,
    y: responseY,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    transparent: true,
    backgroundColor: 'rgba(20, 20, 20, 0.98)',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true
    }
  })

  // 创建响应窗口的HTML内容
  const responseHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 100%; height: 100vh;
          background: rgba(20, 20, 20, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px; backdrop-filter: blur(15px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden; display: flex; flex-direction: column;
        }
        .header {
          background: rgba(40, 40, 40, 0.95); padding: 8px 12px;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          cursor: move; -webkit-app-region: drag;
        }
        .title { color: white; font-size: 13px; font-weight: 500; }
        .controls { display: flex; gap: 4px; -webkit-app-region: no-drag; }
        .control-btn {
          background: none; border: none; color: rgba(255, 255, 255, 0.7);
          font-size: 14px; cursor: pointer; padding: 2px 8px; border-radius: 3px;
          transition: all 0.2s; width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold;
        }
        .control-btn:hover { background: rgba(255, 255, 255, 0.15); color: white; }
        .control-btn.close:hover { background: rgba(255, 59, 48, 0.8); color: white; }
        .control-btn:active { transform: scale(0.95); }
        .content {
          flex: 1; padding: 12px; overflow-y: auto;
          color: rgba(255, 255, 255, 0.9); font-size: 13px; line-height: 1.5;
        }
        .response-text { white-space: pre-wrap; word-break: break-word; }
        .content::-webkit-scrollbar { width: 4px; }
        .content::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 2px; }
        .content::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 2px; }
        .content::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">响应</div>
        <div class="controls">
          <button class="control-btn close" onclick="closeWindow(); event.stopPropagation();" title="关闭窗口 (ESC)">✕</button>
        </div>
      </div>
      <div class="content">
        <div class="response-text">${response.replace(/\n/g, '<br>')}</div>
      </div>
      <script>
        // 添加延迟防抖函数，避免重复触发关闭操作
        let isClosing = false;

        function closeWindow() {
          if (isClosing) return; // 避免重复触发
          isClosing = true;

          try {
            // 使用通过 preload 暴露的 API 来关闭窗口
            if (window.api && window.api.closeResponseWindow) {
              window.api.closeResponseWindow();

              // 备用关闭方法，确保窗口关闭
              setTimeout(() => {
                window.close();
              }, 100);
            } else {
              console.error('API 不可用');
              window.close();
            }
          } catch (error) {
            console.error('关闭窗口失败:', error);
            // 备用方案：直接关闭窗口
            window.close();
          }
        }

        // 添加键盘快捷键支持
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            closeWindow();
          }
        });

        // 点击窗口外部区域关闭
        document.addEventListener('click', (e) => {
          if (e.target === document.body) {
            closeWindow();
          }
        });
      </script>
    </body>
    </html>`

  responseWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(responseHtml))

  return responseWindow
}

// 创建HTML预览窗口
export function createHtmlPreviewWindow(htmlContent: string): BrowserWindow {
  const htmlPreviewWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    resizable: true,
    movable: true,
    title: 'HTML 预览',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // 允许加载本地资源
    }
  })

  // 最大化窗口
  htmlPreviewWindow.maximize()

  // 创建HTML预览窗口的内容
  const previewHtml = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HTML 预览</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 100%; height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden; display: flex; flex-direction: column;
          background: white;
        }
        .header {
          background: #f8f9fa; padding: 12px 16px;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #e9ecef;
        }
        .title { color: #333; font-size: 14px; font-weight: 600; }
        .controls { display: flex; gap: 8px; }
        .control-btn {
          background: #6c757d; border: none; color: white;
          font-size: 12px; cursor: pointer; padding: 6px 12px; border-radius: 4px;
          transition: all 0.2s; font-weight: 500;
        }
        .control-btn:hover { background: #5a6268; }
        .control-btn.close { background: #dc3545; }
        .control-btn.close:hover { background: #c82333; }
        .control-btn:active { transform: scale(0.98); }
        .content {
          flex: 1; overflow: auto;
          background: white;
        }
        .content::-webkit-scrollbar { width: 8px; }
        .content::-webkit-scrollbar-track { background: #f1f1f1; }
        .content::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .content::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">🌐 HTML 预览</div>
        <div class="controls">
          <button class="control-btn" onclick="refreshPreview()" title="刷新预览">刷新</button>
          <button class="control-btn close" onclick="closeWindow()" title="关闭窗口 (ESC)">关闭</button>
        </div>
      </div>
      <div class="content" id="preview-content">
        ${htmlContent}
      </div>
      <script>
        function closeWindow() {
          try {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('close-html-preview');
          } catch (error) {
            console.error('关闭窗口失败:', error);
            window.close();
          }
        }

        function refreshPreview() {
          location.reload();
        }

        // ESC键关闭窗口
        document.addEventListener('keydown', function(event) {
          if (event.key === 'Escape') {
            closeWindow();
          }
        });

        // 窗口加载完成后调整大小
        window.addEventListener('load', function() {
          console.log('HTML预览窗口加载完成');
        });
      </script>
    </body>
    </html>`

  htmlPreviewWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(previewHtml))

  return htmlPreviewWindow
}
