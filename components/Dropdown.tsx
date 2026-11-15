import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './Themed';
import { useAppTheme } from './ThemeProvider';
export function Dropdown<T extends string>({ label, value, options, onChange, disabled = false }: {
  label: string; value: T; options: readonly { value: T; label: string; disabled?: boolean }[]; onChange: (value: T) => void; disabled?: boolean;
}) {
  const { styles: g } = useAppTheme();
  const [open, setOpen] = useState(false);
  return <View style={g.dropdown}>
    <Pressable accessibilityRole="combobox" accessibilityLabel={label} accessibilityValue={{ text: options.find(option => option.value === value)?.label ?? '' }} accessibilityState={{ expanded: open, disabled }} disabled={disabled} onPress={() => setOpen(previous => !previous)} style={g.dropdownTrigger}>
      <Text style={[g.body, { flex: 1 }]}>{options.find(option => option.value === value)?.label}</Text><Text style={g.body}>{open ? '▴' : '▾'}</Text>
    </Pressable>
    {open && <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }} keyboardShouldPersistTaps="handled">{options.map(option => <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: value === option.value, disabled: option.disabled }} disabled={option.disabled} onPress={() => { onChange(option.value); setOpen(false); }} style={[g.dropdownOption, value === option.value && g.tagSelected, option.disabled && g.disabled]}><Text style={g.body}>{option.label}</Text></Pressable>)}</ScrollView>}
  </View>;
}
