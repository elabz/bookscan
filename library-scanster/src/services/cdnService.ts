
/**
 * Service for interacting with the CDN
 */

// Get environment variables with fallbacks
const CDN_STORAGE_ZONE_NAME = import.meta.env.VITE_CDN_STORAGE_ZONE_NAME || 'allmybooks';
const CDN_REGION = import.meta.env.VITE_CDN_REGION || 'ny';
const CDN_PATH = import.meta.env.VITE_CDN_PATH || 'covers';
const CDN_URL = import.meta.env.VITE_CDN_URL || 'cdn.allmybooks.com';
const CDN_API_KEY = import.meta.env.VITE_CDN_API_KEY || '';

/**
 * Uploads an image to the Bunny.net CDN
 */
export const uploadImageToCDN = async (imageBlob: Blob, filename: string): Promise<string> => {
  try {
    // Construct the upload URL with region
    const uploadUrl = `https://${CDN_REGION}.storage.bunnycdn.com/${CDN_STORAGE_ZONE_NAME}/${CDN_PATH}/${filename}`;
    
    // Upload the image to Bunny.net CDN
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': CDN_API_KEY,
        'Content-Type': 'application/octet-stream'
      },
      body: imageBlob
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload to CDN: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Construct and return the CDN URL for the uploaded image
    const cdnUrl = `https://${CDN_URL}/${CDN_PATH}/${filename}`;
    console.log(`Image uploaded successfully to CDN: ${cdnUrl}`);
    return cdnUrl;
  } catch (error) {
    console.error('Error uploading to CDN:', error);
    throw error;
  }
};
