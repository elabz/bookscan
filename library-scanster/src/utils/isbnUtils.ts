
/**
 * Normalizes ISBN by removing hyphens and spaces
 */
export const normalizeIsbn = (isbn: string): string => {
  return isbn.replace(/[-\s]/g, '').trim();
};

/**
 * Validates if a string is a valid ISBN (10 or 13 digits)
 */
export const isValidIsbn = (isbn: string): boolean => {
  const normalized = normalizeIsbn(isbn);

  // ISBN-10: 10 digits, last can be 'X'
  if (/^\d{9}[\dXx]$/.test(normalized)) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(normalized[i]) * (10 - i);
    }
    const lastChar = normalized[9].toUpperCase();
    const checkValue = lastChar === 'X' ? 10 : parseInt(lastChar);
    return (sum + checkValue) % 11 === 0;
  }

  // ISBN-13: must start with 978 or 979
  if (/^\d{13}$/.test(normalized) && (normalized.startsWith('978') || normalized.startsWith('979'))) {
    return isValidEan(normalized);
  }

  return false;
};

/**
 * Validates any EAN-13 barcode checksum (not just ISBN).
 * Some books use non-978/979 EAN prefixes.
 */
export const isValidEan = (code: string): boolean => {
  const normalized = code.replace(/[-\s]/g, '').trim();
  if (!/^\d{13}$/.test(normalized)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(normalized[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(normalized[12]);
};

/**
 * Validates a UPC-A check digit (12 digits).
 */
export const isValidUpc = (code: string): boolean => {
  const normalized = code.replace(/[-\s]/g, '').trim();
  if (!/^\d{12}$/.test(normalized)) return false;

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(normalized[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(normalized[11]);
};

/**
 * Extracts an ISBN from various formats (with or without hyphens)
 * and returns both the normalized and original versions
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
 * Checks if a string is a UPC-A barcode (12 digits).
 * Does NOT validate checksum — use isValidUpc for that.
 */
export const isUpc = (code: string): boolean => {
  const normalized = code.replace(/[-\s]/g, '').trim();
  return /^\d{12}$/.test(normalized);
};

/**
 * Converts a UPC-A barcode to an ISBN-13.
 *
 * A UPC-A barcode on a book IS an EAN-13 with an implicit leading zero.
 * So UPC "012345678905" is really EAN-13 "0012345678905".
 *
 * However, for books specifically:
 * - Bookland EAN barcodes start with 978 or 979 and ARE ISBN-13s directly
 * - If the UPC starts with 0, the EAN-13 equivalent might be a 978-prefixed ISBN
 *
 * The proper approach: prepend "0" to make it EAN-13, check if it's a valid ISBN.
 * If not, this UPC is not an ISBN and we return null (caller should do a search).
 */
export const upcToIsbn13 = (upc: string): string | null => {
  const normalized = upc.replace(/[-\s]/g, '').trim();
  if (!isUpc(normalized)) return null;

  // A UPC-A is really an EAN-13 with implicit leading 0
  const ean13 = '0' + normalized;

  // If it's a valid ISBN-13 (starts with 978/979), use it directly
  if (isValidIsbn(ean13)) {
    return ean13;
  }

  // For non-978/979 UPCs, there's no standard way to derive an ISBN.
  // Return null — the caller should search by UPC instead.
  return null;
};

/**
 * Formats an ISBN with proper hyphens based on standard
 */
export const formatIsbn = (isbn: string): string => {
  const normalized = normalizeIsbn(isbn);

  if (normalized.length === 10) {
    return `${normalized.slice(0, 1)}-${normalized.slice(1, 5)}-${normalized.slice(5, 9)}-${normalized.slice(9)}`;
  }

  if (normalized.length === 13) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 4)}-${normalized.slice(4, 9)}-${normalized.slice(9, 12)}-${normalized.slice(12)}`;
  }

  return isbn;
};
