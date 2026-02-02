import { describe, it, expect } from 'vitest';
import { bookToDbFormat, dbBookToAppFormat } from '@/services/converters';

describe('converters', () => {
  describe('bookToDbFormat', () => {
    it('converts Book to DB format', () => {
      const book = {
        id: 'b1',
        title: 'Test Book',
        authors: ['Author'],
        isbn: '9781234567890',
        cover: 'http://cover.jpg',
        coverSmall: 'http://cover-s.jpg',
        coverLarge: 'http://cover-l.jpg',
        publisher: 'Publisher',
        publishedDate: '2024',
        description: 'A book',
        pageCount: 300,
        categories: ['Fiction'],
        language: 'en',
        edition: '1st',
      };

      const db = bookToDbFormat(book);
      expect(db.id).toBe('b1');
      expect(db.title).toBe('Test Book');
      expect(db.cover_url).toBe('http://cover.jpg');
      expect(db.cover_small_url).toBe('http://cover-s.jpg');
      expect(db.cover_large_url).toBe('http://cover-l.jpg');
      expect(db.published_date).toBe('2024');
      expect(db.page_count).toBe(300);
    });

    it('handles null/undefined fields', () => {
      const db = bookToDbFormat({ title: 'T', authors: [] } as any);
      expect(db.isbn).toBeNull();
      expect(db.cover_url).toBeNull();
      expect(db.publisher).toBeNull();
    });
  });

  describe('dbBookToAppFormat', () => {
    it('converts DB row to Book format', () => {
      const row = {
        id: 'b1',
        title: 'Test',
        authors: ['Author'],
        isbn: '123',
        cover_url: 'http://cover.jpg',
        cover_small_url: 'http://cover-s.jpg',
        cover_large_url: 'http://cover-l.jpg',
        publisher: 'Pub',
        published_date: '2024',
        description: 'Desc',
        page_count: 200,
        categories: ['Fiction'],
        language: 'en',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        location_id: 'loc1',
      };

      const book = dbBookToAppFormat(row);
      expect(book.id).toBe('b1');
      expect(book.cover).toBe('http://cover.jpg');
      expect(book.coverSmall).toBe('http://cover-s.jpg');
      expect(book.publishedDate).toBe('2024');
      expect(book.pageCount).toBe(200);
      expect(book.location_id).toBe('loc1');
      expect(book.createdAt).toBe('2024-01-01');
    });

    it('prefers user_cover_url over cover_url', () => {
      const row = {
        id: 'b1', title: 'T', authors: [],
        cover_url: 'http://global.jpg',
        user_cover_url: 'http://personal.jpg',
        cover_small_url: 'http://global-s.jpg',
        user_cover_small_url: 'http://personal-s.jpg',
        cover_large_url: 'http://global-l.jpg',
        user_cover_large_url: 'http://personal-l.jpg',
      };

      const book = dbBookToAppFormat(row);
      expect(book.cover).toBe('http://personal.jpg');
      expect(book.coverSmall).toBe('http://personal-s.jpg');
      expect(book.coverLarge).toBe('http://personal-l.jpg');
    });

    it('accepts optional genres parameter', () => {
      const row = { id: 'b1', title: 'T', authors: [] };
      const genres = [{ id: 1, name: 'Fiction' }];
      const book = dbBookToAppFormat(row, genres);
      expect(book.genres).toEqual(genres);
    });
  });
});
