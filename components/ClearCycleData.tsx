import { useState } from 'react';
import { View } from 'react-native';
import { Text } from './Themed';
import { useAppTheme } from './ThemeProvider';
import { useCycleData } from './CycleDataProvider';
import { useToday } from './useToday';
import { confirmedPeriodStarts } from '@/utils/cycleInsights';
import { clearRangeSummary } from '@/utils/clearCycleData';
import { parseDate } from '@/utils/cycle';
import { Dropdown } from './Dropdown';
import { ActionButton } from './ActionButton';
export function ClearCycleData() {
  const { data, resetCycleData } = useCycleData();
  const { styles: g } = useAppTheme();
  const today = useToday();
  const starts = confirmedPeriodStarts(data, today);
  const [scope, setScope] = useState<'current' | 'all' | 'range'>('current');
  const [selectedStart, setSelectedStart] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const format = (date: string) => parseDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const from = scope === 'all' ? null : scope === 'current' ? starts.at(-1) ?? '' : selectedStart;
  const summary = clearRangeSummary(data, from || null, today);
  const valid = scope === 'all' || !!from;
  const choose = (value: typeof scope) => { setScope(value); setConfirming(value !== 'range'); setMessage(''); };
  const cancel = () => { setConfirming(false); setMessage(''); };
  const clear = async () => {
    if (!valid || busy) return;
    setBusy(true); setMessage('');
    try { await resetCycleData(from, today); setConfirming(false); setSelectedStart(''); setMessage('Cycle data cleared.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to clear cycle data. Please try again.'); }
    finally { setBusy(false); }
  };
  return <View style={g.formSection}>
    <Text style={g.sectionHeading}>Clear cycle data</Text>
    <Dropdown label="Cycle data to clear" value={scope} disabled={busy} onChange={choose} options={[{ value: 'current', label: 'Current cycle' }, { value: 'all', label: 'All cycle data' }, { value: 'range', label: 'Choose specific cycle range' }]} />
    {scope === 'range' && <Dropdown label="Clear from cycle" value={selectedStart} disabled={busy} options={[{ value: '', label: 'Choose a starting cycle', disabled: true }, ...starts.slice().reverse().map(start => ({ value: start, label: `${format(start)} → today` }))]} onChange={value => { setSelectedStart(value); setConfirming(true); setMessage(''); }} />}
    {valid ? <>
      <Text style={g.body}>{scope === 'all' ? 'All dates, including any future entries.' : `${format(from!)} → ${format(today)} · ${summary.calendarDays} calendar ${summary.calendarDays === 1 ? 'day' : 'days'}`}</Text>
      <Text style={g.caption}>{summary.recordedDays} recorded {summary.recordedDays === 1 ? 'day' : 'days'} on this device. Cloud-only entries in the same range will also be cleared.</Text>
    </> : <Text style={g.caption}>{starts.length ? 'Choose a starting cycle. The range ends today.' : 'No recorded cycle start yet. You can still choose All cycle data to clear existing entries.'}</Text>}
    <Text style={g.caption}>This permanently removes cycle markings, check-ins, journal pages, and reflections for the selected dates. Your account and subscription stay active.{scope !== 'all' ? ' Earlier and future dates stay as they are.' : ' Cycle setup will also be reset.'}</Text>
    {!confirming ? <ActionButton disabled={busy || !valid} onPress={() => { setConfirming(true); setMessage(''); }}>Review clear</ActionButton> : <>
      <Text accessibilityRole="alert" style={g.body}>Clear these records? This cannot be undone.</Text>
      <View style={[g.tagRow, { alignItems: 'center' }]}>
        <ActionButton variant="danger" disabled={busy || !valid} onPress={() => { void clear(); }}>{busy ? 'Clearing…' : 'Confirm'}</ActionButton>
        <ActionButton disabled={busy} onPress={cancel}>Cancel</ActionButton>
      </View>
    </>}
    {!!message && <Text accessibilityLiveRegion="polite" style={g.body}>{message}</Text>}
  </View>;
}
