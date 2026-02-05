
export interface Genre {
  id: number;
  name: string;
  description?: string;
}

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
  comment?: string;
  text: string;
}

export interface Book {
  id?: string;
  title: string;
  authors: string[];
  isbn?: string;
  lccn?: string;
  cover?: string;
  coverSmall?: string;     // Small cover variant
  coverLarge?: string;     // Large cover variant
  publisher?: string;
  publishers?: Publisher[];
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
  edition?: string;
  genres?: Genre[];
  location_id?: string | null;
  addedByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
  width?: string;          // Book width
  height?: string;         // Book height
  depth?: string;          // Book depth/thickness
  dimensionUnit?: 'mm' | 'cm' | 'in';  // Unit for width/height/depth
  weightUnit?: 'g' | 'kg' | 'lb' | 'oz'; // Unit for weight
  price?: string;          // Current/selling price
  pricePublished?: string; // Original published/list price
  priceCurrency?: string;  // Currency code: USD, EUR, GBP, etc.
  // OpenLibrary fields
  identifiers?: Identifier;
  classifications?: Classification;
  links?: Link[];
  weight?: string;
  url?: string;
  subjects?: { url?: string; name: string }[];
  publish_places?: PublishPlace[];
  excerpts?: BookExcerpt[];
  number_of_pages?: number;
}

export interface BookImage {
  id: string;
  book_id: string;
  user_id: string;
  url: string;
  url_small?: string;
  url_large?: string;
  is_cover: boolean;
  sort_order: number;
  caption?: string;
  created_at: string;
}

// Database row shape (snake_case) returned by API endpoints
export interface DbBookRow {
  id: string;
  title: string;
  authors: string[];
  isbn?: string;
  lccn?: string;
  cover_url?: string;
  cover_small_url?: string;
  cover_large_url?: string;
  user_cover_url?: string;
  user_cover_small_url?: string;
  user_cover_large_url?: string;
  user_overrides?: Record<string, string | string[] | number>;
  publisher?: string;
  published_date?: string;
  description?: string;
  page_count?: number;
  categories?: string[];
  language?: string;
  edition?: string;
  width?: string;
  height?: string;
  depth?: string;
  dimension_unit?: string;
  weight_unit?: string;
  price?: string;
  price_published?: string;
  price_currency?: string;
  identifiers?: Identifier;
  classifications?: Classification;
  links?: Link[];
  weight?: string;
  url?: string;
  subjects?: { name: string; url?: string }[];
  publish_places?: PublishPlace[];
  excerpts?: BookExcerpt[];
  number_of_pages?: number;
  location_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BookSearchResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
}

// New interface to represent a user's book collection
export interface UserBook {
  userId: number; // Changed to number type for long integer
  bookId: string;
  dateAdded: string;
  notes?: string;
}
