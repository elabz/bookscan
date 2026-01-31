
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookPlus } from 'lucide-react';

export const ScanPageHeader: React.FC = () => {
  return (
    <>
      <h1 className="text-3xl font-bold mb-4 animate-slide-down">Scan a Book</h1>
      <p className="text-muted-foreground mb-8 animate-slide-down" style={{ animationDelay: '50ms' }}>
        Quickly add books to your library by scanning the ISBN barcode
      </p>
    </>
  );
};

export const ScanPageFooter: React.FC = () => {
  return (
    <div className="text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
      <p className="text-muted-foreground mb-4">
        Don't have the book physically?
      </p>
      <Button asChild variant="outline">
        <Link to="/books/add">
          <BookPlus className="mr-2 h-4 w-4" />
          Add Book Manually
        </Link>
      </Button>
    </div>
  );
};
