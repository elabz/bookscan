import { useEffect, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { ScanBarcode, BookOpen } from 'lucide-react';

interface DuplicateBookDialogProps {
  open: boolean;
  book: { id: string; title: string; authors: string[]; cover_url?: string };
  onScanAnother: () => void;
  onGoToLibrary: () => void;
}

export const DuplicateBookDialog = ({
  open,
  book,
  onScanAnother,
  onGoToLibrary,
}: DuplicateBookDialogProps) => {
  const scanButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the "Scan Another" button when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        scanButtonRef.current?.focus();
      }, 100);
    }
  }, [open]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Already in Your Library</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex gap-4 items-start pt-2">
              {/* Book cover */}
              <div className="flex-shrink-0 w-16 h-24 rounded overflow-hidden bg-muted">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Book info */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium text-foreground line-clamp-2">{book.title}</p>
                {book.authors?.length > 0 && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {book.authors.join(', ')}
                  </p>
                )}
                <p className="text-sm text-muted-foreground pt-1">
                  This book is already in your library.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onGoToLibrary}>
            Go to Library
          </AlertDialogCancel>
          <AlertDialogAction ref={scanButtonRef} onClick={onScanAnother}>
            <ScanBarcode className="mr-2 h-4 w-4" />
            Scan Next Book
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
