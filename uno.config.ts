import { defineConfig, presetIcons, presetUno, presetTypography } from 'unocss'
import type { IconifyJSON } from '@iconify/types'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default as IconifyJSON)
      }
    }),
    presetTypography()
  ],
  rules: [
    // 自定义动画延迟
    ['animate-delay-[-0.32s]', { 'animation-delay': '-0.32s' }],
    ['animate-delay-[-0.16s]', { 'animation-delay': '-0.16s' }],
    // 自定义字体大小
    ['text-2.25', { 'font-size': '9px' }],
    ['text-2.5', { 'font-size': '10px' }],
    ['text-2.75', { 'font-size': '11px' }],
    ['text-3', { 'font-size': '12px' }],
    // 自定义圆角
    ['rounded-1.5', { 'border-radius': '6px' }],
    // 自定义过渡
    ['transition-all-200', { transition: 'all 0.2s' }],
    // 自定义颜色
    ['text-blue', { color: 'rgba(0, 122, 255, 1)' }],
    ['text-blue/80', { color: 'rgba(0, 122, 255, 0.8)' }],
    ['bg-blue/10', { 'background-color': 'rgba(0, 122, 255, 0.1)' }],
    ['bg-blue/30', { 'background-color': 'rgba(0, 122, 255, 0.3)' }],
    ['bg-blue/60', { 'background-color': 'rgba(0, 122, 255, 0.6)' }],
    ['bg-blue/80', { 'background-color': 'rgba(0, 122, 255, 0.8)' }],
    ['border-blue/40', { 'border-color': 'rgba(0, 122, 255, 0.4)' }],
    ['bg-red/20', { 'background-color': 'rgba(255, 0, 0, 0.2)' }],
    ['bg-red/40', { 'background-color': 'rgba(255, 0, 0, 0.4)' }],
    ['bg-red/60', { 'background-color': 'rgba(255, 0, 0, 0.6)' }],
    ['bg-orange/60', { 'background-color': 'rgba(255, 165, 0, 0.6)' }],
    // backdrop-blur
    ['backdrop-blur-10px', { 'backdrop-filter': 'blur(10px)' }],
    // 自定义宽高
    ['h-100vh', { height: '100vh' }],
    ['min-h-8', { 'min-height': '32px' }],
    ['w-4.5', { width: '18px' }],
    ['h-4.5', { height: '18px' }],
    // 行高
    ['leading-1.2', { 'line-height': '1.2' }],
    ['leading-1.3', { 'line-height': '1.3' }]
  ],
  shortcuts: {
    // 按钮基础样式
    'btn-base': 'border-none cursor-pointer transition-all-200 flex items-center justify-center',
    // 控制按钮样式
    'control-btn': 'btn-base bg-white/10 rounded text-white px-1.5 py-1 min-w-5 h-5 hover:bg-white/20',
    // 操作按钮样式
    'action-btn': 'btn-base bg-white/10 rounded text-white px-1.5 py-1 min-w-6 h-6 hover:bg-white/20',
    // 消息样式 - 深色主题
    'message-base': 'mb-1.5 px-1.5 py-1 rounded text-2.75',
    'message-user': 'message-base bg-blue/30 text-white self-end border border-blue/40',
    'message-ai': 'message-base bg-white/8 text-white border border-white/15 cursor-pointer transition-all-200 hover:bg-white/12 hover:border-blue/40'
  },
  theme: {
    colors: {
      // 浅色主题颜色
      'light-bg': '#ffffff',
      'light-text': '#000000',
      'light-border': '#e0e0e6',
      'light-card': '#f5f5f5'
    }
  }
})
