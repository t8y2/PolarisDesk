<template>
  <div class="thinking-loader" :data-theme="theme" :style="{ '--size': size, '--speed': `${speed}s` }">
    <svg width="100" height="100" viewBox="0 0 100 100">
      <defs>
        <mask :id="maskId">
          <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
          <polygon points="25,25 75,25 50,75" fill="white"></polygon>
          <polygon points="50,25 75,75 25,75" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
        </mask>
      </defs>
    </svg>
    <div class="loader-box" :style="{ mask: `url(#${maskId})`, '-webkit-mask': `url(#${maskId})` }"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: number // 缩放大小
  speed?: number // 动画速度（秒）
  theme?: 'purple' | 'green' | 'white' // 颜色主题
}

withDefaults(defineProps<Props>(), {
  size: 0.2,
  speed: 2,
  theme: 'purple'
})

// 生成唯一的 mask ID，避免多个实例冲突
const maskId = computed(() => `clipping-${Math.random().toString(36).substring(2, 11)}`)
</script>

<style scoped>
.thinking-loader {
  --size: 0.2;
  --speed: 2s;
  position: relative;
  border-radius: 50%;
  transform: scale(var(--size));
  animation: colorize calc(var(--speed) * 3) ease-in-out infinite;
}

/* 紫色主题（默认） */
.thinking-loader {
  --color-one: #c4b5fd;
  --color-two: #9333ea;
  --color-three: #c4b5fd80;
  --color-four: #9333ea80;
  --color-five: #c4b5fd40;
  box-shadow:
    0 0 25px 0 var(--color-three),
    0 20px 50px 0 var(--color-four);
}

/* 绿色主题 */
.thinking-loader[data-theme='green'] {
  --color-one: #15803d;
  --color-two: #95ec69;
  --color-three: #15803d80;
  --color-four: #95ec6980;
  --color-five: #15803d40;
}

/* 白色主题 */
.thinking-loader[data-theme='white'] {
  --color-one: rgba(255, 255, 255, 0.8);
  --color-two: rgba(255, 255, 255, 0.5);
  --color-three: rgba(255, 255, 255, 0.4);
  --color-four: rgba(255, 255, 255, 0.3);
  --color-five: rgba(255, 255, 255, 0.2);
  box-shadow:
    0 0 15px 0 var(--color-three),
    0 10px 30px 0 var(--color-four);
}

.thinking-loader::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border-top: solid 1px var(--color-one);
  border-bottom: solid 1px var(--color-two);
  background: linear-gradient(180deg, var(--color-five), var(--color-four));
  box-shadow:
    inset 0 10px 10px 0 var(--color-three),
    inset 0 -10px 10px 0 var(--color-four);
}

.loader-box {
  width: 100px;
  height: 100px;
  background: linear-gradient(180deg, var(--color-one) 30%, var(--color-two) 70%);
}

.thinking-loader svg {
  position: absolute;
  pointer-events: none;
}

.thinking-loader svg mask {
  filter: contrast(15);
  animation: roundness calc(var(--speed) / 2) linear infinite;
}

.thinking-loader svg mask polygon {
  filter: blur(7px);
}

.thinking-loader svg mask polygon:nth-child(1) {
  transform-origin: 75% 25%;
  transform: rotate(90deg);
}

.thinking-loader svg mask polygon:nth-child(2) {
  transform-origin: 50% 50%;
  animation: rotation var(--speed) linear infinite reverse;
}

.thinking-loader svg mask polygon:nth-child(3) {
  transform-origin: 50% 60%;
  animation: rotation var(--speed) linear infinite;
  animation-delay: calc(var(--speed) / -3);
}

.thinking-loader svg mask polygon:nth-child(4) {
  transform-origin: 40% 40%;
  animation: rotation var(--speed) linear infinite reverse;
}

.thinking-loader svg mask polygon:nth-child(5) {
  transform-origin: 40% 40%;
  animation: rotation var(--speed) linear infinite reverse;
  animation-delay: calc(var(--speed) / -2);
}

.thinking-loader svg mask polygon:nth-child(6) {
  transform-origin: 60% 40%;
  animation: rotation var(--speed) linear infinite;
}

.thinking-loader svg mask polygon:nth-child(7) {
  transform-origin: 60% 40%;
  animation: rotation var(--speed) linear infinite;
  animation-delay: calc(var(--speed) / -1.5);
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes roundness {
  0% {
    filter: contrast(15);
  }
  20% {
    filter: contrast(3);
  }
  40% {
    filter: contrast(3);
  }
  60% {
    filter: contrast(15);
  }
  100% {
    filter: contrast(15);
  }
}

@keyframes colorize {
  0% {
    filter: hue-rotate(0deg);
  }
  20% {
    filter: hue-rotate(-30deg);
  }
  40% {
    filter: hue-rotate(-60deg);
  }
  60% {
    filter: hue-rotate(-90deg);
  }
  80% {
    filter: hue-rotate(-45deg);
  }
  100% {
    filter: hue-rotate(0deg);
  }
}
</style>
