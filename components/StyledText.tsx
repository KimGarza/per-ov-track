import { Text, TextProps } from './Themed';
import { useAppTheme } from './ThemeProvider';

export function MonoText(props: TextProps) {
  const { theme } = useAppTheme();
  return <Text {...props} style={[props.style, { fontFamily: theme.fonts.mono }]} />;
}
