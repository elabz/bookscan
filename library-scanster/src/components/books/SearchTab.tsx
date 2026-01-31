
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { SearchTabProps } from '@/types/addBook';
import { BookCard } from '@/components/books/BookCard';
import { useAddBook } from './AddBookProvider';

export const SearchTab: React.FC<SearchTabProps> = (props) => {
  const {
    onSearch: propsOnSearch,
    isSearching: propsIsSearching,
    searchResults: propsSearchResults,
    hasSearched: propsHasSearched,
    handleSelectBook: propsHandleSelectBook
  } = props;

  // Use context if props are not provided
  const {
    handleSearch: contextHandleSearch,
    isSearching: contextIsSearching,
    searchResults: contextSearchResults,
    hasSearched: contextHasSearched,
    handleSelectBook: contextHandleSelectBook
  } = useAddBook();

  // Use props if available, otherwise use context
  const onSearch = propsOnSearch || contextHandleSearch;
  const isSearching = propsIsSearching !== undefined ? propsIsSearching : contextIsSearching;
  const searchResults = propsSearchResults || contextSearchResults;
  const hasSearched = propsHasSearched !== undefined ? propsHasSearched : contextHasSearched;
  const handleSelectBook = propsHandleSelectBook || contextHandleSelectBook;

  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-xl font-medium mb-4">Search for a Book</h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            placeholder="Search by title, author, or ISBN"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:flex-1"
          />
          <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </form>
      </div>

      {hasSearched && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {searchResults.length === 0
              ? 'No results found'
              : `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((book) => (
              <BookCard
                key={book.id || book.isbn}
                book={book}
                onClick={() => handleSelectBook(book)}
                actionLabel="Add to Library"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
