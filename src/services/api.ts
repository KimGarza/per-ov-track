/**
 * Base URL is the HTTPS API Gateway stage URL, e.g. https://<api-id>.execute-api.us-east-1.amazonaws.com/dev
 * Expo inlines EXPO_PUBLIC_* at bundle time. This is public configuration, never a secret.
 */
const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

export function getApiBaseUrl(): string | undefined {
  return configuredBaseUrl;
}

export async function apiGet<T>(path: string, options: { token?: string; timeoutMs?: number } = {}): Promise<T> {
  if (!configuredBaseUrl) throw new Error('EXPO_PUBLIC_API_URL is not configured for this build.');
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('API path must start with a single slash.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);
  try {
    const response = await fetch(`${configuredBaseUrl}${path}`, {
      headers: options.token ? { Authorization: `Bearer ${options.token}` } : undefined,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`API request failed (HTTP ${response.status})`);
    return await response.json() as T;
  } finally {
    clearTimeout(timer);
  }
}

export function checkApiHealth(): Promise<{ status: string }> {
  return apiGet('/health');
}
