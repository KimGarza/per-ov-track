import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Stack, DefaultTheme, ThemeProvider } from 'expo-router';
import { CycleDataProvider } from '@/components/CycleDataProvider';
import { AppThemeProvider, useAppTheme } from '@/components/ThemeProvider';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';



export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    CormorantGaramond: require('../../assets/fonts/CormorantGaramond.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <AppThemeProvider><CycleDataProvider><RootLayoutNav /></CycleDataProvider></AppThemeProvider>;
}

function RootLayoutNav() {
  const { theme } = useAppTheme();


  return (
    <ThemeProvider value={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.colors.background, card: theme.colors.surface, text: theme.colors.text, primary: theme.colors.rose, border: theme.colors.border } }}>
      <StatusBar style={theme.statusBar} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
