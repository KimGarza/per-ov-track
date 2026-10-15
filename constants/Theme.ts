import { Platform, StyleSheet } from 'react-native';

// Layout and typography are shared. Each palette independently implements this contract.
export const designTokens = {
  fonts: { heading: 'CormorantGaramond', body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }) },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { xs: 4, sm: 12, calendarDay: 10, card: 26, pill: 100 },
  layout: { maxWidth: 720, gutter: 16, touchTarget: 44, tabBarHeight: 68 },
  calendar: { minRowHeight: 35, maxRowHeight: 80, defaultRowHeight: 60, chromeHeight: 144, headerHeight: 52, checkinHeight: 120 },
};
export type ThemeColors = {
  background: string; surface: string; calendarSurface: string; text: string; muted: string; placeholder: string;
  calendarPeriod: string; calendarFertile: string; calendarText: string;
  today: string; todayPeriod: string; todayFertile: string; overlay: string;
  onBackground: string; mutedOnBackground: string; accentOnBackground: string;
  cycleAction: string; onCycleAction: string; rose: string; roseSoft: string; roseWash: string; sage: string; olive: string;
  onPeriod: string; onFertile: string; mutedOnFertile: string;
  border: string; backgroundBorder: string; white: string; shadow: string;
  botanicalBorder: string; botanicalCenter: string;
};
export type Theme = Omit<typeof designTokens, 'fonts'> & { fonts: { heading: string; body: string | undefined; journal: string }; } & { colors: ThemeColors; statusBar: 'light' | 'dark'; decoration: 'none' | 'celestial' | 'botanical' };
function defineTheme(colors: ThemeColors, statusBar: Theme['statusBar'], decoration: Theme['decoration'] = 'none', fonts: Theme['fonts'] = { ...designTokens.fonts, journal: 'CormorantGaramond' }): Theme {
  return { ...designTokens, fonts, colors, statusBar, decoration };
}
export const themes = {
  grace: defineTheme({
    background: '#e89791', surface: '#eedada', calendarSurface: '#fff6f6', text: '#2d0b0b', muted: '#351310', placeholder: '#A4867B',
    calendarPeriod: 'rgb(240, 108, 115)', calendarFertile: '#a9d2a0', calendarText: '#2d0b0b', today: '#9A763A', todayPeriod: '#2d0b0b', todayFertile: '#358042', overlay: '#422E2866',
    onBackground: '#422E28', mutedOnBackground: '#71534B', accentOnBackground: '#A55552',
    cycleAction: '#f7beb9', onCycleAction: '#59232F', rose: '#AD5D58', roseSoft: '#EDB6AC', roseWash: '#F7DDD4', sage: '#CCD7B9', olive: '#7D8967',
    onPeriod: '#422E28', onFertile: '#422E28', mutedOnFertile: '#71534B',
    border: '#DEC1B2', backgroundBorder: '#DEC1B2', white: '#FFF7F1', shadow: '#816650',
    botanicalBorder: '#BAA18A', botanicalCenter: '#BC8C69',
  }, 'dark', 'botanical', { ...designTokens.fonts, journal: 'CormorantGaramond' }),
  petal: defineTheme({
    background: '#FAEDF1', surface: '#FFF8FA', calendarSurface: '#FFF5F8', text: '#341610', muted: '#5b3128', placeholder: '#997F79',
    calendarPeriod: '#eab7b7', calendarFertile: '#D9DEC2', calendarText: '#36201B', today: '#946723', todayPeriod: '#8B3543', todayFertile: '#43562D', overlay: '#36201B66',
    onBackground: '#36201B', mutedOnBackground: '#574137', accentOnBackground: '#B76E86',
    cycleAction: '#F0ACC6', onCycleAction: '#542536', rose: '#B76E86', roseSoft: '#ECC0CC', roseWash: '#F7DDE5', sage: '#D9DEC2', olive: '#858C67',
    onPeriod: '#36201B', onFertile: '#36201B', mutedOnFertile: '#635442',
    border: '#EBD3DB', backgroundBorder: '#EBD3DB', white: '#FFFDF8', shadow: '#816650',
    botanicalBorder: '#C6A68B', botanicalCenter: '#AE8B51',
  }, 'dark', 'botanical', { heading: 'CormorantGaramond', body: designTokens.fonts.body, journal: 'CormorantGaramond' }),
  burgundy: defineTheme({
    background: '#3D1018', surface: '#F8EBD5', calendarSurface: '#FFF0DA', text: '#35171C', muted: '#593B30', placeholder: '#947D70',
    calendarPeriod: '#DCA0A6', calendarFertile: '#C3CCAC', calendarText: '#35171C', today: '#A57723', todayPeriod: '#842438', todayFertile: '#3D512B', overlay: '#35171C80',
    onBackground: '#FFF3DC', mutedOnBackground: '#EBC677', accentOnBackground: '#EBC677',
    cycleAction: '#E8A0AD', onCycleAction: '#4F1725', rose: '#9F2838', roseSoft: '#A92D3C', roseWash: '#F4E4CB', sage: '#4C603B', olive: '#78804A',
    onPeriod: '#FFF3DC', onFertile: '#FFF3DC', mutedOnFertile: '#F4E4CB',
    border: '#DDC8AC', backgroundBorder: '#795640', white: '#FFF3DC', shadow: '#21080D',
    botanicalBorder: '#DDC8AC', botanicalCenter: '#EBC677',
  }, 'light', 'none', { heading: 'CormorantGaramond', body: designTokens.fonts.body, journal: 'SpaceMono' }),
  sanctuary: defineTheme({
    background: '#151019', surface: '#EAE2DC', calendarSurface: '#F5EFEB', text: '#291924', muted: '#57404F', placeholder: '#95828D',
    calendarPeriod: '#CAA0B0', calendarFertile: '#C5CABA', calendarText: '#291924',
    today: '#7C6237', todayPeriod: '#713246', todayFertile: '#46523B', overlay: '#0B080DD9',
    onBackground: '#F6F0EA', mutedOnBackground: '#C9BECD', accentOnBackground: '#ECE5D7',
    cycleAction: '#C799BC', onCycleAction: '#35172E', rose: '#66384E', roseSoft: '#C6A0B2', roseWash: '#E6D9E0', sage: '#C5CABA', olive: '#777E6E',
    onPeriod: '#291924', onFertile: '#291924', mutedOnFertile: '#57404F',
    border: '#CFC0C8', backgroundBorder: '#463349', white: '#F6F0EA', shadow: '#080609',
    botanicalBorder: '#CFC0C8', botanicalCenter: '#DBCFB5',
  }, 'light', 'celestial', { heading: 'CormorantGaramond', body: designTokens.fonts.body, journal: 'CormorantGaramond' }),
};
export type ThemeName = keyof typeof themes;
// Adding a theme requires a palette above and a label here; selectors derive their options.
export const themeLabels: Record<ThemeName, string> = { grace: 'Grace & Bloom', petal: 'Soft Petal', burgundy: 'Burgundy Bloom', sanctuary: 'Gothic Sanctuary' };
export const themeOptions = (Object.keys(themes) as ThemeName[]).map(id => ({ id, label: themeLabels[id] }));
export const defaultThemeName: ThemeName = 'grace';
export const createGlobalStyles = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { width: '100%', maxWidth: theme.layout.maxWidth, alignSelf: 'center', padding: theme.layout.gutter, paddingBottom: theme.spacing.xl },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.colors.shadow, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  heading: { fontFamily: theme.fonts.heading, color: theme.colors.text, fontSize: 34 },
  body: { fontFamily: theme.fonts.body, color: theme.colors.text, fontSize: 16, lineHeight: 24 },
  button: { backgroundColor: theme.colors.rose, borderRadius: theme.radius.pill, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  buttonText: { color: theme.colors.white, fontSize: 17, fontFamily: theme.fonts.body },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.md, minHeight: theme.layout.touchTarget, backgroundColor: theme.colors.calendarSurface, color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 16 },
  disabled: { opacity: 0.45 },
  outlineButton: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, minHeight: theme.layout.touchTarget, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.sm },
});
