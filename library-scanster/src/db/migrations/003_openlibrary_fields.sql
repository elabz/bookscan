
-- Migration to add new fields from OpenLibrary API response
-- This adds support for identifiers, classifications, links, subjects, etc.

-- Add new columns to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS identifiers JSONB;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS classifications JSONB;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS links JSONB;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS subjects JSONB;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS publish_places JSONB;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS excerpts JSONB;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS number_of_pages INTEGER;

-- Note: We're using JSONB for complex nested structures to allow
-- for flexible storage of the varying data that can come from OpenLibrary

-- Update existing tables - add comment for documentation purposes
COMMENT ON TABLE public.books IS 'Stores book information including metadata from OpenLibrary';

-- Add index for JSONB identifiers to improve search performance for ISBN lookups
CREATE INDEX IF NOT EXISTS idx_books_identifiers ON public.books USING GIN (identifiers);

-- Add index for subjects to improve search performance
CREATE INDEX IF NOT EXISTS idx_books_subjects ON public.books USING GIN (subjects);

