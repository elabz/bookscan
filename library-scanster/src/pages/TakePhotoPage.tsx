import { useState, useCallback, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Crop, RotateCw, Loader2, Wand2, Undo2, RectangleVertical, RectangleHorizontal, Maximize } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CameraView } from '@/components/scan/CameraView';
import { uploadImageViaBackend } from '@/services/cdnService';
import { addBookImage } from '@/services/bookImageService';
import { fetchImageAsBlob, rotateImage } from '@/services/imageUtils';
import { detectAndCropBook, preloadModel } from '@/services/bookDetection';
import { useToast } from '@/components/ui/use-toast';
import Cropper, { Area } from 'react-easy-crop';

type CropMode = 'vertical' | 'horizontal' | 'free';

const TakePhotoPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [freeRotation, setFreeRotation] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState<CropMode>('vertical');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Undo stack — stores previous image states so user can revert detection/crop/rotate
  const [undoStack, setUndoStack] = useState<Array<{ url: string; blob: Blob }>>([]);

  const isbn = location.state?.isbn || '';
  const bookId = location.state?.bookId || '';
  const returnPath = location.state?.returnPath || '/books/add';
  const returnActiveTab = location.state?.activeTab;

  // Pre-load ML model while user is framing the photo
  useEffect(() => {
    preloadModel();
  }, []);

  const pushUndo = (url: string, blob: Blob) => {
    setUndoStack((prev) => [...prev, { url, blob }]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setCapturedImage(prev.url);
    setImageBlob(prev.blob);
  };

  const handlePhotoCapture = async (dataUrl: string) => {
    const blob = await fetchImageAsBlob(dataUrl);
    setCapturedImage(dataUrl);
    setImageBlob(blob);
    setUndoStack([]);
  };

  const handleDetectBook = async () => {
    if (!imageBlob || !capturedImage) return;
    setIsDetecting(true);
    try {
      // Save current state for undo
      pushUndo(capturedImage, imageBlob);

      const result = await detectAndCropBook(imageBlob);
      if (result) {
        setCapturedImage(result.url);
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
        // Detection failed — remove the undo entry we just pushed
        setUndoStack((s) => s.slice(0, -1));
        toast({
          title: 'No book detected',
          description: 'The model could not identify any objects. Try manual crop instead.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      // Detection errored — remove the undo entry
      setUndoStack((s) => s.slice(0, -1));
      toast({ title: 'Detection failed', description: String(err), variant: 'destructive' });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCancel = () => {
    navigate(returnPath, { state: { activeTab: returnActiveTab } });
  };

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const applyCrop = async () => {
    if (!capturedImage || !croppedAreaPixels || !imageBlob) return;
    try {
      // Save current state for undo
      pushUndo(capturedImage, imageBlob);

      const blob = await getCroppedImage(capturedImage, croppedAreaPixels, rotation);
      const url = URL.createObjectURL(blob);
      setCapturedImage(url);
      setImageBlob(blob);
      setIsCropping(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    } catch {
      toast({ title: 'Crop failed', variant: 'destructive' });
    }
  };

  const handleRotate90 = async () => {
    if (!imageBlob || !capturedImage) return;
    try {
      pushUndo(capturedImage, imageBlob);
      const rotated = await rotateImage(imageBlob, 90);
      const url = URL.createObjectURL(rotated);
      setCapturedImage(url);
      setImageBlob(rotated);
    } catch {
      toast({ title: 'Rotation failed', variant: 'destructive' });
    }
  };

  const applyFreeRotation = async () => {
    if (!imageBlob || !capturedImage || freeRotation === 0) {
      setIsRotating(false);
      setFreeRotation(0);
      return;
    }
    try {
      pushUndo(capturedImage, imageBlob);
      const img = new Image();
      img.src = capturedImage;
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; });

      const radians = (freeRotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));
      const newW = Math.round(img.width * cos + img.height * sin);
      const newH = Math.round(img.width * sin + img.height * cos);

      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(newW / 2, newH / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92);
      });
      setCapturedImage(URL.createObjectURL(blob));
      setImageBlob(blob);
    } catch {
      setUndoStack((s) => s.slice(0, -1));
      toast({ title: 'Rotation failed', variant: 'destructive' });
    }
    setIsRotating(false);
    setFreeRotation(0);
  };

  const handleSavePhoto = async () => {
    if (!imageBlob) return;

    setIsUploading(true);
    try {
      const filename = isbn || `cover-${Date.now()}`;
      const urls = await uploadImageViaBackend(imageBlob, filename);

      // Save to book_images table if we have a bookId
      if (bookId) {
        await addBookImage(bookId, {
          url: urls.medium,
          url_small: urls.small,
          url_large: urls.large,
          is_cover: true,
        });
      }

      navigate(returnPath, {
        state: {
          coverUrl: urls.medium,
          coverSmallUrl: urls.small,
          coverLargeUrl: urls.large,
          activeTab: returnActiveTab,
        },
      });

      toast({ title: 'Success', description: 'Photo saved successfully' });
    } catch (error) {
      console.error('Error processing camera image:', error);
      toast({
        title: 'Error',
        description: 'Failed to process photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const cropAspect = cropMode === 'vertical' ? 2 / 3 : cropMode === 'horizontal' ? 3 / 2 : undefined;
  const anyBusy = isUploading || isDetecting;

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={handleCancel} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Take Photo</h1>
        </div>

        {!capturedImage ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
            <CameraView onPhotoCapture={handlePhotoCapture} onCancel={handleCancel} />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-3">Review Photo</h2>

            {isCropping ? (
              <>
                <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden mb-3"
                  style={{ height: 'calc(100vh - 320px)', minHeight: '200px' }}
                >
                  <Cropper
                    image={capturedImage}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    {...(cropAspect ? { aspect: cropAspect } : {})}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={onCropComplete}
                    showGrid
                  />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-muted-foreground w-16">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-10 text-right">{zoom.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
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
              </>
            ) : (
              <>
                <div className="mb-3 relative flex justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-2">
                  {isDetecting && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                      <span className="ml-3 text-white font-medium">Detecting objects...</span>
                    </div>
                  )}
                  <img
                    src={capturedImage}
                    alt="Captured photo"
                    className="object-contain rounded-lg"
                    style={{
                      maxHeight: 'calc(100vh - 340px)',
                      minHeight: '150px',
                      transform: isRotating ? `rotate(${freeRotation}deg)` : undefined,
                      transition: isRotating ? 'transform 0.1s' : undefined,
                    }}
                  />
                </div>
                {isRotating && (
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-muted-foreground w-16">Rotate</span>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={0.5}
                      value={freeRotation}
                      onChange={(e) => setFreeRotation(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">{freeRotation}°</span>
                  </div>
                )}
              </>
            )}

            {/* Editing tools */}
            <div className="flex flex-wrap gap-2 mb-3">
              {isCropping ? (
                <>
                  <Button size="sm" onClick={applyCrop}>
                    Apply Crop
                  </Button>
                  <Button
                    size="sm"
                    variant={cropMode === 'vertical' ? 'default' : 'outline'}
                    onClick={() => setCropMode('vertical')}
                    title="Vertical book (2:3)"
                  >
                    <RectangleVertical className="mr-1 h-3 w-3" /> 2:3
                  </Button>
                  <Button
                    size="sm"
                    variant={cropMode === 'horizontal' ? 'default' : 'outline'}
                    onClick={() => setCropMode('horizontal')}
                    title="Horizontal book (3:2)"
                  >
                    <RectangleHorizontal className="mr-1 h-3 w-3" /> 3:2
                  </Button>
                  <Button
                    size="sm"
                    variant={cropMode === 'free' ? 'default' : 'outline'}
                    onClick={() => setCropMode('free')}
                    title="Free crop (any shape)"
                  >
                    <Maximize className="mr-1 h-3 w-3" /> Free
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setIsCropping(false); setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); }}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={handleDetectBook} disabled={anyBusy || isRotating}>
                    <Wand2 className="mr-1 h-3 w-3" />
                    {isDetecting ? 'Detecting...' : 'Detect Book'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsCropping(true)} disabled={anyBusy || isRotating}>
                    <Crop className="mr-1 h-3 w-3" /> Crop
                  </Button>
                  {isRotating ? (
                    <>
                      <Button size="sm" onClick={applyFreeRotation}>
                        Apply Rotation
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setIsRotating(false); setFreeRotation(0); }}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setIsRotating(true)} disabled={anyBusy}>
                        <RotateCw className="mr-1 h-3 w-3" /> Rotate
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleRotate90} disabled={anyBusy}>
                        90°
                      </Button>
                    </>
                  )}
                  {undoStack.length > 0 && !isRotating && (
                    <Button size="sm" variant="outline" onClick={handleUndo} disabled={anyBusy}>
                      <Undo2 className="mr-1 h-3 w-3" /> Undo
                    </Button>
                  )}
                </>
              )}
            </div>

            {!isCropping && (
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => { setCapturedImage(null); setImageBlob(null); setUndoStack([]); }} disabled={anyBusy}>
                  Retake Photo
                </Button>
                <Button onClick={handleSavePhoto} disabled={anyBusy}>
                  {isUploading ? (
                    'Saving...'
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Use Photo
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
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

  // Calculate bounding box of rotated image
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  // Draw rotated full image onto intermediate canvas
  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = bBoxWidth;
  rotCanvas.height = bBoxHeight;
  const rotCtx = rotCanvas.getContext('2d')!;
  rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  rotCtx.rotate(rotRad);
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // Crop from the rotated canvas
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
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      0.92
    );
  });
}

export default TakePhotoPage;
