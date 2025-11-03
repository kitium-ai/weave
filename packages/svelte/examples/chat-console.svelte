<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createChatStore } from '@weaveai/svelte';
  import type { Weave } from '@weaveai/core';

  export let weave: Weave;

  const chat = createChatStore(weave, {
    systemPrompt: 'You are a lively teammate.',
    streaming: { enabled: true, renderer: 'markdown', framework: 'svelte' },
    persistence: { key: 'chat-console', autoSave: true },
  });

  let input = '';

  async function send() {
    if (!input.trim()) return;
    await chat.sendMessage(input);
    input = '';
  }

  onDestroy(() => chat.dispose());
</script>

<section class="console">
  <h2>Team Chat</h2>
  <div class="messages">
    {#each $chat.state.messages as message, index}
      <article>
        <strong>{message.role}</strong>
        <p>{message.content}</p>
      </article>
    {/each}
  </div>

  <footer>
    <input bind:value={input} placeholder="Share an update…" />
    <button on:click={send} disabled={$chat.state.isLoading}>Send</button>
  </footer>
</section>
