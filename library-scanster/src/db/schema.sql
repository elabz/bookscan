
-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the genres table
CREATE TABLE IF NOT EXISTS public.genres (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the books table
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL,
    isbn TEXT,
    cover_url TEXT,
    publisher TEXT,
    published_date TEXT,
    description TEXT,
    page_count INTEGER,
    categories TEXT[],
    language TEXT,
    edition TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the book_genres junction table
CREATE TABLE IF NOT EXISTS public.book_genres (
    id SERIAL PRIMARY KEY,
    book_id TEXT REFERENCES public.books(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES public.genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, genre_id)
);

-- Create the user_books table (joins users and books)
CREATE TABLE IF NOT EXISTS public.user_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    book_id TEXT NOT NULL REFERENCES public.books(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(user_id, book_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON public.user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_book_id ON public.user_books(book_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_book_id ON public.book_genres(book_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_genre_id ON public.book_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_genres_name ON public.genres(name);

-- Row Level Security (RLS) policies
-- Enable RLS on the tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY users_select_policy ON public.users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY users_insert_policy ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY users_update_policy ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- Genres table policies (publicly readable)
CREATE POLICY genres_select_policy ON public.genres
    FOR SELECT USING (true);

-- Only admin can insert/update genres (in a real app, you would check admin status)
CREATE POLICY genres_insert_policy ON public.genres
    FOR INSERT WITH CHECK (true);

-- Allow anyone to read books
CREATE POLICY books_select_policy ON public.books
    FOR SELECT USING (true);

-- Allow authenticated users to insert books
CREATE POLICY books_insert_policy ON public.books
    FOR INSERT WITH CHECK (true);

-- Allow public read access to book_genres
CREATE POLICY book_genres_select_policy ON public.book_genres
    FOR SELECT USING (true);

-- Allow insert access to book_genres
CREATE POLICY book_genres_insert_policy ON public.book_genres
    FOR INSERT WITH CHECK (true);

-- Only allow users to see their own user_books entries
CREATE POLICY user_books_select_policy ON public.user_books
    FOR SELECT USING (auth.uid()::text = user_id);

-- Only allow users to insert their own user_books entries
CREATE POLICY user_books_insert_policy ON public.user_books
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Only allow users to delete their own user_books entries
CREATE POLICY user_books_delete_policy ON public.user_books
    FOR DELETE USING (auth.uid()::text = user_id);

-- Insert some initial genres
INSERT INTO public.genres (name, description) VALUES
('Fiction', 'Fictional works of literature, including novels and short stories'),
('Non-Fiction', 'Factual works based on real events, people, and information'),
('Science Fiction', 'Fictional works that incorporate futuristic concepts, technology, space exploration, etc.'),
('Fantasy', 'Works featuring magical or supernatural elements'),
('Mystery', 'Stories involving crime, puzzles, and detective work'),
('Romance', 'Stories centered around romantic relationships'),
('Biography', 'Non-fiction accounts of a person''s life'),
('History', 'Works focused on historical events and periods'),
('Self-Help', 'Books aimed at personal improvement'),
('Science', 'Works about scientific principles and discoveries'),
('Horror', 'Stories intended to frighten or disturb'),
('Poetry', 'Literary works written in verse'),
('Comedy', 'Humorous works intended to entertain'),
('Drama', 'Works with emotional or serious themes'),
('Thriller', 'Suspenseful works that create tension');
