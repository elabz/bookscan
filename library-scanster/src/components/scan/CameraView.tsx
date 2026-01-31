
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 1280 : 720 }
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
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame onto the canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg');
      onPhotoCapture(dataUrl);
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleRetry = () => {
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Re-initialize camera
    initializeCamera();
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <div className="aspect-video relative">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Camera interface overlay */}
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
        
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {/* Scanner guide */}
          <div className={`
            absolute z-10 border-2 border-primary/50 border-dashed rounded-md animate-pulse
            ${isMobile ? 'inset-x-[15%] inset-y-[30%]' : 'inset-x-[30%] inset-y-[15%]'}
          `}></div>
        </div>
      </div>
      
      <div className="p-4 bg-card">
        <div className="flex justify-between">
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
