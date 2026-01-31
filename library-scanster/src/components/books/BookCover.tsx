
import { BookOpen } from 'lucide-react';
import { Book } from '@/types/book';

interface BookCoverProps {
  book?: Book;
  coverUrl?: string;
  title?: string;
  className?: string;
}

export const BookCover = ({ book, coverUrl, title, className = '' }: BookCoverProps) => {
  // If a book object is provided, use its properties
  const displayCover = book?.cover || coverUrl;
  const displayTitle = book?.title || title || 'Book';

  return (
    <div className={`relative aspect-[2/3] max-w-[280px] w-full ${className}`}>
      {displayCover ? (
        <img
          src={displayCover}
          alt={`Cover of ${displayTitle}`}
          className="w-full h-full object-cover rounded-lg shadow-md"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-accent rounded-lg shadow-md">
          <BookOpen className="h-16 w-16 text-accent-foreground opacity-50" />
        </div>
      )}
    </div>
  );
};
