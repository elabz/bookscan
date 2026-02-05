import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBookImages, deleteBookImage, setImageAsCover } from '@/services/bookImageService';
import { BookImage } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Trash2, Star, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { BookImageEditor } from './BookImageEditor';
import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface BookImageGalleryProps {
  bookId: string;
  isbn?: string;
  isOwner: boolean;
}

export const BookImageGallery = ({ bookId, isbn, isOwner }: BookImageGalleryProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['bookImages', bookId],
    queryFn: () => getBookImages(bookId),
  });

  const handleDelete = async (imageId: string) => {
    setIsDeleting(true);
    try {
      await deleteBookImage(bookId, imageId);
      queryClient.invalidateQueries({ queryKey: ['bookImages', bookId] });
      toast({ title: 'Image deleted' });
    } catch (err) {
      toast({ title: 'Failed to delete image', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleSetCover = async (imageId: string) => {
    try {
      await setImageAsCover(bookId, imageId);
      queryClient.invalidateQueries({ queryKey: ['bookImages', bookId] });
      // Invalidate all book queries for this bookId (regardless of isSignedIn flag)
      queryClient.invalidateQueries({ predicate: (query) =>
        query.queryKey[0] === 'book' && query.queryKey[1] === bookId
      });
      toast({ title: 'Cover updated' });
    } catch (err) {
      toast({ title: 'Failed to set cover', variant: 'destructive' });
    }
  };

  const handleImageAdded = (image: BookImage) => {
    queryClient.invalidateQueries({ queryKey: ['bookImages', bookId] });
    if (image.is_cover) {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    }
    setShowEditor(false);
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const navigateViewer = useCallback((direction: 'prev' | 'next') => {
    setViewerIndex(current => {
      if (direction === 'prev') {
        return current > 0 ? current - 1 : images.length - 1;
      }
      return current < images.length - 1 ? current + 1 : 0;
    });
  }, [images.length]);

  useEffect(() => {
    if (!viewerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigateViewer('prev');
      else if (e.key === 'ArrowRight') navigateViewer('next');
      else if (e.key === 'Escape') setViewerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerOpen, navigateViewer]);

  const currentImage = images[viewerIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Photos ({images.length})
        </h3>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={() => setShowEditor(!showEditor)}>
            {showEditor ? 'Cancel' : 'Add Photo'}
          </Button>
        )}
      </div>

      {showEditor && isOwner && (
        <BookImageEditor bookId={bookId} isbn={isbn} onImageAdded={handleImageAdded} />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img: BookImage, index: number) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border">
              <img
                src={img.url_small || img.url}
                alt={img.caption || 'Book photo'}
                className="w-full aspect-[2/3] object-cover cursor-pointer"
                onClick={() => openViewer(index)}
              />
              {img.is_cover && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                  Cover
                </div>
              )}
              {isOwner && (
                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 flex gap-1 justify-end z-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={`h-7 w-7 flex items-center justify-center rounded pointer-events-auto ${img.is_cover ? 'text-yellow-400' : 'text-white hover:text-yellow-400 hover:bg-white/20'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleSetCover(img.id);
                        }}
                      >
                        <Star className={`h-4 w-4 ${img.is_cover ? 'fill-yellow-400' : ''}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{img.is_cover ? 'Current cover' : 'Set as cover'}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="h-7 w-7 flex items-center justify-center rounded pointer-events-auto text-white hover:text-red-400 hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDeleteConfirmId(img.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete photo</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-size Image Viewer Modal */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none" aria-describedby={undefined}>
          <DialogTitle className="sr-only">View Book Photo</DialogTitle>
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setViewerOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation - Previous */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10 text-white hover:bg-white/20 h-10 w-10"
                onClick={() => navigateViewer('prev')}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            {/* Image */}
            {currentImage && (
              <img
                src={currentImage.url_large || currentImage.url}
                alt={currentImage.caption || 'Book photo'}
                className="max-h-[80vh] max-w-full object-contain"
              />
            )}

            {/* Navigation - Next */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10 text-white hover:bg-white/20 h-10 w-10"
                onClick={() => navigateViewer('next')}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                <span className="text-white/80 text-sm">
                  {viewerIndex + 1} / {images.length}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
