
import { Book, BookSearchResult } from '@/types/book';

export const formatAuthors = (authors: string[]): string => {
  if (!authors || authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors[0]} and others`;
};

export const getCoverImageUrl = (coverId?: number, size: 'S' | 'M' | 'L' = 'M'): string => {
  if (!coverId) return '/placeholder.svg';
  const sizeMap = { S: 'small', M: 'medium', L: 'large' };
  return `https://covers.openlibrary.org/b/id/${coverId}-${sizeMap[size]}.jpg`;
};

export const transformSearchResult = (result: BookSearchResult): Book => {
  return {
    id: result.key?.replace('/works/', ''),
    title: result.title || 'Unknown Title',
    authors: result.author_name || ['Unknown Author'],
    isbn: result.isbn?.[0],
    cover: result.cover_i ? getCoverImageUrl(result.cover_i) : undefined,
    publishedDate: result.first_publish_year?.toString()
  };
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Utility functions for identifiers
export const getMainIdentifier = (book: Book): string | undefined => {
  if (book.isbn) return book.isbn;
  
  if (book.identifiers) {
    // First try ISBN-13 as it's the modern standard
    if (book.identifiers.isbn_13 && book.identifiers.isbn_13.length > 0) {
      return book.identifiers.isbn_13[0];
    }
    // Then try ISBN-10
    if (book.identifiers.isbn_10 && book.identifiers.isbn_10.length > 0) {
      return book.identifiers.isbn_10[0];
    }
    // Try other identifiers if needed
    if (book.identifiers.goodreads && book.identifiers.goodreads.length > 0) {
      return `goodreads:${book.identifiers.goodreads[0]}`;
    }
    if (book.identifiers.oclc && book.identifiers.oclc.length > 0) {
      return `oclc:${book.identifiers.oclc[0]}`;
    }
    if (book.identifiers.lccn && book.identifiers.lccn.length > 0) {
      return `lccn:${book.identifiers.lccn[0]}`;
    }
  }
  
  return undefined;
};

export const formatIdentifiers = (identifiers: Record<string, string[]>): string => {
  const parts = [];
  for (const [key, values] of Object.entries(identifiers)) {
    if (values && values.length > 0) {
      parts.push(`${key}: ${values.join(', ')}`);
    }
  }
  return parts.join(' | ');
};

export const getAllIdentifiers = (book: Book): Record<string, string> => {
  const result: Record<string, string> = {};
  
  if (book.isbn) {
    result['ISBN'] = book.isbn;
  }
  
  if (book.identifiers) {
    Object.entries(book.identifiers).forEach(([key, values]) => {
      if (values && values.length > 0) {
        // Format the key for display (e.g., isbn_13 -> ISBN-13)
        const formattedKey = key.split('_')
          .map(part => part.toUpperCase())
          .join('-');
        
        result[formattedKey] = values[0];
      }
    });
  }
  
  return result;
};
