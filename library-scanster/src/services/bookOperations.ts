import { api } from '@/lib/api';
import { Book } from '@/types/book';
import { bookToDbFormat, dbBookToAppFormat } from './converters';

// Add a book to the system and user's library
export const addBookToLibrary = async (book: Book): Promise<Book | null> => {
  try {
    const dbBook = bookToDbFormat({
      ...book,
      id: book.id || Math.random().toString(36).substring(2, 9),
    });

    const row = await api.post<any>('/library/book', dbBook);
    return dbBookToAppFormat(row);
  } catch (error) {
    console.error('Error in addBookToLibrary:', error);
    throw error;
  }
};

// Update a book's details
export const updateBookDetails = async (bookId: string, book: Partial<Book>): Promise<Book | null> => {
  try {
    const dbBook = bookToDbFormat(book as Book);
    const row = await api.patch<any>(`/library/book/${bookId}`, dbBook);
    return dbBookToAppFormat(row);
  } catch (error) {
    console.error('Error in updateBookDetails:', error);
    throw error;
  }
};

// Remove a book from a user's library
export const removeBookFromLibrary = async (bookId: string): Promise<boolean> => {
  try {
    await api.delete(`/library/book/${bookId}`);
    return true;
  } catch (error) {
    console.error('Error in removeBookFromLibrary:', error);
    return false;
  }
};
