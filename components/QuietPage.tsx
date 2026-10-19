import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from './ThemeProvider';
import { MenuButton } from './SideMenu';
import { FaithBackdrop } from './FaithBackdrop';
import { VerseIconButton, VersePopup } from './DailyVerse';
import { useToday } from './useToday';
export function QuietPage({ title, children }: { title: string; children: ReactNode }) {
  const { theme, styles: g } = useAppTheme();
  const today = useToday(); const [verseOpen, setVerseOpen] = useState(false);
  return <SafeAreaView style={g.screen} edges={['top', 'bottom']}><FaithBackdrop /><ScrollView contentContainerStyle={[g.content, { gap: theme.spacing.md }]}><View style={{ flexDirection: 'row', alignItems: 'center' }}><MenuButton /><Text style={[g.heading, { flex: 1, fontSize: 30, color: theme.colors.onBackground }]}>{title}</Text><VerseIconButton onPress={() => setVerseOpen(true)} /></View>{children}</ScrollView>{verseOpen && <VersePopup day={today} onClose={() => setVerseOpen(false)} />}</SafeAreaView>;
}
