
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookPlus, BookCheck, Tag, Loader2, Pencil } from 'lucide-react';
import { formatIdentifiers } from '@/utils/bookUtils';

interface BookDetailsCardProps {
  book: Book;
  onAddToLibrary: () => void;
  onEditBook?: () => void;
  isAddingToLibrary?: boolean;
}

export const BookDetailsCard = ({ 
  book, 
  onAddToLibrary, 
  onEditBook,
  isAddingToLibrary = false 
}: BookDetailsCardProps) => {
  // Helper function to handle description display
  const getDescriptionText = (description: any): string => {
    if (!description) return '';
    
    if (typeof description === 'string') {
      return description;
    }
    
    if (description && typeof description === 'object') {
      if (description.value) {
        return description.value;
      }
      return '';
    }
    
    return '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm mb-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start mb-4">
        <h2 className="text-xl font-medium">Book Found</h2>
        <div className="flex mt-2 md:mt-0 gap-2">
          {onEditBook && (
            <Button onClick={onEditBook} variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit Details
            </Button>
          )}
          <Button onClick={onAddToLibrary} disabled={isAddingToLibrary} size="sm">
            {isAddingToLibrary ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <BookPlus className="mr-2 h-4 w-4" />
                Add to Library
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {book.cover ? (
          <img 
            src={book.cover} 
            alt={book.title} 
            className="w-32 h-auto object-cover rounded-md shadow-sm"
          />
        ) : (
          <div className="w-32 h-48 bg-secondary flex items-center justify-center rounded-md">
            <BookCheck className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="text-lg font-medium">{book.title}</h3>
          <p className="text-muted-foreground mb-2">
            {book.authors?.join(', ') || 'Unknown Author'}
          </p>
          
          {book.publisher && (
            <p className="text-sm mb-1">
              <span className="font-medium">Publisher:</span> {book.publisher}
            </p>
          )}
          
          {book.publishedDate && (
            <p className="text-sm mb-1">
              <span className="font-medium">Published:</span> {book.publishedDate}
            </p>
          )}
          
          {book.pageCount && (
            <p className="text-sm mb-1">
              <span className="font-medium">Pages:</span> {book.pageCount}
            </p>
          )}
          
          {book.weight && (
            <p className="text-sm mb-1">
              <span className="font-medium">Weight:</span> {book.weight}
            </p>
          )}
          
          {book.isbn && (
            <p className="text-sm mb-1">
              <span className="font-medium">ISBN:</span> {book.isbn}
            </p>
          )}
          
          {book.identifiers && Object.keys(book.identifiers).length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium">Identifiers:</p>
              <div className="text-xs text-muted-foreground overflow-hidden text-ellipsis">
                {Object.entries(book.identifiers).map(([key, values]) => {
                  if (values && values.length > 0) {
                    return (
                      <p key={key} className="mb-0.5">
                        <span className="font-medium">{key}:</span> {values.join(', ')}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
          
          {book.categories && book.categories.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1 text-sm mb-2">
                <Tag className="h-3.5 w-3.5" />
                <span className="font-medium">Categories:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {book.categories.slice(0, 5).map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
