<script setup lang="ts">
import { ref } from 'vue';
import { useAIChat } from '@weaveai/vue';

const input = ref('');
const chat = useAIChat({
  systemPrompt: 'You are a charming concierge for a boutique hotel.',
  streaming: { enabled: true, renderer: 'markdown' },
  persistence: { localStorage: 'concierge-chat', autoSave: true },
});

const send = async () => {
  if (!input.value.trim()) {
    return;
  }

  await chat.sendMessage(input.value);
  input.value = '';
};
</script>

<template>
  <section class="chat-card">
    <h2>Concierge</h2>
    <ul>
      <li v-for="(message, index) in chat.messages" :key="index">
        <strong>{{ message.role }}:</strong>
        <span>{{ message.content }}</span>
      </li>
    </ul>

    <form @submit.prevent="send">
      <input v-model="input" placeholder="Ask the concierge…" />
      <button :disabled="chat.isLoading">Send</button>
    </form>
  </section>
</template>
