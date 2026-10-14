import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemePicker } from '@/components/ThemePicker';
import { CalendarGrid, CalendarLegend, MonthNavigation } from '@/components/CalendarGrid';
import { CycleEditor } from '@/components/CycleEditor';
import { DayEditor } from '@/components/DayEditor';
import { useCycleData } from '@/components/CycleDataProvider';
import { useToday } from '@/components/useToday';
import { createGlobalStyles, type Theme } from '@/constants/Theme';
import { useAppTheme } from '@/components/ThemeProvider';
import { cycleDay, dateKey, parseDate, type JournalEntry } from '@/utils/cycle';

type Editor = { type: 'cycle'; calendarFirst: boolean } | { type: 'day'; day: string; field?: keyof JournalEntry } | null;
export default function HomeScreen() {
  const { theme, styles: g } = useAppTheme();
  const { data, ready, error, retry } = useCycleData();
  const s = useMemo(() => createStyles(theme), [theme]);
  const today = useToday();
  const [month, setMonth] = useState(() => { const date = parseDate(today); return new Date(date.getFullYear(), date.getMonth(), 1); });
  const [selected, setSelected] = useState(today);
  const [editor, setEditor] = useState<Editor>(null);
  const selectedDate = parseDate(selected);
  const journal = data.journal[selected];
  const currentCycleDay = cycleDay(data, today);
  const openDay = (day: string, field?: keyof JournalEntry) => { setSelected(day); setEditor({ type: 'day', day, field }); };
  const changeMonth = (value: Date) => { setMonth(value); setSelected(dateKey(value)); };
  return <SafeAreaView style={g.screen} edges={['top']}>
    <ScrollView contentContainerStyle={[g.content, s.content]} showsVerticalScrollIndicator={false}>
      <View style={s.header}><Text style={s.brand}>Crimson Rhythm</Text><ThemePicker /></View>
      {!ready ? <View style={g.card}>
        <Text accessibilityLiveRegion="polite" style={g.body}>{error ?? 'Loading your calendar…'}</Text>
        {error && <Pressable accessibilityRole="button" onPress={() => { void retry(); }} style={g.button}><Text style={g.buttonText}>Try again</Text></Pressable>}
      </View> : <>
        <View style={[g.card, s.calendar]}>
          <MonthNavigation month={month} onChange={changeMonth} onTitlePress={() => setEditor({ type: 'cycle', calendarFirst: true })} />
          <Pressable accessibilityRole="button" accessibilityLabel="Edit cycle data" onPress={() => setEditor({ type: 'cycle', calendarFirst: true })} style={s.cycleContext}>
            <Text style={s.cycleTitle}>{currentCycleDay ? `Cycle day ${currentCycleDay}` : 'Your cycle calendar'} <Text style={s.cycleDetail}>· {currentCycleDay ? 'Based on your logged period' : 'Tap to add your dates'}</Text></Text>
          </Pressable>
          <CalendarGrid month={month} today={today} days={data.days} selected={selected} onSelect={day => openDay(day)} />
          <CalendarLegend />
          <Pressable accessibilityRole="button" onPress={() => setEditor({ type: 'cycle', calendarFirst: false })} style={[g.button, { marginTop: theme.spacing.md }]}><Text style={g.buttonText}>+ Update your cycle data</Text></Pressable>
        </View>
        <View style={[g.card, s.checkin]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit daily check-in" onPress={() => openDay(selected)}>
            <Text style={s.date}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            <Text style={g.body}>How are you feeling? · Tap to edit</Text>
          </Pressable>
          <View style={s.actions}>{([{ icon: '☼', label: 'Mood', field: 'mood' }, { icon: '♡', label: 'Symptoms', field: 'symptoms' }, { icon: '≡', label: 'Notes', field: 'notes' }] as const).map(({ icon, label, field }) => <Pressable key={field} accessibilityRole="button" accessibilityLabel={`Edit ${label.toLowerCase()}`} onPress={() => openDay(selected, field)} style={[s.action, !!journal?.[field] && { backgroundColor: theme.colors.roseWash }]}>
            <Text style={s.actionIcon}>{icon}</Text><Text style={s.actionText}>{label}{journal?.[field] ? ' ✓' : ''}</Text>
          </Pressable>)}</View>
          {journal?.mood && <Text style={g.body}>Mood: {journal.mood}</Text>}
          {journal?.symptoms && <Text style={g.body}>Symptoms: {journal.symptoms}</Text>}
          {journal?.notes && <Text style={[g.body, { marginBottom: theme.spacing.sm }]}>{journal.notes}</Text>}
          <Pressable accessibilityRole="button" onPress={() => { const date = parseDate(today); setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); openDay(today); }} style={g.button}><Text style={g.buttonText}>+ Log today</Text></Pressable>
        </View>
        <Text style={s.disclaimer}>Your logged dates · Saved on this device</Text>
      </>}
    </ScrollView>
    {editor?.type === 'cycle' && <CycleEditor initialDate={selected} today={today} calendarFirst={editor.calendarFirst} onClose={() => setEditor(null)} onJournal={day => openDay(day)} />}
    {editor?.type === 'day' && <DayEditor key={editor.day} day={editor.day} initialField={editor.field} onClose={() => setEditor(null)} />}
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
    calendar: { backgroundColor: c.calendarSurface, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.md },
    checkin: { marginTop: theme.spacing.sm },
    date: { ...g.heading, fontSize: 30, marginBottom: theme.spacing.xs },
    actions: { flexDirection: 'row', gap: theme.spacing.sm, marginVertical: theme.spacing.md },
    action: { ...g.outlineButton, flex: 1, paddingVertical: 12 },
    actionIcon: { color: c.rose, fontSize: 32, height: 40 },
    actionText: { color: c.text, fontSize: 13 },
    disclaimer: { color: c.mutedOnBackground, fontSize: 11, textAlign: 'center', marginTop: theme.spacing.md },
  });
};
