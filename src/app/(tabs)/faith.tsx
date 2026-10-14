import { Text, View } from 'react-native';
import { QuietPage } from '@/components/QuietPage';
import { BibleGuidance } from '@/components/BibleGuidance';
import { useAppTheme } from '@/components/ThemeProvider';
import { dailyVerse } from '@/utils/faith';
import { useToday } from '@/components/useToday';
export default function FaithScreen() {
  const { styles: g } = useAppTheme(); const verse = dailyVerse(useToday());
  return <QuietPage title="Faith & guidance"><View style={g.card}><Text style={g.heading}>Today’s verse</Text><Text style={g.body}>{verse.text}</Text><Text style={g.body}>{verse.reference} · KJV</Text></View><BibleGuidance /></QuietPage>;
}
