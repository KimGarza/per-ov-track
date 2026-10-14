import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { ReflectionEntry } from '@/utils/cycle';
import { useAppTheme } from './ThemeProvider';
import { useCycleData } from './CycleDataProvider';

const goals = [
  { id: 'notice', label: 'Notice a feeling and its pattern' },
  { id: 'pray', label: 'Bring it honestly to Jesus in prayer' },
  { id: 'act', label: 'Choose one kind, faithful next step' },
];
export function DailyReflection({ day }: { day: string }) {
  const { theme, styles: g } = useAppTheme();
  const { data, saveReflection } = useCycleData();
  const [entry, setEntry] = useState<ReflectionEntry>(() => data.reflections?.[day] ?? { pattern: '', action: '', completed: [] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const update = (change: (previous: ReflectionEntry) => ReflectionEntry) => { setEntry(change); setMessage(null); };
  const save = async () => {
    setBusy(true);
    try { await saveReflection(day, entry); setMessage('Today’s reflection and goals saved.'); }
    catch { setMessage('Could not save. Your changes are still here; please try again.'); }
    finally { setBusy(false); }
  };
  return <View style={[g.card, { gap: theme.spacing.sm }]}>
    <Text style={[g.heading, { fontSize: 30 }]}>Daily goals</Text>
    <Text style={g.body}>Notice the pattern. Make room for grace. Take one small step.</Text>
    {goals.map(goal => {
      const checked = entry.completed.includes(goal.id);
      return <Pressable key={goal.id} accessibilityRole="checkbox" aria-checked={checked} accessibilityLabel={goal.label} accessibilityState={{ checked }} disabled={busy} onPress={() => update(previous => ({ ...previous, completed: previous.completed.includes(goal.id) ? previous.completed.filter(id => id !== goal.id) : [...previous.completed, goal.id] }))} style={[g.outlineButton, { flexDirection: 'row', justifyContent: 'flex-start', gap: theme.spacing.sm, backgroundColor: checked ? theme.colors.roseWash : theme.colors.surface }]}>
        <Text style={{ color: theme.colors.rose, fontSize: 20 }}>{checked ? '✓' : '○'}</Text><Text style={{ flex: 1, color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 14 }}>{goal.label}</Text>
      </Pressable>;
    })}
    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>What pattern do you notice?</Text>
    <TextInput accessibilityLabel="Pattern I notice" value={entry.pattern} editable={!busy} onChangeText={pattern => update(previous => ({ ...previous, pattern }))} placeholder="A feeling, a trigger, or something that keeps repeating…" placeholderTextColor={theme.colors.muted} multiline maxLength={2000} style={[g.input, { minHeight: 80 }]} />
    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>One small step for today</Text>
    <TextInput accessibilityLabel="Today's small step" value={entry.action} editable={!busy} onChangeText={action => update(previous => ({ ...previous, action }))} placeholder="How can I respond with faith, wisdom, and care?" placeholderTextColor={theme.colors.muted} multiline maxLength={2000} style={[g.input, { minHeight: 80 }]} />
    {message && <Text accessibilityLiveRegion="polite" style={g.body}>{message}</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void save(); }} style={[g.button, busy && g.disabled]}><Text style={g.buttonText}>{busy ? 'Saving…' : 'Save today’s goals'}</Text></Pressable>
  </View>;
}
