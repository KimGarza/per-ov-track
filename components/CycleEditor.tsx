import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { parseDate, rangeDates, selectRange, type CycleKind, type DateRange } from '@/utils/cycle';
import { CalendarGrid, CalendarLegend, MonthNavigation } from './CalendarGrid';
import { useAppTheme } from './ThemeProvider';
import { useCycleData } from './CycleDataProvider';
import { EditSheet } from './EditSheet';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function CycleEditor({ initialDate, today, calendarFirst = false, onClose, onJournal }: {
  initialDate: string; today: string; calendarFirst?: boolean; onClose: () => void; onJournal: (day: string) => void;
}) {
  const { theme, styles: g } = useAppTheme();
  const { data, ready, saveRange } = useCycleData();
  const initial = parseDate(initialDate);
  const [screen, setScreen] = useState<'choice' | 'calendar'>(calendarFirst ? 'calendar' : 'choice');
  const [month, setMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [kind, setKind] = useState<CycleKind | null>('menstrual');
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [jump, setJump] = useState(false);
  const [year, setYear] = useState(String(initial.getFullYear()));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const changeMonth = (value: Date) => { setMonth(value); setYear(String(value.getFullYear())); };
  const chooseKind = (value: CycleKind | null) => { setKind(value); setRange({ start: null, end: null }); setMessage(null); setError(null); };
  const select = (day: string) => { setRange(previous => selectRange(previous, day)); setError(null); setMessage(null); };
  const save = async () => {
    if (!range.start || busy) return;
    setError(null);
    setBusy(true);
    try {
      const end = range.end ?? range.start;
      const dates = rangeDates(range.start, end);
      await saveRange(kind, range.start, end);
      setMessage(`${dates.length} ${dates.length === 1 ? 'day' : 'days'} ${kind ? 'saved' : 'cleared'}. Choose another range or switch to the other marking.`);
      setRange({ start: null, end: null });
    } catch (cause) {
      setError(cause instanceof Error && cause.message.startsWith('Choose') ? cause.message : 'Could not save your dates. Please try again.');
    } finally { setBusy(false); }
  };
  const format = (key: string | null) => key ? parseDate(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Choose date';
  const canSave = ready && !!range.start && !busy;
  return <EditSheet title="Update your cycle data" onClose={onClose} busy={busy} footer={screen === 'calendar' ? <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSave }} disabled={!canSave} onPress={() => { void save(); }} style={[g.button, !canSave && g.disabled]}><Text style={g.buttonText}>{busy ? 'Saving…' : `✓ ${kind ? 'Save' : 'Clear'} ${range.end ? 'range' : 'this day'}`}</Text></Pressable> : null}>
    {screen === 'choice' ? <View style={{ gap: theme.spacing.md }}>
      <Text style={g.body}>How would you like to update?</Text>
      <Pressable accessibilityRole="button" onPress={() => setScreen('calendar')} style={g.button}><Text style={g.buttonText}>Calendar · select cycle dates</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => onJournal(initialDate)} style={g.outlineButton}><Text style={{ color: theme.colors.text }}>Daily check-in · mood, symptoms, notes</Text></Pressable>
    </View> : <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        {([{ value: 'menstrual', label: 'Menstrual', color: theme.colors.calendarPeriod }, { value: 'ovulation', label: 'Ovulation', color: theme.colors.calendarFertile }, { value: null, label: 'Clear dates', color: theme.colors.roseWash }] as const).map(option => <Pressable key={option.label} accessibilityRole="button" accessibilityState={{ selected: kind === option.value }} disabled={busy} onPress={() => chooseKind(option.value)} style={[g.outlineButton, { flexGrow: 1, backgroundColor: kind === option.value ? option.color : theme.colors.surface, borderColor: kind === option.value ? theme.colors.text : theme.colors.border }]}><Text style={{ color: theme.colors.text, fontWeight: kind === option.value ? '700' : '400' }}>{option.label}</Text></Pressable>)}
      </View>
      <Text style={[g.body, { fontSize: 14 }]}>{!range.start ? 'Tap a start date, then an end date.' : !range.end ? 'Now tap the end date. For a single day, tap ✓ Save.' : 'Range selected. Tap ✓ Save, or tap a date to start again.'}</Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Change start date" disabled={busy} onPress={() => setRange({ start: null, end: null })} style={[g.outlineButton, { flex: 1 }]}><Text style={{ color: theme.colors.muted, fontSize: 12 }}>Start</Text><Text style={{ color: theme.colors.text, fontSize: 13 }}>{format(range.start)}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Change end date" disabled={busy || !range.start} onPress={() => setRange(previous => ({ ...previous, end: null }))} style={[g.outlineButton, { flex: 1 }]}><Text style={{ color: theme.colors.muted, fontSize: 12 }}>End</Text><Text style={{ color: theme.colors.text, fontSize: 13 }}>{format(range.end)}</Text></Pressable>
      </View>
      <View pointerEvents={busy ? 'none' : 'auto'}>
        <MonthNavigation month={month} onChange={changeMonth} onTitlePress={() => { setYear(String(month.getFullYear())); setJump(previous => !previous); }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <Pressable accessibilityRole="button" onPress={() => { setYear(String(month.getFullYear())); setJump(previous => !previous); }} style={g.outlineButton}><Text style={{ color: theme.colors.text, fontSize: 13 }}>Jump to month</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => { const date = parseDate(today); changeMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }} style={g.outlineButton}><Text style={{ color: theme.colors.text, fontSize: 13 }}>Today</Text></Pressable>
        </View>
        {jump && <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.text }}>Year</Text>
          <TextInput accessibilityLabel="Calendar year" keyboardType="number-pad" maxLength={4} value={year} onChangeText={setYear} style={g.input} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>{months.map((label, index) => <Pressable key={label} accessibilityRole="button" onPress={() => {
            const number = Number(year);
            if (!/^\d{4}$/.test(year) || number < 1900 || number > 2200) { setError('Enter a year between 1900 and 2200.'); return; }
            changeMonth(new Date(number, index, 1)); setJump(false); setError(null);
          }} style={[g.outlineButton, { width: '23%' }]}><Text style={{ color: theme.colors.text }}>{label}</Text></Pressable>)}</View>
        </View>}
        <CalendarGrid month={month} today={today} days={data.days} pendingDays={data.pendingDays} range={range} previewKind={kind} onSelect={select} />
        <CalendarLegend />
      </View>
      <Text style={[g.body, { fontSize: 12 }]}>Saving replaces the marking on these dates. Other dates and check-ins stay as they are.</Text>
      {error && <Text accessibilityRole="alert" style={{ color: theme.colors.todayPeriod }}>{error}</Text>}
      {message && <Text accessibilityLiveRegion="polite" style={g.body}>{message}</Text>}
    </View>}
  </EditSheet>;
}
