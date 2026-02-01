
import Quagga from 'quagga';
import { isValidIsbn, isValidUpc, isValidEan } from '@/utils/isbnUtils';

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
          area: null,
          singleChannel: false
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          // Only book-relevant readers — Code39/Code128 cause too many false positives
          readers: [
            "ean_reader",      // EAN-13 (includes ISBN-13)
            "ean_8_reader",    // EAN-8
            "upc_reader",      // UPC-A (12 digits)
            "upc_e_reader"     // UPC-E (compact UPC)
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

          // Check result confidence — Quagga provides error correction info
          // Filter out low-confidence results to reduce false positives
          const errors = result.codeResult.decodedCodes
            ?.filter((d: any) => d.error !== undefined)
            .map((d: any) => d.error) || [];
          const avgError = errors.length > 0
            ? errors.reduce((sum: number, e: number) => sum + e, 0) / errors.length
            : 1;

          if (avgError > 0.08) {
            console.log(`Low confidence scan rejected: ${code} (error: ${avgError.toFixed(3)})`);
            return;
          }

          console.log(`Detected code: ${code} (error: ${avgError.toFixed(3)}, format: ${result.codeResult.format})`);
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

/**
 * Validates a barcode detection. Requires the same code to be seen
 * at least MIN_CONSENSUS times in the recent scan history to reduce
 * false positives from single-frame misreads.
 */
const MIN_CONSENSUS = 3;

export const validateDetection = (
  code: string,
  scannedCodes: string[]
): boolean => {
  if (!code || code.length < 8 || code.length > 13) return false;

  // Check consensus: same code seen MIN_CONSENSUS times (including this detection)
  const count = scannedCodes.filter(c => c === code).length;
  const hasConsensus = count >= MIN_CONSENSUS - 1;

  if (!hasConsensus) return false;

  // Accept codes with valid checksums — the ISBN service handles UPC→book lookup

  // Valid ISBN-10 or ISBN-13 (978/979 prefix + valid checksum)
  if (isValidIsbn(code)) return true;

  // UPC reader may drop leading "9" from ISBN-13: 9780... → 780...
  if (code.length === 12 && (code.startsWith('78') || code.startsWith('79'))) {
    if (isValidIsbn('9' + code)) return true;
  }

  // Valid UPC-A with checksum — older books use retail UPC barcodes instead of Bookland EAN
  if (code.length === 12 && isValidUpc(code)) return true;

  // Valid EAN-13 with checksum — some books use non-978/979 EAN (e.g., UPC read as EAN with leading 0)
  if (code.length === 13 && isValidEan(code)) return true;

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
