import { createContext, useContext, useMemo, useState, useEffect, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createGlobalStyles, defaultThemeName, themes, type ThemeName } from '@/constants/Theme';
function useThemeState() {
  const [todayMarker, setTodayMarker] = useState<'circle' | 'heart'>('circle');
  const [name, setName] = useState<ThemeName>(defaultThemeName);
  useEffect(() => { void AsyncStorage.getItem('crimson-rhythm:theme:v1').then(saved => { if (saved && saved in themes) setName(saved as ThemeName); }).catch(() => {}); }, []);
  const changeTheme = (value: ThemeName) => { setName(value); void AsyncStorage.setItem('crimson-rhythm:theme:v1', value).catch(() => {}); };
  const theme = themes[name];
  const styles = useMemo(() => createGlobalStyles(theme), [theme]);
  return { name, setName: changeTheme, theme, styles, todayMarker, setTodayMarker };
}
const ThemeContext = createContext<ReturnType<typeof useThemeState> | null>(null);
export function AppThemeProvider({ children }: PropsWithChildren) {
  const value = useThemeState();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme requires AppThemeProvider');
  return value;
}
