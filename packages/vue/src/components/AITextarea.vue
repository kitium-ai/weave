<template>
  <div class="weave-textarea-wrapper">
    <textarea
      :value="value"
      @input="handleInput"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      class="weave-textarea"
      :style="{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }"
    ></textarea>
    <button
      v-if="onAISuggest"
      class="weave-textarea__ai-button"
      :disabled="!value || isLoading"
      @click="handleAISuggest"
      type="button"
    >
      <span v-if="!isLoading">✨ Suggest</span>
      <span v-else>Loading...</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AITextareaProps } from '../types/components';

const props = withDefaults(defineProps<AITextareaProps>(), {
  minRows: 3,
  maxRows: 8,
  placeholder: 'Enter text here...',
  disabled: false,
  readonly: false,
});

const emit = defineEmits<{
  'update:value': [value: string];
}>();

const isLoading = ref(false);
const lineHeight = 24; // Default line height in pixels

const minHeight = computed(() => {
  return (props.minRows || 3) * lineHeight;
});

const maxHeight = computed(() => {
  return (props.maxRows || 8) * lineHeight;
});

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  emit('update:value', target.value);

  // Auto-resize based on content
  target.style.height = 'auto';
  target.style.height = Math.min(target.scrollHeight, maxHeight.value) + 'px';
};

const handleAISuggest = async () => {
  if (!props.onAISuggest || isLoading.value || !props.value) return;

  isLoading.value = true;
  try {
    const suggestion = await props.onAISuggest(props.value);
    if (suggestion) {
      emit('update:value', suggestion);
    }
  } catch (error) {
    logError('AI suggestion error:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.weave-textarea-wrapper {
  position: relative;
  width: 100%;
}

.weave-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  font-weight: 400;
  line-height: 1.5;
  resize: none;
  overflow-y: auto;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.weave-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.weave-textarea:disabled,
.weave-textarea[readonly] {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

@media (prefers-color-scheme: dark) {
  .weave-textarea {
    background-color: #333;
    border-color: #555;
    color: #fff;
  }

  .weave-textarea:focus {
    border-color: #0056b3;
  }

  .weave-textarea:disabled,
  .weave-textarea[readonly] {
    background-color: #252525;
    color: #666;
  }
}

.weave-textarea__ai-button {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 6px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.weave-textarea__ai-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.weave-textarea__ai-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-color-scheme: dark) {
  .weave-textarea__ai-button {
    background-color: #0056b3;
  }

  .weave-textarea__ai-button:hover:not(:disabled) {
    background-color: #004085;
  }
}
</style>
