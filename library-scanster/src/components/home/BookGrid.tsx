
import { Book } from '@/types/book';
import { BookCard } from '@/components/books/BookCard';

interface BookGridProps {
  books: Book[];
  loadingBooks?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  isExternalSource?: boolean;
}

export const BookGrid = ({
  books,
  loadingBooks = 3,
  isLoading = false,
  emptyMessage = "No books found",
  isExternalSource = false
}: BookGridProps) => {
  if (isLoading) {
    // Return loading skeletons for books
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: loadingBooks }).map((_, index) => (
          <div key={index} className="rounded-lg border shadow-sm animate-pulse bg-muted h-[320px]" />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {books.map((book, index) => (
        <BookCard
          key={book.id || index}
          book={book}
          style={{ animationDelay: `${index * 50}ms` }}
          className="animate-slide-up"
          isExternalSource={isExternalSource}
        />
      ))}
    </div>
  );
};
