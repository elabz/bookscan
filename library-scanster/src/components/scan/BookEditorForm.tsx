
import React, { useState, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { searchSubjects } from '@/services/subjectService';

interface BookEditorFormProps {
  formData: {
    title: string;
    authors: string;
    isbn: string;
    publisher: string;
    publishedDate: string;
    pageCount: string;
    description: string;
    width: string;
    height: string;
  };
  subjects: { name: string }[];
  onChange: (field: string, value: string) => void;
  onSubjectsChange: (subjects: { name: string }[]) => void;
}

export const BookEditorForm: React.FC<BookEditorFormProps> = ({
  formData,
  subjects,
  onChange,
  onSubjectsChange
}) => {
  const [newSubject, setNewSubject] = useState('');
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSubjectPopover, setShowSubjectPopover] = useState(false);
  const subjectDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAddSubject = useCallback((name?: string) => {
    const trimmed = (name || newSubject).trim();
    if (!trimmed) return;
    // Check if subject already exists (case-insensitive)
    if (subjects.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewSubject('');
      setShowSubjectPopover(false);
      return;
    }
    onSubjectsChange([...subjects, { name: trimmed }]);
    setNewSubject('');
    setShowSubjectPopover(false);
    setSubjectSuggestions([]);
  }, [newSubject, subjects, onSubjectsChange]);

  const handleRemoveSubject = (index: number) => {
    onSubjectsChange(subjects.filter((_, i) => i !== index));
  };

  const handleSubjectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubject();
    }
  };

  const handleSubjectInputChange = useCallback((value: string) => {
    setNewSubject(value);

    if (subjectDebounceRef.current) {
      clearTimeout(subjectDebounceRef.current);
    }

    if (value.trim().length >= 2) {
      setShowSubjectPopover(true);
      subjectDebounceRef.current = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          const suggestions = await searchSubjects(value.trim());
          const filtered = suggestions.filter(
            s => !subjects.some(existing => existing.name.toLowerCase() === s.toLowerCase())
          );
          setSubjectSuggestions(filtered);
        } catch (error) {
          console.error('Error fetching subject suggestions:', error);
          setSubjectSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 300);
    } else {
      setShowSubjectPopover(false);
      setSubjectSuggestions([]);
    }
  }, [subjects]);

  return (
    <>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Book title"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="authors">Authors</Label>
        <Input
          id="authors"
          value={formData.authors}
          onChange={(e) => onChange('authors', e.target.value)}
          placeholder="Author names (comma separated)"
        />
      </div>
      
      <div>
        <Label htmlFor="isbn">ISBN</Label>
        <Input
          id="isbn"
          value={formData.isbn}
          onChange={(e) => onChange('isbn', e.target.value)}
          placeholder="ISBN"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="publisher">Publisher</Label>
          <Input
            id="publisher"
            value={formData.publisher}
            onChange={(e) => onChange('publisher', e.target.value)}
            placeholder="Publisher"
          />
        </div>
        
        <div>
          <Label htmlFor="publishedDate">Published Date</Label>
          <Input
            id="publishedDate"
            value={formData.publishedDate}
            onChange={(e) => onChange('publishedDate', e.target.value)}
            placeholder="Published date"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="pageCount">Page Count</Label>
        <Input
          id="pageCount"
          type="number"
          value={formData.pageCount}
          onChange={(e) => onChange('pageCount', e.target.value)}
          placeholder="Number of pages"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="width">Width (cm)</Label>
          <Input
            id="width"
            value={formData.width}
            onChange={(e) => onChange('width', e.target.value)}
            placeholder="Book width"
          />
        </div>
        
        <div>
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            value={formData.height}
            onChange={(e) => onChange('height', e.target.value)}
            placeholder="Book height"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Book description"
          rows={3}
        />
      </div>

      {/* Subjects Section */}
      <div className="space-y-2">
        <Label>Subjects</Label>
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {subjects.map((subject, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {subject.name}
              <button
                type="button"
                onClick={() => handleRemoveSubject(index)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove ${subject.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Popover open={showSubjectPopover} onOpenChange={setShowSubjectPopover}>
            <PopoverTrigger asChild>
              <div className="flex-1 relative">
                <Input
                  value={newSubject}
                  onChange={(e) => handleSubjectInputChange(e.target.value)}
                  onKeyDown={handleSubjectKeyDown}
                  onFocus={() => newSubject.trim().length >= 2 && setShowSubjectPopover(true)}
                  placeholder="Add a subject..."
                  className="h-9"
                />
                {isLoadingSuggestions && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
              <Command>
                <CommandList>
                  {subjectSuggestions.length === 0 && !isLoadingSuggestions && newSubject.trim() && (
                    <CommandEmpty>
                      <button
                        type="button"
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                        onClick={() => handleAddSubject()}
                      >
                        Add "{newSubject.trim()}"
                      </button>
                    </CommandEmpty>
                  )}
                  {subjectSuggestions.length > 0 && (
                    <CommandGroup>
                      {subjectSuggestions.map((suggestion) => (
                        <CommandItem
                          key={suggestion}
                          value={suggestion}
                          onSelect={() => handleAddSubject(suggestion)}
                        >
                          {suggestion}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddSubject()}
            disabled={!newSubject.trim()}
            className="h-9"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};
