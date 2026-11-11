import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { applyLoggedRange, dateKey, emptyCycleData, parseDate, readCycleData, type CycleObservation, type DiaryStyle, type CycleData, type CycleKind, type JournalEntry, type ReflectionEntry } from '@/utils/cycle';

import { useAuth } from '@/src/providers/AuthProvider';
import { defaultOnboarding, type CycleOnboarding } from '@/utils/onboarding';
import { changedDates, entryForDay, loadSyncState, saveSyncState, syncAccount } from '@/src/services/cycleSync';

const onboardingKey = 'crimson-rhythm:cycle-onboarding:v1';
const storageKey = 'crimson-rhythm:cycle-data:v1';
const createMutationId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => { const n = Math.floor(Math.random() * 16); return (char === 'x' ? n : (n & 3 | 8)).toString(16); });
function useCycleState() {
  const { session, ready: authReady, profile } = useAuth();
  const accountId = session?.idToken && profile?.sub ? profile.sub : null;
  const accountStorageKey = accountId ? `${storageKey}:${accountId}` : null;
  const accountOnboardingKey = accountId ? `${onboardingKey}:${accountId}` : null;
  const api = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  const [data, setData] = useState<CycleData>(emptyCycleData);
  const [onboarding, setOnboarding] = useState<CycleOnboarding>(defaultOnboarding);
  const current = useRef(data);
  const queue = useRef(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'pending' | 'syncing'>('saved');
  // The effect only starts asynchronous storage work; state is updated after it resolves.
  // The active flag prevents an old account's load from updating a newly signed-in account.
  const load = useCallback(async (active: () => boolean = () => true) => {
    if (!authReady || !accountStorageKey || !accountOnboardingKey) return;
    try {
      const [saved, savedOnboarding] = await Promise.all([
        AsyncStorage.getItem(accountStorageKey),
        AsyncStorage.getItem(accountOnboardingKey),
      ]);
      if (!active()) return;
      const next = saved ? readCycleData(saved) : emptyCycleData();
      const answers = savedOnboarding ? { ...defaultOnboarding(), ...JSON.parse(savedOnboarding) } : defaultOnboarding();
      current.current = next;
      setData(next);
      setOnboarding(answers);
      setError(null);
      setReady(true);
      if (session && api && !answers.completed) {
        try {
          const response = await fetch(`${api}/cycle/profile`, { headers: { Authorization: `Bearer ${session.idToken}` } });
          if (response.ok && active()) {
            const remote = (await response.json()).profile;
            if (remote?.onboarding_completed_at && active()) {
              const restored = { completed: true, lastPeriodStart: remote.last_period_start?.slice(0,10) ?? undefined,
                lastOvulation: remote.last_ovulation_date?.slice(0,10) ?? undefined, pregnancyIntent: remote.pregnancy_intent ?? undefined,
                cycleLength: remote.cycle_length_days ?? 28, periodLength: remote.period_length_days ?? 5 };
              await AsyncStorage.setItem(accountOnboardingKey, JSON.stringify(restored));
              if (active()) setOnboarding(restored);
            }
          }
        } catch { /* Local tracking remains available without connectivity. */ }
      }
    } catch {
      if (active()) setError('Your saved data could not be loaded. Please try again.');
    }
  }, [authReady, accountStorageKey, accountOnboardingKey, session, api]);
  useEffect(() => {
    let active = true;
    // Defer the initial state reset to the async continuation, avoiding
    // synchronous setState during the effect's execution.
    const initialize = async () => {
      await Promise.resolve();
      if (!active) return;
      current.current = emptyCycleData();
      setData(emptyCycleData());
      setOnboarding(defaultOnboarding());
      setError(null);
      setReady(false);
      await load(() => active);
    };
    void initialize();
    return () => { active = false; };
  }, [load]);
  const commit = useCallback((update: (previous: CycleData) => CycleData) => {
    if (!ready || !accountStorageKey) return Promise.reject(new Error('Wait for your account data to load.'));
    const operation = queue.current.then(async () => {
      const previousSnapshot = current.current;
      const next = update(previousSnapshot);
      await AsyncStorage.setItem(accountStorageKey, JSON.stringify(next));
      current.current = next;
      setData(next);
      if (accountId) {
        const state = await loadSyncState(accountId);
        const changed = changedDates(previousSnapshot, next);
        for (const date of changed) {
          const entry = entryForDay(next, date);
          state.pending = state.pending.filter(item => item.entry.date !== date);
          state.pending.push({ mutationId: createMutationId(), generation: state.generation, baseRevision: state.revision, entry });
        }
        await saveSyncState(accountId, state);
        if (changed.length) setSyncStatus('pending');
      }

    });
    queue.current = operation.catch(() => {});
    return operation;
  }, [ready, accountId, accountStorageKey]);
  const saveRange = useCallback((kind: CycleKind | null, start: string, end: string, observation?: CycleObservation) => {
    if (kind && (start > dateKey(new Date()) || end > dateKey(new Date()))) return Promise.reject(new Error('Cannot record future menstrual or ovulation dates.'));
    return commit(previous => applyLoggedRange(previous, kind, start, end, dateKey(new Date()), observation));
  }, [commit]);
  const saveJournal = useCallback((day: string, entry: JournalEntry) => {
    const key = dateKey(parseDate(day));
    return commit(previous => ({ ...previous, journal: { ...previous.journal, [key]: entry } }));
  }, [commit]);
  const saveDay = useCallback((day: string, kind: CycleKind | null, entry: JournalEntry, confirmed = true, observation?: CycleObservation) => {
    const key = dateKey(parseDate(day));
    if (kind && key > dateKey(new Date())) return Promise.reject(new Error('Cannot record future menstrual or ovulation dates.'));
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
    if (!accountOnboardingKey) throw new Error('Account unavailable');
    await AsyncStorage.setItem(accountOnboardingKey, JSON.stringify(answers));
    await AsyncStorage.setItem(`${accountOnboardingKey}:pending`, 'true');
    if (session && api) {
      try { const response = await fetch(`${api}/cycle/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.idToken}` }, body: JSON.stringify(answers) }); if (response.ok) await AsyncStorage.removeItem(`${accountOnboardingKey}:pending`); }
      catch { console.warn('Profile cloud sync unavailable'); }
    }
    setOnboarding(answers);
  }, [commit, session, api, accountOnboardingKey]);
  const syncNow = useCallback(() => {
    if (!accountId || !session || !api || !accountStorageKey || !ready) return Promise.resolve();
    const operation = queue.current.then(async () => {
      setSyncStatus('syncing');
      try { return await syncAccount(api, session.idToken, accountId, current.current, async next => {
      await AsyncStorage.setItem(accountStorageKey, JSON.stringify(next));
      current.current = next;
      setData(next);
    });
        if (accountOnboardingKey && await AsyncStorage.getItem(`${accountOnboardingKey}:pending`)) {
          const saved = await AsyncStorage.getItem(accountOnboardingKey);
          if (saved) {
            const response = await fetch(`${api}/cycle/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.idToken}` }, body: saved });
            if (response.ok) await AsyncStorage.removeItem(`${accountOnboardingKey}:pending`);
          }
        }
      } finally { /* Status is updated after the operation settles. */ }
    });
    operation.then(() => setSyncStatus('saved'), () => setSyncStatus('pending'));
    queue.current = operation.then(() => {}, () => {});
    return operation.then(() => {});
  }, [accountId, session, api, accountStorageKey, accountOnboardingKey, ready]);
  useEffect(() => {
    if (!ready || !accountId) return;
    const timer = setTimeout(() => { void syncNow().catch(() => {}); }, 1500);
    return () => clearTimeout(timer);
  }, [ready, accountId, data, syncNow]);
  useEffect(() => {
    if (!ready || !accountId) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void syncNow().catch(() => {});
    });
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void syncNow().catch(() => {});
    }, 60_000);
    return () => { subscription.remove(); clearInterval(interval); };
  }, [ready, accountId, syncNow]);
  const resetCycleData = useCallback(async (from: string | null) => {
    if (!ready || !session || !api || !accountStorageKey || !accountOnboardingKey) throw new Error('Account connection is required to reset data.');
    if (from && (dateKey(parseDate(from)) > dateKey(new Date()))) throw new Error('Choose today or an earlier date.');
    // Serialize with outstanding writes so an older upload cannot restore deleted entries.
    await queue.current;
    // Delete remotely before touching local records; never re-upload deleted days.
    const response = await fetch(`${api}/cycle/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.idToken}` }, body: JSON.stringify(from ? { scope: 'from', from } : { scope: 'all' }) });
    if (!response.ok) throw new Error('Could not reset cloud data. Nothing was deleted locally.');
    const responseBody = await response.json();
    await saveSyncState(accountId!, { generation: responseBody.generation, revision: responseBody.revision, pending: [], dirty: false });
    const filter = <T,>(values?: Record<string, T>) => Object.fromEntries(Object.entries(values ?? {}).filter(([day]) => from && day < from)) as Record<string, T>;
    const next: CycleData = from ? {
      ...current.current, days: filter(current.current.days), journal: filter(current.current.journal),
      observations: filter(current.current.observations), pendingDays: filter(current.current.pendingDays),
      diary: filter(current.current.diary), diaryStyles: filter(current.current.diaryStyles),
      reflections: filter(current.current.reflections),
    } : emptyCycleData();
    await AsyncStorage.setItem(accountStorageKey, JSON.stringify(next));
    if (!from) { await AsyncStorage.removeItem(accountOnboardingKey); setOnboarding(defaultOnboarding()); }
    current.current = next;
    setData(next);
  }, [ready, session, api, accountId, accountStorageKey, accountOnboardingKey]);
  return { data, onboarding, syncStatus, syncNow, resetCycleData, saveOnboarding, saveDiary, saveReflection, ready, error, retry: load, saveRange, saveJournal, saveDay };
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
