import { Image, View } from 'react-native';
import { IllustrationPlaceholder } from './IllustrationPlaceholder';
import { Botanical } from './Botanical';
import { useAppTheme } from './ThemeProvider';

export function FaithBackdrop() {
  const { theme } = useAppTheme();
  if (theme.decoration === 'botanical') return <View pointerEvents="none" accessible={false} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden', backgroundColor: theme.colors.background }}>
    {Array.from({ length: 24 }, (_, i) => <View key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * 100 / 24}%`, width: `${100 / 24 + 0.2}%`, backgroundColor: i < 12 ? theme.colors.backgroundLight : theme.colors.backgroundDeep, opacity: 0.11 + i / 24 * 0.13 }} />)}
    {Array.from({ length: 90 }, (_, i) => <View key={`grain-${i}`} style={{ position: 'absolute', left: `${(i * 37.17) % 100}%`, top: `${(i * 61.37) % 100}%`, width: 1, height: 1, borderRadius: 1, backgroundColor: theme.colors.shadow, opacity: 0.055 }} />)}
    <View style={{ position: 'absolute', width: '100%', bottom: 0 }}><IllustrationPlaceholder faint /></View>
    <View style={{ position: 'absolute', left: -32, top: -60, opacity: 0.4 }}><Botanical small /></View>
    <View style={{ position: 'absolute', right: -12, bottom: -14 }}><Botanical flipped /></View>
    <View style={{ position: 'absolute', left: -28, bottom: 10 }}><Botanical /></View>
  </View>;
  if (theme.decoration !== 'celestial') return null;
  return <View pointerEvents="none" accessible={false} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}>
    <Image source={require('../assets/faith/moon-moth.png')} resizeMode="contain" style={{ position: 'absolute', right: -20, top: -15, width: 210, height: 140, opacity: 0.4 }} />
    <Image source={require('../assets/faith/moon-moth.png')} resizeMode="contain" style={{ position: 'absolute', left: -40, bottom: 0, width: 280, height: 190, opacity: 0.3 }} />
  </View>;
}


export function ThemeFloralAccent() {
  const { theme } = useAppTheme();
  if (theme.decoration !== 'botanical') return null;
  return <View pointerEvents="none" accessible={false} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: theme.radius.card, overflow: 'hidden' }}>
    <View style={{ position: 'absolute', right: -10, top: -46, opacity: 0.35 }}><Botanical small flipped /></View>
    <View style={{ position: 'absolute', left: -40, bottom: -70, opacity: 0.35 }}><Botanical small /></View>
  </View>;
}
