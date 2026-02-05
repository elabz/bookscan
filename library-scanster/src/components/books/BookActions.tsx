
import { Button } from '@/components/ui/button';
import { Book } from '@/types/book';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { addBook } from '@/services/bookService';
import { removeBookFromLibrary } from '@/services/bookOperations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface BookActionsProps {
  book: Book;
  isInLibrary?: boolean;
  onLibraryStatusChange?: (newBookId?: string) => void;
  onEditClick?: () => void;
}

export const BookActions = ({ book, isInLibrary = false, onLibraryStatusChange, onEditClick }: BookActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const { userId } = useAuth();
  const { toast } = useToast();

  const handleAddToLibrary = async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add books to your library",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const bookToAdd = { ...book };

      if (!bookToAdd.isbn || bookToAdd.isbn.trim() === '') {
        if (bookToAdd.identifiers) {
          if (bookToAdd.identifiers.isbn_13 && bookToAdd.identifiers.isbn_13.length > 0) {
            bookToAdd.isbn = bookToAdd.identifiers.isbn_13[0];
          } else if (bookToAdd.identifiers.isbn_10 && bookToAdd.identifiers.isbn_10.length > 0) {
            bookToAdd.isbn = bookToAdd.identifiers.isbn_10[0];
          } else {
            bookToAdd.isbn = `generated-${Math.random().toString(36).substring(2, 11)}`;
          }
        } else {
          bookToAdd.isbn = `generated-${Math.random().toString(36).substring(2, 11)}`;
        }
      }

      const addedBook = await addBook(bookToAdd);
      toast({
        title: "Success!",
        description: "Book added to your library"
      });
      if (onLibraryStatusChange) {
        onLibraryStatusChange(addedBook?.id);
      }
    } catch (error) {
      console.error("Error adding book:", error);
      toast({
        title: "Failed to add book",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!userId || !book.id) {
      toast({
        title: "Error",
        description: "Cannot remove book at this time",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await removeBookFromLibrary(book.id);
      if (success) {
        toast({
          title: "Book removed",
          description: "Book has been removed from your library"
        });
        if (onLibraryStatusChange) {
          onLibraryStatusChange();
        }
      } else {
        throw new Error("Failed to remove book");
      }
    } catch (error) {
      console.error("Error removing book:", error);
      toast({
        title: "Failed to remove book",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
        {isInLibrary ? (
          <>
            <Button onClick={onEditClick}>Edit Details</Button>
            <Button variant="outline" onClick={() => setShowRemoveConfirm(true)} disabled={isLoading}>
              {isLoading ? "Processing..." : "Remove from Library"}
            </Button>
          </>
        ) : (
          <Button onClick={handleAddToLibrary} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add to Library"}
          </Button>
        )}
      </div>

      {/* Remove from Library Confirmation Dialog */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Library</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{book.title}" from your library? Your photos and personal notes for this book will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromLibrary}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
