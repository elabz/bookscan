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
import { ScanBarcode } from 'lucide-react';

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
            <div className="space-y-2">
              <p>
                <span className="font-medium text-foreground">{book.title}</span>
                {book.authors?.length > 0 && (
                  <span> by {book.authors.join(', ')}</span>
                )}
              </p>
              <p>This book is already in your library.</p>
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
