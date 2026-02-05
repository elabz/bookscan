
import { Book } from '@/types/book';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BookHeaderProps {
  book: Book;
}

export const BookHeader = ({ book }: BookHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        onClick={() => navigate('/library')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
      <p className="text-xl mb-6">
        by {book.authors?.join(', ') || 'Unknown Author'}
      </p>
    </>
  );
};
