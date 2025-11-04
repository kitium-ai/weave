<template>
  <form class="weave-form" @submit.prevent="handleSubmit">
    <div v-for="field in schema" :key="field.name" class="weave-form__field-group">
      <label :for="field.name" class="weave-form__label">
        {{ field.label }}
        <span v-if="field.required" class="weave-form__required">*</span>
      </label>

      <input
        v-if="field.type === 'text' || field.type === 'email' || field.type === 'number'"
        :id="field.name"
        v-model="formData[field.name]"
        :type="field.type"
        :placeholder="field.placeholder"
        :required="field.required"
        :minlength="field.minLength"
        :maxlength="field.maxLength"
        :pattern="field.pattern"
        class="weave-form__input"
      />

      <textarea
        v-else-if="field.type === 'textarea'"
        :id="field.name"
        v-model="formData[field.name]"
        :placeholder="field.placeholder"
        :required="field.required"
        class="weave-form__textarea"
      ></textarea>

      <select
        v-else-if="field.type === 'select'"
        :id="field.name"
        v-model="formData[field.name]"
        :required="field.required"
        class="weave-form__select"
      >
        <option value="">Select an option...</option>
        <option v-for="option in field.options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <label v-else-if="field.type === 'checkbox'" class="weave-form__checkbox">
        <input
          :id="field.name"
          v-model="formData[field.name]"
          type="checkbox"
          :required="field.required"
        />
        <span>{{ field.placeholder }}</span>
      </label>

      <div v-if="errors && errors[field.name]" class="weave-form__error">
        {{ errors[field.name] }}
      </div>
    </div>

    <button
      v-if="showAIFill && onAIFill"
      type="button"
      class="weave-form__ai-button"
      @click="handleAIFill"
      :disabled="isSubmitting"
    >
      ✨ Fill with AI
    </button>

    <button type="submit" class="weave-form__submit-button" :disabled="isSubmitting">
      {{ isSubmitting ? 'Submitting...' : 'Submit' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { AIFormProps } from '../types/components';

const props = withDefaults(defineProps<AIFormProps>(), {
  showAIFill: true,
  isSubmitting: false,
});

const emit = defineEmits<{
  submit: [values: Record<string, unknown>];
}>();

const formData = reactive<Record<string, unknown>>({});
const isSubmitting = ref(props.isSubmitting);

// Initialize form data
props.schema.forEach((field) => {
  formData[field.name] = field.type === 'checkbox' ? false : '';
});

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    await props.onSubmit(formData);
    emit('submit', formData);
  } catch (error) {
    logError('Form submission error:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleAIFill = async () => {
  if (!props.onAIFill) return;

  isSubmitting.value = true;
  try {
    for (const field of props.schema) {
      const aiValue = await props.onAIFill(field.name, formData[field.name]);
      if (aiValue !== undefined) {
        formData[field.name] = aiValue;
      }
    }
  } catch (error) {
    logError('AI fill error:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.weave-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
}

.weave-form__field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.weave-form__label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

@media (prefers-color-scheme: dark) {
  .weave-form__label {
    color: #e0e0e0;
  }
}

.weave-form__required {
  color: #d32f2f;
}

.weave-form__input,
.weave-form__textarea,
.weave-form__select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.weave-form__input:focus,
.weave-form__textarea:focus,
.weave-form__select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

@media (prefers-color-scheme: dark) {
  .weave-form__input,
  .weave-form__textarea,
  .weave-form__select {
    background-color: #333;
    border-color: #555;
    color: #fff;
  }

  .weave-form__input:focus,
  .weave-form__textarea:focus,
  .weave-form__select:focus {
    border-color: #0056b3;
  }
}

.weave-form__textarea {
  resize: vertical;
  min-height: 100px;
}

.weave-form__checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.weave-form__checkbox input {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.weave-form__error {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
}

.weave-form__ai-button {
  padding: 10px 16px;
  background-color: #9c27b0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.weave-form__ai-button:hover:not(:disabled) {
  background-color: #7b1fa2;
}

.weave-form__ai-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.weave-form__submit-button {
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: background-color 0.2s;
}

.weave-form__submit-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.weave-form__submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
