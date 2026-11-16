import { OptionPopover, type AnchorRect } from './OptionPopover';
import { themeOptions, themes } from '@/constants/Theme';
import { createContext, useCallback, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, View, KeyboardAvoidingView, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryPanels, panelTitles, type PrimaryPanel } from './PrimaryPanels';
import { useAppTheme } from './ThemeProvider';
import { useAuth } from '@/src/providers/AuthProvider';
import { router } from 'expo-router';
import { initialMenuState, menuReducer } from '@/utils/menuNavigation';

const MenuContext = createContext<{ openMenu: () => void; openPanel: (panel: PrimaryPanel) => void; setExternalOverlay: (active: boolean) => void }>({ openMenu: () => {}, openPanel: () => {}, setExternalOverlay: () => {} });
export const useCalendarOverlay = () => useContext(MenuContext).setExternalOverlay;
export const usePrimaryPanel = () => useContext(MenuContext).openPanel;
export function MenuButton() {
  const { openMenu: open } = useContext(MenuContext);
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={open} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><View style={{ gap: 5, alignItems: 'center' }}>{[25, 19, 25].map((width, i) => <View key={i} style={{ width, height: 2.5, borderRadius: 3, backgroundColor: theme.colors.onBackground }} />)}</View></Pressable>;
}
export function SideMenuProvider({ children }: { children: ReactNode }) {
  const [themeAnchor, setThemeAnchor] = useState<AnchorRect | null>(null);
  const [externalOverlay, setExternalOverlay] = useState(false);
  const [menu, dispatch] = useReducer(menuReducer, initialMenuState);
  const { open, pages } = menu;
  const panel = pages.at(-1);
  const { width } = useWindowDimensions();
  const compact = width < 680 && !!panel;
  const railWidth = compact ? (width < 380 ? 96 : 116) : Math.min(280, width * 0.82);
  const { theme, styles: g, name, setName } = useAppTheme();
  const { session, signOut } = useAuth();
  const [avatar, setAvatar] = useState('✿');
  useEffect(() => {
    if (!session) return;
    const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (!base) return;
    let active = true;
    void fetch(`${base}/users/me`, { headers: { Authorization: `Bearer ${session.idToken}` } })
      .then(async response => response.ok ? await response.json() : null)
      .then(result => { if (active) setAvatar(({ flower: '✿', dove: '🕊', heart: '♡', cross: '✝', sun: '☼', leaf: '❧' } as Record<string, string>)[result?.user?.avatar] ?? '✿'); }).catch(() => {});
    return () => { active = false; };
  }, [session, open]);
  const openPanel = useCallback((value: PrimaryPanel) => {
    if (value === 'themes') { dispatch({ type: 'close' }); setThemeAnchor({ x: 8, y: 60, width: 0, height: 0 }); }
    else { setThemeAnchor(null); dispatch({ type: 'select', panel: value }); }
  }, []);
  const items = [{ label: 'My Account', icon: avatar, id: 'account' }, { label: 'Themes', icon: '✿', id: 'themes' }, { label: 'Cycle Settings', icon: '◷', id: 'settings' }, { label: 'Subscription / Billing', icon: '▤', id: 'subscription' }, { label: 'Help & Support', icon: '?', id: 'support' }] as const;
  const inactive = open || !!themeAnchor || !!panel || externalOverlay;
  const softenCalendar = !!panel || externalOverlay;
  const nativeBlur = Platform.OS === 'android' && Number(Platform.Version) >= 31;
  return <MenuContext.Provider value={{ openMenu: () => dispatch({ type: 'open' }), openPanel, setExternalOverlay }}>
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, filter: softenCalendar ? (Platform.OS === 'web' ? 'blur(6px)' : nativeBlur ? [{ blur: 6 }] : undefined) : undefined, opacity: softenCalendar && Platform.OS !== 'web' && !nativeBlur ? 0.45 : 1 }} accessibilityElementsHidden={inactive} importantForAccessibility={inactive ? 'no-hide-descendants' : 'auto'}>{children}</View>
    </View>
    <Modal visible={open || !!themeAnchor} transparent animationType="fade" onRequestClose={() => { if (themeAnchor) setThemeAnchor(null); else dispatch({ type: 'back' }); }}>
      {themeAnchor ? <OptionPopover embedded anchor={themeAnchor} onClose={() => setThemeAnchor(null)}>
        <Text style={g.sectionHeading}>Themes</Text>
        {themeOptions.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{ selected: name === option.id }} onPress={() => setName(option.id)} style={[g.dropdownOption, { flexDirection: 'row', alignItems: 'center', gap: 10 }, name === option.id && g.tagSelected]}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: themes[option.id].colors.background, borderWidth: 1, borderColor: themes[option.id].colors.primary }} /><Text style={[g.label, { flex: 1 }]}>{option.label}</Text><Text style={g.label}>{name === option.id ? '✓' : ''}</Text>
        </Pressable>)}
      </OptionPopover> :
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close navigation and content" onPress={() => dispatch({ type: 'close' })} style={{ position: 'absolute', inset: 0, backgroundColor: theme.colors.overlay }} />
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, flexDirection: 'row', pointerEvents: 'box-none' }}>
          <View style={{ width: railWidth, backgroundColor: theme.colors.surface, borderRightWidth: 1, borderColor: theme.colors.border }}>
            <ScrollView contentContainerStyle={{ padding: compact ? 8 : 20, gap: 10 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {!compact && <Text style={[g.heading, { flex: 1, fontSize: 25 }]}>✝ Crimson Rhythm</Text>}
                <Pressable accessibilityRole="button" accessibilityLabel="Close menu and content" onPress={() => dispatch({ type: 'close' })} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.colors.text, fontSize: 26 }}>×</Text></Pressable>
              </View>
              {!compact && <Text style={[g.body, { fontStyle: 'italic' }]}>Grace for every cycle</Text>}
              {items.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: pages[0] === item.id }} onPress={() => openPanel(item.id)} style={{ paddingVertical: 13, paddingHorizontal: compact ? 6 : 12, minHeight: 48, borderRadius: 12, backgroundColor: pages[0] === item.id ? theme.colors.roseWash : theme.colors.surface, gap: 6, flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'center' : 'flex-start' }}>
                <Text style={{ color: theme.colors.rose, fontSize: 21 }}>{item.icon}</Text>
                <Text style={{ color: theme.colors.text, fontSize: compact ? 12 : 16, flexShrink: 1, textAlign: compact ? 'center' : 'left' }}>{item.label}</Text>
              </Pressable>)}
              <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={() => { dispatch({ type: 'close' }); void signOut().then(() => router.replace('/welcome')); }} style={{ marginTop: 20, padding: 10, minHeight: 44 }}><Text style={{ color: theme.colors.rose, fontSize: compact ? 12 : 16 }}>↪ Sign out</Text></Pressable>
            </ScrollView>
          </View>
          {panel && <View style={{ flex: 1, minWidth: 0, backgroundColor: theme.colors.background }} onAccessibilityEscape={() => dispatch({ type: 'back' })}>
            <View style={{ padding: compact ? 10 : 20, borderBottomWidth: 1, borderColor: theme.colors.border, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => dispatch({ type: 'back' })} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}><Text style={g.body}>‹ Back</Text></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Close content, keep menu open" onPress={() => dispatch({ type: 'close-panel' })} style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.colors.text, fontSize: 26 }}>×</Text></Pressable>
              </View>
              <Text accessibilityRole="header" style={[g.heading, { fontSize: compact ? 24 : 30 }]}>{panelTitles[panel]}</Text>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: compact ? 12 : 24, gap: 16 }}>
              <PrimaryPanels key={panel === 'password' || panel === 'delete-account' ? panel : pages[0]} panel={panel} onClose={() => dispatch({ type: 'close-panel' })} onChange={value => dispatch({ type: 'navigate', panel: value })} />
            </ScrollView>
          </View>}
        </SafeAreaView>
      </KeyboardAvoidingView>}
    </Modal>
  </MenuContext.Provider>;
}
