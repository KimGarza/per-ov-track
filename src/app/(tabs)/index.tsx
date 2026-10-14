import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FaithBackdrop } from '@/components/FaithBackdrop';
import { DailyVerseReference, VerseIconButton, VersePopup } from '@/components/DailyVerse';
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
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState({ width: window.width, height: window.height - insets.top - insets.bottom - theme.layout.tabBarHeight });
  const compact = viewport.height < 560;
  const s = useMemo(() => createStyles(theme, viewport.width, compact), [theme, viewport.width, compact]);
  const today = useToday();
  const [month, setMonth] = useState(() => { const date = parseDate(today); return new Date(date.getFullYear(), date.getMonth(), 1); });
  const [selected, setSelected] = useState(today);
  const [verseOpen, setVerseOpen] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const rows = Math.ceil((month.getDay() + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7);
  const reserveCheckin = viewport.height >= 560 ? theme.calendar.checkinHeight : viewport.height >= 480 ? 72 : 0;
  const calendarHeight = Math.min(viewport.height * 0.7, viewport.height - theme.calendar.headerHeight - reserveCheckin - theme.spacing.md);
  const rowHeight = Math.max(theme.calendar.minRowHeight, Math.min(theme.calendar.maxRowHeight,
    Math.floor((calendarHeight - theme.calendar.chromeHeight) / rows)));
  const selectedDate = parseDate(selected);
  const journal = data.journal[selected];
  const currentCycleDay = cycleDay(data, today);
  const openDay = (day: string, field?: keyof JournalEntry) => { setSelected(day); setEditor({ type: 'day', day, field }); };
  const changeMonth = (value: Date) => { setMonth(value); setSelected(dateKey(value)); };
  return <SafeAreaView style={g.screen} edges={['top']}>
    <FaithBackdrop />
    <View style={{ flex: 1 }} onLayout={({ nativeEvent: { layout } }) => setViewport(previous => previous.width === layout.width && previous.height === layout.height ? previous : { width: layout.width, height: layout.height })}>
    <ScrollView contentContainerStyle={[g.content, s.content]} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={s.brand}>Crimson Rhythm</Text><DailyVerseReference day={today} onRead={() => setVerseOpen(true)} /></View>
        <ThemePicker /><VerseIconButton onPress={() => setVerseOpen(true)} />
      </View>
      {!ready ? <View style={g.card}>
        <Text accessibilityLiveRegion="polite" style={g.body}>{error ?? 'Loading your calendar…'}</Text>
        {error && <Pressable accessibilityRole="button" onPress={() => { void retry(); }} style={g.button}><Text style={g.buttonText}>Try again</Text></Pressable>}
      </View> : <>
        <View style={[g.card, s.calendar]}>
          <MonthNavigation compact month={month} onChange={changeMonth} onTitlePress={() => setEditor({ type: 'cycle', calendarFirst: true })} />
          <View style={s.cycleContext}>
            <Text numberOfLines={1} style={s.cycleTitle}>{currentCycleDay ? `Cycle day ${currentCycleDay}` : 'Your cycle'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="+ Update your cycle data" onPress={() => setEditor({ type: 'cycle', calendarFirst: false })} style={[g.outlineButton, s.update]}><Text style={s.updateText}>Update cycle data</Text></Pressable>
          </View>
          <CalendarGrid month={month} today={today} days={data.days} selected={selected} rowHeight={rowHeight} onSelect={day => openDay(day)} />
          <CalendarLegend compact />
        </View>
        <View style={[g.card, s.checkin]}>
          <View style={s.checkinHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit daily check-in" onPress={() => openDay(selected)} style={{ flex: 1 }}>
              <Text numberOfLines={1} style={s.date}>{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              <Text numberOfLines={1} style={s.checkinPrompt}>How are you feeling?</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="+ Log today" onPress={() => { const date = parseDate(today); setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); openDay(today); }} style={[g.outlineButton, s.logToday]}><Text style={s.updateText}>+ Log today</Text></Pressable>
          </View>
          {!compact && <View style={s.actions}>{([{ icon: '☼', label: 'Mood', field: 'mood' }, { icon: '♡', label: 'Symptoms', field: 'symptoms' }, { icon: '≡', label: 'Notes', field: 'notes' }] as const).map(({ icon, label, field }) => <Pressable key={field} accessibilityRole="button" accessibilityLabel={`Edit ${label.toLowerCase()}`} onPress={() => openDay(selected, field)} style={[s.action, !!journal?.[field] && { backgroundColor: theme.colors.roseWash }]}>
            <Text style={s.actionText}>{icon} {label}{journal?.[field] ? ' ✓' : ''}</Text>
          </Pressable>)}</View>}
          {!compact && journal && <Text numberOfLines={1} style={s.savedPreview}>{[journal.mood && `Mood: ${journal.mood}`, journal.symptoms, journal.notes].filter(Boolean).join(' · ')}</Text>}
        </View>

      </>}
    </ScrollView>
    </View>
    {verseOpen && <VersePopup day={today} onClose={() => setVerseOpen(false)} />}
    {editor?.type === 'cycle' && <CycleEditor initialDate={selected} today={today} calendarFirst={editor.calendarFirst} onClose={() => setEditor(null)} onJournal={day => openDay(day)} />}
    {editor?.type === 'day' && <DayEditor key={editor.day} day={editor.day} initialField={editor.field} onClose={() => setEditor(null)} />}
  </SafeAreaView>;
}
const createStyles = (theme: Theme, width: number, compact: boolean) => {
  const c = theme.colors;
  const g = createGlobalStyles(theme);
  return StyleSheet.create({
    content: { paddingHorizontal: theme.spacing.sm, paddingTop: theme.spacing.xs },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm, paddingBottom: theme.spacing.xs },
    brand: { fontFamily: theme.fonts.heading, fontSize: width < 360 ? 18 : width < 400 ? 22 : 26, color: c.onBackground, minWidth: 0 },
    cycleContext: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm, marginBottom: theme.spacing.xs },
    cycleTitle: { flex: 1, minWidth: 0, fontFamily: theme.fonts.body, color: c.text, fontSize: 13, fontWeight: '600' },
    update: { backgroundColor: c.roseWash, paddingHorizontal: theme.spacing.sm },
    updateText: { fontFamily: theme.fonts.body, color: c.text, fontSize: 13 },
    calendar: { backgroundColor: c.calendarSurface, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs },
    checkin: { marginTop: theme.spacing.sm, padding: theme.spacing.sm },
    checkinHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, minHeight: theme.layout.touchTarget },
    date: { ...g.heading, fontSize: compact ? 19 : 22 },
    checkinPrompt: { fontFamily: theme.fonts.body, fontSize: compact ? 13 : 14, color: c.muted },
    logToday: { paddingHorizontal: theme.spacing.sm },
    actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
    action: { ...g.outlineButton, flex: 1, paddingHorizontal: theme.spacing.xs },
    actionText: { color: c.text, fontSize: 13 },
    savedPreview: { ...g.body, fontSize: 12, marginTop: theme.spacing.xs },
  });
};
