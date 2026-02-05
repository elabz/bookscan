-- Add top-level LCCN column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS lccn TEXT;

-- Index for LCCN lookups
CREATE INDEX IF NOT EXISTS idx_books_lccn ON books (lccn) WHERE lccn IS NOT NULL;

-- Backfill from identifiers JSONB where available
UPDATE books
SET lccn = identifiers->'lccn'->>0
WHERE lccn IS NULL
  AND identifiers->'lccn'->>0 IS NOT NULL;
