<template>
  <div class="weave-chatbox" :class="`weave-chatbox--${theme}`">
    <div class="weave-chatbox__messages" ref="messagesContainer">
      <div
        v-for="message in messages"
        :key="message.id"
        class="weave-chatbox__message"
        :class="`weave-chatbox__message--${message.role}`"
      >
        <div class="weave-chatbox__message-content">
          <span v-if="enableMarkdown" v-html="formatMarkdown(message.content)"></span>
          <span v-else>{{ message.content }}</span>
        </div>
        <div v-if="showTimestamps && message.timestamp" class="weave-chatbox__timestamp">
          {{ formatTime(message.timestamp) }}
        </div>
      </div>
      <div v-if="isLoading" class="weave-chatbox__loading">
        <span></span><span></span><span></span>
      </div>
    </div>
    <form class="weave-chatbox__form" @submit.prevent="handleSend">
      <textarea
        v-model="inputMessage"
        :placeholder="placeholder"
        class="weave-chatbox__input"
        @keydown.enter.ctrl="handleSend"
      ></textarea>
      <button
        type="submit"
        class="weave-chatbox__send-button"
        :disabled="!inputMessage || isLoading"
      >
        Send
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { AIChatboxProps, ChatMessage } from '../types/components';
import { ErrorLogLevel, logError } from '@weaveai/shared';

const props = withDefaults(defineProps<AIChatboxProps>(), {
  theme: 'light',
  showTimestamps: false,
  enableMarkdown: false,
  placeholder: 'Type your message...',
});

const emit = defineEmits<{
  sendMessage: [message: string];
}>();

const messages = ref<ChatMessage[]>(props.initialMessages || []);
const inputMessage = ref('');
const isLoading = ref(false);
const messagesContainer = ref<HTMLDivElement | null>(null);

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />');
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const handleSend = async () => {
  if (!inputMessage.value.trim()) return;

  const userMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date(),
  };

  messages.value.push(userMessage);
  const messageToSend = inputMessage.value;
  inputMessage.value = '';

  emit('sendMessage', messageToSend);
  await scrollToBottom();

  if (props.onSendMessage) {
    isLoading.value = true;
    try {
      await props.onSendMessage(messageToSend);
    } catch (error) {
      logError('Error sending message:', ErrorLogLevel.ERROR, error);
    } finally {
      isLoading.value = false;
    }
  }
};

watch(
  () => props.initialMessages,
  (newMessages) => {
    if (newMessages) {
      messages.value = newMessages;
      scrollToBottom();
    }
  }
);

watch(messages, scrollToBottom, { deep: true });
</script>

<style scoped>
.weave-chatbox {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 600px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
}

.weave-chatbox--dark {
  background-color: #1a1a1a;
  border-color: #333;
}

.weave-chatbox__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weave-chatbox__message {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 80%;
  animation: messageSlide 0.3s ease-out;
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.weave-chatbox__message--user {
  align-self: flex-end;
}

.weave-chatbox__message--assistant {
  align-self: flex-start;
}

.weave-chatbox__message-content {
  padding: 12px 16px;
  border-radius: 8px;
  word-wrap: break-word;
}

.weave-chatbox__message--user .weave-chatbox__message-content {
  background-color: #007bff;
  color: white;
}

.weave-chatbox--dark .weave-chatbox__message--user .weave-chatbox__message-content {
  background-color: #0056b3;
}

.weave-chatbox__message--assistant .weave-chatbox__message-content {
  background-color: #f0f0f0;
  color: #000;
}

.weave-chatbox--dark .weave-chatbox__message--assistant .weave-chatbox__message-content {
  background-color: #333;
  color: #fff;
}

.weave-chatbox__timestamp {
  font-size: 0.75rem;
  color: #999;
  margin: 0 4px;
}

.weave-chatbox__loading {
  display: flex;
  gap: 4px;
  padding: 12px;
}

.weave-chatbox__loading span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #999;
  animation: pulse 1.4s infinite;
}

.weave-chatbox__loading span:nth-child(2) {
  animation-delay: 0.2s;
}

.weave-chatbox__loading span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

.weave-chatbox__form {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.weave-chatbox--dark .weave-chatbox__form {
  background-color: #252525;
  border-top-color: #333;
}

.weave-chatbox__input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 40px;
  max-height: 120px;
}

.weave-chatbox--dark .weave-chatbox__input {
  background-color: #333;
  border-color: #555;
  color: #fff;
}

.weave-chatbox__send-button {
  padding: 10px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.weave-chatbox__send-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.weave-chatbox__send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .weave-chatbox__message {
    animation: none;
  }

  .weave-chatbox__loading span {
    animation: none;
  }
}
</style>
