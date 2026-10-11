import { Platform, StyleSheet } from 'react-native';

// Shared design tokens: use these for every screen and reusable component.
const baseTheme = {
  colors: {
    background: '#F8F3EB', surface: '#FCF8F1', text: '#49271E', muted: '#796355',
    rose: '#B76E6B', roseSoft: '#E7B2A9', roseWash: '#F4E3DB', sage: '#D9DEC2',
    olive: '#858C67', border: '#E6DACE', white: '#FFFDF8',
  },
  fonts: { heading: 'CormorantGaramond', body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }) },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 12, card: 26, pill: 100 },
};
export type Theme = typeof baseTheme;
export const themes: Record<'petal' | 'burgundy', Theme> = {
  petal: baseTheme,
  burgundy: { ...baseTheme, colors: { ...baseTheme.colors, background: '#3D1018', surface: '#F8EBD5', text: '#491C1D', muted: '#795640', rose: '#9F2838', roseSoft: '#A92D3C', roseWash: '#F4E4CB', sage: '#4C603B', olive: '#78804A', border: '#DDC8AC', white: '#FFF3DC' } },
};
export const theme = baseTheme;
export const createGlobalStyles = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 20, paddingBottom: 32 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 22, borderWidth: 1, borderColor: '#F0E7DD', shadowColor: '#816650', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  heading: { fontFamily: theme.fonts.heading, color: theme.colors.text, fontSize: 34 },
  body: { fontFamily: theme.fonts.body, color: theme.colors.muted, fontSize: 16, lineHeight: 24 },
  button: { backgroundColor: theme.colors.rose, borderRadius: theme.radius.pill, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  buttonText: { color: theme.colors.white, fontSize: 17, fontFamily: theme.fonts.body },
});

export const globalStyles = createGlobalStyles(baseTheme);
