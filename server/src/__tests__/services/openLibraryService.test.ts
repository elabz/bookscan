// Mock fetch before importing the service
const mockFetch = jest.fn();
global.fetch = mockFetch;

import {
  getOpenLibraryCoverUrl,
  fetchFromOpenLibrary,
  fetchFromOpenLibraryByLccn,
  fetchFromOpenLibraryByCode,
} from '../../services/openLibraryService';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('openLibraryService', () => {
  describe('getOpenLibraryCoverUrl', () => {
    it('returns URL with default large size', () => {
      expect(getOpenLibraryCoverUrl('9780306406157')).toBe(
        'https://covers.openlibrary.org/b/isbn/9780306406157-L.jpg'
      );
    });

    it('returns URL with small size', () => {
      expect(getOpenLibraryCoverUrl('9780306406157', 'S')).toBe(
        'https://covers.openlibrary.org/b/isbn/9780306406157-S.jpg'
      );
    });

    it('returns URL with medium size', () => {
      expect(getOpenLibraryCoverUrl('9780306406157', 'M')).toBe(
        'https://covers.openlibrary.org/b/isbn/9780306406157-M.jpg'
      );
    });
  });

  describe('fetchFromOpenLibrary', () => {
    const mockBookResponse = {
      'ISBN:9780306406157': {
        details: {
          title: 'Test Book',
          authors: [{ name: 'Test Author' }],
          publishers: ['Test Publisher'],
          publish_date: '2020',
          description: 'A test book description',
          number_of_pages: 300,
          languages: [{ key: '/languages/eng' }],
          isbn_13: ['9780306406157'],
          isbn_10: ['0306406152'],
        },
        info_url: 'https://openlibrary.org/books/OL123',
      },
    };

    it('fetches book by ISBN-13', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookResponse),
      });

      const book = await fetchFromOpenLibrary('9780306406157');

      expect(book).not.toBeNull();
      expect(book?.title).toBe('Test Book');
      expect(book?.authors).toEqual(['Test Author']);
      expect(book?.publisher).toBe('Test Publisher');
      expect(book?.isbn).toBe('9780306406157');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://openlibrary.org/api/books?bibkeys=ISBN:9780306406157&format=json&jscmd=details'
      );
    });

    it('fetches book by ISBN-10', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'ISBN:0306406152': mockBookResponse['ISBN:9780306406157'],
        }),
      });

      const book = await fetchFromOpenLibrary('0306406152');

      expect(book).not.toBeNull();
      expect(book?.title).toBe('Test Book');
    });

    it('tries ISBN-10 fallback when ISBN-13 not found', async () => {
      // First call returns empty (ISBN-13 not found)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
      // Second call returns book (ISBN-10 found)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'ISBN:0306406152': mockBookResponse['ISBN:9780306406157'],
        }),
      });

      const book = await fetchFromOpenLibrary('9780306406157');

      expect(book).not.toBeNull();
      expect(book?.title).toBe('Test Book');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('returns null when book not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
      // ISBN-10 fallback also returns empty
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const book = await fetchFromOpenLibrary('9780306406157');

      expect(book).toBeNull();
    });

    it('returns null on fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const book = await fetchFromOpenLibrary('9780306406157');

      expect(book).toBeNull();
    });

    it('handles description as object with value property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'ISBN:9780306406157': {
            details: {
              title: 'Test',
              authors: [],
              description: { value: 'Object description', type: '/type/text' },
            },
          },
        }),
      });

      const book = await fetchFromOpenLibrary('9780306406157');

      expect(book?.description).toBe('Object description');
    });

    it('handles description as JSON string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'ISBN:9780306406157': {
            details: {
              title: 'Test',
              authors: [],
              description: '{"value": "JSON description"}',
            },
          },
        }),
      });

      const book = await fetchFromOpenLibrary('9780306406157');

      expect(book?.description).toBe('JSON description');
    });

    it('stores UPC in identifiers when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookResponse),
      });

      const book = await fetchFromOpenLibrary('9780306406157', '012345678905');

      expect(book?.identifiers?.upc).toEqual(['012345678905']);
    });

    it('extracts language from languages array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookResponse),
      });

      const book = await fetchFromOpenLibrary('9780306406157');

      expect(book?.language).toBe('eng');
    });

    it('handles publishers as strings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'ISBN:9780306406157': {
            details: {
              title: 'Test',
              authors: [],
              publishers: ['Publisher One', 'Publisher Two'],
            },
          },
        }),
      });

      const book = await fetchFromOpenLibrary('9780306406157');

      expect(book?.publisher).toBe('Publisher One');
      expect(book?.publishers).toEqual([
        { name: 'Publisher One' },
        { name: 'Publisher Two' },
      ]);
    });

    it('handles publishers as objects', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'ISBN:9780306406157': {
            details: {
              title: 'Test',
              authors: [],
              publishers: [{ name: 'Publisher Name' }],
            },
          },
        }),
      });

      const book = await fetchFromOpenLibrary('9780306406157');

      expect(book?.publisher).toBe('Publisher Name');
    });

    it('maps subjects correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'ISBN:9780306406157': {
            details: {
              title: 'Test',
              authors: [],
              subjects: ['Fiction', { name: 'Drama' }, { title: 'Comedy' }],
            },
          },
        }),
      });

      const book = await fetchFromOpenLibrary('9780306406157');

      expect(book?.subjects).toEqual([
        { name: 'Fiction' },
        { name: 'Drama' },
        { name: 'Comedy' },
      ]);
    });

    it('tries UPC search when ISBN lookup fails', async () => {
      // ISBN lookup returns empty
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
      // UPC search returns a book with ISBN
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          docs: [{ isbn: ['9780306406157'] }],
        }),
      });
      // Full ISBN lookup for found ISBN
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookResponse),
      });

      const book = await fetchFromOpenLibrary('012345678905');

      expect(book).not.toBeNull();
      expect(book?.identifiers?.upc).toEqual(['012345678905']);
    });
  });

  describe('fetchFromOpenLibraryByLccn', () => {
    const mockLccnResponse = {
      'LCCN:n78890351': {
        details: {
          title: 'LCCN Book',
          authors: [{ name: 'LCCN Author' }],
          isbn_13: ['9781234567890'],
        },
        info_url: 'https://openlibrary.org/books/OL456',
      },
    };

    it('fetches book by LCCN', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLccnResponse),
      });

      const book = await fetchFromOpenLibraryByLccn('n78890351');

      expect(book).not.toBeNull();
      expect(book?.title).toBe('LCCN Book');
      expect(book?.lccn).toBe('n78890351');
      expect(book?.identifiers?.lccn).toEqual(['n78890351']);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://openlibrary.org/api/books?bibkeys=LCCN:n78890351&format=json&jscmd=details'
      );
    });

    it('normalizes LCCN before fetching', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'LCCN:n78890351': mockLccnResponse['LCCN:n78890351'],
        }),
      });

      const book = await fetchFromOpenLibraryByLccn('N78-890351');

      expect(book?.lccn).toBe('n78890351');
    });

    it('returns null when LCCN not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const book = await fetchFromOpenLibraryByLccn('notfound');

      expect(book).toBeNull();
    });

    it('returns null on fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const book = await fetchFromOpenLibraryByLccn('n78890351');

      expect(book).toBeNull();
    });
  });

  describe('fetchFromOpenLibraryByCode', () => {
    it('tries LCCN first for LCCN-like codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'LCCN:n78890351': {
            details: { title: 'LCCN Book', authors: [] },
          },
        }),
      });

      const book = await fetchFromOpenLibraryByCode('n78890351');

      expect(book?.title).toBe('LCCN Book');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('LCCN:n78890351')
      );
    });

    it('tries ISBN for ISBN-like codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'ISBN:9780306406157': {
            details: { title: 'ISBN Book', authors: [] },
          },
        }),
      });

      const book = await fetchFromOpenLibraryByCode('9780306406157');

      expect(book?.title).toBe('ISBN Book');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('ISBN:9780306406157')
      );
    });

    it('strips isbn: prefix from code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'ISBN:9780306406157': {
            details: { title: 'Test', authors: [] },
          },
        }),
      });

      await fetchFromOpenLibraryByCode('isbn:9780306406157');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('ISBN:9780306406157')
      );
    });

    it('strips lccn: prefix from code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'LCCN:n78890351': {
            details: { title: 'Test', authors: [] },
          },
        }),
      });

      await fetchFromOpenLibraryByCode('lccn:n78890351');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('LCCN:n78890351')
      );
    });

    it('falls back to LCCN if ISBN fails for non-LCCN code', async () => {
      // ISBN lookup returns empty
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
      // ISBN-10 fallback also returns empty
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
      // LCCN lookup succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'LCCN:9780306406157': {
            details: { title: 'Found via LCCN', authors: [] },
          },
        }),
      });

      const book = await fetchFromOpenLibraryByCode('9780306406157');

      expect(book?.title).toBe('Found via LCCN');
    });

    it('returns null when nothing found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const book = await fetchFromOpenLibraryByCode('notfound');

      expect(book).toBeNull();
    });
  });
});
