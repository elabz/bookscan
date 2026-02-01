import { useState, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { uploadImageViaBackend } from '@/services/cdnService';
import { rotateImage } from '@/services/imageUtils';
import { detectAndCropBook } from '@/services/bookDetection';
import { correctPerspective } from '@/services/perspectiveCorrection';
import { addBookImage } from '@/services/bookImageService';
import { BookImage } from '@/types/book';
import { RotateCw, RotateCcw, Crop, Upload, Sparkles, Wand2, Image as ImageIcon, Loader2, RectangleVertical, RectangleHorizontal, FlipVertical2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CropOrientation = 'vertical' | 'horizontal';

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
  const [rotation, setRotation] = useState(0);
  const [cropOrientation, setCropOrientation] = useState<CropOrientation>('vertical');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isStraightening, setIsStraightening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const setImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setImageUrl(url);
    setImageBlob(blob);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setIsCropping(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    // Auto perspective correction
    setIsStraightening(true);
    try {
      const result = await correctPerspective(file);
      if (result) {
        setImageUrl(result.url);
        setImageBlob(result.blob);
        toast({ title: 'Perspective corrected' });
      }
    } catch {
      // Silent failure
    } finally {
      setIsStraightening(false);
    }
  };

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const applyCrop = async () => {
    if (!imageUrl || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImage(imageUrl, croppedAreaPixels, rotation);
      setImage(blob);
      setIsCropping(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    } catch {
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
      setImage(rotated);
    } catch {
      toast({ title: 'Rotation failed', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDetectBook = async () => {
    if (!imageBlob) return;
    setIsDetecting(true);
    try {
      const result = await detectAndCropBook(imageBlob);
      if (result) {
        setImageUrl(result.url);
        setImageBlob(result.blob);
        const detected = result.usedDetection;
        const others = result.allDetections
          .filter((d) => d !== detected)
          .map((d) => `${d.class} (${Math.round(d.score * 100)}%)`)
          .join(', ');
        toast({
          title: `Detected: ${detected.class} (${Math.round(detected.score * 100)}%)`,
          description: others ? `Also seen: ${others}` : 'Auto-cropped to detected area',
        });
      } else {
        toast({
          title: 'No book detected',
          description: 'The model could not identify any objects. Try manual crop instead.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({ title: 'Detection failed', description: String(err), variant: 'destructive' });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleStraighten = async () => {
    if (!imageBlob) return;
    setIsStraightening(true);
    try {
      const result = await correctPerspective(imageBlob);
      if (result) {
        setImageUrl(result.url);
        setImageBlob(result.blob);
        toast({ title: 'Perspective corrected' });
      } else {
        toast({ title: 'No rectangle detected', description: 'Could not find a book outline to straighten.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Straighten failed', variant: 'destructive' });
    } finally {
      setIsStraightening(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!imageBlob) return;
    setIsRemovingBg(true);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const result = await removeBackground(imageBlob);
      setImage(result);
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
      const urls = await uploadImageViaBackend(imageBlob, filename);

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
      console.error('Upload error:', err);
      toast({ title: 'Upload failed', description: 'Please try again', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const cropAspect = cropOrientation === 'vertical' ? 2 / 3 : 3 / 2;
  const anyBusy = isProcessing || isDetecting || isRemovingBg || isStraightening;

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
          <div className="relative h-72 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
            {isCropping ? (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={cropAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                showGrid
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img src={imageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
            )}
            {(isDetecting || isStraightening) && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-3 text-white font-medium">
                  {isStraightening ? 'Straightening...' : 'Detecting objects...'}
                </span>
              </div>
            )}
          </div>

          {/* Rotation slider when cropping */}
          {isCropping && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-16">Rotate</span>
              <input
                type="range"
                min={-45}
                max={45}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-10 text-right">{rotation}°</span>
            </div>
          )}

          {/* Tools */}
          <div className="flex flex-wrap gap-2">
            {isCropping ? (
              <>
                <Button size="sm" onClick={applyCrop} disabled={isProcessing}>
                  Apply Crop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCropOrientation(o => o === 'vertical' ? 'horizontal' : 'vertical')}
                  title={cropOrientation === 'vertical' ? 'Switch to horizontal' : 'Switch to vertical'}
                >
                  {cropOrientation === 'vertical' ? (
                    <><RectangleHorizontal className="mr-1 h-3 w-3" /> Horizontal</>
                  ) : (
                    <><RectangleVertical className="mr-1 h-3 w-3" /> Vertical</>
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setIsCropping(false); setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); }}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={handleDetectBook} disabled={anyBusy}>
                  <Wand2 className="mr-1 h-3 w-3" />
                  {isDetecting ? 'Detecting...' : 'Detect Book'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsCropping(true)} disabled={anyBusy}>
                  <Crop className="mr-1 h-3 w-3" /> Crop
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRotate(90)} disabled={anyBusy}>
                  <RotateCw className="mr-1 h-3 w-3" /> Rotate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRotate(-90)} disabled={anyBusy}>
                  <RotateCcw className="mr-1 h-3 w-3" /> Rotate Left
                </Button>
                <Button size="sm" variant="outline" onClick={handleStraighten} disabled={anyBusy}>
                  <FlipVertical2 className="mr-1 h-3 w-3" />
                  {isStraightening ? 'Straightening...' : 'Straighten'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleRemoveBackground} disabled={anyBusy}>
                  <Sparkles className="mr-1 h-3 w-3" />
                  {isRemovingBg ? 'Removing...' : 'Remove BG'}
                </Button>
              </>
            )}
          </div>

          {/* Upload actions */}
          {!isCropping && (
            <div className="flex gap-2">
              <Button onClick={() => handleUpload(false)} disabled={anyBusy}>
                <Upload className="mr-2 h-4 w-4" />
                {isProcessing ? 'Uploading...' : 'Add Photo'}
              </Button>
              <Button variant="secondary" onClick={() => handleUpload(true)} disabled={anyBusy}>
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

// Helper: crop image with rotation using canvas
async function getCroppedImage(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  const rotRad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = bBoxWidth;
  rotCanvas.height = bBoxHeight;
  const rotCtx = rotCanvas.getContext('2d')!;
  rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  rotCtx.rotate(rotRad);
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    rotCanvas,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.92);
  });
}
