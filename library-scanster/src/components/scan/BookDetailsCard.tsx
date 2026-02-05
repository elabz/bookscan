
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookPlus, BookCheck, Tag, Loader2, Pencil, ExternalLink, Sparkles } from 'lucide-react';
import { LocationPicker } from '@/components/library/LocationPicker';

interface BookDetailsCardProps {
  book: Book;
  onAddToLibrary: () => void;
  onEditBook?: () => void;
  isAddingToLibrary?: boolean;
  selectedLocationId?: string | null;
  onLocationChange?: (locationId: string | null) => void;
  hasSimilarBooks?: boolean;
  onScrollToSimilar?: () => void;
}

export const BookDetailsCard = ({
  book,
  onAddToLibrary,
  onEditBook,
  isAddingToLibrary = false,
  selectedLocationId,
  onLocationChange,
  hasSimilarBooks,
  onScrollToSimilar,
}: BookDetailsCardProps) => {
  const getDescriptionText = (description: string | { value?: string } | undefined): string => {
    if (!description) return '';
    if (typeof description === 'string') return description;
    if (typeof description === 'object' && description.value) return description.value;
    return '';
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm mb-8 animate-fade-in"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isAddingToLibrary) {
          e.preventDefault();
          onAddToLibrary();
        }
      }}
      tabIndex={0}
    >
      <h2 className="text-xl font-medium mb-4">Book Found!</h2>

      {/* Action buttons at top */}
      <div className="pb-4 mb-4 border-b space-y-3">
        {onLocationChange && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="shrink-0">Location:</span>
            <LocationPicker value={selectedLocationId ?? null} onChange={onLocationChange} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onAddToLibrary} disabled={isAddingToLibrary}>
            {isAddingToLibrary ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <BookPlus className="mr-2 h-4 w-4" />
                Add to Library
              </>
            )}
          </Button>
          {onEditBook && (
            <Button onClick={onEditBook} variant="outline">
              <Pencil className="h-4 w-4 mr-1" />
              Edit Details
            </Button>
          )}
          {hasSimilarBooks && onScrollToSimilar && (
            <Button onClick={onScrollToSimilar} variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/20">
              <Sparkles className="h-4 w-4 mr-1" />
              Similar books found
            </Button>
          )}
        </div>
      </div>

      {/* Cover + details */}
      <div className="flex flex-col md:flex-row gap-6">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-32 h-auto object-cover rounded-md shadow-sm shrink-0"
          />
        ) : (
          <div className="w-32 h-48 bg-secondary flex items-center justify-center rounded-md shrink-0">
            <BookCheck className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 space-y-3">
          <h3 className="text-lg font-medium">{book.title}</h3>
          <p className="text-muted-foreground">
            {book.authors?.join(', ') || 'Unknown Author'}
          </p>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {book.publisher && (
              <>
                <span className="font-medium text-muted-foreground">Publisher</span>
                <span>{book.publisher}</span>
              </>
            )}
            {book.publishedDate && (
              <>
                <span className="font-medium text-muted-foreground">Published</span>
                <span>{book.publishedDate}</span>
              </>
            )}
            {(book.pageCount || book.number_of_pages) && (
              <>
                <span className="font-medium text-muted-foreground">Pages</span>
                <span>{book.pageCount || book.number_of_pages}</span>
              </>
            )}
            {book.weight && (
              <>
                <span className="font-medium text-muted-foreground">Weight</span>
                <span>{book.weight}</span>
              </>
            )}
            {(book.width || book.height) && (
              <>
                <span className="font-medium text-muted-foreground">Dimensions</span>
                <span>{[book.width, book.height].filter(Boolean).join(' × ')}</span>
              </>
            )}
            {book.language && (
              <>
                <span className="font-medium text-muted-foreground">Language</span>
                <span>{book.language}</span>
              </>
            )}
            {book.edition && (
              <>
                <span className="font-medium text-muted-foreground">Edition</span>
                <span>{book.edition}</span>
              </>
            )}
            {book.isbn && (
              <>
                <span className="font-medium text-muted-foreground">ISBN</span>
                <span className="font-mono text-xs">{book.isbn}</span>
              </>
            )}
            {book.lccn && (
              <>
                <span className="font-medium text-muted-foreground">LCCN</span>
                <span className="font-mono text-xs">{book.lccn}</span>
              </>
            )}
          </div>

          {/* Identifiers */}
          {book.identifiers && Object.keys(book.identifiers).length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Identifiers:</span>
              <div className="ml-2 text-xs text-muted-foreground font-mono">
                {Object.entries(book.identifiers).map(([key, values]) =>
                  values && values.length > 0 ? (
                    <p key={key}>{key}: {values.join(', ')}</p>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Classifications */}
          {book.classifications && Object.keys(book.classifications).length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Classifications:</span>
              <div className="ml-2 text-xs text-muted-foreground font-mono">
                {Object.entries(book.classifications).map(([key, values]) =>
                  values && (values as string[]).length > 0 ? (
                    <p key={key}>{key}: {(values as string[]).join(', ')}</p>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Publish places */}
          {book.publish_places && book.publish_places.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Published in: </span>
              <span>{book.publish_places.map(p => p.name).join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {book.description && (
        <div className="mt-4">
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
          <p className="text-sm leading-relaxed">{getDescriptionText(book.description)}</p>
        </div>
      )}

      {/* Categories / Subjects */}
      {((book.categories && book.categories.length > 0) ||
        (book.subjects && book.subjects.length > 0)) && (
        <div className="mt-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <Tag className="h-3.5 w-3.5" />
            <span className="font-medium">Subjects</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(book.subjects || book.categories?.map(c => ({ name: c })) || [])
              .slice(0, 12)
              .map((s, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{typeof s === 'string' ? s : s.name}</Badge>
              ))}
          </div>
        </div>
      )}

      {/* Excerpts */}
      {book.excerpts && book.excerpts.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Excerpt</h4>
          <blockquote className="text-sm italic border-l-2 border-muted pl-3">
            {book.excerpts[0].text}
          </blockquote>
        </div>
      )}

      {/* Links */}
      {book.links && book.links.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Links</h4>
          <div className="flex flex-wrap gap-3 text-sm">
            {book.links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {link.title || link.url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
