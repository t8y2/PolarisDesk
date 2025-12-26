<template>
  <!--
    使用 v-html 渲染 markdown 内容
    注意：content 来自组件 props，经过 markdown 渲染器处理
    确保传入的内容是可信的
  -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import markdownItHighlightjs from 'markdown-it-highlightjs'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  content: string
}

const props = defineProps<Props>()

// 注册常用语言
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', html)
hljs.registerLanguage('xml', html)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c++', cpp)

// 创建markdown渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
}).use(markdownItHighlightjs, {
  hljs,
  auto: true,
  code: true
})

// 获取语言显示名称
function getLanguageDisplay(language: string): string {
  const languageMap: Record<string, string> = {
    javascript: 'JavaScript',
    js: 'JavaScript',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    python: 'Python',
    py: 'Python',
    java: 'Java',
    cpp: 'C++',
    'c++': 'C++',
    c: 'C',
    css: 'CSS',
    html: 'HTML',
    xml: 'XML',
    json: 'JSON',
    bash: 'Bash',
    shell: 'Shell',
    sh: 'Shell',
    sql: 'SQL',
    php: 'PHP',
    go: 'Go',
    rust: 'Rust',
    ruby: 'Ruby',
    swift: 'Swift',
    kotlin: 'Kotlin',
    vue: 'Vue',
    jsx: 'JSX',
    tsx: 'TSX'
  }

  return languageMap[language] || language.toUpperCase()
}

// 渲染markdown
function renderMarkdown(text: string): string {
  // 预处理：检测直接的HTML内容并转换为代码块
  let processedText = text

  // 检测是否为HTML内容（更完善的逻辑）
  const isHtmlContent = (text: string): boolean => {
    const trimmed = text.trim()

    // 已经是代码块的，不处理
    if (trimmed.includes('```')) return false

    // 检测常见的HTML起始标签
    const htmlStartPatterns = [/^<!DOCTYPE\s+html/i, /^<html[\s>]/i, /^<head[\s>]/i, /^<body[\s>]/i, /^<div[\s>]/i, /^<section[\s>]/i, /^<article[\s>]/i, /^<main[\s>]/i, /^<header[\s>]/i, /^<footer[\s>]/i, /^<nav[\s>]/i]

    // 检测是否匹配HTML起始模式
    const hasHtmlStart = htmlStartPatterns.some(pattern => pattern.test(trimmed))

    // 检测是否包含HTML标签结构（有开始和结束标签）
    const hasHtmlStructure = /<[a-zA-Z][^>]*>.*<\/[a-zA-Z]+>/s.test(trimmed)

    // 检测是否包含常见的HTML特征
    const hasHtmlFeatures = /(?:<!DOCTYPE|<html|<head|<body|<div|class=|id=|href=|src=)/i.test(trimmed)

    // 检测换行符数量（HTML通常有多行）
    const hasMultipleLines = (text.match(/\\n/g) || []).length > 2 || (text.match(/\n/g) || []).length > 2

    return (hasHtmlStart || (hasHtmlStructure && hasHtmlFeatures)) && hasMultipleLines
  }

  if (isHtmlContent(processedText)) {
    // 处理转义字符
    const htmlContent = processedText.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').trim()

    // 如果是完整的HTML文档，添加DOCTYPE
    const formattedContent = htmlContent.startsWith('<html') && !htmlContent.includes('<!DOCTYPE') ? htmlContent.replace(/<html([^>]*)>/, '<!DOCTYPE html>\n<html$1>') : htmlContent

    processedText = `\`\`\`html\n${formattedContent}\n\`\`\``
  }

  // 预处理：先处理多行公式，将其压缩为单行
  processedText = processedText
    // 处理多行块级公式 \[...\]，将内容压缩为单行
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_match, content) => {
      // 移除多余的空白字符和换行，但保留公式内的必要空格
      const compressed = content.replace(/\s+/g, ' ').trim()
      return `\\[ ${compressed} \\]`
    })
    // 处理多行块级公式 $$...$$，将内容压缩为单行
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_match, content) => {
      // 移除多余的空白字符和换行，但保留公式内的必要空格
      const compressed = content.replace(/\s+/g, ' ').trim()
      return `$$ ${compressed} $$`
    })
    // 将 \( ... \) 转换为 $ ... $
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    // 将 \[ ... \] 转换为 $$ ... $$
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')

  // 使用 markdown-it 渲染基础内容
  let html = md.render(processedText)

  // 手动处理数学公式
  // 处理行内公式 $...$
  html = html.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: false,
        strict: false
      })
      return rendered
    } catch (error) {
      console.warn('KaTeX 渲染错误:', error)
      return match // 如果渲染失败，返回原文
    }
  })

  // 处理块级公式 $$...$$
  html = html.replace(/\$\$([^$]*?)\$\$/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: true,
        strict: false
      })
      return `<div class="katex-display">${rendered}</div>`
    } catch (error) {
      console.warn('KaTeX 块级公式渲染错误:', error)
      return match // 如果渲染失败，返回原文
    }
  })

  // 后处理：为代码块添加语言标签和复制按钮
  html = html.replace(/<pre><code class="hljs language-([^"]*)"([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (_match, language, attrs, code) => {
    const languageDisplay = getLanguageDisplay(language)
    const codeId = Math.random().toString(36).substr(2, 9)

    // 检查是否是HTML代码
    const isHtml = language === 'html' || language === 'xml'

    return `
        <div class="code-block-wrapper" data-language="${language}">
          <div class="code-header">
            <span class="language-label">${languageDisplay}</span>
            <div class="code-actions">
              <button class="copy-button" onclick="copyCode('${codeId}')" title="复制代码">
                <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M28,10V28H10V10H28m0-2H10a2,2,0,0,0-2,2V28a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V10a2,2,0,0,0-2-2Z"/>
                  <path d="M4,18H2V4A2,2,0,0,1,4,2H18V4H4Z"/>
                </svg>
              </button>${isHtml ? ' <button class="preview-button" onclick="openHtmlPreview(\'' + codeId + '\')" title="预览HTML"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button>' : ''}
            </div>
          </div>
          <pre><code class="hljs language-${language}" id="${codeId}"${attrs}>${code}</code></pre>
        </div>
      `
  })

  // 处理没有语言标识的代码块
  html = html.replace(/<pre><code class="hljs"([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (_match, attrs, code) => {
    const codeId = Math.random().toString(36).substr(2, 9)
    return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="language-label">代码</span>
            <button class="copy-button" onclick="copyCode('${codeId}')" title="复制代码">
              <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor">
                <path d="M28,10V28H10V10H28m0-2H10a2,2,0,0,0-2,2V28a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V10a2,2,0,0,0-2-2Z"/>
                <path d="M4,18H2V4A2,2,0,0,1,4,2H18V4H4Z"/>
              </svg>
            </button>
          </div>
          <pre><code class="hljs" id="${codeId}"${attrs}>${code}</code></pre>
        </div>
      `
  })

  return html
}

// 计算属性：渲染后的内容
const renderedContent = computed(() => renderMarkdown(props.content))
</script>

<style scoped>
/* 代码块样式 */
.markdown-content :deep(.code-block-wrapper) {
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid #404040;
  margin-bottom: 1rem;
}

.markdown-content :deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #262626;
  border-bottom: 1px solid #404040;
}

.markdown-content :deep(.language-label) {
  color: #d4d4d4;
  font-size: 0.875rem;
  font-weight: 500;
}

.markdown-content :deep(.code-actions) {
  display: flex;
  gap: 0.5rem;
}

.markdown-content :deep(.copy-button),
.markdown-content :deep(.preview-button) {
  padding: 0.375rem;
  color: #a3a3a3;
  border-radius: 0.25rem;
  transition: all 0.2s;
  background: none;
  border: none;
  cursor: pointer;
}

.markdown-content :deep(.copy-button):hover,
.markdown-content :deep(.preview-button):hover {
  color: #e5e5e5;
  background-color: #404040;
}

.markdown-content :deep(pre) {
  margin: 0;
  padding: 1rem;
  background-color: #171717;
  overflow-x: auto;
}

.markdown-content :deep(code) {
  font-size: 0.875rem;
}

/* KaTeX 数学公式样式 */
.markdown-content :deep(.katex-display) {
  margin: 1rem 0;
  text-align: center;
}

/* 浅色主题样式 */
body[data-theme='light'] .markdown-content :deep(.code-block-wrapper) {
  border-color: #d1d5db;
}

body[data-theme='light'] .markdown-content :deep(.code-header) {
  background-color: #374151;
  border-bottom-color: #4b5563;
}

body[data-theme='light'] .markdown-content :deep(.language-label) {
  color: #e5e7eb;
}

body[data-theme='light'] .markdown-content :deep(.copy-button),
body[data-theme='light'] .markdown-content :deep(.preview-button) {
  color: #d1d5db;
}

body[data-theme='light'] .markdown-content :deep(.copy-button):hover,
body[data-theme='light'] .markdown-content :deep(.preview-button):hover {
  color: #f3f4f6;
  background-color: #4b5563;
}

body[data-theme='light'] .markdown-content :deep(pre) {
  background-color: #1f2937;
}
</style>
