import { Image, Platform, Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { useAppTheme } from '@/components/ThemeProvider';

type Provider = 'google' | 'apple';
function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === 'google') {
    return <Image accessibilityLabel="Google" source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={{ width: 20, height: 20 }} resizeMode="contain" />;
  }
  if (Platform.OS === 'ios') return <Text accessibilityLabel="Apple" style={{ fontSize: 24, color: '#171717', lineHeight: 27 }}></Text>;
  // Draw a simple monochrome apple silhouette on Android, where the Apple font glyph is unavailable.
  return <View accessible accessibilityLabel="Apple" style={{ width: 24, height: 26, alignItems: 'center', justifyContent: 'flex-end' }}>
    <View style={{ width: 10, height: 5, borderRadius: 10, backgroundColor: '#171717', transform: [{ rotate: '-35deg' }], position: 'absolute', top: 0, right: 3 }} />
    <View style={{ width: 19, height: 19, borderRadius: 9, backgroundColor: '#171717', marginBottom: 1 }} />
    <View style={{ width: 6, height: 7, borderRadius: 5, backgroundColor: '#171717', position: 'absolute', bottom: 0 }} />
  </View>;
}
export function AuthButton({ label, onPress, primary = false, provider, disabled = false }: {
  label: string; onPress: (event: GestureResponderEvent) => void; primary?: boolean; provider?: Provider; disabled?: boolean;
}) {
  const { theme, styles } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={[styles.authButton, primary && styles.authButtonPrimary, disabled && styles.disabled]}>
    <View style={{ minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md }}>
      {provider && <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}><ProviderIcon provider={provider} /></View>}
      <Text style={[styles.authButtonText, primary && styles.authButtonPrimaryText]}>{label}</Text>
    </View>
  </Pressable>;
}
