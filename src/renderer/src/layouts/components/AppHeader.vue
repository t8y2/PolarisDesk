<template>
  <header class="app-header bg-black/95 backdrop-blur-md p-3 shadow-sm border-b border-neutral-800">
    <div class="drag-region h-10 w-100% absolute top-0 lef-0 right-0"></div>
    <div class="flex justify-between items-center">
      <div class="flex-1"></div>
      <h1 class="app-title text-xl font-bold text-white z-1000 select-none">PolarisDesk</h1>
      <div class="flex-1 flex justify-end items-center space-x-2">
        <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="500">
          <template #trigger>
            <n-button circle class="no-drag" @click="startNewConversation">
              <template #icon>
                <n-icon size="16">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('header.newConversation') }}
        </n-tooltip>
        <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="500">
          <template #trigger>
            <n-button circle class="no-drag" @click="toggleHistoryPanel">
              <template #icon>
                <n-icon size="16">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
                  </svg>
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('header.history') }}
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="500">
          <template #trigger>
            <n-button circle class="no-drag" @click="() => openSettings()">
              <template #icon>
                <n-icon size="16">
                  <Settings />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('header.settings') }}
        </n-tooltip>
        <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="500">
          <template #trigger>
            <n-button circle class="no-drag" @click="switchToFloating">
              <template #icon>
                <n-icon size="16">
                  <Launch />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('header.switchToFloating') }}
        </n-tooltip>
        <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="500">
          <template #trigger>
            <n-button circle class="no-drag privacy-mode-button" :class="{ 'privacy-active': chatStore.isPrivateMode }" @click="togglePrivateMode">
              <template #icon>
                <n-icon size="16">
                  <ViewOff />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ chatStore.isPrivateMode ? t('header.privacyModeActive') : t('header.privacyMode') }}
        </n-tooltip>
        <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="500">
          <template #trigger>
            <n-button circle class="no-drag" :type="isPinned ? 'warning' : 'default'" @click="togglePin">
              <template #icon>
                <n-icon size="16">
                  <Pin />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ isPinned ? t('header.unpin') : t('header.pin') }}
        </n-tooltip>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <n-modal v-model:show="showSettings" preset="card" :title="t('settings.title')" class="w-200 select-none" @after-enter="handleModalAfterEnter">
      <n-tabs v-model:value="activeTab" type="segment" size="small" animated>
        <!-- 模型设置标签页 -->
        <n-tab-pane name="model" :tab="t('settings.modelSettings')">
          <n-form :model="localSettings" label-placement="left" label-width="200px" size="small">
            <!-- 连接设置 -->
            <div>
              <h4 class="settings-section-title text-sm font-semibold text-white mb-3">{{ t('settings.connectionSettings') }}</h4>

              <!-- 服务商选择 -->
              <n-form-item :label="t('settings.provider')">
                <n-select v-model:value="localSettings.provider" :options="providerOptions" round @update:value="handleProviderChange" />
              </n-form-item>

              <!-- 模型选择 -->
              <n-form-item :label="t('settings.model')">
                <n-input v-model:value="localSettings.model" round :placeholder="t('settings.modelPlaceholder')" />
                <template #feedback>
                  <div class="text-xs text-gray-400 mt-1">{{ t('settings.modelTip') }}</div>
                </template>
              </n-form-item>

              <!-- API配置 -->
              <n-form-item :label="t('settings.apiUrl')">
                <n-input v-model:value="localSettings.apiUrl" round placeholder="https://api.openai.com/v1/chat/completions" />
              </n-form-item>

              <!-- API Key -->
              <n-form-item v-if="currentProviderConfig.requiresApiKey" :label="t('settings.apiKeyRequired')">
                <n-input v-model:value="localSettings.apiKey" round type="password" :placeholder="`${currentProviderConfig.name} API密钥`" show-password-on="click" class="mr-2" />
                <n-button v-if="localSettings.provider === 'zhipu'" type="primary" ghost @click="openExternalUrl('https://bigmodel.cn/usercenter/proj-mgmt/apikeys')">{{ t('settings.getKey') }}</n-button>
                <n-button v-else-if="localSettings.provider === 'openai'" type="primary" ghost @click="openExternalUrl('https://platform.openai.com/api-keys')">{{ t('settings.getKey') }}</n-button>
                <n-button v-else-if="localSettings.provider === 'anthropic'" type="primary" ghost @click="openExternalUrl('https://console.anthropic.com/settings/keys')">{{ t('settings.getKey') }}</n-button>
                <n-button v-else-if="localSettings.provider === 'google'" type="primary" ghost @click="openExternalUrl('https://aistudio.google.com/app/apikey')">{{ t('settings.getKey') }}</n-button>
                <n-button v-else-if="localSettings.provider === 'deepseek'" type="primary" ghost @click="openExternalUrl('https://platform.deepseek.com/api_keys')">{{ t('settings.getKey') }}</n-button>
                <n-button v-else-if="localSettings.provider === 'moonshot'" type="primary" ghost @click="openExternalUrl('https://platform.moonshot.cn/console/api-keys')">{{ t('settings.getKey') }}</n-button>
                <n-button v-else-if="localSettings.provider === 'openrouter'" type="primary" ghost @click="openExternalUrl('https://openrouter.ai/keys')">{{ t('settings.getKey') }}</n-button>
                <n-button v-else-if="localSettings.provider === 'siliconcloud'" type="primary" ghost @click="openExternalUrl('https://cloud.siliconflow.cn/account/ak')">{{ t('settings.getKey') }}</n-button>
              </n-form-item>

              <!-- 服务商说明 -->
              <n-alert v-if="currentProviderConfig.description" type="info" size="small" class="mb-3">
                {{ currentProviderConfig.description }}
              </n-alert>
            </div>

            <!-- 生成参数 -->
            <div>
              <h4 class="settings-section-title text-sm font-semibold text-white mb-3">{{ t('settings.generationParams') }}</h4>
              <div class="grid grid-cols-2 gap-y-0">
                <n-form-item label="max_tokens">
                  <n-input-number v-model:value="localSettings.maxTokens" round :min="1" :max="81920" class="w-full" :placeholder="t('settings.maxTokens')" />
                </n-form-item>
                <n-form-item label="temperature">
                  <n-input-number v-model:value="localSettings.temperature" round :min="0" :max="2" :step="0.1" class="w-full" :placeholder="t('settings.temperature')" />
                </n-form-item>
                <n-form-item label="top_p">
                  <n-input-number v-model:value="localSettings.topP" round :min="0" :max="1" :step="0.1" class="w-full" :placeholder="t('settings.topP')" />
                </n-form-item>
                <n-form-item :label="t('settings.historyTurns')">
                  <n-tooltip trigger="hover" placement="top" :show-arrow="false" :delay="500">
                    <template #trigger>
                      <n-input-number v-model:value="localSettings.historyTurns" round :min="0" :max="10" :step="1" class="w-full" />
                    </template>
                    {{ t('settings.historyTurnsTip') }}
                  </n-tooltip>
                </n-form-item>
              </div>
            </div>
          </n-form>
        </n-tab-pane>

        <!-- 应用设置标签页 -->
        <n-tab-pane name="app" :tab="t('settings.appSettings')">
          <n-form :model="localSettings" label-placement="left" size="small">
            <!-- 界面设置 -->
            <div>
              <h4 class="settings-section-title text-sm font-semibold text-white mb-3">{{ t('settings.generalSettings') }}</h4>
              <div class="flex flex-wrap justify-between gap-y-2 ml-8">
                <n-form-item :label="t('settings.language')">
                  <n-select v-model:value="localSettings.language" :options="languageOptions" style="width: 140px" />
                </n-form-item>
                <n-form-item :label="t('settings.theme')">
                  <n-select v-model:value="localSettings.theme" :options="themeOptions" style="width: 140px" />
                </n-form-item>
                <n-form-item :label="t('settings.defaultExpandThink')">
                  <n-switch v-model:value="localSettings.defaultExpandThink" :rail-style="switchRailStyle" />
                </n-form-item>
                <n-form-item :label="t('settings.starryBackground')">
                  <n-switch v-model:value="localSettings.starryBackground" :rail-style="switchRailStyle" />
                </n-form-item>
                <n-form-item :label="t('settings.autoExecuteCommands')">
                  <n-switch v-model:value="localSettings.autoExecuteCommands" :rail-style="switchRailStyle" />
                </n-form-item>
                <n-form-item :label="t('settings.autoScreenshot')">
                  <n-tooltip trigger="hover" placement="top" :show-arrow="false" :delay="300">
                    <template #trigger>
                      <n-switch v-model:value="localSettings.autoScreenshot" :rail-style="switchRailStyle" />
                    </template>
                    {{ t('settings.autoScreenshotTip') }}
                  </n-tooltip>
                </n-form-item>
                <n-form-item :label="t('settings.enableUITree')">
                  <n-tooltip trigger="hover" placement="top" :show-arrow="false" :delay="300">
                    <template #trigger>
                      <n-switch v-model:value="localSettings.enableUITree" :rail-style="switchRailStyle" />
                    </template>
                    {{ t('settings.enableUITreeTip') }}
                  </n-tooltip>
                </n-form-item>
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2 ml-8">
                <n-form-item :label="t('settings.userMessageWidth')">
                  <n-slider v-model:value="localSettings.userMessageWidth" :min="50" :max="100" :step="5" :format-tooltip="value => `${value}%`" style="width: 100%" />
                </n-form-item>
                <n-form-item :label="t('settings.aiMessageWidth')">
                  <n-slider v-model:value="localSettings.aiMessageWidth" :min="50" :max="100" :step="5" :format-tooltip="value => `${value}%`" style="width: 100%" />
                </n-form-item>
                <n-form-item :label="t('settings.windowOpacity')" class="col-span-2">
                  <n-slider v-model:value="localSettings.windowOpacity" :min="50" :max="100" :step="5" :format-tooltip="value => `${value}%`" style="width: 100%" @update:value="handleOpacityChange" />
                </n-form-item>
              </div>
            </div>

            <!-- 快捷键设置 -->
            <div>
              <h4 class="settings-section-title text-sm font-semibold text-white mb-3">{{ t('settings.shortcuts') }}</h4>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                <div class="flex justify-between items-center text-sm">
                  <span>{{ t('settings.quickScreenshot') }}</span>
                  <n-tag size="small" type="info" class="mr-10">Cmd+Shift+S</n-tag>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span>{{ t('settings.quickSwitchWindow') }}</span>
                  <n-tag size="small" type="info" class="mr-10">Cmd+Shift+C</n-tag>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span>{{ t('settings.newConversation') }}</span>
                  <n-tag size="small" type="info" class="mr-10">Cmd+Shift+N</n-tag>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span>{{ t('settings.regionScreenshot') }}</span>
                  <n-tag size="small" type="info" class="mr-10">Cmd+Shift+X</n-tag>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span>{{ t('settings.openHistory') }}</span>
                  <n-tag size="small" type="info" class="mr-10">Cmd+Shift+H</n-tag>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span>{{ t('settings.sendMessage') }}</span>
                  <n-tag size="small" type="info" class="mr-10">Enter</n-tag>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span>{{ t('settings.lineBreak') }}</span>
                  <n-tag size="small" type="info" class="mr-10">Shift+Enter</n-tag>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span>{{ t('settings.pasteImage') }}</span>
                  <n-tag size="small" type="info" class="mr-10">Cmd+V</n-tag>
                </div>
              </div>
            </div>
          </n-form>
        </n-tab-pane>

        <!-- 系统提示词标签页 -->
        <n-tab-pane name="system" :tab="t('settings.systemPromptTab')">
          <n-scrollbar style="max-height: 500px">
            <n-form :model="localSettings" label-placement="top" size="small">
              <!-- 人设预设管理 -->
              <div class="persona-section">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h4 class="settings-section-title text-base font-semibold text-white">{{ t('settings.personaPresets') }}</h4>
                    <div class="text-xs text-gray-400 mt-1">{{ t('settings.personaPresetsDesc') }}</div>
                  </div>
                  <n-button size="small" type="primary" @click="showAddPersonaModal = true">
                    <template #icon>
                      <n-icon>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                      </n-icon>
                    </template>
                    {{ t('settings.addPersona') }}
                  </n-button>
                </div>

                <!-- 当前激活的人设 -->
                <div v-if="localSettings.activePersonaId" class="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-xs text-blue-300 mb-1">{{ t('settings.activePersona') }}</div>
                      <div class="text-base text-white font-medium">{{ getActivePersonaName() }}</div>
                    </div>
                    <n-button size="small" @click="handleActivatePersona(localSettings.activePersonaId!)">
                      {{ t('settings.deactivatePersona') }}
                    </n-button>
                  </div>
                </div>

                <!-- 内置人设列表 -->
                <div class="mb-4">
                  <div class="text-sm text-gray-300 font-medium mb-2">{{ t('settings.builtInPersonas') }}</div>
                  <div class="grid grid-cols-3 gap-3">
                    <div v-for="persona in builtInPersonas" :key="persona.id" class="persona-card" :class="{ active: localSettings.activePersonaId === persona.id }" @click="handleActivatePersona(persona.id)">
                      <div class="persona-name">{{ persona.name }}</div>
                      <div class="persona-desc">{{ persona.description }}</div>
                    </div>
                  </div>
                </div>

                <!-- 自定义人设列表 -->
                <div v-if="customPersonas.length > 0" class="mb-4">
                  <div class="text-sm text-gray-300 font-medium mb-2">{{ t('settings.customPersonas') }}</div>
                  <div class="grid grid-cols-1 gap-3">
                    <div v-for="persona in customPersonas" :key="persona.id" class="persona-card custom" :class="{ active: localSettings.activePersonaId === persona.id }">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="persona-name">{{ persona.name }}</div>
                          <div class="persona-desc">{{ persona.description }}</div>
                        </div>
                        <div class="persona-actions">
                          <n-button size="tiny" @click.stop="handleActivatePersona(persona.id)">
                            {{ localSettings.activePersonaId === persona.id ? t('settings.deactivatePersona') : t('settings.activatePersona') }}
                          </n-button>
                          <n-button size="tiny" @click.stop="handleEditPersona(persona)">{{ t('settings.editPersona') }}</n-button>
                          <n-button size="tiny" type="error" @click.stop="handleDeletePersona(persona)">{{ t('settings.deletePersona') }}</n-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分隔线 -->
              <n-divider class="my-6" />

              <!-- 自定义系统提示词 -->
              <div class="system-prompt-section">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="settings-section-title text-base font-semibold text-white">{{ t('settings.systemPromptLabel') }}</h4>
                  <span v-if="localSettings.activePersonaId" class="text-xs text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded">{{ t('settings.personaActiveHint') }}</span>
                </div>
                <n-input v-model:value="localSettings.systemPrompt" type="textarea" :rows="8" :placeholder="t('settings.systemPromptPlaceholder')" class="w-full" clearable :disabled="!!localSettings.activePersonaId" />
                <div class="text-xs text-gray-400 mt-2 space-y-1">
                  <div>💡 {{ t('settings.systemPromptTip1') }}</div>
                  <div>💡 {{ t('settings.systemPromptTip2') }}</div>
                  <div>💡 {{ t('settings.systemPromptTip3') }}</div>
                </div>
              </div>
            </n-form>
          </n-scrollbar>
        </n-tab-pane>

        <!-- 关于标签页 -->
        <n-tab-pane name="about" :tab="t('settings.aboutTab')">
          <n-form label-placement="left" label-width="120px" size="small">
            <n-form-item :label="t('settings.appName')">
              <n-text>PolarisDesk</n-text>
            </n-form-item>
            <n-form-item :label="t('settings.currentVersion')">
              <n-text>{{ appVersion }}</n-text>
            </n-form-item>
            <n-form-item :label="t('settings.githubRepo')">
              <n-button text tag="a" href="https://github.com/t8y2/PolarisDesk" target="_blank" type="primary">
                <template #icon>
                  <n-icon>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" />
                    </svg>
                  </n-icon>
                </template>
                t8y2/PolarisDesk
              </n-button>
            </n-form-item>
            <n-divider />
            <n-form-item :label="t('settings.checkUpdate')">
              <div class="flex gap-2 items-center w-full">
                <n-button :loading="updateChecking" :disabled="updateChecking" @click="checkForUpdates">
                  {{ updateChecking ? t('settings.checking') : t('settings.checkUpdate') }}
                </n-button>
                <n-text v-if="updateMessage" :type="updateMessageType">{{ updateMessage }}</n-text>
              </div>
            </n-form-item>
            <n-form-item v-if="updateAvailable" :label="t('settings.newVersion')">
              <div class="flex flex-col gap-2">
                <n-text>{{ updateInfo.version }}</n-text>
                <n-button v-if="!updateDownloading && !updateDownloaded" type="primary" @click="downloadUpdate">{{ t('settings.downloadUpdate') }}</n-button>
                <div v-if="updateDownloading" class="flex flex-col gap-2">
                  <n-progress type="line" :percentage="downloadProgress" />
                  <n-text depth="3" class="text-xs">{{ t('settings.downloading') }} {{ downloadProgress.toFixed(1) }}%</n-text>
                </div>
                <n-button v-if="updateDownloaded" type="success" @click="installUpdate">{{ t('settings.restartAndInstall') }}</n-button>
              </div>
            </n-form-item>
            <n-divider />
            <div class="text-xs text-gray-400">
              <p class="mb-2">{{ t('settings.updateNotes') }}</p>
              <ul class="list-disc list-inside space-y-1">
                <li>{{ t('settings.updateNote1') }}</li>
                <li>{{ t('settings.updateNote2') }}</li>
                <li>{{ t('settings.updateNote3') }}</li>
              </ul>
            </div>
          </n-form>
        </n-tab-pane>
      </n-tabs>
      <template #footer>
        <div class="flex justify-end space-x-2 pt-0! mt-0!">
          <n-button @click="cancelSettings">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" @click="saveSettings">{{ t('common.save') }}</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 添加/编辑人设模态框 -->
    <n-modal v-model:show="showAddPersonaModal" preset="card" :title="editingPersona ? t('settings.editPersona') : t('settings.addPersona')" class="w-160 select-none">
      <n-form ref="personaFormRef" :model="personaForm" :rules="personaFormRules" label-placement="top" size="small">
        <n-form-item :label="t('settings.personaName')" path="name">
          <n-input v-model:value="personaForm.name" :placeholder="t('settings.personaNamePlaceholder')" />
        </n-form-item>
        <n-form-item :label="t('settings.personaDescription')" path="description">
          <n-input v-model:value="personaForm.description" :placeholder="t('settings.personaDescPlaceholder')" />
        </n-form-item>
        <n-form-item :label="t('settings.personaPrompt')" path="prompt">
          <n-input v-model:value="personaForm.prompt" type="textarea" :rows="8" :placeholder="t('settings.personaPromptPlaceholder')" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="flex justify-end space-x-2">
          <n-button @click="showAddPersonaModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" @click="handleSavePersona">{{ t('common.save') }}</n-button>
        </div>
      </template>
    </n-modal>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { NButton, NIcon, NTooltip, NModal, NForm, NFormItem, NInput, NInputNumber, NSwitch, NSlider, NTabs, NTabPane, NTag, NSelect, NAlert, NText, NProgress, NDivider, NScrollbar, useMessage, useDialog, type FormInst, type FormRules } from 'naive-ui'
import { Settings, Launch, Pin, ViewOff } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '../../stores/chatStore'
import { useSettingsStore, type AppSettings, type PersonaPreset } from '../../stores/settingsStore'
import { PROVIDERS, type ProviderType } from '../../utils/providerConfig'
import { logger } from '../../utils/logger'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()
const chatStore = useChatStore()
const settingsStore = useSettingsStore()

// 应用版本号
const appVersion = ref('v1.0.1')

// 更新相关状态
const updateChecking = ref(false)
const updateAvailable = ref(false)
const updateDownloading = ref(false)
const updateDownloaded = ref(false)
const updateMessage = ref('')
const updateMessageType = ref<'success' | 'error' | 'warning' | 'info'>('info')
const updateInfo = ref<{ version: string }>({ version: '' })
const downloadProgress = ref(0)

// Switch 开关样式
const switchRailStyle = ({ checked }: { focused: boolean; checked: boolean }): Record<string, string> => {
  const style: Record<string, string> = {}
  if (checked) {
    style.background = '#18a058' // 绿色
  } else {
    style.background = '#606266' // 灰色
  }
  return style
}

// 设置相关
const showSettings = ref(false)
const activeTab = ref('model') // 默认显示模型设置标签页
const isPinned = ref(false)

// 创建本地的设置副本，用于表单绑定
const localSettings = ref<AppSettings>({} as AppSettings)

// 保存原始设置，用于取消时恢复
const originalSettings = ref<AppSettings>({} as AppSettings)

// 服务商选项
const providerOptions = computed(() => {
  return Object.entries(PROVIDERS).map(([key, config]) => ({
    label: config.name,
    value: key as ProviderType
  }))
})

// 语言选项
const languageOptions = [
  { label: '简体中文', value: 'zh' },
  { label: 'English', value: 'en' }
]

// 主题选项
const themeOptions = computed(() => [
  { label: t('settings.themes.dark'), value: 'dark' },
  { label: t('settings.themes.light'), value: 'light' }
])

// 当前服务商配置
const currentProviderConfig = computed(() => {
  return PROVIDERS[localSettings.value.provider || 'zhipu']
})

// 人设预设相关
const showAddPersonaModal = ref(false)
const editingPersona = ref<PersonaPreset | null>(null)
const personaFormRef = ref<FormInst | null>(null)
const personaForm = ref({
  name: '',
  description: '',
  prompt: ''
})

const personaFormRules: FormRules = {
  name: [{ required: true, message: () => t('settings.personaNameRequired'), trigger: 'blur' }],
  prompt: [{ required: true, message: () => t('settings.personaPromptRequired'), trigger: 'blur' }]
}

const builtInPersonas = computed(() => {
  return localSettings.value.personaPresets?.filter(p => p.isBuiltIn) || []
})

const customPersonas = computed(() => {
  return localSettings.value.personaPresets?.filter(p => !p.isBuiltIn) || []
})

function getActivePersonaName(): string {
  if (!localSettings.value.activePersonaId) {
    return t('settings.noActivePersona')
  }
  const persona = localSettings.value.personaPresets?.find(p => p.id === localSettings.value.activePersonaId)
  return persona ? persona.name : t('settings.noActivePersona')
}

function handleActivatePersona(id: string): void {
  if (localSettings.value.activePersonaId === id) {
    // 取消激活
    localSettings.value.activePersonaId = null
    localSettings.value.systemPrompt = ''
    message.success(t('settings.personaDeactivated'))
  } else {
    // 激活人设
    const persona = localSettings.value.personaPresets?.find(p => p.id === id)
    if (persona) {
      localSettings.value.activePersonaId = id
      localSettings.value.systemPrompt = persona.prompt
      message.success(t('settings.personaActivated', { name: persona.name }))
    }
  }
}

function handleEditPersona(persona: PersonaPreset): void {
  editingPersona.value = persona
  personaForm.value = {
    name: persona.name,
    description: persona.description,
    prompt: persona.prompt
  }
  showAddPersonaModal.value = true
}

function handleDeletePersona(persona: PersonaPreset): void {
  dialog.warning({
    title: t('settings.confirmDeletePersona'),
    content: t('settings.confirmDeletePersonaContent', { name: persona.name }),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: () => {
      const index = localSettings.value.personaPresets.findIndex(p => p.id === persona.id)
      if (index !== -1) {
        localSettings.value.personaPresets.splice(index, 1)
        if (localSettings.value.activePersonaId === persona.id) {
          localSettings.value.activePersonaId = null
          localSettings.value.systemPrompt = ''
        }
        message.success(t('settings.personaDeleted'))
      }
    }
  })
}

async function handleSavePersona(): Promise<void> {
  try {
    await personaFormRef.value?.validate()

    if (editingPersona.value) {
      // 更新现有人设
      const index = localSettings.value.personaPresets.findIndex(p => p.id === editingPersona.value!.id)
      if (index !== -1) {
        localSettings.value.personaPresets[index] = {
          ...localSettings.value.personaPresets[index],
          name: personaForm.value.name,
          description: personaForm.value.description,
          prompt: personaForm.value.prompt
        }
        // 如果当前激活的是这个人设，也更新 systemPrompt
        if (localSettings.value.activePersonaId === editingPersona.value.id) {
          localSettings.value.systemPrompt = personaForm.value.prompt
        }
        message.success(t('settings.personaUpdated'))
      }
    } else {
      // 添加新人设
      const newPersona: PersonaPreset = {
        id: `custom_${Date.now()}`,
        name: personaForm.value.name,
        description: personaForm.value.description,
        prompt: personaForm.value.prompt,
        isBuiltIn: false
      }
      if (!localSettings.value.personaPresets) {
        localSettings.value.personaPresets = []
      }
      localSettings.value.personaPresets.push(newPersona)
      message.success(t('settings.personaAdded'))
    }

    showAddPersonaModal.value = false
    editingPersona.value = null
    personaForm.value = { name: '', description: '', prompt: '' }
  } catch {
    // 验证失败，不关闭对话框
  }
}

// 当打开添加人设对话框时重置表单（暂未使用，保留供将来扩展）
// function resetPersonaForm(): void {
//   editingPersona.value = null
//   personaForm.value = { name: '', description: '', prompt: '' }
// }

// 处理服务商切换
function handleProviderChange(provider: ProviderType): void {
  const config = PROVIDERS[provider]

  logger.info(`切换服务商: ${config.name}`)

  // 更新相关配置
  localSettings.value.apiUrl = config.apiUrl
  localSettings.value.model = config.defaultModel
  localSettings.value.maxTokens = config.maxTokens
  localSettings.value.temperature = config.temperature
  localSettings.value.topP = config.topP

  message.info(t('messages.providerSwitched', { provider: config.name }), { duration: 3000 })
}

// 处理透明度变化 - 实时预览
function handleOpacityChange(value: number): void {
  if (window.api?.setWindowOpacity) {
    window.api.setWindowOpacity(value)
  }
}

// 打开设置时保存当前设置并创建本地副本
function openSettings(tab?: string): void {
  // 如果指定了标签页，则切换到该标签页
  if (tab) {
    activeTab.value = tab
  } else {
    // 确保默认显示模型设置标签页
    activeTab.value = 'model'
  }

  // 获取当前设置的副本
  const currentSettings = settingsStore.getSettingsCopy()

  // 保存原始设置用于取消恢复
  originalSettings.value = JSON.parse(JSON.stringify(currentSettings))

  // 创建本地副本用于表单绑定
  localSettings.value = JSON.parse(JSON.stringify(currentSettings))

  showSettings.value = true
  logger.debug('打开设置面板', { tab })
}

// 模态框进入动画完成后的回调 - 自动聚焦到第一个输入框
function handleModalAfterEnter(): void {
  nextTick(() => {
    setTimeout(() => {
      const modalElement = document.querySelector('.n-modal') as HTMLElement
      if (modalElement) {
        // 尝试聚焦到第一个可见的输入框或选择框
        const firstInput = modalElement.querySelector('.n-tab-pane:not([style*="display: none"]) .n-select, .n-tab-pane:not([style*="display: none"]) input:not([type="hidden"]):not([disabled])') as HTMLElement
        if (firstInput) {
          firstInput.focus()
          logger.debug('已自动聚焦到第一个输入元素')
        }
      }
    }, 100)
  })
}

// 取消设置时恢复原始设置
function cancelSettings(): void {
  // 恢复到原始设置
  settingsStore.restoreFromCopy(originalSettings.value)

  // 同步更新本地设置副本，确保界面显示正确
  localSettings.value = JSON.parse(JSON.stringify(originalSettings.value))

  showSettings.value = false
  logger.debug('取消设置，已恢复原始配置')
}

// 设置相关功能
function loadSettings(): void {
  try {
    // 使用设置 Store 自动加载设置
    settingsStore.loadSettings()
    logger.success('设置加载完成')
  } catch (error) {
    logger.error('加载设置失败', error)
  }
}

function saveSettings(): void {
  try {
    // 先将本地设置副本的更改同步到设置存储
    settingsStore.updateSettings(localSettings.value)

    // 然后保存设置
    settingsStore.saveSettings()
    message.success(t('messages.settingsSaved'), { duration: 2000 })
    showSettings.value = false
    logger.success('设置已保存', {
      provider: localSettings.value.provider,
      model: localSettings.value.model
    })
  } catch (error) {
    logger.error('保存设置失败', error)
    message.error(t('error.saveSettingsFailed'))
  }
}

async function startNewConversation(): Promise<void> {
  await chatStore.startNewConversation()
  message.success(t('messages.newConversationStarted'), { duration: 1500 })
}

// 打开外部链接
async function openExternalUrl(url: string): Promise<void> {
  try {
    if (window.api?.openExternal) {
      await window.api.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  } catch (error) {
    console.error('打开页面失败:', error)
    message.error(t('messages.cannotOpenBrowser'))
  }
}

// 切换历史面板
function toggleHistoryPanel(): void {
  if (typeof window !== 'undefined' && (window as Record<string, unknown>).__toggleHistoryPanel) {
    const currentValue = ((window as Record<string, unknown>).__getHistoryPanelState as (() => boolean) | undefined)?.() || false
    ;((window as Record<string, unknown>).__toggleHistoryPanel as (show: boolean) => void)(!currentValue)
  }
}

function switchToFloating(): void {
  if (window.api?.switchToFloating) {
    window.api.switchToFloating()
  }
}

// 切换隐私模式
function togglePrivateMode(): void {
  message.destroyAll() // 清空所有现有的提示
  chatStore.togglePrivateMode()

  if (chatStore.isPrivateMode) {
    message.success(t('messages.privacyModeEnabled'), { duration: 2000 })
  } else {
    message.info(t('messages.privacyModeDisabled'), { duration: 1500 })
  }
}

// 置顶功能
async function togglePin(): Promise<void> {
  try {
    if (window.api?.toggleAlwaysOnTop) {
      // 记录当前状态，用于显示正确的操作提示
      const currentPinState = isPinned.value
      const newState = await window.api.toggleAlwaysOnTop()
      isPinned.value = newState

      // 根据用户执行的操作显示消息（而不是结果状态）
      if (currentPinState) {
        message.success(t('messages.windowUnpinned'), { duration: 1500 })
      } else {
        message.success(t('messages.windowPinned'), { duration: 1500 })
      }
    }
  } catch (error) {
    console.error('切换置顶状态失败:', error)
    message.error(t('common.error'))
  }
}

// 更新相关方法
async function checkForUpdates(): Promise<void> {
  try {
    updateChecking.value = true
    updateMessage.value = ''
    if (window.api?.updater?.checkForUpdates) {
      await window.api.updater.checkForUpdates()
      logger.info('开始检查更新')
    } else {
      updateMessage.value = '更新功能不可用'
      updateMessageType.value = 'error'
    }
  } catch (error) {
    logger.error('检查更新失败', error)
    updateMessage.value = '检查更新失败'
    updateMessageType.value = 'error'
    updateChecking.value = false
  }
}

async function downloadUpdate(): Promise<void> {
  try {
    if (window.api?.updater?.downloadUpdate) {
      await window.api.updater.downloadUpdate()
      logger.info('开始下载更新')
    }
  } catch (error) {
    logger.error('下载更新失败', error)
    message.error('下载更新失败')
  }
}

async function installUpdate(): Promise<void> {
  try {
    if (window.api?.updater?.quitAndInstall) {
      await window.api.updater.quitAndInstall()
      logger.info('安装更新')
    }
  } catch (error) {
    logger.error('安装更新失败', error)
    message.error('安装更新失败')
  }
}

// 处理更新状态
function handleUpdateStatus(event: Record<string, unknown>): void {
  logger.info('更新状态', event)

  switch (event.type) {
    case 'checking-for-update':
      updateChecking.value = true
      updateMessage.value = t('messages.checking')
      updateMessageType.value = 'info'
      break
    case 'update-available':
      updateChecking.value = false
      updateAvailable.value = true
      updateInfo.value = { version: event.version as string }
      updateMessage.value = t('messages.updateAvailable', { version: event.version as string })
      updateMessageType.value = 'success'
      break
    case 'update-not-available':
      updateChecking.value = false
      updateMessage.value = t('messages.latestVersion')
      updateMessageType.value = 'info'
      break
    case 'download-progress':
      updateDownloading.value = true
      downloadProgress.value = (event.percent as number) || 0
      break
    case 'update-downloaded':
      updateDownloading.value = false
      updateDownloaded.value = true
      updateMessage.value = t('messages.updateDownloadedReady')
      updateMessageType.value = 'success'
      message.success(t('messages.updateDownloaded'), { duration: 3000 })
      break
    case 'error':
      updateChecking.value = false
      updateDownloading.value = false
      updateMessage.value = (event.message as string) || t('messages.updateFailed')
      updateMessageType.value = 'error'
      message.error((event.message as string) || t('messages.updateFailed'))
      break
  }
}

// 获取当前置顶状态
async function checkPinStatus(): Promise<void> {
  try {
    if (window.api?.getAlwaysOnTopStatus) {
      isPinned.value = await window.api.getAlwaysOnTopStatus()
    }
  } catch (error) {
    console.error('获取置顶状态失败:', error)
  }
}

// 监听置顶状态刷新请求
function setupPinStatusListener(): void {
  if (window.api?.onRefreshPinStatus) {
    window.api.onRefreshPinStatus(async () => {
      // 当收到刷新请求时，重新查询自己的置顶状态
      await checkPinStatus()
    })
  }
}

// 清理置顶状态监听器
function cleanupPinStatusListener(): void {
  if (window.api?.offRefreshPinStatus) {
    window.api.offRefreshPinStatus((): void => {})
  }
}

// 获取应用版本号
async function loadAppVersion(): Promise<void> {
  try {
    const windowWithApi = window as { api?: { getAppVersion?: () => Promise<string> } }
    if (windowWithApi.api?.getAppVersion) {
      const version = await windowWithApi.api.getAppVersion()
      appVersion.value = `v${version}`
    }
  } catch (error) {
    console.error('获取应用版本失败:', error)
    // 保持默认版本号
  }
}

// 监听来自悬浮窗的历史面板显示请求
function setupHistoryPanelListener(): void {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === 'polaris-show-history-panel' && event.newValue) {
      try {
        const data = JSON.parse(event.newValue) as { show: boolean }
        if (data.show && typeof window !== 'undefined' && (window as Record<string, unknown>).__toggleHistoryPanel) {
          ;((window as Record<string, unknown>).__toggleHistoryPanel as (show: boolean) => void)(true)
        }
      } catch (error) {
        console.error('解析历史面板显示请求失败:', error)
      }
    }
  })
}

// 监听全局快捷键事件
function setupGlobalShortcutListeners(): void {
  // 使用 IPC 事件监听
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.on('trigger-new-conversation', (): void => {
      startNewConversation()
    })

    window.electron.ipcRenderer.on('trigger-history-panel', (): void => {
      toggleHistoryPanel()
    })
  }
}

// 清理全局快捷键监听器
function cleanupGlobalShortcutListeners(): void {
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.removeAllListeners('trigger-new-conversation')
    window.electron.ipcRenderer.removeAllListeners('trigger-history-panel')
    window.electron.ipcRenderer.removeAllListeners('trigger-quick-screenshot')
  }
}

onMounted(() => {
  loadSettings()
  loadAppVersion()
  checkPinStatus()
  setupPinStatusListener()
  setupHistoryPanelListener()
  setupGlobalShortcutListeners()

  // 监听更新状态
  if (window.api?.updater?.onUpdateStatus) {
    window.api.updater.onUpdateStatus(handleUpdateStatus)
  }

  // 暴露打开设置面板的方法到全局
  const windowWithMethod = window as Window & { __openSettingsPanel?: (tab?: string) => void }
  windowWithMethod.__openSettingsPanel = openSettings
})

onUnmounted(() => {
  cleanupPinStatusListener()
  cleanupGlobalShortcutListeners()

  // 清理更新状态监听
  if (window.api?.updater?.offUpdateStatus) {
    window.api.updater.offUpdateStatus(handleUpdateStatus)
  }

  // 清理全局方法
  const windowWithMethod = window as Window & { __openSettingsPanel?: (tab?: string) => void }
  delete windowWithMethod.__openSettingsPanel
})
</script>

<style scoped>
.drag-region {
  -webkit-app-region: drag;
}

/* 确保按钮等交互元素可以点击 */
.drag-region button,
.drag-region input,
.drag-region select,
.drag-region textarea,
.no-drag {
  -webkit-app-region: no-drag;
}

/* 紧凑的表单样式 */
:deep(.n-form-item) {
  margin-bottom: 2px !important;
}

:deep(.n-form-item:last-child) {
  margin-bottom: 0 !important;
}

/* 进一步减少网格布局中的间距 */
:deep(.grid .n-form-item) {
  margin-bottom: 1px !important;
}

/* 减少模态框内容与底部的间距 */
:deep(.n-card__content) {
  padding-bottom: 8px !important;
}

/* 隐私模式按钮样式 */
.privacy-mode-button {
  transition: all 0.3s ease;
}

.privacy-mode-button.privacy-active {
  background: linear-gradient(135deg, #9333ea, #7e22ce) !important;
  border-color: #a78bfa !important;
  color: white !important;
}

.privacy-mode-button.privacy-active:hover {
  background: linear-gradient(135deg, #a855f7, #9333ea) !important;
  border-color: #c4b5fd !important;
  transform: scale(1.05);
}

.privacy-mode-button.privacy-active :deep(.n-button__icon) {
  color: white !important;
}

/* 浅色主题样式 */
body[data-theme='light'] .app-header {
  background-color: #f7f7f7 !important;
  border-bottom-color: #d6d6d6 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
}

body[data-theme='light'] .app-title {
  color: #1a1a1a !important;
}

/* 浅色主题 - 设置面板标题 */
body[data-theme='light'] .settings-section-title {
  color: #1a1a1a !important;
}

/* 浅色主题 - 表单项文字 */
body[data-theme='light'] :deep(.n-form-item-label) {
  color: #1a1a1a !important;
}

/* 浅色主题 - 快捷键列表文字 */
body[data-theme='light'] .flex.justify-between.items-center span {
  color: #1a1a1a !important;
}

/* 浅色主题 - 提示文字 */
body[data-theme='light'] .text-gray-400 {
  color: #666666 !important;
}

/* 浅色主题 - 系统提示词说明框 */
body[data-theme='light'] .bg-blue-500\/20 {
  background-color: rgba(37, 99, 235, 0.1) !important;
  border-color: rgba(37, 99, 235, 0.3) !important;
}

body[data-theme='light'] .text-blue-300 {
  color: #2563eb !important;
}

/* 浅色主题 - 按钮图标颜色 */
body[data-theme='light'] :deep(.n-button) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.n-button .n-icon) {
  color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.n-button svg) {
  color: #1a1a1a !important;
  fill: currentColor !important;
}

body[data-theme='light'] :deep(.n-button--primary) {
  background-color: #1a1a1a !important;
  border-color: #1a1a1a !important;
  color: #ffffff !important;
}

body[data-theme='light'] :deep(.n-button--primary:hover) {
  background-color: #333333 !important;
  border-color: #333333 !important;
}

body[data-theme='light'] :deep(.n-button--primary .n-icon),
body[data-theme='light'] :deep(.n-button--primary svg) {
  color: #ffffff !important;
}

body[data-theme='light'] :deep(.n-button .n-button__icon),
body[data-theme='light'] :deep(.n-button .n-icon svg path) {
  fill: currentColor !important;
}

/* 浅色主题 - 滑动条 */
body[data-theme='light'] :deep(.n-slider .n-slider-rail) {
  background-color: #e0e0e0 !important;
}

body[data-theme='light'] :deep(.n-slider .n-slider-rail__fill) {
  background-color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.n-slider .n-slider-handle) {
  border-color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.n-slider .n-slider-handle__fill) {
  background-color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.n-slider .n-slider-dot) {
  border-color: #1a1a1a !important;
}

body[data-theme='light'] :deep(.n-slider .n-slider-dot--active) {
  background-color: #1a1a1a !important;
}

/* 人设卡片样式 */
.persona-card {
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
}

.persona-card:hover {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.persona-card.active {
  border-color: rgba(59, 130, 246, 0.8);
  background: rgba(59, 130, 246, 0.2);
}

.persona-card.custom {
  padding: 16px;
}

.persona-name {
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.persona-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.persona-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 人设和系统提示词区域 */
.persona-section,
.system-prompt-section {
  padding: 0 4px;
}

/* 浅色主题 - 人设卡片 */
body[data-theme='light'] .persona-card {
  border-color: rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.02);
}

body[data-theme='light'] .persona-card:hover {
  border-color: rgba(37, 99, 235, 0.5);
  background: rgba(37, 99, 235, 0.1);
}

body[data-theme='light'] .persona-card.active {
  border-color: rgba(37, 99, 235, 0.8);
  background: rgba(37, 99, 235, 0.15);
}

body[data-theme='light'] .persona-name {
  color: #1a1a1a;
}

body[data-theme='light'] .persona-desc {
  color: rgba(0, 0, 0, 0.6);
}
</style>
