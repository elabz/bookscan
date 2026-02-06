/**
 * OpenLibrary API service for fetching book data.
 * Ported from frontend isbnService.ts to server-side.
 */

import {
  normalizeIsbn,
  isUpc,
  upcToIsbn13,
  isbn13to10,
  isLccn,
  normalizeLccn,
} from '../utils/isbnUtils';

// ─── OpenLibrary API types ──────────────────────────────────────────

interface OLAuthor {
  name?: string;
  title?: string;
}

interface OLPublisher {
  name?: string;
}

interface OLSubject {
  name?: string;
  title?: string;
}

interface OLLink {
  url: string;
  title?: string;
}

interface OLPlace {
  name?: string;
  title?: string;
}

interface OLExcerpt {
  text?: string;
  excerpt?: string;
  comment?: string;
}

interface OLLanguage {
  key?: string;
}

interface OLDetails {
  title?: string;
  authors?: OLAuthor[];
  publishers?: (OLPublisher | string)[];
  publish_date?: string;
  description?: string | { value?: string; type?: string };
  notes?: string | { value?: string };
  number_of_pages?: string | number;
  subjects?: (string | OLSubject)[];
  languages?: OLLanguage[];
  identifiers?: Record<string, string[]>;
  isbn_10?: string | string[];
  isbn_13?: string | string[];
  classifications?: Record<string, string[]>;
  links?: OLLink[];
  weight?: string;
  publish_places?: (OLPlace | string)[];
  excerpts?: OLExcerpt[];
  lccn?: string[];
}

interface OLBookData {
  details?: OLDetails;
  info_url?: string;
  preview_url?: string;
  thumbnail_url?: string;
}

// ─── Book types for internal use ────────────────────────────────────

export interface Identifier {
  isbn_10?: string[];
  isbn_13?: string[];
  lccn?: string[];
  oclc?: string[];
  goodreads?: string[];
  google?: string[];
  amazon?: string[];
  librarything?: string[];
  project_gutenberg?: string[];
  upc?: string[];
  [key: string]: string[] | undefined;
}

export interface Classification {
  dewey_decimal_class?: string[];
  lc_classifications?: string[];
  [key: string]: string[] | undefined;
}

export interface Link {
  url: string;
  title: string;
}

export interface PublishPlace {
  name: string;
}

export interface Publisher {
  name: string;
}

export interface BookExcerpt {
  text: string;
  comment?: string;
}

export interface OpenLibraryBook {
  title: string;
  authors: string[];
  isbn?: string;
  lccn?: string;
  cover_url?: string;
  cover_small_url?: string;
  cover_large_url?: string;
  publisher?: string;
  publishers?: Publisher[];
  published_date?: string;
  description?: string;
  page_count?: number;
  categories?: string[];
  language?: string;
  identifiers?: Identifier;
  classifications?: Classification;
  links?: Link[];
  weight?: string;
  url?: string;
  subjects?: { name: string }[];
  publish_places?: PublishPlace[];
  excerpts?: BookExcerpt[];
  number_of_pages?: number;
}

// ─── Helper functions ───────────────────────────────────────────────

const extractDescription = (details?: OLDetails): string => {
  let description = '';
  if (details?.description) {
    if (typeof details.description === 'string') {
      const desc = details.description;
      if (desc.startsWith('{')) {
        try {
          const parsed = JSON.parse(desc);
          description = parsed.value || desc;
        } catch {
          description = desc;
        }
      } else {
        description = desc;
      }
    } else if (details.description.value) {
      description = details.description.value;
    }
  } else if (details?.notes) {
    const notes = details.notes;
    if (typeof notes === 'string' && notes.startsWith('{')) {
      try {
        const parsed = JSON.parse(notes);
        description = parsed.value || notes;
      } catch {
        description = notes;
      }
    } else if (typeof notes === 'string') {
      description = notes;
    } else if (notes?.value) {
      description = notes.value;
    }
  }
  return description;
};

const extractAuthors = (details?: OLDetails): string[] => {
  if (!details?.authors) return ['Unknown Author'];

  try {
    return details.authors.map((author) => {
      return author.name || author.title || 'Unknown Author';
    });
  } catch (error) {
    console.error('Error extracting authors:', error);
    return ['Unknown Author'];
  }
};

const extractPublisher = (details?: OLDetails): string | undefined => {
  if (!details?.publishers || details.publishers.length === 0) return undefined;

  try {
    const first = details.publishers[0];
    return typeof first === 'string' ? first : first.name;
  } catch (error) {
    console.error('Error extracting publisher:', error);
    return undefined;
  }
};

const extractPublishers = (details?: OLDetails): Publisher[] | undefined => {
  if (!details?.publishers || details.publishers.length === 0) return undefined;

  try {
    return details.publishers.map((publisher) => {
      return typeof publisher === 'string'
        ? { name: publisher }
        : { name: publisher.name || 'Unknown Publisher' };
    });
  } catch (error) {
    console.error('Error extracting publishers:', error);
    return undefined;
  }
};

const processLinks = (links?: OLLink[]): Link[] | undefined => {
  if (!links || links.length === 0) return undefined;

  try {
    return links.map((link) => ({
      url: link.url,
      title: link.title || 'External Link',
    }));
  } catch (error) {
    console.error('Error processing links:', error);
    return undefined;
  }
};

const processPublishPlaces = (places?: (OLPlace | string)[]): PublishPlace[] | undefined => {
  if (!places || places.length === 0) return undefined;

  try {
    return places.map((place) => {
      return typeof place === 'string'
        ? { name: place }
        : { name: place.name || place.title || 'Unknown Place' };
    });
  } catch (error) {
    console.error('Error processing publish places:', error);
    return undefined;
  }
};

const processExcerpts = (excerpts?: OLExcerpt[]): BookExcerpt[] | undefined => {
  if (!excerpts || !Array.isArray(excerpts) || excerpts.length === 0) return undefined;

  try {
    return excerpts.map((excerpt) => ({
      text: excerpt.text || excerpt.excerpt || '',
      comment: excerpt.comment,
    }));
  } catch (error) {
    console.error('Error processing excerpts:', error);
    return undefined;
  }
};

// OpenLibrary puts isbn_10/isbn_13 at the top level of details, not inside identifiers
const processIdentifiers = (
  identifiers?: Record<string, string[]>,
  details?: OLDetails
): Identifier | undefined => {
  try {
    const result: Identifier = {};

    if (identifiers && Object.keys(identifiers).length > 0) {
      Object.entries(identifiers).forEach(([key, values]) => {
        if (Array.isArray(values)) {
          result[key] = values;
        } else if (values) {
          result[key] = [String(values)];
        }
      });
    }

    // Merge top-level isbn_10 / isbn_13 from details (OpenLibrary puts them there)
    if (details?.isbn_10 && !result.isbn_10) {
      result.isbn_10 = Array.isArray(details.isbn_10) ? details.isbn_10 : [details.isbn_10];
    }
    if (details?.isbn_13 && !result.isbn_13) {
      result.isbn_13 = Array.isArray(details.isbn_13) ? details.isbn_13 : [details.isbn_13];
    }

    return Object.keys(result).length > 0 ? result : undefined;
  } catch (error) {
    console.error('Error processing identifiers:', error);
    return undefined;
  }
};

// Map subjects from OpenLibrary format to our format
const mapSubjects = (subjects?: (string | OLSubject)[]): { name: string }[] | undefined => {
  if (!subjects) return undefined;
  return subjects.map((subject) => ({
    name: typeof subject === 'string' ? subject : subject.name || subject.title || String(subject),
  }));
};

interface IsbnSource {
  isbn_13?: string | string[];
  isbn_10?: string | string[];
}

// Helper function to extract the main ISBN from identifiers and top-level details
const extractMainIsbn = (
  identifiers?: Record<string, string[]>,
  details?: OLDetails
): string | undefined => {
  try {
    const sources: IsbnSource[] = [identifiers, details].filter((s): s is IsbnSource => !!s);
    for (const src of sources) {
      // Prefer ISBN-13 over ISBN-10
      if (src.isbn_13) {
        const val = Array.isArray(src.isbn_13) ? src.isbn_13[0] : src.isbn_13.toString();
        if (val) return val;
      }
      if (src.isbn_10) {
        const val = Array.isArray(src.isbn_10) ? src.isbn_10[0] : src.isbn_10.toString();
        if (val) return val;
      }
    }
    return undefined;
  } catch (error) {
    console.error('Error extracting main ISBN:', error);
    return undefined;
  }
};

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Get OpenLibrary cover URL for an ISBN.
 */
export const getOpenLibraryCoverUrl = (isbn: string, size: 'S' | 'M' | 'L' = 'L'): string => {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
};

/**
 * Parse OpenLibrary book data into our internal format.
 */
const parseOpenLibraryResponse = (
  bookData: OLBookData,
  isbn: string,
  upcCode?: string
): OpenLibraryBook => {
  const description = extractDescription(bookData.details);

  const book: OpenLibraryBook = {
    title: bookData.details?.title || 'Unknown Title',
    authors: extractAuthors(bookData.details),
    isbn: extractMainIsbn(bookData.details?.identifiers, bookData.details) || isbn,
    publisher: extractPublisher(bookData.details),
    publishers: extractPublishers(bookData.details),
    published_date: bookData.details?.publish_date,
    description: description,
    page_count: bookData.details?.number_of_pages
      ? parseInt(String(bookData.details.number_of_pages), 10)
      : undefined,
    categories: bookData.details?.subjects as string[] | undefined,
    language: bookData.details?.languages?.[0]?.key?.split('/')?.[2] || undefined,
    identifiers: processIdentifiers(bookData.details?.identifiers, bookData.details),
    classifications: bookData.details?.classifications as OpenLibraryBook['classifications'],
    links: processLinks(bookData.details?.links),
    weight: bookData.details?.weight,
    url: bookData.info_url || bookData.preview_url,
    subjects: mapSubjects(bookData.details?.subjects),
    publish_places: processPublishPlaces(bookData.details?.publish_places),
    excerpts: processExcerpts(bookData.details?.excerpts),
    number_of_pages: bookData.details?.number_of_pages
      ? parseInt(String(bookData.details.number_of_pages), 10)
      : undefined,
  };

  // Store UPC in identifiers if we had one
  if (upcCode) {
    if (!book.identifiers) book.identifiers = {};
    book.identifiers.upc = [upcCode];
  }

  // Extract LCCN from identifiers if available
  if (book.identifiers?.lccn?.[0]) {
    book.lccn = book.identifiers.lccn[0];
  }

  return book;
};

/**
 * Search OpenLibrary by UPC when ISBN conversion fails.
 */
interface OLSearchResult {
  docs?: Array<{ isbn?: string[] }>;
}

const fetchBookByUpcSearch = async (upc: string): Promise<OpenLibraryBook | null> => {
  try {
    const response = await fetch(`https://openlibrary.org/search.json?q=${upc}&limit=1`);
    if (!response.ok) return null;

    const data = (await response.json()) as OLSearchResult;
    if (!data.docs || data.docs.length === 0) return null;

    const doc = data.docs[0];
    const isbn = doc.isbn?.[0];

    // If we found an ISBN from the search, do a full lookup
    if (isbn) {
      console.log(`[OL] UPC search found ISBN: ${isbn}, doing full lookup`);
      const result = await fetchFromOpenLibrary(isbn);
      if (result) {
        if (!result.identifiers) result.identifiers = {};
        result.identifiers.upc = [upc];
        return result;
      }
    }

    return null;
  } catch (error) {
    console.error('[OL] Error in UPC search fallback:', error);
    return null;
  }
};

/**
 * Fetch book by ISBN from OpenLibrary API.
 * Handles UPC conversion and ISBN-10/13 fallbacks.
 */
export const fetchFromOpenLibrary = async (
  code: string,
  detectedUpc?: string
): Promise<OpenLibraryBook | null> => {
  try {
    let normalizedIsbn = normalizeIsbn(code);
    let upcCode: string | undefined = detectedUpc;

    // If input is a UPC barcode (12 digits), try converting to ISBN-13
    if (isUpc(normalizedIsbn)) {
      upcCode = normalizedIsbn;
      const converted = upcToIsbn13(normalizedIsbn);
      if (converted) {
        console.log(`[OL] Converted UPC ${normalizedIsbn} to ISBN-13 ${converted}`);
        normalizedIsbn = converted;
      }
    }

    // EAN-13 starting with "0" is a UPC-A with implicit leading zero.
    // The actual UPC is the last 12 digits. Not an ISBN — needs UPC lookup.
    if (
      normalizedIsbn.length === 13 &&
      normalizedIsbn.startsWith('0') &&
      !normalizedIsbn.startsWith('097')
    ) {
      upcCode = normalizedIsbn.slice(1); // strip leading 0 to get 12-digit UPC
      console.log(`[OL] EAN-13 with leading 0 detected, extracted UPC: ${upcCode}`);
    }

    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${normalizedIsbn}&format=json&jscmd=details`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch book data: ${response.status}`);
    }

    const data = (await response.json()) as Record<string, OLBookData>;
    let bookData = data[`ISBN:${normalizedIsbn}`];

    if (!bookData) {
      // If ISBN-13 (978-prefix) failed, try the ISBN-10 equivalent
      const isbn10 = isbn13to10(normalizedIsbn);
      if (isbn10) {
        console.log(`[OL] ISBN-13 lookup failed, trying ISBN-10: ${isbn10}`);
        const isbn10Response = await fetch(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn10}&format=json&jscmd=details`
        );
        if (isbn10Response.ok) {
          const isbn10Data = (await isbn10Response.json()) as Record<string, OLBookData>;
          bookData = isbn10Data[`ISBN:${isbn10}`];
          if (bookData) {
            console.log(`[OL] Found book via ISBN-10 fallback: ${isbn10}`);
          }
        }
      }
    }

    if (!bookData) {
      // If we had a UPC, try searching OpenLibrary by UPC as a fallback
      if (upcCode) {
        console.log(`[OL] ISBN lookup failed, trying UPC search for: ${upcCode}`);
        const upcResult = await fetchBookByUpcSearch(upcCode);
        if (upcResult) return upcResult;
      }
      console.log(`[OL] No book found with ISBN: ${normalizedIsbn}`);
      return null;
    }

    console.log('[OL] Raw OpenLibrary data:', JSON.stringify(bookData, null, 2).substring(0, 500));

    return parseOpenLibraryResponse(bookData, normalizedIsbn, upcCode);
  } catch (error) {
    console.error('[OL] Error fetching book by ISBN:', error);
    return null;
  }
};

/**
 * Fetch book by LCCN from OpenLibrary API.
 */
export const fetchFromOpenLibraryByLccn = async (lccn: string): Promise<OpenLibraryBook | null> => {
  try {
    const normalized = normalizeLccn(lccn);

    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=LCCN:${normalized}&format=json&jscmd=details`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch book data: ${response.status}`);
    }

    const data = (await response.json()) as Record<string, OLBookData>;
    const bookData = data[`LCCN:${normalized}`];

    if (!bookData) {
      console.log(`[OL] No book found with LCCN: ${normalized}`);
      return null;
    }

    console.log(
      '[OL] Raw OpenLibrary LCCN data:',
      JSON.stringify(bookData, null, 2).substring(0, 500)
    );

    const book = parseOpenLibraryResponse(bookData, '', undefined);
    book.lccn = normalized;

    // Ensure LCCN is in identifiers
    if (!book.identifiers) book.identifiers = {};
    if (!book.identifiers.lccn) book.identifiers.lccn = [normalized];

    return book;
  } catch (error) {
    console.error('[OL] Error fetching book by LCCN:', error);
    return null;
  }
};

/**
 * Unified code lookup: try ISBN → try LCCN → fallback.
 */
export const fetchFromOpenLibraryByCode = async (
  code: string,
  upc?: string
): Promise<OpenLibraryBook | null> => {
  const cleaned = code.replace(/^(isbn|lccn)[:\s]*/i, '').trim();

  // If it looks like an LCCN, try LCCN first then ISBN
  if (isLccn(cleaned)) {
    console.log(`[OL] Code "${cleaned}" detected as LCCN, trying LCCN lookup first`);
    const lccnResult = await fetchFromOpenLibraryByLccn(cleaned);
    if (lccnResult) return lccnResult;
    // Fall through to ISBN in case detection was wrong
  }

  // Try ISBN lookup (handles ISBN, UPC, EAN)
  const isbnResult = await fetchFromOpenLibrary(cleaned, upc);
  if (isbnResult) return isbnResult;

  // If ISBN failed and we haven't tried LCCN yet, try it now
  if (!isLccn(cleaned)) {
    const lccnResult = await fetchFromOpenLibraryByLccn(cleaned);
    if (lccnResult) return lccnResult;
  }

  return null;
};
