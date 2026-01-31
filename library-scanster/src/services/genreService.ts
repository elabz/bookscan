import { api } from '@/lib/api';
import { Genre } from '@/types/book';

export const getAllGenres = async (): Promise<Genre[]> => {
  try {
    return await api.get<Genre[]>('/genres');
  } catch (error) {
    console.error('Error in getAllGenres:', error);
    return [];
  }
};

export const addGenre = async (name: string, description?: string): Promise<Genre | null> => {
  try {
    return await api.post<Genre>('/genres', { name, description });
  } catch (error) {
    console.error('Error in addGenre:', error);
    return null;
  }
};

export const addGenreToBook = async (bookId: string, genreId: number): Promise<boolean> => {
  try {
    await api.post(`/genres/book/${bookId}`, { genreId });
    return true;
  } catch (error) {
    console.error('Error in addGenreToBook:', error);
    return false;
  }
};

export const getBookGenres = async (bookId: string): Promise<Genre[]> => {
  try {
    return await api.get<Genre[]>(`/genres/book/${bookId}`);
  } catch (error) {
    console.error('Error in getBookGenres:', error);
    return [];
  }
};

export const getBooksByGenre = async (genreId: number): Promise<string[]> => {
  try {
    return await api.get<string[]>(`/genres/${genreId}/books`);
  } catch (error) {
    console.error('Error in getBooksByGenre:', error);
    return [];
  }
};

export const removeGenreFromBook = async (bookId: string, genreId: number): Promise<boolean> => {
  try {
    await api.delete(`/genres/book/${bookId}/${genreId}`);
    return true;
  } catch (error) {
    console.error('Error in removeGenreFromBook:', error);
    return false;
  }
};
