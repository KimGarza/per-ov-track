import { ScrollView } from 'react-native';
import { BibleGuidance } from '@/components/BibleGuidance';
import { useAppTheme } from '@/components/ThemeProvider';
export default function BibleGuidanceScreen() {
  const { styles } = useAppTheme();
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><BibleGuidance /></ScrollView>;
}
