import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchForm } from '@/components/home/SearchForm';
import { BookGrid } from '@/components/home/BookGrid';
import { searchBooks } from '@/services/searchService';
import { getFeaturedBooks } from '@/services/libraryService';
import { Book } from '@/types/book';
import { useQuery } from '@tanstack/react-query';

const HomePage = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const hasSearched = query !== '';

  const { data: featuredBooks = [], isLoading: featuredLoading } = useQuery({
    queryKey: ['featuredBooks'],
    queryFn: getFeaturedBooks,
  });

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);

    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const displayBooks = hasSearched ? searchResults : featuredBooks;

  return (
    <PageLayout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-4 animate-slide-down">
          Find Your Next Read
        </h1>
        <p className="text-muted-foreground mb-8 animate-slide-down" style={{ animationDelay: '50ms' }}>
          Explore a vast collection of books and discover new favorites.
        </p>

        <SearchForm onSearch={handleSearch} />

        {(isSearching || featuredLoading) && (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">
                {isSearching ? 'Searching online libraries...' : 'Loading books...'}
              </p>
            </div>
          </div>
        )}

        {!isSearching && hasSearched && searchResults.length === 0 && (
          <div className="text-center py-8">
            <h3 className="text-xl font-medium mb-2">No books found</h3>
            <p className="text-muted-foreground">Try a different search term or check the spelling</p>
          </div>
        )}

        {!isSearching && !featuredLoading && displayBooks.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-6">
              {hasSearched ? 'Search Results' : 'Popular Books'}
            </h2>
            <BookGrid books={displayBooks} />
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default HomePage;
