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
