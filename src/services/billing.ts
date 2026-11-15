import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { PurchasesPackage } from 'react-native-purchases';

let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work, work);
  queue = result.catch(() => {});
  return result;
}
export function billingUnavailableReason(): string | null {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return 'Subscriptions are managed in the Android or iPhone app.';
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return 'Use an installed Crimson Rhythm build to manage subscriptions.';
  const key = Platform.OS === 'android' ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY : process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  return key?.trim() ? null : 'Subscriptions are not available in this build yet.';
}
async function sdkFor(userId: string) {
  const reason = billingUnavailableReason();
  if (reason) throw new Error(reason);
  if (!userId) throw new Error('Sign in to manage your subscription.');
  const Purchases = (await import('react-native-purchases')).default;
  const apiKey = (Platform.OS === 'android' ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY : process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY)!.trim();
  if (!(await Purchases.isConfigured())) Purchases.configure({ apiKey, appUserID: userId });
  else if (await Purchases.getAppUserID() !== userId) await Purchases.logIn(userId);
  return Purchases;
}
export function loadBilling(userId: string) {
  return serialize(async () => {
    const sdk = await sdkFor(userId);
    await sdk.invalidateCustomerInfoCache();
    const customerInfo = await sdk.getCustomerInfo();
    const offerings = await sdk.getOfferings();
    return { customerInfo, packages: offerings.current?.availablePackages ?? [] };
  });
}
export function buyPackage(userId: string, item: PurchasesPackage) {
  return serialize(async () => (await sdkFor(userId)).purchasePackage(item));
}
export function restoreBilling(userId: string) {
  return serialize(async () => (await sdkFor(userId)).restorePurchases());
}
export function manageBilling(userId: string) {
  return serialize(async () => (await sdkFor(userId)).showManageSubscriptions());
}
export function clearBillingIdentity() {
  return serialize(async () => {
    if (billingUnavailableReason()) return;
    const sdk = (await import('react-native-purchases')).default;
    if (await sdk.isConfigured() && !(await sdk.isAnonymous())) await sdk.logOut();
  });
}
