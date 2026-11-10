import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { useAppTheme } from '@/components/ThemeProvider';

export const avatarChoices = [
  { id: 'flower', icon: '✿' }, { id: 'dove', icon: '🕊' }, { id: 'heart', icon: '♡' },
  { id: 'cross', icon: '✝' }, { id: 'sun', icon: '☼' }, { id: 'leaf', icon: '❧' },
] as const;
type Avatar = typeof avatarChoices[number]['id'];
export default function AccountScreen() {
  const { profile, session } = useAuth();
  const { theme } = useAppTheme();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<Avatar>('flower');
  const [chooser, setChooser] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  useEffect(() => {
    if (!session || !base) return;
    let active = true;
    fetch(`${base}/users/me`, { headers: { Authorization: `Bearer ${session.idToken}` } })
      .then(async r => r.ok ? (await r.json() as { user: { username?: string | null; avatar?: Avatar } }).user : null)
      .then(user => { if (active && user) { setUsername(user.username ?? ''); setAvatar(user.avatar ?? 'flower'); } })
      .catch(() => { if (active) setMessage('Account details could not be loaded.'); });
    return () => { active = false; };
  }, [session, base]);
  async function save(nextAvatar = avatar) {
    if (!base || !session) { setMessage('Account service unavailable'); return; }
    setSaving(true); setMessage('');
    try {
      const response = await fetch(`${base}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.idToken}` },
        body: JSON.stringify({ username: username.trim(), avatar: nextAvatar }),
      });
      if (!response.ok) throw new Error(response.status === 409 ? 'Username is already taken.' : 'Could not save account changes.');
      setAvatar(nextAvatar); setMessage('Changes saved');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save'); }
    finally { setSaving(false); }
  }
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 18, backgroundColor: theme.colors.background, flexGrow: 1 }}>
    <Stack.Screen options={{ title: 'My Account' }} />
    <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: 30 }}>My Account</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose account avatar" onPress={() => setChooser(!chooser)} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.roseWash, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 27, color: theme.colors.rose }}>{avatarChoices.find(a => a.id === avatar)?.icon}</Text></Pressable>
      <Text style={{ flex: 1, color: theme.colors.text }}>{profile?.email ?? 'Email not provided'}</Text>
    </View>
    {chooser && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 18 }}>
      {avatarChoices.map(choice => <Pressable key={choice.id} accessibilityRole="button" accessibilityLabel={`Choose ${choice.id} avatar`} accessibilityState={{ selected: avatar === choice.id }} onPress={() => { setChooser(false); void save(choice.id); }} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: avatar === choice.id ? theme.colors.roseWash : theme.colors.background }}><Text style={{ fontSize: 26, color: theme.colors.rose }}>{choice.icon}</Text></Pressable>)}
    </View>}
    <Text style={{ color: theme.colors.text }}>Username (optional)</Text>
    <TextInput accessibilityLabel="Username" value={username} onChangeText={setUsername} maxLength={40} autoCapitalize="none" autoCorrect={false} placeholder="Choose a username" placeholderTextColor={theme.colors.placeholder} style={{ color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 14, borderRadius: 12 }} />
    <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.roseWash, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 }}><Text style={{ color: theme.colors.text }}>Save changes</Text></Pressable>
    {saving && <ActivityIndicator />}
    {!!message && <Text accessibilityRole="status" style={{ color: theme.colors.text }}>{message}</Text>}
  </ScrollView>;
}
