import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { createGlobalStyles, defaultThemeName, themes, type ThemeName } from '@/constants/Theme';
function useThemeState() {
  const [name, setName] = useState<ThemeName>(defaultThemeName);
  const [fontOverrides, setFontOverrides] = useState<Partial<Record<ThemeName, Partial<typeof themes[ThemeName]['fonts']>>>>({});
  const theme = useMemo(() => ({ ...themes[name], fonts: { ...themes[name].fonts, ...fontOverrides[name] } }), [name, fontOverrides]);
  const setFont = (slot: 'heading' | 'body' | 'journal', font: string) => setFontOverrides(previous => ({ ...previous, [name]: { ...previous[name], [slot]: font } }));
  const styles = useMemo(() => createGlobalStyles(theme), [theme]);
  return { name, setName, theme, styles, setFont };
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
