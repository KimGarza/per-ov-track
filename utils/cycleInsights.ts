import { addDays, daysBetween, type CycleData } from './cycle';

/** Pure, deterministic cycle statistics. Predictions never become observations. */
export type CycleInterval = { start: string; nextStart: string; days: number };
export type CycleInsights = {
  intervals: CycleInterval[];
  cycleLength: number;
  periodLength: number;
  completedCycles: number;
  median: number | null;
  average: number | null;
  recentMedian: number | null;
  trendDays: number;
  variabilityDays: number | null;
  confidence: 'default' | 'early' | 'personalized' | 'variable';
  windowDays: number;
  latestStart: string | null;
};
const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function confirmedPeriodStarts(data: CycleData, today: string): string[] {
  const dates = Object.keys(data.days)
    .filter(day => day <= today && data.days[day] === 'menstrual' && !data.pendingDays?.[day])
    .sort();
  const set = new Set(dates);
  return dates.filter(day => !set.has(addDays(day, -1)));
}
export function analyzeCycles(data: CycleData, today: string, defaults = { cycleLength: 28, periodLength: 5 }): CycleInsights {
  const starts = confirmedPeriodStarts(data, today);
  const intervals: CycleInterval[] = [];
  for (let i = 1; i < starts.length; i++) {
    const days = daysBetween(starts[i - 1], starts[i]);
    // Gaps outside the supported range are not silently treated as normal cycles.
    if (days >= 21 && days <= 45) intervals.push({ start: starts[i - 1], nextStart: starts[i], days });
  }
  const recent = intervals.slice(-6).map(item => item.days);
  const center = median(recent);
  const average = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : null;
  const latestThree = recent.slice(-3);
  const earlierThree = recent.slice(-6, -3);
  const trend = latestThree.length === 3 && earlierThree.length === 3
    ? (median(latestThree) ?? 0) - (median(earlierThree) ?? 0) : 0;
  const variability = recent.length >= 3 ? Math.max(...recent) - Math.min(...recent) : null;
  const recentMedian = median(latestThree);
  // Small, capped adjustment only when six completed cycles establish a trend.
  const trendAdjustment = recent.length >= 6 ? clamp(trend * 0.25, -1, 1) : 0;
  const cycleLength = clamp(Math.round((center ?? defaults.cycleLength) + trendAdjustment), 21, 45);
  const lengths = starts.map(start => {
    let count = 0;
    let day = start;
    while (data.days[day] === 'menstrual' && !data.pendingDays?.[day] && count < 10) {
      count++;
      day = addDays(day, 1);
    }
    return count;
  }).filter(count => count >= 2 && count <= 10).slice(-6);
  const periodLength = Math.round(median(lengths) ?? defaults.periodLength);
  const confidence = recent.length === 0 ? 'default'
    : recent.length < 3 ? 'early'
    : (variability ?? 0) >= 8 ? 'variable' : 'personalized';
  const windowDays = confidence === 'default' ? 5 : confidence === 'early' ? 4
    : confidence === 'variable' ? clamp(Math.ceil((variability ?? 8) / 2), 4, 10)
    : clamp(Math.ceil((variability ?? 2) / 2), 2, 5);
  return { intervals, cycleLength, periodLength, completedCycles: recent.length,
    median: center, average, recentMedian, trendDays: trend, variabilityDays: variability,
    confidence, windowDays, latestStart: starts.at(-1) ?? null };
}
export function predictionAccuracy(predicted: string, actual: string) {
  return daysBetween(predicted, actual); // Positive means the period arrived later than predicted.
}
