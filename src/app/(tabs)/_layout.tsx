import { Stack } from 'expo-router';
import { SideMenuProvider } from '@/components/SideMenu';
export default function AppLayout() {
  return <SideMenuProvider><Stack screenOptions={{ headerShown: false, animation: 'fade' }} /></SideMenuProvider>;
}
