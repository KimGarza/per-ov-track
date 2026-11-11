import { Image, Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { useAppTheme } from '@/components/ThemeProvider';

type Provider = 'google' | 'apple';
function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === 'google') {
    return <Image accessibilityLabel="Google" source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={{ width: 20, height: 20 }} resizeMode="contain" />;
  }
  return <Image accessibilityLabel="Apple" source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/64px-Apple_logo_black.svg.png" }} style={{ width: 20, height: 24 }} resizeMode="contain" />;
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
