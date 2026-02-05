import sharp from 'sharp';

const CDN_STORAGE_ZONE = process.env.CDN_STORAGE_ZONE_NAME || 'allmybooks';
const CDN_REGION = process.env.CDN_REGION || 'ny';
const CDN_URL = process.env.CDN_URL || 'cdn.allmybooks.com';
const CDN_API_KEY = process.env.CDN_API_KEY || '';

// CDN folder paths
export const CDN_PATHS = {
  covers: 'covers',           // OpenLibrary/default covers
  userCovers: 'user-covers',  // User-uploaded book photos
  avatars: 'avatars',         // User profile avatars
} as const;

export type CDNPath = typeof CDN_PATHS[keyof typeof CDN_PATHS];

/**
 * Upload a buffer to Bunny CDN and return the public URL.
 */
export const uploadBufferToCDN = async (
  buffer: Buffer,
  filename: string,
  path: CDNPath = CDN_PATHS.covers
): Promise<string> => {
  const uploadUrl = `https://${CDN_REGION}.storage.bunnycdn.com/${CDN_STORAGE_ZONE}/${path}/${filename}`;

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: CDN_API_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`CDN upload failed for ${filename}: ${uploadRes.status} - ${errText}`);
  }

  return `https://${CDN_URL}/${path}/${filename}`;
};

/**
 * Delete a file from Bunny CDN by its public URL.
 */
export const deleteFromCDN = async (publicUrl: string): Promise<boolean> => {
  try {
    // Extract path from URL: https://cdn.allmybooks.com/user-covers/filename.webp
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/').filter(Boolean); // ['user-covers', 'filename.webp']
    if (pathParts.length < 2) {
      console.error('Invalid CDN URL format:', publicUrl);
      return false;
    }

    const cdnPath = pathParts.slice(0, -1).join('/'); // 'user-covers' or 'covers'
    const filename = pathParts[pathParts.length - 1];

    const deleteUrl = `https://${CDN_REGION}.storage.bunnycdn.com/${CDN_STORAGE_ZONE}/${cdnPath}/${filename}`;

    const deleteRes = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        AccessKey: CDN_API_KEY,
      },
    });

    if (!deleteRes.ok && deleteRes.status !== 404) {
      console.error(`CDN delete failed for ${publicUrl}: ${deleteRes.status}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error deleting from CDN:', err);
    return false;
  }
};

interface CoverUrls {
  cover_url: string;
  cover_small_url: string;
  cover_large_url: string;
}

/**
 * Download image from URL, strip metadata, convert to WebP, upload 3 sizes to Bunny CDN.
 * Returns CDN URLs for small/medium/large.
 * Uses 'covers' path for OpenLibrary/default covers.
 */
export const processAndUploadCover = async (
  sourceUrl: string,
  isbn?: string
): Promise<CoverUrls> => {
  // Download the original image
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${sourceUrl}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  const baseName = isbn || `cover-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Process 3 sizes: large (800), medium (400), small (200)
  const sizes = [
    { suffix: 'L', width: 800 },
    { suffix: 'M', width: 400 },
    { suffix: 'S', width: 200 },
  ] as const;

  const urls: string[] = [];

  for (const { suffix, width } of sizes) {
    const webpBuffer = await sharp(buffer)
      .resize(width, undefined, { withoutEnlargement: true })
      .removeAlpha()
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `${baseName}-${suffix}.webp`;
    urls.push(await uploadBufferToCDN(webpBuffer, filename, CDN_PATHS.covers));
  }

  return {
    cover_large_url: urls[0],
    cover_url: urls[1],
    cover_small_url: urls[2],
  };
};

/**
 * Process and upload an avatar image. Only creates small size (200px).
 */
export const processAndUploadAvatar = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  const webpBuffer = await sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .removeAlpha()
    .webp({ quality: 85 })
    .toBuffer();

  const avatarFilename = `${filename}.webp`;
  return uploadBufferToCDN(webpBuffer, avatarFilename, CDN_PATHS.avatars);
};
