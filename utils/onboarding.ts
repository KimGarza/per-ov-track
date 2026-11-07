import { addDays, dateKey, parseDate, type CycleData, type CycleKind } from '@/utils/cycle';

export type PregnancyIntent = 'trying' | 'struggling' | 'no' | 'pregnant' | 'unsure';
export type CycleOnboarding = {
  completed: boolean;
  lastPeriodStart?: string;
  lastOvulation?: string;
  pregnancyIntent?: PregnancyIntent;
  cycleLength: number;
  periodLength: number;
};
export const defaultOnboarding = (): CycleOnboarding => ({ completed: false, cycleLength: 28, periodLength: 5 });
export function predictedCalendar(data: CycleData, config: CycleOnboarding, today: string, month: Date): Record<string, CycleKind> {
  if (!config.completed || config.pregnancyIntent === 'pregnant') return {};
  const predictions: Record<string, CycleKind> = {};
  const start = dateKey(new Date(month.getFullYear(), month.getMonth(), 1));
  const end = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const periodStarts = Object.keys(data.days).filter(key => key <= today && data.days[key] === 'menstrual' && !data.pendingDays?.[key] && data.days[addDays(key, -1)] !== 'menstrual').sort();
  const anchor = periodStarts.at(-1) ?? config.lastPeriodStart;
  if (!anchor && !config.lastOvulation) return {};
  const cycleLength = Math.max(21, Math.min(45, config.cycleLength || 28));
  const periodLength = Math.max(1, Math.min(10, config.periodLength || 5));
  const anchors: string[] = [];
  if (anchor) {
    parseDate(anchor);
    for (let offset = -3; offset <= 3; offset++) anchors.push(addDays(anchor, offset * cycleLength));
  } else if (config.lastOvulation) {
    parseDate(config.lastOvulation);
    for (let offset = -3; offset <= 3; offset++) anchors.push(addDays(config.lastOvulation, 14 + offset * cycleLength));
  }
  for (const period of anchors) {
    for (let i = 0; i < periodLength; i++) {
      const key = addDays(period, i);
      if (key >= start && key <= end && key > today && !data.days[key]) predictions[key] = 'menstrual';
    }
    const ovulation = addDays(period, cycleLength - 14);
    if (ovulation >= start && ovulation <= end && ovulation > today && !data.days[ovulation]) predictions[ovulation] = 'ovulation';
  }
  // A user-reported historical ovulation is an observation, never an inferred prediction.
  return predictions;
}
