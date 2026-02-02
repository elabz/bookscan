
import Quagga from '@ericblade/quagga2';
import { isValidIsbn, isValidUpc, isValidEan } from '@/utils/isbnUtils';

interface ScannerInitOptions {
  targetElement: HTMLDivElement;
  isMobile?: boolean;
  onDetected: (code: string) => void;
  onProcessed: (result: any) => void;
  onInitError: (error: any) => void;
  onInitSuccess: () => void;
  onRejected?: (code: string) => void;
}

// ---------- Native BarcodeDetector scanner ----------

let barcodeDetectorRAF: number | null = null;
let barcodeDetectorVideo: HTMLVideoElement | null = null;
let barcodeDetectorStream: MediaStream | null = null;

const supportsNativeBarcodeDetector = (): boolean =>
  'BarcodeDetector' in window;

const initNativeBarcodeScanner = async ({
  targetElement,
  isMobile = false,
  onDetected,
  onProcessed,
  onInitError,
  onInitSuccess,
  onRejected,
}: ScannerInitOptions): Promise<void> => {
  try {
    const BD = (window as any).BarcodeDetector;
    const detector = new BD({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
    });

    const width = isMobile ? 720 : 1280;
    const height = isMobile ? 1280 : 720;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: width },
        height: { ideal: height },
      },
    });
    barcodeDetectorStream = stream;

    // Create or reuse video element
    let video = targetElement.querySelector('video');
    if (!video) {
      video = document.createElement('video');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');
      video.setAttribute('playsinline', 'true');
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      targetElement.appendChild(video);
    }
    video.srcObject = stream;
    await video.play();
    barcodeDetectorVideo = video;

    console.log(`[BarcodeDetector] Initialized with video ${video.videoWidth}x${video.videoHeight}`);
    onInitSuccess();

    // Scan loop
    let scanning = true;
    const scanFrame = async () => {
      if (!scanning || !barcodeDetectorVideo) return;
      try {
        const barcodes = await detector.detect(barcodeDetectorVideo);
        // Signal that a frame was processed (for progress UI)
        onProcessed({ boxes: barcodes.map((b: any) => b.boundingBox), box: null });

        for (const barcode of barcodes) {
          const code = barcode.rawValue;
          if (!code) continue;
          console.log(`[BarcodeDetector] Detected: ${code} (format: ${barcode.format})`);
          onDetected(code);
        }
      } catch {
        // detect() can throw on some frames — ignore
      }
      if (scanning) {
        barcodeDetectorRAF = requestAnimationFrame(scanFrame);
      }
    };
    barcodeDetectorRAF = requestAnimationFrame(scanFrame);
  } catch (error) {
    console.error('[BarcodeDetector] Init error:', error);
    onInitError(error);
  }
};

const stopNativeBarcodeScanner = () => {
  if (barcodeDetectorRAF !== null) {
    cancelAnimationFrame(barcodeDetectorRAF);
    barcodeDetectorRAF = null;
  }
  if (barcodeDetectorStream) {
    barcodeDetectorStream.getTracks().forEach((t) => t.stop());
    barcodeDetectorStream = null;
  }
  barcodeDetectorVideo = null;
};

// ---------- Quagga2 fallback scanner ----------

const initQuaggaFallback = ({
  targetElement,
  isMobile = false,
  onDetected,
  onProcessed,
  onInitError,
  onInitSuccess,
  onRejected,
}: ScannerInitOptions): void => {
  try {
    const width = isMobile ? 720 : 1280;
    const height = isMobile ? 1280 : 720;

    console.log(`[QuaggaScanner] Fallback init: ${width}x${height}, isMobile: ${isMobile}`);

    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: targetElement,
          constraints: {
            width: { ideal: width },
            height: { ideal: height },
            facingMode: 'environment',
          },
          size: isMobile ? 800 : 1280,
        },
        locator: {
          patchSize: 'small',
          halfSample: true,
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: ['ean_reader', 'upc_reader'],
          multiple: false,
        },
        locate: true,
      },
      (err: any) => {
        if (err) {
          console.error('[QuaggaScanner] Error initializing Quagga:', err);
          onInitError(err);
          return;
        }

        console.log('[QuaggaScanner] Quagga initialized successfully');
        onInitSuccess();
        Quagga.start();

        Quagga.onDetected((result) => {
          const code = result.codeResult.code;
          if (!code) return;

          const errors =
            result.codeResult.decodedCodes
              ?.filter((d: any) => d.error !== undefined)
              .map((d: any) => d.error) || [];
          const avgError =
            errors.length > 0
              ? errors.reduce((sum: number, e: number) => sum + e, 0) / errors.length
              : 1;

          if (avgError > 0.1) {
            console.log(`Low confidence scan rejected: ${code} (error: ${avgError.toFixed(3)})`);
            onRejected?.(code);
            return;
          }

          console.log(
            `Detected code: ${code} (error: ${avgError.toFixed(3)}, format: ${result.codeResult.format})`
          );
          onDetected(code);
        });

        Quagga.onProcessed((result) => {
          onProcessed(result);
        });
      }
    );
  } catch (error) {
    console.error('Error in Quagga initialization:', error);
    onInitError(error);
  }
};

// ---------- Public API ----------

let usingNativeScanner = false;

export const initQuaggaScanner = (options: ScannerInitOptions): void => {
  if (supportsNativeBarcodeDetector()) {
    console.log('[Scanner] Using native BarcodeDetector API');
    usingNativeScanner = true;
    initNativeBarcodeScanner(options);
  } else {
    console.log('[Scanner] BarcodeDetector not available, using Quagga2 fallback');
    usingNativeScanner = false;
    initQuaggaFallback(options);
  }
};

export const stopQuaggaScanner = (): void => {
  if (usingNativeScanner) {
    stopNativeBarcodeScanner();
  } else {
    try {
      Quagga.stop();
    } catch {
      // Quagga.stop() can throw if not initialized
    }
  }
};

/**
 * Validates a barcode detection. Requires the same code to be seen
 * at least MIN_CONSENSUS times in the recent scan history to reduce
 * false positives from single-frame misreads.
 */
const MIN_CONSENSUS = 3;

export const validateDetection = (code: string, scannedCodes: string[]): boolean => {
  if (!code || code.length < 8 || code.length > 13) return false;

  // Check consensus: same code seen MIN_CONSENSUS times (including this detection)
  const count = scannedCodes.filter((c) => c === code).length;
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
    return { isValid: false, errorMessage: 'Scanner container not found' };
  }

  const videoElement = targetElement.querySelector('video');
  if (!videoElement) {
    return { isValid: false, errorMessage: 'Video element not found after initialization' };
  }

  if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return { isValid: false, errorMessage: 'Camera stream not displaying properly. Please try again.' };
  }

  return { isValid: true, errorMessage: null };
};
