<template>
  <transition name="floating-window">
    <div v-if="true" class="h-100vh w-full bg-black/90 rounded-lg border border-white/20 flex flex-col overflow-hidden backdrop-blur-10px shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div class="drag-region bg-white/10 px-2 py-1.5 border-b border-white/15 flex justify-between items-center text-xs text-white min-h-8">
        <div class="font-semibold text-white/90">PolarisDesk</div>
        <div class="no-drag flex gap-1">
          <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="300" size="small">
            <template #trigger>
              <button class="bg-white/10 border-none rounded text-white text-2.75 cursor-pointer px-1.5 py-1 transition-all-200 min-w-5 h-5 flex items-center justify-center hover:bg-green/60" @click="startNewConversation">
                <n-icon size="12">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </n-icon>
              </button>
            </template>
            <span class="tooltip-text">{{ t('floating.newConversation') }}</span>
          </n-tooltip>
          <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="300" size="small">
            <template #trigger>
              <button class="border-none rounded text-white text-2.75 cursor-pointer px-1.5 py-1 transition-all-200 min-w-5 h-5 flex items-center justify-center" :class="chatStore.isPrivateMode ? 'bg-purple/60 hover:bg-purple/80' : 'bg-white/10 hover:bg-white/20'" @click="togglePrivateMode">
                <n-icon size="12">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12,2C9.24,2 7,4.24 7,7C7,7.68 7.16,8.32 7.43,8.89L2.5,12.5C2.5,15.87 4.5,21 12,21C19.5,21 21.5,15.87 21.5,12.5L16.57,8.89C16.84,8.32 17,7.68 17,7C17,4.24 14.76,2 12,2M12,4C13.66,4 15,5.34 15,7C15,8.66 13.66,10 12,10C10.34,10 9,8.66 9,7C9,5.34 10.34,4 12,4M9,13A1,1 0 0,1 10,14A1,1 0 0,1 9,15A1,1 0 0,1 8,14A1,1 0 0,1 9,13M15,13A1,1 0 0,1 16,14A1,1 0 0,1 15,15A1,1 0 0,1 14,14A1,1 0 0,1 15,13Z" />
                  </svg>
                </n-icon>
              </button>
            </template>
            <span class="tooltip-text">{{ chatStore.isPrivateMode ? t('floating.privacyModeActive') : t('floating.privacyMode') }}</span>
          </n-tooltip>
          <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="300" size="small">
            <template #trigger>
              <button class="border-none rounded text-white text-2.75 cursor-pointer px-1.5 py-1 transition-all-200 min-w-5 h-5 flex items-center justify-center" :class="isPinned ? 'bg-orange/60 hover:bg-orange/80' : 'bg-white/10 hover:bg-white/20'" @click="togglePin">
                <n-icon size="12">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
                  </svg>
                </n-icon>
              </button>
            </template>
            <span class="tooltip-text">{{ isPinned ? t('floating.unpin') : t('floating.pin') }}</span>
          </n-tooltip>
          <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="300" size="small">
            <template #trigger>
              <button class="bg-white/10 border-none rounded text-white text-2.75 cursor-pointer px-1.5 py-1 transition-all-200 min-w-5 h-5 flex items-center justify-center hover:bg-white/20" @click="switchToMain">⛶</button>
            </template>
            <span class="tooltip-text">{{ t('floating.switchToMain') }}</span>
          </n-tooltip>
          <n-tooltip trigger="hover" placement="bottom" :show-arrow="false" :delay="300" size="small">
            <template #trigger>
              <button class="bg-white/10 border-none rounded text-white text-2.75 cursor-pointer px-1.5 py-1 transition-all-200 min-w-5 h-5 flex items-center justify-center hover:bg-red/60" @click="closeFloating">✕</button>
            </template>
            <span class="tooltip-text">{{ t('floating.close') }}</span>
          </n-tooltip>
        </div>
      </div>

      <div class="flex-1 flex flex-col overflow-hidden p-1.5 relative" :class="{ 'drag-over': isDragOver }" @dragover="handleDragOver" @dragenter="handleDragEnter" @dragleave="handleDragLeave" @drop="handleDrop">
        <!-- 拖拽提示层 -->
        <div v-if="isDragOver" class="drag-overlay-floating">
          <div class="drag-indicator-floating">
            <div class="drag-icon-floating">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <div class="drag-text-floating">
              <div class="drag-title-floating">{{ t('floating.releaseToUpload') }}</div>
              <div class="drag-subtitle-floating">{{ t('floating.supportedFormats') }}</div>
            </div>
          </div>
        </div>
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-0.5 flex flex-col gap-1 scrollbar scrollbar-w-1 scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 relative">
          <div v-for="(message, index) in chatStore.messages" :key="index" :class="[message.role === 'user' ? 'message-user' : 'message-ai']">
            <!-- 用户消息 -->
            <div v-if="message.role === 'user'" :title="t('floating.clickToSwitchMain')" @click="handleMessageClick(message)">
              <div v-if="message.image" class="mb-1 relative media-hover-container">
                <img :src="message.image" alt="截图" class="w-full h-auto rounded object-contain" />
                <!-- 媒体操作按钮 -->
                <div class="media-action-buttons">
                  <n-tooltip trigger="hover" placement="top" :show-arrow="false">
                    <template #trigger>
                      <button class="media-action-btn" @click.stop="reuseMedia(message.image, 'image')">
                        <n-icon size="14">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                          </svg>
                        </n-icon>
                      </button>
                    </template>
                    {{ t('floating.reuseImage') }}
                  </n-tooltip>
                  <n-tooltip trigger="hover" placement="top" :show-arrow="false">
                    <template #trigger>
                      <button class="media-action-btn" @click.stop="downloadMedia(message.image, 'image')">
                        <n-icon size="14">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                          </svg>
                        </n-icon>
                      </button>
                    </template>
                    {{ t('floating.downloadImage') }}
                  </n-tooltip>
                </div>
              </div>
              <div v-if="message.video" class="mb-1 relative media-hover-container">
                <VideoPlayer :src="message.video" :video-base64="message.videoBase64" class="w-full h-auto rounded object-contain" />
                <!-- 媒体操作按钮 -->
                <div class="media-action-buttons">
                  <n-tooltip trigger="hover" placement="top" :show-arrow="false">
                    <template #trigger>
                      <button class="media-action-btn" @click.stop="reuseMedia(message.video, 'video', message.videoBase64)">
                        <n-icon size="14">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                          </svg>
                        </n-icon>
                      </button>
                    </template>
                    {{ t('floating.reuseVideo') }}
                  </n-tooltip>
                  <n-tooltip trigger="hover" placement="top" :show-arrow="false">
                    <template #trigger>
                      <button class="media-action-btn" @click.stop="downloadMedia(message.video || message.videoBase64 || '', 'video')">
                        <n-icon size="14">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                          </svg>
                        </n-icon>
                      </button>
                    </template>
                    {{ t('floating.downloadVideo') }}
                  </n-tooltip>
                </div>
              </div>
              <div v-if="message.pdfImages && message.pdfImages.length > 0" class="mb-1 relative media-hover-container">
                <div class="bg-white/8 border border-white/15 rounded-1.5 px-2 py-1.5 flex items-center gap-2">
                  <div class="w-5 h-5">
                    <img src="@renderer/assets/icons/pdf3.svg" alt="PDF" class="w-full h-full" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-white/90 text-2.75 font-medium truncate">{{ message.pdfName || t('floating.pdfDocument') }} ({{ t('floating.pages', { count: message.pdfImages.length }) }})</div>
                  </div>
                </div>
                <!-- 媒体操作按钮 -->
                <div class="media-action-buttons">
                  <n-tooltip trigger="hover" placement="top" :show-arrow="false">
                    <template #trigger>
                      <button class="media-action-btn" @click.stop="reuseMedia(message.pdfImages, 'pdf', undefined, message.pdfName)">
                        <n-icon size="14">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                          </svg>
                        </n-icon>
                      </button>
                    </template>
                    {{ t('floating.reusePdf') }}
                  </n-tooltip>
                </div>
              </div>
              <div v-if="message.pptImages && message.pptImages.length > 0" class="mb-1 relative media-hover-container">
                <div class="bg-white/8 border border-white/15 rounded-1.5 px-2 py-1.5 flex items-center gap-2">
                  <div class="w-5 h-5">
                    <img src="@renderer/assets/icons/ppt3.svg" alt="PPT" class="w-full h-full" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-white/90 text-2.75 font-medium truncate">{{ message.pptName || t('floating.pptDocument') }} ({{ t('floating.pages', { count: message.pptTotalPages || message.pptImages.length }) }})</div>
                  </div>
                </div>
                <!-- 媒体操作按钮 -->
                <div class="media-action-buttons">
                  <n-tooltip trigger="hover" placement="top" :show-arrow="false">
                    <template #trigger>
                      <button class="media-action-btn" @click.stop="reuseMedia(message.pptImages, 'ppt', undefined, message.pptName, message.pptTotalPages)">
                        <n-icon size="14">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                          </svg>
                        </n-icon>
                      </button>
                    </template>
                    {{ t('floating.reusePpt') }}
                  </n-tooltip>
                </div>
              </div>
              <div class="message-text">{{ message.content }}</div>
            </div>

            <!-- AI消息 -->
            <div v-else>
              <!-- 思考块 -->
              <div v-if="extractThinkContent(message.content || '').trim()" class="mb-1.5">
                <n-collapse :default-expanded-names="settingsStore.settings.defaultExpandThink ? ['think'] : []" :arrow-placement="'right'" class="think-collapse-floating">
                  <n-collapse-item name="think" class="think-collapse-item-floating">
                    <template #header>
                      <div class="think-header-floating">
                        <span class="think-icon-floating">{{ (index === chatStore.messages.length - 1 && chatStore.isGenerating) ? '✨' : '✓' }}</span>
                        <span class="think-label-floating" :class="{ 'thinking-blink-floating': index === chatStore.messages.length - 1 && chatStore.isGenerating }">
                          {{ (index === chatStore.messages.length - 1 && chatStore.isGenerating) ? t('think.thinking') : t('think.thinkingComplete') }}
                        </span>
                      </div>
                    </template>
                    <div class="think-content-floating" :class="{ 'think-content-generating-floating': index === chatStore.messages.length - 1 && chatStore.isGenerating }">
                      <div class="text-white/60 text-2.5 leading-1.3 whitespace-pre-wrap">
                        {{ extractThinkContent(message.content || '') }}
                        <span v-if="index === chatStore.messages.length - 1 && chatStore.isGenerating" class="loading-dots-floating"></span>
                      </div>
                    </div>
                  </n-collapse-item>
                </n-collapse>
              </div>
              <!-- AI回复内容 -->
              <div v-if="formatAnswerBoxes(removeThinkContent(message.content || '')).trim()" class="message-text" :title="t('floating.clickToViewFull')" @click="handleMessageClick(message)">
                {{ formatAnswerBoxes(removeThinkContent(message.content || '')) }}
              </div>
            </div>
          </div>

          <!-- Loading 提示 -->
          <div v-if="chatStore.isLoading" class="mb-1.5 px-1.5 py-1 rounded text-2.75 bg-white/8 text-white border border-white/15 opacity-80">
            <div class="flex items-center gap-1.5">
              <div class="flex gap-0.5">
                <span class="w-1 h-1 bg-white/60 rounded-full animate-[loading-pulse_1.4s_ease-in-out_infinite_both] animate-delay-[-0.32s]"></span>
                <span class="w-1 h-1 bg-white/60 rounded-full animate-[loading-pulse_1.4s_ease-in-out_infinite_both] animate-delay-[-0.16s]"></span>
                <span class="w-1 h-1 bg-white/60 rounded-full animate-[loading-pulse_1.4s_ease-in-out_infinite_both]"></span>
              </div>
              <div class="text-white/70 text-2.5">{{ t('floating.polarisThinking') }}</div>
            </div>
          </div>
        </div>

        <div class="pt-1">
          <!-- 文件信息显示区域 -->
          <div v-if="chatStore.pendingMedia.image || chatStore.pendingMedia.video || (chatStore.pendingMedia.pdfImages && chatStore.pendingMedia.pdfImages.length > 0) || (chatStore.pendingMedia.pptImages && chatStore.pendingMedia.pptImages.length > 0)" class="mb-1.5">
            <div v-if="chatStore.pendingMedia.image" class="bg-white/8 border border-white/15 rounded-1.5 px-2 py-1.5 flex items-center gap-2">
              <div class="w-6 h-6">
                <img src="@renderer/assets/icons/image.svg" alt="图片" class="w-full h-full" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white/90 text-2.75 font-medium truncate">{{ t('floating.imageSelected') }}</div>
                <div class="text-white/60 text-2.25">{{ t('floating.clickSendToUpload') }}</div>
              </div>
              <button class="bg-red/20 border-none rounded-full w-4.5 h-4.5 flex items-center justify-center cursor-pointer text-white/80 transition-all-200 hover:bg-red/40 hover:text-white" @click="clearImageWrapper">
                <n-icon size="10">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </n-icon>
              </button>
            </div>

            <div v-if="chatStore.pendingMedia.video" class="bg-white/8 border border-white/15 rounded-1.5 px-2 py-1.5 flex items-center gap-2">
              <div class="w-6 h-6">
                <img src="@renderer/assets/icons/video.svg" alt="视频" class="w-full h-full" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white/90 text-2.75 font-medium truncate">{{ t('floating.videoSelected') }}</div>
                <div class="text-white/60 text-2.25">{{ t('floating.clickSendToUpload') }}</div>
              </div>
              <button class="bg-red/20 border-none rounded-full w-4.5 h-4.5 flex items-center justify-center cursor-pointer text-white/80 transition-all-200 hover:bg-red/40 hover:text-white" @click="clearVideoWrapper">
                <n-icon size="10">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </n-icon>
              </button>
            </div>

            <div v-if="chatStore.pendingMedia.pdfImages && chatStore.pendingMedia.pdfImages.length > 0" class="bg-white/8 border border-white/15 rounded-1.5 px-2 py-1.5 flex items-center gap-2">
              <div class="w-8 h-8">
                <img src="@renderer/assets/icons/pdf3.svg" alt="PDF" class="w-full h-full" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white/90 text-2.75 font-medium truncate">{{ chatStore.pendingMedia.pdfName || t('floating.pdfDocument') }} ({{ t('floating.pages', { count: chatStore.pendingMedia.pdfImages.length }) }})</div>
                <div class="text-white/60 text-2.25">{{ t('floating.clickSendToUpload') }}</div>
              </div>
              <button class="bg-red/20 border-none rounded-full w-4.5 h-4.5 flex items-center justify-center cursor-pointer text-white/80 transition-all-200 hover:bg-red/40 hover:text-white" @click="clearPdfWrapper">
                <n-icon size="10">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </n-icon>
              </button>
            </div>

            <div v-if="chatStore.pendingMedia.pptImages && chatStore.pendingMedia.pptImages.length > 0" class="bg-white/8 border border-white/15 rounded-1.5 px-2 py-1.5 flex items-center gap-2">
              <div class="w-7 h-7">
                <img src="@renderer/assets/icons/ppt3.svg" alt="PPT" class="w-full h-full" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white/90 text-2.75 font-medium truncate">{{ chatStore.pendingMedia.pptName || t('floating.pptDocument') }} ({{ t('floating.pages', { count: chatStore.pendingMedia.pptTotalPages || chatStore.pendingMedia.pptImages.length }) }})</div>
                <div class="text-white/60 text-2.25">{{ t('floating.clickSendToUpload') }}</div>
              </div>
              <button class="bg-red/20 border-none rounded-full w-4.5 h-4.5 flex items-center justify-center cursor-pointer text-white/80 transition-all-200 hover:bg-red/40 hover:text-white" @click="clearPptWrapper">
                <n-icon size="10">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </n-icon>
              </button>
            </div>
          </div>

          <!-- Word 预览 -->
          <div v-if="chatStore.pendingMedia.wordImages && chatStore.pendingMedia.wordImages.length > 0" class="mb-1.5">
            <div class="bg-white/10 backdrop-blur-sm rounded px-2 py-1.5 flex items-center gap-2">
              <div class="w-7 h-7">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="#2B579A"/>
                  <path d="M14 2V8H20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 13H16M8 17H16M10 9H12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white/90 text-2.75 font-medium truncate">{{ chatStore.pendingMedia.wordName || t('floating.wordDocument') }} ({{ t('floating.pages', { count: chatStore.pendingMedia.wordTotalPages || chatStore.pendingMedia.wordImages.length }) }})</div>
                <div class="text-white/60 text-2.25">{{ t('floating.clickSendToUpload') }}</div>
              </div>
              <button class="bg-red/20 border-none rounded-full w-4.5 h-4.5 flex items-center justify-center cursor-pointer text-white/80 transition-all-200 hover:bg-red/40 hover:text-white" @click="clearWordWrapper">
                <n-icon size="10">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </n-icon>
              </button>
            </div>
          </div>

          <div class="flex gap-1 items-center">
            <input ref="inputRef" v-model="inputMessage" class="flex-1 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-white text-2.75 outline-none h-6 leading-1.2 placeholder:text-white/50" :placeholder="t('floating.inputPlaceholder')" @keydown="handleKeyDown" @paste="handlePasteWrapper" @focus="handleInputFocus" @blur="handleInputBlur" />

            <div class="flex gap-0.5">
              <n-tooltip trigger="hover" placement="top" :show-arrow="false" :delay="500">
                <template #trigger>
                  <button class="bg-white/10 border-none rounded text-white text-2.75 cursor-pointer px-1.5 py-1 transition-all-200 min-w-6 h-6 flex items-center justify-center hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="isFileUploading" @click="uploadFile">
                    <div v-if="isFileUploading" class="flex gap-0.5 items-center">
                      <span class="w-1 h-1 bg-white/60 rounded-full animate-[loading-pulse_1.4s_ease-in-out_infinite_both] animate-delay-[-0.32s]"></span>
                      <span class="w-1 h-1 bg-white/60 rounded-full animate-[loading-pulse_1.4s_ease-in-out_infinite_both] animate-delay-[-0.16s]"></span>
                      <span class="w-1 h-1 bg-white/60 rounded-full animate-[loading-pulse_1.4s_ease-in-out_infinite_both]"></span>
                    </div>
                    <n-icon v-else size="14">
                      <Document />
                    </n-icon>
                  </button>
                </template>
                {{ isFileUploading ? t('floating.processing') : t('floating.uploadFile') }}
              </n-tooltip>
              <n-tooltip trigger="hover" placement="top" :show-arrow="false" :delay="500">
                <template #trigger>
                  <button class="bg-white/10 border-none rounded text-white text-2.75 cursor-pointer px-1.5 py-1 transition-all-200 min-w-6 h-6 flex items-center justify-center hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="isAnyOperationInProgress" @click="handleScreenshot" @contextmenu.prevent="toggleScreenshotMode">
                    <div v-if="(screenshotMode === 'area' && isAreaCapturing) || (screenshotMode === 'quick' && isQuickCapturing)" class="flex gap-0.5 items-center">
                      <span class="w-1 h-1 bg-white/60 rounded-full animate-[loading-pulse_1.4s_ease-in-out_infinite_both] animate-delay-[-0.32s]"></span>
                      <span class="w-1 h-1 bg-white/60 rounded-full animate-[loading-pulse_1.4s_ease-in-out_infinite_both] animate-delay-[-0.16s]"></span>
                      <span class="w-1 h-1 bg-white/60 rounded-full animate-[loading-pulse_1.4s_ease-in-out_infinite_both]"></span>
                    </div>
                    <n-icon v-else size="14">
                      <Cut v-if="screenshotMode === 'area'" />
                      <Camera v-else />
                    </n-icon>
                  </button>
                </template>
                {{ screenshotMode === 'area' ? t('floating.regionScreenshot') : t('floating.quickScreenshot') }} {{ t('floating.rightClickToSwitch') }}
              </n-tooltip>
              <n-tooltip v-if="chatStore.isGenerating" trigger="hover" placement="top" :show-arrow="false" :delay="500">
                <template #trigger>
                  <button class="bg-red/60 border-none rounded text-white text-2.75 cursor-pointer px-1.5 py-1 transition-all-200 min-w-6 h-6 flex items-center justify-center hover:bg-red/80" @click="stopGeneration">
                    <n-icon size="14">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    </n-icon>
                  </button>
                </template>
                {{ t('floating.stopGeneration') }}
              </n-tooltip>
              <n-tooltip v-else trigger="hover" placement="top" :show-arrow="false" :delay="500">
                <template #trigger>
                  <button class="bg-blue/60 border-none rounded text-white text-2.75 cursor-pointer px-1.5 py-1 transition-all-200 min-w-6 h-6 flex items-center justify-center hover:bg-blue/80 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!canSend" @click="sendMessage">
                    <n-icon size="14">
                      <Send />
                    </n-icon>
                  </button>
                </template>
                {{ t('floating.sendMessage') }}
              </n-tooltip>
            </div>
          </div>
        </div>
      </div>

      <!-- 隐藏的文件输入 -->
      <input ref="fileInput" type="file" accept="image/*,video/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display: none" @change="handleFileSelect" />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import { NTooltip, NIcon, NCollapse, NCollapseItem, useMessage } from 'naive-ui'
import { Send, Document, Camera } from '@vicons/carbon'
import { Cut } from '@vicons/tabler'
import { useI18n } from 'vue-i18n'
import { useChatFunctions } from '../composables/useChatFunctions'
import { useSettingsStore } from '../stores/settingsStore'
import VideoPlayer from './VideoPlayer.vue'

// 使用组合式函数
const { chatStore, extractThinkContent, removeThinkContent, formatAnswerBoxes, processFile, handlePaste, sendMessage: sendMessageCore, handleKeyDown: handleKeyDownCore, handleMessageClick, handleAreaScreenshot: handleAreaScreenshotCore, handleQuickScreenshot: handleQuickScreenshotCore, cleanup, cancelCurrentRequest } = useChatFunctions()

// 设置store
const settingsStore = useSettingsStore()

// 国际化
const { t } = useI18n()

// 消息提示
const messageApi = useMessage()

// 本地状态变量
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()
const isInputFocused = ref(false)
const isPinned = ref(false)
const isFileUploading = ref(false) // 文件上传loading状态
const isQuickCapturing = ref(false) // 快速截图loading状态
const isAreaCapturing = ref(false) // 区域截图loading状态

// 拖拽相关状态
const isDragOver = ref(false)
let dragCounter = 0 // 用于处理多个拖拽事件

// 截图模式切换状态
const screenshotMode = ref<'area' | 'quick'>('area') // 截图模式：区域截图或快速截图

const canSend = computed(() => {
  return !chatStore.isLoading && !chatStore.isGenerating && (inputMessage.value.trim() || chatStore.pendingMedia.image || chatStore.pendingMedia.video || (chatStore.pendingMedia.pdfImages && chatStore.pendingMedia.pdfImages.length > 0) || (chatStore.pendingMedia.pptImages && chatStore.pendingMedia.pptImages.length > 0))
})

const isAnyOperationInProgress = computed(() => {
  return isQuickCapturing.value || isAreaCapturing.value
})

// 窗口控制
const switchToMain = (): void => {
  if (window.api?.switchToMain) {
    window.api.switchToMain()
  }
}

const closeFloating = (): void => {
  if (window.api?.closeFloatingWindow) {
    window.api.closeFloatingWindow()
  }
}

// 新建对话处理函数
const startNewConversation = (): void => {
  // 调用 chatStore 的新建对话功能
  chatStore.startNewConversation()

  // 清空本地状态
  inputMessage.value = ''
  // 待发送媒体在startNewConversation中清空

  messageApi.success(t('messages.newConversationStarted'), { duration: 1500 })
}

// 包装器函数 - 适配 composable 接口
const handleAreaScreenshot = async (): Promise<void> => {
  try {
    isAreaCapturing.value = true
    await handleAreaScreenshotCore(data => {
      chatStore.setPendingMedia({
        image: data || undefined,
        video: undefined, // 清除已选择的视频
        videoBase64: undefined, // 清除视频base64
        pdfImages: undefined, // 清除已选择的PDF
        pdfName: undefined, // 清除PDF名称
        pptImages: undefined, // 清除已选择的PPT
        pptName: undefined // 清除PPT名称
      })
    })
  } finally {
    isAreaCapturing.value = false
  }
}

const handleQuickScreenshot = async (): Promise<void> => {
  try {
    isQuickCapturing.value = true
    await handleQuickScreenshotCore(data => {
      chatStore.setPendingMedia({
        image: data || undefined,
        video: undefined, // 清除已选择的视频
        videoBase64: undefined, // 清除视频base64
        pdfImages: undefined, // 清除已选择的PDF
        pdfName: undefined, // 清除PDF名称
        pptImages: undefined, // 清除已选择的PPT
        pptName: undefined // 清除PPT名称
      })
    })
  } finally {
    isQuickCapturing.value = false
  }
}

// 截图功能 - 根据模式选择
const handleScreenshot = async (): Promise<void> => {
  if (screenshotMode.value === 'area') {
    await handleAreaScreenshot()
  } else {
    await handleQuickScreenshot()
  }
}

// 切换截图模式
const toggleScreenshotMode = (): void => {
  screenshotMode.value = screenshotMode.value === 'area' ? 'quick' : 'area'
}

const processFileWrapper = async (file: File): Promise<void> => {
  await processFile(
    file,
    (data: string | null) => {
      chatStore.setPendingMedia({ image: data || undefined })
    },
    (data: string | null) => {
      chatStore.setPendingMedia({ video: data || undefined })
    },
    (data: string | null) => {
      chatStore.setPendingMedia({ videoBase64: data || undefined })
    },
    (data: string[] | null) => {
      chatStore.setPendingMedia({ pdfImages: data || undefined })
    },
    (name: string | null) => {
      chatStore.setPendingMedia({ pdfName: name || undefined })
    },
    (data: string[] | null) => {
      chatStore.setPendingMedia({ pptImages: data || undefined })
    },
    (name: string | null) => {
      chatStore.setPendingMedia({ pptName: name || undefined })
    },
    (totalPages: number | null) => {
      chatStore.setPendingMedia({ pptTotalPages: totalPages || undefined })
    },
    (data: string[] | null) => {
      chatStore.setPendingMedia({ wordImages: data || undefined })
    },
    (name: string | null) => {
      chatStore.setPendingMedia({ wordName: name || undefined })
    },
    (totalPages: number | null) => {
      chatStore.setPendingMedia({ wordTotalPages: totalPages || undefined })
    }
  )
}

const clearImageWrapper = (): void => {
  chatStore.setPendingMedia({
    image: undefined,
    video: chatStore.pendingMedia.video,
    videoBase64: chatStore.pendingMedia.videoBase64,
    pdfImages: chatStore.pendingMedia.pdfImages,
    pdfName: chatStore.pendingMedia.pdfName,
    pptImages: chatStore.pendingMedia.pptImages,
    pptName: chatStore.pendingMedia.pptName,
    pptTotalPages: chatStore.pendingMedia.pptTotalPages,
    wordImages: chatStore.pendingMedia.wordImages,
    wordName: chatStore.pendingMedia.wordName,
    wordTotalPages: chatStore.pendingMedia.wordTotalPages
  })
}

const clearVideoWrapper = (): void => {
  chatStore.setPendingMedia({
    image: chatStore.pendingMedia.image,
    video: undefined,
    videoBase64: undefined,
    pdfImages: chatStore.pendingMedia.pdfImages,
    pdfName: chatStore.pendingMedia.pdfName,
    pptImages: chatStore.pendingMedia.pptImages,
    pptName: chatStore.pendingMedia.pptName,
    pptTotalPages: chatStore.pendingMedia.pptTotalPages,
    wordImages: chatStore.pendingMedia.wordImages,
    wordName: chatStore.pendingMedia.wordName,
    wordTotalPages: chatStore.pendingMedia.wordTotalPages
  })
}

const clearPdfWrapper = (): void => {
  chatStore.setPendingMedia({
    image: chatStore.pendingMedia.image,
    video: chatStore.pendingMedia.video,
    videoBase64: chatStore.pendingMedia.videoBase64,
    pdfImages: undefined,
    pdfName: undefined,
    pptImages: chatStore.pendingMedia.pptImages,
    pptName: chatStore.pendingMedia.pptName,
    pptTotalPages: chatStore.pendingMedia.pptTotalPages,
    wordImages: chatStore.pendingMedia.wordImages,
    wordName: chatStore.pendingMedia.wordName,
    wordTotalPages: chatStore.pendingMedia.wordTotalPages
  })
}

const clearPptWrapper = (): void => {
  chatStore.setPendingMedia({
    image: chatStore.pendingMedia.image,
    video: chatStore.pendingMedia.video,
    videoBase64: chatStore.pendingMedia.videoBase64,
    pdfImages: chatStore.pendingMedia.pdfImages,
    pdfName: chatStore.pendingMedia.pdfName,
    pptImages: undefined,
    pptName: undefined,
    pptTotalPages: undefined,
    wordImages: chatStore.pendingMedia.wordImages,
    wordName: chatStore.pendingMedia.wordName,
    wordTotalPages: chatStore.pendingMedia.wordTotalPages
  })
}

const clearWordWrapper = (): void => {
  chatStore.setPendingMedia({
    image: chatStore.pendingMedia.image,
    video: chatStore.pendingMedia.video,
    videoBase64: chatStore.pendingMedia.videoBase64,
    pdfImages: chatStore.pendingMedia.pdfImages,
    pdfName: chatStore.pendingMedia.pdfName,
    pptImages: chatStore.pendingMedia.pptImages,
    pptName: chatStore.pendingMedia.pptName,
    pptTotalPages: chatStore.pendingMedia.pptTotalPages,
    wordImages: undefined,
    wordName: undefined,
    wordTotalPages: undefined
  })
}

const uploadFile = (): void => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    isFileUploading.value = true
    await processFileWrapper(file)
  } catch (error) {
    console.error('文件处理失败:', error)
  } finally {
    isFileUploading.value = false
    target.value = ''
  }
}

const handleInputFocus = (): void => {
  isInputFocused.value = true
}

const handleInputBlur = (): void => {
  isInputFocused.value = false
}

const handleKeyDown = async (e: KeyboardEvent): Promise<void> => {
  await handleKeyDownCore(e, sendMessage)
}

// 复用媒体到输入框
const reuseMedia = (mediaData: string | string[], mediaType: 'image' | 'video' | 'pdf' | 'ppt', videoBase64?: string, fileName?: string, totalPages?: number): void => {
  try {
    // 清除当前所有选择的媒体
    chatStore.clearPendingMedia()

    // 根据媒体类型设置相应的数据
    switch (mediaType) {
      case 'image':
        if (typeof mediaData === 'string') {
          chatStore.setPendingMedia({ image: mediaData })
          messageApi.success(t('floating.imageAdded'), { duration: 1500 })
        }
        break
      case 'video':
        if (typeof mediaData === 'string') {
          chatStore.setPendingMedia({
            video: mediaData,
            videoBase64: videoBase64 || undefined
          })
          messageApi.success(t('floating.videoAdded'), { duration: 1500 })
        }
        break
      case 'pdf':
        if (Array.isArray(mediaData)) {
          chatStore.setPendingMedia({
            pdfImages: mediaData,
            pdfName: fileName || t('floating.pdfDocument')
          })
          messageApi.success(t('floating.pdfAdded'), { duration: 1500 })
        }
        break
      case 'ppt':
        if (Array.isArray(mediaData)) {
          chatStore.setPendingMedia({
            pptImages: mediaData,
            pptName: fileName || t('floating.pptDocument'),
            pptTotalPages: totalPages
          })
          messageApi.success(t('floating.pptAdded'), { duration: 1500 })
        }
        break
    }
  } catch (error) {
    console.error('复用媒体失败:', error)
    messageApi.error(t('floating.reuseMediaFailed'))
  }
}

// 下载媒体文件
const downloadMedia = (mediaData: string, mediaType: 'image' | 'video'): void => {
  try {
    if (!mediaData) {
      messageApi.error(t('floating.invalidMediaData'))
      return
    }

    const link = document.createElement('a')
    link.style.display = 'none'

    if (mediaData.startsWith('data:')) {
      // base64数据，直接下载
      link.href = mediaData
    } else if (mediaData.startsWith('blob:')) {
      // blob URL，直接下载
      link.href = mediaData
    } else {
      messageApi.error(t('floating.unsupportedMediaFormat'))
      return
    }

    // 设置文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const extension = mediaType === 'image' ? 'png' : 'mp4'
    link.download = `media_${timestamp}.${extension}`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('下载失败:', error)
    messageApi.error(t('floating.downloadFailed'))
  }
}

const handlePasteWrapper = async (event: ClipboardEvent): Promise<void> => {
  // 粘贴文件时也要显示loading状态
  const originalCallback = processFileWrapper
  const wrappedCallback = async (file: File): Promise<void> => {
    try {
      isFileUploading.value = true
      await originalCallback(file)
    } catch (error) {
      console.error('粘贴文件处理失败:', error)
    } finally {
      isFileUploading.value = false
    }
  }
  await handlePaste(event, wrappedCallback)
}

const sendMessage = async (): Promise<void> => {
  if (!canSend.value) return

  const clearInputs = (): void => {
    inputMessage.value = ''
    // 待发送媒体在store的addUserMessage中清空
  }

  await sendMessageCore(inputMessage.value, chatStore.pendingMedia.image || '', chatStore.pendingMedia.video || '', chatStore.pendingMedia.videoBase64 || '', chatStore.pendingMedia.pdfImages || [], chatStore.pendingMedia.pdfName || '', chatStore.pendingMedia.pptImages || [], chatStore.pendingMedia.pptName || '', chatStore.pendingMedia.pptTotalPages || null, chatStore.pendingMedia.wordImages || [], chatStore.pendingMedia.wordName || '', chatStore.pendingMedia.wordTotalPages || null, clearInputs, scrollToBottom)
}

// 停止生成
const stopGeneration = (): void => {
  cancelCurrentRequest()
  messageApi.info(t('floating.generationStopped'), { duration: 1500 })
}

// 切换隐私模式
const togglePrivateMode = (): void => {
  messageApi.destroyAll() // 清空所有现有的提示
  chatStore.togglePrivateMode()
  if (chatStore.isPrivateMode) {
    messageApi.success(t('messages.privacyModeEnabled'), { duration: 1500 })
  } else {
    messageApi.info(t('messages.privacyModeDisabled'), { duration: 1500 })
  }
}

const scrollToBottom = (): void => {
  if (messagesContainer.value) {
    setTimeout(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }, 10)
  }
}

// 置顶功能
const togglePin = async (): Promise<void> => {
  try {
    if (window.api?.toggleAlwaysOnTop) {
      const newState = await window.api.toggleAlwaysOnTop()
      isPinned.value = newState
    }
  } catch (error) {
    console.error('切换置顶状态失败:', error)
  }
}

// 获取当前置顶状态
const checkPinStatus = async (): Promise<void> => {
  try {
    if (window.api?.getAlwaysOnTopStatus) {
      isPinned.value = await window.api.getAlwaysOnTopStatus()
    }
  } catch (error) {
    console.error('获取置顶状态失败:', error)
  }
}

// 监听置顶状态刷新请求
const setupPinStatusListener = (): void => {
  if (window.api?.onRefreshPinStatus) {
    window.api.onRefreshPinStatus(async () => {
      // 当收到刷新请求时，重新查询自己的置顶状态
      await checkPinStatus()
    })
  }
}

// 清理置顶状态监听器
const cleanupPinStatusListener = (): void => {
  if (window.api?.offRefreshPinStatus) {
    window.api.offRefreshPinStatus((): void => {})
  }
}

watch(
  () => chatStore.messages.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)

// 监听生成状态，当生成中时自动滚动思考块
watch(
  () => chatStore.isGenerating,
  isGenerating => {
    if (isGenerating) {
      // 每100ms自动滚动一次，确保新内容可见
      const scrollInterval = setInterval(() => {
        if (!chatStore.isGenerating) {
          clearInterval(scrollInterval)
          return
        }

        // 查找所有展开的思考块并滚动到底部
        const thinkContents = document.querySelectorAll('.think-content-floating.think-generating')
        thinkContents.forEach(element => {
          if (element instanceof HTMLElement) {
            element.scrollTop = element.scrollHeight
          }
        })

        // 同时滚动消息容器到底部
        scrollToBottom()
      }, 100)

      // 保存interval ID用于清理
      ;(chatStore as Record<string, unknown>)._floatingScrollInterval = scrollInterval
    } else {
      // 生成结束时清理interval
      if ((chatStore as Record<string, unknown>)._floatingScrollInterval) {
        clearInterval((chatStore as Record<string, unknown>)._floatingScrollInterval as number)
        delete (chatStore as Record<string, unknown>)._floatingScrollInterval
      }
    }
  }
)

onMounted(() => {
  // 立即滚动一次
  scrollToBottom()

  // 延迟滚动确保DOM完全渲染
  nextTick(() => {
    setTimeout((): void => {
      scrollToBottom()
    }, 100)
    setTimeout((): void => {
      scrollToBottom()
    }, 300)
  })

  checkPinStatus()
  setupPinStatusListener()

  // 添加新建对话快捷键监听器
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.on('trigger-new-conversation', (): void => {
      startNewConversation()
    })
    window.electron.ipcRenderer.on('trigger-quick-screenshot', (): void => {
      handleQuickScreenshot()
    })
    window.electron.ipcRenderer.on('trigger-area-screenshot', (): void => {
      handleAreaScreenshot()
    })
  }
})

onUnmounted(() => {
  // 清理新建对话快捷键监听器
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.removeAllListeners('trigger-new-conversation')
    window.electron.ipcRenderer.removeAllListeners('trigger-quick-screenshot')
    window.electron.ipcRenderer.removeAllListeners('trigger-area-screenshot')
  }

  cleanupPinStatusListener()
  cleanup()
})

// 拖拽处理函数
const handleDragEnter = (event: DragEvent): void => {
  event.preventDefault()
  event.stopPropagation()

  // 检查是否包含文件
  if (event.dataTransfer?.types.includes('Files')) {
    dragCounter++
    isDragOver.value = true
  }
}

const handleDragOver = (event: DragEvent): void => {
  event.preventDefault()
  event.stopPropagation()

  // 检查是否包含文件
  if (event.dataTransfer?.types.includes('Files')) {
    // 设置拖拽效果
    event.dataTransfer.dropEffect = 'copy'
    if (!isDragOver.value) {
      dragCounter++
      isDragOver.value = true
    }
  }
}

const handleDragLeave = (event: DragEvent): void => {
  event.preventDefault()
  event.stopPropagation()

  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    isDragOver.value = false
  }
}

const handleDrop = async (event: DragEvent): Promise<void> => {
  event.preventDefault()
  event.stopPropagation()

  dragCounter = 0
  isDragOver.value = false

  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]

  // 检查文件类型
  const allowedTypes = ['image/', 'video/', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

  const isAllowedType = allowedTypes.some(type => file.type.startsWith(type) || file.type === type)

  if (!isAllowedType) {
    // 在悬浮窗中使用更简洁的错误提示
    console.warn('不支持的文件类型')
    return
  }

  // 显示上传中状态
  isFileUploading.value = true

  try {
    await processFileWrapper(file)

    // 显示简洁的成功提示
    console.log('文件拖拽上传成功')
  } catch (error) {
    console.error('拖拽文件处理失败:', error)
  } finally {
    isFileUploading.value = false
  }
}
</script>

<style scoped>
/* 拖拽区域 */
.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}

/* 加载动画 */
@keyframes loading-pulse {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 滚动条自定义样式（UnoCSS 无法完全覆盖 webkit 滚动条） */
.scrollbar::-webkit-scrollbar {
  width: 4px;
}

.scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 拖拽样式 - 悬浮窗适配 */
.drag-over {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.06)) !important;
  position: relative;
}

.drag-overlay-floating {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border: 1px dashed rgba(59, 130, 246, 0.7);
  border-radius: 8px;
  animation: dragOverlayFloating 0.2s ease-out;
}

.drag-indicator-floating {
  text-align: center;
  color: #60a5fa;
  /* 移除跳动动画 */
}

.drag-icon-floating {
  margin: 0 auto 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.drag-text-floating {
  user-select: none;
}

.drag-title-floating {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #60a5fa;
}

.drag-subtitle-floating {
  font-size: 11px;
  color: #94a3b8;
  opacity: 0.9;
}

@keyframes dragOverlayFloating {
  from {
    opacity: 0;
    transform: scale(0.98);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 媒体hover效果 */
.media-hover-container {
  position: relative;
  display: inline-block;
}

/* 媒体操作按钮 */
.media-action-buttons {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 10;
}

.media-hover-container:hover .media-action-buttons {
  opacity: 1;
  pointer-events: auto;
}

.media-action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.media-action-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.media-action-btn:active {
  transform: scale(0.95);
}

/* 悬浮窗思考块折叠面板样式 */
:deep(.think-collapse-floating) {
  background: transparent !important;
  border: none !important;
}

:deep(.think-collapse-item-floating) {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(8px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 6px !important;
  overflow: hidden !important;
}

:deep(.think-collapse-item-floating .n-collapse-item__header) {
  background: transparent !important;
  padding: 4px 8px !important;
  font-size: 0.65rem !important;
  border: none !important;
  min-height: unset !important;
  line-height: 1 !important;
}

:deep(.think-collapse-item-floating .n-collapse-item__header:hover) {
  background: rgba(255, 255, 255, 0.03) !important;
}

:deep(.think-collapse-item-floating .n-collapse-item__header-main) {
  flex: 1 !important;
}

:deep(.think-collapse-item-floating .n-collapse-item__arrow) {
  color: rgba(255, 255, 255, 0.6) !important;
  font-size: 12px !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.think-collapse-item-floating .n-collapse-item__content-wrapper) {
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
}

:deep(.think-collapse-item-floating .n-collapse-item__content-inner) {
  padding: 4px 8px !important;
}

.think-header-floating {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  user-select: none;
}

.think-icon-floating {
  font-size: 12px;
  flex-shrink: 0;
}

.think-label-floating {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  flex: 1;
  font-size: 0.65rem;
}

/* 思考中闪烁动画 */
.thinking-blink-floating {
  animation: blink-floating 1.5s ease-in-out infinite;
}

@keyframes blink-floating {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.think-content-floating {
  font-size: 0.65rem;
}

/* 生成中的思考块有固定高度和滚动 */
.think-content-generating-floating {
  max-height: 120px;
  overflow-y: auto;
}

.think-content-generating-floating::-webkit-scrollbar {
  width: 3px;
}

.think-content-generating-floating::-webkit-scrollbar-track {
  background: transparent;
}

.think-content-generating-floating::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.think-content-generating-floating::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 加载动画 */
.loading-dots-floating::after {
  content: '';
  animation: dots-floating 1.5s steps(4, end) infinite;
}

@keyframes dots-floating {
  0%,
  20% {
    content: '.';
  }
  40% {
    content: '..';
  }
  60%,
  100% {
    content: '...';
  }
}

/* 悬浮窗显示/隐藏动画 */
.floating-window-enter-active,
.floating-window-leave-active {
  transition: all 0.3s ease;
}

.floating-window-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.floating-window-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.floating-window-enter-to,
.floating-window-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>
