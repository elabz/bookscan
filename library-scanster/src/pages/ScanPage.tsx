
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { fetchBookByISBN } from '@/services/isbnService';
import { addBook } from '@/services/bookService';
import { useAuth } from '@/hooks/useAuth';
import { Book } from '@/types/book';

// Import our components
import { BarcodeScanner } from '@/components/scan/BarcodeScanner';
import { ManualIsbnEntry } from '@/components/scan/ManualIsbnEntry';
import { BookDetailsCard } from '@/components/scan/BookDetailsCard';
import { BookEditor } from '@/components/scan/BookEditor';
import { BookNotFoundMessage } from '@/components/scan/BookNotFoundMessage';
import { ScanPageHeader, ScanPageFooter } from '@/components/scan/ScanPageHeader';

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
  
  const resetScanState = () => {
    setFoundBook(null);
    setIsBookNotFound(false);
    setLastScannedIsbn("");
  };

  const handleIsbnSearch = async (isbn: string) => {
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
      
      // Pass the raw ISBN - the service will handle normalization
      const bookData = await fetchBookByISBN(isbn);
      
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
      // Ensure userId is passed as a string
      const addedBook = await addBook(foundBook, userId);
      
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
          />
        )}
        
        <ScanPageFooter />
      </div>
    </PageLayout>
  );
};

export default ScanPage;
