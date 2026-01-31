/**
 * Service for uploading images via the backend (which proxies to CDN).
 * The CDN API key is kept server-side only.
 */

const API_BASE = '/api';

/**
 * Uploads an image blob to the CDN via the backend proxy.
 * The backend processes (resize, WebP convert) and uploads to Bunny CDN.
 */
export const uploadImageToCDN = async (imageBlob: Blob, filename: string): Promise<string> => {
  // This is kept for backward compat with imageService.ts which calls it per-size.
  // But now we just return a data URL so processAndUploadImage can collect blobs,
  // or we upload directly. For the new flow, use uploadImageViaBackend instead.
  const formData = new FormData();
  formData.append('file', imageBlob, filename);
  formData.append('filename', filename.replace(/\.[^.]+$/, '')); // strip extension, backend adds .webp

  const res = await fetch(`${API_BASE}/images/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upload image: ${res.status} - ${errorText}`);
  }

  // The backend returns { large, medium, small } but this function is called per-size
  // from the old imageService flow. Return the medium URL as a sensible default.
  const data = await res.json();
  return data.medium;
};

/**
 * Uploads a single image blob to the backend, which processes it into 3 sizes
 * and uploads all to CDN. Returns { large, medium, small } URLs.
 */
export const uploadImageViaBackend = async (
  imageBlob: Blob,
  filename: string
): Promise<{ large: string; medium: string; small: string }> => {
  const formData = new FormData();
  formData.append('file', imageBlob, 'image.jpg');
  formData.append('filename', filename);

  const res = await fetch(`${API_BASE}/images/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upload image: ${res.status} - ${errorText}`);
  }

  return res.json();
};
