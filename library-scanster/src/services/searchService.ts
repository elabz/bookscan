
import { api } from '@/lib/api';
import { Book, DbBookRow } from '@/types/book';
import { dbBookToAppFormat } from './converters';

// Search books via local Elasticsearch (keyword + vector)
export const searchBooks = async (query: string): Promise<Book[]> => {
  try {
    const results = await api.get<DbBookRow[]>(`/search?q=${encodeURIComponent(query)}&limit=20`);
    return results.map((item) => dbBookToAppFormat(item));
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};

// Search for similar books in user's library
export const searchSimilarInLibrary = async (text: string, limit = 10): Promise<Book[]> => {
  try {
    const results = await api.post<DbBookRow[]>('/search/similar', { text, limit });
    return results.map((item) => dbBookToAppFormat(item));
  } catch (error) {
    console.error('Error searching similar books:', error);
    return [];
  }
};

interface OpenLibrarySearchDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
  description?: string;
  number_of_pages?: number;
  subject?: string[];
  language?: string[];
}

// Search OpenLibrary API (for discovering new books not yet in our DB)
export const searchOpenLibrary = async (query: string, limit = 20): Promise<Book[]> => {
  try {
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch from OpenLibrary API');
    }

    const data = await response.json();

    if (data.docs && Array.isArray(data.docs)) {
      return data.docs.map((item: OpenLibrarySearchDoc): Book => {
        const coverId = item.cover_i;
        const coverUrl = coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
          : undefined;

        return {
          id: item.key?.replace('/works/', '') || Math.random().toString(36).substring(2, 9),
          title: item.title || 'Unknown Title',
          authors: item.author_name || ['Unknown Author'],
          isbn: item.isbn ? item.isbn[0] : undefined,
          cover: coverUrl,
          publishedDate: item.first_publish_year?.toString(),
          description: item.description || undefined,
          pageCount: item.number_of_pages,
          categories: item.subject,
          language: item.language?.[0]
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Error searching OpenLibrary:', error);
    return [];
  }
};
