import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { authConfig, decodeProfile, loadSession, redirectUri, refreshSession, revokeSession, saveSession, toSession, type Profile, type Session } from '@/src/services/auth';

WebBrowser.maybeCompleteAuthSession();
type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  signIn: (provider?: 'Google' | 'SignInWithApple', mode?: 'login' | 'signup') => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<AuthContextValue | null>(null);
export const useAuth = () => {
  const context = useContext(Context);
  if (!context) throw new Error('AuthProvider missing');
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadSession();
      const current = stored ? await refreshSession(stored) : null;
      if (active) { setSession(current); setProfile(current ? decodeProfile(current.idToken) : null); setReady(true); }
    })().catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (provider?: 'Google' | 'SignInWithApple', mode: 'login' | 'signup' = 'login') => {
    const { clientId, discovery } = authConfig();
    const request = new AuthSession.AuthRequest({
      clientId, redirectUri, responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'email', 'profile'], usePKCE: true,
      extraParams: {
        ...(provider ? { identity_provider: provider } : {}),
        ...(!provider && mode === 'signup' ? { screen_hint: 'signup' } : {}),
      },
    });
    await request.makeAuthUrlAsync(discovery);
    const result = await request.promptAsync(discovery, { preferEphemeralSession: false });
    if (result.type !== 'success' || !result.params.code) {
      if (result.type === 'error') throw new Error(result.params.error_description ?? 'Authentication failed');
      return;
    }
    if (!request.codeVerifier) throw new Error('PKCE verifier missing.');
    const token = await AuthSession.exchangeCodeAsync({
      clientId, code: result.params.code, redirectUri, extraParams: { code_verifier: request.codeVerifier },
    }, discovery);
    const next = toSession(token);
    await saveSession(next);
    setSession(next);
    setProfile(decodeProfile(next.idToken));
    // Account sync is handled by the authenticated API; never send an unverified client-supplied user ID.
    try {
      const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
      if (base) {
        const response = await fetch(`${base}/users/me/sync`, { method: 'POST', headers: { Authorization: `Bearer ${next.idToken}` } });
        if (!response.ok) console.warn('Account sync failed', response.status);
      }
    } catch { console.warn('Account sync unavailable'); }
  }, []);

  const signOut = useCallback(async () => {
    await revokeSession(session);
    setSession(null); setProfile(null);
  }, [session]);
  const value = useMemo(() => ({ ready, session, profile, signIn, signOut }), [ready, session, profile, signIn, signOut]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
