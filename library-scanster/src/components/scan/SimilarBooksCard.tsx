import { forwardRef } from 'react';
import { Book } from '@/types/book';
import { Loader2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SimilarBooksCardProps {
  books: Book[];
  isLoading: boolean;
}

export const SimilarBooksCard = forwardRef<HTMLDivElement, SimilarBooksCardProps>(
  ({ books, isLoading }, ref) => {
    const navigate = useNavigate();

    if (!isLoading && books.length === 0) return null;

    return (
      <div
        ref={ref}
        className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6 md:p-8 shadow-sm mb-8 animate-fade-in"
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200">
            Similar Books in Your Library
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking for similar books...
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => navigate(`/books/${book.id}`)}
                className="flex items-center gap-3 w-full text-left p-2 -mx-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
              >
                {book.cover ? (
                  <img
                    src={book.coverSmall || book.cover}
                    alt={book.title}
                    className="w-10 h-14 object-cover rounded shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 bg-amber-200/50 dark:bg-amber-800/30 rounded flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {book.authors?.join(', ') || 'Unknown Author'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
