<script lang="ts">
  import { createProviderRoutingStore } from '@weaveai/svelte';
  import type { UIAwareProviderRouter } from '@weaveai/core';

  export let router: UIAwareProviderRouter;

  const store = createProviderRoutingStore(router, {
    autoRefresh: true,
    refreshInterval: 5000,
  });
</script>

<section class="panel">
  <h2>Provider Routing</h2>
  <div class="grid">
    {#each $store.state.providers as provider}
      <article class:active={provider.name === $store.state.currentProvider}>
        <h3>{provider.name}</h3>
        <p>Status: {provider.healthy ? 'Healthy' : 'Offline'}</p>
        <p>Latency: {provider.latency.toFixed(0)}ms</p>
        <p>Success: {provider.successRate.toFixed(1)}%</p>
        <button on:click={() => store.selectProvider(provider.name)} disabled={!provider.healthy}>
          Route here
        </button>
      </article>
    {/each}
  </div>

  <ol class="events">
    {#each $store.state.events as event}
      <li>
        <strong>{event.type}</strong>
        {#if event.from}
          {event.from} → {event.to}
        {:else}
          {event.to}
        {/if}
        <small>{event.timestamp.toLocaleTimeString()}</small>
      </li>
    {/each}
  </ol>
</section>
