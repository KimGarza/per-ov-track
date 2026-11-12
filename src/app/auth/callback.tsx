import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

if (Platform.OS === 'web') WebBrowser.maybeCompleteAuthSession();
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';

export default function AuthCallback() {
  const router = useRouter();
  const { ready, session } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (ready && session) router.replace('/(tabs)');
  }, [ready, session, router]);

  useEffect(() => {
    if (!ready || session) return;
    const timeout = setTimeout(() => setTimedOut(true), 15000);
    return () => clearTimeout(timeout);
  }, [ready, session]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
      {!timedOut && <ActivityIndicator />}
      <Text>{session ? 'Opening your calendar…' : timedOut ? 'Sign-in did not finish.' : 'Finishing sign in…'}</Text>
      {timedOut && !session && (
        <Pressable accessibilityRole="button" onPress={() => router.replace('/welcome')} style={{ padding: 14 }}>
          <Text style={{ textDecorationLine: 'underline' }}>Return to sign in</Text>
        </Pressable>
      )}
    </View>
  );
}
