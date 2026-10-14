import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { useAppTheme } from './ThemeProvider';
import { ThemePicker } from './ThemePicker';

const MenuContext = createContext<() => void>(() => {});
export function MenuButton() {
  const open = useContext(MenuContext);
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={open} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24, color: theme.colors.onBackground }}>☰</Text></Pressable>;
}
export function SideMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [slide] = useState(() => new Animated.Value(-320));
  useEffect(() => { if (open) { slide.setValue(-320); Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start(); } }, [open, slide]);
  const { theme, styles: g } = useAppTheme();
  const path = usePathname();
  const items = [{ label: 'Calendar', icon: '▦', href: '/' }, { label: 'Insights', icon: '♡', href: '/two' }, { label: 'Faith & guidance', icon: '✝', href: '/faith' }, { label: 'Journal & goals', icon: '✎', href: '/journal' }] as const;
  return <MenuContext.Provider value={() => setOpen(true)}>{children}
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" onPress={() => setOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.colors.overlay }} />
        <Animated.View style={{ width: '82%', maxWidth: 320, transform: [{ translateX: slide }] }}><SafeAreaView style={{ flex: 1, width: '100%', backgroundColor: theme.colors.surface, borderRightWidth: 1, borderColor: theme.colors.border }}>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={[g.heading, { fontSize: 30 }]}>✝ Crimson Rhythm</Text><Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={g.outlineButton}><Text style={{ color: theme.colors.text }}>×</Text></Pressable></View>
            <Text style={[g.body, { fontStyle: 'italic' }]}>Grace for every season.</Text>
            {items.map(item => <Pressable key={item.href} accessibilityRole="button" accessibilityState={{ selected: path === item.href }} onPress={() => { setOpen(false); router.navigate(item.href); }} style={[g.outlineButton, { alignItems: 'flex-start', paddingHorizontal: 16, backgroundColor: path === item.href ? theme.colors.roseWash : theme.colors.surface }]}><Text style={{ color: theme.colors.text, fontSize: 16 }}>{item.icon}   {item.label}</Text></Pressable>)}
            <View style={{ borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 16, gap: 12 }}><Text style={g.body}>Make this space yours</Text><ThemePicker /></View>
          </ScrollView>
        </SafeAreaView></Animated.View>
      </View>
    </Modal>
  </MenuContext.Provider>;
}
