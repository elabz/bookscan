
import Quagga from 'quagga';
import { isValidIsbn } from '@/utils/isbnUtils';

interface QuaggaInitOptions {
  targetElement: HTMLDivElement;
  isMobile?: boolean;
  onDetected: (code: string) => void;
  onProcessed: (result: any) => void;
  onInitError: (error: any) => void;
  onInitSuccess: () => void;
}

export const initQuaggaScanner = ({
  targetElement,
  isMobile = false,
  onDetected,
  onProcessed,
  onInitError,
  onInitSuccess
}: QuaggaInitOptions): void => {
  try {
    // Configure based on orientation/device type
    const width = isMobile ? { min: 360, ideal: 720, max: 1280 } : { min: 640, ideal: 1280, max: 1920 };
    const height = isMobile ? { min: 640, ideal: 1280, max: 1920 } : { min: 480, ideal: 720, max: 1080 };
    
    console.log(`Initializing Quagga with resolution: ${JSON.stringify({ width, height })}, isMobile: ${isMobile}`);

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: targetElement,
          constraints: {
            width,
            height,
            facingMode: "environment",
          },
          area: null, // Remove area restriction to fix field of view issues
          singleChannel: false 
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader",
            "code_39_reader",
            "code_128_reader"
          ],
          multiple: false
        },
        locate: true
      },
      (err: any) => {
        if (err) {
          console.error("Error initializing Quagga:", err);
          onInitError(err);
          return;
        }

        console.log("Quagga initialized successfully");
        onInitSuccess();
        Quagga.start();

        Quagga.onDetected((result) => {
          const code = result.codeResult.code;
          if (!code) return;
          
          console.log("Detected code:", code);
          onDetected(code);
        });

        Quagga.onProcessed((result) => {
          onProcessed(result);
        });
      }
    );
  } catch (error) {
    console.error("Error in Quagga initialization:", error);
    onInitError(error);
  }
};

export const stopQuaggaScanner = (): void => {
  Quagga.stop();
};

export const validateDetection = (
  code: string, 
  scannedCodes: string[]
): boolean => {
  // Check if the code is a valid ISBN
  if (code && code.length >= 10 && code.length <= 13) {
    // Try the direct validation first
    if (isValidIsbn(code)) {
      return true;
    }
    
    // Handle common scanning errors like missing leading zeros
    if (code.length === 12 && code.startsWith('978')) {
      // Try to fix a 12-digit code by adding a zero at the end (common ISBN-13 error)
      const fixedCode = code + '0';
      if (isValidIsbn(fixedCode)) {
        return true;
      }
    }
    
    // Add other specific scanning error corrections as needed
  }
  return false;
};

export const checkVideoStream = (
  targetElement: HTMLDivElement | null
): { isValid: boolean; errorMessage: string | null } => {
  if (!targetElement) {
    return { isValid: false, errorMessage: "Scanner container not found" };
  }

  const videoElement = targetElement.querySelector('video');
  if (!videoElement) {
    return { isValid: false, errorMessage: "Video element not found after initialization" };
  }

  if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return { isValid: false, errorMessage: "Camera stream not displaying properly. Please try again." };
  }

  return { isValid: true, errorMessage: null };
};
