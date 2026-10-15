import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dailyVerse, holidayFor, type Verse } from '@/utils/faith';
import { useClientOnlyValue } from './useClientOnlyValue';
import { useAppTheme } from './ThemeProvider';

export function DailyVerseReference({ day, onRead }: { day: string; onRead: () => void }) {
  const { theme } = useAppTheme();
  const clientDay = useClientOnlyValue<string | null, string>(null, day);
  const reference = clientDay ? dailyVerse(clientDay).reference : null;
  return <Pressable accessibilityRole="button" accessibilityLabel={reference ? `Read today's verse, ${reference}` : "Read today's verse"} onPress={onRead}>
    <Text numberOfLines={1} style={{ color: theme.colors.onBackground, fontFamily: theme.fonts.body, fontSize: 11, lineHeight: 15 }}>{reference ?? ' '}</Text>
  </Pressable>;
}
export function VerseIconButton({ onPress }: { onPress: () => void }) {
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Enlarge daily verse" onPress={onPress} style={{ width: theme.layout.touchTarget, height: theme.layout.touchTarget, alignItems: 'center', justifyContent: 'center' }}>
    {Platform.OS === 'ios' ? <Text accessible={false} style={{ fontSize: 26 }}>🙏</Text> : <SymbolView name={{ android: 'folded_hands', web: 'folded_hands' }} tintColor={theme.colors.onBackground} size={26} />}
  </Pressable>;
}
export function VersePopup({ day, onClose }: { day: string; onClose: () => void }) {
  return <VerseModal verse={dailyVerse(day)} title={holidayFor(day)?.name ?? 'A moment with Scripture'} onClose={onClose} />;
}
export function VerseModal({ verse, title, onClose }: { verse: Verse; title: string; onClose: () => void }) {
  const { theme, styles: g } = useAppTheme();
  const [scale] = useState(() => new Animated.Value(0.86));
  const [opacity] = useState(() => new Animated.Value(0));
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (cancelled) return;
      setReducedMotion(reduce);
      if (reduce) { scale.setValue(1); opacity.setValue(1); }
      else Animated.parallel([
        Animated.spring(scale, { toValue: 1, damping: 16, stiffness: 170, mass: 0.8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }).catch(() => { if (!cancelled) { scale.setValue(1); opacity.setValue(1); } });
    return () => { cancelled = true; scale.stopAnimation(); opacity.stopAnimation(); };
  }, [scale, opacity]);
  return <Modal visible transparent animationType="none" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', padding: theme.spacing.md }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close verse" onPress={onClose} style={StyleSheet.absoluteFill} />
      <Animated.View accessibilityViewIsModal onAccessibilityEscape={onClose} style={[g.card, { maxHeight: '90%', width: '100%', maxWidth: 620, alignSelf: 'center', opacity, transform: [{ scale: reducedMotion ? 1 : scale }] }]}>
        <ScrollView contentContainerStyle={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}><Text style={[g.heading, { fontSize: 24, flex: 1 }]}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close verse" onPress={onClose} style={g.outlineButton}><Text style={{ color: theme.colors.text }}>×</Text></Pressable></View>
          {theme.decoration === 'celestial' && <View style={{ backgroundColor: theme.colors.background, borderRadius: theme.radius.sm, alignItems: 'center' }}><Image source={require('../assets/faith/moon-moth.png')} resizeMode="contain" style={{ width: '100%', height: 130 }} /></View>}
          <Text accessibilityRole="header" style={[g.heading, { fontSize: 34 }]}>{verse.reference}</Text>
          <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text, fontSize: 28, lineHeight: 36 }}>{verse.text}</Text>
          <Text style={g.body}>King James Version</Text>
          <Text style={g.body}>Read slowly. What does this invite you to notice, bring to Jesus, or practise today?</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={g.button}><Text style={g.buttonText}>Carry this with me</Text></Pressable>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  </Modal>;
}
