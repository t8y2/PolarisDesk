import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'PolarisDesk',
  description: '一个现代化的 AI 桌面助手应用',
  lang: 'zh-CN',
  base: '/PolarisDesk/', // GitHub Pages 需要设置仓库名

  head: [
    ['link', { rel: 'icon', href: '/PolarisDesk/icon.png' }],
    ['meta', { name: 'theme-color', content: '#5865F2' }]
  ],

  themeConfig: {
    logo: '/icon.png',

    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '功能介绍', link: '/features/ai-chat' },
      {
        text: '链接',
        items: [
          { text: 'GitHub', link: 'https://github.com/t8y2/PolarisDesk' },
          { text: 'Discord', link: 'https://discord.gg/6XR6b73PrE' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装说明', link: '/guide/installation' },
            { text: '更新日志', link: '/guide/changelog' }
          ]
        }
      ],
      '/features/': [
        {
          text: '核心功能',
          items: [
            { text: 'AI 对话', link: '/features/ai-chat' },
            { text: '人设预设', link: '/features/persona-presets' },
            { text: 'AI 命令行', link: '/features/ai-command' },
            { text: '悬浮窗口', link: '/features/floating-window' },
            { text: '对话历史', link: '/features/chat-history' }
          ]
        },
        {
          text: '输入功能',
          items: [
            { text: '文件上传', link: '/features/document' },
            { text: '截图功能', link: '/features/screenshot' }
          ]
        },
        {
          text: '其他功能',
          items: [
            { text: 'Markdown 渲染', link: '/features/markdown' },
            { text: '隐私模式', link: '/features/privacy-mode' },
            { text: '设置', link: '/features/settings' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/t8y2/PolarisDesk' },
      { icon: 'discord', link: 'https://discord.gg/6XR6b73PrE' }
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024-present PolarisDesk'
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换'
                }
              }
            }
          }
        }
      }
    },

    editLink: {
      pattern: 'https://github.com/t8y2/PolarisDesk/edit/main/docs-site/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
