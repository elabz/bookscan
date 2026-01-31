import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchForm } from '@/components/home/SearchForm';
import { BookGrid } from '@/components/home/BookGrid';
import { searchOpenLibrary } from '@/services/searchService';
import { Book } from '@/types/book';

const DiscoverPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const hasSearched = query !== '';

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);

    try {
      const books = await searchOpenLibrary(searchQuery);
      setResults(books);
    } catch (error) {
      console.error('Discover search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <PageLayout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-4 animate-slide-down">
          Discover New Books
        </h1>
        <p className="text-muted-foreground mb-8 animate-slide-down" style={{ animationDelay: '50ms' }}>
          Search millions of books from OpenLibrary and add them to your collection.
        </p>

        <SearchForm
          onSearch={handleSearch}
          placeholder="Search OpenLibrary for books, authors, ISBN..."
        />

        {isSearching && (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Searching OpenLibrary...</p>
            </div>
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="text-center py-8">
            <h3 className="text-xl font-medium mb-2">No books found</h3>
            <p className="text-muted-foreground">Try a different search term or check the spelling</p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-6">
              Search Results
            </h2>
            <BookGrid books={results} />
          </>
        )}

        {!hasSearched && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Search above to discover books from OpenLibrary's catalog of over 20 million titles.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default DiscoverPage;
