
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookPlus, Loader2, Scan, Search, AlertTriangle, Camera, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarcodeScanner } from '@/components/scan/BarcodeScanner';
import { ScanTabProps } from '@/types/addBook';
import { useAddBook } from './AddBookProvider';
import { BookNotFoundMessage } from '@/components/scan/BookNotFoundMessage';
import { LocationPicker } from '@/components/library/LocationPicker';
import { isbn13ToIsbn10 } from '@/utils/isbnUtils';
import { EditableBookForm } from '@/components/scan/EditableBookForm';
import { Book } from '@/types/book';
import { HardwareScannerTab } from '@/components/scan/HardwareScannerTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DuplicateBookDialog } from '@/components/scan/DuplicateBookDialog';

const SCAN_MODE_STORAGE_KEY = 'addBook_scanMode';

export const ScanTab: React.FC<ScanTabProps> = (props) => {
  const {
    selectedLocationId,
    onLocationChange,
    onSwitchToManual,
  } = props;

  // Sticky scan mode preference (camera or scanner)
  const [scanMode, setScanMode] = useState<string>(() => {
    return localStorage.getItem(SCAN_MODE_STORAGE_KEY) || 'camera';
  });

  const scannerInputRef = useRef<HTMLInputElement>(null);

  const handleScanModeChange = (mode: string) => {
    setScanMode(mode);
    localStorage.setItem(SCAN_MODE_STORAGE_KEY, mode);

    // Focus the scanner input after tab switch
    // Use requestAnimationFrame after timeout to ensure DOM is ready and focus sticks
    if (mode === 'scanner') {
      setTimeout(() => {
        requestAnimationFrame(() => {
          scannerInputRef.current?.focus();
        });
      }, 100);
    }
  };

  return (
    <div className="animate-slide-up">
      <Tabs value={scanMode} onValueChange={handleScanModeChange} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6 max-w-sm mx-auto">
          <TabsTrigger value="camera" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Camera
          </TabsTrigger>
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <ScanBarcode className="h-4 w-4" />
            Scanner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera">
          <CameraScannerContent
            selectedLocationId={selectedLocationId}
            onLocationChange={onLocationChange}
            onSwitchToManual={onSwitchToManual}
            onSwitchToScanner={() => handleScanModeChange('scanner')}
          />
        </TabsContent>

        <TabsContent value="scanner" tabIndex={-1}>
          <HardwareScannerTab
            selectedLocationId={selectedLocationId ?? null}
            onLocationChange={onLocationChange ?? (() => {})}
            onSwitchToManual={onSwitchToManual}
            isActive={scanMode === 'scanner'}
            inputRef={scannerInputRef}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Camera-based scanner content (extracted from original ScanTab)
interface CameraScannerContentProps {
  selectedLocationId?: string | null;
  onLocationChange?: (locId: string | null) => void;
  onSwitchToManual?: (isbn13?: string, isbn10?: string) => void;
  onSwitchToScanner?: () => void;
}

const CameraScannerContent: React.FC<CameraScannerContentProps> = ({
  selectedLocationId,
  onLocationChange,
  onSwitchToManual,
  onSwitchToScanner,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
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

  const [lastScannedIsbn, setLastScannedIsbn] = useState<string>('');
  const [originalIsbn13, setOriginalIsbn13] = useState<string>('');
  const [isBookNotFound, setIsBookNotFound] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [showWrongBook, setShowWrongBook] = useState(false);
  const [wrongBookQuery, setWrongBookQuery] = useState('');

  // Apply cover URLs returned from TakePhotoPage
  const appliedCoverRef = useRef(false);
  useEffect(() => {
    const state = location.state as {
      coverUrl?: string;
      coverSmallUrl?: string;
      coverLargeUrl?: string;
    } | null;

    if (state?.coverUrl && foundBook && !appliedCoverRef.current) {
      appliedCoverRef.current = true;
      setFoundBook({
        ...foundBook,
        cover: state.coverUrl,
        coverSmall: state.coverSmallUrl || foundBook.coverSmall,
        coverLarge: state.coverLargeUrl || foundBook.coverLarge,
      });
      // Clear the location state to prevent re-applying on re-renders
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Reset the flag if there's no cover URL in state (new navigation)
    if (!state?.coverUrl) {
      appliedCoverRef.current = false;
    }
  }, [location.state, foundBook, setFoundBook, navigate, location.pathname]);

  const handleBookFormChange = useCallback(
    (updatedBook: Book) => {
      setFoundBook(updatedBook);
    },
    [setFoundBook]
  );

  const handleScan = async (isbn: string) => {
    setLastScannedIsbn(isbn);
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

  const resetScanState = useCallback(() => {
    setIsBookNotFound(false);
    setFoundBook(null);
    setLastScannedIsbn('');
    setOriginalIsbn13('');
    setShowWrongBook(false);
    setWrongBookQuery('');
    setScannerKey((k) => k + 1);
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

  return (
    <>
      {!foundBook && !isBookNotFound && (
        <BarcodeScanner key={scannerKey} onScanComplete={handleScan} />
      )}

      {isBookNotFound && !foundBook && (
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
      )}

      {foundBook && !isBookNotFound && (
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8 overflow-hidden"
        >
          {/* Header: Cover + Title + Add Button */}
          <div className="flex items-center gap-4 p-4">
            {/* Cover thumbnail */}
            <div className="shrink-0 w-16 h-24 rounded-md overflow-hidden bg-muted shadow-sm">
              {foundBook.cover ? (
                <img
                  src={foundBook.cover}
                  alt={foundBook.title}
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
              <h2 className="text-lg font-semibold truncate">{foundBook.title}</h2>
              <p className="text-sm text-muted-foreground truncate">
                {foundBook.authors?.join(', ') || 'Unknown Author'}
              </p>
            </div>

            {/* Add Button - prominent */}
            <Button
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

            <EditableBookForm book={foundBook} onChange={handleBookFormChange} />

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
      )}

      {/* Duplicate book dialog */}
      {duplicateBook && (
        <DuplicateBookDialog
          open={showDuplicateDialog}
          book={duplicateBook}
          onScanAnother={() => {
            dismissDuplicateDialog();
            resetScanState();
            // Switch to hardware scanner tab with focused input
            onSwitchToScanner?.();
          }}
          onGoToLibrary={() => {
            dismissDuplicateDialog();
            navigate('/library');
          }}
        />
      )}
    </>
  );
};
