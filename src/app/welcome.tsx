import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { useAppTheme } from '@/components/ThemeProvider';

export default function WelcomeScreen() {
  const router = useRouter();
  const { session, signIn } = useAuth();
  const { theme } = useAppTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (session) { router.replace('/(tabs)'); return null; }
  async function begin(provider?: 'Google' | 'SignInWithApple', mode: 'login' | 'signup' = 'login') {
    setError(''); setBusy(true);
    try { await signIn(provider, mode); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in'); }
    finally { setBusy(false); }
  }
  const button = (label: string, action: () => void, emphasized = false) =>
    <Pressable disabled={busy} accessibilityRole="button" onPress={action} style={{ padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: emphasized ? theme.colors.rose : theme.colors.surface }}>
      <Text style={{ textAlign: 'center', color: emphasized ? '#fff' : theme.colors.text, fontWeight: '600', fontSize: 16 }}>{label}</Text>
    </Pressable>;
  return <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28, gap: 16, backgroundColor: theme.colors.background }}>
    <Text style={{ fontSize: 36, textAlign: 'center', color: theme.colors.text, fontWeight: '600' }}>Welcome to Crimson Rhythm</Text>
    <Text style={{ textAlign: 'center', fontSize: 16, color: theme.colors.text, marginBottom: 18 }}>Grace for every season.</Text>
    {button('Get Started — Create Account', () => void begin(undefined, 'signup'), true)}
    {button('Sign In with Email', () => void begin())}
    {button('Continue with Google', () => void begin('Google'))}
    {button('Continue with Apple', () => void begin('SignInWithApple'))}
    {busy && <ActivityIndicator />}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#a22', textAlign: 'center' }}>{error}</Text>}
  </ScrollView>;
}
