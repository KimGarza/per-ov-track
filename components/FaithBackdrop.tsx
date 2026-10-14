import { Image, View } from 'react-native';
import { IllustrationPlaceholder } from './IllustrationPlaceholder';
import { Botanical } from './Botanical';
import { useAppTheme } from './ThemeProvider';

export function FaithBackdrop() {
  const { theme } = useAppTheme();
  if (theme.decoration === 'botanical') return <View pointerEvents="none" accessible={false} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}>
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
