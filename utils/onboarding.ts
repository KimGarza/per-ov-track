import { addDays, dateKey, parseDate, type CycleData, type CycleKind } from '@/utils/cycle';
import { analyzeCycles } from '@/utils/cycleInsights';

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
  const insights = analyzeCycles(data, today, config);
  const anchor = insights.latestStart ?? config.lastPeriodStart;
  if (!anchor && !config.lastOvulation) return {};
  const cycleLength = insights.cycleLength;
  const periodLength = insights.periodLength;
  const anchors: string[] = [];
  if (anchor) {
    parseDate(anchor);
    // Only the latest observed cycle anchors future predictions; do not rewrite historical events.
    for (let offset = 0; offset <= 3; offset++) anchors.push(addDays(anchor, offset * cycleLength));
  } else if (config.lastOvulation) {
    parseDate(config.lastOvulation);
    for (let offset = 0; offset <= 3; offset++) anchors.push(addDays(config.lastOvulation, 14 + offset * cycleLength));
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
