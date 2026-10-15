export type CycleKind = 'menstrual' | 'ovulation';
export type JournalEntry = { mood: string; symptoms: string; notes: string };
export type ReflectionEntry = { pattern: string; action: string; completed: string[] };
export type CycleData = {
  version: 1;
  days: Record<string, CycleKind>;
  journal: Record<string, JournalEntry>;
  pendingDays?: Record<string, true>;
  diary?: Record<string, string>;
  reflections?: Record<string, ReflectionEntry>;
};
export const emptyCycleData = (): CycleData => ({ version: 1, days: {}, journal: {} });

// Local date keys avoid UTC shifting an entry to the preceding/following day.
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(key: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error('Invalid date');
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (dateKey(date) !== key) throw new Error('Invalid date');
  return date;
}
export function addDays(key: string, amount: number): string {
  const date = parseDate(key);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}
export function daysBetween(start: string, end: string): number {
  const utc = (key: string) => { const date = parseDate(key); return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()); };
  return Math.round((utc(end) - utc(start)) / 86400000);
}
export function rangeDates(start: string, end: string): string[] {
  const length = daysBetween(start, end);
  if (length < 0) throw new Error('Choose an end date on or after the start date.');
  if (length > 365) throw new Error('Choose a range of one year or less.');
  return Array.from({ length: length + 1 }, (_, index) => addDays(start, index));
}
export type DateRange = { start: string | null; end: string | null };
export function selectRange(range: DateRange, day: string): DateRange {
  parseDate(day);
  if (!range.start || range.end) return { start: day, end: null };
  // Like a booking picker, an earlier click starts a new range.
  return day < range.start ? { start: day, end: null } : { start: range.start, end: day };
}
export function applyRange(data: CycleData, kind: CycleKind | null, start: string, end: string): CycleData {
  const days = { ...data.days };
  for (const day of rangeDates(start, end)) {
    if (kind) days[day] = kind;
    else delete days[day];
  }
  return { ...data, days };
}
export function cycleDay(data: CycleData, today: string): number | null {
  const periods = Object.keys(data.days).filter(key => key <= today && !data.pendingDays?.[key] && data.days[key] === 'menstrual').sort();
  if (!periods.length) return null;
  let start = periods[periods.length - 1];
  while (data.days[addDays(start, -1)] === 'menstrual' && !data.pendingDays?.[addDays(start, -1)]) start = addDays(start, -1);
  return daysBetween(start, today) + 1;
}
export function readCycleData(value: string): CycleData {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid saved data');
  const data = parsed as CycleData;
  if (data.version !== 1 || !data.days || !data.journal || typeof data.days !== 'object' || typeof data.journal !== 'object' || Array.isArray(data.days) || Array.isArray(data.journal)) throw new Error('Invalid saved data');
  for (const [day, kind] of Object.entries(data.days)) {
    parseDate(day);
    if (kind !== 'menstrual' && kind !== 'ovulation') throw new Error('Invalid saved marking');
  }
  for (const [day, entry] of Object.entries(data.journal)) {
    parseDate(day);
    if (!entry || !['mood', 'symptoms', 'notes'].every(field => typeof entry[field as keyof JournalEntry] === 'string')) throw new Error('Invalid saved journal');
  }
  if (data.reflections) {
    if (typeof data.reflections !== 'object' || Array.isArray(data.reflections)) throw new Error('Invalid saved reflection');
    for (const [day, entry] of Object.entries(data.reflections)) {
      parseDate(day);
      if (!entry || typeof entry.pattern !== 'string' || typeof entry.action !== 'string' || !Array.isArray(entry.completed) || !entry.completed.every(id => typeof id === 'string')) throw new Error('Invalid saved reflection');
    }
  }
  if (data.pendingDays) {
    if (typeof data.pendingDays !== 'object' || Array.isArray(data.pendingDays)) throw new Error('Invalid pending dates');
    for (const [day, value] of Object.entries(data.pendingDays)) { parseDate(day); if (value !== true || !data.days[day]) throw new Error('Invalid pending date'); }
  } else {
    const today = dateKey(new Date());
    const pending: Record<string, true> = {};
    for (const day of Object.keys(data.days)) if (day > today) pending[day] = true;
    if (Object.keys(pending).length) data.pendingDays = pending;
  }
  if (data.diary) {
    if (typeof data.diary !== 'object' || Array.isArray(data.diary)) throw new Error('Invalid diary');
    for (const [day, entry] of Object.entries(data.diary)) { parseDate(day); if (typeof entry !== 'string') throw new Error('Invalid diary entry'); }
  }
  return data;
}

// Future markings remain plans until a user explicitly logs them on/after that date.
export function applyLoggedRange(data: CycleData, kind: CycleKind | null, start: string, end: string, today: string): CycleData {
  const next = applyRange(data, kind, start, end);
  const pendingDays = { ...data.pendingDays };
  for (const day of rangeDates(start, end)) {
    if (kind && day > today) pendingDays[day] = true;
    else delete pendingDays[day];
  }
  return { ...next, pendingDays };
}
export function mixColor(color: string, surface: string, amount = 0.48): string {
  const rgb = (value: string): number[] => {
    if (value.startsWith('#')) { const hex = value.slice(1); return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16)); }
    return value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [255, 255, 255];
  };
  const base = rgb(color), paper = rgb(surface);
  return `rgb(${base.map((value, index) => Math.round(value * (1 - amount) + paper[index] * amount)).join(', ')})`;
}
