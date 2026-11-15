import { AccountContent } from './AccountContent';
import { BillingContent } from './BillingContent';
import { Alert, Platform, Pressable, View, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';
import { ActionButton } from './ActionButton';
import { useCycleData } from './CycleDataProvider';
import { analyzeCycles, confirmedPeriodStarts } from '@/utils/cycleInsights';
import { dateKey, parseDate } from '@/utils/cycle';
import { Text } from '@/components/Themed';
import { themeOptions } from '@/constants/Theme';
import { useAppTheme } from './ThemeProvider';
import { BibleGuidance } from './BibleGuidance';
import { InsightsContent } from './InsightsContent';
import { JournalContent } from './JournalContent';

export type PrimaryPanel = 'account' | 'account-options' | 'password' | 'delete-account' | 'themes' | 'settings' | 'billing' | 'subscription' | 'insights' | 'faith' | 'journal' | 'support' | 'privacy';
export const panelTitles: Record<PrimaryPanel, string> = { account: 'My Account', 'account-options': 'Account options', password: 'Change password', 'delete-account': 'Delete account', themes: 'Themes', settings: 'Settings', billing: 'Billing', subscription: 'Subscription', insights: 'Insights', faith: 'Faith & guidance', journal: 'Journal & goals', support: 'Help & Support', privacy: 'Privacy & Data' };
export function PrimaryPanels({ panel, onClose, onChange }: { panel: PrimaryPanel; onClose: () => void; onChange: (panel: PrimaryPanel) => void }) {
  const { theme, styles: g, setName } = useAppTheme();
  const { session } = useAuth();
  const [supportCategory, setSupportCategory] = useState('Feedback');
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);
  const { data, onboarding, resetCycleData } = useCycleData();
  const insights = analyzeCycles(data, dateKey(new Date()), onboarding);
  const cycleStarts = confirmedPeriodStarts(data, dateKey(new Date()));
  const currentCycleStart = cycleStarts.at(-1) ?? null;
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [showCycles, setShowCycles] = useState(false);
  const [resetError, setResetError] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmReset = (all: boolean, cycleOverride?: string) => {
    let from: string | null = null;
    try { if (!all) { from = cycleOverride ?? selectedCycle ?? currentCycleStart; if (!from || from > dateKey(new Date())) throw new Error('No cycle available'); } }
    catch { setResetError('Record a period first to choose a cycle to reset.'); return; }
    const perform = async () => { setBusy(true); setResetError(''); try { await resetCycleData(from); onClose(); } catch (error) { setResetError(error instanceof Error ? error.message : 'Reset failed'); } finally { setBusy(false); } };
    const question = all ? 'Delete all cycle and journal history from this account?' : `Delete cycle and journal entries from ${from} onward?`;
    if (Platform.OS === 'web') { if (globalThis.confirm(question)) void perform(); }
    else Alert.alert('Delete cycle data?', question, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { void perform(); } }]);
  };
  if (panel === 'account' || panel === 'account-options' || panel === 'password' || panel === 'delete-account') return <AccountContent section={panel} onNavigate={onChange} />;
  if (panel === 'billing' || panel === 'subscription') return <BillingContent />;
  if (panel === 'insights') return <InsightsContent />;
  if (panel === 'journal') return <JournalContent />;
  if (panel === 'faith') return <BibleGuidance />;
  if (panel === 'themes') return <View>{themeOptions.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} onPress={() => { setName(option.id); onClose(); }} style={g.outlineButton}><Text style={g.label}>{option.label}</Text></Pressable>)}</View>;
  if (panel === 'privacy') return <View style={{ gap: 14 }}>
    <Text style={g.sectionHeading}>Your information</Text>
    <Text style={g.body}>Your cycle entries and journal belong to your account. You can clear your history in Cycle Settings or permanently delete your account in My Account.</Text>
    <Text style={g.body}>Your records sync with our private cloud database when you are online. Some information is also stored on this device for offline access.</Text>
    <Text style={g.body}>Subscriptions are processed by Google Play or Apple and managed through RevenueCat. Your cycle and journal entries are not sent to RevenueCat.</Text>
    <Text style={g.caption}>For privacy questions, contact support@crimsonrhythm.app.</Text>
  </View>;
  if (panel === 'support') {
    const categories = ['Feedback', 'Technical issue', 'Account issue', 'Billing', 'Other'];
    const send = async () => {
      if (!session || !supportMessage.trim() || busy) return;
      setBusy(true); setResetError('');
      try {
        const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
        if (!base) throw new Error('Support is unavailable right now.');
        const response = await fetch(`${base}/support/messages`, { method: 'POST', headers: { Authorization: `Bearer ${session.idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ category: supportCategory, message: supportMessage.trim() }) });
        if (!response.ok) throw new Error('Could not send your message. Please try again.');
        setSupportSent(true); setSupportMessage('');
      } catch (error) { setResetError(error instanceof Error ? error.message : 'Could not send message'); }
      finally { setBusy(false); }
    };
    return supportSent ? <View style={{ gap: 14, alignItems: 'center', paddingVertical: 32 }}>
      <Text style={[g.sectionHeading, { textAlign: 'center' }]}>Thank you ♡</Text>
      <Text style={[g.body, { textAlign: 'center' }]}>Your message has been sent. Our support team will review it.</Text>
      <ActionButton variant="primary" onPress={onClose}>Done</ActionButton>
    </View> : <View style={{ gap: 14 }}>
      <Text style={g.sectionHeading}>How can we help?</Text>
      <Text style={g.caption}>Choose a topic and tell us what&apos;s on your mind.</Text>
      <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.surface, overflow: 'hidden' }}>
        <Pressable accessibilityRole="combobox" accessibilityLabel="Support topic" accessibilityValue={{ text: supportCategory }} accessibilityState={{ expanded: topicsOpen }} onPress={() => setTopicsOpen(value => !value)} style={{ minHeight: 48, padding: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text style={g.body}>{supportCategory}</Text><Text style={g.body}>{topicsOpen ? '▴' : '▾'}</Text>
        </Pressable>
        {topicsOpen && <View accessibilityRole="list" style={{ borderTopWidth: 1, borderColor: theme.colors.border }}>
          {categories.map(category => <Pressable key={category} accessibilityRole="button" accessibilityState={{ selected: supportCategory === category }} onPress={() => { setSupportCategory(category); setTopicsOpen(false); }} style={{ minHeight: 44, padding: 12, backgroundColor: supportCategory === category ? theme.colors.roseWash : theme.colors.surface }}><Text style={g.body}>{category}</Text></Pressable>)}
        </View>}
      </View>
      <TextInput multiline accessibilityLabel="Support message" placeholder="Write your message…" placeholderTextColor={theme.colors.placeholder} maxLength={4000} value={supportMessage} onFocus={() => setTopicsOpen(false)} onChangeText={setSupportMessage} style={{ minHeight: 150, textAlignVertical: 'top', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.surface, color: theme.colors.text, padding: 14 }} />
      <Text style={g.caption}>Sent privately to support@crimsonrhythm.app</Text>
      <ActionButton variant="primary" disabled={busy || !session || !supportMessage.trim()} onPress={() => { void send(); }}>{busy ? 'Sending…' : 'Send message'}</ActionButton>
      {!!resetError && <Text accessibilityRole="alert" style={{ color: theme.colors.todayPeriod }}>{resetError}</Text>}
    </View>;
  }
  if (panel === 'settings') return <View style={{ gap: theme.spacing.md }}>
    <Text style={g.sectionHeading}>Your cycle</Text>
    <Text style={g.body}>Typical cycle: {insights.cycleLength} days · Period: {insights.periodLength} days</Text>
    <Text style={g.caption}>Your estimates improve as you track.</Text>
    <Text style={g.sectionHeading}>Start fresh</Text>
    <Text style={g.caption}>Choose which entries to clear. This can&apos;t be undone.</Text>
    {currentCycleStart && <View style={{ gap: 4 }}>
      <ActionButton disabled={busy} onPress={() => confirmReset(false, currentCycleStart)}>Reset current cycle</ActionButton>
      <Text style={g.caption}>Clear this cycle. Keep earlier history.</Text>
    </View>}
    <View style={{ gap: 4 }}>
      <ActionButton disabled={busy || !cycleStarts.length} onPress={() => setShowCycles(value => !value)}>Reset from a past cycle ▾</ActionButton>
      <Text style={g.caption}>Choose a cycle to clear it and everything after it.</Text>
    </View>
    {showCycles && <ScrollView nestedScrollEnabled style={{ maxHeight: 240 }}><View style={{ gap: 6 }}>
      {cycleStarts.slice(-18).reverse().map(start => <Pressable key={start} accessibilityRole="button" accessibilityLabel={`Select cycle starting ${start}`} onPress={() => { setSelectedCycle(start); setShowCycles(false); }} style={{ padding: 12, borderRadius: 10, backgroundColor: selectedCycle === start ? theme.colors.roseWash : theme.colors.surface }}>
        <Text style={g.body}>{parseDate(start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
      </Pressable>)}
    </View></ScrollView>}
    {selectedCycle && <ActionButton disabled={busy} variant="danger" onPress={() => confirmReset(false, selectedCycle)}>Clear from {parseDate(selectedCycle).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</ActionButton>}
    <View style={{ gap: 4 }}>
      <ActionButton variant="danger" disabled={busy} onPress={() => confirmReset(true)}>Clear all history</ActionButton>
      <Text style={g.caption}>Permanently remove all cycle and journal entries.</Text>
    </View>
    {!!resetError && <Text accessibilityRole="alert" style={{ color: theme.colors.todayPeriod }}>{resetError}</Text>}
  </View>;
  return null;
}
