/**
 * Perspective correction for book photos using OpenCV.js (WASM).
 * Lazy-loads OpenCV on first use (~8MB WASM binary).
 */

let cvPromise: Promise<any> | null = null;

function loadOpenCV(): Promise<any> {
  if (cvPromise) return cvPromise;
  cvPromise = import('@techstark/opencv-js').then((mod) => mod.default ?? mod).catch((err) => {
    cvPromise = null;
    throw err;
  });
  return cvPromise;
}

function orderCorners(pts: number[][]): [number[], number[], number[], number[]] {
  // Order: top-left, top-right, bottom-right, bottom-left
  const sorted = [...pts].sort((a, b) => a[1] - b[1]); // sort by y
  const top = sorted.slice(0, 2).sort((a, b) => a[0] - b[0]);
  const bottom = sorted.slice(2, 4).sort((a, b) => a[0] - b[0]);
  return [top[0], top[1], bottom[1], bottom[0]];
}

function distance(a: number[], b: number[]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

/**
 * Attempt to detect a rectangular book outline and correct the perspective.
 * Returns the corrected image as a Blob, or null if no quadrilateral found.
 */
export async function correctPerspective(
  blob: Blob,
): Promise<{ blob: Blob; url: string } | null> {
  const cv = await loadOpenCV();

  // Load image into an HTMLImageElement
  const img = new Image();
  const imgUrl = URL.createObjectURL(blob);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imgUrl;
  });

  const origW = img.width;
  const origH = img.height;

  // Downscale for detection
  const maxDim = 800;
  const scale = Math.min(maxDim / origW, maxDim / origH, 1);
  const detectW = Math.round(origW * scale);
  const detectH = Math.round(origH * scale);

  // Draw downscaled image to canvas
  const detectCanvas = document.createElement('canvas');
  detectCanvas.width = detectW;
  detectCanvas.height = detectH;
  const dCtx = detectCanvas.getContext('2d')!;
  dCtx.drawImage(img, 0, 0, detectW, detectH);

  let srcMat: any = null;
  let gray: any = null;
  let blurred: any = null;
  let edges: any = null;
  let contours: any = null;
  let hierarchy: any = null;

  try {
    srcMat = cv.imread(detectCanvas);
    gray = new cv.Mat();
    cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);

    blurred = new cv.Mat();
    const ksize = new cv.Size(5, 5);
    cv.GaussianBlur(gray, blurred, ksize, 0);

    edges = new cv.Mat();
    cv.Canny(blurred, edges, 50, 150);

    // Dilate to close gaps
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    cv.dilate(edges, edges, kernel);
    kernel.delete();

    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Collect contours with their areas
    const contourData: { idx: number; area: number }[] = [];
    for (let i = 0; i < contours.size(); i++) {
      contourData.push({ idx: i, area: cv.contourArea(contours.get(i)) });
    }
    contourData.sort((a, b) => b.area - a.area);

    // Minimum area threshold: at least 10% of image area
    const minArea = detectW * detectH * 0.1;

    let foundCorners: number[][] | null = null;

    for (const { idx, area } of contourData.slice(0, 10)) {
      if (area < minArea) break;
      const contour = contours.get(idx);
      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);

      if (approx.rows === 4) {
        const pts: number[][] = [];
        for (let j = 0; j < 4; j++) {
          pts.push([approx.data32S[j * 2], approx.data32S[j * 2 + 1]]);
        }
        approx.delete();
        foundCorners = pts;
        break;
      }
      approx.delete();
    }

    if (!foundCorners) return null;

    // Scale corners back to original resolution
    const corners = foundCorners.map(([x, y]) => [x / scale, y / scale]);
    const [tl, tr, br, bl] = orderCorners(corners);

    // Compute output dimensions
    const widthTop = distance(tl, tr);
    const widthBottom = distance(bl, br);
    const outW = Math.round(Math.max(widthTop, widthBottom));

    const heightLeft = distance(tl, bl);
    const heightRight = distance(tr, br);
    const outH = Math.round(Math.max(heightLeft, heightRight));

    // Don't correct if the warp is too small (nearly rectangular already)
    // Check if max corner displacement is less than 2% of dimension
    const idealCorners = [[0, 0], [origW, 0], [origW, origH], [0, origH]];
    const ordered = [tl, tr, br, bl];
    let maxDisplacement = 0;
    for (let i = 0; i < 4; i++) {
      const d = distance(ordered[i], idealCorners[i]);
      const maxDimension = Math.max(origW, origH);
      maxDisplacement = Math.max(maxDisplacement, d / maxDimension);
    }
    if (maxDisplacement < 0.02) return null;

    // Draw full-resolution image to canvas for OpenCV
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = origW;
    fullCanvas.height = origH;
    const fCtx = fullCanvas.getContext('2d')!;
    fCtx.drawImage(img, 0, 0);

    const fullMat = cv.imread(fullCanvas);

    const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tl[0], tl[1], tr[0], tr[1], br[0], br[1], bl[0], bl[1],
    ]);
    const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0, outW, 0, outW, outH, 0, outH,
    ]);

    const M = cv.getPerspectiveTransform(srcPts, dstPts);
    const warped = new cv.Mat();
    const dsize = new cv.Size(outW, outH);
    cv.warpPerspective(fullMat, warped, M, dsize);

    // Write result to canvas
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    cv.imshow(outCanvas, warped);

    // Cleanup OpenCV mats
    fullMat.delete();
    srcPts.delete();
    dstPts.delete();
    M.delete();
    warped.delete();

    URL.revokeObjectURL(imgUrl);

    // Convert to blob
    const resultBlob = await new Promise<Blob>((resolve, reject) => {
      outCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        0.92,
      );
    });

    return { blob: resultBlob, url: URL.createObjectURL(resultBlob) };
  } finally {
    srcMat?.delete();
    gray?.delete();
    blurred?.delete();
    edges?.delete();
    contours?.delete();
    hierarchy?.delete();
  }
}
