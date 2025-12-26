<template>
  <div v-if="enabled" class="starfield-global">
    <div class="stars"></div>
    <div class="stars2"></div>
    <div class="stars3"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  enabled: boolean
}

defineProps<Props>()
</script>

<style scoped>
/* 全局星空背景效果 */
.starfield-global {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.stars,
.stars2,
.stars3 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
}

.stars {
  background-image:
    radial-gradient(2px 2px at 50px 30px, rgba(255, 255, 255, 0.9), transparent), radial-gradient(1px 1px at 120px 70px, rgba(255, 255, 255, 0.7), transparent), radial-gradient(2px 2px at 190px 45px, rgba(255, 255, 255, 0.8), transparent), radial-gradient(1px 1px at 260px 85px, rgba(255, 255, 255, 0.6), transparent), radial-gradient(2px 2px at 330px 20px, rgba(255, 255, 255, 0.9), transparent);
  background-repeat: repeat;
  background-size: 400px 120px;
  animation:
    move-stars-up 20s linear infinite,
    twinkle 3s ease-in-out infinite;
}

.stars2 {
  background-image:
    radial-gradient(1px 1px at 30px 50px, rgba(255, 255, 255, 0.6), transparent), radial-gradient(2px 2px at 100px 90px, rgba(255, 255, 255, 0.5), transparent), radial-gradient(1px 1px at 170px 35px, rgba(255, 255, 255, 0.7), transparent), radial-gradient(2px 2px at 240px 65px, rgba(255, 255, 255, 0.6), transparent), radial-gradient(1px 1px at 310px 100px, rgba(255, 255, 255, 0.5), transparent);
  background-repeat: repeat;
  background-size: 400px 130px;
  animation:
    move-stars-up 30s linear infinite,
    twinkle 4s ease-in-out infinite 1.5s;
}

.stars3 {
  background-image:
    radial-gradient(1px 1px at 70px 25px, rgba(255, 255, 255, 0.4), transparent), radial-gradient(2px 2px at 140px 75px, rgba(255, 255, 255, 0.5), transparent), radial-gradient(1px 1px at 210px 40px, rgba(255, 255, 255, 0.3), transparent), radial-gradient(1px 1px at 280px 95px, rgba(255, 255, 255, 0.4), transparent), radial-gradient(2px 2px at 350px 60px, rgba(255, 255, 255, 0.5), transparent);
  background-repeat: repeat;
  background-size: 400px 140px;
  animation:
    move-stars-up 40s linear infinite,
    twinkle 5s ease-in-out infinite 2.5s;
}

@keyframes move-stars-up {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(-400px);
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}
</style>
