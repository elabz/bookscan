
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BookNotFoundProps {
  error?: string | null;
  onBack?: () => void;
}

export const BookNotFound = ({ error, onBack }: BookNotFoundProps) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">
        {error || 'Book not found'}
      </h1>
      <p className="text-muted-foreground mb-8">
        The book you're looking for couldn't be found.
      </p>
      <Button 
        onClick={onBack}
        asChild={!onBack}
      >
        {onBack ? (
          <span>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </span>
        ) : (
          <Link to="/library">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Link>
        )}
      </Button>
    </div>
  );
};
