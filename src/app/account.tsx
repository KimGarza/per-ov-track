import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { useAppTheme } from '@/components/ThemeProvider';

type UserRecord = { first_name?: string | null; last_name?: string | null; display_name?: string | null; email?: string | null };
export default function AccountScreen() {
  const { profile, session, signOut } = useAuth();
  const { theme } = useAppTheme();
  const router = useRouter();
  const [first, setFirst] = useState(profile?.given_name ?? '');
  const [last, setLast] = useState(profile?.family_name ?? '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  useEffect(() => {
    if (!session || !base) return;
    let active = true;
    fetch(`${base}/users/me`, { headers: { Authorization: `Bearer ${session.idToken}` } })
      .then(async r => r.ok ? (await r.json() as { user: UserRecord }).user : null)
      .then(user => { if (active && user) { setFirst(user.first_name ?? ''); setLast(user.last_name ?? ''); } })
      .catch(() => {});
    return () => { active = false; };
  }, [session, base]);
  async function save() {
    if (!base || !session) { setMessage('API not configured'); return; }
    setSaving(true); setMessage('');
    try {
      const response = await fetch(`${base}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.idToken}` },
        body: JSON.stringify({ first_name: first, last_name: last }),
      });
      if (!response.ok) throw new Error(`Could not save your name (HTTP ${response.status})`);
      setMessage('Name saved');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save'); }
    finally { setSaving(false); }
  }
  const inputStyle = { color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12 };
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 16, backgroundColor: theme.colors.background, flexGrow: 1 }}>
    <Stack.Screen options={{ title: 'My Account' }} />
    <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '600' }}>My Account</Text>
    <Text style={{ color: theme.colors.text }}>{profile?.email ?? 'Email not provided'}</Text>
    <Text style={{ color: theme.colors.text }}>Name (optional)</Text>
    <Text style={{ color: theme.colors.muted, fontSize: 12 }}>Only add a name if you'd like to personalize your account.</Text>
    <TextInput accessibilityLabel="First name" value={first} onChangeText={setFirst} maxLength={80} autoCapitalize="words" style={inputStyle} />
    <Text style={{ color: theme.colors.text }}>Last name (optional)</Text>
    <TextInput accessibilityLabel="Last name" value={last} onChangeText={setLast} maxLength={80} autoCapitalize="words" style={inputStyle} />
    <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={{ padding: 14, borderRadius: 12, backgroundColor: theme.colors.roseWash, alignSelf: 'flex-start' }}>
      <Text style={{ color: theme.colors.text }}>Save changes</Text>
    </Pressable>
    {saving && <ActivityIndicator />}
    {!!message && <Text style={{ color: theme.colors.text }}>{message}</Text>}

    <Pressable accessibilityRole="button" onPress={() => { void signOut().then(() => router.replace('/welcome')); }} style={{ padding: 12, alignSelf: 'flex-start' }}>
      <Text style={{ color: theme.colors.text }}>Sign Out</Text>
    </Pressable>
  </ScrollView>;
}
