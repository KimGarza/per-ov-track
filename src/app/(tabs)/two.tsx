import { ScrollView } from 'react-native';
import { InsightsContent } from '@/components/InsightsContent';
import { useAppTheme } from '@/components/ThemeProvider';
export default function InsightsContentScreen() {
  const { styles } = useAppTheme();
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><InsightsContent /></ScrollView>;
}
