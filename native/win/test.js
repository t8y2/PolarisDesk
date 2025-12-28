#!/usr/bin/env node

/**
 * Windows UI Automation 模块测试脚本
 *
 * 使用方法：
 *   node test.js
 */

const path = require('path')

console.log('Loading Windows UI Automation module...\n')

try {
  // 加载编译后的模块
  const modulePath = path.join(__dirname, 'build', 'Release', 'ui_tree_win.node')
  const uiTree = require(modulePath)

  console.log('✅ Module loaded successfully!\n')

  // 测试 1: 检查权限
  console.log('Test 1: Checking accessibility permission...')
  const hasPermission = uiTree.checkAccessibilityPermission()
  console.log(`  Result: ${hasPermission ? '✅ Has permission' : '❌ No permission'}\n`)

  // 测试 2: 获取所有窗口
  console.log('Test 2: Getting all active windows (depth=3)...')
  const windows = uiTree.getAllActiveWindows(3)
  console.log(`  Found ${windows.length} windows\n`)

  // 显示前 5 个窗口的信息
  const displayCount = Math.min(5, windows.length)
  for (let i = 0; i < displayCount; i++) {
    const window = windows[i]
    console.log(`  Window ${i + 1}:`)
    console.log(`    Title: ${window.windowTitle || '(no title)'}`)
    console.log(`    Application: ${window.applicationName || '(unknown)'}`)
    console.log(`    Process ID: ${window.processId}`)

    if (window.uiTree) {
      console.log(`    UI Tree:`)
      console.log(`      Role: ${window.uiTree.role || '(none)'}`)
      console.log(`      Children: ${window.uiTree.children ? window.uiTree.children.length : 0}`)

      if (window.uiTree.bounds) {
        const b = window.uiTree.bounds
        console.log(`      Bounds: (${b.x}, ${b.y}) ${b.width}x${b.height}`)
      }
    }
    console.log()
  }

  if (windows.length > displayCount) {
    console.log(`  ... and ${windows.length - displayCount} more windows\n`)
  }

  // 测试 3: 深度遍历测试
  console.log('Test 3: Testing different depths...')
  for (const depth of [1, 3, 6]) {
    const result = uiTree.getAllActiveWindows(depth)
    console.log(`  Depth ${depth}: ${result.length} windows`)
  }
  console.log()

  // 测试 4: 显示详细的 UI 树结构（第一个窗口）
  if (windows.length > 0) {
    console.log('Test 4: Detailed UI tree structure (first window)...')
    const firstWindow = windows[0]
    console.log(`  Window: ${firstWindow.windowTitle || '(no title)'}\n`)

    function printElement(element, indent = '  ') {
      if (!element) return

      const info = []
      if (element.role) info.push(`role="${element.role}"`)
      if (element.title) info.push(`title="${element.title}"`)
      if (element.value) info.push(`value="${element.value}"`)
      if (element.automationId) info.push(`id="${element.automationId}"`)
      if (element.className) info.push(`class="${element.className}"`)
      if (element.enabled === false) info.push('disabled')
      if (element.focused) info.push('focused')

      console.log(`${indent}<element ${info.join(' ')}>`)

      if (element.children && element.children.length > 0) {
        const displayChildren = Math.min(5, element.children.length)
        for (let i = 0; i < displayChildren; i++) {
          printElement(element.children[i], indent + '  ')
        }
        if (element.children.length > displayChildren) {
          console.log(`${indent}  ... and ${element.children.length - displayChildren} more children`)
        }
      }

      console.log(`${indent}</element>`)
    }

    if (firstWindow.uiTree) {
      printElement(firstWindow.uiTree, '  ')
    }
  }

  console.log('\n✅ All tests completed successfully!')
} catch (error) {
  console.error('❌ Error:', error.message)
  console.error('\nStack trace:')
  console.error(error.stack)
  console.error('\nTroubleshooting:')
  console.error('1. Make sure the module is built: npm install')
  console.error('2. Check if build/Release/ui_tree_win.node exists')
  console.error('3. Verify Visual Studio Build Tools are installed')
  process.exit(1)
}
