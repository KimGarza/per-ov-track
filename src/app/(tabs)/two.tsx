import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createGlobalStyles, type Theme } from '@/constants/Theme';
import { useAppTheme } from '@/components/ThemeProvider';


export default function InsightsScreen() {
  const { theme, styles: g } = useAppTheme();
  const C = palette(theme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <SafeAreaView style={g.screen} edges={['top']}>
      <ScrollView contentContainerStyle={g.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>YOUR BODY, AT A GLANCE</Text>
        <Text style={styles.title}>Cycle insights</Text>
        <Text style={styles.subtitle}>Gentle patterns from your recent cycles.</Text>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>AVERAGE CYCLE</Text>
          <View style={styles.heroRow}><Text style={styles.heroNumber}>28</Text><Text style={styles.heroUnit}>days</Text></View>
          <View style={styles.track}><View style={styles.trackFill} /></View>
          <View style={styles.trackLabels}><Text style={styles.small}>24 days</Text><Text style={styles.small}>32 days</Text></View>
        </View>

        <View style={styles.row}>
          <View style={[styles.stat, { backgroundColor: theme.colors.roseWash }]}><Text style={styles.statIcon}>○</Text><Text style={styles.statValue}>5 days</Text><Text style={styles.statLabel}>average period</Text></View>
          <View style={[styles.stat, { backgroundColor: theme.colors.sage }]}><Text style={[styles.statIcon, { color: theme.colors.onFertile }]}>✦</Text><Text style={[styles.statValue, { color: theme.colors.onFertile }]}>Day 14</Text><Text style={[styles.statLabel, { color: theme.colors.mutedOnFertile }]}>likely ovulation</Text></View>
        </View>

        <Text style={styles.section}>Recent cycles</Text>
        {[['September', '28 days', C.blush], ['August', '29 days', C.lilac], ['July', '27 days', C.sage]].map(([month, length, color]) => (
          <View key={month} style={styles.cycleRow}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={styles.cycleMonth}>{month}</Text><Text style={styles.cycleLength}>{length}</Text></View>
        ))}
        <View style={styles.note}><Text style={styles.noteTitle}>A cozy reminder</Text><Text style={styles.noteText}>Bodies aren’t clocks. A few days of variation is common, and predictions get more helpful as you log.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const palette = (theme: Theme) => ({ bg: theme.colors.background, card: theme.colors.surface, ink: theme.colors.text, muted: theme.colors.muted, blush: theme.colors.roseSoft, lilac: theme.colors.sage, sage: theme.colors.sage });
const createStyles = (theme: Theme) => {
const C = palette(theme);
const g = createGlobalStyles(theme);
return StyleSheet.create({
  kicker: { color: theme.colors.accentOnBackground, fontSize: 10, letterSpacing: 1.6, fontWeight: '700' }, title: { color: theme.colors.onBackground, fontSize: 40, fontFamily: theme.fonts.heading, letterSpacing: -1, marginTop: 5 }, subtitle: { color: theme.colors.mutedOnBackground, fontSize: 13, marginTop: 7, marginBottom: 24 },
  hero: { ...g.card }, heroLabel: { color: C.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: '700' }, heroRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 15 }, heroNumber: { color: C.ink, fontSize: 56, fontFamily: theme.fonts.heading }, heroUnit: { color: C.muted, fontSize: 14, marginLeft: 6 }, track: { height: 9, backgroundColor: theme.colors.roseWash, borderRadius: 5 }, trackFill: { height: 9, width: '55%', marginLeft: '24%', backgroundColor: C.blush, borderRadius: 5 }, trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }, small: { color: C.muted, fontSize: 10 },
  row: { flexDirection: 'row', gap: 12, marginTop: 13 }, stat: { flex: 1, borderRadius: theme.radius.sm, padding: 17 }, statIcon: { color: theme.colors.olive, fontSize: 21, marginBottom: 14 }, statValue: { color: C.ink, fontSize: 17, fontWeight: '700' }, statLabel: { color: C.muted, fontSize: 10, marginTop: 4 },
  section: { color: theme.colors.onBackground, fontSize: 17, fontWeight: '700', marginTop: 28, marginBottom: 10 }, cycleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.colors.backgroundBorder }, dot: { width: 11, height: 11, borderRadius: 6, marginRight: 12 }, cycleMonth: { flex: 1, color: theme.colors.onBackground, fontSize: 13, fontWeight: '600' }, cycleLength: { color: theme.colors.mutedOnBackground, fontSize: 12 },
  note: { backgroundColor: theme.colors.sage, borderRadius: theme.radius.sm, padding: 18, marginTop: 24 }, noteTitle: { color: theme.colors.onFertile, fontSize: 13, fontWeight: '700', marginBottom: 6 }, noteText: { color: theme.colors.mutedOnFertile, fontSize: 12, lineHeight: 18 },
});

};
