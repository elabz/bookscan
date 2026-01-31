import { useState, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { processAndUploadImage } from '@/services/imageService';
import { fetchImageAsBlob, rotateImage } from '@/services/imageUtils';
import { addBookImage, setImageAsCover as setImageAsCoverApi } from '@/services/bookImageService';
import { BookImage } from '@/types/book';
import { RotateCw, RotateCcw, Crop, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookImageEditorProps {
  bookId: string;
  isbn?: string;
  onImageAdded: (image: BookImage) => void;
}

export const BookImageEditor = ({ bookId, isbn, onImageAdded }: BookImageEditorProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageBlob(file);
    setIsCropping(false);
  };

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const applyCrop = async () => {
    if (!imageUrl || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImage(imageUrl, croppedAreaPixels);
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setImageBlob(blob);
      setIsCropping(false);
    } catch (err) {
      toast({ title: 'Crop failed', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = async (degrees: 90 | -90) => {
    if (!imageBlob) return;
    setIsProcessing(true);
    try {
      const rotated = await rotateImage(imageBlob, degrees);
      const url = URL.createObjectURL(rotated);
      setImageUrl(url);
      setImageBlob(rotated);
    } catch (err) {
      toast({ title: 'Rotation failed', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!imageBlob) return;
    setIsRemovingBg(true);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const result = await removeBackground(imageBlob);
      const url = URL.createObjectURL(result);
      setImageUrl(url);
      setImageBlob(result);
      toast({ title: 'Background removed' });
    } catch (err) {
      console.error('Background removal error:', err);
      toast({ title: 'Background removal failed', description: 'The ML model may not have loaded correctly', variant: 'destructive' });
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleUpload = async (asCover: boolean = false) => {
    if (!imageBlob) return;
    setIsProcessing(true);
    try {
      const filename = isbn || `book-${bookId}-${Date.now()}`;
      const urls = await processAndUploadImage(imageBlob, filename);

      const image = await addBookImage(bookId, {
        url: urls.medium,
        url_small: urls.small,
        url_large: urls.large,
        is_cover: asCover,
      });

      onImageAdded(image);
      setImageUrl(null);
      setImageBlob(null);
      toast({ title: asCover ? 'Cover image set' : 'Image added' });
    } catch (err) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {!imageUrl ? (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Select Photo
          </Button>
        </div>
      ) : (
        <>
          {/* Image preview / cropper */}
          <div className="relative h-64 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
            {isCropping ? (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={2 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : (
              <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
            )}
          </div>

          {/* Tools */}
          <div className="flex flex-wrap gap-2">
            {isCropping ? (
              <>
                <Button size="sm" onClick={applyCrop} disabled={isProcessing}>
                  Apply Crop
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsCropping(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsCropping(true)}>
                  <Crop className="mr-1 h-3 w-3" /> Crop
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRotate(90)} disabled={isProcessing}>
                  <RotateCw className="mr-1 h-3 w-3" /> Rotate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRotate(-90)} disabled={isProcessing}>
                  <RotateCcw className="mr-1 h-3 w-3" /> Rotate Left
                </Button>
                <Button size="sm" variant="outline" onClick={handleRemoveBackground} disabled={isRemovingBg}>
                  <Sparkles className="mr-1 h-3 w-3" />
                  {isRemovingBg ? 'Removing...' : 'Remove BG'}
                </Button>
              </>
            )}
          </div>

          {/* Upload actions */}
          {!isCropping && (
            <div className="flex gap-2">
              <Button onClick={() => handleUpload(false)} disabled={isProcessing}>
                <Upload className="mr-2 h-4 w-4" />
                {isProcessing ? 'Uploading...' : 'Add Photo'}
              </Button>
              <Button variant="secondary" onClick={() => handleUpload(true)} disabled={isProcessing}>
                Set as Cover
              </Button>
              <Button variant="ghost" onClick={() => { setImageUrl(null); setImageBlob(null); }}>
                Discard
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Helper: crop image using canvas
async function getCroppedImage(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => { image.onload = resolve; });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.9);
  });
}
