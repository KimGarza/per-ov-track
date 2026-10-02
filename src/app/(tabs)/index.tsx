import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  background: '#FFF9F5',
  card: '#FFFFFF',
  ink: '#3F3433',
  muted: '#9B8B87',
  blush: '#F7C9C6',
  blushDeep: '#E98F8A',
  peach: '#FBE3D3',
  lilac: '#DDD5F1',
  sage: '#D9E8D2',
  line: '#EFE5E0',
};

type ViewMode = 'Month' | 'Countdown' | 'Cycle';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const PERIOD_DAYS = new Set([1, 2, 3, 4, 5]);
const FERTILE_DAYS = new Set([14, 15, 16, 17, 18, 19]);

function MonthCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const title = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <View style={styles.calendarCard}>
      <View style={styles.monthHeader}>
        <Pressable accessibilityLabel="Previous month" hitSlop={12}>
          <Text style={styles.chevron}>‹</Text>
        </Pressable>
        <View style={styles.monthTitleWrap}>
          <Text style={styles.monthTitle}>{title}</Text>
          <Text style={styles.monthSubtitle}>cycle day 22</Text>
        </View>
        <Pressable accessibilityLabel="Next month" hitSlop={12}>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
        ))}
      </View>
      <View style={styles.daysGrid}>
        {cells.map((day, index) => {
          const period = day !== null && PERIOD_DAYS.has(day);
          const fertile = day !== null && FERTILE_DAYS.has(day);
          const isToday = day === today;
          return (
            <View key={index} style={styles.dayCell}>
              {day ? (
                <View style={[styles.dayBubble, period && styles.periodDay, fertile && styles.fertileDay, isToday && styles.todayDay]}>
                  <Text style={[styles.dayText, (period || isToday) && styles.activeDayText]}>{day}</Text>
                  {fertile && day === 17 ? <View style={styles.ovulationDot} /> : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.blush }]} /><Text style={styles.legendText}>Period</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.lilac }]} /><Text style={styles.legendText}>Fertile window</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.ink }]} /><Text style={styles.legendText}>Today</Text></View>
      </View>
    </View>
  );
}

function CountdownView() {
  return (
    <View style={styles.focusCard}>
      <View style={styles.countdownRing}>
        <Text style={styles.countdownNumber}>6</Text>
        <Text style={styles.countdownLabel}>days</Text>
      </View>
      <Text style={styles.focusTitle}>until your next period</Text>
      <Text style={styles.focusCopy}>Expected around October 7. Your cycle can naturally shift a little.</Text>
      <View style={styles.miniRow}>
        <View style={[styles.miniCard, { backgroundColor: COLORS.peach }]}><Text style={styles.miniValue}>28</Text><Text style={styles.miniLabel}>avg. cycle</Text></View>
        <View style={[styles.miniCard, { backgroundColor: '#F0ECF8' }]}><Text style={styles.miniValue}>12</Text><Text style={styles.miniLabel}>days to ovulation</Text></View>
      </View>
    </View>
  );
}

function CycleView() {
  return (
    <View style={styles.focusCard}>
      <View style={styles.phaseArt}><Text style={styles.phaseArtText}>☾</Text></View>
      <Text style={styles.eyebrow}>YOU'RE IN YOUR</Text>
      <Text style={styles.phaseTitle}>Luteal phase</Text>
      <Text style={styles.focusCopy}>A softer, slower chapter. Energy may begin to turn inward as your body prepares for a new cycle.</Text>
      <View style={styles.tipCard}><Text style={styles.tipIcon}>♡</Text><View style={styles.tipTextWrap}><Text style={styles.tipTitle}>A little care note</Text><Text style={styles.tipCopy}>Warm meals, extra rest, and gentle movement may feel especially good.</Text></View></View>
    </View>
  );
}

export default function HomeScreen() {
  const [mode, setMode] = useState<ViewMode>('Month');
  const { width } = useWindowDimensions();
  const greeting = useMemo(() => (new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { maxWidth: Math.min(width, 720) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.greeting}>{greeting}, lovely</Text><Text style={styles.heading}>Here’s your rhythm.</Text></View>
          <Pressable accessibilityLabel="Open profile" style={styles.avatar}><Text style={styles.avatarText}>M</Text></Pressable>
        </View>

        <View style={styles.segmented}>
          {(['Month', 'Countdown', 'Cycle'] as ViewMode[]).map((item) => (
            <Pressable key={item} onPress={() => setMode(item)} style={[styles.segment, mode === item && styles.segmentActive]}>
              <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'Month' ? <MonthCalendar /> : mode === 'Countdown' ? <CountdownView /> : <CycleView />}

        <View style={styles.checkInHeader}><Text style={styles.sectionTitle}>Today’s check-in</Text><Text style={styles.sectionAction}>Edit</Text></View>
        <View style={styles.checkInCard}>
          <View style={styles.checkInIcon}><Text style={styles.checkInIconText}>✿</Text></View>
          <View style={styles.checkInText}><Text style={styles.checkInTitle}>How are you feeling?</Text><Text style={styles.checkInCopy}>Log your mood, flow, and symptoms</Text></View>
          <Text style={styles.chevronSmall}>›</Text>
        </View>
        <Text style={styles.disclaimer}>Predictions are estimates, not medical advice.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { color: COLORS.muted, fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  heading: { color: COLORS.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.8, marginTop: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.peach, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.card },
  avatarText: { color: '#A66D5C', fontWeight: '700', fontSize: 16 },
  segmented: { backgroundColor: '#F3EAE5', borderRadius: 16, padding: 4, flexDirection: 'row', marginBottom: 16 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  segmentActive: { backgroundColor: COLORS.card, shadowColor: '#7D5F55', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  segmentText: { color: COLORS.muted, fontWeight: '600', fontSize: 13 },
  segmentTextActive: { color: COLORS.ink },
  calendarCard: { backgroundColor: COLORS.card, borderRadius: 26, paddingHorizontal: 16, paddingVertical: 18, shadowColor: '#8B6E64', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: 18 },
  monthTitleWrap: { alignItems: 'center' },
  monthTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '700' },
  monthSubtitle: { color: COLORS.blushDeep, fontSize: 11, marginTop: 3, fontWeight: '600' },
  chevron: { color: COLORS.muted, fontSize: 32, fontWeight: '300', lineHeight: 32 },
  weekRow: { flexDirection: 'row', marginBottom: 7 },
  weekday: { width: '14.285%', textAlign: 'center', color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.285%', height: 43, alignItems: 'center', justifyContent: 'center' },
  dayBubble: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  periodDay: { backgroundColor: COLORS.blush },
  fertileDay: { backgroundColor: '#EEEAF8' },
  todayDay: { backgroundColor: COLORS.ink, borderWidth: 3, borderColor: COLORS.peach },
  dayText: { color: '#655957', fontSize: 13, fontWeight: '500' },
  activeDayText: { color: COLORS.card, fontWeight: '700' },
  ovulationDot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: '#9D8AC5' },
  legend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 14, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 15, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: COLORS.muted, fontWeight: '500' },
  focusCard: { minHeight: 410, backgroundColor: COLORS.card, borderRadius: 26, padding: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#8B6E64', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  countdownRing: { width: 138, height: 138, borderRadius: 69, backgroundColor: '#FFF5EF', borderWidth: 10, borderColor: COLORS.blush, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  countdownNumber: { color: COLORS.ink, fontSize: 48, fontWeight: '700', lineHeight: 52 },
  countdownLabel: { color: COLORS.muted, fontSize: 13 },
  focusTitle: { color: COLORS.ink, fontSize: 21, fontWeight: '700', marginBottom: 9 },
  focusCopy: { color: COLORS.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 310 },
  miniRow: { flexDirection: 'row', gap: 10, marginTop: 24, width: '100%' },
  miniCard: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  miniValue: { color: COLORS.ink, fontSize: 21, fontWeight: '700' },
  miniLabel: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  phaseArt: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#EEEAF8', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  phaseArtText: { fontSize: 45, color: '#8E7EB3' },
  eyebrow: { color: '#9D8AC5', fontWeight: '700', fontSize: 10, letterSpacing: 1.5 },
  phaseTitle: { color: COLORS.ink, fontSize: 28, fontWeight: '700', marginTop: 5, marginBottom: 10 },
  tipCard: { flexDirection: 'row', backgroundColor: '#F5F2FA', borderRadius: 17, padding: 14, marginTop: 22, width: '100%', alignItems: 'center' },
  tipIcon: { fontSize: 24, color: '#9D8AC5', marginRight: 12 },
  tipTextWrap: { flex: 1 },
  tipTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '700', marginBottom: 3 },
  tipCopy: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  checkInHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 11, paddingHorizontal: 3 },
  sectionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '700' },
  sectionAction: { color: COLORS.blushDeep, fontSize: 12, fontWeight: '700' },
  checkInCard: { backgroundColor: COLORS.card, padding: 15, borderRadius: 19, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F4EBE6' },
  checkInIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.sage, alignItems: 'center', justifyContent: 'center' },
  checkInIconText: { color: '#6F8A65', fontSize: 20 },
  checkInText: { flex: 1, marginLeft: 12 },
  checkInTitle: { color: COLORS.ink, fontWeight: '700', fontSize: 13 },
  checkInCopy: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  chevronSmall: { color: COLORS.muted, fontSize: 25 },
  disclaimer: { color: '#B1A4A0', fontSize: 10, textAlign: 'center', marginTop: 18 },
});
