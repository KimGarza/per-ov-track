import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import pg from 'pg';
import { applyMigrations } from './migrate.mjs';
import { handleCycleSync } from './cycle-sync.mjs';

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
  // Direct IAM-authorized Lambda invoke only; HTTP requests always have requestContext.
  if (event?.internalOperation === 'migrate' && !event.requestContext) {
    try { return json(200, await applyMigrations(await pool())); }
    catch (error) { console.error('Schema migration failed', { code: error.code, name: error.name }); return json(503, { error: 'Migration failed' }); }
  }
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
  if (method === 'POST' && path.endsWith('/users/me/sync')) {
    try {
      const claims = event.requestContext.authorizer.jwt.claims;
      const db = await pool();
      // Bootstrap schema for dev. Replace with versioned migrations before production.
      await db.query(`CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        cognito_sub TEXT UNIQUE NOT NULL,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        display_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      const { rows } = await db.query(
        `INSERT INTO users (id, cognito_sub, email, first_name, last_name, display_name)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (cognito_sub) DO UPDATE SET
           last_login_at = NOW(), updated_at = NOW(),
           email = COALESCE(EXCLUDED.email, users.email),
           first_name = COALESCE(EXCLUDED.first_name, users.first_name),
           last_name = COALESCE(EXCLUDED.last_name, users.last_name),
           display_name = COALESCE(EXCLUDED.display_name, users.display_name)
         RETURNING id, display_name, created_at`,
        [randomUUID(), userId, claims.email ?? null, claims.given_name ?? null, claims.family_name ?? null, claims.name ?? null],
      );
      return json(200, { user: rows[0] });
    } catch (error) {
      console.error('User sync failed', { name: error.name, code: error.code });
      return json(503, { error: 'Account sync temporarily unavailable' });
    }
  }
  if (method === 'GET' && path.endsWith('/users/me')) {
    try {
      const db = await pool();
      const { rows } = await db.query(
        'SELECT id, email, username, avatar, created_at FROM users WHERE cognito_sub = $1',
        [userId],
      );
      return rows.length ? json(200, { user: rows[0] }) : json(404, { error: 'Account not initialized' });
    } catch (error) {
      console.error('Account fetch failed', { name: error.name, code: error.code });
      return json(503, { error: 'Account unavailable' });
    }
  }
  if (method === 'PATCH' && path.endsWith('/users/me')) {
    try {
      const input = JSON.parse(event.body || '{}');
      if (typeof input.username !== 'string' || input.username.length > 40 || (input.username && !/^[a-zA-Z0-9_.-]{3,40}$/.test(input.username))) return json(400, { error: 'Username must be 3–40 letters, numbers, dots, underscores or hyphens, or empty.' });
      if (input.avatar != null && !['flower','dove','heart','cross','sun','leaf'].includes(input.avatar)) return json(400, { error: 'Unknown avatar' });
      const db = await pool();
      const { rows } = await db.query(
        'UPDATE users SET username = $1, avatar = COALESCE($2, avatar), updated_at = NOW() WHERE cognito_sub = $3 RETURNING username, avatar, email',
        [input.username || null, input.avatar ?? null, userId],
      );
      return rows.length ? json(200, { user: rows[0] }) : json(404, { error: 'Account not initialized' });
    } catch (error) { if (error.code === '23505') return json(409, { error: 'Username already taken' }); console.error('Account update failed', { code: error.code }); return json(503, { error: 'Account update unavailable' }); }
  }
  if (path.endsWith('/cycle/sync') && ['GET','POST'].includes(method)) {
    const input = method === 'GET' ? { since: Number(event.queryStringParameters?.since ?? 0) } : JSON.parse(event.body || '{}');
    return handleCycleSync(await pool(), userId, method, input);
  }
  if (path.endsWith('/users/me/preferences') && ['GET','PUT'].includes(method)) {
    try {
      const db = await pool();
      if (method === 'GET') {
        const { rows } = await db.query('SELECT theme FROM user_preferences WHERE user_id=(SELECT id FROM users WHERE cognito_sub=$1)', [userId]);
        return json(200, { preferences: rows[0] ?? null });
      }
      const input = JSON.parse(event.body || '{}');
      if (!['grace','petal','burgundy','sanctuary'].includes(input.theme)) return json(400, { error: 'Unknown theme' });
      const { rows } = await db.query(`INSERT INTO user_preferences(user_id,theme)
        SELECT id,$2 FROM users WHERE cognito_sub=$1
        ON CONFLICT(user_id) DO UPDATE SET theme=EXCLUDED.theme,updated_at=NOW() RETURNING theme`, [userId,input.theme]);
      return rows.length ? json(200, { preferences: rows[0] }) : json(404, { error: 'Account unavailable' });
    } catch (error) { console.error('Preferences unavailable', { code: error.code }); return json(503, { error: 'Preferences unavailable' }); }
  }
  if (method === 'POST' && path.endsWith('/cycle/reset')) {
    try {
      const input = JSON.parse(event.body || '{}');
      const scope = input.scope;
      const from = input.from;
      if (!['all', 'from'].includes(scope) || (scope === 'from' && (typeof from !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(from) || Number.isNaN(Date.parse(from)) || from > new Date().toISOString().slice(0,10)))) return json(400, { error: 'Invalid reset range' });
      const db = await pool();
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const user = await client.query('SELECT id FROM users WHERE cognito_sub=$1', [userId]);
        if (!user.rows.length) throw new Error('Account unavailable');
        const uid = user.rows[0].id;
        await client.query('INSERT INTO cycle_sync_accounts(user_id) VALUES($1) ON CONFLICT DO NOTHING', [uid]);
        const state = await client.query('SELECT revision,generation FROM cycle_sync_accounts WHERE user_id=$1 FOR UPDATE', [uid]);
        const revision = Number(state.rows[0].revision) + 1;
        await client.query('UPDATE cycle_sync_accounts SET revision=$2,generation=generation+1,reset_from=$3 WHERE user_id=$1', [uid,revision,scope === 'all' ? null : from]);
        await client.query(
          scope === 'all'
            ? 'UPDATE cycle_day_entries SET kind=NULL,flow=NULL,cervical_mucus=NULL,mood=NULL,symptoms=NULL,notes=NULL,diary=NULL,diary_style=NULL,reflection=NULL,deleted_at=NOW(),sync_revision=$2 WHERE user_id=$1'
            : 'UPDATE cycle_day_entries SET kind=NULL,flow=NULL,cervical_mucus=NULL,mood=NULL,symptoms=NULL,notes=NULL,diary=NULL,diary_style=NULL,reflection=NULL,deleted_at=NOW(),sync_revision=$3 WHERE user_id=$1 AND entry_date >= $2::date',
          scope === 'all' ? [uid,revision] : [uid,from,revision],
        );
        if (scope === 'all') {
          await client.query('DELETE FROM cycle_profiles WHERE user_id = (SELECT id FROM users WHERE cognito_sub = $1)', [userId]);
        }
        await client.query('COMMIT');
        return json(200, { reset: true, generation: Number(state.rows[0].generation)+1, revision });
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    } catch (error) { console.error('Cycle reset failed', { code: error.code }); return json(503, { error: 'Cycle reset unavailable' }); }
  }
  if (path.endsWith('/cycle/profile') && ['GET', 'PUT'].includes(method)) {
    try {
      const db = await pool();
      if (method === 'GET') {
        const { rows } = await db.query(
          'SELECT onboarding_completed_at, last_period_start, last_ovulation_date, pregnancy_intent, cycle_length_days, period_length_days FROM cycle_profiles WHERE user_id = (SELECT id FROM users WHERE cognito_sub = $1)',
          [userId],
        );
        return json(200, { profile: rows[0] ?? null });
      }
      const input = JSON.parse(event.body || '{}');
      const allowed = ['trying', 'struggling', 'no', 'pregnant', 'unsure'];
      const validDate = value => value == null || (typeof value === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && value <= new Date().toISOString().slice(0, 10));
      if (!validDate(input.lastPeriodStart) || !validDate(input.lastOvulation) || (input.pregnancyIntent != null && !allowed.includes(input.pregnancyIntent))) return json(400, { error: 'Invalid cycle profile' });
      const length = input.cycleLength ?? 28, periodLength = input.periodLength ?? 5;
      if (!Number.isInteger(length) || length < 21 || length > 45 || !Number.isInteger(periodLength) || periodLength < 1 || periodLength > 10) return json(400, { error: 'Invalid cycle lengths' });
      const { rows } = await db.query(
        `INSERT INTO cycle_profiles (user_id, onboarding_completed_at, last_period_start, last_ovulation_date, pregnancy_intent, cycle_length_days, period_length_days)
         SELECT id, NOW(), $2::date, $3::date, $4, $5, $6 FROM users WHERE cognito_sub = $1
         ON CONFLICT (user_id) DO UPDATE SET onboarding_completed_at = NOW(), last_period_start = EXCLUDED.last_period_start,
           last_ovulation_date = EXCLUDED.last_ovulation_date, pregnancy_intent = EXCLUDED.pregnancy_intent,
           cycle_length_days = EXCLUDED.cycle_length_days, period_length_days = EXCLUDED.period_length_days, updated_at = NOW()
         RETURNING user_id`,
        [userId, input.lastPeriodStart ?? null, input.lastOvulation ?? null, input.pregnancyIntent ?? null, length, periodLength],
      );
      return rows.length ? json(200, { saved: true }) : json(404, { error: 'Account not initialized' });
    } catch (error) {
      console.error('Cycle profile request failed', { name: error.name, code: error.code });
      return json(503, { error: 'Cycle profile unavailable' });
    }
  }
  if (path.endsWith('/cycle/days') && ['GET', 'PUT'].includes(method)) {
    try {
      const db = await pool();
      if (method === 'GET') {
        const { rows } = await db.query(
          'SELECT entry_date, kind, confirmed, flow, cervical_mucus, mood, symptoms, notes, diary, diary_style, reflection FROM cycle_day_entries WHERE user_id = (SELECT id FROM users WHERE cognito_sub = $1) ORDER BY entry_date DESC LIMIT 1000',
          [userId],
        );
        return json(200, { entries: rows });
      }
      // Older app versions cannot bypass reset generations and resurrect deleted entries.
      const legacy = await db.query('SELECT generation FROM cycle_sync_accounts WHERE user_id=(SELECT id FROM users WHERE cognito_sub=$1)', [userId]);
      if (legacy.rows.length && Number(legacy.rows[0].generation) > 0) return json(409, { error: 'Please update Crimson Rhythm to synchronize cycle data' });
      const input = JSON.parse(event.body || '{}');
      if (typeof input.date !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(input.date) || Number.isNaN(Date.parse(input.date)) || ![null, 'menstrual', 'ovulation'].includes(input.kind ?? null)) return json(400, { error: 'Invalid day entry' });
      if (input.kind && input.confirmed !== false && input.date > new Date().toISOString().slice(0, 10)) return json(400, { error: 'Future cycle observations are not allowed' });
      const string = (value, max = 5000) => typeof value === 'string' ? value.slice(0, max) : null;
      const flow = input.flow ?? null, mucus = input.mucus ?? null;
      if (flow && !['spotting','light','normal','heavy'].includes(flow) || mucus && !['dry','sticky','creamy','watery','stretchy'].includes(mucus)) return json(400, { error: 'Invalid observation' });
      const { rows } = await db.query(
        `INSERT INTO cycle_day_entries (id, user_id, entry_date, kind, confirmed, flow, cervical_mucus, mood, symptoms, notes, diary, diary_style, reflection)
         SELECT $2, id, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb FROM users WHERE cognito_sub = $1
         ON CONFLICT (user_id, entry_date) DO UPDATE SET kind=EXCLUDED.kind, confirmed=EXCLUDED.confirmed, flow=EXCLUDED.flow,
         cervical_mucus=EXCLUDED.cervical_mucus, mood=EXCLUDED.mood, symptoms=EXCLUDED.symptoms, notes=EXCLUDED.notes,
         diary=EXCLUDED.diary, diary_style=EXCLUDED.diary_style, reflection=EXCLUDED.reflection, updated_at=NOW()
         RETURNING id`,
        [userId, randomUUID(), input.date, input.kind ?? null, input.confirmed !== false, flow, mucus, string(input.mood, 200), string(input.symptoms), string(input.notes), string(input.diary, 20000), input.diaryStyle ? JSON.stringify(input.diaryStyle) : null, input.reflection ? JSON.stringify(input.reflection) : null],
      );
      return rows.length ? json(200, { saved: true }) : json(404, { error: 'Account not initialized' });
    } catch (error) {
      console.error('Cycle day request failed', { name: error.name, code: error.code });
      return json(503, { error: 'Cycle day unavailable' });
    }
  }
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
