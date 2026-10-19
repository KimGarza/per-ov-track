import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Themed';
import { designTokens } from '@/constants/Theme';
import { JournalTools, defaultDiaryStyle } from './JournalTools';
import { addDays, parseDate } from '@/utils/cycle';
import { EditSheet } from './EditSheet';
import { useAppTheme } from './ThemeProvider';
import { useCycleData } from './CycleDataProvider';
import { useCalendarOverlay } from './SideMenu';
import { useToday } from './useToday';

export function JournalIconButton({ onPress }: { onPress: () => void }) {
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Open diary" onPress={onPress} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
    <View accessible={false} style={{ width: 24, height: 28, borderRadius: 5, borderWidth: 2, borderColor: theme.colors.onBackground, backgroundColor: theme.colors.roseSoft, padding: 4, borderLeftWidth: 5 }}>
      {[0, 1, 2].map(line => <View key={line} style={{ height: 1, backgroundColor: theme.colors.onBackground, marginTop: 3 }} />)}
      <View style={{ position: 'absolute', right: 3, top: -2, width: 4, height: 10, backgroundColor: theme.colors.rose }} />
    </View>
  </Pressable>;
}
export function JournalBook({ onClose }: { onClose: () => void }) {
  const { theme, styles: g } = useAppTheme();
  const { data, saveDiary, ready } = useCycleData();
  const today = useToday();
  const setOverlay = useCalendarOverlay();
  useEffect(() => { setOverlay(true); return () => setOverlay(false); }, [setOverlay]);
  const [day, setDay] = useState(today);
  const [format, setFormat] = useState(data.diaryStyles?.[today] ?? defaultDiaryStyle);
  const [entry, setEntry] = useState(data.diary?.[today] ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [turn] = useState(() => new Animated.Value(0));
  const [reduce, setReduce] = useState(true);
  const wide = useWindowDimensions().width >= 600;
  useEffect(() => { void AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {}); return () => turn.stopAnimation(); }, [turn]);
  const persist = async () => { if (!ready) throw new Error('Wait for your diary to load.'); await saveDiary(day, entry, format); };
  const save = async (close = false) => {
    setBusy(true); setError('');
    try { await persist(); setSaved(true); if (close) onClose(); }
    catch { setError('Your entry could not be saved. Please try again.'); }
    finally { setBusy(false); }
  };
  const flip = async (direction: number) => {
    setBusy(true); setError('');
    try {
      await persist();
      const next = addDays(day, direction);
      if (!reduce) await new Promise<void>(resolve => Animated.timing(turn, { toValue: direction > 0 ? -75 : 75, duration: 150, useNativeDriver: true }).start(() => resolve()));
      setDay(next); setEntry(data.diary?.[next] ?? ''); setFormat(data.diaryStyles?.[next] ?? defaultDiaryStyle); setSaved(false);
      turn.setValue(reduce ? 0 : direction > 0 ? 75 : -75);
      if (!reduce) await new Promise<void>(resolve => Animated.timing(turn, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => resolve()));
    } catch { setError('Your page could not be saved. Stay here and try again.'); }
    finally { setBusy(false); }
  };
  const c = theme.colors;
  const writingFont = format.font === 'theme' ? theme.fonts.journal : format.font === 'system' ? designTokens.fonts.body : format.font;
  const ink = format.ink === 'rose' ? c.todayPeriod : format.ink === 'olive' ? c.todayFertile : c.text;
  const highlight = format.highlight === 'rose' ? c.roseWash : format.highlight === 'sage' ? c.calendarFertile : c.calendarSurface;
  return <EditSheet primary title="My little journal" busy={busy} onClose={() => { void save(true); }} footer={<View style={{ gap: theme.spacing.sm }}>{error && <Text accessibilityRole="alert" style={{ color: c.todayPeriod }}>{error}</Text>}<Pressable accessibilityRole="button" disabled={busy || !ready} onPress={() => { void save(); }} style={[g.button, (busy || !ready) && g.disabled]}><Text style={g.buttonText}>{busy ? 'Saving your page…' : saved ? '✓ Page saved' : 'Save journal page'}</Text></Pressable></View>}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous journal page" disabled={busy} onPress={() => { void flip(-1); }} style={g.outlineButton}><Text style={{ color: c.text }}>‹</Text></Pressable>
      <Text style={[g.heading, { flex: 1, textAlign: 'center', fontSize: 23 }]}>{parseDate(day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Next journal page" disabled={busy} onPress={() => { void flip(1); }} style={g.outlineButton}><Text style={{ color: c.text }}>›</Text></Pressable>
    </View>
    <JournalTools value={format} disabled={busy || !ready} onChange={value => { setFormat(value); setSaved(false); }} />
    <Animated.View style={{ flexDirection: 'row', minHeight: 390, borderRadius: 16, borderWidth: 4, borderColor: c.roseSoft, backgroundColor: c.calendarSurface, overflow: 'hidden', transform: [{ perspective: 1000 }, { rotateY: turn.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] }) }] }}>
      <View style={{ width: wide ? '35%' : '26%', backgroundColor: c.surface, padding: wide ? 16 : 0, borderRightWidth: 4, borderColor: c.border, justifyContent: 'center' }}>{wide && <><Text style={[g.heading, { fontSize: 27 }]}>A little room for your heart.</Text><Text style={g.body}>One day. One page. Grace for it all.</Text></>}{!wide && <View style={{ alignItems: 'center', padding: 5, gap: 12 }}><Text style={{ color: c.rose, fontSize: 27 }}>♡</Text><Text style={{ fontFamily: theme.fonts.journal, color: c.text, textAlign: 'center', fontSize: 16, lineHeight: 22 }}>Grace for today.</Text>{[0, 1, 2].map(line => <View key={line} style={{ height: 1, width: '80%', backgroundColor: c.border, marginTop: theme.spacing.sm }} />)}</View>}</View>
      <View style={{ flex: 1, padding: 14, minHeight: 390, backgroundColor: highlight }}>
        <View pointerEvents="none" accessible={false} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {Array.from({ length: 15 }, (_, line) => <View key={line} style={{ position: 'absolute', top: 58 + line * 26, left: 12, right: 12, height: 1, backgroundColor: c.border }} />)}
          {[0, 1, 2].map(ray => <View key={ray} style={{ position: 'absolute', top: -100, left: 18 + ray * 66, width: 36, height: 650, backgroundColor: c.white, opacity: 0.28, transform: [{ rotate: '28deg' }] }} />)}
        </View>
        <Text style={{ fontFamily: theme.fonts.journal, color: c.text, fontSize: 21, marginBottom: 12 }}>Dear diary,</Text>
        <TextInput accessibilityLabel="Diary entry" editable={!busy && ready} multiline value={entry} onChangeText={value => { setEntry(value); setSaved(false); }} maxLength={20000} placeholder="What is on your heart today?" placeholderTextColor={c.placeholder} style={{ fontFamily: writingFont, color: ink, fontSize: 18, lineHeight: 26, minHeight: 330, textAlignVertical: 'top', padding: 0, backgroundColor: 'transparent' }} />
      </View>
    </Animated.View>
    <Text style={[g.body, { fontSize: 12, marginTop: theme.spacing.sm }]}>Pages save before you turn or close them.</Text>
  </EditSheet>;
}
