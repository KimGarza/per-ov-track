import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { holidayFor, verses } from '@/utils/faith';
import { dateKey, parseDate, type CycleKind, type JournalEntry } from '@/utils/cycle';
import { useAppTheme } from './ThemeProvider';
import { useCycleData } from './CycleDataProvider';
import { EditSheet } from './EditSheet';

export function DayEditor({ day, initialField, onClose }: { day: string; initialField?: keyof JournalEntry; onClose: () => void }) {
  const { theme, styles: g } = useAppTheme();
  const { data, saveDay, ready } = useCycleData();
  const holiday = holidayFor(day);
  const [entry, setEntry] = useState<JournalEntry>(() => data.journal[day] ?? { mood: '', symptoms: '', notes: '' });
  const [confirmed, setConfirmed] = useState(!data.pendingDays?.[day]);
  const [kind, setKind] = useState<CycleKind | null>(data.days[day] ?? null);
  const [inputMode, setInputMode] = useState<'typing' | 'voice'>('typing');
  const [voicePreview, setVoicePreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true); setError(null);
    try {
      await saveDay(day, kind, { mood: entry.mood.trim(), symptoms: entry.symptoms.trim(), notes: entry.notes.trim() }, confirmed);
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
      {data.pendingDays?.[day] && <Text style={g.body}>This date is not confirmed yet. Choose Menstrual or Ovulation and save to confirm it when the date arrives.</Text>}
      <Text style={g.body}>How are you feeling?</Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {([{ id: 'typing', label: '✎ Typing' }, { id: 'voice', label: '♫ Voice memo' }] as const).map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.id === 'typing' ? 'Typing input' : 'Voice memo input'} accessibilityState={{ selected: inputMode === option.id }} disabled={busy} onPress={() => setInputMode(option.id)} style={[g.outlineButton, { flex: 1, backgroundColor: inputMode === option.id ? theme.colors.roseWash : theme.colors.surface }]}><Text style={{ color: theme.colors.text, fontWeight: '600' }}>{option.label}</Text></Pressable>)}
      </View>
      {inputMode === 'voice' && <View style={[g.card, { padding: theme.spacing.md, gap: theme.spacing.sm, backgroundColor: theme.colors.roseWash }]}>
        <Text style={[g.heading, { fontSize: 25 }]}>A moment to speak freely</Text>
        <Text style={g.body}>Voice memo preview · Recording, transcription and AI summarizing will be connected later. This demo does not use your microphone.</Text>
        <Pressable accessibilityRole="button" onPress={() => setVoicePreview(true)} style={g.outlineButton}><Text style={{ color: theme.colors.text }}>Try voice memo preview</Text></Pressable>
        {voicePreview && <>
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Sample transcript</Text>
          <Text style={[g.body, { fontStyle: 'italic' }]}>Today felt busy. I was a little emotional this morning, but a walk and a quiet moment of prayer helped me feel calmer. I want to give myself more time to rest tonight.</Text>
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Sample AI summary</Text>
          <Text style={g.body}>An emotional start to a busy day. Walking and prayer brought some calm. Intention for tonight: make time for rest.</Text>
          <Pressable accessibilityRole="button" onPress={() => { setEntry(previous => ({ ...previous, notes: [previous.notes, 'Sample voice memo: An emotional start to a busy day. Walking and prayer brought some calm. Intention for tonight: make time for rest.'].filter(Boolean).join('\n\n') })); setInputMode('typing'); }} style={g.outlineButton}><Text style={{ color: theme.colors.text }}>Put sample summary in notes</Text></Pressable>
        </>}
      </View>}
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        {([{ value: 'menstrual', label: 'Menstrual', color: theme.colors.calendarPeriod }, { value: 'ovulation', label: 'Ovulation', color: theme.colors.calendarFertile }, { value: null, label: 'Neither', color: theme.colors.roseWash }] as const).map(option => <Pressable key={option.label} accessibilityRole="button" accessibilityState={{ selected: kind === option.value }} disabled={busy} onPress={() => { setKind(option.value); setConfirmed(true); }} style={[g.outlineButton, { flexGrow: 1, backgroundColor: kind === option.value ? option.color : theme.colors.surface, borderColor: kind === option.value ? theme.colors.text : theme.colors.border }]}><Text style={{ color: theme.colors.text }}>{option.label}</Text></Pressable>)}
      </View>
      {data.pendingDays?.[day] && day <= dateKey(new Date()) && <Pressable accessibilityRole="checkbox" accessibilityLabel="Confirm cycle marking" accessibilityState={{ checked: confirmed }} aria-checked={confirmed} disabled={busy} onPress={() => setConfirmed(value => !value)} style={g.outlineButton}><Text style={{ color: theme.colors.text }}>{confirmed ? '✓' : '○'} Confirm this cycle marking</Text></Pressable>}
      {(['mood', 'symptoms', 'notes'] as const).map(field => <View key={field} style={{ gap: theme.spacing.xs }}>
        <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 15, fontWeight: '600' }}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
        <TextInput accessibilityLabel={field.charAt(0).toUpperCase() + field.slice(1)} autoFocus={field === initialField} editable={!busy} value={entry[field]} onChangeText={value => setEntry(previous => ({ ...previous, [field]: value }))} multiline={field !== 'mood'} maxLength={field === 'notes' ? 5000 : 1000} placeholder={field === 'mood' ? 'e.g. irritable, emotional, calm…' : field === 'symptoms' ? 'What symptoms did you notice?' : 'Anything you want to remember'} placeholderTextColor={theme.colors.placeholder} style={[g.input, field === 'mood' && !entry.mood && { fontStyle: 'italic' }, field !== 'mood' && { minHeight: 90, textAlignVertical: 'top' }]} />
      </View>)}
      {error && <Text accessibilityRole="alert" style={{ color: theme.colors.todayPeriod }}>{error}</Text>}
    </View>
  </EditSheet>;
}
