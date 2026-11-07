import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const domain = process.env.EXPO_PUBLIC_COGNITO_DOMAIN?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID?.trim();
export const redirectUri = 'crimsonrhythm://auth/callback';
const storageKey = 'crimson-rhythm-session-v1';

export type Session = { accessToken: string; idToken: string; refreshToken?: string; expiresAt: number };
export type Profile = { sub: string; email?: string; name?: string; given_name?: string; family_name?: string };

export function authConfig() {
  if (!domain || !clientId) throw new Error('Cognito is not configured. Set EXPO_PUBLIC_COGNITO_DOMAIN and EXPO_PUBLIC_COGNITO_CLIENT_ID.');
  return { clientId, discovery: {
    authorizationEndpoint: `https://${domain}/oauth2/authorize`,
    tokenEndpoint: `https://${domain}/oauth2/token`,
    revocationEndpoint: `https://${domain}/oauth2/revoke`,
  } };
}

export function decodeProfile(idToken: string): Profile {
  try {
    const payload = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decoded = globalThis.atob(padded);
    return JSON.parse(decoded) as Profile;
  } catch { return { sub: '' }; }
}

export function toSession(token: AuthSession.TokenResponse, previousRefresh?: string): Session {
  if (!token.accessToken || !token.idToken) throw new Error('Cognito did not return the expected tokens.');
  return {
    accessToken: token.accessToken, idToken: token.idToken,
    refreshToken: token.refreshToken ?? previousRefresh,
    expiresAt: Math.floor(Date.now() / 1000) + (token.expiresIn ?? 3600),
  };
}

export async function saveSession(session: Session | null) {
  if (Platform.OS === 'web') {
    // Never persist OAuth tokens in browser localStorage; web sessions are memory-only.
    return;
  }
  if (session) await SecureStore.setItemAsync(storageKey, JSON.stringify(session));
  else await SecureStore.deleteItemAsync(storageKey);
}

export async function loadSession(): Promise<Session | null> {
  if (Platform.OS === 'web') return null;
  const raw = await SecureStore.getItemAsync(storageKey);
  if (!raw) return null;
  try { return JSON.parse(raw) as Session; } catch { await saveSession(null); return null; }
}

export async function refreshSession(session: Session): Promise<Session | null> {
  if (session.expiresAt > Date.now() / 1000 + 90) return session;
  if (!session.refreshToken) return null;
  try {
    const { clientId, discovery } = authConfig();
    const refreshed = await AuthSession.refreshAsync({ clientId, refreshToken: session.refreshToken }, discovery);
    const next = toSession(refreshed, session.refreshToken);
    await saveSession(next);
    return next;
  } catch { await saveSession(null); return null; }
}

export async function revokeSession(session: Session | null) {
  if (session?.refreshToken) {
    try {
      const { clientId, discovery } = authConfig();
      await AuthSession.revokeAsync({ clientId, token: session.refreshToken }, discovery);
    } catch { /* Local sign-out still proceeds if network revocation fails. */ }
  }
  await saveSession(null);
}
