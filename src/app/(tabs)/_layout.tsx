import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useAppTheme } from '@/components/ThemeProvider';

export default function TabLayout() {
  const { theme, name } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: name === 'burgundy' ? '#EBC677' : theme.colors.rose,
        tabBarInactiveTintColor: name === 'burgundy' ? theme.colors.white : theme.colors.muted,
        tabBarStyle: { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border, height: 82, paddingTop: 8, paddingBottom: 18 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'calendar',
                android: 'calendar_month',
                web: 'calendar_month',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'chart.bar.fill',
                android: 'bar_chart',
                web: 'bar_chart',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
