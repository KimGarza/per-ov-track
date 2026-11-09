import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { dateKey, parseDate } from '@/utils/cycle';
import { useAppTheme } from './ThemeProvider';

export function JumpToDateModal({ visible, initial, onClose, onJump }: {
  visible: boolean; initial: Date; onClose: () => void; onJump: (date: Date) => void;
}) {
  const { theme, styles: g } = useAppTheme();
  const [day, setDay] = useState(String(initial.getDate()));
  const [month, setMonth] = useState(String(initial.getMonth() + 1));
  const [year, setYear] = useState(String(initial.getFullYear()));
  const [error, setError] = useState('');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const jump = () => {
    try {
      const y = Number(year), m = Number(month), d = Number(day);
      if (!Number.isInteger(y) || y < 1900 || y > 2200 || !Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(d) || d < 1 || d > 31) throw new Error('Enter a valid day, month and year.');
      const date = parseDate(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
      onJump(date); onClose();
    } catch { setError('Enter a valid calendar date.'); }
  };
  const input = (label: string, value: string, onChangeText: (value: string) => void, maxLength: number) =>
    <View style={{ flex: 1, gap: 4 }}><Text style={g.label}>{label}</Text><TextInput accessibilityLabel={label} keyboardType="number-pad" value={value} onChangeText={onChangeText} maxLength={maxLength} style={g.input} /></View>;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: theme.colors.overlay }}>
      <View style={[g.card, { gap: 14, maxWidth: 450, width: '100%', alignSelf: 'center' }]}>
        <Text style={g.heading}>Jump to date</Text>
        <Text style={g.caption}>Choose a month or type the day, month and year.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {months.map((name, i) => <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: Number(month) === i + 1 }} onPress={() => setMonth(String(i + 1))} style={[g.outlineButton, { paddingHorizontal: 12, backgroundColor: Number(month) === i + 1 ? theme.colors.roseWash : theme.colors.surface }]}><Text style={g.label}>{name}</Text></Pressable>)}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {input('Day', day, setDay, 2)}
          {input('Month', month, setMonth, 2)}
          {input('Year', year, setYear, 4)}
        </View>
        {!!error && <Text accessibilityRole="alert" style={{ color: theme.colors.todayPeriod }}>{error}</Text>}
        <Pressable accessibilityRole="button" onPress={jump} style={g.button}><Text style={g.buttonText}>Jump to date</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { onJump(new Date()); onClose(); }} style={g.outlineButton}><Text style={g.label}>Back to today</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onClose} style={g.outlineButton}><Text style={g.label}>Cancel</Text></Pressable>
      </View>
    </View>
  </Modal>;
}
