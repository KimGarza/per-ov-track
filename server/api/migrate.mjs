import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Invoked exclusively by IAM-authorized direct Lambda invocation, never by API Gateway.
export async function applyMigrations(pool) {
  const client = await pool.connect();
  const directory = fileURLToPath(new URL('./migrations/', import.meta.url));
  const applied = [];
  try {
    await client.query('SELECT pg_advisory_lock(76421083)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY, checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const files = readdirSync(directory).filter(name => /^\\d{3}_[a-z0-9_]+\\.sql$/.test(name)).sort();
    for (const filename of files) {
      const sql = readFileSync(join(directory, filename), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const { rows } = await client.query('SELECT checksum FROM schema_migrations WHERE filename = $1', [filename]);
      if (rows.length) {
        if (rows[0].checksum !== checksum) throw new Error(`Previously applied migration changed: ${filename}`);
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)', [filename, checksum]);
        await client.query('COMMIT');
        applied.push(filename);
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
    return { applied, total: files.length };
  } finally {
    try { await client.query('SELECT pg_advisory_unlock(76421083)'); } finally { client.release(); }
  }
}
