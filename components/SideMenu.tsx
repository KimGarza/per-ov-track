import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurTargetView, BlurView } from 'expo-blur';
import { EditSheet } from './EditSheet';
import { PrimaryPanels, panelTitles, type PrimaryPanel } from './PrimaryPanels';
import { useAppTheme } from './ThemeProvider';

const MenuContext = createContext<{ openMenu: () => void; openPanel: (panel: PrimaryPanel) => void }>({ openMenu: () => {}, openPanel: () => {} });
export const usePrimaryPanel = () => useContext(MenuContext).openPanel;
export function MenuButton() {
  const { openMenu: open } = useContext(MenuContext);
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={open} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24, color: theme.colors.onBackground }}>☰</Text></Pressable>;
}
export function SideMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [slide] = useState(() => new Animated.Value(-320));
  useEffect(() => { if (open) { slide.setValue(-320); Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start(); } }, [open, slide]);
  const { theme, styles: g } = useAppTheme();
  const [panel, setPanel] = useState<PrimaryPanel | null>(null);
  const targetRef = useRef<View | null>(null);
  const openPanel = useCallback((value: PrimaryPanel) => { setOpen(false); setPanel(value); }, []);
  const items = [{ label: 'Themes', icon: '✿', id: 'themes' }, { label: 'Settings', icon: '⚙', id: 'settings' }, { label: 'Billing', icon: '▤', id: 'billing' }, { label: 'Subscription', icon: '♡', id: 'subscription' }] as const;
  return <MenuContext.Provider value={{ openMenu: () => setOpen(true), openPanel }}>
    <View style={{ flex: 1 }}>
      <BlurTargetView ref={targetRef} style={{ flex: 1 }} accessibilityElementsHidden={open || !!panel} importantForAccessibility={open || panel ? 'no-hide-descendants' : 'auto'}>{children}</BlurTargetView>
      {(open || panel) && <BlurView pointerEvents="none" blurTarget={targetRef} blurMethod="dimezisBlurView" tint={theme.statusBar === 'light' ? 'dark' : 'light'} intensity={35} style={StyleSheet.absoluteFill} />}
    </View>
    <Modal visible={open || !!panel} transparent animationType="fade" onRequestClose={() => { setOpen(false); setPanel(null); }}>
      {panel ? <EditSheet embedded primary title={panelTitles[panel]} onClose={() => setPanel(null)}><PrimaryPanels panel={panel} onClose={() => setPanel(null)} onChange={setPanel} /></EditSheet> : (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" onPress={() => setOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.colors.overlay }} />
        <Animated.View style={{ width: '82%', maxWidth: 320, transform: [{ translateX: slide }] }}><SafeAreaView style={{ flex: 1, width: '100%', backgroundColor: theme.colors.surface, borderRightWidth: 1, borderColor: theme.colors.border }}>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={[g.heading, { fontSize: 30 }]}>✝ Crimson Rhythm</Text><Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={g.outlineButton}><Text style={{ color: theme.colors.text }}>×</Text></Pressable></View>
            <Text style={[g.body, { fontStyle: 'italic' }]}>Grace for every season.</Text>
            {items.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => openPanel(item.id)} style={[g.outlineButton, { alignItems: 'flex-start', paddingHorizontal: 16 }]}><Text style={{ color: theme.colors.text, fontSize: 16 }}>{item.icon}   {item.label}</Text></Pressable>)}
          </ScrollView>
        </SafeAreaView></Animated.View>
      </View>)}
    </Modal>
  </MenuContext.Provider>;
}
