/**
 * ML-based book detection using TensorFlow.js COCO-SSD model.
 *
 * Strategy: COCO-SSD provides bounding box proposals. We score each proposal
 * on visual properties that distinguish books from screens/TVs/other objects:
 *
 * 1. Class label: "book" gets a large bonus; "tv"/"laptop" get no bonus
 * 2. Brightness: books are lighter (white/cream pages, colorful covers); screens are dark
 * 3. Edge density: text on book covers creates high pixel variance; blank screens are uniform
 * 4. Aspect ratio: books are ~2:3 or ~3:2; TVs are ~16:9
 *
 * All signals are additive (not multiplicative) so one bad signal doesn't zero the score.
 */

export interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

export interface ScoredDetection extends Detection {
  finalScore: number;
  brightness: number;
  variance: number;
  aspectRatio: number;
}

export interface DetectionResult {
  blob: Blob;
  url: string;
  allDetections: Detection[];
  usedDetection: Detection;
}

let modelPromise: Promise<any> | null = null;
let modelReady = false;

async function loadModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      console.log('[bookDetection] Loading TF.js and COCO-SSD model...');
      const tf = await import('@tensorflow/tfjs');
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('[bookDetection] TF.js backend:', tf.getBackend());

      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      console.log('[bookDetection] Model loaded, warming up...');

      const dummy = tf.zeros([1, 300, 300, 3]) as any;
      try { await model.detect(dummy); } catch { /* ignore */ }
      dummy.dispose();

      modelReady = true;
      console.log('[bookDetection] Model ready');
      return model;
    })();
  }
  return modelPromise;
}

export function preloadModel(): void {
  loadModel().catch((err) => {
    console.error('[bookDetection] Failed to preload model:', err);
    modelPromise = null;
  });
}

export function isModelReady(): boolean {
  return modelReady;
}

/**
 * Analyze a region of the canvas for brightness and edge density.
 */
function analyzeRegion(
  canvas: HTMLCanvasElement,
  bx: number, by: number, bw: number, bh: number,
): { brightness: number; stdDev: number } {
  const sx = Math.max(0, Math.round(bx));
  const sy = Math.max(0, Math.round(by));
  const sw = Math.min(canvas.width - sx, Math.round(bw));
  const sh = Math.min(canvas.height - sy, Math.round(bh));

  if (sw < 4 || sh < 4) return { brightness: 128, stdDev: 30 };

  const sampleSize = 48;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const sCtx = sampleCanvas.getContext('2d')!;
  sCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sampleSize, sampleSize);
  const data = sCtx.getImageData(0, 0, sampleSize, sampleSize).data;

  let sum = 0;
  let sumSq = 0;
  const n = sampleSize * sampleSize;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;
    sumSq += lum * lum;
  }
  const brightness = sum / n;
  const variance = sumSq / n - brightness * brightness;
  const stdDev = Math.sqrt(Math.max(0, variance));

  return { brightness, stdDev };
}

/**
 * Score how "book-like" an aspect ratio is.
 * Books: ~0.67 (2:3 vertical) or ~1.5 (3:2 horizontal)
 * TVs: ~1.78 (16:9) or ~2.37 (21:9)
 * Returns 0..1
 */
function aspectBookScore(w: number, h: number): number {
  const aspect = w / h;
  const targets = [2 / 3, 3 / 4, 3 / 2, 4 / 3]; // common book ratios
  const bestDist = Math.min(...targets.map(t => Math.abs(aspect - t)));
  // 0 distance → 1.0; distance of 0.8+ → 0.0
  return Math.max(0, 1.0 - bestDist / 0.8);
}

/**
 * Score a detection candidate. Returns 0..100.
 * Uses additive scoring so no single bad signal can zero the result.
 */
function scoreCandidate(
  det: Detection,
  canvas: HTMLCanvasElement,
): ScoredDetection {
  const [bx, by, bw, bh] = det.bbox;
  const { brightness, stdDev } = analyzeRegion(canvas, bx, by, bw, bh);
  const aspect = bw / bh;

  let score = 0;

  // --- Class label (0-30 points) ---
  // "book" class is a strong signal; others get minimal or no class bonus
  if (det.class === 'book') {
    score += 30 * det.score; // up to 30 points
  }
  // Non-book classes get 0 class bonus — they compete purely on visual merit

  // --- Brightness (0-25 points) ---
  // Books are typically bright (white pages, colorful covers): brightness > 100 is good
  // Dark screens: brightness < 60 is bad
  // Scale: 0 brightness → 0 points; 140+ → 25 points
  score += 25 * Math.min(1.0, Math.max(0, brightness - 30) / 110);

  // --- Edge density / variance (0-25 points) ---
  // Text on covers creates high variance (stdDev > 40); uniform screens have low (< 15)
  // Scale: stdDev 0 → 0 points; 50+ → 25 points
  score += 25 * Math.min(1.0, Math.max(0, stdDev - 5) / 45);

  // --- Aspect ratio (0-15 points) ---
  score += 15 * aspectBookScore(bw, bh);

  // --- Size bonus (0-5 points) ---
  // Prefer larger detections (more likely to be the main subject)
  const areaRatio = (bw * bh) / (canvas.width * canvas.height);
  score += 5 * Math.min(1.0, areaRatio * 5); // 20%+ of image → full 5 points

  console.log(
    `[bookDetection] ${det.class}(conf=${det.score.toFixed(2)}): ` +
    `aspect=${aspect.toFixed(2)} brightness=${brightness.toFixed(0)} ` +
    `stdDev=${stdDev.toFixed(0)} area=${(areaRatio * 100).toFixed(0)}% → score=${score.toFixed(1)}/100`
  );

  return { ...det, finalScore: score, brightness, variance: stdDev, aspectRatio: aspect };
}

/**
 * Detects a book in the given image blob.
 * Scores all COCO-SSD detections on visual properties and picks the most book-like one.
 */
export async function detectAndCropBook(
  imageBlob: Blob
): Promise<DetectionResult | null> {
  const img = new Image();
  img.src = URL.createObjectURL(imageBlob);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  const model = await loadModel();

  // Resize for faster inference — always use canvas so we can analyze pixels
  const maxDim = 640;
  const scale = (img.width > maxDim || img.height > maxDim)
    ? maxDim / Math.max(img.width, img.height)
    : 1;

  const detectCanvas = document.createElement('canvas');
  detectCanvas.width = Math.round(img.width * scale);
  detectCanvas.height = Math.round(img.height * scale);
  detectCanvas.getContext('2d')!.drawImage(img, 0, 0, detectCanvas.width, detectCanvas.height);

  console.log('[bookDetection] Running detection...');
  const predictions: Detection[] = await model.detect(detectCanvas);
  console.log('[bookDetection] Raw predictions:', predictions.map((p) => `${p.class}:${p.score.toFixed(2)}`));

  if (predictions.length === 0) {
    URL.revokeObjectURL(img.src);
    return null;
  }

  // Score ALL detections — don't pre-filter by class
  // Any detected object region could be a book that COCO-SSD mislabeled
  const scored = predictions
    .filter((p) => p.score > 0.15) // minimum COCO-SSD confidence
    .map((det) => scoreCandidate(det, detectCanvas));

  scored.sort((a, b) => b.finalScore - a.finalScore);

  if (scored.length === 0 || scored[0].finalScore < 15) {
    console.log('[bookDetection] No candidate scored high enough');
    URL.revokeObjectURL(img.src);
    return null;
  }

  const best = scored[0];
  console.log(`[bookDetection] Winner: ${best.class} with score ${best.finalScore.toFixed(1)}`);

  // Scale bounding box back to original image dimensions
  let [x, y, width, height] = best.bbox;
  const scaleX = img.width / detectCanvas.width;
  const scaleY = img.height / detectCanvas.height;
  x *= scaleX;
  y *= scaleY;
  width *= scaleX;
  height *= scaleY;

  // Add 5% padding
  const padX = width * 0.05;
  const padY = height * 0.05;
  const cropX = Math.max(0, Math.round(x - padX));
  const cropY = Math.max(0, Math.round(y - padY));
  const cropW = Math.min(img.width - cropX, Math.round(width + padX * 2));
  const cropH = Math.min(img.height - cropY, Math.round(height + padY * 2));

  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;
  canvas.getContext('2d')!.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.92
    );
  });

  URL.revokeObjectURL(img.src);
  const url = URL.createObjectURL(blob);
  return { blob, url, allDetections: predictions, usedDetection: best };
}

/**
 * Run detection only (no cropping) to report what the model sees.
 */
export async function detectObjects(imageBlob: Blob): Promise<Detection[]> {
  const img = new Image();
  img.src = URL.createObjectURL(imageBlob);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  const model = await loadModel();

  const maxDim = 640;
  let detectTarget: HTMLCanvasElement | HTMLImageElement = img;
  if (img.width > maxDim || img.height > maxDim) {
    const scale = maxDim / Math.max(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    detectTarget = canvas;
  }

  const predictions: Detection[] = await model.detect(detectTarget);
  URL.revokeObjectURL(img.src);
  return predictions;
}
