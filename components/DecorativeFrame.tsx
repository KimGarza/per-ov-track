import { View, Text } from 'react-native';
import { useAppTheme } from './ThemeProvider';

/**
 * Temporary vector ornaments, independent of card dimensions.
 * Replace each named slot with a transparent PNG in assets/decor/<theme>/.
 * The inner frame is inset so it grows with the card while corners remain fixed size.
 */
export function DecorativeFrame({ variant = 'calendar' }: { variant?: 'calendar' | 'verse' }) {
  const { theme } = useAppTheme();
  const color = theme.colors.frameGold;
  if (theme.decoration !== 'botanical') return null;
  const inset = 8;
  const corners = [
    { top: inset, left: inset, transform: [{ rotate: '0deg' as const }] },
    { top: inset, right: inset, transform: [{ rotate: '90deg' as const }] },
    { bottom: inset, right: inset, transform: [{ rotate: '180deg' as const }] },
    { bottom: inset, left: inset, transform: [{ rotate: '270deg' as const }] },
  ];
  return <View pointerEvents="none" accessible={false} style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: theme.radius.card }}>
    <View style={{ position: 'absolute', top: inset, bottom: inset, left: inset, right: inset, borderWidth: 0.8, borderColor: color, borderRadius: theme.radius.card - 6, opacity: 0.75 }} />
    {corners.map((style, index) => <Text key={index} style={[{ position: 'absolute', color, fontSize: 23, lineHeight: 27, opacity: 0.88 }, style]}>❧</Text>)}
    <Text style={{ position: 'absolute', top: variant === 'calendar' ? '25%' : 10, left: 4, color, opacity: 0.55, fontSize: 21 }}>✿</Text>
    <Text style={{ position: 'absolute', top: variant === 'calendar' ? '40%' : 20, right: 4, color, opacity: 0.55, fontSize: 21 }}>✿</Text>
  </View>;
}
export function OrnamentalDivider() {
  const { theme } = useAppTheme();
  if (theme.decoration !== 'botanical') return null;
  return <View pointerEvents="none" accessible={false} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 5, height: 16 }}>
    <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.frameGold, opacity: 0.65 }} />
    <Text style={{ color: theme.colors.frameGold, fontSize: 16, lineHeight: 18 }}>❧✧❧</Text>
    <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.frameGold, opacity: 0.65 }} />
  </View>;
}
export function TitleFlourish() {
  const { theme } = useAppTheme();
  if (theme.decoration !== 'botanical') return null;
  return <Text pointerEvents="none" accessible={false} style={{ color: theme.colors.frameGold, fontSize: 18, lineHeight: 22 }}>❧</Text>;
}
