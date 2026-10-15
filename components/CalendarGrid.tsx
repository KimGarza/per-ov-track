import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { createGlobalStyles, type Theme } from '@/constants/Theme';
import { mixColor, dateKey, type CycleKind, type DateRange } from '@/utils/cycle';
import { christianDays } from '@/utils/faith';
import { useAppTheme } from './ThemeProvider';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function FlowerMarker({ color, size }: { color: string; size?: number }) {
  return <View pointerEvents="none" accessible={false} style={size ? { width: size, height: size } : StyleSheet.absoluteFill}>
    {Array.from({ length: 5 }, (_, index) => {
      const angle = (index * 72 - 90) * Math.PI / 180;
      return <View key={index} style={{ position: 'absolute', width: '52%', height: '52%', borderRadius: 100,
        left: `${24 + 24 * Math.cos(angle)}%`, top: `${24 + 24 * Math.sin(angle)}%`, backgroundColor: color }} />;
    })}
    <View style={{ position: 'absolute', left: '20%', top: '20%', width: '60%', height: '60%', borderRadius: 100, backgroundColor: color }} />
  </View>;
}
export function MonthNavigation({ month, onChange, onTitlePress, compact = false, onUpdate, cycleLabel }: {
  month: Date; onChange: (month: Date) => void; onTitlePress?: () => void; compact?: boolean;
  onUpdate?: () => void; cycleLabel?: string;
}) {
  const { theme, styles: g } = useAppTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const title = <Pressable accessibilityRole="button" accessibilityLabel={`${month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}, open calendar`} onPress={onTitlePress} disabled={!onTitlePress} style={s.monthTitle}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[s.month, compact && { fontSize: 28 }]}>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text></Pressable>;
  const previous = <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => onChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={s.arrow}><Text style={s.arrowText}>‹</Text></Pressable>;
  const next = <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => onChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={s.arrow}><Text style={s.arrowText}>›</Text></Pressable>;
  if (!onUpdate) return <View style={s.monthRow}>{previous}{title}{next}</View>;
  return <>
    <View style={[s.monthRow, { gap: theme.spacing.sm }]}>{title}<Pressable accessibilityRole="button" accessibilityLabel="+ Update your cycle data" onPress={onUpdate} style={[g.outlineButton, { width: 108, backgroundColor: theme.colors.cycleAction, borderColor: theme.colors.cycleAction, borderRadius: theme.radius.pill }]}><Text style={{ color: theme.colors.onCycleAction, textAlign: 'center', fontSize: 12, fontWeight: '600' }}>Update cycle{ '\n' }data</Text></Pressable></View>
    <View style={s.monthRow}>{previous}<Text style={{ flex: 1, textAlign: 'center', color: theme.colors.text, fontSize: 13 }}>{cycleLabel}</Text>{next}</View>
  </>;
}
export function CalendarGrid({ month, today, days, selected, range, previewKind, predictedDays = {}, pendingDays = {}, onSelect, rowHeight = 60 }: {
  predictedDays?: Record<string, CycleKind>; pendingDays?: Record<string, true>; month: Date; today: string; days: Record<string, CycleKind>; selected?: string;
  range?: DateRange; previewKind?: CycleKind | null; onSelect: (key: string) => void; rowHeight?: number;
}) {
  const { theme } = useAppTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const c = theme.colors;
  const holidays = useMemo(() => christianDays(month.getFullYear()), [month]);
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const count = Math.ceil((month.getDay() + totalDays) / 7) * 7;
  return <>
    <View style={s.grid}>{weekdays.map(day => <Text key={day} style={[s.weekday, rowHeight < 50 && { paddingBottom: 4, fontSize: 11 }]}>{day}</Text>)}</View>
    <View style={s.grid}>{Array.from({ length: count }, (_, index) => {
      const day = index - month.getDay() + 1;
      if (day < 1 || day > totalDays) return <View key={index} style={[s.cell, { height: rowHeight }]} />;
      const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day));
      const inRange = !!range?.start && key >= range.start && key <= (range.end ?? range.start);
      const kind = inRange ? previewKind : days[key] ?? predictedDays[key];
      const estimated = !inRange && !!kind && (!days[key] || pendingDays[key] || key > today);
      const fill = kind === 'menstrual' ? c.calendarPeriod : c.calendarFertile;
      const displayFill = estimated ? mixColor(fill, c.calendarSurface) : fill;
      const isToday = key === today;
      const markerColor = kind === 'menstrual' ? c.todayPeriod : kind === 'ovulation' ? c.todayFertile : c.today;
      const label = [new Date(month.getFullYear(), month.getMonth(), day).toDateString(), isToday && 'Today', kind === 'menstrual' && 'Menstrual', estimated && 'Unconfirmed estimate', kind === 'ovulation' && 'Ovulation', inRange && 'In selected range', holidays[key]?.name].filter(Boolean).join(', ');
      return <View key={key} style={[s.cell, { height: rowHeight }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: inRange || key === selected }} onPress={() => onSelect(key)} style={[
          s.day,
          { maxWidth: Math.min(56, rowHeight - 4) },
          kind === 'menstrual' && { backgroundColor: displayFill, borderRadius: 100 },

          (key === selected || inRange) && { borderWidth: 1.5, borderColor: kind === 'menstrual' ? c.todayPeriod : kind === 'ovulation' ? c.todayFertile : c.calendarText },
          isToday && { borderWidth: 2, borderColor: markerColor, borderRadius: 100 },
        ]}>
          {kind === 'ovulation' && <FlowerMarker color={displayFill} />}
          {holidays[key] && <Text accessible={false} style={{ position: 'absolute', top: 1, right: 2, color: c.today, fontSize: 10 }}>✝</Text>}
          <Text style={[s.dayText, rowHeight < 50 && { fontSize: 17 }, isToday && { color: markerColor, fontSize: rowHeight < 44 ? 15 : 19 }]}>{day}</Text>
          {kind === 'menstrual' && <SymbolView name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }} tintColor={c.todayPeriod} size={rowHeight < 44 ? 9 : 12} />}
          {isToday && <View accessible={false} style={{ position: 'absolute', bottom: -5, width: 5, height: 5, borderRadius: 3, backgroundColor: c.calendarText }} />}

        </Pressable>
      </View>;
    })}</View>
  </>;
}
export function CalendarLegend({ compact = false }: { compact?: boolean }) {
  const { theme } = useAppTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  return <View style={[s.legend, compact && { paddingTop: 4, marginTop: 4, gap: 12 }]}>
    {([['Menstrual', theme.colors.calendarPeriod], ['Ovulation', theme.colors.calendarFertile]] as const).map(([label, color]) => <View key={label} style={s.legendItem}>{label === 'Ovulation' ? <FlowerMarker color={color} size={15} /> : <View style={[s.dot, { backgroundColor: color }]} />}<Text style={s.legendText}>{label}</Text></View>)}
    <View style={s.legendItem}><View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.calendarText }} /><Text style={s.legendText}>Today</Text></View>
  </View>;
}
const createStyles = (theme: Theme) => {
  const g = createGlobalStyles(theme);
  const c = theme.colors;
  return StyleSheet.create({
    monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs },
    monthTitle: { flex: 1, minHeight: theme.layout.touchTarget, justifyContent: 'center' },
    month: { ...g.heading, fontSize: 34, textAlign: 'center' },
    arrow: { width: theme.layout.touchTarget, height: theme.layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
    arrowText: { color: c.text, fontSize: 38, lineHeight: 42 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    weekday: { width: '14.2857%', textAlign: 'center', color: c.text, fontFamily: theme.fonts.body, fontSize: 12, paddingBottom: theme.spacing.sm },
    cell: { width: '14.2857%', height: 60, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
    day: { width: '100%', maxWidth: 56, aspectRatio: 1, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
    dayText: { color: c.calendarText, fontSize: 21, fontFamily: theme.fonts.body },
    legend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: theme.spacing.md, borderTopWidth: 1, borderTopColor: c.border, paddingTop: theme.spacing.md, marginTop: theme.spacing.sm },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 13, height: 13, borderRadius: 100 },
    legendText: { color: c.text, fontFamily: theme.fonts.body, fontSize: 12 },
  });
};
