<template>
  <div class="weave-sentiment-badge" :class="`weave-sentiment-badge--${sentiment} weave-sentiment-badge--${size}`">
    <span class="weave-sentiment-badge__emoji">{{ sentimentEmoji }}</span>
    <div v-if="showLabel || showPercentage" class="weave-sentiment-badge__text">
      <span v-if="showLabel" class="weave-sentiment-badge__label">{{ sentimentLabel }}</span>
      <span v-if="showPercentage && score !== undefined" class="weave-sentiment-badge__score">
        {{ (score * 100).toFixed(0) }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SentimentBadgeProps } from '../types/components'

const props = withDefaults(defineProps<SentimentBadgeProps>(), {
  size: 'medium',
  showPercentage: false,
  showLabel: true,
  score: 1
})

const sentimentEmoji = computed(() => {
  switch (props.sentiment) {
    case 'positive':
      return '😊'
    case 'negative':
      return '😞'
    case 'neutral':
      return '😐'
    default:
      return '😊'
  }
})

const sentimentLabel = computed(() => {
  return props.sentiment.charAt(0).toUpperCase() + props.sentiment.slice(1)
})
</script>

<style scoped>
.weave-sentiment-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
}

.weave-sentiment-badge--small {
  padding: 4px 8px;
  font-size: 12px;
}

.weave-sentiment-badge--large {
  padding: 12px 16px;
  font-size: 16px;
}

.weave-sentiment-badge--positive {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

@media (prefers-color-scheme: dark) {
  .weave-sentiment-badge--positive {
    background-color: #1e4620;
    color: #6dd58a;
    border-color: #3a6d3f;
  }
}

.weave-sentiment-badge--negative {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@media (prefers-color-scheme: dark) {
  .weave-sentiment-badge--negative {
    background-color: #561d1d;
    color: #f8a5a5;
    border-color: #8b3a3a;
  }
}

.weave-sentiment-badge--neutral {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

@media (prefers-color-scheme: dark) {
  .weave-sentiment-badge--neutral {
    background-color: #3a3f44;
    color: #c5cdd1;
    border-color: #555a61;
  }
}

.weave-sentiment-badge__emoji {
  font-size: 1.2em;
  line-height: 1;
}

.weave-sentiment-badge__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.weave-sentiment-badge__label {
  font-weight: 600;
}

.weave-sentiment-badge__score {
  font-size: 0.85em;
  opacity: 0.8;
}
</style>
