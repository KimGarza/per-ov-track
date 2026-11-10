-- Users must exist before cycle migrations. The existing sync endpoint remains compatible.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  cognito_sub TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
