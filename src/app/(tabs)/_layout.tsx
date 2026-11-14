import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { SideMenuProvider } from '@/components/SideMenu';
import { useAppTheme } from '@/components/ThemeProvider';

export default function AppLayout() {
  const { theme } = useAppTheme();
  const items = [
    { name: 'index', title: 'Calendar', icon: '▦' },
    { name: 'two', title: 'Insights', icon: '◷' },
    { name: 'journal', title: 'Journal', icon: '✎' },
    { name: 'faith', title: 'Faith', icon: '✝' },
  ];
  return <SideMenuProvider><Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: theme.colors.rose,
    tabBarInactiveTintColor: theme.colors.muted,
    tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingTop: 5 },
    tabBarLabelStyle: { fontSize: 11 },
  }}>
    {items.map(item => <Tabs.Screen key={item.name} name={item.name} options={{ title: item.title, tabBarIcon: ({ color }) => <Text style={{ fontSize: 23, color }}>{item.icon}</Text> }} />)}
  </Tabs></SideMenuProvider>;
}
