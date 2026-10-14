import { Image, View } from 'react-native';
import { useAppTheme } from './ThemeProvider';

export function FaithBackdrop() {
  const { theme } = useAppTheme();
  if (theme.decoration !== 'celestial') return null;
  return <View pointerEvents="none" accessible={false} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}>
    <Image source={require('../assets/faith/moon-moth.png')} resizeMode="contain" style={{ position: 'absolute', right: -20, top: -15, width: 210, height: 140, opacity: 0.4 }} />
    <Image source={require('../assets/faith/moon-moth.png')} resizeMode="contain" style={{ position: 'absolute', left: -40, bottom: 0, width: 280, height: 190, opacity: 0.3 }} />
  </View>;
}
