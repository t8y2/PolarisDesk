<template>
  <n-config-provider :theme="currentTheme" :theme-overrides="currentThemeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <slot />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { NConfigProvider, NMessageProvider, NDialogProvider, darkTheme, type GlobalThemeOverrides, type GlobalTheme } from 'naive-ui'
import { useSettingsStore } from '../stores/settingsStore'

const settingsStore = useSettingsStore()

// 当前主题
const currentTheme = computed<GlobalTheme | null>(() => {
  return settingsStore.settings.theme === 'dark' ? darkTheme : null
})

// 当前主题配置
const currentThemeOverrides = computed<GlobalThemeOverrides>(() => {
  return settingsStore.settings.theme === 'dark' ? darkThemeOverrides : lightThemeOverrides
})

// 更新 body 的 data-theme 属性
const updateBodyTheme = (): void => {
  document.body.setAttribute('data-theme', settingsStore.settings.theme)
}

// 监听主题变化
watch(() => settingsStore.settings.theme, updateBodyTheme, { immediate: true })

// 组件挂载时设置主题
onMounted(() => {
  updateBodyTheme()
})

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

// 浅色主题配置
const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1a1a1a',
    primaryColorHover: '#333333',
    primaryColorPressed: '#000000',
    primaryColorSuppl: '#333333',
    borderColor: '#d6d6d6',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    bodyColor: 'rgb(237, 237, 237)',
    textColorBase: '#1a1a1a',
    textColor1: '#1a1a1a',
    textColor2: '#333333',
    textColor3: '#666666',
    cardColor: '#ffffff',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    tableColor: '#ffffff',
    inputColor: '#ffffff',
    inputColorDisabled: '#f5f5f5'
  },
  Button: {
    borderRadiusMedium: '8px',
    fontWeightStrong: '500',
    heightMedium: '36px',
    paddingMedium: '0 16px',
    border: '1px solid #d6d6d6',
    borderHover: '1px solid #b8b8b8',
    borderPressed: '1px solid #999999',
    color: '#ffffff',
    colorHover: '#f9fafb',
    colorPressed: '#f3f4f6',
    textColor: '#1a1a1a',
    textColorHover: '#1a1a1a',
    textColorPressed: '#1a1a1a',
    colorDisabled: '#f5f5f5',
    textColorDisabled: '#9ca3af',
    textColorGhost: '#1a1a1a',
    textColorGhostHover: '#1a1a1a',
    textColorGhostPressed: '#1a1a1a',
    // Primary 按钮 - 黑色配色
    colorPrimary: '#1a1a1a',
    colorHoverPrimary: '#333333',
    colorPressedPrimary: '#000000',
    textColorPrimary: '#ffffff',
    textColorHoverPrimary: '#ffffff',
    textColorPressedPrimary: '#ffffff',
    borderPrimary: '1px solid #1a1a1a',
    borderHoverPrimary: '1px solid #333333',
    borderPressedPrimary: '1px solid #000000',
    // 圆形按钮
    colorTertiary: '#ffffff',
    colorHoverTertiary: '#f9fafb',
    colorPressedTertiary: '#f3f4f6',
    textColorTertiary: '#1a1a1a',
    textColorHoverTertiary: '#1a1a1a',
    textColorPressedTertiary: '#1a1a1a',
    borderTertiary: '1px solid #d6d6d6',
    borderHoverTertiary: '1px solid #b8b8b8',
    borderPressedTertiary: '1px solid #999999'
  },
  Input: {
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    borderHover: '1px solid #9ca3af',
    borderFocus: '1px solid #18a058',
    boxShadowFocus: '0 0 0 2px rgba(24, 160, 88, 0.2)',
    padding: '8px 12px',
    color: '#ffffff',
    colorFocus: '#ffffff',
    textColor: '#1a1a1a',
    textColorFocus: '#1a1a1a',
    placeholderColor: '#9ca3af',
    placeholderColorDisabled: '#d1d5db',
    caretColor: '#18a058'
  },
  Card: {
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    color: '#ffffff',
    textColor: '#1a1a1a',
    titleTextColor: '#1a1a1a'
  },
  Message: {
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    color: '#18a058',
    textColor: '#ffffff',
    colorInfo: '#2080f0',
    colorSuccess: '#18a058',
    colorWarning: '#f0a020',
    colorError: '#d03050',
    colorLoading: '#2080f0',
    textColorInfo: '#ffffff',
    textColorSuccess: '#ffffff',
    textColorWarning: '#ffffff',
    textColorError: '#ffffff',
    textColorLoading: '#ffffff',
    iconColorInfo: '#ffffff',
    iconColorSuccess: '#ffffff',
    iconColorWarning: '#ffffff',
    iconColorError: '#ffffff',
    iconColorLoading: '#ffffff'
  },
  Dialog: {
    borderRadius: '12px',
    color: '#ffffff',
    textColor: '#1a1a1a',
    titleTextColor: '#000000',
    contentTextColor: '#333333',
    actionSpacing: '8px'
  },
  Modal: {
    color: '#ffffff',
    textColor: '#1a1a1a'
  },
  Form: {
    labelTextColor: '#1a1a1a'
  },
  Tabs: {
    tabTextColor: '#666666',
    tabTextColorActive: '#1a1a1a',
    tabTextColorHover: '#333333',
    tabTextColorDisabled: '#d1d5db',
    tabColor: 'transparent',
    tabColorSegment: '#ffffff',
    barColor: '#18a058',
    tabBorderColor: '#d1d5db',
    tabFontWeightActive: '600'
  },
  Select: {
    peers: {
      InternalSelection: {
        textColor: '#1a1a1a',
        placeholderColor: '#9ca3af',
        color: '#ffffff',
        colorActive: '#ffffff',
        border: '1px solid #d1d5db',
        borderHover: '1px solid #9ca3af',
        borderActive: '1px solid #18a058',
        borderFocus: '1px solid #18a058',
        boxShadowActive: '0 0 0 2px rgba(24, 160, 88, 0.2)',
        boxShadowFocus: '0 0 0 2px rgba(24, 160, 88, 0.2)',
        caretColor: '#18a058'
      },
      InternalSelectMenu: {
        optionTextColor: '#1a1a1a',
        optionTextColorActive: '#18a058',
        optionTextColorHover: '#1a1a1a',
        optionColorHover: '#f3f4f6',
        optionColorActive: 'rgba(24, 160, 88, 0.1)',
        color: '#ffffff'
      }
    }
  },
  Slider: {
    fillColor: '#1a1a1a',
    fillColorHover: '#333333',
    dotColor: '#1a1a1a',
    dotColorModal: '#1a1a1a',
    dotColorPopover: '#1a1a1a',
    handleColor: '#1a1a1a',
    indicatorColor: '#1a1a1a',
    indicatorTextColor: '#ffffff',
    railColor: '#e0e0e0',
    railColorHover: '#d0d0d0',
    dotBorder: '2px solid #1a1a1a',
    dotBorderActive: '2px solid #1a1a1a',
    dotBoxShadow: '0 0 0 2px rgba(26, 26, 26, 0.2)'
  },
  Tooltip: {
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    color: '#333333',
    textColor: '#ffffff'
  }
}
</script>
