import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Themed';
import { designTokens } from '@/constants/Theme';
import type { DiaryStyle } from '@/utils/cycle';
import { OptionPopover, type AnchorRect } from './OptionPopover';
import { useAppTheme } from './ThemeProvider';
export const defaultDiaryStyle: DiaryStyle = { font: 'theme', ink: 'text', highlight: 'none' };
export function JournalTools({ value, onChange, disabled }: { value: DiaryStyle; onChange: (value: DiaryStyle) => void; disabled: boolean }) {
  const { theme, styles: g } = useAppTheme();
  const [menu, setMenu] = useState<{ slot: keyof DiaryStyle; anchor: AnchorRect } | null>(null);
  const choices = {
    font: [{ id: 'theme', label: 'Theme lettering', family: theme.fonts.journal }, { id: 'CormorantGaramond', label: 'Lovely serif', family: 'CormorantGaramond' }, { id: 'SpaceMono', label: 'Little typewriter', family: 'SpaceMono' }, { id: 'system', label: 'Simple & soft', family: designTokens.fonts.body }],
    ink: [{ id: 'text', label: 'Classic ink' }, { id: 'rose', label: 'Rose ink' }, { id: 'olive', label: 'Olive ink' }],
    highlight: [{ id: 'none', label: 'No page highlight' }, { id: 'rose', label: 'Blush page wash' }, { id: 'sage', label: 'Sage page wash' }],
  };
  return <View style={{ marginBottom: 12 }}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
    {([{ slot: 'font', label: 'Aa · Font' }, { slot: 'ink', label: '✎ · Color' }, { slot: 'highlight', label: '☀ · Highlight' }] as const).map(tool => <Pressable key={tool.slot} accessibilityRole="button" accessibilityLabel={`Journal ${tool.slot === 'ink' ? 'color' : tool.slot}`} accessibilityState={{ expanded: menu?.slot === tool.slot, disabled }} disabled={disabled} onPress={event => { Keyboard.dismiss(); event.currentTarget.measureInWindow((x, y, width, height) => setMenu({ slot: tool.slot, anchor: { x, y, width, height } })); }} style={[g.outlineButton, { borderRadius: theme.radius.pill, backgroundColor: theme.colors.roseWash, paddingHorizontal: 12 }]}><Text style={{ color: theme.colors.text, fontSize: 13 }}>{tool.label} ▾</Text></Pressable>)}
  </ScrollView>
  {menu && <OptionPopover anchor={menu.anchor} onClose={() => setMenu(null)}><ScrollView keyboardShouldPersistTaps="handled">{choices[menu.slot].map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{ selected: value[menu.slot] === option.id }} onPress={() => { onChange({ ...value, [menu.slot]: option.id } as DiaryStyle); setMenu(null); }} style={[g.outlineButton, { borderWidth: 0, alignItems: 'flex-start', backgroundColor: value[menu.slot] === option.id ? theme.colors.roseWash : theme.colors.surface }]}><Text style={{ color: theme.colors.text, fontFamily: 'family' in option ? option.family : theme.fonts.body }}>{option.label}</Text></Pressable>)}</ScrollView></OptionPopover>}
  </View>;
}
