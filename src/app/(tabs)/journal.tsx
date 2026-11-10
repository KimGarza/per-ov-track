import { ScrollView } from 'react-native';
import { JournalContent } from '@/components/JournalContent';
import { useAppTheme } from '@/components/ThemeProvider';
export default function JournalContentScreen() {
  const { styles } = useAppTheme();
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><JournalContent /></ScrollView>;
}
