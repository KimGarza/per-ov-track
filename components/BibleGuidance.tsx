import { useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '@/components/Themed';
import { guidanceTopics, parseGuidanceResponse, topicCards, type GuidanceCard } from '@/utils/faith';
import { useAppTheme } from './ThemeProvider';
import { EditSheet } from './EditSheet';

export function BibleGuidance() {
  const { theme, styles: g } = useAppTheme();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<{ title: string; cards: GuidanceCard[]; ai: boolean } | null>(null);
  const requestId = useRef(0);
  const ask = async () => {
    if (!question.trim() || busy) return;
    const endpoint = process.env.EXPO_PUBLIC_GUIDANCE_API_URL;
    if (!endpoint) { setError('Personal guidance is not available yet. Choose a reflection topic below for five Bible readings.'); return; }
    const id = ++requestId.current;
    setBusy(true); setError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: question.trim() }), signal: controller.signal });
      if (!response.ok) throw new Error('Guidance unavailable');
      const cards = parseGuidanceResponse(await response.json());
      if (id === requestId.current) setReading({ title: 'Your Bible guidance', cards, ai: true });
    } catch { setError('We could not get personal guidance right now. Your question is still here. You can try again or choose a topic below.'); }
    finally { clearTimeout(timer); if (id === requestId.current) setBusy(false); }
  };
  return <>
    <View style={[g.card, { gap: theme.spacing.md }]}>
      <Text style={[g.heading, { fontSize: 30 }]}>Bring it to Scripture</Text>
      <Text style={g.body}>Money, possessions, relationships, or whatever is weighing on your heart.</Text>
      <TextInput accessibilityLabel="What do you need guidance on?" value={question} onChangeText={setQuestion} editable={!busy} maxLength={2000} multiline placeholder="What do you need guidance on?" placeholderTextColor={theme.colors.muted} style={[g.input, { minHeight: 90 }]} />
      <Text style={[g.body, { fontSize: 12, lineHeight: 18 }]}>When you ask for AI guidance, only this question is sent. Your cycle and journal entries stay on your device.</Text>
      <Pressable accessibilityRole="button" disabled={!question.trim() || busy} onPress={() => { void ask(); }} style={[g.button, (!question.trim() || busy) && g.disabled]}><Text style={g.buttonText}>{busy ? 'Finding reflections…' : 'Ask for Bible guidance'}</Text></Pressable>
      {error && <Text accessibilityRole="alert" style={g.body}>{error}</Text>}
      <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Or choose a reflection topic</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>{guidanceTopics.map(topic => <Pressable key={topic.id} accessibilityRole="button" disabled={busy} onPress={() => setReading({ title: topic.label, cards: topicCards(topic.id), ai: false })} style={[g.outlineButton, { backgroundColor: theme.colors.roseWash }]}><Text style={{ color: theme.colors.text, fontSize: 14 }}>{topic.label}</Text></Pressable>)}</View>
    </View>
    {reading && <GuidanceReader key={reading.title} reading={reading} onClose={() => setReading(null)} />}
  </>;
}
function GuidanceReader({ reading, onClose }: { reading: { title: string; cards: GuidanceCard[]; ai: boolean }; onClose: () => void }) {
  const { theme, styles: g } = useAppTheme();
  const scroll = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  return <EditSheet title={reading.title} onClose={onClose} footer={<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Previous verse" disabled={!page} onPress={() => { const next = page - 1; scroll.current?.scrollTo({ x: next * width, animated: true }); setPage(next); }} style={[g.outlineButton, { flex: 1 }, !page && g.disabled]}><Text style={{ color: theme.colors.text }}>‹ Previous</Text></Pressable>
    <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.text }}>{page + 1} / 5</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Next verse" disabled={page === 4} onPress={() => { const next = page + 1; scroll.current?.scrollTo({ x: next * width, animated: true }); setPage(next); }} style={[g.outlineButton, { flex: 1 }, page === 4 && g.disabled]}><Text style={{ color: theme.colors.text }}>Next ›</Text></Pressable>
  </View>}>
    <Text style={[g.body, { fontSize: 12, marginBottom: theme.spacing.sm }]}>{reading.ai ? 'AI-assisted reflection · Scripture quoted from KJV' : 'Prepared Bible reflections · KJV'} · Swipe to read</Text>
    <View onLayout={({ nativeEvent: { layout } }) => { if (layout.width !== width) { setWidth(layout.width); scroll.current?.scrollTo({ x: page * layout.width, animated: false }); } }}>
      <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={({ nativeEvent }) => { if (width) setPage(Math.max(0, Math.min(4, Math.round(nativeEvent.contentOffset.x / width)))); }}>
        {reading.cards.map(card => <View key={card.verse.id} style={{ width: width || 280, gap: theme.spacing.md, paddingHorizontal: theme.spacing.xs }}>
          <Text accessibilityRole="header" style={[g.heading, { fontSize: 30 }]}>{card.verse.reference}</Text>
          <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text, fontSize: 25, lineHeight: 32 }}>{card.verse.text}</Text>
          <Text style={g.body}>{card.explanation}</Text>
          <View style={[g.card, { padding: theme.spacing.md, backgroundColor: theme.colors.roseWash }]}><Text style={{ color: theme.colors.text, fontWeight: '600', marginBottom: theme.spacing.xs }}>A small step</Text><Text style={g.body}>{card.goal}</Text></View>
        </View>)}
      </ScrollView>
    </View>
  </EditSheet>;
}
