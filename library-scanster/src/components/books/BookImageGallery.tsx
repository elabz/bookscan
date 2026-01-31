import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBookImages, deleteBookImage, setImageAsCover } from '@/services/bookImageService';
import { BookImage } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Trash2, Star, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BookImageEditor } from './BookImageEditor';
import { useState } from 'react';

interface BookImageGalleryProps {
  bookId: string;
  isbn?: string;
  isOwner: boolean;
}

export const BookImageGallery = ({ bookId, isbn, isOwner }: BookImageGalleryProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['bookImages', bookId],
    queryFn: () => getBookImages(bookId),
  });

  const handleDelete = async (imageId: string) => {
    try {
      await deleteBookImage(bookId, imageId);
      queryClient.invalidateQueries({ queryKey: ['bookImages', bookId] });
      toast({ title: 'Image deleted' });
    } catch (err) {
      toast({ title: 'Failed to delete image', variant: 'destructive' });
    }
  };

  const handleSetCover = async (imageId: string) => {
    try {
      await setImageAsCover(bookId, imageId);
      queryClient.invalidateQueries({ queryKey: ['bookImages', bookId] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
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
          {images.map((img: BookImage) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border">
              <img
                src={img.url_small || img.url}
                alt={img.caption || 'Book photo'}
                className="w-full aspect-[2/3] object-cover"
              />
              {img.is_cover && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                  Cover
                </div>
              )}
              {isOwner && (
                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!img.is_cover && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:text-yellow-400"
                      onClick={() => handleSetCover(img.id)}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:text-red-400 ml-auto"
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
