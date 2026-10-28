import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import pg from 'pg';

const secrets = new SecretsManagerClient({});
let poolPromise;
const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});
async function pool() {
  if (!poolPromise) {
    poolPromise = (async () => {
      const result = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }));
      const credential = JSON.parse(result.SecretString);
      const ca = readFileSync(new URL('./rds-ca.pem', import.meta.url), 'utf8');
      return new pg.Pool({
        host: process.env.DB_HOST,
        port: 5432,
        database: process.env.DB_NAME,
        user: credential.username,
        password: credential.password,
        ssl: { ca, rejectUnauthorized: true },
        max: 2,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
      });
    })().catch(err => { poolPromise = undefined; throw err; });
  }
  return poolPromise;
}
export async function handler(event) {
  const method = event.requestContext?.http?.method;
  const path = event.rawPath ?? '';
  if (method === 'GET' && path.endsWith('/health')) return json(200, { status: 'ok' });
  // Internal database health check. API Gateway's catch-all route still requires Cognito JWT.
  // GitHub Actions invokes this directly with IAM; no public unauthenticated DB route is created.
  if (method === 'GET' && path === '/db-health') {
    try {
      const db = await pool();
      const result = await db.query('SELECT 1 AS connected');
      return json(result.rows[0]?.connected === 1 ? 200 : 503, {
        status: result.rows[0]?.connected === 1 ? 'ok' : 'unavailable',
      });
    } catch (error) {
      console.error('Private database health check failed', { name: error.name, code: error.code });
      return json(503, { status: 'unavailable' });
    }
  }
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!userId) return json(401, { error: 'Authentication required' });
  if (!path.endsWith('/db-test') || !['GET', 'POST'].includes(method)) return json(404, { error: 'Not found' });
  try {
    const db = await pool();
    // Development-only smoke test: no user-entered data or private cycle information.
    await db.query(`CREATE TABLE IF NOT EXISTS api_smoke_tests (
      id UUID PRIMARY KEY, user_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    if (method === 'POST') {
      const id = randomUUID();
      await db.query('INSERT INTO api_smoke_tests (id, user_id) VALUES ($1, $2)', [id, userId]);
      return json(201, { id, created: true });
    }
    const { rows } = await db.query(
      'SELECT id, created_at FROM api_smoke_tests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [userId],
    );
    return json(200, { records: rows });
  } catch (error) {
    console.error('Database smoke test failed', { name: error.name, code: error.code });
    return json(503, { error: 'Database connection unavailable' });
  }
}
