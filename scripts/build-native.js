#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { execSync } = require('child_process')
const { platform } = require('os')
const { existsSync } = require('fs')
const { join } = require('path')

const currentPlatform = platform()

console.log(`Building native modules for ${currentPlatform}...`)

if (currentPlatform === 'darwin') {
  const macPath = join(__dirname, '../native/mac')
  if (existsSync(macPath)) {
    console.log('Building macOS native module...')
    try {
      execSync('npm install', { cwd: macPath, stdio: 'inherit' })
      console.log('✓ macOS native module built successfully')
    } catch (error) {
      console.error('✗ Failed to build macOS native module:', error.message)
      process.exit(1)
    }
  }
} else if (currentPlatform === 'win32') {
  const winPath = join(__dirname, '../native/win')
  if (existsSync(winPath)) {
    console.log('Building Windows native module...')
    try {
      execSync('npm install', { cwd: winPath, stdio: 'inherit' })
      console.log('✓ Windows native module built successfully')
    } catch (error) {
      console.error('✗ Failed to build Windows native module:', error.message)
      process.exit(1)
    }
  } else {
    console.log('⚠ Windows native module not implemented yet')
  }
} else {
  console.log(`⚠ No native modules for ${currentPlatform}`)
}
