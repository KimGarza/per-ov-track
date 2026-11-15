import { CycleOptions } from './CycleOptions';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Text } from '@/components/Themed';
import { holidayFor } from '@/utils/faith';
import { dateKey, parseDate, type PeriodFlow, type CervicalMucus, type CycleKind, type JournalEntry } from '@/utils/cycle';
import { hasSymptom, moodOptions, symptomOptions, toggleSymptom } from '@/utils/checkIn';
import { useAppTheme } from './ThemeProvider';
import { useCycleData } from './CycleDataProvider';
import { EditSheet } from './EditSheet';
import { ActionButton } from './ActionButton';
import { Encouragement, FlowerMood, FormSectionHeading } from './EntryControls';

export function DayEditor({ day, initialField, onClose, predictedKind }: { day: string; initialField?: keyof JournalEntry; onClose: () => void; predictedKind?: CycleKind }) {
  const { theme, styles: g } = useAppTheme();
  const { data, saveDay, ready } = useCycleData();
  const today = dateKey(new Date());
  const past = day < today;
  const future = day > today;
  const [editing, setEditing] = useState(!past);
  const [entry, setEntry] = useState<JournalEntry>(() => data.journal[day] ?? { mood: '', symptoms: '', notes: '' });
  const [confirmed, setConfirmed] = useState(!data.pendingDays?.[day]);
  const [kind, setKind] = useState<CycleKind | null>(data.days[day] ?? null);
  const [flow, setFlow] = useState<PeriodFlow | undefined>(data.observations?.[day]?.kind === 'menstrual' ? data.observations[day].flow : undefined);
  const [mucus, setMucus] = useState<CervicalMucus | undefined>(data.observations?.[day]?.kind === 'ovulation' ? data.observations[day].mucus : undefined);
  const [cycleChoicesOpen, setCycleChoicesOpen] = useState(!past);
  const [moodChoicesOpen, setMoodChoicesOpen] = useState(!past);
  const [symptomChoicesOpen, setSymptomChoicesOpen] = useState(!past);
  const [moreSymptoms, setMoreSymptoms] = useState(false);
  const [customMood, setCustomMood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const cancel = () => {
    setEntry(data.journal[day] ?? { mood: '', symptoms: '', notes: '' }); setKind(data.days[day] ?? null);
    setConfirmed(!data.pendingDays?.[day]);
    const observation = data.observations?.[day];
    setFlow(observation?.kind === 'menstrual' ? observation.flow : undefined);
    setMucus(observation?.kind === 'ovulation' ? observation.mucus : undefined);
    setEditing(false); setError(null); setMoreSymptoms(false); setCustomMood(false); setCycleChoicesOpen(false); setMoodChoicesOpen(false); setSymptomChoicesOpen(false);
  };
  const save = async () => {
    if (busy || !ready) return;
    if (future && kind) { setError('You cannot record a period or ovulation after today.'); return; }
    setBusy(true); setError(null);
    try {
      await saveDay(day, kind, { mood: entry.mood.trim(), symptoms: entry.symptoms.trim(), notes: entry.notes.trim() }, confirmed, kind === 'menstrual' ? { kind, flow } : kind === 'ovulation' ? { kind, mucus } : undefined);
      if (past) { setEditing(false); setSaved(true); } else onClose();
    } catch { setError('Could not save your check-in. Please try again.'); }
    finally { setBusy(false); }
  };
  const cycleLabel = kind === 'menstrual' ? 'Menstrual' : kind === 'ovulation' ? 'Ovulation' : 'Neither';
  const hasRecord = !!data.journal[day] || !!data.days[day];
  const footer = editing ? <View style={[g.row, { alignItems: 'center' }]}>
    {past && <ActionButton disabled={busy} onPress={cancel}>Cancel</ActionButton>}
    <ActionButton variant="primary" disabled={busy || !ready} style={{ flex: 1 }} onPress={() => { void save(); }}>{busy ? 'Saving…' : past ? '✓ Save changes' : '✓ Save check-in'}</ActionButton>
  </View> : <ActionButton style={{ alignSelf: 'stretch' }} onPress={() => { setEditing(true); setSaved(false); }}>✎ Edit</ActionButton>;
  return <EditSheet dateHeader eyebrow={past ? `Past day · ${editing ? 'editing' : 'viewing'}` : 'Daily check-in'} title={parseDate(day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} onClose={onClose} busy={busy} footer={footer}>
    <View style={g.stack}>
      {!editing ? <>
        {!hasRecord && <Text style={g.caption}>No check-in saved for this day. Tap Edit to add one.</Text>}
        {hasRecord && <View style={g.tagRow}><View style={[g.tag, g.tagSelected]}><Text style={g.tagText}>{cycleLabel}</Text></View></View>}
        {data.pendingDays?.[day] && <Text style={g.caption}>Unconfirmed marking · Edit to confirm or change it.</Text>}
        {!!data.observations?.[day] && <Text style={g.caption}>{kind === 'menstrual' ? `Flow: ${flow ?? 'Not specified'}` : `Cervical mucus: ${mucus ?? 'Not specified'}`}</Text>}
        <View style={g.formSection}><FormSectionHeading title="Symptoms" /><View style={g.tagRow}>{entry.symptoms ? entry.symptoms.split(',').map((value, index) => <View key={index} style={g.tag}><Text style={g.tagText}>{value.trim()}</Text></View>) : <Text style={g.caption}>Not recorded</Text>}</View></View>
        <View style={g.formSection}><FormSectionHeading title="Mood" /><View style={[g.row, { alignItems: 'center' }]}>{entry.mood && <FlowerMood mood={entry.mood} small />}<Text style={g.body}>{entry.mood || 'Not recorded'}</Text></View></View>
        <View style={g.formSection}><FormSectionHeading title="Notes" /><View style={[g.input, g.noteInput]}><Text style={[g.body, { fontFamily: theme.fonts.heading }]}>{entry.notes || 'No notes for this day.'}</Text></View></View>
        {saved && <Text accessibilityLiveRegion="polite" style={g.caption}>Changes saved.</Text>}
      </> : <>
        {!past && <Encouragement day={day} />}
        {holidayFor(day) && <Text style={g.caption}>✝ {holidayFor(day)!.name}</Text>}
        {predictedKind && !data.days[day] && <Text style={g.caption}>Estimated {predictedKind === 'menstrual' ? 'period' : 'ovulation'} date · not a confirmed record.</Text>}
        <View style={g.formSection}>
          {!past && <FormSectionHeading title={future ? 'For this day' : 'Your cycle today'} />}
          {past && <Pressable accessibilityRole="button" accessibilityLabel="Change cycle marking" accessibilityState={{ expanded: cycleChoicesOpen }} onPress={() => setCycleChoicesOpen(value => !value)} style={[g.tag, { alignSelf: 'flex-start' }]}><Text style={g.tagText}>{cycleLabel} ▾</Text></Pressable>}
          {cycleChoicesOpen && <View style={[g.row, { flexWrap: 'wrap' }]}>
            {([{ value: 'menstrual', label: 'Menstrual', symbol: { ios: 'drop', android: 'water_drop', web: 'water_drop' } }, { value: 'ovulation', label: 'Ovulation', symbol: { ios: 'sun.max', android: 'sunny', web: 'sunny' } }, { value: null, label: 'Neither', symbol: { ios: 'leaf', android: 'eco', web: 'eco' } }] as const).map(option => <Pressable key={option.label} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{ selected: kind === option.value, disabled: busy || future && option.value !== null }} disabled={busy || future && option.value !== null} onPress={() => { setKind(option.value); setConfirmed(true); }} style={[g.choiceTile, kind === option.value && g.choiceTileSelected, future && option.value !== null && g.disabled]}>
              <SymbolView name={option.symbol} size={32} tintColor={kind === option.value ? theme.colors.onPrimary : theme.colors.text} />
              <Text style={[g.choiceTileLabel, kind === option.value && { color: theme.colors.onPrimary }]}>{option.label}</Text>
            </Pressable>)}
          </View>}
          {future && <Text style={g.caption}>Future dates allow notes, mood, and symptoms; period and ovulation records must be today or earlier.</Text>}
          {kind && cycleChoicesOpen && <CycleOptions kind={kind} flow={flow} mucus={mucus} onFlow={setFlow} onMucus={setMucus} disabled={busy} />}
          {data.pendingDays?.[day] && !future && <Pressable accessibilityRole="checkbox" accessibilityLabel="Confirm cycle marking" accessibilityState={{ checked: confirmed }} disabled={busy} onPress={() => setConfirmed(value => !value)} style={g.tag}><Text style={g.tagText}>{confirmed ? '✓' : '○'} Confirm this cycle marking</Text></Pressable>}
        </View>
        <View style={g.formSection}><FormSectionHeading title="Symptoms" />
        {past && !symptomChoicesOpen && <Pressable accessibilityRole="button" accessibilityLabel="Edit symptoms" onPress={() => setSymptomChoicesOpen(true)} style={g.tag}><Text style={g.tagText}>{entry.symptoms || 'Add symptoms'} ▾</Text></Pressable>}
        {symptomChoicesOpen && <View style={g.tagRow}>
          {symptomOptions.map(symptom => <Pressable key={symptom} accessibilityRole="button" accessibilityState={{ selected: hasSymptom(entry.symptoms, symptom) }} disabled={busy} onPress={() => setEntry(previous => ({ ...previous, symptoms: toggleSymptom(previous.symptoms, symptom) }))} style={[g.tag, hasSymptom(entry.symptoms, symptom) && g.tagSelected]}><Text style={g.tagText}>{symptom}</Text></Pressable>)}
          {entry.symptoms.split(',').map(value => value.trim()).filter(value => value && !symptomOptions.some(symptom => symptom.toLowerCase() === value.toLowerCase())).map((value, index) => <Pressable key={`custom-${index}`} accessibilityRole="button" accessibilityLabel={`Remove ${value} symptom`} accessibilityState={{ selected: true }} disabled={busy} onPress={() => setEntry(previous => ({ ...previous, symptoms: toggleSymptom(previous.symptoms, value) }))} style={[g.tag, g.tagSelected]}><Text style={g.tagText}>{value} ×</Text></Pressable>)}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: moreSymptoms }} disabled={busy} onPress={() => setMoreSymptoms(value => !value)} style={g.tag}><Text style={g.tagText}>+ Other</Text></Pressable>
        </View>}{(moreSymptoms || !!initialField && initialField === 'symptoms') && <TextInput accessibilityLabel="Symptoms" value={entry.symptoms} editable={!busy} onChangeText={value => setEntry(previous => ({ ...previous, symptoms: value }))} maxLength={5000} multiline placeholder="Add symptoms, separated by commas" placeholderTextColor={theme.colors.placeholder} style={g.input} />}</View>
        <View style={g.formSection}><FormSectionHeading title="Mood" />
          {past && !moodChoicesOpen && <Pressable accessibilityRole="button" accessibilityLabel="Change mood" onPress={() => setMoodChoicesOpen(true)} style={[g.row, { alignItems: 'center', minHeight: theme.layout.touchTarget }]}><FlowerMood mood={entry.mood} small /><Text style={g.tagText}>{entry.mood || 'Add mood'} ▾</Text></Pressable>}
          {moodChoicesOpen && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 4 }}>
            {moodOptions.map(mood => <Pressable key={mood} accessibilityRole="button" accessibilityLabel={`${mood} mood`} accessibilityState={{ selected: entry.mood === mood }} disabled={busy} onPress={() => setEntry(previous => ({ ...previous, mood: previous.mood === mood ? '' : mood }))} style={g.moodChoice}><FlowerMood mood={mood} selected={entry.mood === mood} /><View style={[g.moodLabel, entry.mood === mood && { backgroundColor: theme.colors.roseWash }]}><Text style={g.tagText}>{mood}</Text></View></Pressable>)}
          </ScrollView>}
          {moodChoicesOpen && <Pressable accessibilityRole="button" disabled={busy} onPress={() => setCustomMood(value => !value)}><Text style={g.caption}>Use your own words {customMood ? '▴' : '▾'}</Text></Pressable>}
          {(customMood || !!entry.mood && !moodOptions.some(mood => mood === entry.mood)) && <TextInput accessibilityLabel="Mood" editable={!busy} value={entry.mood} maxLength={200} onChangeText={value => setEntry(previous => ({ ...previous, mood: value }))} style={g.input} />}
        </View>
        <View style={g.formSection}><FormSectionHeading title={past ? 'Notes' : 'A little space for your thoughts'} />
          <TextInput accessibilityLabel="Notes" autoFocus={initialField === 'notes'} editable={!busy} value={entry.notes} onChangeText={value => setEntry(previous => ({ ...previous, notes: value }))} multiline maxLength={5000} placeholder="Anything you’d like to remember…" placeholderTextColor={theme.colors.placeholder} style={[g.input, g.noteInput]} />
        </View>
      </>}
      {error && <Text accessibilityRole="alert" style={{ color: theme.colors.primary }}>{error}</Text>}
    </View>
  </EditSheet>;
}
