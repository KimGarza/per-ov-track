import { Alert, Platform, Pressable, TextInput, View } from 'react-native';
import { useState } from 'react';
import { useCycleData } from './CycleDataProvider';
import { analyzeCycles } from '@/utils/cycleInsights';
import { dateKey, parseDate } from '@/utils/cycle';
import { Text } from '@/components/Themed';
import { themeOptions } from '@/constants/Theme';
import { useAppTheme } from './ThemeProvider';
import { BibleGuidance } from './BibleGuidance';
import { InsightsContent } from './InsightsContent';
import { JournalContent } from './JournalContent';

export type PrimaryPanel = 'themes' | 'settings' | 'billing' | 'subscription' | 'insights' | 'faith' | 'journal';
export const panelTitles: Record<PrimaryPanel, string> = { themes: 'Themes', settings: 'Settings', billing: 'Billing', subscription: 'Subscription', insights: 'Insights', faith: 'Faith & guidance', journal: 'Journal & goals' };
export function PrimaryPanels({ panel, onClose, onChange }: { panel: PrimaryPanel; onClose: () => void; onChange: (panel: PrimaryPanel) => void }) {
  const { theme, styles: g, setName } = useAppTheme();
  const { data, onboarding, resetCycleData } = useCycleData();
  const insights = analyzeCycles(data, dateKey(new Date()), onboarding);
  const [resetFrom, setResetFrom] = useState('');
  const [resetError, setResetError] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmReset = (all: boolean) => {
    let from: string | null = null;
    try { if (!all) { from = dateKey(parseDate(resetFrom)); if (from > dateKey(new Date())) throw new Error('Choose today or an earlier date.'); } }
    catch { setResetError('Enter a valid date (YYYY-MM-DD) on or before today.'); return; }
    const perform = async () => { setBusy(true); setResetError(''); try { await resetCycleData(from); onClose(); } catch (error) { setResetError(error instanceof Error ? error.message : 'Reset failed'); } finally { setBusy(false); } };
    const question = all ? 'Delete all cycle and journal history from this account?' : `Delete cycle and journal entries from ${from} onward?`;
    if (Platform.OS === 'web') { if (globalThis.confirm(question)) void perform(); }
    else Alert.alert('Delete cycle data?', question, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { void perform(); } }]);
  };
  if (panel === 'insights') return <InsightsContent />;
  if (panel === 'journal') return <JournalContent />;
  if (panel === 'faith') return <BibleGuidance />;
  if (panel === 'themes') return <View>{themeOptions.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} onPress={() => { setName(option.id); onClose(); }} style={g.outlineButton}><Text style={g.label}>{option.label}</Text></Pressable>)}</View>;
  if (panel === 'settings') return <View style={{ gap: theme.spacing.md }}>
    <Text style={g.sectionHeading}>Your cycle</Text>
    <Text style={g.body}>Typical cycle: {insights.cycleLength} days · Period: {insights.periodLength} days</Text>
    <Text style={g.body}>Based on {insights.completedCycles} recent completed cycles. Future dates are personalized estimates; recorded dates remain unchanged.</Text>
    <Text style={g.body}>Estimated next cycle: {insights.latestStart ? dateKey(new Date(parseDate(insights.latestStart).getFullYear(), parseDate(insights.latestStart).getMonth(), parseDate(insights.latestStart).getDate() + insights.cycleLength)) : 'Add a period to begin tracking'}</Text>
    <Text style={g.sectionHeading}>Reset cycle data</Text>
    <Text style={g.caption}>Remove cycle records, journal entries, and notes from a selected date onward, or delete all history. This also removes matching cloud records.</Text>
    <TextInput accessibilityLabel="Reset starting date" placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.placeholder} value={resetFrom} onChangeText={setResetFrom} style={g.input} />
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => confirmReset(false)} style={g.outlineButton}><Text style={g.label}>Reset from selected date</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => confirmReset(true)} style={[g.outlineButton, { borderColor: theme.colors.todayPeriod }]}><Text style={{ color: theme.colors.todayPeriod }}>Delete all cycle data</Text></Pressable>
    {!!resetError && <Text accessibilityRole="alert" style={{ color: theme.colors.todayPeriod }}>{resetError}</Text>}
  </View>;
  return <View style={{ gap: theme.spacing.md }}><View style={[g.card, { backgroundColor: theme.colors.roseWash }]}><Text style={[g.heading, { fontSize: 28 }]}>{panel === 'billing' ? 'Billing, kept simple' : 'Your Crimson Rhythm subscription'}</Text><Text style={g.body}>{panel === 'billing' ? 'Billing is not connected yet. Payment details and receipts will appear here once billing is available.' : 'Subscriptions are not available yet. Plan details and subscription management will appear here when they are ready.'}</Text></View><Text style={g.body}>There is nothing to purchase or manage here yet.</Text></View>;
}
