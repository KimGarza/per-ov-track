import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { applyLoggedRange, dateKey, emptyCycleData, parseDate, readCycleData, type CycleObservation, type DiaryStyle, type CycleData, type CycleKind, type JournalEntry, type ReflectionEntry } from '@/utils/cycle';

import { defaultOnboarding, type CycleOnboarding } from '@/utils/onboarding';

const onboardingKey = 'crimson-rhythm:cycle-onboarding:v1';
const storageKey = 'crimson-rhythm:cycle-data:v1';
function useCycleState() {
  const [data, setData] = useState<CycleData>(emptyCycleData);
  const [onboarding, setOnboarding] = useState<CycleOnboarding>(defaultOnboarding);
  const current = useRef(data);
  const queue = useRef(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => Promise.all([AsyncStorage.getItem(storageKey), AsyncStorage.getItem(onboardingKey)]).then(([saved, savedOnboarding]) => {
    const next = saved ? readCycleData(saved) : emptyCycleData();
    if (savedOnboarding) setOnboarding({ ...defaultOnboarding(), ...JSON.parse(savedOnboarding) });
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
  const saveRange = useCallback((kind: CycleKind | null, start: string, end: string, observation?: CycleObservation) => commit(previous => applyLoggedRange(previous, kind, start, end, dateKey(new Date()), observation)), [commit]);
  const saveJournal = useCallback((day: string, entry: JournalEntry) => {
    const key = dateKey(parseDate(day));
    return commit(previous => ({ ...previous, journal: { ...previous.journal, [key]: entry } }));
  }, [commit]);
  const saveDay = useCallback((day: string, kind: CycleKind | null, entry: JournalEntry, confirmed = true, observation?: CycleObservation) => {
    const key = dateKey(parseDate(day));
    return commit(previous => {
      const next = applyLoggedRange(previous, kind, key, key, dateKey(new Date()), observation);
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
  const saveOnboarding = useCallback(async (answers: CycleOnboarding) => {
    const period = answers.lastPeriodStart;
    const ovulation = answers.lastOvulation;
    await commit(previous => {
      let next = previous;
      if (period) next = applyLoggedRange(next, 'menstrual', period, period, dateKey(new Date()));
      if (ovulation) next = applyLoggedRange(next, 'ovulation', ovulation, ovulation, dateKey(new Date()));
      return next;
    });
    await AsyncStorage.setItem(onboardingKey, JSON.stringify(answers));
    setOnboarding(answers);
  }, [commit]);
  return { data, onboarding, saveOnboarding, saveDiary, saveReflection, ready, error, retry: load, saveRange, saveJournal, saveDay };
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
