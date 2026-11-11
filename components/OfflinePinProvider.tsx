import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/src/providers/AuthProvider';
import { useAppTheme } from '@/components/ThemeProvider';

type PinContext = { enabled: boolean; enable: (pin: string) => Promise<void>; disable: (pin: string) => Promise<boolean> };
const Context = createContext<PinContext>({ enabled: false, enable: async () => {}, disable: async () => false });
export const useOfflinePin = () => useContext(Context);
const keyFor = (sub: string) => `crimson.pin.${sub}`;
export function OfflinePinProvider({ children }: PropsWithChildren) {
  const { profile, session } = useAuth();
  const { theme } = useAppTheme();
  const sub = session ? profile?.sub : null;
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!sub || Platform.OS === 'web') return;
    void SecureStore.getItemAsync(keyFor(sub)).then(pin => {
      if (active) { setEnabled(!!pin); setLocked(!!pin); }
    });
    return () => { active = false; };
  }, [sub]);
  useEffect(() => {
    if (!sub || !enabled) return;
    const listener = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') setLocked(true);
    });
    return () => listener.remove();
  }, [sub, enabled]);
  const enable = async (pin: string) => {
    if (!sub || Platform.OS === 'web') throw new Error('Offline PIN is available on mobile only.');
    if (!/^\\d{6}$/.test(pin)) throw new Error('Choose exactly six digits.');
    await SecureStore.setItemAsync(keyFor(sub), pin);
    setEnabled(true);
  };
  const disable = async (pin: string) => {
    if (!sub) return false;
    if (await SecureStore.getItemAsync(keyFor(sub)) !== pin) return false;
    await SecureStore.deleteItemAsync(keyFor(sub));
    setEnabled(false); setLocked(false);
    return true;
  };
  const unlock = async () => {
    if (!sub) return;
    if (input === await SecureStore.getItemAsync(keyFor(sub))) { setLocked(false); setInput(''); setError(''); }
    else { setError('Incorrect PIN'); setInput(''); }
  };
  return <Context.Provider value={{ enabled, enable, disable }}>
    {children}
    <Modal visible={!!sub && locked} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: theme.colors.background }}>
        <Text style={{ fontFamily: theme.fonts.heading, fontSize: 32, color: theme.colors.text, textAlign: 'center' }}>Crimson Rhythm</Text>
        <Text style={{ color: theme.colors.text, textAlign: 'center', marginVertical: 18 }}>Enter your six-digit app PIN</Text>
        <TextInput secureTextEntry keyboardType="number-pad" maxLength={6} value={input} onChangeText={setInput} accessibilityLabel="Offline app PIN" style={{ backgroundColor: theme.colors.surface, color: theme.colors.text, padding: 16, borderRadius: 12 }} />
        {!!error && <Text accessibilityRole="alert" style={{ color: theme.colors.todayPeriod }}>{error}</Text>}
        <Pressable accessibilityRole="button" onPress={() => { void unlock(); }} style={{ alignSelf: 'center', backgroundColor: theme.colors.roseWash, borderRadius: 12, padding: 14, marginTop: 16 }}><Text style={{ color: theme.colors.text }}>Unlock</Text></Pressable>
      </View>
    </Modal>
  </Context.Provider>;
}
