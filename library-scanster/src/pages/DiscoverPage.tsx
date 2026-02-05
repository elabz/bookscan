import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchForm } from '@/components/home/SearchForm';
import { BookGrid } from '@/components/home/BookGrid';
import { searchBooks, searchOpenLibrary } from '@/services/searchService';
import { Book } from '@/types/book';

const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<Book[]>([]);
  const [openLibraryResults, setOpenLibraryResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPhase, setSearchPhase] = useState<'local' | 'openlibrary' | null>(null);
  const hasSearched = query !== '';
  const initialSearchDone = useRef(false);

  const isRelevantMatch = useCallback((book: Book, searchTerm: string): boolean => {
    const lowerSearch = searchTerm.toLowerCase();
    const titleMatch = book.title?.toLowerCase().includes(lowerSearch);
    const authorMatch = book.authors?.some(a => a.toLowerCase().includes(lowerSearch));
    const isbnMatch = book.isbn?.replace(/-/g, '').includes(searchTerm.replace(/-/g, ''));
    return titleMatch || authorMatch || isbnMatch;
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);
    setLocalResults([]);
    setOpenLibraryResults([]);

    const targetResults = 20;

    try {
      // First, search locally and filter to only relevant matches
      setSearchPhase('local');
      const localBooks = await searchBooks(searchQuery);
      const relevantLocalBooks = localBooks.filter(book => isRelevantMatch(book, searchQuery));
      setLocalResults(relevantLocalBooks);

      // If we have fewer than targetResults, also search OpenLibrary
      if (relevantLocalBooks.length < targetResults) {
        setSearchPhase('openlibrary');
        const openLibraryBooks = await searchOpenLibrary(searchQuery);

        // Filter out books we already have locally (by ISBN)
        const localIsbns = new Set(relevantLocalBooks.map(b => b.isbn?.replace(/-/g, '')).filter(Boolean));
        const filteredOpenLibrary = openLibraryBooks.filter(
          book => !book.isbn || !localIsbns.has(book.isbn.replace(/-/g, ''))
        );

        // Only take enough to fill up to targetResults
        const needed = targetResults - relevantLocalBooks.length;
        setOpenLibraryResults(filteredOpenLibrary.slice(0, needed));
      }
    } catch (error) {
      console.error('Discover search error:', error);
    } finally {
      setIsSearching(false);
      setSearchPhase(null);
    }
  }, [isRelevantMatch]);

  // Handle search from the search form - updates URL params
  const handleSearch = useCallback((searchQuery: string) => {
    setSearchParams({ q: searchQuery });
    performSearch(searchQuery);
  }, [performSearch, setSearchParams]);

  // Handle initial search from URL query param
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam && !initialSearchDone.current) {
      initialSearchDone.current = true;
      performSearch(queryParam);
    }
  }, [searchParams, performSearch]);

  const totalResults = localResults.length + openLibraryResults.length;

  return (
    <PageLayout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-4 animate-slide-down">
          Discover New Books
        </h1>
        <p className="text-muted-foreground mb-8 animate-slide-down" style={{ animationDelay: '50ms' }}>
          Search your library and millions of books from OpenLibrary.
        </p>

        <SearchForm
          onSearch={handleSearch}
          placeholder="Search for books, authors, ISBN..."
          initialValue={searchParams.get('q') || ''}
        />

        {isSearching && (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">
                {searchPhase === 'local' ? 'Searching local library...' : 'Searching OpenLibrary...'}
              </p>
            </div>
          </div>
        )}

        {!isSearching && hasSearched && totalResults === 0 && (
          <div className="text-center py-8">
            <h3 className="text-xl font-medium mb-2">No books found</h3>
            <p className="text-muted-foreground">Try a different search term or check the spelling</p>
          </div>
        )}

        {!isSearching && localResults.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6">
              From Your Library ({localResults.length})
            </h2>
            <BookGrid books={localResults} />
          </div>
        )}

        {!isSearching && openLibraryResults.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              From OpenLibrary ({openLibraryResults.length})
            </h2>
            <BookGrid books={openLibraryResults} isExternalSource />
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Search above to find books in your library or discover new ones from OpenLibrary's catalog.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default DiscoverPage;
