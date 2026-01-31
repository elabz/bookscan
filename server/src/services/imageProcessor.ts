import sharp from 'sharp';

const CDN_STORAGE_ZONE = process.env.CDN_STORAGE_ZONE_NAME || 'allmybooks';
const CDN_REGION = process.env.CDN_REGION || 'ny';
const CDN_PATH = process.env.CDN_PATH || 'covers';
const CDN_URL = process.env.CDN_URL || 'cdn.allmybooks.com';
const CDN_API_KEY = process.env.CDN_API_KEY || '';

/**
 * Upload a buffer to Bunny CDN and return the public URL.
 */
export const uploadBufferToCDN = async (buffer: Buffer, filename: string): Promise<string> => {
  const uploadUrl = `https://${CDN_REGION}.storage.bunnycdn.com/${CDN_STORAGE_ZONE}/${CDN_PATH}/${filename}`;

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

  return `https://${CDN_URL}/${CDN_PATH}/${filename}`;
};

interface CoverUrls {
  cover_url: string;
  cover_small_url: string;
  cover_large_url: string;
}

/**
 * Download image from URL, strip metadata, convert to WebP, upload 3 sizes to Bunny CDN.
 * Returns CDN URLs for small/medium/large.
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
    urls.push(await uploadBufferToCDN(webpBuffer, filename));
  }

  return {
    cover_large_url: urls[0],
    cover_url: urls[1],
    cover_small_url: urls[2],
  };
};
