
import { useState, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { fetchBookByCode, checkDuplicateInLibrary } from '@/services/isbnService';
import { searchSimilarInLibrary } from '@/services/searchService';
import { addBook } from '@/services/bookService';
import { updateBookLocation } from '@/services/locationService';
import { useAuth } from '@/hooks/useAuth';
import { Book } from '@/types/book';

// Import our components
import { BarcodeScanner } from '@/components/scan/BarcodeScanner';
import { ManualIsbnEntry } from '@/components/scan/ManualIsbnEntry';
import { BookDetailsCard } from '@/components/scan/BookDetailsCard';
import { BookEditor } from '@/components/scan/BookEditor';
import { BookNotFoundMessage } from '@/components/scan/BookNotFoundMessage';
import { ScanPageHeader, ScanPageFooter } from '@/components/scan/ScanPageHeader';
import { DuplicateBookDialog } from '@/components/scan/DuplicateBookDialog';
import { SimilarBooksCard } from '@/components/scan/SimilarBooksCard';

const LOCATION_STORAGE_KEY = 'addBook_selectedLocationId';

const ScanPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [foundBook, setFoundBook] = useState<Book | null>(null);
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastScannedIsbn, setLastScannedIsbn] = useState<string>("");
  const [isBookNotFound, setIsBookNotFound] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(() =>
    sessionStorage.getItem(LOCATION_STORAGE_KEY) || null
  );

  // Duplicate detection state
  const [duplicateBook, setDuplicateBook] = useState<{ id: string; title: string; authors: string[]; cover_url?: string } | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Similar books state
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const similarBooksRef = useRef<HTMLDivElement>(null);

  // Key to force BarcodeScanner remount on reset
  const [scanKey, setScanKey] = useState(0);

  const handleLocationChange = (locId: string | null) => {
    setSelectedLocationId(locId);
    if (locId) {
      sessionStorage.setItem(LOCATION_STORAGE_KEY, locId);
    } else {
      sessionStorage.removeItem(LOCATION_STORAGE_KEY);
    }
  };

  const resetScanState = () => {
    setFoundBook(null);
    setIsBookNotFound(false);
    setScanFailed(false);
    setLastScannedIsbn("");
    setDuplicateBook(null);
    setShowDuplicateDialog(false);
    setSimilarBooks([]);
    setIsLoadingSimilar(false);
    setScanKey(k => k + 1); // Force BarcodeScanner remount
  };

  const handleScanFailed = () => {
    setScanFailed(true);
  };

  const startSimilarSearch = async (book: Book) => {
    if (!userId) return;
    setIsLoadingSimilar(true);
    try {
      // Build a rich text string from book metadata for similarity matching
      const parts = [
        book.title,
        book.authors?.join(', '),
        book.subjects?.map(s => typeof s === 'string' ? s : s.name).join(', '),
        book.publisher,
        book.description?.slice(0, 200),
      ].filter(Boolean);
      const text = parts.join(' ');

      const results = await searchSimilarInLibrary(text, 5);
      // Filter out the scanned book itself
      const filtered = results.filter(b => b.id !== book.id);
      setSimilarBooks(filtered);
    } catch (error) {
      console.error('Error searching similar books:', error);
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  const handleIsbnSearch = async (isbn: string, upc?: string) => {
    if (!isbn) return;

    setIsSearching(true);
    setFoundBook(null);
    setIsBookNotFound(false);
    setLastScannedIsbn(isbn);
    setSimilarBooks([]);
    setIsLoadingSimilar(false);

    try {
      toast({
        title: "Searching...",
        description: `Looking up: ${isbn}`,
      });

      // Check for duplicate in user's library first
      if (userId) {
        const dupResult = await checkDuplicateInLibrary(isbn);
        if (dupResult.duplicate && dupResult.book) {
          setDuplicateBook(dupResult.book);
          setShowDuplicateDialog(true);
          setIsSearching(false);
          return;
        }
      }

      // Use unified code lookup (handles ISBN, LCCN, UPC)
      const bookData = await fetchBookByCode(isbn, upc);

      if (bookData) {
        setFoundBook(bookData);
        toast({
          title: "Book Found!",
          description: `"${bookData.title}" by ${bookData.authors?.[0] || 'Unknown Author'}`,
        });

        // Fire async similar books search
        startSimilarSearch(bookData);
      } else {
        setIsBookNotFound(true);
        toast({
          title: "Book Not Found",
          description: "We couldn't find a book with that code. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching for book:', error);
      setFoundBook(null);
      setIsBookNotFound(true);
      toast({
        title: "Search Failed",
        description: "There was an error searching for the book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!foundBook) {
      toast({
        title: "Error",
        description: "No book found to add",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add books to your library",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsAddingToLibrary(true);

    try {
      console.log('Adding book to library with userId:', userId);
      const addedBook = await addBook(foundBook, userId);

      // Set location if one is selected
      if (selectedLocationId && addedBook.id) {
        await updateBookLocation(addedBook.id, selectedLocationId).catch((err) =>
          console.error('Failed to set book location:', err)
        );
      }

      toast({
        title: "Success!",
        description: `"${addedBook.title}" has been added to your library`,
      });

      navigate('/library');
    } catch (error) {
      console.error('Failed to add book:', error);
      toast({
        title: "Error",
        description: "Failed to add book to your library. Please try again or check if you're signed in.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToLibrary(false);
    }
  };

  const handleScrollToSimilar = () => {
    similarBooksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <ScanPageHeader />

        {!foundBook && !isEditing && !isBookNotFound && (
          <>
            {!scanFailed && (
              <BarcodeScanner key={scanKey} onScanComplete={handleIsbnSearch} onScanFailed={handleScanFailed} />
            )}

            <ManualIsbnEntry
              onSubmit={handleIsbnSearch}
              isSearching={isSearching}
              autoFocus={scanFailed}
              bannerMessage={scanFailed ? "This book has a low quality barcode that cannot be read with the camera. Please add the ISBN manually." : undefined}
            />
          </>
        )}

        {isBookNotFound && !foundBook && (
          <BookNotFoundMessage
            onRescan={resetScanState}
            onIsbnSubmit={(manualIsbn) => handleIsbnSearch(manualIsbn, lastScannedIsbn)}
            isbnScanned={lastScannedIsbn}
          />
        )}

        {isEditing && foundBook && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
            <h2 className="text-xl font-medium mb-4">Edit Book Details</h2>
            <BookEditor
              book={foundBook}
              onSave={(updatedBook) => {
                setFoundBook(updatedBook);
                setIsEditing(false);
                toast({
                  title: "Book Updated",
                  description: "Book details have been updated successfully",
                });
              }}
            />
          </div>
        )}

        {foundBook && !isEditing && !isBookNotFound && (
          <>
            <BookDetailsCard
              book={foundBook}
              onAddToLibrary={handleAddToLibrary}
              onEditBook={() => setIsEditing(true)}
              isAddingToLibrary={isAddingToLibrary}
              selectedLocationId={selectedLocationId}
              onLocationChange={handleLocationChange}
              hasSimilarBooks={similarBooks.length > 0}
              onScrollToSimilar={handleScrollToSimilar}
            />
            <SimilarBooksCard
              ref={similarBooksRef}
              books={similarBooks}
              isLoading={isLoadingSimilar}
            />
          </>
        )}

        {/* Duplicate book dialog */}
        {duplicateBook && (
          <DuplicateBookDialog
            open={showDuplicateDialog}
            book={duplicateBook}
            onScanAnother={resetScanState}
            onGoToLibrary={() => navigate('/library')}
          />
        )}

        <ScanPageFooter />
      </div>
    </PageLayout>
  );
};

export default ScanPage;
