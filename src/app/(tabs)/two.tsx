import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/components/ThemeProvider';
import { useCycleData } from '@/components/CycleDataProvider';
import { useToday } from '@/components/useToday';
import { DayEditor } from '@/components/DayEditor';
import { BibleGuidance } from '@/components/BibleGuidance';
import { DailyReflection } from '@/components/DailyReflection';
import { DailyVerseReference, VerseIconButton, VersePopup } from '@/components/DailyVerse';
import { FaithBackdrop } from '@/components/FaithBackdrop';
import { daysBetween, parseDate } from '@/utils/cycle';

export default function InsightsScreen() {
  const { theme, styles: g } = useAppTheme();
  const { data, ready } = useCycleData();
  const today = useToday();
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [verseOpen, setVerseOpen] = useState(false);
  const recent = Object.entries(data.journal).filter(([day]) => day <= today && daysBetween(day, today) < 30).sort(([a], [b]) => b.localeCompare(a));
  const counts = new Map<string, number>();
  for (const [, entry] of recent) {
    const mood = entry.mood.trim().toLowerCase();
    if (mood) counts.set(mood, (counts.get(mood) ?? 0) + 1);
  }
  const common = [...counts].sort((a, b) => b[1] - a[1])[0];
  return <SafeAreaView style={g.screen} edges={['top']}>
    <FaithBackdrop />
    <ScrollView contentContainerStyle={[g.content, { gap: theme.spacing.md }]} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}><Text numberOfLines={1} adjustsFontSizeToFit style={[g.heading, { color: theme.colors.onBackground, fontSize: 34 }]}>Faith & feelings</Text><DailyVerseReference day={today} onRead={() => setVerseOpen(true)} /></View>
        <VerseIconButton onPress={() => setVerseOpen(true)} />
      </View>
      <Text style={[g.body, { color: theme.colors.mutedOnBackground }]}>A place to notice your heart, seek wisdom, and take a small step with Jesus.</Text>
      {!ready ? <Text style={[g.body, { color: theme.colors.onBackground }]}>Loading your reflections…</Text> : <>
        <View style={[g.card, { gap: theme.spacing.sm }]}>
          <Text style={[g.heading, { fontSize: 30 }]}>How are you feeling today?</Text>
          <Text style={g.body}>{data.journal[today]?.mood ? `You logged: ${data.journal[today].mood}` : 'There is room to be honest here.'}</Text>
          <Pressable accessibilityRole="button" onPress={() => setEditingDay(today)} style={g.button}><Text style={g.buttonText}>{data.journal[today] ? 'Edit today’s feelings' : 'Log today’s feelings'}</Text></Pressable>
        </View>
        <View style={[g.card, { gap: theme.spacing.sm }]}>
          <Text style={[g.heading, { fontSize: 30 }]}>Patterns to notice</Text>
          <Text style={g.body}>{recent.length >= 3 && common ? `You wrote “${common[0]}” on ${common[1]} of your ${recent.length} check-in days in the last 30 days. What tended to happen before that feeling?` : 'A few check-ins can help you notice repeated feelings and what brings them up. Start by naming how you feel today.'}</Text>
          {recent.slice(0, 5).map(([day, entry]) => <Pressable key={day} accessibilityRole="button" accessibilityLabel={`Edit check-in for ${day}`} onPress={() => setEditingDay(day)} style={[g.outlineButton, { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }]}>
            <Text style={{ color: theme.colors.text }}>{parseDate(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text><Text numberOfLines={1} style={{ color: theme.colors.muted, flex: 1, textAlign: 'right' }}>{entry.mood || 'Check-in saved'}</Text>
          </Pressable>)}
        </View>
        <BibleGuidance />
        <DailyReflection key={today} day={today} />
      </>}
    </ScrollView>
    {editingDay && <DayEditor key={editingDay} day={editingDay} onClose={() => setEditingDay(null)} />}
    {verseOpen && <VersePopup day={today} onClose={() => setVerseOpen(false)} />}
  </SafeAreaView>;
}
