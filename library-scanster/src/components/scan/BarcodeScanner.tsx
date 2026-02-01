
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
  const [lastDetection, setLastDetection] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // scanProgress: 0 = nothing seen, 1 = barcode region located, 2+ = partial consensus reads
  const [scanProgress, setScanProgress] = useState(0);
  const isMobile = useIsMobile();

  // Use a ref for scannedCodes so the Quagga callback always sees the latest value
  const scannedCodesRef = useRef<string[]>([]);
  const hasSubmittedRef = useRef(false);
  // Track when we last saw barcode-like regions (for the activity indicator)
  const lastBoxTimeRef = useRef(0);

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

  const handleValidScan = (rawCode: string) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    stopQuaggaScanner();
    setIsScanning(false);
    setIsCameraReady(false);

    // Pass the raw scanned code to the search handler as-is.
    // The ISBN service handles UPC→ISBN conversion, and passing the raw code
    // ensures BookNotFoundMessage can correctly identify UPC barcodes and
    // prompt the user to type in the ISBN manually.
    console.log(`Scan result: ${rawCode}`);

    toast({
      title: "Barcode Detected",
      description: `Code: ${rawCode}`,
    });

    if (onScanComplete) {
      onScanComplete(rawCode);
    }
  };

  const handleCodeDetected = (code: string) => {
    if (hasSubmittedRef.current) return;

    console.log("Code detected:", code);
    setLastDetection(code);

    // Update ref directly so validateDetection always sees latest
    const codes = scannedCodesRef.current;
    codes.push(code);
    if (codes.length > 20) codes.splice(0, codes.length - 20);

    // Report consensus progress: how many times the leading candidate has been seen
    const freq: Record<string, number> = {};
    for (const c of codes) freq[c] = (freq[c] || 0) + 1;
    const bestCount = Math.max(...Object.values(freq));
    // Progress: 2 = first read, 3 = getting close (consensus needs 3)
    setScanProgress(Math.min(bestCount + 1, 3));

    if (validateDetection(code, codes)) {
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

      // Barcode-like region detected — show activity even before a full decode
      if (result.boxes.length > 0 || result.box) {
        lastBoxTimeRef.current = Date.now();
        setScanProgress(prev => Math.max(prev, 1));
      }
    }

    // Decay progress if nothing seen for a while
    if (Date.now() - lastBoxTimeRef.current > 1500 && scannedCodesRef.current.length === 0) {
      setScanProgress(0);
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
    scannedCodesRef.current = [];
    hasSubmittedRef.current = false;
    setLastDetection('');
    setErrorMessage(null);
    setScanProgress(0);

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
      scanProgress={scanProgress}
      showRetry={showRetry}
      scannerRef={scannerRef}
      isMobile={isMobile}
      onStartScanning={handleStartScanning}
      onStopScanning={handleStopScanning}
      onRetry={handleRetry}
    />
  );
};
