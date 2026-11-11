import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyCycleData } from '@/utils/cycle';
import type { CycleData } from '@/utils/cycle';
export type SyncMutation = { mutationId: string; generation: number; baseRevision: number; entry: SyncEntry };
export type SyncEntry = { date: string; kind?: string | null; confirmed?: boolean; flow?: string; mucus?: string; mood?: string; symptoms?: string; notes?: string; diary?: string; diaryStyle?: unknown; reflection?: unknown; deleted?: boolean; revision?: number };
export type SyncState = { generation: number; revision: number; pending: SyncMutation[]; dirty: boolean };
const initial = (): SyncState => ({ generation: 0, revision: 0, pending: [], dirty: false });
export const syncKey = (sub: string) => `crimson-rhythm:sync:v1:${sub}`;
export async function loadSyncState(sub: string): Promise<SyncState> {
  const raw = await AsyncStorage.getItem(syncKey(sub));
  if (!raw) return initial();
  const state = JSON.parse(raw) as SyncState;
  return { ...initial(), ...state, pending: Array.isArray(state.pending) ? state.pending : [] };
}
export async function saveSyncState(sub: string, state: SyncState) { await AsyncStorage.setItem(syncKey(sub), JSON.stringify(state)); }
export function changedDates(before: CycleData, after: CycleData): string[] {
  const keys = new Set<string>();
  for (const field of ['days','journal','observations','pendingDays','diary','diaryStyles','reflections'] as const) {
    for (const date of Object.keys(before[field] ?? {})) keys.add(date);
    for (const date of Object.keys(after[field] ?? {})) keys.add(date);
  }
  return [...keys].filter(date => (['days','journal','observations','pendingDays','diary','diaryStyles','reflections'] as const)
    .some(field => JSON.stringify(before[field]?.[date] ?? null) !== JSON.stringify(after[field]?.[date] ?? null))).sort();
}
export function entryForDay(data: CycleData, date: string): SyncEntry {
  const observation = data.observations?.[date];
  const journal = data.journal[date];
  const entry: SyncEntry = { date, kind: data.days[date] ?? null, confirmed: !data.pendingDays?.[date],
    flow: observation?.kind === 'menstrual' ? observation.flow : undefined,
    mucus: observation?.kind === 'ovulation' ? observation.mucus : undefined,
    mood: journal?.mood, symptoms: journal?.symptoms, notes: journal?.notes,
    diary: data.diary?.[date], diaryStyle: data.diaryStyles?.[date], reflection: data.reflections?.[date] };
  if (!data.days[date] && !journal && !data.diary?.[date] && !data.reflections?.[date]) entry.deleted = true;
  return entry;
}
export function applyRemote(data: CycleData, entry: SyncEntry): CycleData {
  const next = { ...data, days: { ...data.days }, journal: { ...data.journal },
    observations: { ...data.observations }, pendingDays: { ...data.pendingDays },
    diary: { ...data.diary }, diaryStyles: { ...data.diaryStyles }, reflections: { ...data.reflections } };
  const date = entry.date;
  for (const field of ['days','journal','observations','pendingDays','diary','diaryStyles','reflections'] as const) delete (next[field] as Record<string, unknown>)[date];
  if (!entry.deleted) {
    if (entry.kind === 'menstrual' || entry.kind === 'ovulation') next.days[date] = entry.kind;
    if (entry.kind && entry.confirmed === false) next.pendingDays[date] = true;
    if (entry.kind === 'menstrual' && entry.flow) next.observations[date] = { kind: 'menstrual', flow: entry.flow as 'normal' };
    if (entry.kind === 'ovulation' && entry.mucus) next.observations[date] = { kind: 'ovulation', mucus: entry.mucus as 'dry' };
    if (entry.mood != null || entry.symptoms != null || entry.notes != null) next.journal[date] = { mood: entry.mood ?? '', symptoms: entry.symptoms ?? '', notes: entry.notes ?? '' };
    if (entry.diary != null) next.diary[date] = entry.diary;
    if (entry.diaryStyle != null) next.diaryStyles[date] = entry.diaryStyle as NonNullable<CycleData['diaryStyles']>[string];
    if (entry.reflection != null) next.reflections[date] = entry.reflection as NonNullable<CycleData['reflections']>[string];
  }
  return next;
}
export async function syncAccount(api: string, token: string, sub: string, data: CycleData, persist: (data: CycleData) => Promise<void>) {
  let state = await loadSyncState(sub);
  const request = async (url: string, init?: RequestInit) => {
    const response = await fetch(`${api}${url}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    const body = await response.json();
    return { status: response.status, body };
  };
  // Pull before pushing. Pending local edits always take precedence over downloaded rows.
  let cursor = state.revision;
  let after = '0001-01-01';
  let next = data;
  let serverGeneration = state.generation;
  let serverRevision = state.revision;
  for (let page = 0; page < 100; page++) {
    const { status, body } = await request(`/cycle/sync?since=${cursor}&after=${after}`);
    if (status !== 200) throw new Error('Cloud download unavailable');
    serverGeneration = body.generation;
    serverRevision = body.revision;
    if (state.generation !== serverGeneration) {
      // Server reset wins. Do not replay stale pending edits.
      state = { ...state, generation: serverGeneration, pending: [] };
      if (!body.resetFrom) next = emptyCycleData();
      else {
        const cutoff: string = body.resetFrom;
        const keep = <T,>(map?: Record<string,T>) => Object.fromEntries(Object.entries(map ?? {}).filter(([day]) => day < cutoff)) as Record<string,T>;
        next = { ...next, days: keep(next.days), journal: keep(next.journal), observations: keep(next.observations), pendingDays: keep(next.pendingDays), diary: keep(next.diary), diaryStyles: keep(next.diaryStyles), reflections: keep(next.reflections) };
      }
    }
    const dirtyDates = new Set(state.pending.map(m => m.entry.date));
    for (const entry of body.entries as SyncEntry[]) if (!dirtyDates.has(entry.date)) next = applyRemote(next, entry);
    if (body.nextCursor == null) break;
    cursor = body.nextCursor.revision;
    after = body.nextCursor.date;
    if (page === 99) throw new Error('Sync pagination limit reached');
  }
  if (JSON.stringify(next) !== JSON.stringify(data)) await persist(next);
  state.revision = serverRevision;
  state.generation = serverGeneration;
  await saveSyncState(sub, state);
  for (const mutation of [...state.pending]) {
    const { status, body } = await request('/cycle/sync', { method: 'POST', body: JSON.stringify(mutation) });
    if (status === 409) throw new Error(body.error === 'RESET_GENERATION_CHANGED' ? 'Tracking history reset on another device' : 'Conflicting edit requires review');
    if (status !== 200) throw new Error('Cloud upload unavailable');
    state.pending = state.pending.filter(item => item.mutationId !== mutation.mutationId);
    state.revision = body.revision;
    await saveSyncState(sub, state);
  }
  return { data: next, state };
}
