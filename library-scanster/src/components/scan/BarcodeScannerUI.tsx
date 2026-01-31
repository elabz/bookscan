
import React, { MutableRefObject } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface BarcodeScannerUIProps {
  isScanning: boolean;
  isCameraReady: boolean;
  errorMessage: string | null;
  lastDetection: string;
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
  showRetry,
  scannerRef,
  isMobile,
  onStopScanning,
  onRetry
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h2 className="text-xl font-medium mb-4">Barcode Scanner</h2>
      <p className="text-muted-foreground mb-6">
        Position the barcode within the camera view to scan automatically.
      </p>
      
      <div 
        className="relative w-full mx-auto rounded-lg overflow-hidden"
        style={{ 
          aspectRatio: isMobile ? '3/4' : '4/3',
          maxWidth: '100%',
          minHeight: "300px",
          background: '#f0f0f0', 
        }}
        ref={scannerRef}
      >
        {isScanning && (
          <div className="absolute inset-0 z-10">
            {!isCameraReady && !errorMessage && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="absolute mt-20 text-white font-medium">Initializing camera...</p>
              </div>
            )}
            
            {errorMessage && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 p-4">
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
            
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className={`
                absolute z-10 border-2 border-primary/50 border-dashed rounded-md animate-pulse
                ${isMobile ? 'inset-x-[15%] inset-y-[30%]' : 'inset-x-[30%] inset-y-[15%]'}
              `}></div>
            </div>
            
            {lastDetection && (
              <div className="absolute bottom-4 left-0 right-0 mx-auto bg-black/70 text-white py-2 px-4 rounded-md max-w-xs text-center">
                <p className="truncate text-sm">{lastDetection}</p>
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
