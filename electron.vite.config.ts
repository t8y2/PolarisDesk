import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue(), UnoCSS()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // 将大型依赖拆分为独立的chunk
            'naive-ui': ['naive-ui'],
            markdown: ['markdown-it', 'markdown-it-highlightjs', 'markdown-it-katex'],
            highlight: ['highlight.js'],
            katex: ['katex'],
            pdf: ['pdfjs-dist'],
            'virtual-scroller': ['vue-virtual-scroller']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
})
