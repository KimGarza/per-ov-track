import { randomUUID } from 'node:crypto';
const response = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });
const row = r => ({ date: r.entry_date, kind: r.kind, confirmed: r.confirmed, flow: r.flow, mucus: r.cervical_mucus, mood: r.mood, symptoms: r.symptoms, notes: r.notes, diary: r.diary, diaryStyle: r.diary_style, reflection: r.reflection, deleted: !!r.deleted_at, revision: Number(r.sync_revision) });
export async function handleCycleSync(db, userSub, method, body) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query('SELECT id FROM users WHERE cognito_sub=$1', [userSub]);
    if (!user.rows.length) { await client.query('ROLLBACK'); return response(404, { error: 'Account not initialized' }); }
    const userId = user.rows[0].id;
    await client.query('INSERT INTO cycle_sync_accounts(user_id) VALUES($1) ON CONFLICT DO NOTHING', [userId]);
    const stateResult = await client.query('SELECT revision,generation,to_char(reset_from,'YYYY-MM-DD') AS reset_from FROM cycle_sync_accounts WHERE user_id=$1 FOR UPDATE', [userId]);
    const state = stateResult.rows[0];
    if (method === 'GET') {
      const since = Number(body.since ?? 0);
      if (!Number.isSafeInteger(since) || since < 0) { await client.query('ROLLBACK'); return response(400, { error: 'Invalid cursor' }); }
      const result = await client.query(`SELECT to_char(entry_date,'YYYY-MM-DD') AS entry_date,kind,confirmed,flow,cervical_mucus,mood,symptoms,notes,diary,diary_style,reflection,deleted_at,sync_revision
        FROM cycle_day_entries WHERE user_id=$1 AND sync_revision>$2 ORDER BY sync_revision,entry_date LIMIT 251`, [userId, since]);
      await client.query('COMMIT');
      return response(200, { generation: Number(state.generation), resetFrom: state.reset_from, revision: Number(state.revision), entries: result.rows.slice(0,250).map(row), nextCursor: result.rows.length > 250 ? Number(result.rows[249].sync_revision) : null });
    }
    if (method !== 'POST') { await client.query('ROLLBACK'); return response(405, { error: 'Method not allowed' }); }
    const { mutationId, generation, baseRevision, entry } = body;
    if (typeof mutationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(mutationId) || !Number.isSafeInteger(generation) || !Number.isSafeInteger(baseRevision) || !entry || typeof entry.date !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(entry.date) || Number.isNaN(Date.parse(entry.date))) {
      await client.query('ROLLBACK'); return response(400, { error: 'Invalid mutation' });
    }
    if (generation !== Number(state.generation)) { await client.query('ROLLBACK'); return response(409, { error: 'RESET_GENERATION_CHANGED', generation: Number(state.generation) }); }
    const existing = await client.query('SELECT revision FROM cycle_sync_mutations WHERE user_id=$1 AND mutation_id=$2', [userId, mutationId]);
    if (existing.rows.length) { await client.query('COMMIT'); return response(200, { revision: Number(existing.rows[0].revision), generation, duplicate: true }); }
    const previous = await client.query('SELECT sync_revision FROM cycle_day_entries WHERE user_id=$1 AND entry_date=$2::date', [userId, entry.date]);
    if (previous.rows.length && Number(previous.rows[0].sync_revision) > baseRevision) {
      await client.query('ROLLBACK'); return response(409, { error: 'ENTRY_CONFLICT', date: entry.date });
    }
    if (!entry.deleted && ![null,'menstrual','ovulation'].includes(entry.kind ?? null)) { await client.query('ROLLBACK'); return response(400, { error: 'Invalid cycle marking' }); }
    if (!entry.deleted && entry.kind && entry.date > new Date().toISOString().slice(0,10)) { await client.query('ROLLBACK'); return response(400, { error: 'Future cycle marking' }); }
    const revision = Number(state.revision) + 1;
    const safeText = (value, max) => typeof value === 'string' ? value.slice(0,max) : null;
    await client.query(`INSERT INTO cycle_day_entries (id,user_id,entry_date,kind,confirmed,flow,cervical_mucus,mood,symptoms,notes,diary,diary_style,reflection,deleted_at,sync_revision)
      VALUES($1,$2,$3::date,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15)
      ON CONFLICT(user_id,entry_date) DO UPDATE SET kind=EXCLUDED.kind,confirmed=EXCLUDED.confirmed,flow=EXCLUDED.flow,cervical_mucus=EXCLUDED.cervical_mucus,
      mood=EXCLUDED.mood,symptoms=EXCLUDED.symptoms,notes=EXCLUDED.notes,diary=EXCLUDED.diary,diary_style=EXCLUDED.diary_style,reflection=EXCLUDED.reflection,
      deleted_at=EXCLUDED.deleted_at,sync_revision=EXCLUDED.sync_revision,updated_at=NOW()`, [
      randomUUID(),userId,entry.date,entry.deleted ? null : entry.kind ?? null,entry.confirmed !== false,
      entry.deleted ? null : entry.flow ?? null,entry.deleted ? null : entry.mucus ?? null,
      entry.deleted ? null : safeText(entry.mood,200),entry.deleted ? null : safeText(entry.symptoms,5000),
      entry.deleted ? null : safeText(entry.notes,5000),entry.deleted ? null : safeText(entry.diary,20000),
      entry.deleted ? null : entry.diaryStyle ? JSON.stringify(entry.diaryStyle) : null,
      entry.deleted ? null : entry.reflection ? JSON.stringify(entry.reflection) : null,
      entry.deleted ? new Date() : null,revision
    ]);
    await client.query('UPDATE cycle_sync_accounts SET revision=$2 WHERE user_id=$1', [userId,revision]);
    await client.query('INSERT INTO cycle_sync_mutations(user_id,mutation_id,revision) VALUES($1,$2,$3)', [userId,mutationId,revision]);
    await client.query('COMMIT');
    return response(200, { revision, generation });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Cycle sync failed', { code: error.code, name: error.name });
    return response(503, { error: 'Synchronization unavailable' });
  } finally { client.release(); }
}
