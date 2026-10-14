import { StyleSheet, View } from 'react-native';
import { type Theme } from '@/constants/Theme';
import { useAppTheme } from './ThemeProvider';

// Lightweight decorative stems and petals, rendered on every platform.
export function Botanical({ small = false, flipped = false }: { small?: boolean; flipped?: boolean }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return <View pointerEvents="none" accessible={false} style={[styles.plant, small && { transform: [{ scale: 0.65 }] }, flipped && { transform: [{ scaleX: -1 }] }]}>
    <View style={styles.stem} />
    {[0, 1, 2, 3].map(i => <View key={i} style={[styles.branch, { top: 24 + i * 30, left: i % 2 ? 35 : 7, transform: [{ rotate: i % 2 ? '-35deg' : '35deg' }] }]}>
      <View style={styles.leaf} />
      <View style={styles.flower}>{[0, 1, 2, 3, 4].map(p => <View key={p} style={[styles.petal, { transform: [{ rotate: `${p * 72}deg` }, { translateY: -6 }] }]} />)}<View style={styles.center} /></View>
    </View>)}
  </View>;
}
const createStyles = (theme: Theme) => StyleSheet.create({
  plant: { width: 90, height: 160, opacity: 0.7 },
  stem: { position: 'absolute', left: 43, top: 10, width: 2, height: 148, backgroundColor: theme.colors.olive, transform: [{ rotate: '18deg' }] },
  branch: { position: 'absolute', width: 40, height: 2, backgroundColor: theme.colors.olive },
  leaf: { position: 'absolute', width: 27, height: 12, borderTopLeftRadius: 24, borderBottomRightRadius: 24, backgroundColor: theme.colors.olive, top: 6, left: 8 },
  flower: { position: 'absolute', left: -6, top: -10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  petal: { position: 'absolute', width: 9, height: 14, borderRadius: 8, backgroundColor: theme.colors.roseSoft, borderWidth: 0.5, borderColor: theme.colors.botanicalBorder },
  center: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.botanicalCenter },
});
