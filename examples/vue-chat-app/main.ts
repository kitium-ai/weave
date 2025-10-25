/**
 * Vue 3 Chat Application Example
 * Demonstrates useAI composable with Vue 3 Composition API
 */

import { createApp } from 'vue';
import { createWeave } from '@weave/core';
import { OpenAIProvider } from '@weave/core/providers';
import App from './App.vue';

// Initialize Weave with OpenAI provider
const weave = createWeave({
  provider: new OpenAIProvider({
    apiKey: process.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-4',
  }),
});

const app = createApp(App);

// Provide Weave instance to all components
app.provide('weave', weave);

app.mount('#app');
