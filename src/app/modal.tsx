import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/components/ThemeProvider';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

export default function ModalScreen() {
  const { theme } = useAppTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal</Text>
      <View style={styles.separator} lightColor={theme.colors.border} />
      <EditScreenInfo path="app/modal.tsx" />

      {/* Use the active palette for system chrome */}
      <StatusBar style={theme.statusBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
