<script setup lang="ts">
import { ref } from 'vue';
import { useGenerateAI } from '@weaveai/vue';

const prompt = ref('Write a playful onboarding message.');
const { generate, data, loading, cost } = useGenerateAI({
  trackCosts: true,
});

const run = () => generate(prompt.value);
</script>

<template>
  <section class="card">
    <h2>Generate Copy</h2>
    <textarea v-model="prompt" rows="3" />
    <button :disabled="loading" @click="run">
      {{ loading ? 'Generating…' : 'Generate' }}
    </button>

    <pre v-if="data">{{ data.data.text }}</pre>
    <p v-if="cost">Cost so far: {{ cost.totalCost.toFixed(4) }} {{ cost.currency }}</p>
  </section>
</template>
