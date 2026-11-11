import type { ReactNode } from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from './ThemeProvider';
type Variant = 'primary' | 'outline' | 'quiet' | 'danger';
export function ActionButton({ children, onPress, disabled, variant = 'outline', style }: {
  children: ReactNode; onPress: () => void; disabled?: boolean; variant?: Variant; style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const c = theme.colors;
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[{
    alignSelf: 'flex-start', minHeight: 42, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: variant === 'quiet' ? 0 : 1,
    borderColor: variant === 'danger' ? c.todayPeriod : c.border,
    backgroundColor: variant === 'primary' ? c.roseWash : variant === 'quiet' ? 'transparent' : c.surface,
    opacity: disabled ? 0.45 : 1,
  }, style]}><Text style={{ color: variant === 'danger' ? c.todayPeriod : c.text, fontSize: 14, fontWeight: '600' }}>{children}</Text></Pressable>;
}
