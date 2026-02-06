
import { Book } from '@/types/book';
import { normalizeLccn } from '@/utils/isbnUtils';
import { dbBookToAppFormat } from '@/services/converters';

// ─── Server-side lookup ─────────────────────────────────────────────

/**
 * Lookup a book by code (ISBN, UPC, LCCN) via the server API.
 * The server now handles OpenLibrary fetching and auto-ingestion.
 */
const lookupBook = async (code: string): Promise<Book | null> => {
  try {
    const res = await fetch(`/api/library/lookup?code=${encodeURIComponent(code)}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Lookup failed: ${res.status}`);
    }
    const row = await res.json();
    return dbBookToAppFormat(row);
  } catch (error) {
    console.error('Error looking up book:', error);
    return null;
  }
};

// ─── ISBN lookup ────────────────────────────────────────────────────

/**
 * Fetch book details by ISBN.
 * Server handles OpenLibrary fetching, cover processing, and auto-ingestion.
 */
export const fetchBookByISBN = async (isbn: string, _detectedUpc?: string): Promise<Book | null> => {
  return lookupBook(isbn);
};

// ─── LCCN lookup ────────────────────────────────────────────────────

/**
 * Fetch book details by LCCN.
 * Server handles OpenLibrary fetching, cover processing, and auto-ingestion.
 */
export const fetchBookByLCCN = async (lccn: string): Promise<Book | null> => {
  const normalized = normalizeLccn(lccn);
  return lookupBook(normalized);
};

// ─── Unified code lookup ────────────────────────────────────────────

/**
 * Unified code lookup: handles ISBN, UPC, LCCN.
 * Server handles all fetching, processing, and ingestion.
 */
export const fetchBookByCode = async (code: string, _upc?: string): Promise<Book | null> => {
  const cleaned = code.replace(/^(isbn|lccn)[:\s]*/i, '').trim();
  return lookupBook(cleaned);
};

// ─── Duplicate check ────────────────────────────────────────────────

/**
 * Check if a code already exists in the user's library.
 */
export const checkDuplicateInLibrary = async (code: string): Promise<{ duplicate: boolean; book?: { id: string; title: string; authors: string[]; cover_url?: string } }> => {
  try {
    const res = await fetch(`/api/library/check-duplicate?code=${encodeURIComponent(code)}`, {
      credentials: 'include',
    });
    if (!res.ok) return { duplicate: false };
    return await res.json();
  } catch {
    return { duplicate: false };
  }
};
