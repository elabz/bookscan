
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { fetchBookByISBN } from '@/services/isbnService';
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
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(() =>
    sessionStorage.getItem(LOCATION_STORAGE_KEY) || null
  );

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
    setLastScannedIsbn("");
  };

  const handleIsbnSearch = async (isbn: string, upc?: string) => {
    if (!isbn) return;

    setIsSearching(true);
    setFoundBook(null);
    setIsBookNotFound(false);
    setLastScannedIsbn(isbn);

    try {
      toast({
        title: "Searching...",
        description: `Looking up ISBN: ${isbn}`,
      });

      // Pass the raw ISBN and optional UPC (from manual entry after UPC scan)
      const bookData = await fetchBookByISBN(isbn, upc);
      
      if (bookData) {
        setFoundBook(bookData);
        toast({
          title: "Book Found!",
          description: `"${bookData.title}" by ${bookData.authors?.[0] || 'Unknown Author'}`,
        });
      } else {
        setIsBookNotFound(true);
        toast({
          title: "Book Not Found",
          description: "We couldn't find a book with that ISBN. Please check the number and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching for book:', error);
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

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <ScanPageHeader />
        
        {!foundBook && !isEditing && !isBookNotFound && (
          <>
            <BarcodeScanner onScanComplete={handleIsbnSearch} />
            
            <ManualIsbnEntry 
              onSubmit={handleIsbnSearch}
              isSearching={isSearching}
            />
          </>
        )}
        
        {isBookNotFound && (
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
        
        {foundBook && !isEditing && (
          <BookDetailsCard
            book={foundBook}
            onAddToLibrary={handleAddToLibrary}
            onEditBook={() => setIsEditing(true)}
            isAddingToLibrary={isAddingToLibrary}
            selectedLocationId={selectedLocationId}
            onLocationChange={handleLocationChange}
          />
        )}
        
        <ScanPageFooter />
      </div>
    </PageLayout>
  );
};

export default ScanPage;
