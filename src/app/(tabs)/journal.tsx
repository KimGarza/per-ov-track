import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { QuietPage } from '@/components/QuietPage';
import { DailyReflection } from '@/components/DailyReflection';
import { DayEditor } from '@/components/DayEditor';
import { useCycleData } from '@/components/CycleDataProvider';
import { useAppTheme } from '@/components/ThemeProvider';
import { useToday } from '@/components/useToday';
export default function JournalScreen() {
  const { styles: g } = useAppTheme(); const { data, ready } = useCycleData(); const today = useToday(); const [day, setDay] = useState<string | null>(null);
  return <QuietPage title="Journal & goals"><Pressable accessibilityRole="button" onPress={() => setDay(today)} style={g.button}><Text style={g.buttonText}>Write today’s check-in</Text></Pressable>{ready && <DailyReflection day={today} key={today} />}<View style={g.card}><Text style={g.heading}>Your reflections</Text>{Object.entries(data.journal).sort(([a], [b]) => b.localeCompare(a)).map(([date, entry]) => <Pressable key={date} accessibilityRole="button" onPress={() => setDay(date)} style={[g.outlineButton, { marginTop: 8 }]}><Text style={g.body}>{date} · {entry.mood || 'Daily check-in'}</Text></Pressable>)}{!Object.keys(data.journal).length && <Text style={g.body}>Your saved check-ins will appear here.</Text>}</View>{day && <DayEditor day={day} key={day} onClose={() => setDay(null)} />}</QuietPage>;
}
