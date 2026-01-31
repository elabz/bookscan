import { Book } from '@/types/book';
import { formatAuthors, truncateText } from '@/utils/bookUtils';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BookCardProps {
  book: Book;
  isLoading?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  actionLabel?: string;
}

export const BookCard = ({ 
  book, 
  isLoading = false, 
  style, 
  className,
  onClick,
  actionLabel
}: BookCardProps) => {
  if (isLoading) {
    return (
      <div className={cn("book-card animate-pulse", className)} style={style}>
        <div className="aspect-[2/3] bg-muted rounded-t-xl"></div>
        <div className="p-4 space-y-2">
          <div className="h-6 bg-muted rounded-md"></div>
          <div className="h-4 bg-muted rounded-md w-3/4"></div>
        </div>
      </div>
    );
  }

  const CardContent = () => (
    <>
      {/* Cover Image */}
      <div className="aspect-[2/3] bg-muted rounded-t-xl overflow-hidden">
        {book.cover ? (
          <img
            src={book.cover}
            alt={`Cover of ${book.title}`}
            className="w-full h-full object-cover cover-image"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-accent text-accent-foreground">
            <BookOpen className="h-12 w-12 opacity-70" />
          </div>
        )}
      </div>
      
      {/* Book Info */}
      <div className="p-4">
        <h3 className="font-medium text-base line-clamp-1 group-hover:text-primary transition-colors">
          {truncateText(book.title, 40)}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {formatAuthors(book.authors)}
        </p>
        
        {/* Display genres if available */}
        {book.genres && book.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {book.genres.slice(0, 2).map((genre) => (
              <span key={genre.id} className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                {genre.name}
              </span>
            ))}
            {book.genres.length > 2 && (
              <span className="text-xs px-2 py-0.5 bg-secondary/50 text-secondary-foreground rounded-full">
                +{book.genres.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        {onClick && actionLabel && (
          <div className="mt-3">
            <Button 
              onClick={(e) => {
                e.preventDefault(); // Prevent link navigation if rendered within Link
                onClick();
              }} 
              variant="secondary" 
              size="sm" 
              className="w-full"
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </>
  );

  // If it has an onClick but no actionLabel, or if it has no onClick,
  // make it a Link to the book details
  if (!onClick || !actionLabel) {
    return (
      <Link 
        to={`/books/${book.id}`} 
        className={cn("book-card cover-hover group", className)}
        style={style}
      >
        <CardContent />
      </Link>
    );
  }

  // Otherwise, make it a div with the onClick on the action button
  return (
    <div 
      className={cn("book-card", className)}
      style={style}
    >
      <CardContent />
    </div>
  );
};
