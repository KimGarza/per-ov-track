import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { applyLoggedRange, dateKey, emptyCycleData, parseDate, readCycleData, type DiaryStyle, type CycleData, type CycleKind, type JournalEntry, type ReflectionEntry } from '@/utils/cycle';

const storageKey = 'crimson-rhythm:cycle-data:v1';
function useCycleState() {
  const [data, setData] = useState<CycleData>(emptyCycleData);
  const current = useRef(data);
  const queue = useRef(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => AsyncStorage.getItem(storageKey).then(saved => {
    const next = saved ? readCycleData(saved) : emptyCycleData();
    current.current = next;
    setData(next);
    setError(null);
    setReady(true);
  }).catch(() => {
    setError('Your saved data could not be loaded. Please try again.');
  }), []);
  useEffect(() => { void load(); }, [load]);
  const commit = useCallback((update: (previous: CycleData) => CycleData) => {
    if (!ready) return Promise.reject(new Error('Wait for your saved data to load.'));
    const operation = queue.current.then(async () => {
      const next = update(current.current);
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      current.current = next;
      setData(next);
    });
    queue.current = operation.catch(() => {});
    return operation;
  }, [ready]);
  const saveRange = useCallback((kind: CycleKind | null, start: string, end: string) => commit(previous => applyLoggedRange(previous, kind, start, end, dateKey(new Date()))), [commit]);
  const saveJournal = useCallback((day: string, entry: JournalEntry) => {
    const key = dateKey(parseDate(day));
    return commit(previous => ({ ...previous, journal: { ...previous.journal, [key]: entry } }));
  }, [commit]);
  const saveDay = useCallback((day: string, kind: CycleKind | null, entry: JournalEntry, confirmed = true) => {
    const key = dateKey(parseDate(day));
    return commit(previous => {
      const next = applyLoggedRange(previous, kind, key, key, dateKey(new Date()));
      if (kind && !confirmed) next.pendingDays = { ...next.pendingDays, [key]: true };
      return { ...next, journal: { ...previous.journal, [key]: entry } };
    });
  }, [commit]);
  const saveReflection = useCallback((day: string, entry: ReflectionEntry) => {
    const key = dateKey(parseDate(day));
    return commit(previous => ({ ...previous, reflections: { ...previous.reflections, [key]: entry } }));
  }, [commit]);
  const saveDiary = useCallback((day: string, entry: string, style?: DiaryStyle) => {
    const key = dateKey(parseDate(day));
    return commit(previous => ({ ...previous, diary: { ...previous.diary, [key]: entry }, ...(style ? { diaryStyles: { ...previous.diaryStyles, [key]: style } } : {}) }));
  }, [commit]);
  return { data, saveDiary, saveReflection, ready, error, retry: load, saveRange, saveJournal, saveDay };
}
const CycleContext = createContext<ReturnType<typeof useCycleState> | null>(null);
export function CycleDataProvider({ children }: PropsWithChildren) {
  const value = useCycleState();
  return <CycleContext.Provider value={value}>{children}</CycleContext.Provider>;
}
export function useCycleData() {
  const value = useContext(CycleContext);
  if (!value) throw new Error('useCycleData requires CycleDataProvider');
  return value;
}
