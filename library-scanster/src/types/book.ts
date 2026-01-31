
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
  addedByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
  width?: string;          // Book width (new field)
  height?: string;         // Book height (new field)
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
