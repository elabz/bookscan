-- Migration 005: Profile fields, locations, collections, book_images

-- 1. Extend users table with profile fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reading_goal INTEGER;

-- 2. Physical locations (hierarchical: room > bookcase > shelf)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('room', 'bookcase', 'shelf')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_user_id ON public.locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON public.locations(parent_id);

-- 3. Logical collections/categories
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);

-- 4. Add location_id to user_books
ALTER TABLE public.user_books ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- 5. Book-collection junction (many-to-many)
CREATE TABLE IF NOT EXISTS public.book_collections (
  book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  PRIMARY KEY (book_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_book_collections_user_id ON public.book_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_book_collections_collection_id ON public.book_collections(collection_id);

-- 6. Book images (multiple photos per book)
CREATE TABLE IF NOT EXISTS public.book_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  url_small TEXT,
  url_large TEXT,
  is_cover BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_book_images_book_id ON public.book_images(book_id);
CREATE INDEX IF NOT EXISTS idx_book_images_user_id ON public.book_images(user_id);
