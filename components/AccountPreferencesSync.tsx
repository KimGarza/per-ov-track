import { useEffect, useRef } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';
import { useAppTheme } from '@/components/ThemeProvider';
import { themes, type ThemeName } from '@/constants/Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Runs inside both providers; keeps account preferences separate from local theme rendering.
export function AccountPreferencesSync() {
  const { session, profile } = useAuth();
  const { name, setName } = useAppTheme();
  const hydrated = useRef<string | null>(null);
  const previous = useRef(name);
  const initialized = useRef(false);
  const api = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  const account = profile?.sub;
  useEffect(() => {
    if (!account || !session || !api) { hydrated.current = null; return; }
    let active = true;
    const run = async () => {
      try {
        const response = await fetch(`${api}/users/me/preferences`, { headers: { Authorization: `Bearer ${session.idToken}` } });
        if (!response.ok) return;
        const body = await response.json();
        const remote = body.preferences?.theme as ThemeName | undefined;
        if (active && remote && remote in themes) {
          const local = await AsyncStorage.getItem('crimson-rhythm:theme:v1');
          if (active && !local) setName(remote);
          else if (active && local && local !== remote) {
            // Prefer the explicit local selection and persist it to the account.
            await fetch(`${api}/users/me/preferences`, { method: 'PUT', headers: { Authorization: `Bearer ${session.idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: local }) });
          }
        }
        if (active) { hydrated.current = account; initialized.current = true; }
      } catch { /* Retain the locally selected theme when offline. */ }
    };
    void run();
    return () => { active = false; };
  }, [account, session, api, setName]);
  useEffect(() => {
    if (previous.current === name) return;
    previous.current = name;
    if (!account || !session || !api || hydrated.current !== account) return;
    void fetch(`${api}/users/me/preferences`, { method: 'PUT', headers: { Authorization: `Bearer ${session.idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: name }) }).catch(() => {});
  }, [name, account, session, api]);
  return null;
}
