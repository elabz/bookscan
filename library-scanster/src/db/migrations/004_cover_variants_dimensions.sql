
-- Migration to add cover variant fields and book dimensions

-- Add the new columns to the books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS cover_small_url TEXT,
ADD COLUMN IF NOT EXISTS cover_large_url TEXT,
ADD COLUMN IF NOT EXISTS width TEXT,
ADD COLUMN IF NOT EXISTS height TEXT;

-- Create an index for faster queries on cover URLs
CREATE INDEX IF NOT EXISTS idx_books_cover_urls ON public.books(cover_url, cover_small_url, cover_large_url);

-- Update RLS policies to allow access to the new fields
-- (The existing policies should already cover these new columns, but this is just to be explicit)
ALTER POLICY books_select_policy ON public.books USING (true);
