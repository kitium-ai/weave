<script lang="ts">
  // Assume `weave` is provided by your application bootstrap.
  import { createGenerateStore } from '@weaveai/svelte';
  import type { Weave } from '@weaveai/core';

  export let weave: Weave;

  const generator = createGenerateStore(weave, { trackCosts: true });

  async function run() {
    await generator.generate('Draft a motivational message for a remote team.');
  }
</script>

<section class="card">
  <h2>Generate Copy</h2>
  <button on:click={run} disabled={$generator.state.loading}>
    {$generator.state.loading ? 'Generating…' : 'Generate message'}
  </button>

  {#if $generator.state.data}
    <pre>{$generator.state.data.data.text}</pre>
  {/if}

  {#if $generator.state.cost}
    <small>
      Cost: {$generator.state.cost.totalCost.toFixed(4)} {$generator.state.cost.currency}
    </small>
  {/if}
</section>
