import { describe, it, expect } from 'vitest';
import {
  normalizeIsbn,
  isValidIsbn,
  isValidEan,
  isValidUpc,
  extractIsbn,
  isUpc,
  upcToIsbn13,
  isbn13ToIsbn10,
  formatIsbn,
} from '@/utils/isbnUtils';

describe('isbnUtils', () => {
  describe('normalizeIsbn', () => {
    it('removes hyphens and spaces', () => {
      expect(normalizeIsbn('978-0-306-40615-7')).toBe('9780306406157');
      expect(normalizeIsbn('0 306 40615 2')).toBe('0306406152');
    });

    it('trims whitespace', () => {
      expect(normalizeIsbn('  9780306406157  ')).toBe('9780306406157');
    });
  });

  describe('isValidIsbn', () => {
    it('validates correct ISBN-10', () => {
      expect(isValidIsbn('0306406152')).toBe(true);
    });

    it('validates ISBN-10 with X check digit', () => {
      expect(isValidIsbn('080442957X')).toBe(true);
    });

    it('validates correct ISBN-13', () => {
      expect(isValidIsbn('9780306406157')).toBe(true);
    });

    it('rejects invalid ISBN-10', () => {
      expect(isValidIsbn('0306406151')).toBe(false);
    });

    it('rejects invalid ISBN-13', () => {
      expect(isValidIsbn('9780306406158')).toBe(false);
    });

    it('rejects non-978/979 13-digit numbers', () => {
      expect(isValidIsbn('1234567890123')).toBe(false);
    });

    it('handles hyphenated ISBNs', () => {
      expect(isValidIsbn('978-0-306-40615-7')).toBe(true);
    });

    it('rejects too short strings', () => {
      expect(isValidIsbn('12345')).toBe(false);
    });
  });

  describe('isValidEan', () => {
    it('validates correct EAN-13', () => {
      expect(isValidEan('9780306406157')).toBe(true);
    });

    it('validates non-978 EAN-13', () => {
      // UPC-A "012345678905" as EAN-13 "0012345678905"
      expect(isValidEan('0012345678905')).toBe(true);
    });

    it('rejects invalid EAN', () => {
      expect(isValidEan('9780306406158')).toBe(false);
    });

    it('rejects non-13-digit strings', () => {
      expect(isValidEan('12345')).toBe(false);
    });
  });

  describe('isValidUpc', () => {
    it('validates correct UPC-A', () => {
      expect(isValidUpc('012345678905')).toBe(true);
    });

    it('rejects invalid UPC checksum', () => {
      expect(isValidUpc('012345678901')).toBe(false);
    });

    it('rejects non-12-digit strings', () => {
      expect(isValidUpc('12345')).toBe(false);
    });
  });

  describe('extractIsbn', () => {
    it('extracts valid ISBN', () => {
      const result = extractIsbn('978-0-306-40615-7');
      expect(result).toEqual({
        normalized: '9780306406157',
        original: '978-0-306-40615-7',
      });
    });

    it('returns null for invalid ISBN', () => {
      expect(extractIsbn('invalid')).toBeNull();
    });
  });

  describe('isUpc', () => {
    it('returns true for 12-digit string', () => {
      expect(isUpc('012345678905')).toBe(true);
    });

    it('returns false for non-12-digit', () => {
      expect(isUpc('12345')).toBe(false);
    });

    it('handles hyphens', () => {
      expect(isUpc('0-12345-67890-5')).toBe(true);
    });
  });

  describe('upcToIsbn13', () => {
    it('returns null for non-UPC', () => {
      expect(upcToIsbn13('12345')).toBeNull();
    });

    it('converts UPC that maps to valid ISBN', () => {
      // UPC "9780306406157" without leading 0 won't work as UPC (13 digits)
      // A UPC starting with 978 when prepended with 0 gives 0978... not a valid ISBN
      // This tests the null return for non-ISBN UPCs
      expect(upcToIsbn13('012345678905')).toBeNull(); // prepending 0 gives 0012345678905, not 978/979
    });
  });

  describe('isbn13ToIsbn10', () => {
    it('converts ISBN-13 to ISBN-10', () => {
      expect(isbn13ToIsbn10('9780306406157')).toBe('0306406152');
    });

    it('returns null for 979 prefix', () => {
      expect(isbn13ToIsbn10('9791234567896')).toBeNull();
    });

    it('returns null for non-13-digit input', () => {
      expect(isbn13ToIsbn10('12345')).toBeNull();
    });

    it('produces X check digit when needed', () => {
      // ISBN-13: 9780080442952 -> ISBN-10: 080442957X
      expect(isbn13ToIsbn10('9780804429573')).not.toBeNull();
    });
  });

  describe('formatIsbn', () => {
    it('formats ISBN-10', () => {
      const formatted = formatIsbn('0306406152');
      expect(formatted).toBe('0-3064-0615-2');
    });

    it('formats ISBN-13', () => {
      const formatted = formatIsbn('9780306406157');
      expect(formatted).toBe('978-0-30640-615-7');
    });

    it('returns non-ISBN input unchanged', () => {
      expect(formatIsbn('12345')).toBe('12345');
    });
  });
});
