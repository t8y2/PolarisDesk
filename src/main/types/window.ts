// 窗口类型定义
import { BrowserWindow } from 'electron'

export interface WindowState {
  window: BrowserWindow
  wasVisible: boolean
}

export interface WindowInstances {
  mainWindow: BrowserWindow | null
  floatingWindow: BrowserWindow | null
  responseWindow: BrowserWindow | null
  htmlPreviewWindow: BrowserWindow | null
  recordingStatusWindow: BrowserWindow | null
  recordingBorderWindow: BrowserWindow | null
}

export interface RecordingArea {
  x: number
  y: number
  width: number
  height: number
}
