import { Text as DefaultText, View as DefaultView } from 'react-native';

import { useAppTheme } from './ThemeProvider';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: 'text' | 'background' | 'tint' | 'tabIconDefault' | 'tabIconSelected'
) {
  const { theme } = useAppTheme();
  const colorFromProps = props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const palette = { text: theme.colors.text, background: theme.colors.surface, tint: theme.colors.rose, tabIconDefault: theme.colors.muted, tabIconSelected: theme.colors.rose };
    return palette[colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const { styles: g } = useAppTheme();
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[g.text, { color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
