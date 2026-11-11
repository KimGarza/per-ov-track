CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'grace' CHECK(theme IN ('grace','petal','burgundy','sanctuary')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
