
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book as BookType } from '@/types/book';
import { addBook, searchOpenLibrary } from '@/services/bookService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { fetchBookByISBN } from '@/services/isbnService';
import { updateBookLocation } from '@/services/locationService';

interface AddBookContextType {
  searchResults: BookType[];
  isSearching: boolean;
  hasSearched: boolean;
  newBook: Partial<BookType>;
  isSubmitting: boolean;
  foundBook: BookType | null;
  handleSearch: (query: string) => Promise<void>;
  handleManualChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmitManual: (e: React.FormEvent) => Promise<void>;
  handleSelectBook: (book: BookType) => Promise<void>;
  handleIsbnSearch: (isbn: string) => Promise<void>;
  handleAddScannedBook: () => Promise<void>;
  handleAddAndScanAnother: () => Promise<void>;
  setFoundBook: (book: BookType | null) => void;
  setNewBook: React.Dispatch<React.SetStateAction<Partial<BookType>>>;
}

const AddBookContext = createContext<AddBookContextType | undefined>(undefined);

export const useAddBook = () => {
  const context = useContext(AddBookContext);
  if (context === undefined) {
    throw new Error('useAddBook must be used within an AddBookProvider');
  }
  return context;
};

export const AddBookProvider: React.FC<{ children: React.ReactNode; locationId?: string | null }> = ({ children, locationId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useAuth();
  const [searchResults, setSearchResults] = useState<BookType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const MANUAL_BOOK_KEY = 'addBook_manualDraft';
  const [newBook, setNewBook] = useState<Partial<BookType>>(() => {
    try {
      const saved = sessionStorage.getItem(MANUAL_BOOK_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { title: '', authors: [''], description: '' };
  });

  // Persist manual-entry draft to sessionStorage so it survives navigation to /take-photo
  React.useEffect(() => {
    sessionStorage.setItem(MANUAL_BOOK_KEY, JSON.stringify(newBook));
  }, [newBook]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundBook, setFoundBook] = useState<BookType | null>(null);

  const handleSearch = async (query: string) => {
    try {
      setIsSearching(true);
      setHasSearched(true);
      const results = await searchOpenLibrary(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      toast({
        title: 'Search Failed',
        description: 'Failed to fetch search results. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'author') {
      setNewBook(prev => ({
        ...prev,
        authors: [value]
      }));
    } else if (name === 'isbn10') {
      setNewBook(prev => ({
        ...prev,
        identifiers: {
          ...prev.identifiers,
          isbn_10: value ? [value] : undefined,
        },
      }));
    } else if (name === 'isbn') {
      setNewBook(prev => ({
        ...prev,
        isbn: value,
        identifiers: {
          ...prev.identifiers,
          isbn_13: value ? [value] : undefined,
        },
      }));
    } else {
      setNewBook(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBook.title || !newBook.authors?.[0]) {
      toast({
        title: 'Missing Information',
        description: 'Title and author are required fields.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const userIdString = userId ? String(userId) : undefined;
      const createdBook = await addBook(newBook as BookType, userIdString);
      if (locationId && createdBook.id) {
        await updateBookLocation(createdBook.id, locationId).catch(console.error);
      }

      sessionStorage.removeItem(MANUAL_BOOK_KEY);
      toast({
        title: 'Book Added',
        description: `"${createdBook.title}" has been added to your library.`
      });

      navigate('/library');
    } catch (error) {
      console.error('Failed to add book:', error);
      toast({
        title: 'Error',
        description: 'Failed to add book. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectBook = async (book: BookType) => {
    try {
      setIsSubmitting(true);
      const userIdString = userId ? String(userId) : undefined;
      const createdBook = await addBook(book, userIdString);
      if (locationId && createdBook.id) {
        await updateBookLocation(createdBook.id, locationId).catch(console.error);
      }

      toast({
        title: 'Book Added',
        description: `"${createdBook.title}" has been added to your library.`
      });

      navigate('/library');
    } catch (error) {
      console.error('Failed to add book:', error);
      toast({
        title: 'Error',
        description: 'Failed to add book. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIsbnSearch = async (isbn: string): Promise<void> => {
    if (!isbn) return;

    setIsSearching(true);
    setFoundBook(null);

    try {
      toast({
        title: "Searching...",
        description: `Looking up ISBN: ${isbn}`,
      });

      const bookData = await fetchBookByISBN(isbn);

      if (bookData) {
        setFoundBook(bookData);
        toast({
          title: "Book Found!",
          description: `"${bookData.title}" by ${bookData.authors?.[0] || 'Unknown Author'}`,
        });
      } else {
        toast({
          title: "Book Not Found",
          description: "This ISBN wasn't found in any database.",
          variant: "destructive",
        });
        throw new Error('not_found');
      }
    } catch (error: any) {
      if (error?.message === 'not_found') {
        // Re-throw so ScanTab can show BookNotFoundMessage
        throw error;
      }
      console.error('Error searching for book:', error);
      toast({
        title: "Search Failed",
        description: "There was an error searching for the book. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddScannedBook = async () => {
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
    
    setIsSubmitting(true);
    
    try {
      console.log('Adding book to library with userId:', userId);
      const addedBook = await addBook(foundBook, userId);
      if (locationId && addedBook.id) {
        await updateBookLocation(addedBook.id, locationId).catch(console.error);
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
      setIsSubmitting(false);
    }
  };

  const handleAddAndScanAnother = async () => {
    if (!foundBook) return;
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add books to your library",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const addedBook = await addBook(foundBook, userId);
      if (locationId && addedBook.id) {
        await updateBookLocation(addedBook.id, locationId).catch(console.error);
      }

      toast({
        title: "Added!",
        description: `"${addedBook.title}" added to your library`,
      });

      setFoundBook(null);
    } catch (error) {
      console.error('Failed to add book:', error);
      toast({
        title: "Error",
        description: "Failed to add book to your library. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = {
    searchResults,
    isSearching,
    hasSearched,
    newBook,
    isSubmitting,
    foundBook,
    handleSearch,
    handleManualChange,
    handleSubmitManual,
    handleSelectBook,
    handleIsbnSearch,
    handleAddScannedBook,
    handleAddAndScanAnother,
    setFoundBook,
    setNewBook
  };

  return (
    <AddBookContext.Provider value={value}>
      {children}
    </AddBookContext.Provider>
  );
};
