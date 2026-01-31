
/**
 * Normalizes ISBN by removing hyphens and spaces
 * 
 * @param isbn The ISBN string that might contain hyphens or spaces
 * @returns The normalized ISBN without hyphens or spaces
 */
export const normalizeIsbn = (isbn: string): string => {
  return isbn.replace(/[-\s]/g, '').trim();
};

/**
 * Validates if a string is a valid ISBN (10 or 13 digits)
 * 
 * @param isbn The ISBN string to validate
 * @returns Boolean indicating if the ISBN is valid
 */
export const isValidIsbn = (isbn: string): boolean => {
  const normalized = normalizeIsbn(isbn);
  
  // Check basic format first (10 or 13 digits)
  if (!/^(\d{10}|\d{13})$/.test(normalized)) {
    return false;
  }
  
  // ISBN-10 validation with checksum
  if (normalized.length === 10) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(normalized[i]) * (10 - i);
    }
    
    // Check character can be 'X' (which equals 10)
    const lastChar = normalized[9].toUpperCase();
    const checkValue = lastChar === 'X' ? 10 : parseInt(lastChar);
    
    return (sum + checkValue) % 11 === 0;
  }
  
  // ISBN-13 validation with checksum
  if (normalized.length === 13) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(normalized[i]) * (i % 2 === 0 ? 1 : 3);
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(normalized[12]);
  }
  
  return false;
};

/**
 * Extracts an ISBN from various formats (with or without hyphens)
 * and returns both the normalized and original versions
 * 
 * @param input The input string that might contain an ISBN
 * @returns Object with normalized and original ISBN, or null if no valid ISBN found
 */
export const extractIsbn = (input: string): { normalized: string; original: string } | null => {
  const normalized = normalizeIsbn(input);
  
  if (isValidIsbn(normalized)) {
    return {
      normalized,
      original: input.trim()
    };
  }
  
  return null;
};

/**
 * Formats an ISBN with proper hyphens based on standard
 * 
 * @param isbn The ISBN string (can be with or without hyphens)
 * @returns Properly formatted ISBN with hyphens, or original if not valid
 */
export const formatIsbn = (isbn: string): string => {
  const normalized = normalizeIsbn(isbn);
  
  if (normalized.length === 10) {
    // ISBN-10 format: group1-group2-group3-check
    // This is a simplified version, proper hyphenation depends on the registration group
    return `${normalized.slice(0, 1)}-${normalized.slice(1, 5)}-${normalized.slice(5, 9)}-${normalized.slice(9)}`;
  }
  
  if (normalized.length === 13) {
    // ISBN-13 format: prefix-group1-group2-group3-check
    // Simplification: typically 978-0-00-000000-0 format but varies by country
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 4)}-${normalized.slice(4, 9)}-${normalized.slice(9, 12)}-${normalized.slice(12)}`;
  }
  
  return isbn;
};
