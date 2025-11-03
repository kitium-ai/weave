import { ProviderSwitch, ProviderEventFeed, useProviderRouting } from '@weaveai/react';
import type { UIAwareProviderRouter } from '@weaveai/core';

export function ProvidersPanel({ router }: { router: UIAwareProviderRouter }) {
  const routing = useProviderRouting({
    router,
    autoRefresh: true,
    refreshInterval: 5000,
  });

  return (
    <section>
      <h2>Provider Routing</h2>
      <ProviderSwitch
        providers={routing.providers}
        currentProvider={routing.currentProvider ?? undefined}
        onProviderSelect={routing.selectProvider}
      />
      <ProviderEventFeed events={routing.events} />
    </section>
  );
}
