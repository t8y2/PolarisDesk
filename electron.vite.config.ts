import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          // 主进程代码分割
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'
            }
            return undefined
          }
        }
      }
    }
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
      // 启用CSS代码分割
      cssCodeSplit: true,
      // 优化chunk大小
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // 优化代码分割策略
          manualChunks: {
            // 核心框架
            'vue-core': ['vue', 'pinia', 'vue-i18n'],
            // UI库
            'naive-ui': ['naive-ui'],
            // Markdown相关
            markdown: ['markdown-it', 'markdown-it-highlightjs', 'markdown-it-katex'],
            // 代码高亮
            highlight: ['highlight.js'],
            // 数学公式
            katex: ['katex'],
            // PDF处理
            pdf: ['pdfjs-dist'],
            // 虚拟滚动
            'virtual-scroller': ['vue-virtual-scroller'],
            // VueUse工具库
            vueuse: ['@vueuse/core'],
            // 文档处理
            'doc-processors': ['mammoth', 'pptxtojson']
          },
          // 优化文件命名
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: assetInfo => {
            const info = assetInfo.name?.split('.')
            const ext = info?.[info.length - 1]
            if (/\.(png|jpe?g|svg|gif|webp|ico)$/.test(assetInfo.name || '')) {
              return 'img/[name]-[hash][extname]'
            } else if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
              return 'fonts/[name]-[hash][extname]'
            } else if (ext === 'css') {
              return 'css/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          }
        }
      },
      // 压缩选项
      minify: 'esbuild',
      // 启用source map用于生产环境调试（可选）
      sourcemap: false,
      // 优化依赖预构建
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      }
    },
    // 开发服务器优化
    server: {
      hmr: {
        overlay: false
      }
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: ['vue', 'pinia', 'vue-i18n', '@vueuse/core', 'naive-ui', 'vue-virtual-scroller'],
      exclude: ['electron']
    }
  }
})
