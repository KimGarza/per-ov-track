import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { useAuth } from '@/src/providers/AuthProvider';
import { apiGet } from '@/src/services/api';
import { billingUnavailableReason, buyPackage, loadBilling, manageBilling, restoreBilling } from '@/src/services/billing';
import { useAppTheme } from './ThemeProvider';
import { ActionButton } from './ActionButton';

type VerifiedStatus = { active: boolean; expiresAt: string | null };
export function BillingContent() {
  const { profile, session } = useAuth();
  const { styles: g } = useAppTheme();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [verified, setVerified] = useState<VerifiedStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const mounted = useRef(true);
  const locked = useRef(false);
  const userId = profile?.sub ?? '';
  const unavailable = billingUnavailableReason();
  const verify = useCallback(async () => {
    try {
      const result = await apiGet<VerifiedStatus>('/billing/status', { token: session?.idToken });
      if (mounted.current) setVerified(result);
      return result;
    } catch {
      if (mounted.current) { setVerified(null); setMessage('Store status loaded. Account verification is unavailable; please try again.'); }
      return null;
    }
  }, [session]);
  const run = useCallback(async (operation: 'load' | 'restore' | 'manage' | 'purchase', item?: PurchasesPackage) => {
    if (locked.current || !userId || unavailable) return;
    locked.current = true;
    await Promise.resolve();
    if (!mounted.current) { locked.current = false; return; }
    setBusy(true); setMessage(''); setVerified(null);
    try {
      if (operation === 'purchase' && item) {
        const result = await buyPackage(userId, item);
        if (mounted.current) setInfo(result.customerInfo);
      } else if (operation === 'restore') {
        const result = await restoreBilling(userId);
        if (mounted.current) setInfo(result);
      } else if (operation === 'manage') {
        await manageBilling(userId);
      }
      const result = await loadBilling(userId);
      if (!mounted.current) return;
      setInfo(result.customerInfo); setPackages(result.packages);
      const status = await verify();
      if (mounted.current && operation === 'restore' && status) setMessage(status.active ? 'Your subscription has been restored.' : 'No active subscription was found for this account.');
      if (mounted.current && operation === 'purchase' && status) setMessage(status.active ? 'Thank you! Your subscription is active.' : 'Your purchase is awaiting confirmation. Refresh your status shortly.');
    } catch (error) {
      if (mounted.current && !(error && typeof error === 'object' && 'userCancelled' in error && error.userCancelled)) setMessage('Unable to complete this request. Check your connection and try again.');
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [unavailable, userId, verify]);
  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(() => { if (mounted.current) return run('load'); });
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void run('load'); });
    return () => { mounted.current = false; subscription.remove(); };
  }, [run]);
  const entitlement = info?.entitlements.active.premium;
  const subscribed = !!entitlement || verified?.active;
  return <View style={{ gap: 16 }}>
    <Text style={g.body}>A monthly or annual subscription, managed through your app store.</Text>
    {unavailable ? <Text style={g.body}>{unavailable}</Text> : <>
      <Text style={g.sectionHeading}>{verified?.active ? 'Subscription active' : entitlement ? 'Store subscription found · Verifying account' : 'Choose your plan'}</Text>
      {entitlement?.expirationDate && <Text style={g.caption}>{entitlement.willRenew ? 'Renews' : 'Access until'} {new Date(entitlement.expirationDate).toLocaleDateString()}</Text>}
      {!subscribed && packages.map(item => <View key={item.identifier} style={[g.card, { gap: 10 }]}>
        <Text style={g.sectionHeading}>{item.product.title}</Text>
        <Text style={g.body}>{item.product.priceString}{item.packageType === 'MONTHLY' ? ' / month' : item.packageType === 'ANNUAL' ? ' / year' : ''}</Text>
        <ActionButton variant="primary" disabled={busy || !verified} onPress={() => { void run('purchase', item); }}>Subscribe</ActionButton>
      </View>)}
      {!busy && !subscribed && packages.length === 0 && <Text style={g.caption}>Plans are not available right now. Please try again later.</Text>}
      <ActionButton disabled={busy} onPress={() => { void run('restore'); }}>Restore purchases</ActionButton>
      <ActionButton disabled={busy} onPress={() => { void run('manage'); }}>Manage subscription</ActionButton>
      <ActionButton disabled={busy} onPress={() => { void run('load'); }}>Refresh status</ActionButton>
      <Text style={g.caption}>Payment is charged by Google Play or Apple. Subscriptions renew automatically unless canceled in your store settings. Uninstalling the app or deleting your account does not cancel a subscription. Prices and renewal periods are shown by the store before you confirm.</Text>
    </>}
    {busy && <ActivityIndicator accessibilityLabel="Loading subscription" />}
    {!!message && <Text accessibilityLiveRegion="polite" style={g.body}>{message}</Text>}
  </View>;
}
