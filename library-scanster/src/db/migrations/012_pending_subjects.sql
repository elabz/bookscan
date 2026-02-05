-- Pending subjects for admin approval
CREATE TABLE IF NOT EXISTS pending_subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approved subjects master list (for autocomplete/suggestions)
CREATE TABLE IF NOT EXISTS approved_subjects (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_subjects_status ON pending_subjects(status);
CREATE INDEX IF NOT EXISTS idx_pending_subjects_user ON pending_subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_approved_subjects_name ON approved_subjects(name);

COMMENT ON TABLE pending_subjects IS 'User-submitted subjects awaiting admin approval';
COMMENT ON TABLE approved_subjects IS 'Master list of approved subjects for suggestions';
