import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botanical } from '@/components/Botanical';
import { createGlobalStyles, type Theme } from '@/constants/Theme';
import { useAppTheme } from '@/components/ThemeProvider';
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HomeScreen() {
  const { theme, name, setName, styles: g } = useAppTheme();
  const c = theme.colors;
  const s = createStyles(theme);
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.getDate());
  const [entry, setEntry] = useState<string | null>(null);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const count = Math.ceil((month.getDay() + days) / 7) * 7;
  const changeMonth = (step: number) => { setMonth(new Date(month.getFullYear(), month.getMonth() + step, 1)); setSelected(1); };
  const selectedDate = new Date(month.getFullYear(), month.getMonth(), selected);
  return <SafeAreaView style={g.screen} edges={['top']}>
    <ScrollView contentContainerStyle={g.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View style={s.leftFlowers}><Botanical /></View><View style={s.rightFlowers}><Botanical flipped /></View>
        <View style={s.themePicker}>{(['petal', 'burgundy'] as const).map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: name === option }} onPress={() => setName(option)} style={[s.themeOption, name === option && { borderColor: name === 'burgundy' ? '#EBC677' : c.rose }]}><Text style={{ color: name === 'burgundy' ? c.white : c.muted, fontSize: 11 }}>{option === 'petal' ? 'Soft Petal' : 'Burgundy Bloom'}</Text></Pressable>)}</View>
        <Text style={[s.brand, name === 'burgundy' && { color: c.white }]}><Text style={{ color: c.rose }}>✿ </Text>petal</Text>
        <Text style={[s.title, name === 'burgundy' && { color: c.white }]}>Your cycle</Text><Text style={[g.body, name === 'burgundy' && { color: '#EBC677' }]}>A little care, every day</Text>
      </View>
      <View style={[g.card, s.summary]}>
        <View style={{ flex: 1 }}><Text style={s.summaryTitle}>Cycle day 12</Text><Text style={g.body}>Period expected in 16 days</Text><Text style={s.caption}>Sample cycle · estimates only</Text></View>
        <View style={s.summaryFlower}><Botanical small /></View>
      </View>
      <View style={[g.card, s.calendar]}>
        <View style={s.monthRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={s.arrow}><Text style={s.arrowText}>‹</Text></Pressable>
          <Text style={s.month}>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={s.arrow}><Text style={s.arrowText}>›</Text></Pressable>
        </View>
        <View style={s.grid}>{weekdays.map(day => <Text key={day} style={s.weekday}>{day}</Text>)}</View>
        <View style={s.grid}>{Array.from({ length: count }, (_, i) => {
          const day = i - month.getDay() + 1;
          if (day < 1 || day > days) return <View key={i} style={s.cell} />;
          const period = day <= 5, fertile = day >= 12 && day <= 17;
          return <View key={i} style={s.cell}><Pressable accessibilityRole="button" accessibilityLabel={new Date(month.getFullYear(), month.getMonth(), day).toDateString()} accessibilityState={{ selected: selected === day }} onPress={() => { setSelected(day); setEntry(null); }} style={[s.day, period && { backgroundColor: c.roseSoft }, fertile && { backgroundColor: c.sage }, selected === day && s.selected]}><Text style={[s.dayText, name === 'burgundy' && (period || fertile) && { color: c.white }]}>{day}</Text></Pressable></View>;
        })}</View>
        <View style={s.legend}><View style={s.legendItem}><View style={[s.dot, { backgroundColor: c.roseSoft }]} /><Text style={s.legendText}>Period</Text></View><View style={s.legendItem}><View style={[s.dot, { backgroundColor: c.sage }]} /><Text style={s.legendText}>Fertile estimate</Text></View></View>
      </View>
      <View style={[g.card, s.checkin]}>
        <Text style={s.date}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        <Text style={g.body}>How are you feeling?</Text>
        <View style={s.actions}>{[['☼', 'Mood'], ['♡', 'Symptoms'], ['≡', 'Notes']].map(([icon, label]) => <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected: entry === label }} onPress={() => setEntry(label)} style={[s.action, entry === label && { backgroundColor: c.roseWash, borderColor: c.rose }]}><Text style={s.actionIcon}>{icon}</Text><Text style={s.actionText}>{label}</Text></Pressable>)}</View>
        {entry && <Text accessibilityLiveRegion="polite" style={s.feedback}>{entry} selected. Journal logging is coming soon.</Text>}
        <Pressable accessibilityRole="button" onPress={() => setEntry('Daily check-in')} style={g.button}><Text style={g.buttonText}>＋ Log today</Text></Pressable>
      </View>
      <Text style={s.disclaimer}>Sample data. Predictions are estimates, not medical advice.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const createStyles = (theme: Theme) => {
const c = theme.colors;
const g = createGlobalStyles(theme);
return StyleSheet.create({
  themePicker: { flexDirection: 'row', gap: 8, marginBottom: 12, zIndex: 1 }, themeOption: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20 },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 26, overflow: 'hidden' },
  leftFlowers: { position: 'absolute', left: -22, top: 8, transform: [{ rotate: '-15deg' }] }, rightFlowers: { position: 'absolute', right: -28, top: 22, transform: [{ rotate: '15deg' }] },
  brand: { fontFamily: theme.fonts.heading, fontSize: 34, color: c.text, marginBottom: 14 }, title: { fontFamily: theme.fonts.heading, fontSize: 58, color: c.text, lineHeight: 66 },
  summary: { backgroundColor: c.roseWash, flexDirection: 'row', alignItems: 'center', paddingVertical: 24, overflow: 'hidden', marginBottom: 16 }, summaryTitle: { ...g.heading, fontSize: 34, marginBottom: 4 }, summaryFlower: { width: 48, height: 90, marginRight: -8 }, caption: { color: c.muted, fontSize: 11, marginTop: 8 },
  calendar: { paddingHorizontal: 14, paddingVertical: 16 }, monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }, month: { ...g.heading, fontSize: 30 }, arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: c.text, fontSize: 38, lineHeight: 42 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { width: '14.2857%', textAlign: 'center', color: c.muted, fontSize: 12, paddingBottom: 12 }, cell: { width: '14.2857%', height: 49, alignItems: 'center', justifyContent: 'center' }, day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, dayText: { color: c.text, fontSize: 17 }, selected: { borderWidth: 1.5, borderColor: c.text },
  legend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 18, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16, marginTop: 16 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 }, dot: { width: 13, height: 13, borderRadius: 7 }, legendText: { color: c.muted, fontSize: 12 },
  checkin: { marginTop: 16 }, date: { ...g.heading, fontSize: 30, marginBottom: 4 }, actions: { flexDirection: 'row', gap: 8, marginVertical: 18 }, action: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingVertical: 12, alignItems: 'center' }, actionIcon: { color: c.rose, fontSize: 32, height: 40 }, actionText: { color: c.text, fontSize: 13 }, feedback: { ...g.body, fontSize: 12, marginBottom: 12 }, disclaimer: { color: c.muted, fontSize: 11, textAlign: 'center', marginTop: 18 },
});
};
