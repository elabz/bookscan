
import { Book, Identifier, Publisher, Link, PublishPlace, BookExcerpt } from '@/types/book';
import { normalizeIsbn, isUpc, upcToIsbn13, isbn13ToIsbn10, isLccn, normalizeLccn } from '@/utils/isbnUtils';
import { getOpenLibraryCoverUrl, processAndUploadImage } from '@/services/imageService';
import { dbBookToAppFormat } from '@/services/converters';

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

// ─── Local DB lookup ────────────────────────────────────────────────

// Check local database first by ISBN or UPC
const lookupLocalBook = async (code: string): Promise<Book | null> => {
  try {
    const res = await fetch(`/api/library/lookup?code=${encodeURIComponent(code)}`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const row = await res.json();
    return dbBookToAppFormat(row);
  } catch {
    return null;
  }
};

// ─── Description extraction helper ──────────────────────────────────

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

// ─── ISBN lookup ────────────────────────────────────────────────────

// Fetch book details by ISBN from Open Library API
// Optional detectedUpc: when user manually enters ISBN after a UPC scan, attach the UPC
export const fetchBookByISBN = async (isbn: string, detectedUpc?: string): Promise<Book | null> => {
  try {
    // Always check local database first
    const localBook = await lookupLocalBook(isbn);
    if (localBook) {
      console.log(`Found book in local DB for code: ${isbn}`);
      return localBook;
    }

    let normalizedIsbn = normalizeIsbn(isbn);
    // detectedUpc may come from the caller (manual ISBN after UPC scan) or be detected here
    let upcCode: string | undefined = detectedUpc;

    // If input is a UPC barcode (12 digits), try converting to ISBN-13
    if (isUpc(normalizedIsbn)) {
      upcCode = normalizedIsbn;
      const converted = upcToIsbn13(normalizedIsbn);
      if (converted) {
        console.log(`Converted UPC ${normalizedIsbn} to ISBN-13 ${converted}`);
        normalizedIsbn = converted;
      }
    }

    // EAN-13 starting with "0" is a UPC-A with implicit leading zero.
    // The actual UPC is the last 12 digits. Not an ISBN — needs UPC lookup.
    if (normalizedIsbn.length === 13 && normalizedIsbn.startsWith('0')
        && !normalizedIsbn.startsWith('097')) {
      upcCode = normalizedIsbn.slice(1); // strip leading 0 to get 12-digit UPC
      console.log(`EAN-13 with leading 0 detected, extracted UPC: ${upcCode}`);
    }

    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${normalizedIsbn}&format=json&jscmd=details`);

    if (!response.ok) {
      throw new Error(`Failed to fetch book data: ${response.status}`);
    }

    const data: Record<string, OLBookData> = await response.json();
    const bookData = data[`ISBN:${normalizedIsbn}`];

    if (!bookData) {
      // If ISBN-13 (978-prefix) failed, try the ISBN-10 equivalent
      const isbn10 = isbn13ToIsbn10(normalizedIsbn);
      if (isbn10) {
        console.log(`ISBN-13 lookup failed, trying ISBN-10: ${isbn10}`);
        const isbn10Response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn10}&format=json&jscmd=details`);
        if (isbn10Response.ok) {
          const isbn10Data: Record<string, OLBookData> = await isbn10Response.json();
          const isbn10Book = isbn10Data[`ISBN:${isbn10}`];
          if (isbn10Book) {
            console.log(`Found book via ISBN-10 fallback: ${isbn10}`);
            // Re-assign so the rest of the function processes this data
            Object.assign(data, isbn10Data);
            // bookData is const, so we proceed below with a redirect
            return fetchBookByISBN(isbn10, upcCode);
          }
        }
      }

      // If we had a UPC, try searching OpenLibrary by UPC as a fallback
      if (upcCode) {
        console.log(`ISBN lookup failed, trying UPC search for: ${upcCode}`);
        const upcResult = await fetchBookByUpcSearch(upcCode);
        if (upcResult) return upcResult;
      }
      console.log(`No book found with ISBN: ${normalizedIsbn}`);
      return null;
    }

    console.log('Raw OpenLibrary data:', JSON.stringify(bookData, null, 2));

    const description = extractDescription(bookData.details);

    // Extract all the data from the OpenLibrary response
    const book: Book = {
      title: bookData.details?.title || 'Unknown Title',
      authors: extractAuthors(bookData.details),
      isbn: extractMainIsbn(bookData.details?.identifiers, bookData.details) || isbn,
      publisher: extractPublisher(bookData.details),
      publishers: extractPublishers(bookData.details),
      publishedDate: bookData.details?.publish_date,
      description: description,
      pageCount: bookData.details?.number_of_pages ?
        parseInt(String(bookData.details.number_of_pages), 10) : undefined,
      categories: bookData.details?.subjects as string[] | undefined,
      language: bookData.details?.languages?.[0]?.key?.split('/')?.[2] || undefined,

      // Map all additional fields
      identifiers: processIdentifiers(bookData.details?.identifiers, bookData.details),
      classifications: bookData.details?.classifications as Book['classifications'],
      links: processLinks(bookData.details?.links),
      weight: bookData.details?.weight,
      url: bookData.info_url || bookData.preview_url,
      subjects: mapSubjects(bookData.details?.subjects),
      publish_places: processPublishPlaces(bookData.details?.publish_places),
      excerpts: processExcerpts(bookData.details?.excerpts),
      number_of_pages: bookData.details?.number_of_pages ?
        parseInt(String(bookData.details.number_of_pages), 10) : undefined
    };

    // Store UPC in identifiers if we had one
    if (upcCode) {
      if (!book.identifiers) book.identifiers = {};
      book.identifiers.upc = [upcCode];
    }

    // Extract LCCN from identifiers if available
    if (!book.lccn && book.identifiers?.lccn?.[0]) {
      book.lccn = book.identifiers.lccn[0];
    }

    // If cover image from OpenLibrary exists, process it
    if (bookData.thumbnail_url || bookData.preview_url || normalizedIsbn) {
      try {
        // Prioritize using ISBN to get the cover directly from OpenLibrary
        let coverUrl;
        if (normalizedIsbn) {
          coverUrl = getOpenLibraryCoverUrl(normalizedIsbn);
          console.log(`Using OpenLibrary ISBN cover URL: ${coverUrl}`);
        } else {
          coverUrl = bookData.thumbnail_url || bookData.preview_url;
          console.log(`Using OpenLibrary thumbnail URL: ${coverUrl}`);
        }

        if (coverUrl) {
          const processedImages = await processAndUploadImage(coverUrl, normalizedIsbn);

          // Use medium size for the main cover URL
          book.cover = processedImages.medium;
          book.coverSmall = processedImages.small;
          book.coverLarge = processedImages.large;

          console.log(`Processed cover images:`, processedImages);
        }
      } catch (error) {
        console.error('Error processing cover image:', error);
        // Don't set a fallback image - we want to know if it failed
      }
    }

    console.log('Processed book data:', book);
    return book;
  } catch (error) {
    console.error('Error fetching book by ISBN:', error);
    return null;
  }
};

// ─── Helper functions for OpenLibrary data extraction ───────────────

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
      title: link.title || 'External Link'
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
      comment: excerpt.comment
    }));
  } catch (error) {
    console.error('Error processing excerpts:', error);
    return undefined;
  }
};

// OpenLibrary puts isbn_10/isbn_13 at the top level of details, not inside identifiers
const processIdentifiers = (identifiers?: Record<string, string[]>, details?: OLDetails): Identifier | undefined => {
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
    name: typeof subject === 'string' ? subject : subject.name || subject.title || String(subject)
  }));
};

// Fallback: search OpenLibrary by UPC when ISBN conversion fails
const fetchBookByUpcSearch = async (upc: string): Promise<Book | null> => {
  try {
    const response = await fetch(`https://openlibrary.org/search.json?q=${upc}&limit=1`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.docs || data.docs.length === 0) return null;

    const doc = data.docs[0];
    const isbn = doc.isbn?.[0];

    // If we found an ISBN from the search, do a full lookup
    if (isbn) {
      console.log(`UPC search found ISBN: ${isbn}, doing full lookup`);
      // Temporarily clear the UPC flag to avoid infinite recursion
      const result = await fetchBookByISBN(isbn);
      if (result) {
        if (!result.identifiers) result.identifiers = {};
        result.identifiers.upc = [upc];
        return result;
      }
    }

    return null;
  } catch (error) {
    console.error('Error in UPC search fallback:', error);
    return null;
  }
};

// ─── LCCN lookup ────────────────────────────────────────────────────

// Fetch book details by LCCN from local DB or OpenLibrary
export const fetchBookByLCCN = async (lccn: string): Promise<Book | null> => {
  try {
    const normalized = normalizeLccn(lccn);

    // Check local database first
    const localBook = await lookupLocalBook(normalized);
    if (localBook) {
      console.log(`Found book in local DB for LCCN: ${normalized}`);
      return localBook;
    }

    // Query OpenLibrary by LCCN
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=LCCN:${normalized}&format=json&jscmd=details`);
    if (!response.ok) {
      throw new Error(`Failed to fetch book data: ${response.status}`);
    }

    const data: Record<string, OLBookData> = await response.json();
    const bookData = data[`LCCN:${normalized}`];

    if (!bookData) {
      console.log(`No book found with LCCN: ${normalized}`);
      return null;
    }

    console.log('Raw OpenLibrary LCCN data:', JSON.stringify(bookData, null, 2));

    const description = extractDescription(bookData.details);

    const book: Book = {
      title: bookData.details?.title || 'Unknown Title',
      authors: extractAuthors(bookData.details),
      isbn: extractMainIsbn(bookData.details?.identifiers, bookData.details),
      lccn: normalized,
      publisher: extractPublisher(bookData.details),
      publishers: extractPublishers(bookData.details),
      publishedDate: bookData.details?.publish_date,
      description,
      pageCount: bookData.details?.number_of_pages ? parseInt(String(bookData.details.number_of_pages), 10) : undefined,
      categories: bookData.details?.subjects as string[] | undefined,
      language: bookData.details?.languages?.[0]?.key?.split('/')?.[2] || undefined,
      identifiers: processIdentifiers(bookData.details?.identifiers, bookData.details),
      classifications: bookData.details?.classifications as Book['classifications'],
      links: processLinks(bookData.details?.links),
      weight: bookData.details?.weight,
      url: bookData.info_url || bookData.preview_url,
      subjects: mapSubjects(bookData.details?.subjects),
      publish_places: processPublishPlaces(bookData.details?.publish_places),
      excerpts: processExcerpts(bookData.details?.excerpts),
      number_of_pages: bookData.details?.number_of_pages ? parseInt(String(bookData.details.number_of_pages), 10) : undefined,
    };

    // Ensure LCCN is in identifiers
    if (!book.identifiers) book.identifiers = {};
    if (!book.identifiers.lccn) book.identifiers.lccn = [normalized];

    // Process cover image
    const isbnForCover = book.isbn || normalized;
    if (bookData.thumbnail_url || bookData.preview_url || book.isbn) {
      try {
        let coverUrl;
        if (book.isbn) {
          coverUrl = getOpenLibraryCoverUrl(book.isbn);
        } else {
          coverUrl = bookData.thumbnail_url || bookData.preview_url;
        }
        if (coverUrl) {
          const processedImages = await processAndUploadImage(coverUrl, isbnForCover);
          book.cover = processedImages.medium;
          book.coverSmall = processedImages.small;
          book.coverLarge = processedImages.large;
        }
      } catch (error) {
        console.error('Error processing cover image:', error);
      }
    }

    return book;
  } catch (error) {
    console.error('Error fetching book by LCCN:', error);
    return null;
  }
};

// ─── Unified code lookup ────────────────────────────────────────────

// Unified code lookup: try ISBN → try LCCN → fallback
export const fetchBookByCode = async (code: string, upc?: string): Promise<Book | null> => {
  const cleaned = code.replace(/^(isbn|lccn)[:\s]*/i, '').trim();

  // If it looks like an LCCN, try LCCN first then ISBN
  if (isLccn(cleaned)) {
    console.log(`Code "${cleaned}" detected as LCCN, trying LCCN lookup first`);
    const lccnResult = await fetchBookByLCCN(cleaned);
    if (lccnResult) return lccnResult;
    // Fall through to ISBN in case detection was wrong
  }

  // Try ISBN lookup (handles ISBN, UPC, EAN)
  const isbnResult = await fetchBookByISBN(cleaned, upc);
  if (isbnResult) return isbnResult;

  // If ISBN failed and we haven't tried LCCN yet, try it now
  if (!isLccn(cleaned)) {
    const lccnResult = await fetchBookByLCCN(cleaned);
    if (lccnResult) return lccnResult;
  }

  return null;
};

// ─── Duplicate check ────────────────────────────────────────────────

// Check if a code already exists in the user's library
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

// ─── ISBN extraction helper ─────────────────────────────────────────

interface IsbnSource {
  isbn_13?: string | string[];
  isbn_10?: string | string[];
}

// Helper function to extract the main ISBN from identifiers and top-level details
const extractMainIsbn = (identifiers?: Record<string, string[]>, details?: OLDetails): string | undefined => {
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
