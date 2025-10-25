<template>
  <div class="weave-content-generator">
    <div class="weave-content-generator__controls">
      <button
        class="weave-content-generator__generate-button"
        @click="handleGenerate"
        :disabled="isLoading"
      >
        <span v-if="!isLoading">Generate Content</span>
        <span v-else>Generating...</span>
      </button>
      <select v-model="selectedType" class="weave-content-generator__type-select">
        <option value="blog">Blog Post</option>
        <option value="social">Social Media</option>
        <option value="email">Email</option>
        <option value="product">Product Description</option>
        <option value="documentation">Documentation</option>
      </select>
    </div>

    <div v-if="showPreview && generatedContent" class="weave-content-generator__preview">
      <h3>Preview</h3>
      <div class="weave-content-generator__preview-content">{{ generatedContent }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ContentGeneratorProps } from '../types/components'

const props = withDefaults(defineProps<ContentGeneratorProps>(), {
  showPreview: true,
  isLoading: false
})

const emit = defineEmits<{
  'update:isLoading': [isLoading: boolean]
  generated: [content: string]
}>()

const selectedType = ref<'blog' | 'social' | 'email' | 'product' | 'documentation'>(props.type)
const generatedContent = ref('')
const isLoading = ref(props.isLoading)

const handleGenerate = async () => {
  isLoading.value = true
  emit('update:isLoading', true)

  try {
    const content = await generateContent(selectedType.value)
    generatedContent.value = content
    emit('generated', content)
    await props.onGenerate(content)
  } catch (error) {
    console.error('Generation error:', error)
  } finally {
    isLoading.value = false
    emit('update:isLoading', false)
  }
}

const generateContent = async (type: string): Promise<string> => {
  // Mock generation - would use AI provider in real implementation
  const templates: Record<string, string> = {
    blog: `# ${selectedType.value} Post\n\nThis is a blog post about [topic]...`,
    social: `Check this out! [content] #AI`,
    email: `Subject: [Subject]\n\nDear [Name],\n\n[Body]`,
    product: `[Product Name]\n\nFeatures:\n- Feature 1\n- Feature 2`,
    documentation: `# Documentation\n\n## Overview\n[Description]`
  }
  return templates[type] || 'No template available'
}
</script>

<style scoped>
.weave-content-generator {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
}

@media (prefers-color-scheme: dark) {
  .weave-content-generator {
    background-color: #1a1a1a;
    border-color: #333;
  }
}

.weave-content-generator__controls {
  display: flex;
  gap: 12px;
}

.weave-content-generator__generate-button {
  flex: 1;
  padding: 10px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.weave-content-generator__generate-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.weave-content-generator__generate-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.weave-content-generator__type-select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  cursor: pointer;
}

@media (prefers-color-scheme: dark) {
  .weave-content-generator__type-select {
    background-color: #333;
    border-color: #555;
    color: #fff;
  }
}

.weave-content-generator__preview {
  padding: 12px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

@media (prefers-color-scheme: dark) {
  .weave-content-generator__preview {
    background-color: #252525;
    border-color: #444;
  }
}

.weave-content-generator__preview h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

@media (prefers-color-scheme: dark) {
  .weave-content-generator__preview h3 {
    color: #aaa;
  }
}

.weave-content-generator__preview-content {
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #333;
}

@media (prefers-color-scheme: dark) {
  .weave-content-generator__preview-content {
    color: #ccc;
  }
}
</style>
