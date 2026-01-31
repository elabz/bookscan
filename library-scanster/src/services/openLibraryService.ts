
/**
 * Service for interacting with the OpenLibrary API
 */

/**
 * Returns the URL for a book cover from OpenLibrary based on ISBN
 */
export const getOpenLibraryCoverUrl = (isbn: string, size: 'S' | 'M' | 'L' = 'L'): string => {
  // Validate ISBN
  if (!isbn || isbn.trim().length === 0) {
    throw new Error('Invalid ISBN provided to getOpenLibraryCoverUrl');
  }
  
  // Remove any hyphens or spaces
  const normalizedIsbn = isbn.replace(/[-\s]/g, '');
  
  // Append ?default=false to avoid default placeholder image
  return `https://covers.openlibrary.org/b/ISBN/${normalizedIsbn}-${size}.jpg?default=false`;
};

/**
 * Checks if a cover exists for the given ISBN
 */
export const checkCoverExists = async (isbn: string): Promise<boolean> => {
  try {
    const coverUrl = getOpenLibraryCoverUrl(isbn);
    const response = await fetch(coverUrl, {
      method: 'HEAD'
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error checking if cover exists:', error);
    return false;
  }
};
