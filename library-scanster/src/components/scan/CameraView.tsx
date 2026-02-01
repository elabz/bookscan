
import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraViewProps {
  onPhotoCapture: (dataUrl: string) => void;
  onCancel: () => void;
  isMobile?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onPhotoCapture,
  onCancel,
  isMobile = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewHeight, setViewHeight] = useState<number>(0);

  // Calculate available height: viewport minus top offset minus button bar
  // Also cap so it doesn't exceed available width (for landscape cameras)
  useEffect(() => {
    const calculate = () => {
      const top = containerRef.current?.getBoundingClientRect().top ?? 200;
      const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth;
      // Leave 70px for the button bar below the video
      const availableHeight = window.innerHeight - top - 70;
      // Don't let the camera view be taller than the container width
      const maxHeight = Math.min(availableHeight, containerWidth);
      setViewHeight(Math.max(200, maxHeight));
    };
    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, []);

  useEffect(() => {
    initializeCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      setErrorMessage(null);
      // Request max resolution — let the browser/device decide the best it can do
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 4096 },
          height: { ideal: 4096 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setErrorMessage('Could not access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Capture at full camera resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onPhotoCapture(dataUrl);

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleRetry = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    initializeCamera();
  };

  return (
    <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden flex flex-col">
      <div className="relative" style={{ height: viewHeight > 0 ? `${viewHeight}px` : '70vh' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
        <canvas ref={canvasRef} className="hidden" />

        {errorMessage && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 p-4">
            <div className="text-center">
              <p className="text-white mb-4">{errorMessage}</p>
              <Button onClick={handleRetry} variant="secondary">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Camera
              </Button>
            </div>
          </div>
        )}

        {!isCameraReady && !errorMessage && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="absolute mt-20 text-white font-medium">Initializing camera...</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-card flex-shrink-0">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={capturePhoto} disabled={!isCameraReady}>
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
        </div>
      </div>
    </div>
  );
};
