import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// Keep server HTML and the hydration render equal, then use the client value.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  const isClient = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return isClient ? client : server;
}
