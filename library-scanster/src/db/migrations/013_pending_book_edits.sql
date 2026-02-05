CREATE TABLE IF NOT EXISTS pending_book_edits (
  id SERIAL PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  changes JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_edits_status ON pending_book_edits(status);
CREATE INDEX IF NOT EXISTS idx_pending_edits_book ON pending_book_edits(book_id);
