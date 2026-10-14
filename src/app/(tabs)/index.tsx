import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemePicker } from '@/components/ThemePicker';
import { createGlobalStyles, type Theme } from '@/constants/Theme';
import { useAppTheme } from '@/components/ThemeProvider';
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HomeScreen() {
  const { theme, styles: g } = useAppTheme();
  const c = theme.colors;
  const s = useMemo(() => createStyles(theme), [theme]);
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.getDate());
  const [entry, setEntry] = useState<string | null>(null);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const count = Math.ceil((month.getDay() + days) / 7) * 7;
  const changeMonth = (step: number) => { setMonth(new Date(month.getFullYear(), month.getMonth() + step, 1)); setSelected(1); };
  const selectedDate = new Date(month.getFullYear(), month.getMonth(), selected);
  return <SafeAreaView style={g.screen} edges={['top']}>
    <ScrollView contentContainerStyle={[g.content, s.content]} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.brand}>Crimson Rhythm</Text>
        <ThemePicker />
      </View>
      <View style={[g.card, s.calendar]}>
        <View style={s.monthRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={s.arrow}><Text style={s.arrowText}>‹</Text></Pressable>
          <Text style={s.month}>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={s.arrow}><Text style={s.arrowText}>›</Text></Pressable>
        </View>
        <View style={s.cycleContext}>
          <Text style={s.cycleTitle}>Cycle day 12 <Text style={s.cycleDetail}>· Period in 16 days</Text></Text>
        </View>
        <View style={s.grid}>{weekdays.map(day => <Text key={day} style={s.weekday}>{day}</Text>)}</View>
        <View style={s.grid}>{Array.from({ length: count }, (_, i) => {
          const day = i - month.getDay() + 1;
          if (day < 1 || day > days) return <View key={i} style={s.cell} />;
          const period = day <= 5, fertile = day >= 12 && day <= 17;
          return <View key={i} style={s.cell}><Pressable accessibilityRole="button" accessibilityLabel={new Date(month.getFullYear(), month.getMonth(), day).toDateString()} accessibilityState={{ selected: selected === day }} onPress={() => { setSelected(day); setEntry(null); }} style={[s.day, period && { backgroundColor: c.calendarPeriod }, fertile && { backgroundColor: c.calendarFertile }, selected === day && s.selected]}><Text style={s.dayText}>{day}</Text></Pressable></View>;
        })}</View>
        <View style={s.legend}><View style={s.legendItem}><View style={[s.dot, { backgroundColor: c.calendarPeriod }]} /><Text style={s.legendText}>Period</Text></View><View style={s.legendItem}><View style={[s.dot, { backgroundColor: c.calendarFertile }]} /><Text style={s.legendText}>Fertile estimate</Text></View></View>
      </View>
      <View style={[g.card, s.checkin]}>
        <Text style={s.date}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        <Text style={g.body}>How are you feeling?</Text>
        <View style={s.actions}>{[['☼', 'Mood'], ['♡', 'Symptoms'], ['≡', 'Notes']].map(([icon, label]) => <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected: entry === label }} onPress={() => setEntry(label)} style={[s.action, entry === label && { backgroundColor: c.roseWash, borderColor: c.rose }]}><Text style={s.actionIcon}>{icon}</Text><Text style={s.actionText}>{label}</Text></Pressable>)}</View>
        {entry && <Text accessibilityLiveRegion="polite" style={s.feedback}>{entry} selected. Journal logging is coming soon.</Text>}
        <Pressable accessibilityRole="button" onPress={() => setEntry('Daily check-in')} style={g.button}><Text style={g.buttonText}>＋ Log today</Text></Pressable>
      </View>
      <Text style={s.disclaimer}>Sample cycle data · Predictions are estimates, not medical advice.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const createStyles = (theme: Theme) => {
const c = theme.colors;
const g = createGlobalStyles(theme);
return StyleSheet.create({
  content: { paddingHorizontal: theme.spacing.sm, paddingTop: theme.spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm, paddingBottom: theme.spacing.sm },
  brand: { flex: 1, fontFamily: theme.fonts.heading, fontSize: 32, color: c.onBackground },
  cycleContext: { alignItems: 'center', paddingHorizontal: theme.spacing.sm, paddingBottom: theme.spacing.md },
  cycleTitle: { fontFamily: theme.fonts.body, color: c.text, fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  cycleDetail: { color: c.muted, fontWeight: '400' },
  calendar: { backgroundColor: c.calendarSurface, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.md }, monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xs }, month: { ...g.heading, fontSize: 34, flex: 1, textAlign: 'center' }, arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: c.text, fontSize: 38, lineHeight: 42 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { width: '14.2857%', textAlign: 'center', color: c.muted, fontSize: 12, paddingBottom: 12 }, cell: { width: '14.2857%', height: 60, alignItems: 'center', justifyContent: 'center' }, day: { width: '90%', maxWidth: 56, aspectRatio: 1, borderRadius: theme.radius.calendarDay, alignItems: 'center', justifyContent: 'center' }, dayText: { color: c.calendarText, fontSize: 21, fontFamily: theme.fonts.body }, selected: { borderWidth: 1.5, borderColor: c.calendarText },
  legend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 18, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16, marginTop: 16 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 }, dot: { width: 13, height: 13, borderRadius: theme.radius.xs }, legendText: { color: c.muted, fontSize: 12 },
  checkin: { marginTop: theme.spacing.sm }, date: { ...g.heading, fontSize: 30, marginBottom: 4 }, actions: { flexDirection: 'row', gap: 8, marginVertical: 18 }, action: { ...g.outlineButton, flex: 1, paddingVertical: 12, alignItems: 'center' }, actionIcon: { color: c.rose, fontSize: 32, height: 40 }, actionText: { color: c.text, fontSize: 13 }, feedback: { ...g.body, fontSize: 12, marginBottom: 12 }, disclaimer: { color: c.mutedOnBackground, fontSize: 11, textAlign: 'center', marginTop: 18 },
});
};
