import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookPlus, Loader2, Scan, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAddBook } from '@/components/books/AddBookProvider';
import { BookNotFoundMessage } from '@/components/scan/BookNotFoundMessage';
import { LocationPicker } from '@/components/library/LocationPicker';
import { EditableBookForm } from '@/components/scan/EditableBookForm';
import { DuplicateBookDialog } from '@/components/scan/DuplicateBookDialog';
import { Book } from '@/types/book';
import { isbn13ToIsbn10 } from '@/utils/isbnUtils';

interface HardwareScannerTabProps {
  selectedLocationId: string | null;
  onLocationChange: (locId: string | null) => void;
  onSwitchToManual?: (isbn13?: string, isbn10?: string) => void;
  isActive?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const HardwareScannerTab: React.FC<HardwareScannerTabProps> = ({
  selectedLocationId,
  onLocationChange,
  onSwitchToManual,
  isActive = true,
  inputRef: externalInputRef,
}) => {
  const navigate = useNavigate();
  const {
    isSearching,
    foundBook,
    handleIsbnSearch,
    handleAddScannedBook,
    handleAddAndScanAnother,
    isSubmitting,
    setFoundBook,
    duplicateBook,
    showDuplicateDialog,
    dismissDuplicateDialog,
  } = useAddBook();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedIsbn, setLastScannedIsbn] = useState('');
  const [originalIsbn13, setOriginalIsbn13] = useState('');
  const [isBookNotFound, setIsBookNotFound] = useState(false);
  const [showWrongBook, setShowWrongBook] = useState(false);
  const [wrongBookQuery, setWrongBookQuery] = useState('');

  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Focus input when tab becomes active
  useEffect(() => {
    if (isActive && !foundBook && !isBookNotFound) {
      // Use requestAnimationFrame to ensure focus happens after Radix tab animations
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isActive, foundBook, isBookNotFound]);

  // Focus "Add & Scan Another" button when book is found
  useEffect(() => {
    if (foundBook && !isSubmitting) {
      // Small delay to ensure button is rendered
      setTimeout(() => {
        addButtonRef.current?.focus();
      }, 100);
    }
  }, [foundBook, isSubmitting]);

  // Global keydown listener for quick re-scan while viewing book
  // Detects rapid barcode scanner input even when focus is in a form field
  useEffect(() => {
    if (!foundBook) return;

    let buffer = '';
    let lastKeyTime = 0;
    let inputStartValue = '';

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const target = e.target as HTMLInputElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Reset buffer if too much time passed (human typing speed)
      // Hardware scanners type at < 50ms between chars; 150ms allows some margin
      if (now - lastKeyTime > 150) {
        buffer = '';
        // Remember the input value when starting fresh
        if (isInInput && target.value !== undefined) {
          inputStartValue = target.value;
        }
      }
      lastKeyTime = now;

      // Accumulate barcode characters
      if (e.key.length === 1 && /[\d\-Xx]/.test(e.key)) {
        buffer += e.key;
      }

      // On Enter with valid barcode-length buffer, treat as scanner input
      if (e.key === 'Enter' && buffer.length >= 10) {
        e.preventDefault();
        e.stopPropagation();
        const scannedIsbn = buffer.replace(/[-\s]/g, '');
        buffer = '';

        // If we were in an input, restore its original value (remove the scanned chars)
        if (isInInput && target.value !== undefined) {
          target.value = inputStartValue;
          // Dispatch input event so React state updates
          target.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // If same ISBN scanned, add book and prepare for next
        if (scannedIsbn === lastScannedIsbn && foundBook) {
          handleAddAndScanAnother();
        } else {
          // Different ISBN, search for it
          handleScan(scannedIsbn);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [foundBook, lastScannedIsbn, handleAddAndScanAnother]);

  const handleBookFormChange = useCallback(
    (updatedBook: Book) => {
      setFoundBook(updatedBook);
    },
    [setFoundBook]
  );

  const handleScan = async (isbn: string) => {
    const cleaned = isbn.replace(/[-\s]/g, '');
    if (!cleaned) return;

    setLastScannedIsbn(cleaned);
    if (cleaned.length === 13 && !originalIsbn13) {
      setOriginalIsbn13(cleaned);
    }
    setIsBookNotFound(false);
    setBarcodeInput('');

    try {
      await handleIsbnSearch(cleaned);
    } catch (error) {
      setIsBookNotFound(true);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(barcodeInput);
  };

  const resetScanState = useCallback(() => {
    setIsBookNotFound(false);
    setFoundBook(null);
    setLastScannedIsbn('');
    setOriginalIsbn13('');
    setShowWrongBook(false);
    setWrongBookQuery('');
    setBarcodeInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [setFoundBook]);

  const handleWrongBookSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = wrongBookQuery.trim();
    if (!query) return;
    setShowWrongBook(false);
    setWrongBookQuery('');

    const cleaned = query.replace(/[-\s]/g, '');
    if (/^\d{9,13}[\dXx]?$/.test(cleaned)) {
      await handleScan(cleaned);
    } else {
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`
        );
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

  // Duplicate dialog wrapper - shown on any view
  const duplicateDialog = duplicateBook && (
    <DuplicateBookDialog
      open={showDuplicateDialog}
      book={duplicateBook}
      onScanAnother={() => {
        dismissDuplicateDialog();
        resetScanState();
      }}
      onGoToLibrary={() => {
        dismissDuplicateDialog();
        navigate('/library');
      }}
    />
  );

  // Scanner input view (no book found yet)
  if (!foundBook && !isBookNotFound) {
    return (
      <div className="animate-slide-up">
        {duplicateDialog}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Scan className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-medium mb-2">Hardware Barcode Scanner</h2>
            <p className="text-muted-foreground text-sm">
              Scan a barcode with your dedicated scanner, or type the ISBN below
            </p>
          </div>

          <form onSubmit={handleInputSubmit} className="max-w-sm mx-auto">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan or enter ISBN..."
                className="font-mono text-center text-lg h-12"
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={!barcodeInput.trim() || isSearching}
                className="h-12 px-6"
              >
                {isSearching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>

          {isSearching && (
            <p className="mt-4 text-sm text-muted-foreground">
              <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
              Searching for book...
            </p>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            Tip: Your scanner should be configured to press Enter after scanning
          </p>
        </div>
      </div>
    );
  }

  // Book not found view
  if (isBookNotFound && !foundBook) {
    return (
      <>
        {duplicateDialog}
        <BookNotFoundMessage
        onRescan={resetScanState}
        onIsbnSubmit={handleScan}
        onAddManually={
          onSwitchToManual
            ? () => {
                const isbn13 =
                  originalIsbn13 ||
                  (lastScannedIsbn.length === 13 ? lastScannedIsbn : undefined);
                const isbn10 =
                  lastScannedIsbn.length === 10
                    ? lastScannedIsbn
                    : isbn13
                    ? (isbn13ToIsbn10(isbn13) ?? undefined)
                    : undefined;
                onSwitchToManual(isbn13, isbn10);
              }
            : undefined
        }
        isbnScanned={lastScannedIsbn}
      />
      </>
    );
  }

  // Book found view
  return (
    <div className="animate-slide-up">
      {duplicateDialog}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8 overflow-hidden">
        {/* Header: Cover + Title + Add Button */}
        <div className="flex items-center gap-4 p-4">
          {/* Cover thumbnail */}
          <div className="shrink-0 w-16 h-24 rounded-md overflow-hidden bg-muted shadow-sm">
            {foundBook!.cover ? (
              <img
                src={foundBook!.cover}
                alt={foundBook!.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookPlus className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Title + Author */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{foundBook!.title}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {foundBook!.authors?.join(', ') || 'Unknown Author'}
            </p>
          </div>

          {/* Add Button - prominent */}
          <Button
            ref={addButtonRef}
            onClick={handleAddAndScanAnother}
            disabled={isSubmitting}
            className="shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Scan className="mr-2 h-4 w-4" />
                Add & Scan
              </>
            )}
          </Button>
        </div>

        {/* Scan hint - subtle text */}
        <p className="px-4 py-3 text-sm text-center text-muted-foreground">
          Scan <span className="font-medium">same barcode</span> to add this book, or <span className="font-medium">different barcode</span> to search another
        </p>

        {/* Main content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium">Book Details</h3>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              onClick={() => setShowWrongBook(!showWrongBook)}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Not this book?
            </button>
          </div>

          {showWrongBook && (
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

          <EditableBookForm book={foundBook!} onChange={handleBookFormChange} />

          {/* Bottom actions + location */}
          <div className="mt-6 pt-4 border-t space-y-3">
            {onLocationChange && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="shrink-0">Location:</span>
                <LocationPicker
                  value={selectedLocationId ?? null}
                  onChange={onLocationChange}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleAddAndScanAnother}
                disabled={isSubmitting}
              >
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
              <Button
                onClick={handleAddScannedBook}
                variant="outline"
                disabled={isSubmitting}
              >
                <BookPlus className="mr-2 h-4 w-4" />
                Add to Library
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
