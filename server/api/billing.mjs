// Called only after Cognito authentication. Never accept an app_user_id from the client.
export async function fetchBillingStatus({ userId, apiKey, fetchImpl = fetch, now = Date.now(), allowSandbox = false }) {
  if (!userId || !apiKey) throw new Error('Billing is not configured');
  const response = await fetchImpl(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Billing provider unavailable');
  const data = await response.json();
  if (!data?.subscriber?.entitlements || !data.subscriber.subscriptions) throw new Error('Invalid billing response');
  const entitlement = data.subscriber.entitlements.premium;
  if (!entitlement) return { active: false, expiresAt: null };
  // Only recurring store products are offered by this app. Unknown products fail closed.
  const subscription = data.subscriber.subscriptions[entitlement.product_identifier];
  if (!subscription || (!allowSandbox && subscription.is_sandbox !== false) || subscription.refunded_at) return { active: false, expiresAt: null };
  const expiry = entitlement.expires_date;
  const grace = entitlement.grace_period_expires_date ?? subscription.grace_period_expires_date;
  const expiration = Date.parse(expiry ?? '');
  const graceExpiration = Date.parse(grace ?? '');
  const active = Number.isFinite(expiration) && expiration > now || Number.isFinite(graceExpiration) && graceExpiration > now;
  return { active, expiresAt: active && graceExpiration > expiration ? grace : expiry ?? null };
}
