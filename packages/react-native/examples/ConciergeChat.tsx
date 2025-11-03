import { useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { useAIChat } from '@weaveai/react-native';
import type { Weave } from '@weaveai/core';

export function ConciergeChat({ weave }: { weave: Weave }) {
  const chat = useAIChat(weave, {
    systemPrompt: 'You are a warm concierge for a boutique hotel.',
    streaming: { enabled: true, renderer: 'markdown' },
    persistence: { localStorage: 'concierge-chat', autoSave: true },
  });
  const [input, setInput] = useState('');

  const send = async () => {
    if (!input.trim()) {
      return;
    }
    await chat.sendMessage(input);
    setInput('');
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <FlatList
        data={chat.messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: '600' }}>{item.role}</Text>
            <Text>{item.content}</Text>
          </View>
        )}
      />

      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Ask the concierge…"
        style={{
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderRadius: 12,
          padding: 12,
        }}
      />

      <Button title="Send" onPress={send} disabled={chat.isLoading} />
    </View>
  );
}
