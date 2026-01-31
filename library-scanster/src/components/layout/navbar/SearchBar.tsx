
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  className?: string;
}

export const SearchBar = ({ searchQuery, setSearchQuery, handleSearch, className = '' }: SearchBarProps) => {
  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <Input
        type="search"
        placeholder="Search books..."
        className="pl-10 h-9 rounded-full bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </form>
  );
};
