import { useEffect, useState } from 'react';
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
  useEffect(() => { if (session) router.replace('/(tabs)'); }, [session, router]);
  if (session) return null;
  async function begin(provider?: 'Google' | 'SignInWithApple', mode: 'login' | 'signup' = 'login') {
    setError(''); setBusy(true);
    try { await signIn(provider, mode); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in'); }
    finally { setBusy(false); }
  }
  const button = (label: string, action: () => void, emphasized = false, provider?: 'Google' | 'Apple', disabled = false) =>
    <Pressable disabled={busy || disabled} accessibilityRole="button" onPress={action} style={{ padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, opacity: disabled ? 0.55 : 1, backgroundColor: emphasized ? theme.colors.rose : theme.colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {provider === 'Google' && <Text accessibilityLabel="Google icon" style={{ fontSize: 21, fontWeight: '800', color: '#4285F4' }}>G</Text>}
        {provider === 'Apple' && <Text accessibilityLabel="Apple icon" style={{ fontSize: 23, fontWeight: '700', color: theme.colors.text }}></Text>}
        <Text style={{ textAlign: 'center', color: emphasized ? '#fff' : theme.colors.text, fontWeight: '600', fontSize: 16 }}>{label}</Text>
      </View>
    </Pressable>;
  return <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28, gap: 16, backgroundColor: theme.colors.background }}>
    <Text style={{ fontSize: 36, textAlign: 'center', color: theme.colors.text, fontWeight: '600' }}>Welcome to Crimson Rhythm</Text>
    <Text style={{ textAlign: 'center', fontSize: 16, color: theme.colors.text, marginBottom: 18 }}>Grace for every season.</Text>
    {button('Get Started — Create Account', () => void begin(undefined, 'signup'), true)}
    {button('Sign In with Email', () => void begin())}
    {button('Continue with Google', () => void begin('Google'), false, 'Google')}
    {button(process.env.EXPO_PUBLIC_APPLE_LOGIN_ENABLED === 'true' ? 'Continue with Apple' : 'Apple Sign-In (setup pending)', () => void begin('SignInWithApple'), false, 'Apple', process.env.EXPO_PUBLIC_APPLE_LOGIN_ENABLED !== 'true')}
    {busy && <ActivityIndicator />}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#a22', textAlign: 'center' }}>{error}</Text>}
  </ScrollView>;
}
