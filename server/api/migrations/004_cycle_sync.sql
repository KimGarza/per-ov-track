-- Versioned per-account synchronization. Keep tombstones without deleted health content.
CREATE TABLE IF NOT EXISTS cycle_sync_accounts (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  revision BIGINT NOT NULL DEFAULT 0,
  generation BIGINT NOT NULL DEFAULT 0,
  reset_from DATE
);
ALTER TABLE cycle_day_entries ADD COLUMN IF NOT EXISTS sync_revision BIGINT NOT NULL DEFAULT 0;
ALTER TABLE cycle_day_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS cycle_sync_mutations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mutation_id UUID NOT NULL,
  revision BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, mutation_id)
);
CREATE INDEX IF NOT EXISTS cycle_day_entries_sync_idx ON cycle_day_entries(user_id, sync_revision);

-- Backfill legacy entries so a new device can retrieve previously saved history.
INSERT INTO cycle_sync_accounts(user_id)
SELECT DISTINCT user_id FROM cycle_day_entries ON CONFLICT DO NOTHING;
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY entry_date) AS sequence
  FROM cycle_day_entries WHERE sync_revision=0
)
UPDATE cycle_day_entries e SET sync_revision=n.sequence FROM numbered n WHERE e.id=n.id;
UPDATE cycle_sync_accounts a SET revision=COALESCE((
  SELECT MAX(sync_revision) FROM cycle_day_entries e WHERE e.user_id=a.user_id
),0);
