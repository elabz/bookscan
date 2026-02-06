import {
  normalizeIsbn,
  isValidIsbn,
  isValidEan,
  isValidUpc,
  isUpc,
  upcToIsbn13,
  isbn10to13,
  isbn13to10,
  normalizeLccn,
  isLccn,
  formatIsbn,
} from '../../utils/isbnUtils';

describe('isbnUtils', () => {
  describe('normalizeIsbn', () => {
    it('removes hyphens from ISBN', () => {
      expect(normalizeIsbn('978-0-306-40615-7')).toBe('9780306406157');
    });

    it('removes spaces from ISBN', () => {
      expect(normalizeIsbn('978 0 306 40615 7')).toBe('9780306406157');
    });

    it('trims whitespace', () => {
      expect(normalizeIsbn('  9780306406157  ')).toBe('9780306406157');
    });

    it('handles mixed hyphens and spaces', () => {
      expect(normalizeIsbn('978-0 306-40615 7')).toBe('9780306406157');
    });
  });

  describe('isValidIsbn', () => {
    describe('ISBN-10', () => {
      it('validates correct ISBN-10', () => {
        expect(isValidIsbn('0306406152')).toBe(true);
      });

      it('validates ISBN-10 with X check digit', () => {
        expect(isValidIsbn('080442957X')).toBe(true);
      });

      it('validates ISBN-10 with lowercase x', () => {
        expect(isValidIsbn('080442957x')).toBe(true);
      });

      it('rejects invalid ISBN-10', () => {
        expect(isValidIsbn('0306406151')).toBe(false);
      });

      it('handles ISBN-10 with hyphens', () => {
        expect(isValidIsbn('0-306-40615-2')).toBe(true);
      });
    });

    describe('ISBN-13', () => {
      it('validates correct ISBN-13 starting with 978', () => {
        expect(isValidIsbn('9780306406157')).toBe(true);
      });

      it('validates correct ISBN-13 starting with 979', () => {
        expect(isValidIsbn('9791090636071')).toBe(true);
      });

      it('rejects invalid ISBN-13', () => {
        expect(isValidIsbn('9780306406158')).toBe(false);
      });

      it('rejects 13-digit number not starting with 978/979', () => {
        expect(isValidIsbn('1234567890123')).toBe(false);
      });

      it('handles ISBN-13 with hyphens', () => {
        expect(isValidIsbn('978-0-306-40615-7')).toBe(true);
      });
    });

    it('rejects invalid length', () => {
      expect(isValidIsbn('12345')).toBe(false);
      expect(isValidIsbn('123456789012345')).toBe(false);
    });
  });

  describe('isValidEan', () => {
    it('validates correct EAN-13', () => {
      expect(isValidEan('4006381333931')).toBe(true);
    });

    it('validates ISBN-13 as valid EAN', () => {
      expect(isValidEan('9780306406157')).toBe(true);
    });

    it('rejects invalid EAN-13', () => {
      expect(isValidEan('4006381333932')).toBe(false);
    });

    it('rejects non-13-digit codes', () => {
      expect(isValidEan('123456789012')).toBe(false);
    });
  });

  describe('isValidUpc', () => {
    it('validates correct UPC-A', () => {
      expect(isValidUpc('012345678905')).toBe(true);
    });

    it('rejects invalid UPC-A', () => {
      expect(isValidUpc('012345678906')).toBe(false);
    });

    it('rejects non-12-digit codes', () => {
      expect(isValidUpc('01234567890')).toBe(false);
      expect(isValidUpc('0123456789012')).toBe(false);
    });
  });

  describe('isUpc', () => {
    it('returns true for 12-digit code', () => {
      expect(isUpc('012345678905')).toBe(true);
    });

    it('returns true for 12 digits with hyphens', () => {
      expect(isUpc('012-345-678905')).toBe(true);
    });

    it('returns false for non-12-digit code', () => {
      expect(isUpc('01234567890')).toBe(false);
      expect(isUpc('0123456789012')).toBe(false);
    });

    it('returns false for codes with letters', () => {
      expect(isUpc('01234567890A')).toBe(false);
    });
  });

  describe('upcToIsbn13', () => {
    it('converts UPC starting with 978 to ISBN-13', () => {
      // UPC 781234567890 -> EAN 0781234567890 (not a valid ISBN)
      // UPC starting with 978 would be: 978... which when prepended with 0 gives 0978...
      // This is not a valid ISBN pattern
      expect(upcToIsbn13('978030640615')).toBe(null); // Invalid as ISBN
    });

    it('returns null for non-ISBN UPC', () => {
      expect(upcToIsbn13('012345678905')).toBe(null);
    });

    it('returns null for invalid UPC length', () => {
      expect(upcToIsbn13('12345')).toBe(null);
    });
  });

  describe('isbn10to13', () => {
    it('converts ISBN-10 to ISBN-13', () => {
      expect(isbn10to13('0306406152')).toBe('9780306406157');
    });

    it('handles ISBN-10 with X check digit', () => {
      expect(isbn10to13('080442957X')).toBe('9780804429573');
    });

    it('returns null for invalid length', () => {
      expect(isbn10to13('12345')).toBe(null);
      expect(isbn10to13('12345678901')).toBe(null);
    });

    it('handles ISBN-10 with hyphens', () => {
      expect(isbn10to13('0-306-40615-2')).toBe('9780306406157');
    });
  });

  describe('isbn13to10', () => {
    it('converts ISBN-13 to ISBN-10', () => {
      expect(isbn13to10('9780306406157')).toBe('0306406152');
    });

    it('generates X check digit when needed', () => {
      expect(isbn13to10('9780804429573')).toBe('080442957X');
    });

    it('returns null for ISBN-13 starting with 979', () => {
      expect(isbn13to10('9791090636071')).toBe(null);
    });

    it('returns null for invalid length', () => {
      expect(isbn13to10('12345')).toBe(null);
    });

    it('returns null for non-978 prefix', () => {
      expect(isbn13to10('1234567890123')).toBe(null);
    });
  });

  describe('normalizeLccn', () => {
    it('removes hyphens', () => {
      expect(normalizeLccn('78-308782')).toBe('78308782');
    });

    it('removes spaces', () => {
      expect(normalizeLccn('78 308782')).toBe('78308782');
    });

    it('lowercases letters', () => {
      expect(normalizeLccn('N78890351')).toBe('n78890351');
    });

    it('trims whitespace', () => {
      expect(normalizeLccn('  n78890351  ')).toBe('n78890351');
    });
  });

  describe('isLccn', () => {
    it('detects LCCN with alpha prefix', () => {
      expect(isLccn('n78890351')).toBe(true);
      expect(isLccn('agr64000200')).toBe(true);
    });

    it('detects uppercase alpha prefix', () => {
      expect(isLccn('N78890351')).toBe(true);
    });

    it('detects numeric-only LCCN (8-12 digits, not ISBN/UPC)', () => {
      expect(isLccn('78308782')).toBe(true);
    });

    it('returns false for valid ISBN-10', () => {
      expect(isLccn('0306406152')).toBe(false);
    });

    it('returns false for valid ISBN-13', () => {
      expect(isLccn('9780306406157')).toBe(false);
    });

    it('returns false for UPC', () => {
      expect(isLccn('012345678905')).toBe(false);
    });

    it('returns false for short codes', () => {
      expect(isLccn('1234567')).toBe(false);
    });

    it('handles hyphenated format', () => {
      expect(isLccn('78-308782')).toBe(true);
    });
  });

  describe('formatIsbn', () => {
    it('formats ISBN-10', () => {
      expect(formatIsbn('0306406152')).toBe('0-3064-0615-2');
    });

    it('formats ISBN-13', () => {
      expect(formatIsbn('9780306406157')).toBe('978-0-30640-615-7');
    });

    it('returns original for invalid length', () => {
      expect(formatIsbn('12345')).toBe('12345');
    });
  });
});
