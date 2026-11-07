import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { useAppTheme } from '@/components/ThemeProvider';
export default function AccountScreen() {
  const { profile, signOut } = useAuth();
  const { theme } = useAppTheme();
  const router = useRouter();
  const name = profile?.name || [profile?.given_name, profile?.family_name].filter(Boolean).join(' ') || profile?.email?.split('@')[0] || 'Your account';
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 18, backgroundColor: theme.colors.background, flexGrow: 1 }}>
    <Stack.Screen options={{ title: 'My Account' }} />
    <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '600' }}>{name}</Text>
    <Text style={{ color: theme.colors.text }}>{profile?.email ?? 'Email not provided'}</Text>
    <View style={{ height: 1, backgroundColor: theme.colors.border }} />
    <Pressable accessibilityRole="button" onPress={() => { void signOut().then(() => router.replace('/welcome')); }} style={{ padding: 16, borderWidth: 1, borderRadius: 12, borderColor: theme.colors.border }}>
      <Text style={{ color: theme.colors.text }}>Sign Out</Text>
    </Pressable>
  </ScrollView>;
}
