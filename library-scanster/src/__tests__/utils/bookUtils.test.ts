import { describe, it, expect } from 'vitest';
import {
  formatAuthors,
  getCoverImageUrl,
  transformSearchResult,
  truncateText,
  getMainIdentifier,
  formatIdentifiers,
  getAllIdentifiers,
} from '@/utils/bookUtils';

describe('bookUtils', () => {
  describe('formatAuthors', () => {
    it('returns "Unknown Author" for empty array', () => {
      expect(formatAuthors([])).toBe('Unknown Author');
    });

    it('returns "Unknown Author" for null/undefined', () => {
      expect(formatAuthors(null as any)).toBe('Unknown Author');
    });

    it('returns single author', () => {
      expect(formatAuthors(['John Doe'])).toBe('John Doe');
    });

    it('joins two authors with "and"', () => {
      expect(formatAuthors(['John', 'Jane'])).toBe('John and Jane');
    });

    it('formats three+ authors', () => {
      expect(formatAuthors(['A', 'B', 'C'])).toBe('A and others');
    });
  });

  describe('getCoverImageUrl', () => {
    it('returns placeholder when no coverId', () => {
      expect(getCoverImageUrl()).toBe('/placeholder.svg');
      expect(getCoverImageUrl(undefined)).toBe('/placeholder.svg');
    });

    it('returns medium URL by default', () => {
      expect(getCoverImageUrl(123)).toBe('https://covers.openlibrary.org/b/id/123-medium.jpg');
    });

    it('supports size parameter', () => {
      expect(getCoverImageUrl(123, 'S')).toBe('https://covers.openlibrary.org/b/id/123-small.jpg');
      expect(getCoverImageUrl(123, 'L')).toBe('https://covers.openlibrary.org/b/id/123-large.jpg');
    });
  });

  describe('transformSearchResult', () => {
    it('transforms search result to Book', () => {
      const result = {
        key: '/works/OL123W',
        title: 'Test Book',
        author_name: ['Author'],
        cover_i: 456,
        first_publish_year: 2020,
        isbn: ['9781234567890'],
      };
      const book = transformSearchResult(result);
      expect(book.id).toBe('OL123W');
      expect(book.title).toBe('Test Book');
      expect(book.authors).toEqual(['Author']);
      expect(book.isbn).toBe('9781234567890');
      expect(book.cover).toContain('456');
      expect(book.publishedDate).toBe('2020');
    });

    it('handles missing fields with defaults', () => {
      const result = { key: '', title: '' } as any;
      const book = transformSearchResult(result);
      expect(book.title).toBe('Unknown Title');
      expect(book.authors).toEqual(['Unknown Author']);
    });
  });

  describe('truncateText', () => {
    it('returns short text unchanged', () => {
      expect(truncateText('hello', 10)).toBe('hello');
    });

    it('truncates long text with ellipsis', () => {
      expect(truncateText('hello world', 5)).toBe('hello...');
    });

    it('handles empty/null text', () => {
      expect(truncateText('', 5)).toBe('');
      expect(truncateText(null as any, 5)).toBe(null);
    });
  });

  describe('getMainIdentifier', () => {
    it('returns isbn when present', () => {
      expect(getMainIdentifier({ title: 'T', authors: [], isbn: '123' })).toBe('123');
    });

    it('falls back to isbn_13', () => {
      expect(getMainIdentifier({
        title: 'T', authors: [],
        identifiers: { isbn_13: ['9781234567890'] },
      })).toBe('9781234567890');
    });

    it('falls back to isbn_10', () => {
      expect(getMainIdentifier({
        title: 'T', authors: [],
        identifiers: { isbn_10: ['0306406152'] },
      })).toBe('0306406152');
    });

    it('falls back to goodreads', () => {
      expect(getMainIdentifier({
        title: 'T', authors: [],
        identifiers: { goodreads: ['12345'] },
      })).toBe('goodreads:12345');
    });

    it('returns undefined when no identifiers', () => {
      expect(getMainIdentifier({ title: 'T', authors: [] })).toBeUndefined();
    });
  });

  describe('formatIdentifiers', () => {
    it('formats identifiers object', () => {
      const result = formatIdentifiers({ isbn_13: ['978'], oclc: ['123'] });
      expect(result).toBe('isbn_13: 978 | oclc: 123');
    });

    it('handles empty arrays', () => {
      expect(formatIdentifiers({ isbn_13: [] })).toBe('');
    });
  });

  describe('getAllIdentifiers', () => {
    it('returns ISBN as first identifier', () => {
      const result = getAllIdentifiers({ title: 'T', authors: [], isbn: '123' });
      expect(result['ISBN']).toBe('123');
    });

    it('formats identifier keys', () => {
      const result = getAllIdentifiers({
        title: 'T', authors: [],
        identifiers: { isbn_13: ['978'] },
      });
      expect(result['ISBN-13']).toBe('978');
    });
  });
});
