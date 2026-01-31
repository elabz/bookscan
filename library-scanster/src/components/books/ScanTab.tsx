
import React, { useState } from 'react';
import { Book, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarcodeScanner } from '@/components/scan/BarcodeScanner';
import { ScanTabProps } from '@/types/addBook';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useIsMobile } from '@/hooks/use-mobile';
import { BookEditor } from '@/components/scan/BookEditor';
import { useAddBook } from './AddBookProvider';
import { BookNotFoundMessage } from '@/components/scan/BookNotFoundMessage';

export const ScanTab: React.FC<ScanTabProps> = (props) => {
  const {
    isSearching: propsIsSearching,
    foundBook: propsFoundBook,
    handleIsbnSearch: propsHandleIsbnSearch,
    handleAddScannedBook: propsHandleAddScannedBook,
    isSubmitting: propsIsSubmitting,
    setFoundBook: propsSetFoundBook
  } = props;
  
  // Use context if props are not provided
  const {
    isSearching: contextIsSearching,
    foundBook: contextFoundBook,
    handleIsbnSearch: contextHandleIsbnSearch,
    handleAddScannedBook: contextHandleAddScannedBook,
    isSubmitting: contextIsSubmitting,
    setFoundBook: contextSetFoundBook
  } = useAddBook();
  
  // Use props if available, otherwise use context
  const isSearching = propsIsSearching !== undefined ? propsIsSearching : contextIsSearching;
  const foundBook = propsFoundBook !== undefined ? propsFoundBook : contextFoundBook;
  const handleIsbnSearch = propsHandleIsbnSearch || contextHandleIsbnSearch;
  const handleAddScannedBook = propsHandleAddScannedBook || contextHandleAddScannedBook;
  const isSubmitting = propsIsSubmitting !== undefined ? propsIsSubmitting : contextIsSubmitting;
  const setFoundBook = propsSetFoundBook || contextSetFoundBook;
  
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [lastScannedIsbn, setLastScannedIsbn] = useState<string>("");
  const [isBookNotFound, setIsBookNotFound] = useState(false);
  
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
    setIsBookNotFound(false);
    
    try {
      await handleIsbnSearch(isbn);
      // After search completes, check if a book was found
      // Note: this relies on the handleIsbnSearch updating the foundBook state
      setTimeout(() => {
        // Using a timeout to ensure state updates have occurred
        if (!foundBook) {
          setIsBookNotFound(true);
        }
      }, 300);
    } catch (error) {
      setIsBookNotFound(true);
    }
  };

  // Reset scan state to initial
  const resetScanState = () => {
    setIsBookNotFound(false);
    setFoundBook(null);
    setLastScannedIsbn("");
  };
  
  return (
    <div className="animate-slide-up">
      {!foundBook && !isBookNotFound && (
        <BarcodeScanner onScanComplete={handleScan} />
      )}
      
      {isBookNotFound && (
        <BookNotFoundMessage
          onRescan={resetScanState}
          isbnScanned={lastScannedIsbn}
        />
      )}
      
      {foundBook && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-4">
            <h2 className="text-xl font-medium">Book Found!</h2>
            <div className="flex mt-2 md:mt-0 gap-2">
              <Button onClick={() => setIsEditing(!isEditing)} variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-1" />
                {isEditing ? 'Cancel Edit' : 'Edit Details'}
              </Button>
              <Button onClick={handleAddScannedBook} disabled={isSubmitting} size="sm">
                {isSubmitting ? 'Adding...' : 'Add to Library'}
              </Button>
            </div>
          </div>
          
          {isEditing ? (
            <BookEditor book={foundBook} onSave={(updatedBook) => {
              setFoundBook(updatedBook);
              setIsEditing(false);
            }} />
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
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
              
              <div className="w-full md:w-2/3">
                <h3 className="text-xl font-semibold mb-2">{foundBook.title}</h3>
                <p className="text-muted-foreground mb-4">
                  By {foundBook.authors?.[0] || 'Unknown Author'}
                </p>
                
                {foundBook.description && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-1">Description</h4>
                    <p className="text-sm line-clamp-4">
                      {getDescriptionText(foundBook.description)}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button onClick={() => {
                    setFoundBook(null);
                    setIsBookNotFound(false);
                  }} variant="outline">
                    Scan Another Book
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
