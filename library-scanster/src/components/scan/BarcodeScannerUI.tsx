
import React, { MutableRefObject, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface BarcodeScannerUIProps {
  isScanning: boolean;
  isCameraReady: boolean;
  errorMessage: string | null;
  lastDetection: string;
  scanProgress: number;
  showRetry: boolean;
  scannerRef: MutableRefObject<HTMLDivElement | null>;
  isMobile: boolean;
  onStartScanning: () => void;
  onStopScanning: () => void;
  onRetry: () => void;
}

export const BarcodeScannerUI: React.FC<BarcodeScannerUIProps> = ({
  isScanning,
  isCameraReady,
  errorMessage,
  lastDetection,
  scanProgress,
  showRetry,
  scannerRef,
  isMobile,
  onStopScanning,
  onRetry
}) => {
  // Track the actual video aspect ratio so the container and guide match the camera
  const [videoAspect, setVideoAspect] = useState<number | null>(null);

  const updateVideoAspect = useCallback(() => {
    const video = scannerRef.current?.querySelector('video');
    if (video && video.videoWidth && video.videoHeight) {
      setVideoAspect(video.videoWidth / video.videoHeight);
    }
  }, [scannerRef]);

  useEffect(() => {
    if (!isScanning || !isCameraReady) {
      setVideoAspect(null);
      return;
    }

    // Poll until the video element reports its intrinsic dimensions
    const interval = setInterval(updateVideoAspect, 200);

    const observer = new ResizeObserver(updateVideoAspect);
    if (scannerRef.current) observer.observe(scannerRef.current);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [isScanning, isCameraReady, updateVideoAspect, scannerRef]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h2 className="text-xl font-medium mb-4">Barcode Scanner</h2>
      <p className="text-muted-foreground mb-6">
        Position the barcode within the camera view to scan automatically.
      </p>

      <div
        className="relative w-full mx-auto rounded-lg overflow-hidden"
        style={{
          aspectRatio: videoAspect ? String(videoAspect) : (isMobile ? '3/4' : '4/3'),
          maxWidth: '100%',
          background: '#f0f0f0',
        }}
        ref={scannerRef}
      >
        {isScanning && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {!isCameraReady && !errorMessage && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 pointer-events-auto">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="absolute mt-20 text-white font-medium">Initializing camera...</p>
              </div>
            )}

            {errorMessage && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 p-4 pointer-events-auto">
                <div className="text-center">
                  <p className="text-white mb-4">{errorMessage}</p>
                  {showRetry && (
                    <Button onClick={onRetry} variant="secondary">
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Guide overlay — centered in the container which now matches video aspect ratio */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div
                className={`border-2 border-dashed rounded-md transition-colors duration-300 ${
                  scanProgress >= 2
                    ? 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.4)]'
                    : scanProgress === 1
                      ? 'border-yellow-400/70'
                      : 'border-primary/50 animate-pulse'
                }`}
                style={{
                  width: isMobile ? '70%' : '40%',
                  height: isMobile ? '40%' : '70%',
                }}
              />
            </div>

            {/* Scan activity indicator */}
            {isCameraReady && !errorMessage && (
              <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center">
                <div className="bg-black/70 text-white py-2 px-4 rounded-full flex items-center gap-2 text-sm">
                  {scanProgress === 0 && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-white/60 animate-pulse" />
                      <span>Point camera at barcode</span>
                    </>
                  )}
                  {scanProgress === 1 && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                      <span>Barcode detected, hold steady...</span>
                    </>
                  )}
                  {scanProgress >= 2 && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      <span>Reading barcode...</span>
                      <div className="flex gap-0.5 ml-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className={`h-1.5 w-3 rounded-sm transition-colors duration-200 ${
                              i < scanProgress ? 'bg-green-400' : 'bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4 mt-6">
        {isScanning && (
          <Button
            onClick={onStopScanning}
            variant="outline"
            className="px-8"
          >
            <X className="mr-2 h-4 w-4" />
            Stop Scanning
          </Button>
        )}
      </div>
    </div>
  );
};
