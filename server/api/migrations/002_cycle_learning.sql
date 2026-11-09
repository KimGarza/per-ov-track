-- Historical predictions are immutable snapshots, not confirmed menstrual observations.
CREATE TABLE IF NOT EXISTS cycle_prediction_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  based_on_start DATE NOT NULL,
  predicted_start DATE NOT NULL,
  predicted_min DATE NOT NULL,
  predicted_max DATE NOT NULL,
  cycle_length_days SMALLINT NOT NULL CHECK (cycle_length_days BETWEEN 21 AND 45),
  history_count SMALLINT NOT NULL DEFAULT 0,
  algorithm_version SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, based_on_start, algorithm_version)
);
CREATE INDEX IF NOT EXISTS cycle_predictions_user_created_idx
  ON cycle_prediction_snapshots(user_id, created_at DESC);
-- Pregnancy / postpartum / paused state is separate from trying-to-conceive intent.
CREATE TABLE IF NOT EXISTS cycle_tracking_states (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'tracking'
    CHECK (state IN ('tracking','trying','struggling','pregnant','postpartum','paused')),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Historical cycle intervals should be derived from confirmed day entries, not
-- duplicated as mutable records that can disagree after a correction.
