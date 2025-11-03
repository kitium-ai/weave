import { useEffect } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { useGenerateAI } from '@weaveai/react-native';
import type { Weave } from '@weaveai/core';

export function InspirationCard({ weave }: { weave: Weave }) {
  const { generate, data, loading, cost } = useGenerateAI(weave, {
    trackCosts: true,
  });

  useEffect(() => {
    void generate('Write a playful note welcoming teammates to a planning session.');
  }, [generate]);

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Inspiration</Text>
      {loading && <ActivityIndicator />}
      {data && <Text>{data.data.text}</Text>}
      {cost && <Text>Cost: ${cost.totalCost.toFixed(4)}</Text>}
      <Button
        title="Generate another"
        onPress={() => generate('Share another motivational prompt.')}
      />
    </View>
  );
}
