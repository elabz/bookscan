-- Add overrides JSONB column to user_books for personal text field overrides
ALTER TABLE public.user_books ADD COLUMN IF NOT EXISTS overrides JSONB DEFAULT '{}';
