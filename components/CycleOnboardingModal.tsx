import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { dateKey, parseDate } from '@/utils/cycle';
import { type CycleOnboarding, type PregnancyIntent } from '@/utils/onboarding';
import { useAppTheme } from '@/components/ThemeProvider';

export function CycleOnboardingModal({ visible, onSave }: { visible: boolean; onSave: (answers: CycleOnboarding) => Promise<void> }) {
  const { theme } = useAppTheme();
  const [period, setPeriod] = useState('');
  const [ovulation, setOvulation] = useState('');
  const [intent, setIntent] = useState<PregnancyIntent | undefined>();
  const [unknown, setUnknown] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const c = theme.colors;
  const options: { value: PregnancyIntent; label: string }[] = [
    { value: 'trying', label: 'Yes, I want to' }, { value: 'struggling', label: 'I want to, but I am struggling' },
    { value: 'no', label: 'No' }, { value: 'pregnant', label: 'I am pregnant' }, { value: 'unsure', label: 'Not sure' },
  ];
  async function finish() {
    try {
      setError('');
      const now = dateKey(new Date());
      const valid = (value: string) => { if (!value.trim()) return undefined; const parsed = parseDate(value.trim()); if (dateKey(parsed) > now) throw new Error('Please enter a date on or before today.'); return value.trim(); };
      const lastPeriodStart = unknown ? undefined : valid(period);
      const lastOvulation = unknown ? undefined : valid(ovulation);
      setBusy(true);
      await onSave({ completed: true, lastPeriodStart, lastOvulation, pregnancyIntent: intent, cycleLength: 28, periodLength: 5 });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save your answers'); }
    finally { setBusy(false); }
  }
  const btn = (label: string, onPress: () => void, selected = false) => <Pressable accessibilityRole="button" onPress={onPress} style={{ borderWidth: 1, borderColor: selected ? c.rose : c.border, backgroundColor: selected ? c.roseWash : c.surface, borderRadius: 12, padding: 13 }}><Text style={{ color: c.text }}>{label}</Text></Pressable>;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => void finish()}>
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0009', padding: 18 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ backgroundColor: c.background, borderRadius: 20, padding: 22, gap: 12 }}>
        <Text style={{ color: c.text, fontSize: 25, fontWeight: '700' }}>Let's get to know your cycle</Text>
        <Text style={{ color: c.text }}>Everything here is optional. You can start tracking without knowing any dates.</Text>
        <Text style={{ color: c.text, fontWeight: '600' }}>When did your last period start?</Text>
        <TextInput accessibilityLabel="Last period start date" placeholder="YYYY-MM-DD" placeholderTextColor={c.muted} editable={!unknown} value={period} onChangeText={setPeriod} style={{ borderColor: c.border, borderWidth: 1, borderRadius: 10, padding: 12, color: c.text }} />
        <Text style={{ color: c.text, fontWeight: '600' }}>Do you know your last ovulation date?</Text>
        <TextInput accessibilityLabel="Last ovulation date" placeholder="YYYY-MM-DD" placeholderTextColor={c.muted} editable={!unknown} value={ovulation} onChangeText={setOvulation} style={{ borderColor: c.border, borderWidth: 1, borderRadius: 10, padding: 12, color: c.text }} />
        {btn("I'm not sure — start tracking now", () => { setUnknown(!unknown); setPeriod(''); setOvulation(''); }, unknown)}
        <Text style={{ color: c.text, fontWeight: '600', marginTop: 8 }}>Are you trying to get pregnant?</Text>
        {options.map(option => <View key={option.value}>{btn(option.label, () => setIntent(intent === option.value ? undefined : option.value), intent === option.value)}</View>)}
        {!!error && <Text accessibilityRole="alert" style={{ color: '#c33' }}>{error}</Text>}
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void finish()} style={{ padding: 16, borderRadius: 12, backgroundColor: c.rose }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>{busy ? 'Saving…' : 'Continue to calendar'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  </Modal>;
}
