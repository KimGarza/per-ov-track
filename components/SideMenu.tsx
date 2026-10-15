import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OptionPopover, type AnchorRect } from './OptionPopover';
import { themeOptions } from '@/constants/Theme';
import { EditSheet } from './EditSheet';
import { PrimaryPanels, panelTitles, type PrimaryPanel } from './PrimaryPanels';
import { useAppTheme } from './ThemeProvider';

const MenuContext = createContext<{ openMenu: () => void; openPanel: (panel: PrimaryPanel) => void; setExternalOverlay: (active: boolean) => void }>({ openMenu: () => {}, openPanel: () => {}, setExternalOverlay: () => {} });
export const useCalendarOverlay = () => useContext(MenuContext).setExternalOverlay;
export const usePrimaryPanel = () => useContext(MenuContext).openPanel;
export function MenuButton() {
  const { openMenu: open } = useContext(MenuContext);
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={open} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24, color: theme.colors.onBackground }}>☰</Text></Pressable>;
}
export function SideMenuProvider({ children }: { children: ReactNode }) {
  const [externalOverlay, setExternalOverlay] = useState(false);
  const [open, setOpen] = useState(false);
  const [slide] = useState(() => new Animated.Value(-320));
  useEffect(() => { if (open) { slide.setValue(-320); Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start(); } }, [open, slide]);
  const { theme, styles: g, setName, name } = useAppTheme();
  const [themeAnchor, setThemeAnchor] = useState<AnchorRect | null>(null);
  const [panel, setPanel] = useState<PrimaryPanel | null>(null);
  const openPanel = useCallback((value: PrimaryPanel) => { setOpen(false); setPanel(value); }, []);
  const items = [{ label: 'Themes', icon: '✿', id: 'themes' }, { label: 'Settings', icon: '⚙', id: 'settings' }, { label: 'Billing', icon: '▤', id: 'billing' }, { label: 'Subscription', icon: '♡', id: 'subscription' }] as const;
  const inactive = open || !!panel || externalOverlay;
  const nativeBlur = Platform.OS === 'android' && Number(Platform.Version) >= 31;
  return <MenuContext.Provider value={{ openMenu: () => setOpen(true), openPanel, setExternalOverlay }}>
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, filter: inactive ? (Platform.OS === 'web' ? 'blur(6px)' : nativeBlur ? [{ blur: 6 }] : undefined) : undefined, opacity: inactive && Platform.OS !== 'web' && !nativeBlur ? 0.45 : 1 }} accessibilityElementsHidden={inactive} importantForAccessibility={inactive ? 'no-hide-descendants' : 'auto'}>{children}</View>
    </View>
    <Modal visible={open || !!panel} transparent animationType="fade" onRequestClose={() => { if (themeAnchor) setThemeAnchor(null); else { setOpen(false); setPanel(null); } }}>
      <View style={{ flex: 1 }}>
      {panel === 'themes' ? <OptionPopover embedded anchor={{ x: 16, y: 60, width: 0, height: 0 }} onClose={() => setPanel(null)}>{themeOptions.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} onPress={() => { setName(option.id); setPanel(null); }} style={g.outlineButton}><Text style={{ color: theme.colors.text }}>{option.label}</Text></Pressable>)}</OptionPopover> : panel ? <EditSheet embedded primary title={panelTitles[panel]} onClose={() => setPanel(null)}><PrimaryPanels panel={panel} onClose={() => setPanel(null)} onChange={setPanel} /></EditSheet> : (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" onPress={() => setOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.colors.overlay }} />
        <Animated.View style={{ width: '82%', maxWidth: 320, transform: [{ translateX: slide }] }}><SafeAreaView style={{ flex: 1, width: '100%', backgroundColor: theme.colors.surface, borderRightWidth: 1, borderColor: theme.colors.border }}>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={[g.heading, { fontSize: 30 }]}>✝ Crimson Rhythm</Text><Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={g.outlineButton}><Text style={{ color: theme.colors.text }}>×</Text></Pressable></View>
            <Text style={[g.body, { fontStyle: 'italic' }]}>Grace for every season.</Text>
            {items.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label} onPress={event => { if (item.id === 'themes') event.currentTarget.measureInWindow((x, y, width, height) => setThemeAnchor({ x, y, width, height })); else openPanel(item.id); }} style={[g.outlineButton, { alignItems: 'flex-start', paddingHorizontal: 16 }]}><Text style={{ color: theme.colors.text, fontSize: 16 }}>{item.icon}   {item.label}</Text></Pressable>)}
          </ScrollView>
        </SafeAreaView></Animated.View>
      </View>)}
      {themeAnchor && <OptionPopover embedded anchor={themeAnchor} onClose={() => setThemeAnchor(null)}>{themeOptions.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{ selected: name === option.id }} onPress={() => { setName(option.id); setThemeAnchor(null); setOpen(false); }} style={[g.outlineButton, { alignItems: 'flex-start', borderWidth: 0, backgroundColor: name === option.id ? theme.colors.roseWash : theme.colors.surface }]}><Text style={{ color: theme.colors.text }}>{option.label}</Text></Pressable>)}</OptionPopover>}
      </View>
    </Modal>
  </MenuContext.Provider>;
}
