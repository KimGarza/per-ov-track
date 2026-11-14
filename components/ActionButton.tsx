import type { ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from './ThemeProvider';

type Variant = 'primary' | 'outline' | 'quiet' | 'danger';
function mixHex(start: string, end: string, fraction: number) {
  const parse = (value: string) => value.replace('#', '').match(/.{2}/g)?.map(v => parseInt(v, 16));
  const a = parse(start), b = parse(end);
  if (!a || !b || a.length !== 3 || b.length !== 3) return start;
  return '#' + a.map((value, i) => Math.round(value + (b[i] - value) * fraction).toString(16).padStart(2, '0')).join('');
}
export function ActionButton({ children, onPress, disabled, variant = 'outline', style }: {
  children: ReactNode; onPress: () => void; disabled?: boolean; variant?: Variant; style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const c = theme.colors;
  const gradient = variant === 'primary' || variant === 'danger';
  const from = variant === 'danger' ? c.todayPeriod : c.roseWash;
  const to = variant === 'danger' ? c.rose : c.roseSoft;
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[{
    alignSelf: 'flex-start', minHeight: 44, minWidth: 110, paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: variant === 'quiet' ? 0 : 1, borderColor: variant === 'danger' ? c.todayPeriod : c.border,
    backgroundColor: variant === 'quiet' ? 'transparent' : c.surface, opacity: disabled ? 0.45 : 1,
  }, style]}>
    {gradient && <View pointerEvents="none" style={{ position: 'absolute', inset: 0, flexDirection: 'row' }}>
      {Array.from({ length: 32 }, (_, i) => <View key={i} style={{ flex: 1, backgroundColor: mixHex(from, to, i / 31) }} />)}
    </View>}
    <Text style={{ color: variant === 'danger' ? c.white : c.text, fontSize: 14, fontWeight: '600' }}>{children}</Text>
  </Pressable>;
}
