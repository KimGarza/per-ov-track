import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { createGlobalStyles, defaultThemeName, themes, type ThemeName } from '@/constants/Theme';
function useThemeState() {
  const [name, setName] = useState<ThemeName>(defaultThemeName);
  const theme = themes[name];
  const styles = useMemo(() => createGlobalStyles(theme), [theme]);
  return { name, setName, theme, styles };
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
