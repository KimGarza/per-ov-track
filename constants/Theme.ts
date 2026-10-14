import { Platform, StyleSheet } from 'react-native';

// Layout and typography are shared. Each palette independently implements this contract.
export const designTokens = {
  fonts: { heading: 'CormorantGaramond', body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }) },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { xs: 4, sm: 12, calendarDay: 10, card: 26, pill: 100 },
  layout: { maxWidth: 720, gutter: 16, touchTarget: 44 },
};
export type ThemeColors = {
  background: string; surface: string; calendarSurface: string; text: string; muted: string;
  calendarPeriod: string; calendarFertile: string; calendarText: string;
  onBackground: string; mutedOnBackground: string; accentOnBackground: string;
  rose: string; roseSoft: string; roseWash: string; sage: string; olive: string;
  onPeriod: string; onFertile: string; mutedOnFertile: string;
  border: string; backgroundBorder: string; white: string; shadow: string;
  botanicalBorder: string; botanicalCenter: string;
};
export type Theme = typeof designTokens & { colors: ThemeColors; statusBar: 'light' | 'dark' };
function defineTheme(colors: ThemeColors, statusBar: Theme['statusBar']): Theme {
  return { ...designTokens, colors, statusBar };
}
export const themes = {
  petal: defineTheme({
    background: '#F8F3EB', surface: '#FCF8F1', calendarSurface: '#FFFAF3', text: '#36201B', muted: '#574137',
    calendarPeriod: '#E7B2A9', calendarFertile: '#D9DEC2', calendarText: '#36201B',
    onBackground: '#36201B', mutedOnBackground: '#574137', accentOnBackground: '#B76E6B',
    rose: '#B76E6B', roseSoft: '#E7B2A9', roseWash: '#F4E3DB', sage: '#D9DEC2', olive: '#858C67',
    onPeriod: '#36201B', onFertile: '#36201B', mutedOnFertile: '#635442',
    border: '#E6DACE', backgroundBorder: '#E6DACE', white: '#FFFDF8', shadow: '#816650',
    botanicalBorder: '#C6A68B', botanicalCenter: '#AE8B51',
  }, 'dark'),
  burgundy: defineTheme({
    background: '#3D1018', surface: '#F8EBD5', calendarSurface: '#FFF0DA', text: '#35171C', muted: '#593B30',
    calendarPeriod: '#DCA0A6', calendarFertile: '#C3CCAC', calendarText: '#35171C',
    onBackground: '#FFF3DC', mutedOnBackground: '#EBC677', accentOnBackground: '#EBC677',
    rose: '#9F2838', roseSoft: '#A92D3C', roseWash: '#F4E4CB', sage: '#4C603B', olive: '#78804A',
    onPeriod: '#FFF3DC', onFertile: '#FFF3DC', mutedOnFertile: '#F4E4CB',
    border: '#DDC8AC', backgroundBorder: '#795640', white: '#FFF3DC', shadow: '#21080D',
    botanicalBorder: '#DDC8AC', botanicalCenter: '#EBC677',
  }, 'light'),
};
export type ThemeName = keyof typeof themes;
// Adding a theme requires a palette above and a label here; selectors derive their options.
export const themeLabels: Record<ThemeName, string> = { petal: 'Soft Petal', burgundy: 'Burgundy Bloom' };
export const themeOptions = (Object.keys(themes) as ThemeName[]).map(id => ({ id, label: themeLabels[id] }));
export const defaultThemeName: ThemeName = 'petal';
export const createGlobalStyles = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { width: '100%', maxWidth: theme.layout.maxWidth, alignSelf: 'center', padding: theme.layout.gutter, paddingBottom: theme.spacing.xl },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.colors.shadow, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  heading: { fontFamily: theme.fonts.heading, color: theme.colors.text, fontSize: 34 },
  body: { fontFamily: theme.fonts.body, color: theme.colors.muted, fontSize: 16, lineHeight: 24 },
  button: { backgroundColor: theme.colors.rose, borderRadius: theme.radius.pill, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  buttonText: { color: theme.colors.white, fontSize: 17, fontFamily: theme.fonts.body },
  outlineButton: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, minHeight: theme.layout.touchTarget, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.sm },
});
