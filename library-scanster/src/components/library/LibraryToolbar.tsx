import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Tag, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { getLocations, Location } from '@/services/locationService';

interface Genre {
  id: number;
  name: string;
}

interface LibraryToolbarProps {
  // Search
  onSearch: (query: string) => void;
  isSearching?: boolean;
  // Location filter
  selectedLocationId: string | null;
  onLocationChange: (id: string | null) => void;
  // Genre filter
  genres: Genre[];
  selectedGenres: number[];
  onGenreChange: (ids: number[]) => void;
  genresLoading?: boolean;
  // Subject filter (from URL)
  selectedSubject: string | null;
  onClearSubject: () => void;
}

export const LibraryToolbar = ({
  onSearch,
  isSearching = false,
  selectedLocationId,
  onLocationChange,
  genres,
  selectedGenres,
  onGenreChange,
  genresLoading = false,
  selectedSubject,
  onClearSubject,
}: LibraryToolbarProps) => {
  const [searchValue, setSearchValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
  });

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  }, [onSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasActiveFilters = selectedLocationId || selectedGenres.length > 0 || selectedSubject;
  const selectedGenreNames = genres
    .filter(g => selectedGenres.includes(g.id))
    .map(g => g.name);

  const clearAllFilters = () => {
    setSearchValue('');
    onSearch('');
    onLocationChange(null);
    onGenreChange([]);
    if (selectedSubject) onClearSubject();
  };

  return (
    <div className="space-y-3">
      {/* Main toolbar row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input - takes remaining space */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Filter by title, author, ISBN..."
            className="pl-9 h-10 bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex gap-2">
          {/* Location dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedLocationId ? 'default' : 'outline'}
                size="sm"
                className="h-10 gap-2"
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {selectedLocationId
                    ? locations.find(l => l.id === selectedLocationId)?.name || 'Location'
                    : 'Location'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by location</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={!selectedLocationId}
                onCheckedChange={() => onLocationChange(null)}
              >
                All locations
              </DropdownMenuCheckboxItem>
              {locations.map((loc: Location) => (
                <DropdownMenuCheckboxItem
                  key={loc.id}
                  checked={selectedLocationId === loc.id}
                  onCheckedChange={() => onLocationChange(
                    selectedLocationId === loc.id ? null : loc.id
                  )}
                >
                  {loc.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Genre dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedGenres.length > 0 ? 'default' : 'outline'}
                size="sm"
                className="h-10 gap-2"
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {selectedGenres.length > 0
                    ? `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''}`
                    : 'Genre'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
              <DropdownMenuLabel>Filter by genre</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {genresLoading ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
              ) : genres.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No genres available</div>
              ) : (
                genres.map((genre) => (
                  <DropdownMenuCheckboxItem
                    key={genre.id}
                    checked={selectedGenres.includes(genre.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onGenreChange([...selectedGenres, genre.id]);
                      } else {
                        onGenreChange(selectedGenres.filter(id => id !== genre.id));
                      }
                    }}
                  >
                    {genre.name}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>


      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Active filters:</span>

          {selectedLocationId && (
            <Badge variant="outline" className="gap-1 pr-1">
              <MapPin className="h-3 w-3" />
              {locations.find(l => l.id === selectedLocationId)?.name}
              <button
                onClick={() => onLocationChange(null)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {selectedGenreNames.map((name) => (
            <Badge key={name} variant="outline" className="gap-1 pr-1">
              <Tag className="h-3 w-3" />
              {name}
              <button
                onClick={() => {
                  const genreId = genres.find(g => g.name === name)?.id;
                  if (genreId) {
                    onGenreChange(selectedGenres.filter(id => id !== genreId));
                  }
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {selectedSubject && (
            <Badge variant="outline" className="gap-1 pr-1">
              Subject: {selectedSubject}
              <button
                onClick={onClearSubject}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};
