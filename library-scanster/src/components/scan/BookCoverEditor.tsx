
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookIcon, Camera, Upload } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { processImageFromFile } from '@/services/imageService';
import { useNavigate, useLocation } from 'react-router-dom';

interface BookCoverEditorProps {
  isbn: string;
  bookId?: string;
  coverUrls: {
    coverUrl: string;
    coverSmallUrl: string;
    coverLargeUrl: string;
  };
  isUploading: boolean;
  onCoverChange: (coverUrls: {
    coverUrl: string;
    coverSmallUrl: string;
    coverLargeUrl: string;
  }) => void;
  setIsUploading: (isUploading: boolean) => void;
}

export const BookCoverEditor: React.FC<BookCoverEditorProps> = ({
  isbn,
  bookId,
  coverUrls,
  isUploading,
  onCoverChange,
  setIsUploading
}) => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { coverUrl } = coverUrls;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    setIsUploading(true);
    
    try {
      const processedImages = await processImageFromFile(file, isbn);
      onCoverChange({
        coverUrl: processedImages.medium,
        coverSmallUrl: processedImages.small,
        coverLargeUrl: processedImages.large,
      });
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = () => {
    navigate('/take-photo', {
      state: {
        isbn,
        bookId,
        returnPath: routerLocation.pathname,
      },
    });
  };

  return (
    <>
      <label className="block mb-2 text-sm font-medium">Book Cover</label>
      <div className="bg-muted rounded-lg overflow-hidden mb-2">
        <AspectRatio ratio={2/3}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Book cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <BookIcon className="h-12 w-12 opacity-50" />
            </div>
          )}
        </AspectRatio>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTakePhoto}
          disabled={isUploading}
          className="w-full"
        >
          <Camera className="mr-2 h-4 w-4" />
          Take Photo
        </Button>
        <div className="relative">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
        </div>
        {isUploading && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Uploading image...
          </p>
        )}
      </div>
    </>
  );
};
