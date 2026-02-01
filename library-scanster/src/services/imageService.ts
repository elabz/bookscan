import { fetchImageAsBlob } from './imageUtils';
import { uploadImageViaBackend } from './cdnService';
import { getOpenLibraryCoverUrl } from './openLibraryService';

/**
 * Processes an image from a file input
 */
export const processImageFromFile = async (file: File, isbn?: string): Promise<{ small: string; medium: string; large: string }> => {
  const filename = isbn || `cover-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return uploadImageViaBackend(file, filename);
};

/**
 * Processes an image from a data URL (e.g., from camera capture)
 */
export const processImageFromDataURL = async (dataUrl: string, isbn?: string): Promise<{ small: string; medium: string; large: string }> => {
  const blob = await fetchImageAsBlob(dataUrl);
  const filename = isbn || `cover-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return uploadImageViaBackend(blob, filename);
};

/**
 * Processes and uploads an image to the CDN via the backend.
 * Accepts a URL, data URL, or File. The backend handles resizing and CDN upload.
 */
export const processAndUploadImage = async (imageSource: string | File, isbn?: string): Promise<{ small: string; medium: string; large: string }> => {
  const imageBlob = await fetchImageAsBlob(imageSource);
  const filename = isbn || `cover-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return uploadImageViaBackend(imageBlob, filename, { crop: 'cover' });
};

// Re-export from other modules for backward compatibility
export { getOpenLibraryCoverUrl } from './openLibraryService';
