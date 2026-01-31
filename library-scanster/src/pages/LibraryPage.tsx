
import { useState, useEffect } from 'react';
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { BookGrid } from '@/components/books/BookGrid';
import { BookSearch } from '@/components/books/BookSearch';
import { GenreFilter } from '@/components/books/GenreFilter';
import { Button } from '@/components/ui/button';
import { Book as BookType } from '@/types/book';
import { BookPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getUserBooks, searchUserBooks } from '@/services/libraryService';
import { useToast } from '@/hooks/use-toast';
import { getAllGenres, getBookGenres } from '@/services/genreService';

const LibraryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const { userId, isSignedIn } = useAuth();
  const { toast } = useToast();

  // Fetch all available genres
  const {
    data: genres = [],
    isLoading: genresLoading
  } = useQuery({
    queryKey: ['genres'],
    queryFn: getAllGenres
  });

  // Fetch books from the API
  const {
    data: books = [],
    isLoading: booksLoading,
    error: booksError,
    refetch: refetchBooks
  } = useQuery({
    queryKey: ['userBooks', userId],
    queryFn: async () => {
      const userBooks = await getUserBooks();

      // Fetch genres for each book
      for (const book of userBooks) {
        if (book.id) {
          const bookGenres = await getBookGenres(book.id);
          book.genres = bookGenres;
        }
      }

      return userBooks;
    },
    enabled: isSignedIn
  });

  // If there was an error fetching books, show a toast
  React.useEffect(() => {
    if (booksError) {
      toast({
        title: "Error loading your library",
        description: "There was an issue loading your books. Please try again.",
        variant: "destructive"
      });
    }
  }, [booksError, toast]);

  // Use separate state for filtered books during search
  const [filteredBooks, setFilteredBooks] = useState<BookType[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<BookType[]>([]);

  // When not searching, display all books from the query result
  useEffect(() => {
    if (isSearching) {
      setDisplayedBooks(filteredBooks);
    } else {
      setDisplayedBooks(books);
    }

    // Apply genre filter if any are selected
    if (selectedGenres.length > 0) {
      setDisplayedBooks(current =>
        current.filter(book =>
          book.genres?.some(genre => selectedGenres.includes(genre.id))
        )
      );
    }
  }, [books, filteredBooks, isSearching, selectedGenres]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setFilteredBooks([]);
      setSearchQuery('');
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setSearchQuery(query);
      let results = await searchUserBooks(query);

      // Fetch genres for each book
      for (const book of results) {
        if (book.id) {
          const bookGenres = await getBookGenres(book.id);
          book.genres = bookGenres;
        }
      }

      setFilteredBooks(results);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: "There was an error searching your library",
        variant: "destructive"
      });
    }
  };

  const handleGenreFilter = (genreIds: number[]) => {
    setSelectedGenres(genreIds);
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm mb-8 mt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">My Library</h1>
              <p className="text-muted-foreground">
                {books.length} book{books.length !== 1 ? 's' : ''} in your collection
              </p>
            </div>

            <Button asChild>
              <Link to="/books/add">
                <BookPlus className="h-4 w-4 mr-2" />
                Add Book
              </Link>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <BookSearch
              onSearch={handleSearch}
              isLoading={isSearching}
              placeholder="Search your library..."
              className="md:max-w-md w-full"
            />

            <GenreFilter
              genres={genres}
              selectedGenres={selectedGenres}
              onSelectGenres={handleGenreFilter}
              isLoading={genresLoading || booksLoading}
            />
          </div>
        </div>

        <div className="mb-16">
          <BookGrid
            books={displayedBooks}
            isLoading={booksLoading || isSearching}
            emptyMessage={
              searchQuery
                ? `No books found matching "${searchQuery}"`
                : selectedGenres.length > 0
                  ? "No books found for the selected genres"
                  : "Your library is empty. Start by adding some books!"
            }
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default LibraryPage;
