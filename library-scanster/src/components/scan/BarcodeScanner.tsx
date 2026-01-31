
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Scan, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { BarcodeScannerUI } from './BarcodeScannerUI';
import { 
  initQuaggaScanner, 
  stopQuaggaScanner, 
  validateDetection,
  checkVideoStream
} from './QuaggaScanner';
import { 
  getCameraErrorMessage,
  isCameraSupported
} from './CameraErrorHandler';

interface BarcodeScannerProps {
  onScanComplete?: (isbn: string) => void;
}

export const BarcodeScanner = ({ onScanComplete }: BarcodeScannerProps) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [lastDetection, setLastDetection] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Auto-start scanning when component mounts
  useEffect(() => {
    handleStartScanning();
    return () => {
      if (isScanning) {
        stopQuaggaScanner();
      }
    };
  }, []);

  useEffect(() => {
    if (isScanning) {
      handleStopScanning();
      setTimeout(() => {
        handleStartScanning();
      }, 500);
    }
  }, [isMobile]);

  const handleValidScan = (code: string) => {
    stopQuaggaScanner();
    setIsScanning(false);
    setIsCameraReady(false);
    
    toast({
      title: "ISBN Detected",
      description: `Detected ISBN: ${code}`,
    });
    
    if (onScanComplete) {
      onScanComplete(code);
    }
  };

  const handleCodeDetected = (code: string) => {
    console.log("Code detected:", code);
    setLastDetection(code);
    
    setScannedCodes(prev => {
      const newCodes = [...prev, code];
      if (newCodes.length > 5) return newCodes.slice(newCodes.length - 5);
      return newCodes;
    });
    
    if (validateDetection(code, scannedCodes)) {
      handleValidScan(code);
    }
  };

  const handleProcessed = (result: any) => {
    if (result && result.boxes) {
      const drawingCanvas = scannerRef.current?.querySelector('canvas.drawingBuffer') as HTMLCanvasElement | null;
      const ctx = drawingCanvas?.getContext('2d');
      
      if (ctx && result.boxes) {
        ctx.clearRect(0, 0, parseInt(drawingCanvas?.getAttribute('width') || '0'), 
                      parseInt(drawingCanvas?.getAttribute('height') || '0'));
        result.boxes.filter(box => box !== result.box).forEach(box => {
          ctx.strokeStyle = 'green';
          ctx.strokeRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
        });
      }

      if (result.box && ctx) {
        ctx.strokeStyle = 'red';
        ctx.strokeRect(result.box[0], result.box[1], 
                      result.box[2] - result.box[0], 
                      result.box[3] - result.box[1]);
      }
    }
  };

  const initScanner = () => {
    setErrorMessage(null);
    setShowRetry(false);

    if (!scannerRef.current) {
      setErrorMessage("Scanner container not found");
      setShowRetry(true);
      return;
    }

    console.log("Initializing scanner...");
    console.log("Scanner container:", scannerRef.current);
    console.log("Is mobile device:", isMobile);

    const targetElement = scannerRef.current;

    initQuaggaScanner({
      targetElement,
      isMobile,
      onDetected: handleCodeDetected,
      onProcessed: handleProcessed,
      onInitError: (error) => {
        setErrorMessage("Could not initialize the camera. Please check camera permissions and try again.");
        setIsScanning(false);
        setShowRetry(true);
        toast({
          title: "Camera Error",
          description: "Could not initialize the camera. Please try manual entry.",
          variant: "destructive",
        });
      },
      onInitSuccess: () => {
        setIsCameraReady(true);
        
        setTimeout(() => {
          const { isValid, errorMessage } = checkVideoStream(scannerRef.current);
          if (!isValid) {
            setErrorMessage(errorMessage);
            setShowRetry(true);
          }
        }, 1000);
      }
    });
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    setScannedCodes([]);
    setLastDetection('');
    setErrorMessage(null);
    
    if (!isCameraSupported()) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support camera access. Please try a different browser or use manual entry.",
        variant: "destructive",
      });
      setIsScanning(false);
      setErrorMessage("Your browser doesn't support camera access");
      setShowRetry(true);
      return;
    }

    const facingMode = "environment";
    const idealWidth = isMobile ? 720 : 1280;
    const idealHeight = isMobile ? 1280 : 720;

    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode,
        width: { ideal: idealWidth },
        height: { ideal: idealHeight }
      } 
    })
      .then(() => {
        console.log("Camera access granted");
        initScanner();
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        const errorMsg = getCameraErrorMessage(err);
        
        toast({
          title: "Camera Access Required",
          description: errorMsg,
          variant: "destructive",
        });
        
        setIsScanning(false);
        setErrorMessage(errorMsg);
        setShowRetry(true);
      });
  };

  const handleStopScanning = () => {
    if (isScanning) {
      stopQuaggaScanner();
      setIsScanning(false);
      setIsCameraReady(false);
    }
  };

  const handleRetry = () => {
    handleStopScanning();
    setTimeout(() => {
      handleStartScanning();
    }, 500);
  };

  return (
    <BarcodeScannerUI
      isScanning={isScanning}
      isCameraReady={isCameraReady}
      errorMessage={errorMessage}
      lastDetection={lastDetection}
      showRetry={showRetry}
      scannerRef={scannerRef}
      isMobile={isMobile}
      onStartScanning={handleStartScanning}
      onStopScanning={handleStopScanning}
      onRetry={handleRetry}
    />
  );
};
