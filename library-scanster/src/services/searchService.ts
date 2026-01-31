
import { api } from '@/lib/api';
import { Book } from '@/types/book';
import { dbBookToAppFormat } from './converters';

// Search books via local Elasticsearch (keyword + vector)
export const searchBooks = async (query: string): Promise<Book[]> => {
  try {
    const results = await api.get<any[]>(`/search?q=${encodeURIComponent(query)}&limit=20`);
    return results.map((item: any) => dbBookToAppFormat(item));
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};

// Search OpenLibrary API (for discovering new books not yet in our DB)
export const searchOpenLibrary = async (query: string): Promise<Book[]> => {
  try {
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);

    if (!response.ok) {
      throw new Error('Failed to fetch from OpenLibrary API');
    }

    const data = await response.json();

    if (data.docs && Array.isArray(data.docs)) {
      return data.docs.map((item: any): Book => {
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
