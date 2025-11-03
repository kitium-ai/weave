import { View, Text, Button } from 'react-native';
import { useProviderRouting } from '@weaveai/react-native';
import type { UIAwareProviderRouter } from '@weaveai/core';

export function ProviderHub({ router }: { router: UIAwareProviderRouter }) {
  const routing = useProviderRouting(router, { autoRefresh: true, refreshInterval: 5000 });

  return (
    <View style={{ gap: 16 }}>
      {routing.providers.map((provider) => (
        <View
          key={provider.name}
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor: provider.name === routing.currentProvider ? '#2563eb' : '#e5e7eb',
            borderRadius: 12,
            gap: 4,
          }}
        >
          <Text style={{ fontWeight: '600' }}>{provider.name}</Text>
          <Text>Status: {provider.healthy ? 'Healthy' : 'Offline'}</Text>
          <Text>Latency: {provider.latency.toFixed(0)}ms</Text>
          <Text>Success: {provider.successRate.toFixed(1)}%</Text>
          <Button
            title="Route here"
            onPress={() => routing.selectProvider(provider.name)}
            disabled={!provider.healthy}
          />
        </View>
      ))}

      <View>
        <Text style={{ fontWeight: '600' }}>Recent events</Text>
        {routing.events.map((event, index) => (
          <Text key={index}>
            {event.type}: {event.from ? `${event.from} → ${event.to}` : event.to}
          </Text>
        ))}
      </View>
    </View>
  );
}
