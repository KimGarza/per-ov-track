import { View } from 'react-native';
import { Text } from './Themed';
import { useAppTheme } from './ThemeProvider';
import { dailyVerse } from '@/utils/faith';

export function FormSectionHeading({ title }: { title: string }) {
  const { styles: g, theme } = useAppTheme();
  return <View style={g.sectionRule}><Text accessibilityRole="header" style={g.sectionHeading}>{title}</Text><View style={g.rule} /><Text accessible={false} style={{ color: theme.colors.olive, fontSize: 23 }}>❧</Text></View>;
}
export function Encouragement({ day }: { day: string }) {
  const { styles: g } = useAppTheme();
  const verse = dailyVerse(day);
  return <View style={g.encouragement}><Text style={g.eyebrow}>✝ A little encouragement</Text><Text style={[g.body, { fontFamily: g.sectionHeading.fontFamily }]}>{verse.text}</Text><Text style={g.eyebrow}>{verse.reference} · KJV</Text></View>;
}
export function FlowerMood({ mood, selected = false, small = false }: { mood: string; selected?: boolean; small?: boolean }) {
  const { theme } = useAppTheme();
  const size = small ? 32 : theme.forms.flowerSize;
  const sleepy = mood === 'Calm' || mood === 'Tired';
  const worried = mood === 'Emotional' || mood === 'Anxious';
  const ink = theme.colors.text;
  return <View accessible={false} pointerEvents="none" style={{ width: size, height: size }}>
    {Array.from({ length: 8 }, (_, index) => { const angle = index * Math.PI / 4; return <View key={index} style={{ position: 'absolute', width: size * 0.4, height: size * 0.4, borderRadius: size, borderWidth: 0.7, borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? theme.colors.roseSoft : theme.colors.roseWash, left: size * (0.3 + 0.29 * Math.cos(angle)), top: size * (0.3 + 0.29 * Math.sin(angle)) }} />; })}
    <View style={{ position: 'absolute', left: size * 0.2, top: size * 0.2, width: size * 0.6, height: size * 0.6, borderRadius: size, borderWidth: 0.8, borderColor: ink, backgroundColor: theme.colors.surface, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: size * 0.11, marginTop: size * 0.19 }}>
        {[0, 1].map(eye => <View key={eye} style={{ width: size * 0.09, height: sleepy ? size * 0.04 : size * 0.065, borderBottomWidth: sleepy ? 1 : 0, borderColor: ink, borderRadius: size, backgroundColor: sleepy ? 'transparent' : ink }} />)}
      </View>
      <View style={{ width: size * 0.15, height: size * 0.09, marginTop: size * 0.06, borderBottomWidth: worried ? 0 : 1, borderTopWidth: worried ? 1 : 0, borderColor: ink, borderRadius: size }} />
    </View>
    {mood === 'Tired' && <Text style={{ position: 'absolute', top: -4, right: 0, color: ink, fontSize: small ? 8 : 11 }}>zᶻ</Text>}
    {mood === 'Emotional' && <View style={{ position: 'absolute', right: size * 0.23, top: size * 0.53, width: size * 0.05, height: size * 0.1, borderRadius: size, backgroundColor: theme.colors.rose }} />}
  </View>;
}
