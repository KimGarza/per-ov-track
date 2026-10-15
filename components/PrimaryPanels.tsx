import { FontPicker } from './FontPicker';
import { Pressable, Text, View } from 'react-native';
import { themeOptions, themes } from '@/constants/Theme';
import { useAppTheme } from './ThemeProvider';
import { BibleGuidance } from './BibleGuidance';
import { InsightsContent } from './InsightsContent';
import { JournalContent } from './JournalContent';

export type PrimaryPanel = 'themes' | 'settings' | 'billing' | 'subscription' | 'insights' | 'faith' | 'journal';
export const panelTitles: Record<PrimaryPanel, string> = { themes: 'Themes', settings: 'Settings', billing: 'Billing', subscription: 'Subscription', insights: 'Insights', faith: 'Faith & guidance', journal: 'Journal & goals' };
export function PrimaryPanels({ panel, onClose, onChange }: { panel: PrimaryPanel; onClose: () => void; onChange: (panel: PrimaryPanel) => void }) {
  const { theme, styles: g, name, setName } = useAppTheme();
  if (panel === 'insights') return <InsightsContent />;
  if (panel === 'journal') return <JournalContent />;
  if (panel === 'faith') return <BibleGuidance />;
  if (panel === 'themes') return <View style={{ gap: theme.spacing.md }}><Text style={g.body}>A little change of atmosphere.</Text>{themeOptions.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{ selected: name === option.id }} onPress={() => { setName(option.id); onClose(); }} style={[g.outlineButton, { flexDirection: 'row', justifyContent: 'flex-start', gap: theme.spacing.md, padding: theme.spacing.md, backgroundColor: name === option.id ? theme.colors.roseWash : theme.colors.surface }]}><View accessible={false} style={{ width: 38, height: 38, borderRadius: theme.radius.sm, borderWidth: 2, backgroundColor: themes[option.id].colors.background, borderColor: themes[option.id].colors.rose }} /><Text style={{ flex: 1, color: theme.colors.text }}>{option.label}</Text>{name === option.id && <Text style={{ color: theme.colors.text }}>✓</Text>}</Pressable>)}<FontPicker /></View>;
  if (panel === 'settings') return <View style={{ gap: theme.spacing.lg }}><Text style={g.body}>Your simple space for everyday rhythms.</Text><View style={g.card}><Text style={[g.heading, { fontSize: 25 }]}>Appearance</Text><Text style={g.body}>Choose the colors that feel like you.</Text><Pressable accessibilityRole="button" onPress={() => onChange('themes')} style={g.outlineButton}><Text style={{ color: theme.colors.text }}>Change theme</Text></Pressable></View><View style={g.card}><Text style={[g.heading, { fontSize: 25 }]}>Your saved data</Text><Text style={g.body}>Check-ins and cycle dates are saved on this device. Clearing app or browser storage removes them.</Text></View></View>;
  return <View style={{ gap: theme.spacing.md }}><View style={[g.card, { backgroundColor: theme.colors.roseWash }]}><Text style={[g.heading, { fontSize: 28 }]}>{panel === 'billing' ? 'Billing, kept simple' : 'Your Crimson Rhythm subscription'}</Text><Text style={g.body}>{panel === 'billing' ? 'Billing is not connected yet. Payment details and receipts will appear here once billing is available.' : 'Subscriptions are not available yet. Plan details and subscription management will appear here when they are ready.'}</Text></View><Text style={g.body}>There is nothing to purchase or manage here yet.</Text></View>;
}
