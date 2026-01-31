
import { Book } from '@/types/book';

export interface SearchTabProps {
  onSearch?: (query: string) => Promise<void>;
  isSearching?: boolean;
  searchResults?: Book[];
  hasSearched?: boolean;
  handleSelectBook?: (book: Book) => Promise<void>;
}

export interface ScanTabProps {
  isSearching?: boolean;
  foundBook?: Book | null;
  handleIsbnSearch?: (isbn: string) => Promise<void>;
  handleAddScannedBook?: () => Promise<void>;
  isSubmitting?: boolean;
  setFoundBook?: (book: Book | null) => void;
}

export interface ManualEntryTabProps {
  newBook?: Partial<Book>;
  handleManualChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmitManual?: (e: React.FormEvent) => Promise<void>;
  isSubmitting?: boolean;
  navigate?: (path: string) => void;
}
