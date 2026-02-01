-- Migration 006: Per-user book cover overrides
-- Allows users to set personal cover images that don't affect the global book record.
-- When null, the global books.cover_url is used.

ALTER TABLE public.user_books ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.user_books ADD COLUMN IF NOT EXISTS cover_small_url TEXT;
ALTER TABLE public.user_books ADD COLUMN IF NOT EXISTS cover_large_url TEXT;
