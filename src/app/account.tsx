import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { useAppTheme } from '@/components/ThemeProvider';
import { ActionButton } from '@/components/ActionButton';

export const avatarChoices = [
  { id: 'flower', icon: '✿' }, { id: 'dove', icon: '🕊' }, { id: 'heart', icon: '♡' },
  { id: 'cross', icon: '✝' }, { id: 'sun', icon: '☼' }, { id: 'leaf', icon: '❧' },
] as const;
type Avatar = typeof avatarChoices[number]['id'];
const cognitoDomain = process.env.EXPO_PUBLIC_COGNITO_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;
async function cognitoAction(action: string, payload: Record<string, string>) {
  if (!cognitoDomain || !clientId) throw new Error('Password recovery is not configured.');
  const region = cognitoDomain.split('.auth.')[1]?.split('.')[0] ?? 'us-east-1';
  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-amz-json-1.1', 'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}` },
    body: JSON.stringify({ ClientId: clientId, ...payload }),
  });
  if (!response.ok) throw new Error('Unable to complete password recovery. Check the email or verification code and try again.');
}
export default function AccountScreen() {
  const { profile, session, signOut } = useAuth();
  const { theme } = useAppTheme();
  const [avatar, setAvatar] = useState<Avatar>('flower');
  const [chooser, setChooser] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  useEffect(() => {
    if (!session || !base) return;
    let active = true;
    fetch(`${base}/users/me`, { headers: { Authorization: `Bearer ${session.idToken}` } })
      .then(async response => response.ok ? await response.json() as { user: { avatar?: Avatar } } : null)
      .then(result => { if (active && result?.user.avatar) setAvatar(result.user.avatar); })
      .catch(() => {});
    return () => { active = false; };
  }, [session, base]);
  async function saveAvatar(value: Avatar) {
    if (!session || !base) { setMessage('Internet connection required.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${base}/users/me`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.idToken}` }, body: JSON.stringify({ avatar: value }) });
      if (!response.ok) throw new Error('Avatar could not be saved.');
      setAvatar(value); setChooser(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save avatar'); }
    finally { setBusy(false); }
  }
  async function passwordAction() {
    if (!profile?.email) { setMessage('No email address is available for password recovery.'); return; }
    setBusy(true); setMessage('');
    try {
      if (!codeSent) { await cognitoAction('ForgotPassword', { Username: profile.email }); setCodeSent(true); setMessage('Check your email for the verification code.'); }
      else { await cognitoAction('ConfirmForgotPassword', { Username: profile.email, ConfirmationCode: code.trim(), Password: newPassword }); setResetOpen(false); setCodeSent(false); setCode(''); setNewPassword(''); setMessage('Password updated.'); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Password reset failed'); }
    finally { setBusy(false); }
  }
  const confirmDelete = () => Alert.alert('Delete your account permanently?', 'This permanently deletes your Crimson Rhythm account and its saved cycle data. This cannot be undone. Internet is required.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete account', style: 'destructive', onPress: () => { void deleteAccount(); } },
  ]);
  async function deleteAccount() {
    if (!session || !base) { setMessage('Connect to the internet to delete your account.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${base}/users/me`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.idToken}` } });
      if (!response.ok) throw new Error('Account deletion was not confirmed. Please try again while connected.');
      if (profile?.sub) {
        const sub = profile.sub;
        await AsyncStorage.multiRemove([
          `crimson-rhythm:cycle-data:v1:${sub}`,
          `crimson-rhythm:cycle-onboarding:v1:${sub}`,
          `crimson-rhythm:cycle-onboarding:v1:${sub}:pending`,
          `crimson-rhythm:sync:v1:${sub}`,
          `crimson-rhythm:theme:v1:${sub}`,
        ]);
        await SecureStore.deleteItemAsync(`crimson.pin.${sub}`).catch(() => {});
      }
      await signOut(); router.replace('/welcome');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Account deletion failed'); }
    finally { setBusy(false); }
  }
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 16, backgroundColor: theme.colors.background, flexGrow: 1 }}>
    <Stack.Screen options={{ title: 'My Account' }} />
    <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: 30 }}>My Account</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose account avatar" onPress={() => setChooser(!chooser)} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.roseWash, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 27, color: theme.colors.rose }}>{avatarChoices.find(a => a.id === avatar)?.icon}</Text></Pressable>
      <Text style={{ flex: 1, color: theme.colors.text }}>{profile?.email ?? 'My account'}</Text>
    </View>
    {chooser && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 18 }}>
      {avatarChoices.map(choice => <Pressable key={choice.id} accessibilityRole="button" accessibilityLabel={`Choose ${choice.id} avatar`} onPress={() => { void saveAvatar(choice.id); }} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: avatar === choice.id ? theme.colors.roseWash : theme.colors.background }}><Text style={{ fontSize: 26, color: theme.colors.rose }}>{choice.icon}</Text></Pressable>)}
    </View>}
    <ActionButton onPress={() => setResetOpen(value => !value)}>Reset password</ActionButton>
    {resetOpen && <View style={{ gap: 12 }}>
      <Text style={{ color: theme.colors.muted }}>Password recovery for email sign-in. Google and Apple passwords are managed by those providers.</Text>
      {codeSent && <>
        <TextInput accessibilityLabel="Verification code" placeholder="Email verification code" placeholderTextColor={theme.colors.placeholder} value={code} onChangeText={setCode} keyboardType="number-pad" style={{ padding: 12, borderRadius: 12, backgroundColor: theme.colors.surface, color: theme.colors.text }} />
        <TextInput accessibilityLabel="New password" placeholder="New password" placeholderTextColor={theme.colors.placeholder} secureTextEntry value={newPassword} onChangeText={setNewPassword} style={{ padding: 12, borderRadius: 12, backgroundColor: theme.colors.surface, color: theme.colors.text }} />
      </>}
      <ActionButton variant="primary" disabled={busy} onPress={() => { void passwordAction(); }}>{codeSent ? 'Confirm new password' : 'Send reset code'}</ActionButton>
    </View>}
    <ActionButton variant="danger" disabled={busy} onPress={confirmDelete}>Delete account</ActionButton>
    {busy && <ActivityIndicator />}
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.text }}>{message}</Text>}
  </ScrollView>;
}
