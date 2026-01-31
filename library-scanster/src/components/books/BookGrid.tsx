
import { Book } from '@/types/book';
import { BookCard } from './BookCard';
import { cn } from '@/lib/utils';

interface BookGridProps {
  books: Book[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const BookGrid = ({
  books,
  isLoading = false,
  emptyMessage = 'No books found',
  className
}: BookGridProps) => {
  // If loading, show skeleton cards
  if (isLoading) {
    return (
      <div className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6",
        className
      )}>
        {Array.from({ length: 10 }).map((_, i) => (
          <BookCard key={`skeleton-${i}`} book={{} as Book} isLoading />
        ))}
      </div>
    );
  }

  // If no books and not loading, show empty message
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Show books
  return (
    <div className={cn(
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6",
      className
    )}>
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};
