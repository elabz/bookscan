
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface BookNotFoundMessageProps {
  onRescan: () => void;
  isbnScanned: string;
}

export const BookNotFoundMessage: React.FC<BookNotFoundMessageProps> = ({ 
  onRescan,
  isbnScanned,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8 text-center">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-red-500 dark:text-red-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">Book Not Found</h3>
        <p className="text-muted-foreground mb-4">
          We couldn't find a book with ISBN: <span className="font-mono">{isbnScanned}</span>
        </p>
        <p className="text-muted-foreground mb-6">
          This could be because the book isn't in our database, or the ISBN was scanned incorrectly.
        </p>
        <Button onClick={onRescan} variant="default" className="mb-2">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Scanning Again
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          You can also try searching for the book by title or add it manually.
        </p>
      </div>
    </div>
  );
};
