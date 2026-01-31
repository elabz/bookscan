
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Genre } from '@/types/book';
import { Filter, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GenreFilterProps {
  genres: Genre[];
  selectedGenres: number[];
  onSelectGenres: (genreIds: number[]) => void;
  isLoading?: boolean;
}

export const GenreFilter = ({
  genres,
  selectedGenres,
  onSelectGenres,
  isLoading = false
}: GenreFilterProps) => {
  const [open, setOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<number[]>(selectedGenres);
  
  const handleSelect = (genreId: number) => {
    setTempSelected(current => 
      current.includes(genreId)
        ? current.filter(id => id !== genreId)
        : [...current, genreId]
    );
  };
  
  const applyFilters = () => {
    onSelectGenres(tempSelected);
    setOpen(false);
  };
  
  const clearFilters = () => {
    setTempSelected([]);
    onSelectGenres([]);
    setOpen(false);
  };
  
  const getSelectedGenreNames = () => {
    return genres
      .filter(genre => selectedGenres.includes(genre.id))
      .map(genre => genre.name);
  };
  
  const selectedNames = getSelectedGenreNames();
  
  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 h-9"
            disabled={isLoading}
          >
            <Filter className="h-4 w-4" />
            Filter by Genre
            {selectedGenres.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedGenres.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="start">
          <div className="p-4 border-b">
            <h4 className="font-medium text-sm">Filter by Genre</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Select genres to filter your books
            </p>
          </div>
          
          <ScrollArea className="h-64 p-4">
            <div className="space-y-3">
              {genres.map((genre) => (
                <div key={genre.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`genre-${genre.id}`} 
                    checked={tempSelected.includes(genre.id)}
                    onCheckedChange={() => handleSelect(genre.id)}
                  />
                  <label 
                    htmlFor={`genre-${genre.id}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {genre.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex items-center justify-between p-4 border-t bg-muted/50">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs"
              disabled={tempSelected.length === 0}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
            <Button 
              size="sm" 
              onClick={applyFilters}
              className="h-8 text-xs"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedNames.map(name => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
