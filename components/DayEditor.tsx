import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { holidayFor, verses } from '@/utils/faith';
import { parseDate, type CycleKind, type JournalEntry } from '@/utils/cycle';
import { useAppTheme } from './ThemeProvider';
import { useCycleData } from './CycleDataProvider';
import { EditSheet } from './EditSheet';

export function DayEditor({ day, initialField, onClose }: { day: string; initialField?: keyof JournalEntry; onClose: () => void }) {
  const { theme, styles: g } = useAppTheme();
  const { data, saveDay, ready } = useCycleData();
  const holiday = holidayFor(day);
  const [entry, setEntry] = useState<JournalEntry>(() => data.journal[day] ?? { mood: '', symptoms: '', notes: '' });
  const [kind, setKind] = useState<CycleKind | null>(data.days[day] ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true); setError(null);
    try {
      await saveDay(day, kind, { mood: entry.mood.trim(), symptoms: entry.symptoms.trim(), notes: entry.notes.trim() });
      onClose();
    } catch { setError('Could not save your check-in. Please try again.'); }
    finally { setBusy(false); }
  };
  return <EditSheet title={parseDate(day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} onClose={onClose} busy={busy} footer={<Pressable accessibilityRole="button" disabled={busy || !ready} accessibilityState={{ disabled: busy || !ready }} onPress={() => { void save(); }} style={[g.button, (busy || !ready) && g.disabled]}><Text style={g.buttonText}>{busy ? 'Saving…' : '✓ Save check-in'}</Text></Pressable>}>
    <View style={{ gap: theme.spacing.md }}>
      {holiday && <View style={[g.card, { padding: theme.spacing.sm, backgroundColor: theme.colors.roseWash }]}>
        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>✝ {holiday.name}</Text>
        <Text style={g.body}>{verses[holiday.verseId].reference} · KJV</Text>
        <Text style={g.body}>{verses[holiday.verseId].text}</Text>
      </View>}
      <Text style={g.body}>How are you feeling?</Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        {([{ value: 'menstrual', label: 'Menstrual', color: theme.colors.calendarPeriod }, { value: 'ovulation', label: 'Ovulation', color: theme.colors.calendarFertile }, { value: null, label: 'Neither', color: theme.colors.roseWash }] as const).map(option => <Pressable key={option.label} accessibilityRole="button" accessibilityState={{ selected: kind === option.value }} disabled={busy} onPress={() => setKind(option.value)} style={[g.outlineButton, { flexGrow: 1, backgroundColor: kind === option.value ? option.color : theme.colors.surface, borderColor: kind === option.value ? theme.colors.text : theme.colors.border }]}><Text style={{ color: theme.colors.text }}>{option.label}</Text></Pressable>)}
      </View>
      {(['mood', 'symptoms', 'notes'] as const).map(field => <View key={field} style={{ gap: theme.spacing.xs }}>
        <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 15, fontWeight: '600' }}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
        <TextInput accessibilityLabel={field.charAt(0).toUpperCase() + field.slice(1)} autoFocus={field === initialField} editable={!busy} value={entry[field]} onChangeText={value => setEntry(previous => ({ ...previous, [field]: value }))} multiline={field !== 'mood'} maxLength={field === 'notes' ? 5000 : 1000} placeholder={field === 'mood' ? 'How is your mood?' : field === 'symptoms' ? 'What symptoms did you notice?' : 'Anything you want to remember'} placeholderTextColor={theme.colors.muted} style={[g.input, field !== 'mood' && { minHeight: 90, textAlignVertical: 'top' }]} />
      </View>)}
      {error && <Text accessibilityRole="alert" style={{ color: theme.colors.todayPeriod }}>{error}</Text>}
    </View>
  </EditSheet>;
}
