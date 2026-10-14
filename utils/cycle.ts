export type CycleKind = 'menstrual' | 'ovulation';
export type JournalEntry = { mood: string; symptoms: string; notes: string };
export type CycleData = {
  version: 1;
  days: Record<string, CycleKind>;
  journal: Record<string, JournalEntry>;
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
  const periods = Object.keys(data.days).filter(key => key <= today && data.days[key] === 'menstrual').sort();
  if (!periods.length) return null;
  let start = periods[periods.length - 1];
  while (data.days[addDays(start, -1)] === 'menstrual') start = addDays(start, -1);
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
  return data;
}
