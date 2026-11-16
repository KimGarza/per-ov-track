import { daysBetween, emptyCycleData, type CycleData } from './cycle';
export function clearDataRange(data: CycleData, from: string | null, through?: string | null): CycleData {
  if (!from) return emptyCycleData();
  const keep = <T,>(values?: Record<string, T>) => Object.fromEntries(Object.entries(values ?? {}).filter(([day]) => day < from || (!!through && day > through))) as Record<string, T>;
  return { ...data, days: keep(data.days), journal: keep(data.journal), observations: keep(data.observations), pendingDays: keep(data.pendingDays), diary: keep(data.diary), diaryStyles: keep(data.diaryStyles), reflections: keep(data.reflections) };
}
export function clearRangeSummary(data: CycleData, from: string | null, through: string) {
  const dates = new Set<string>();
  for (const map of [data.days, data.journal, data.observations, data.pendingDays, data.diary, data.diaryStyles, data.reflections]) {
    for (const day of Object.keys(map ?? {})) if (!from || day >= from && day <= through) dates.add(day);
  }
  return { recordedDays: dates.size, calendarDays: from ? daysBetween(from, through) + 1 : null };
}
