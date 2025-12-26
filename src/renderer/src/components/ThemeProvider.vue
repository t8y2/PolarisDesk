<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="darkThemeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <slot />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, darkTheme, type GlobalThemeOverrides } from 'naive-ui'

// 深色主题配置
const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#ffffff',
    primaryColorHover: '#f3f4f6',
    primaryColorPressed: '#e5e7eb',
    primaryColorSuppl: '#d1d5db',
    borderColor: '#374151',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    bodyColor: '#0a0a0a',
    textColorBase: '#ffffff',
    cardColor: '#1a1a1a',
    modalColor: '#1a1a1a',
    popoverColor: '#1a1a1a',
    tableColor: '#1a1a1a'
  },
  Button: {
    borderRadiusMedium: '8px',
    fontWeightStrong: '500',
    heightMedium: '36px',
    paddingMedium: '0 16px',
    border: '1px solid #2a2a2a',
    borderHover: '1px solid #404040',
    borderPressed: '1px solid #525252',
    color: '#1a1a1a',
    colorHover: '#262626',
    colorPressed: '#171717',
    textColor: '#ffffff',
    textColorHover: '#ffffff',
    textColorPressed: '#ffffff',
    colorDisabled: '#171717',
    textColorDisabled: '#525252'
  },
  Input: {
    borderRadius: '8px',
    border: '1px solid #374151',
    borderHover: '1px solid #4b5563',
    borderFocus: '1px solid #525252',
    boxShadowFocus: '0 0 0 2px rgba(82, 82, 82, 0.2)',
    padding: '8px 12px',
    color: '#1f2937',
    colorFocus: '#111827',
    textColor: '#ffffff',
    textColorFocus: '#ffffff',
    placeholderColor: '#9ca3af',
    placeholderColorDisabled: '#6b7280',
    caretColor: '#ffffff'
  },
  Card: {
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #2a2a2a',
    color: '#1a1a1a'
  },
  Message: {
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    color: '#ffffff',
    textColor: '#000000',
    colorInfo: '#ffffff',
    colorSuccess: '#ffffff',
    colorWarning: '#ffffff',
    colorError: '#ffffff',
    colorLoading: '#ffffff',
    textColorInfo: '#000000',
    textColorSuccess: '#000000',
    textColorWarning: '#000000',
    textColorError: '#000000',
    textColorLoading: '#000000'
  },
  Dialog: {
    borderRadius: '12px',
    color: '#1f2937',
    textColor: '#ffffff',
    titleTextColor: '#ffffff',
    contentTextColor: '#e5e7eb',
    actionSpacing: '8px'
  },
  Tooltip: {
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    color: '#1a1a1a',
    textColor: '#ffffff'
  }
}
</script>
