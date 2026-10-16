import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from './ThemeProvider';
import type { CervicalMucus, CycleKind, PeriodFlow } from '@/utils/cycle';

export function CycleOptions({ kind, flow, mucus, onFlow, onMucus, disabled = false }: {
  kind: CycleKind; flow?: PeriodFlow; mucus?: CervicalMucus;
  onFlow: (value: PeriodFlow | undefined) => void;
  onMucus: (value: CervicalMucus | undefined) => void; disabled?: boolean;
}) {
  const { theme, styles: g } = useAppTheme();
  return <View style={[g.card, { padding: theme.spacing.sm, gap: theme.spacing.sm }]}>
    <Text style={[g.body, { fontStyle: 'italic', fontSize: 13 }]}>Optional · {kind === 'menstrual' ? 'Period flow' : 'Cervical mucus'}</Text>
    {kind === 'menstrual' ? <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
      {(['spotting', 'light', 'normal', 'heavy'] as const).map((value, index) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} flow`} accessibilityState={{ selected: flow === value }} aria-pressed={flow === value} disabled={disabled} onPress={() => onFlow(flow === value ? undefined : value)} style={[g.outlineButton, { flex: 1, paddingHorizontal: 2, borderColor: flow === value ? theme.colors.todayPeriod : theme.colors.border, backgroundColor: flow === value ? theme.colors.roseWash : theme.colors.surface, alignItems: 'center', gap: 8 }]}>
        <View style={{ width: 20, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 17, height: 17, borderTopLeftRadius: 2, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, transform: [{ rotate: '45deg' }], backgroundColor: theme.colors.todayPeriod, opacity: [0.3, 0.5, 0.75, 1][index] }} />
        </View>
        <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 12 }}>{value.charAt(0).toUpperCase() + value.slice(1)}</Text>
      </Pressable>)}
    </View> : <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {([{ value: 'dry', label: 'Dry' }, { value: 'sticky', label: 'Sticky' }, { value: 'creamy', label: 'Creamy' }, { value: 'watery', label: 'Watery' }, { value: 'stretchy', label: 'Stretchy · egg-white' }] as const).map(option => <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: mucus === option.value }} aria-pressed={mucus === option.value} disabled={disabled} onPress={() => onMucus(mucus === option.value ? undefined : option.value)} style={[g.outlineButton, { backgroundColor: mucus === option.value ? theme.colors.calendarFertile : theme.colors.surface, borderColor: mucus === option.value ? theme.colors.todayFertile : theme.colors.border }]}><Text style={g.body}>{option.label}</Text></Pressable>)}
      </View>
      <Text style={[g.body, { fontSize: 12 }]}>Log what you notice. This does not confirm ovulation.</Text>
    </>}
    <Pressable accessibilityRole="button" disabled={disabled} onPress={() => kind === 'menstrual' ? onFlow(undefined) : onMucus(undefined)}><Text style={[g.body, { fontSize: 12, textDecorationLine: 'underline' }]}>Leave unspecified</Text></Pressable>
  </View>;
}
