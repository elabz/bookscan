import { describe, it, expect } from 'vitest';
import { getOpenLibraryCoverUrl } from '@/services/openLibraryService';

describe('openLibraryService', () => {
  describe('getOpenLibraryCoverUrl', () => {
    it('returns cover URL for ISBN', () => {
      const url = getOpenLibraryCoverUrl('9781234567890');
      expect(url).toBe('https://covers.openlibrary.org/b/ISBN/9781234567890-L.jpg?default=false');
    });

    it('supports different sizes', () => {
      expect(getOpenLibraryCoverUrl('123', 'S')).toContain('-S.jpg');
      expect(getOpenLibraryCoverUrl('123', 'M')).toContain('-M.jpg');
      expect(getOpenLibraryCoverUrl('123', 'L')).toContain('-L.jpg');
    });

    it('normalizes ISBN with hyphens', () => {
      const url = getOpenLibraryCoverUrl('978-0-306-40615-7');
      expect(url).toContain('9780306406157');
    });

    it('throws for empty ISBN', () => {
      expect(() => getOpenLibraryCoverUrl('')).toThrow('Invalid ISBN');
      expect(() => getOpenLibraryCoverUrl('  ')).toThrow('Invalid ISBN');
    });
  });
});
