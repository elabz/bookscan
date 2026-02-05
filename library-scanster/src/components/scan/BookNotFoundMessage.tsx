
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Search, PenLine } from 'lucide-react';
import { isbn13ToIsbn10 } from '@/utils/isbnUtils';

interface BookNotFoundMessageProps {
  onRescan: () => void;
  onIsbnSubmit?: (isbn: string) => void;
  onAddManually?: () => void;
  isbnScanned: string;
}

export const BookNotFoundMessage: React.FC<BookNotFoundMessageProps> = ({
  onRescan,
  onIsbnSubmit,
  onAddManually,
  isbnScanned,
}) => {
  const [manualIsbn, setManualIsbn] = useState('');
  const isNonBookBarcode = isbnScanned.length === 12 ||
    (isbnScanned.length === 13 && !isbnScanned.startsWith('978') && !isbnScanned.startsWith('979'));
  const isbn10Equivalent = isbn13ToIsbn10(isbnScanned);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualIsbn.replace(/^isbn[:\s]*/i, '').replace(/[-\s]/g, '').trim();
    if (cleaned && onIsbnSubmit) {
      onIsbnSubmit(cleaned);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8 text-center">
      <div className="flex flex-col items-center justify-center py-4">
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
        <p className="text-muted-foreground mb-2">
          Scanned code: <span className="font-mono">{isbnScanned}</span>
        </p>

        {isNonBookBarcode ? (
          <p className="text-muted-foreground mb-4 max-w-md text-sm">
            This appears to be a retail UPC barcode, not an ISBN. Older books often have a UPC
            instead of an ISBN barcode. Look for the ISBN printed as text near the barcode
            (e.g. "ISBN 1-56402-437-7") and enter it below.
          </p>
        ) : isbn10Equivalent ? (
          <div className="text-muted-foreground mb-4 max-w-md text-sm space-y-2">
            <p>This ISBN-13 wasn't found. The book may be listed under its ISBN-10 instead.</p>
            <p>
              Look on the book's copyright page for the shorter 10-digit ISBN and enter it below,
              or{' '}
              <button
                type="button"
                className="text-primary underline hover:no-underline"
                onClick={() => onIsbnSubmit?.(isbn10Equivalent)}
              >
                try ISBN-10: {isbn10Equivalent}
              </button>
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground mb-4 text-sm">
            This book isn't in our database, or the barcode was misread.
          </p>
        )}

        {onIsbnSubmit && (
          <form onSubmit={handleManualSubmit} className="flex gap-2 mb-4 w-full max-w-sm">
            <input
              type="text"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              placeholder="Enter ISBN or LCCN"
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
            <Button type="submit" size="sm" disabled={!manualIsbn.trim()}>
              <Search className="mr-1 h-3 w-3" /> Look up
            </Button>
          </form>
        )}

        <div className="flex gap-2">
          {onAddManually && (
            <Button onClick={onAddManually} size="sm">
              <PenLine className="mr-2 h-4 w-4" />
              Add Manually
            </Button>
          )}
          <Button onClick={onRescan} variant="outline" size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Scan Again
          </Button>
        </div>
      </div>
    </div>
  );
};
