
import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BookSearchProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const BookSearch = ({
  onSearch,
  isLoading = false,
  placeholder = 'Search by title, author, or ISBN...',
  className = ''
}: BookSearchProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 py-6 h-12 rounded-full bg-white dark:bg-gray-800 border-none shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
        disabled={isLoading}
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      
      <Button
        type="submit"
        disabled={isLoading || !query.trim()}
        variant="default"
        className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full h-10 px-4"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          'Search'
        )}
      </Button>
    </form>
  );
};
