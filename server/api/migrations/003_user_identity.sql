ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(40);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(16) NOT NULL DEFAULT 'flower';
ALTER TABLE users ADD CONSTRAINT users_avatar_choice CHECK (avatar IN ('flower','dove','heart','cross','sun','leaf'));
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique ON users (LOWER(username)) WHERE username IS NOT NULL;
