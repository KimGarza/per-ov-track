import { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { checkApiHealth, getApiBaseUrl } from '@/src/services/api';

export default function CloudCheckScreen() {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'failure'>('idle');
  const [detail, setDetail] = useState('');
  async function run() {
    setState('loading');
    setDetail('');
    try {
      const result = await checkApiHealth();
      if (result.status !== 'ok') throw new Error('Unexpected health response');
      setDetail('API Gateway and Lambda responded successfully.');
      setState('success');
    } catch (error) {
      setDetail(error instanceof Error ? error.message : 'Connection failed');
      setState('failure');
    }
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Stack.Screen options={{ title: 'Cloud connection test' }} />
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Crimson Rhythm cloud connection</Text>
      <Text selectable>API: {getApiBaseUrl() ?? 'Not configured'}</Text>
      <Button title="Check API connection" onPress={() => { void run(); }} disabled={state === 'loading'} />
      {state === 'loading' && <ActivityIndicator accessibilityLabel="Checking connection" />}
      {state !== 'idle' && state !== 'loading' && <View><Text accessibilityRole="text">{state === 'success' ? 'Connected' : 'Not connected'}</Text><Text>{detail}</Text></View>}
      <Text>This checks API Gateway → Lambda only. It does not access PostgreSQL or send personal data.</Text>
    </ScrollView>
  );
}
