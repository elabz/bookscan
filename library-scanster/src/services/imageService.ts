
import { fetchImageAsBlob, resizeImage } from './imageUtils';
import { uploadImageToCDN } from './cdnService';
import { getOpenLibraryCoverUrl } from './openLibraryService';

/**
 * Processes an image from a file input
 */
export const processImageFromFile = async (file: File, isbn?: string): Promise<{ small: string; medium: string; large: string }> => {
  try {
    // Create a blob URL for the uploaded file
    const blobUrl = URL.createObjectURL(file);
    return await processAndUploadImage(blobUrl, isbn);
  } catch (error) {
    console.error('Error processing image from file:', error);
    throw error;
  }
};

/**
 * Processes an image from a data URL (e.g., from camera capture)
 */
export const processImageFromDataURL = async (dataUrl: string, isbn?: string): Promise<{ small: string; medium: string; large: string }> => {
  try {
    return await processAndUploadImage(dataUrl, isbn);
  } catch (error) {
    console.error('Error processing image from data URL:', error);
    throw error;
  }
};

/**
 * Processes and uploads an image to the CDN
 */
export const processAndUploadImage = async (imageSource: string | File, isbn?: string): Promise<{ small: string; medium: string; large: string }> => {
  try {
    const imageBlob = await fetchImageAsBlob(imageSource);
    
    // Generate a filename based on ISBN or a random one
    const baseFilename = isbn || `cover-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Resize the image to different sizes
    const largeImageBlob = await resizeImage(imageBlob, 800);
    const mediumImageBlob = await resizeImage(imageBlob, 400);
    const smallImageBlob = await resizeImage(imageBlob, 200);
    
    // Upload the images to CDN
    const largeUrl = await uploadImageToCDN(largeImageBlob, `${baseFilename}-L.jpg`);
    const mediumUrl = await uploadImageToCDN(mediumImageBlob, `${baseFilename}-M.jpg`);
    const smallUrl = await uploadImageToCDN(smallImageBlob, `${baseFilename}-S.jpg`);
    
    return {
      large: largeUrl,
      medium: mediumUrl,
      small: smallUrl
    };
  } catch (error) {
    console.error('Error in processAndUploadImage:', error);
    throw error;
  }
};

// Re-export from other modules for backward compatibility
export { getOpenLibraryCoverUrl } from './openLibraryService';
