
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { BookCover } from '@/components/books/BookCover';
import { BookMetadata } from '@/components/books/BookMetadata';
import { BookDetailsSkeleton } from '@/components/books/BookDetailsSkeleton';
import { BookNotFound } from '@/components/books/BookNotFound';
import { BookActions } from '@/components/books/BookActions';
import { BookHeader } from '@/components/books/BookHeader';
import { BookDescription } from '@/components/books/BookDescription';
import { BookSubjects } from '@/components/books/BookSubjects';
import { BookClassifications } from '@/components/books/BookClassifications';
import { BookPublishPlaces } from '@/components/books/BookPublishPlaces';
import { BookExcerpts } from '@/components/books/BookExcerpts';
import { BookSecondaryActions } from '@/components/books/BookSecondaryActions';
import { BookImageGallery } from '@/components/books/BookImageGallery';
import { BookEditor } from '@/components/scan/BookEditor';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserBooks, getBookByIdPublic } from '@/services/libraryService';
import { updateBookDetails } from '@/services/bookOperations';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Book } from '@/types/book';

const BookDetailsPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, isSignedIn } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch user's books only if authenticated
  const { data: userBooks = [] } = useQuery({
    queryKey: ['userBooks', userId],
    queryFn: () => getUserBooks(),
    enabled: !!userId
  });

  // Fetch book details publicly (no auth needed)
  const { data: book, isLoading, error } = useQuery({
    queryKey: ['book', id],
    queryFn: () => getBookByIdPublic(id),
    enabled: !!id
  });

  useEffect(() => {
    if (book && userBooks.length > 0) {
      setIsInLibrary(userBooks.some(ub => ub.id === book.id));
    }
  }, [book, userBooks]);

  if (isLoading) {
    return (
      <PageLayout>
        <BookDetailsSkeleton />
      </PageLayout>
    );
  }

  const handleEditSave = async (updatedBook: Book) => {
    if (!book?.id) return;
    try {
      await updateBookDetails(book.id, updatedBook);
      queryClient.invalidateQueries({ queryKey: ['book', id] });
      queryClient.invalidateQueries({ queryKey: ['userBooks'] });
      setIsEditOpen(false);
      toast({ title: 'Book updated', description: 'Your changes have been saved' });
    } catch (error) {
      console.error('Error updating book:', error);
      toast({ title: 'Update failed', description: 'Please try again', variant: 'destructive' });
    }
  };

  if (error || !book) {
    return (
      <PageLayout>
        <BookNotFound
          error={error ? error.message : undefined}
          onBack={() => navigate('/')}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <BookHeader book={book} />

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
          {/* Left column: Cover + Actions */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-primary/10">
              <BookCover book={book} className="w-full max-w-[250px] mx-auto" />
            </div>

            <div className="mt-6 space-y-4">
              {isSignedIn ? (
                <>
                  {isInLibrary && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      In your collection
                    </div>
                  )}
                  <BookActions book={book} isInLibrary={isInLibrary} onEditClick={() => setIsEditOpen(true)} />
                  <BookSecondaryActions />
                </>
              ) : (
                <div className="bg-secondary/50 rounded-2xl p-5 text-center space-y-3 border border-primary/10">
                  <p className="text-sm text-muted-foreground">Sign in to add this book to your collection</p>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Details */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-primary/10">
              <BookMetadata book={book} />
            </div>

            {book.description && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-primary/10">
                <BookDescription description={book.description} />
              </div>
            )}

            {isSignedIn && isInLibrary && book.id && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-primary/10">
                <BookImageGallery bookId={book.id} isbn={book.isbn} isOwner={isInLibrary} />
              </div>
            )}

            {book.subjects && book.subjects.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-primary/10">
                <BookSubjects subjects={book.subjects} />
              </div>
            )}

            <BookClassifications classifications={book.classifications} />
            <BookPublishPlaces publishPlaces={book.publish_places} />
            <BookExcerpts excerpts={book.excerpts} />
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Book Details</DialogTitle>
          </DialogHeader>
          <BookEditor book={book} onSave={handleEditSave} />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default BookDetailsPage;
