<template>
  <div class="weave-ai-input">
    <input
      :value="value"
      @input="handleInput"
      @focus="showSuggestions = true"
      @blur="setTimeout(() => (showSuggestions = false), 200)"
      :placeholder="placeholder"
      :disabled="disabled"
      class="weave-ai-input__field"
      type="text"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="showSuggestions && filteredSuggestions.length > 0"
    />
    <ul v-if="showSuggestions && filteredSuggestions.length" class="weave-ai-input__suggestions" role="listbox">
      <li
        v-for="(suggestion, index) in filteredSuggestions"
        :key="index"
        @click="selectSuggestion(suggestion)"
        class="weave-ai-input__suggestion-item"
        role="option"
        :aria-selected="index === selectedIndex"
      >
        {{ suggestion }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AIInputProps } from '../types/components'

const props = withDefaults(defineProps<AIInputProps>(), {
  placeholder: 'Enter text...',
  disabled: false,
  suggestions: () => []
})

const emit = defineEmits<{
  'update:value': [value: string]
  selectSuggestion: [suggestion: string]
}>()

const showSuggestions = ref(false)
const selectedIndex = ref(-1)

const filteredSuggestions = computed(() => {
  if (!props.suggestions || !props.value) return []
  const lowerValue = props.value.toLowerCase()
  return props.suggestions.filter((s) => s.toLowerCase().includes(lowerValue))
})

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:value', target.value)
  selectedIndex.value = -1
  showSuggestions.value = true
}

const selectSuggestion = (suggestion: string) => {
  emit('update:value', suggestion)
  props.onSelectSuggestion?.(suggestion)
  emit('selectSuggestion', suggestion)
  showSuggestions.value = false
}
</script>

<style scoped>
.weave-ai-input {
  position: relative;
  width: 100%;
}

.weave-ai-input__field {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.weave-ai-input__field:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.weave-ai-input__field:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

@media (prefers-color-scheme: dark) {
  .weave-ai-input__field {
    background-color: #333;
    border-color: #555;
    color: #fff;
  }

  .weave-ai-input__field:focus {
    border-color: #0056b3;
  }

  .weave-ai-input__field:disabled {
    background-color: #252525;
    color: #666;
  }
}

.weave-ai-input__suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 4px 0 0 0;
  padding: 0;
  list-style: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

@media (prefers-color-scheme: dark) {
  .weave-ai-input__suggestions {
    background-color: #333;
    border-color: #555;
  }
}

.weave-ai-input__suggestion-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.weave-ai-input__suggestion-item:hover {
  background-color: #f0f0f0;
}

@media (prefers-color-scheme: dark) {
  .weave-ai-input__suggestion-item:hover {
    background-color: #444;
  }
}

.weave-ai-input__suggestion-item[aria-selected='true'] {
  background-color: #e7f3ff;
  color: #0056b3;
}

@media (prefers-color-scheme: dark) {
  .weave-ai-input__suggestion-item[aria-selected='true'] {
    background-color: #1a3a52;
    color: #6db3f2;
  }
}
</style>
