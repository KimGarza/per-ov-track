import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { dateKey } from '@/utils/cycle';

// Refresh across midnight and when the app returns from the background.
export function useToday() {
  const [today, setToday] = useState(() => dateKey(new Date()));
  useEffect(() => {
    const update = () => setToday(dateKey(new Date()));
    const timer = setInterval(update, 60000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') update(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return today;
}
