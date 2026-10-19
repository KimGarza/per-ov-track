import { Pressable, View } from 'react-native';
import { Text } from '@/components/Themed';
import { themeOptions } from '@/constants/Theme';
import { useAppTheme } from './ThemeProvider';
import { BibleGuidance } from './BibleGuidance';
import { InsightsContent } from './InsightsContent';
import { JournalContent } from './JournalContent';

export type PrimaryPanel = 'themes' | 'settings' | 'billing' | 'subscription' | 'insights' | 'faith' | 'journal';
export const panelTitles: Record<PrimaryPanel, string> = { themes: 'Themes', settings: 'Settings', billing: 'Billing', subscription: 'Subscription', insights: 'Insights', faith: 'Faith & guidance', journal: 'Journal & goals' };
export function PrimaryPanels({ panel, onClose, onChange }: { panel: PrimaryPanel; onClose: () => void; onChange: (panel: PrimaryPanel) => void }) {
  const { theme, styles: g, setName, todayMarker, setTodayMarker } = useAppTheme();
  if (panel === 'insights') return <InsightsContent />;
  if (panel === 'journal') return <JournalContent />;
  if (panel === 'faith') return <BibleGuidance />;
  if (panel === 'themes') return <View>{themeOptions.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} onPress={() => { setName(option.id); onClose(); }} style={g.outlineButton}><Text style={g.label}>{option.label}</Text></Pressable>)}</View>;
  if (panel === 'settings') return <View style={g.stack}><Text style={g.body}>Your simple space for everyday rhythms.</Text><View style={g.card}><Text style={g.sectionHeading}>Appearance</Text><Text style={g.body}>Choose the colors that feel like you.</Text><Pressable accessibilityRole="button" onPress={() => onChange('themes')} style={g.outlineButton}><Text style={g.label}>Change theme</Text></Pressable></View><View style={g.card}><Text style={g.sectionHeading}>Today’s little marker</Text><View style={g.row}>{(['circle', 'heart'] as const).map(shape => <Pressable key={shape} accessibilityRole="button" accessibilityLabel={`Today marker: ${shape}`} accessibilityState={{ selected: todayMarker === shape }} onPress={() => setTodayMarker(shape)} style={[g.outlineButton, { flex: 1, backgroundColor: todayMarker === shape ? theme.colors.roseWash : theme.colors.surface }]}><Text style={g.label}>{shape === 'circle' ? '● Circle' : '♥ Heart'}</Text></Pressable>)}</View></View><View style={g.card}><Text style={g.sectionHeading}>Calendar estimates</Text><Text style={g.body}>Soft beige circles show estimated follicular and luteal phases. They use your confirmed period starts, with a 28-day default until more dates are logged. Ovulation timing is estimated, not confirmed. Logged drops and flowers always take priority.</Text></View><View style={g.card}><Text style={g.sectionHeading}>Your saved data</Text><Text style={g.body}>Check-ins and cycle dates are saved on this device. Clearing app or browser storage removes them.</Text></View></View>;
  return <View style={{ gap: theme.spacing.md }}><View style={[g.card, { backgroundColor: theme.colors.roseWash }]}><Text style={[g.heading, { fontSize: 28 }]}>{panel === 'billing' ? 'Billing, kept simple' : 'Your Crimson Rhythm subscription'}</Text><Text style={g.body}>{panel === 'billing' ? 'Billing is not connected yet. Payment details and receipts will appear here once billing is available.' : 'Subscriptions are not available yet. Plan details and subscription management will appear here when they are ready.'}</Text></View><Text style={g.body}>There is nothing to purchase or manage here yet.</Text></View>;
}
