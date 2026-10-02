import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = { bg: '#FFF9F5', card: '#FFFFFF', ink: '#3F3433', muted: '#9B8B87', blush: '#F7C9C6', lilac: '#DDD5F1', sage: '#D9E8D2' };

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <View style={[styles.stat, { backgroundColor: '#FDF0E9' }]}><Text style={styles.statIcon}>○</Text><Text style={styles.statValue}>5 days</Text><Text style={styles.statLabel}>average period</Text></View>
          <View style={[styles.stat, { backgroundColor: '#F1EEF8' }]}><Text style={styles.statIcon}>✦</Text><Text style={styles.statValue}>Day 14</Text><Text style={styles.statLabel}>likely ovulation</Text></View>
        </View>

        <Text style={styles.section}>Recent cycles</Text>
        {[['September', '28 days', C.blush], ['August', '29 days', C.lilac], ['July', '27 days', C.sage]].map(([month, length, color]) => (
          <View key={month} style={styles.cycleRow}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={styles.cycleMonth}>{month}</Text><Text style={styles.cycleLength}>{length}</Text></View>
        ))}
        <View style={styles.note}><Text style={styles.noteTitle}>A cozy reminder</Text><Text style={styles.noteText}>Bodies aren't clocks. A few days of variation is common, and predictions get more helpful as you log.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, content: { padding: 22, paddingTop: 26, paddingBottom: 40, width: '100%', maxWidth: 720, alignSelf: 'center' },
  kicker: { color: '#C8827E', fontSize: 10, letterSpacing: 1.6, fontWeight: '700' }, title: { color: C.ink, fontSize: 30, fontWeight: '700', letterSpacing: -1, marginTop: 5 }, subtitle: { color: C.muted, fontSize: 13, marginTop: 7, marginBottom: 24 },
  hero: { backgroundColor: C.card, borderRadius: 26, padding: 23, shadowColor: '#8B6E64', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 }, heroLabel: { color: C.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: '700' }, heroRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 15 }, heroNumber: { color: C.ink, fontSize: 50, fontWeight: '700' }, heroUnit: { color: C.muted, fontSize: 14, marginLeft: 6 }, track: { height: 9, backgroundColor: '#F4ECE8', borderRadius: 5 }, trackFill: { height: 9, width: '55%', marginLeft: '24%', backgroundColor: C.blush, borderRadius: 5 }, trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }, small: { color: C.muted, fontSize: 10 },
  row: { flexDirection: 'row', gap: 12, marginTop: 13 }, stat: { flex: 1, borderRadius: 20, padding: 17 }, statIcon: { color: '#9D8AC5', fontSize: 21, marginBottom: 14 }, statValue: { color: C.ink, fontSize: 17, fontWeight: '700' }, statLabel: { color: C.muted, fontSize: 10, marginTop: 4 },
  section: { color: C.ink, fontSize: 17, fontWeight: '700', marginTop: 28, marginBottom: 10 }, cycleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE5E0' }, dot: { width: 11, height: 11, borderRadius: 6, marginRight: 12 }, cycleMonth: { flex: 1, color: C.ink, fontSize: 13, fontWeight: '600' }, cycleLength: { color: C.muted, fontSize: 12 },
  note: { backgroundColor: '#F1EEF8', borderRadius: 19, padding: 18, marginTop: 24 }, noteTitle: { color: C.ink, fontSize: 13, fontWeight: '700', marginBottom: 6 }, noteText: { color: C.muted, fontSize: 12, lineHeight: 18 },
});
