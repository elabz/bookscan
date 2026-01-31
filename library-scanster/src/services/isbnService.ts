
import { Book, Identifier, Publisher, Link, PublishPlace, BookExcerpt } from '@/types/book';
import { normalizeIsbn, isUpc, upcToIsbn13 } from '@/utils/isbnUtils';
import { getOpenLibraryCoverUrl, processAndUploadImage } from '@/services/imageService';

// Fetch book details by ISBN from Open Library API
export const fetchBookByISBN = async (isbn: string): Promise<Book | null> => {
  try {
    let normalizedIsbn = normalizeIsbn(isbn);
    let originalUpc: string | undefined;

    // If input is a UPC barcode, try converting to ISBN-13
    if (isUpc(normalizedIsbn)) {
      originalUpc = normalizedIsbn;
      const converted = upcToIsbn13(normalizedIsbn);
      if (converted) {
        console.log(`Converted UPC ${normalizedIsbn} to ISBN-13 ${converted}`);
        normalizedIsbn = converted;
      }
    }

    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${normalizedIsbn}&format=json&jscmd=details`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch book data: ${response.status}`);
    }
    
    const data = await response.json();
    const bookData = data[`ISBN:${normalizedIsbn}`];
    
    if (!bookData) {
      // If we had a UPC, try searching OpenLibrary by UPC as a fallback
      if (originalUpc) {
        console.log(`ISBN lookup failed, trying UPC search for: ${originalUpc}`);
        const upcResult = await fetchBookByUpcSearch(originalUpc);
        if (upcResult) return upcResult;
      }
      console.log(`No book found with ISBN: ${normalizedIsbn}`);
      return null;
    }

    console.log('Raw OpenLibrary data:', JSON.stringify(bookData, null, 2));

    // Process description field to ensure it's a string
    let description = '';
    if (bookData.details?.description) {
      if (typeof bookData.details.description === 'string') {
        description = bookData.details.description;
      } else if (bookData.details.description.value) {
        description = bookData.details.description.value;
      }
    } else if (bookData.details?.notes) {
      description = bookData.details.notes;
    }

    // Extract all the data from the OpenLibrary response
    const book: Book = {
      title: bookData.details?.title || 'Unknown Title',
      authors: extractAuthors(bookData.details),
      isbn: extractMainIsbn(bookData.details?.identifiers) || isbn,
      publisher: extractPublisher(bookData.details),
      publishers: extractPublishers(bookData.details),
      publishedDate: bookData.details?.publish_date,
      description: description,
      pageCount: bookData.details?.number_of_pages ? 
        parseInt(bookData.details.number_of_pages, 10) : undefined,
      categories: bookData.details?.subjects,
      language: bookData.details?.languages?.[0]?.key?.split('/')?.[2] || undefined,
      
      // Map all additional fields
      identifiers: processIdentifiers(bookData.details?.identifiers),
      classifications: bookData.details?.classifications,
      links: processLinks(bookData.details?.links),
      weight: bookData.details?.weight,
      url: bookData.info_url || bookData.preview_url,
      subjects: bookData.details?.subjects?.map((subject: any) => ({
        name: typeof subject === 'string' ? subject : subject.name || subject.title || subject
      })),
      publish_places: processPublishPlaces(bookData.details?.publish_places),
      excerpts: processExcerpts(bookData.details?.excerpts),
      number_of_pages: bookData.details?.number_of_pages ? 
        parseInt(bookData.details.number_of_pages, 10) : undefined
    };
    
    // Store UPC in identifiers if we had one
    if (originalUpc) {
      if (!book.identifiers) book.identifiers = {};
      book.identifiers.upc = [originalUpc];
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

// Helper function to extract authors
const extractAuthors = (details: any): string[] => {
  if (!details?.authors) return ['Unknown Author'];
  
  try {
    return details.authors.map((author: any) => {
      return author.name || author.title || 'Unknown Author';
    });
  } catch (error) {
    console.error('Error extracting authors:', error);
    return ['Unknown Author'];
  }
};

// Helper function to extract publisher
const extractPublisher = (details: any): string | undefined => {
  if (!details?.publishers || details.publishers.length === 0) return undefined;
  
  try {
    return details.publishers[0].name || details.publishers[0];
  } catch (error) {
    console.error('Error extracting publisher:', error);
    return undefined;
  }
};

// Helper function to extract publishers
const extractPublishers = (details: any): Publisher[] | undefined => {
  if (!details?.publishers || details.publishers.length === 0) return undefined;
  
  try {
    return details.publishers.map((publisher: any) => {
      return typeof publisher === 'string' 
        ? { name: publisher } 
        : { name: publisher.name || 'Unknown Publisher' };
    });
  } catch (error) {
    console.error('Error extracting publishers:', error);
    return undefined;
  }
};

// Helper function to process links
const processLinks = (links: any): Link[] | undefined => {
  if (!links || links.length === 0) return undefined;
  
  try {
    return links.map((link: any) => ({
      url: link.url,
      title: link.title || 'External Link'
    }));
  } catch (error) {
    console.error('Error processing links:', error);
    return undefined;
  }
};

// Helper function to process publish places
const processPublishPlaces = (places: any): PublishPlace[] | undefined => {
  if (!places || places.length === 0) return undefined;
  
  try {
    return places.map((place: any) => {
      return typeof place === 'string' 
        ? { name: place } 
        : { name: place.name || place.title || 'Unknown Place' };
    });
  } catch (error) {
    console.error('Error processing publish places:', error);
    return undefined;
  }
};

// Helper function to process excerpts
const processExcerpts = (excerpts: any): BookExcerpt[] | undefined => {
  if (!excerpts || !Array.isArray(excerpts) || excerpts.length === 0) return undefined;
  
  try {
    return excerpts.map((excerpt: any) => ({
      text: excerpt.text || excerpt.excerpt || '',
      comment: excerpt.comment
    }));
  } catch (error) {
    console.error('Error processing excerpts:', error);
    return undefined;
  }
};

// Helper function to process identifiers
const processIdentifiers = (identifiers: any): Identifier | undefined => {
  if (!identifiers || Object.keys(identifiers).length === 0) return undefined;
  
  try {
    const result: Identifier = {};
    
    Object.entries(identifiers).forEach(([key, values]) => {
      if (Array.isArray(values)) {
        result[key] = values;
      } else if (values) {
        result[key] = [values.toString()];
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error processing identifiers:', error);
    return undefined;
  }
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

// Helper function to extract the main ISBN from identifiers
const extractMainIsbn = (identifiers?: any): string | undefined => {
  if (!identifiers) return undefined;
  
  try {
    // Prefer ISBN-13 over ISBN-10
    if (identifiers.isbn_13 && (Array.isArray(identifiers.isbn_13) ? identifiers.isbn_13.length > 0 : identifiers.isbn_13)) {
      return Array.isArray(identifiers.isbn_13) ? identifiers.isbn_13[0] : identifiers.isbn_13.toString();
    }
    
    if (identifiers.isbn_10 && (Array.isArray(identifiers.isbn_10) ? identifiers.isbn_10.length > 0 : identifiers.isbn_10)) {
      return Array.isArray(identifiers.isbn_10) ? identifiers.isbn_10[0] : identifiers.isbn_10.toString();
    }
    
    return undefined;
  } catch (error) {
    console.error('Error extracting main ISBN:', error);
    return undefined;
  }
};
