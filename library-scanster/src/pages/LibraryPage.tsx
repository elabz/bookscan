
import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { BookGrid } from '@/components/books/BookGrid';
import { LibraryStats } from '@/components/library/LibraryStats';
import { LibraryToolbar } from '@/components/library/LibraryToolbar';
import { Book as BookType } from '@/types/book';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getUserBooks, searchUserBooks } from '@/services/libraryService';
import { useToast } from '@/hooks/use-toast';
import { getAllGenres, getBookGenres } from '@/services/genreService';
import { getLocations, getLocationWithDescendantIds } from '@/services/locationService';

const LibraryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const { userId, isSignedIn } = useAuth();
  const { toast } = useToast();

  // Read subject filter from URL
  useEffect(() => {
    const subject = searchParams.get('subject');
    setSelectedSubject(subject);
  }, [searchParams]);

  const clearSubjectFilter = () => {
    setSelectedSubject(null);
    searchParams.delete('subject');
    setSearchParams(searchParams);
  };

  // Fetch all available genres
  const {
    data: genres = [],
    isLoading: genresLoading
  } = useQuery({
    queryKey: ['genres'],
    queryFn: getAllGenres
  });

  // Fetch locations for hierarchy-aware filtering
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
    enabled: isSignedIn
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booksError]);

  // Use separate state for filtered books during search
  const [filteredBooks, setFilteredBooks] = useState<BookType[]>([]);

  // Derive displayed books from state without extra setState calls
  const displayedBooks = React.useMemo(() => {
    // Use filtered books if there's an active search query
    let result = searchQuery.trim() ? filteredBooks : books;

    // Filter by location (includes all child locations in hierarchy)
    if (selectedLocationId && locations.length > 0) {
      const locationIds = getLocationWithDescendantIds(selectedLocationId, locations);
      result = result.filter(book => book.location_id && locationIds.includes(book.location_id));
    }

    // Filter by genres
    if (selectedGenres.length > 0) {
      result = result.filter(book =>
        book.genres?.some(genre => selectedGenres.includes(genre.id))
      );
    }

    // Filter by subject if selected - use exact match (case-insensitive, trimmed)
    if (selectedSubject) {
      const normalizedSubject = selectedSubject.trim().toLowerCase();
      result = result.filter(book =>
        book.subjects?.some(s => s.name.trim().toLowerCase() === normalizedSubject) ||
        book.categories?.some(c => c.trim().toLowerCase() === normalizedSubject)
      );
    }

    return result;
  }, [books, filteredBooks, searchQuery, selectedLocationId, locations, selectedGenres, selectedSubject]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredBooks([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchUserBooks(query);

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
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold">My Library</h1>
              <p className="text-sm text-muted-foreground">
                {books.length} book{books.length !== 1 ? 's' : ''} in your collection
              </p>
            </div>
          </div>

          {/* Unified filter toolbar */}
          <LibraryToolbar
            onSearch={handleSearch}
            isSearching={isSearching}
            selectedLocationId={selectedLocationId}
            onLocationChange={setSelectedLocationId}
            genres={genres}
            selectedGenres={selectedGenres}
            onGenreChange={setSelectedGenres}
            genresLoading={genresLoading}
            selectedSubject={selectedSubject}
            onClearSubject={clearSubjectFilter}
          />
        </div>

        <LibraryStats />

        <div className="mb-16">
          <BookGrid
            books={displayedBooks}
            isLoading={booksLoading}
            emptyMessage={
              searchQuery
                ? `No books found matching "${searchQuery}"`
                : selectedSubject
                  ? `No books found with subject "${selectedSubject}"`
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
