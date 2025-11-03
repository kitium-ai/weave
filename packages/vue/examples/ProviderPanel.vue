<script setup lang="ts">
import { useProviderRouting } from '@weaveai/vue';
import type { UIAwareProviderRouter } from '@weaveai/core';

const props = defineProps<{
  router: UIAwareProviderRouter;
}>();

const routing = useProviderRouting({
  router: props.router,
  autoRefresh: true,
  refreshInterval: 5000,
});
</script>

<template>
  <section class="panel">
    <h2>Provider Routing</h2>
    <div class="providers">
      <article
        v-for="provider in routing.providers"
        :key="provider.name"
        :class="{ active: provider.name === routing.currentProvider }"
      >
        <h3>{{ provider.name }}</h3>
        <p>Status: {{ provider.healthy ? 'Healthy' : 'Offline' }}</p>
        <p>Success: {{ provider.successRate.toFixed(1) }}%</p>
        <p>Latency: {{ provider.latency.toFixed(0) }}ms</p>
        <button
          :disabled="!provider.healthy"
          @click="routing.selectProvider(provider.name)"
        >
          Route here
        </button>
      </article>
    </div>

    <ol class="events">
      <li v-for="(event, index) in routing.events" :key="index">
        <strong>{{ event.type }}</strong>
        <span v-if="event.from">: {{ event.from }} → {{ event.to }}</span>
        <span v-else>: {{ event.to }}</span>
        <small>{{ event.timestamp.toLocaleTimeString() }}</small>
      </li>
    </ol>
  </section>
</template>
