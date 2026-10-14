import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { themeOptions, themes } from '@/constants/Theme';
import { useAppTheme } from './ThemeProvider';

export function ThemePicker() {
  const { theme, name, setName, styles: g } = useAppTheme();
  const anchor = useRef<View>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const { width, height } = useWindowDimensions();
  const menuWidth = Math.min(248, width - theme.spacing.lg * 2);
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => setPosition(null));
    return () => subscription.remove();
  }, []);
  const s = useMemo(() => StyleSheet.create({
    trigger: { flexDirection: 'row', gap: 6, paddingHorizontal: 10, borderColor: theme.colors.backgroundBorder },
    triggerText: { color: theme.colors.onBackground, fontFamily: theme.fonts.body, fontSize: 13 },
    menu: { position: 'absolute', width: menuWidth, padding: theme.spacing.sm, maxHeight: height * 0.6 },
    option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: theme.spacing.md, minHeight: 52, borderRadius: theme.radius.sm },
    selected: { backgroundColor: theme.colors.roseWash },
    label: { flex: 1, color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 15 },
    swatch: { width: 24, height: 24, borderRadius: theme.radius.pill, borderWidth: 2 },
  }), [theme, menuWidth, height]);
  const close = () => setPosition(null);
  return <>
    <View ref={anchor} collapsable={false}>
      <Pressable accessibilityRole="button" accessibilityLabel="Themes" aria-expanded={position !== null} accessibilityState={{ expanded: position !== null }} onPress={() => anchor.current?.measureInWindow((x, y, w, h) => setPosition({ top: Math.min(y + h + 8, height * 0.4), left: Math.max(12, Math.min(x + w - menuWidth, width - menuWidth - 12)) }))} style={[g.outlineButton, s.trigger]}>
        <SymbolView name={{ ios: 'paintpalette', android: 'palette', web: 'palette' }} tintColor={theme.colors.onBackground} size={20} />
        <Text style={s.triggerText}>Themes</Text>
      </Pressable>
    </View>
    <Modal visible={position !== null} transparent animationType="none" onRequestClose={close} onOrientationChange={close}>
      <View style={{ flex: 1 }} onAccessibilityEscape={close}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close themes" onPress={close} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={[g.card, s.menu, position]}>
          <ScrollView>{themeOptions.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{ selected: option.id === name }} onPress={() => { setName(option.id); close(); }} style={[s.option, option.id === name && s.selected]}>
            <View style={[s.swatch, { backgroundColor: themes[option.id].colors.background, borderColor: themes[option.id].colors.rose }]} />
            <Text style={s.label}>{option.label}</Text>
            {option.id === name && <Text style={{ color: theme.colors.rose }}>✓</Text>}
          </Pressable>)}</ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}
