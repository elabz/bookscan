import { api } from '@/lib/api';
import { Book } from '@/types/book';
import { dbBookToAppFormat } from './converters';

// Get all books in a user's library
export const getUserBooks = async (): Promise<Book[]> => {
  try {
    const rows = await api.get<any[]>('/library');
    return rows.map(row => dbBookToAppFormat(row));
  } catch (error) {
    console.error('Error in getUserBooks:', error);
    return [];
  }
};

// Search books in user's library
export const searchUserBooks = async (query: string): Promise<Book[]> => {
  try {
    const rows = await api.get<any[]>(`/library/search?query=${encodeURIComponent(query)}`);
    return rows.map(row => dbBookToAppFormat(row));
  } catch (error) {
    console.error('Error in searchUserBooks:', error);
    return [];
  }
};

// Get featured books (public, no auth)
export const getFeaturedBooks = async (): Promise<Book[]> => {
  try {
    const rows = await api.get<any[]>('/library/featured');
    return rows.map(row => dbBookToAppFormat(row));
  } catch (error) {
    console.error('Error in getFeaturedBooks:', error);
    return [];
  }
};

// Get a single book by ID (requires auth)
export const getBookById = async (id: string): Promise<Book | null> => {
  try {
    const row = await api.get<any>(`/library/book/${id}`);
    return dbBookToAppFormat(row);
  } catch (error) {
    console.error('Error in getBookById:', error);
    return null;
  }
};

// Get a single book by ID (public, no auth required)
export const getBookByIdPublic = async (id: string): Promise<Book | null> => {
  try {
    const row = await api.get<any>(`/library/book/${id}/public`);
    return dbBookToAppFormat(row);
  } catch (error) {
    console.error('Error in getBookByIdPublic:', error);
    return null;
  }
};
