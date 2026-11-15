CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY,
  cognito_sub TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Feedback','Technical issue','Account issue','Billing','Other')),
  message TEXT NOT NULL,
  reply_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS support_messages_created_idx ON support_messages(created_at DESC);
