<template>
  <div class="weave-streaming-text" :class="`weave-streaming-text--${speed}`">
    <span>{{ displayedText }}</span>
    <span v-if="!isComplete" class="weave-streaming-text__cursor"></span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import type { StreamingTextProps } from '../types/components'

const props = withDefaults(defineProps<StreamingTextProps>(), {
  speed: 'normal',
  typewriter: true,
  charsPerSecond: 20
})

const emit = defineEmits<{
  complete: []
}>()

const displayedText = ref('')
const isComplete = ref(false)
let intervalId: ReturnType<typeof setInterval> | null = null

const speedMultiplier = computed(() => {
  switch (props.speed) {
    case 'slow':
      return 0.5
    case 'fast':
      return 2
    default:
      return 1
  }
})

const charDelayMs = computed(() => {
  return (1000 / props.charsPerSecond) / speedMultiplier.value
})

const startStreaming = () => {
  displayedText.value = ''
  isComplete.value = false

  if (!props.typewriter) {
    displayedText.value = props.text
    isComplete.value = true
    emit('complete')
    props.onComplete?.()
    return
  }

  let charIndex = 0

  intervalId = setInterval(() => {
    if (charIndex < props.text.length) {
      displayedText.value += props.text[charIndex]
      charIndex++
    } else {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      isComplete.value = true
      emit('complete')
      props.onComplete?.()
    }
  }, charDelayMs.value)
}

onMounted(() => {
  startStreaming()
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

watch(() => props.text, () => {
  startStreaming()
})
</script>

<style scoped>
.weave-streaming-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    sans-serif;
  line-height: 1.6;
  color: #000;
}

@media (prefers-color-scheme: dark) {
  .weave-streaming-text {
    color: #fff;
  }
}

.weave-streaming-text__cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: currentColor;
  margin-left: 2px;
  animation: cursor-blink 1s infinite;
}

@keyframes cursor-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .weave-streaming-text__cursor {
    animation: none;
    opacity: 1;
  }
}

.weave-streaming-text--slow {
  word-spacing: 0.1em;
}

.weave-streaming-text--fast {
  letter-spacing: -0.02em;
}
</style>
