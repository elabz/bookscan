
import React, { useState, useCallback } from 'react';
import { Book, Pencil, BookPlus, Loader2, Tag, ExternalLink, Scan, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarcodeScanner } from '@/components/scan/BarcodeScanner';
import { ScanTabProps } from '@/types/addBook';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useIsMobile } from '@/hooks/use-mobile';
import { BookEditor } from '@/components/scan/BookEditor';
import { useAddBook } from './AddBookProvider';
import { BookNotFoundMessage } from '@/components/scan/BookNotFoundMessage';
import { LocationPicker } from '@/components/library/LocationPicker';
import { isbn13ToIsbn10 } from '@/utils/isbnUtils';

export const ScanTab: React.FC<ScanTabProps> = (props) => {
  const {
    isSearching: propsIsSearching,
    foundBook: propsFoundBook,
    handleIsbnSearch: propsHandleIsbnSearch,
    handleAddScannedBook: propsHandleAddScannedBook,
    isSubmitting: propsIsSubmitting,
    setFoundBook: propsSetFoundBook,
    selectedLocationId,
    onLocationChange,
    onSwitchToManual,
  } = props;
  
  // Use context if props are not provided
  const {
    isSearching: contextIsSearching,
    foundBook: contextFoundBook,
    handleIsbnSearch: contextHandleIsbnSearch,
    handleAddScannedBook: contextHandleAddScannedBook,
    handleAddAndScanAnother: contextHandleAddAndScanAnother,
    isSubmitting: contextIsSubmitting,
    setFoundBook: contextSetFoundBook
  } = useAddBook();
  
  // Use props if available, otherwise use context
  const isSearching = propsIsSearching !== undefined ? propsIsSearching : contextIsSearching;
  const foundBook = propsFoundBook !== undefined ? propsFoundBook : contextFoundBook;
  const handleIsbnSearch = propsHandleIsbnSearch || contextHandleIsbnSearch;
  const handleAddScannedBook = propsHandleAddScannedBook || contextHandleAddScannedBook;
  const handleAddAndScanAnother = contextHandleAddAndScanAnother;
  const isSubmitting = propsIsSubmitting !== undefined ? propsIsSubmitting : contextIsSubmitting;
  const setFoundBook = propsSetFoundBook || contextSetFoundBook;
  
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [lastScannedIsbn, setLastScannedIsbn] = useState<string>("");
  const [originalIsbn13, setOriginalIsbn13] = useState<string>("");
  const [isBookNotFound, setIsBookNotFound] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [showWrongBook, setShowWrongBook] = useState(false);
  const [wrongBookQuery, setWrongBookQuery] = useState('');
  
  // Helper function to handle book description display
  const getDescriptionText = (description: any): string => {
    if (!description) return '';
    
    if (typeof description === 'string') {
      return description;
    }
    
    if (description && typeof description === 'object') {
      if (description.value) {
        return description.value;
      }
      return JSON.stringify(description);
    }
    
    return '';
  };
  
  // Handler for ISBN search that also tracks the ISBN for potential "not found" state
  const handleScan = async (isbn: string) => {
    setLastScannedIsbn(isbn);
    // Remember the first ISBN-13 from the barcode so it survives ISBN-10 retries
    if (isbn.length === 13 && !originalIsbn13) {
      setOriginalIsbn13(isbn);
    }
    setIsBookNotFound(false);

    try {
      await handleIsbnSearch(isbn);
    } catch (error) {
      setIsBookNotFound(true);
    }
  };

  // Reset scan state to initial — increment key to force clean BarcodeScanner remount
  const resetScanState = useCallback(() => {
    setIsBookNotFound(false);
    setFoundBook(null);
    setLastScannedIsbn("");
    setOriginalIsbn13("");
    setShowWrongBook(false);
    setWrongBookQuery('');
    setScannerKey(k => k + 1);
  }, [setFoundBook]);

  // Handle "wrong book" — search by title or different ISBN
  const handleWrongBookSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = wrongBookQuery.trim();
    if (!query) return;
    setShowWrongBook(false);
    setWrongBookQuery('');
    // If it looks like an ISBN (digits, hyphens, X), do ISBN lookup; otherwise treat as title
    const cleaned = query.replace(/[-\s]/g, '');
    if (/^\d{9,13}[\dXx]?$/.test(cleaned)) {
      await handleScan(cleaned);
    } else {
      // Use ISBN search with the title — fetchBookByISBN won't match,
      // so we search OpenLibrary by title and take the first result
      try {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          const isbn = data.docs?.[0]?.isbn?.[0];
          if (isbn) {
            await handleScan(isbn);
          } else {
            setIsBookNotFound(true);
            setLastScannedIsbn(query);
          }
        }
      } catch {
        setIsBookNotFound(true);
        setLastScannedIsbn(query);
      }
    }
  };
  
  return (
    <div className="animate-slide-up">
      {!foundBook && !isBookNotFound && (
        <BarcodeScanner key={scannerKey} onScanComplete={handleScan} />
      )}
      
      {isBookNotFound && !foundBook && (
        <BookNotFoundMessage
          onRescan={resetScanState}
          onIsbnSubmit={handleScan}
          onAddManually={onSwitchToManual ? () => {
            const isbn13 = originalIsbn13 || (lastScannedIsbn.length === 13 ? lastScannedIsbn : undefined);
            const isbn10 = lastScannedIsbn.length === 10
              ? lastScannedIsbn
              : isbn13 ? (isbn13ToIsbn10(isbn13) ?? undefined) : undefined;
            onSwitchToManual(isbn13, isbn10);
          } : undefined}
          isbnScanned={lastScannedIsbn}
        />
      )}
      
      {foundBook && !isBookNotFound && (
        <div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isEditing && !isSubmitting) {
              e.preventDefault();
              handleAddAndScanAnother();
            }
          }}
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Book Found!</h2>
            {!isEditing && (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                onClick={() => setShowWrongBook(!showWrongBook)}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Not this book?
              </button>
            )}
          </div>

          {showWrongBook && !isEditing && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-2">
                Search by title or enter a different ISBN:
              </p>
              <form onSubmit={handleWrongBookSearch} className="flex gap-2">
                <input
                  type="text"
                  value={wrongBookQuery}
                  onChange={(e) => setWrongBookQuery(e.target.value)}
                  placeholder='e.g. "The Great Gatsby" or 978-0-743-27356-5'
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                  autoFocus
                />
                <Button type="submit" size="sm" disabled={!wrongBookQuery.trim()}>
                  <Search className="mr-1 h-3 w-3" /> Search
                </Button>
              </form>
              <button
                type="button"
                className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={resetScanState}
              >
                or scan a different barcode
              </button>
            </div>
          )}

          {isEditing ? (
            <BookEditor book={foundBook} onSave={(updatedBook) => {
              setFoundBook(updatedBook);
              setIsEditing(false);
            }} />
          ) : (
            <>
              {/* Cover + details */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 shrink-0">
                  {foundBook.cover ? (
                    <AspectRatio ratio={2/3} className="bg-muted">
                      <img
                        src={foundBook.cover}
                        alt={`Cover of ${foundBook.title}`}
                        className="w-full h-full object-cover rounded-lg shadow-md"
                      />
                    </AspectRatio>
                  ) : (
                    <AspectRatio ratio={2/3} className="bg-muted rounded-lg flex items-center justify-center">
                      <Book className="h-12 w-12 opacity-70" />
                    </AspectRatio>
                  )}
                </div>

                <div className="w-full md:w-2/3 space-y-3">
                  <h3 className="text-xl font-semibold">{foundBook.title}</h3>
                  <p className="text-muted-foreground">
                    By {foundBook.authors?.join(', ') || 'Unknown Author'}
                  </p>

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    {foundBook.publisher && (
                      <>
                        <span className="font-medium text-muted-foreground">Publisher</span>
                        <span>{foundBook.publisher}</span>
                      </>
                    )}
                    {foundBook.publishedDate && (
                      <>
                        <span className="font-medium text-muted-foreground">Published</span>
                        <span>{foundBook.publishedDate}</span>
                      </>
                    )}
                    {(foundBook.pageCount || foundBook.number_of_pages) && (
                      <>
                        <span className="font-medium text-muted-foreground">Pages</span>
                        <span>{foundBook.pageCount || foundBook.number_of_pages}</span>
                      </>
                    )}
                    {foundBook.weight && (
                      <>
                        <span className="font-medium text-muted-foreground">Weight</span>
                        <span>{foundBook.weight}</span>
                      </>
                    )}
                    {(foundBook.width || foundBook.height) && (
                      <>
                        <span className="font-medium text-muted-foreground">Dimensions</span>
                        <span>{[foundBook.width, foundBook.height].filter(Boolean).join(' × ')}</span>
                      </>
                    )}
                    {foundBook.language && (
                      <>
                        <span className="font-medium text-muted-foreground">Language</span>
                        <span>{foundBook.language}</span>
                      </>
                    )}
                    {foundBook.edition && (
                      <>
                        <span className="font-medium text-muted-foreground">Edition</span>
                        <span>{foundBook.edition}</span>
                      </>
                    )}
                    {foundBook.isbn && (
                      <>
                        <span className="font-medium text-muted-foreground">ISBN</span>
                        <span className="font-mono text-xs">{foundBook.isbn}</span>
                      </>
                    )}
                  </div>

                  {/* Identifiers */}
                  {foundBook.identifiers && Object.keys(foundBook.identifiers).length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Identifiers:</span>
                      <div className="ml-2 text-xs text-muted-foreground font-mono">
                        {Object.entries(foundBook.identifiers).map(([key, values]) =>
                          values && values.length > 0 ? (
                            <p key={key}>{key}: {values.join(', ')}</p>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Classifications */}
                  {foundBook.classifications && Object.keys(foundBook.classifications).length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Classifications:</span>
                      <div className="ml-2 text-xs text-muted-foreground font-mono">
                        {Object.entries(foundBook.classifications).map(([key, values]) =>
                          values && (values as string[]).length > 0 ? (
                            <p key={key}>{key}: {(values as string[]).join(', ')}</p>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Publish places */}
                  {foundBook.publish_places && foundBook.publish_places.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Published in: </span>
                      <span>{foundBook.publish_places.map(p => p.name).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description — full width below cover+details */}
              {foundBook.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm leading-relaxed">{getDescriptionText(foundBook.description)}</p>
                </div>
              )}

              {/* Categories / Subjects */}
              {((foundBook.categories && foundBook.categories.length > 0) ||
                (foundBook.subjects && foundBook.subjects.length > 0)) && (
                <div className="mt-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <Tag className="h-3.5 w-3.5" />
                    <span className="font-medium">Subjects</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(foundBook.subjects || foundBook.categories?.map(c => ({ name: c })) || [])
                      .slice(0, 12)
                      .map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{typeof s === 'string' ? s : s.name}</Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Excerpts */}
              {foundBook.excerpts && foundBook.excerpts.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Excerpt</h4>
                  <blockquote className="text-sm italic border-l-2 border-muted pl-3">
                    {foundBook.excerpts[0].text}
                  </blockquote>
                </div>
              )}

              {/* Links */}
              {foundBook.links && foundBook.links.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Links</h4>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {foundBook.links.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {link.title || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bottom actions + location */}
          {!isEditing && (
            <div className="mt-6 pt-4 border-t space-y-3">
              {onLocationChange && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="shrink-0">Location:</span>
                  <LocationPicker value={selectedLocationId ?? null} onChange={onLocationChange} />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAddAndScanAnother} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Add & Scan Another
                    </>
                  )}
                </Button>
                <Button onClick={handleAddScannedBook} variant="outline" disabled={isSubmitting}>
                  <BookPlus className="mr-2 h-4 w-4" />
                  Add Book
                </Button>
                <Button onClick={() => setIsEditing(true)} variant="ghost" size="default">
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
