import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Stack, DefaultTheme, ThemeProvider } from 'expo-router';
import { AuthProvider, useAuth } from '@/src/providers/AuthProvider';
import { ActivityIndicator, View } from 'react-native';
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

  return <AppThemeProvider><AuthProvider><CycleDataProvider><RootLayoutNav /></CycleDataProvider></AuthProvider></AppThemeProvider>;
}

function RootLayoutNav() {
  const { theme } = useAppTheme();
  const { ready, session } = useAuth();
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;


  return (
    <ThemeProvider value={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.colors.background, card: theme.colors.surface, text: theme.colors.text, primary: theme.colors.rose, border: theme.colors.border } }}>
      <StatusBar style={theme.statusBar} />
      <Stack>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ title: 'My Account' }} />
          <Stack.Screen name="cloud-check" options={{ title: 'Cloud connection test' }} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
