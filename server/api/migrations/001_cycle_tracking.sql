-- Run after the existing users table is created. Never store cycle data in logs.
CREATE TABLE IF NOT EXISTS cycle_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  onboarding_completed_at TIMESTAMPTZ,
  last_period_start DATE,
  last_ovulation_date DATE,
  pregnancy_intent TEXT CHECK (pregnancy_intent IN ('trying','struggling','no','pregnant','unsure')),
  cycle_length_days SMALLINT NOT NULL DEFAULT 28 CHECK (cycle_length_days BETWEEN 21 AND 45),
  period_length_days SMALLINT NOT NULL DEFAULT 5 CHECK (period_length_days BETWEEN 1 AND 10),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cycle_day_entries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  kind TEXT CHECK (kind IN ('menstrual','ovulation')),
  confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  flow TEXT CHECK (flow IN ('spotting','light','normal','heavy')),
  cervical_mucus TEXT CHECK (cervical_mucus IN ('dry','sticky','creamy','watery','stretchy')),
  mood TEXT,
  symptoms TEXT,
  notes TEXT,
  diary TEXT,
  diary_style JSONB,
  reflection JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);
CREATE INDEX IF NOT EXISTS cycle_day_entries_user_date_idx ON cycle_day_entries (user_id, entry_date DESC);
-- All queries must scope by authenticated Cognito sub -> users.id.
-- Prediction data is derived client-side; never persist estimates as confirmed observations.
