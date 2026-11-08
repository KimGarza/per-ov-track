import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthButton } from '@/components/AuthButton';
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
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{
    flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl, backgroundColor: theme.colors.background,
  }}>
    <View style={{ width: '100%', maxWidth: theme.auth.maxWidth, gap: theme.spacing.lg }}>
      <View style={{ alignItems: 'center', gap: theme.spacing.sm, paddingBottom: theme.spacing.md }}>
        <Text accessibilityRole="header" style={{ fontFamily: theme.fonts.heading, fontSize: 42, lineHeight: 48, color: theme.colors.onBackground, textAlign: 'center' }}>Crimson Rhythm</Text>
        <Text style={{ color: theme.colors.mutedOnBackground, fontSize: 15, textAlign: 'center' }}>Grace for every season.</Text>
      </View>
      <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.auth.buttonGap }}>
        <View style={{ gap: 4, marginBottom: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.text, fontSize: 23, fontFamily: theme.fonts.heading, textAlign: 'center' }}>Welcome</Text>
          <Text style={{ color: theme.colors.muted, fontSize: 13, textAlign: 'center' }}>Your cycle, your reflections, your journey.</Text>
        </View>
        <AuthButton primary label="Get Started — Create Account" onPress={() => void begin(undefined, 'signup')} disabled={busy} />
        <AuthButton label="Sign In with Email" onPress={() => void begin()} disabled={busy} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginVertical: theme.spacing.xs }}>
          <View style={{ height: 1, flex: 1, backgroundColor: theme.colors.border }} />
          <Text style={{ fontSize: 12, color: theme.colors.muted }}>or continue with</Text>
          <View style={{ height: 1, flex: 1, backgroundColor: theme.colors.border }} />
        </View>
        <AuthButton provider="google" label="Google" onPress={() => void begin('Google')} disabled={busy} />
        <AuthButton provider="apple" label="Apple" onPress={() => void begin('SignInWithApple')} disabled={busy} />
        {busy && <ActivityIndicator color={theme.colors.rose} />}
        {!!error && <Text accessibilityRole="alert" style={{ color: '#A12626', textAlign: 'center', fontSize: 13 }}>{error}</Text>}
      </View>
      <Text style={{ color: theme.colors.mutedOnBackground, fontSize: 12, textAlign: 'center' }}>A quiet place to track and reflect.</Text>
    </View>
  </ScrollView>;
}
