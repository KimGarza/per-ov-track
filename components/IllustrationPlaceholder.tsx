import { View } from 'react-native';
import { useAppTheme } from './ThemeProvider';

// Palette-aware illustration stand-in. Replace this component with a supplied asset later.
export function IllustrationPlaceholder({ faint = false }: { faint?: boolean }) {
  const { theme } = useAppTheme();
  const c = theme.colors;
  return <View pointerEvents="none" accessible={false} style={{ height: 160, overflow: 'hidden', borderRadius: theme.radius.card, backgroundColor: c.roseWash, opacity: faint ? 0.24 : 1 }}>
    <View style={{ position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: c.roseSoft, right: '20%', top: 22 }} />
    <View style={{ position: 'absolute', width: '110%', height: 130, borderRadius: 100, backgroundColor: c.sage, right: '-25%', top: 95, transform: [{ rotate: '-12deg' }] }} />
    <View style={{ position: 'absolute', width: '105%', height: 110, borderRadius: 100, backgroundColor: c.botanicalBorder, left: '-25%', top: 114, transform: [{ rotate: '10deg' }] }} />
    <View style={{ position: 'absolute', left: '40%', top: 48, width: 4, height: 70, borderRadius: 2, backgroundColor: c.olive }} />
    <View style={{ position: 'absolute', left: '40%', marginLeft: -14, top: 65, width: 32, height: 4, borderRadius: 2, backgroundColor: c.olive }} />
    <View style={{ position: 'absolute', left: 24, top: 28, width: 44, height: 12, borderRadius: theme.radius.pill, backgroundColor: c.surface, opacity: 0.8 }} />
    <View style={{ position: 'absolute', left: 49, top: 20, width: 36, height: 20, borderRadius: theme.radius.pill, backgroundColor: c.surface, opacity: 0.8 }} />
  </View>;
}
