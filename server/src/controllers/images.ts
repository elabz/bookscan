import { Request, Response } from 'express';
import { pool } from '../config/db';
import { processAndUploadCover, uploadBufferToCDN, processAndUploadAvatar, CDN_PATHS } from '../services/imageProcessor';
import sharp from 'sharp';

const ALLOWED_IMAGE_HOSTS = [
  'covers.openlibrary.org',
  'books.google.com',
  'images-na.ssl-images-amazon.com',
  'm.media-amazon.com',
  'cdn.allmybooks.com',
];

const sanitizeFilename = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);

/**
 * POST /images/process-cover
 * Body: { sourceUrl: string, isbn?: string, bookId?: string }
 * Downloads image, strips meta, converts to WebP, uploads to CDN.
 * If bookId provided, updates the book record with new URLs.
 */
export const processCover = async (req: Request, res: Response) => {
  try {
    const { sourceUrl, isbn, bookId } = req.body;

    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return res.status(400).json({ error: 'sourceUrl is required' });
    }

    // Validate source URL to prevent SSRF
    try {
      const parsed = new URL(sourceUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'Invalid URL protocol' });
      }
      if (!ALLOWED_IMAGE_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host))) {
        return res.status(400).json({ error: 'Image source not allowed' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const urls = await processAndUploadCover(sourceUrl, isbn);

    // Update the book record if bookId provided
    if (bookId) {
      await pool.query(
        `UPDATE books SET cover_url = $1, cover_small_url = $2, cover_large_url = $3, updated_at = NOW() WHERE id = $4`,
        [urls.cover_url, urls.cover_small_url, urls.cover_large_url, bookId]
      );
    }

    return res.json(urls);
  } catch (err) {
    console.error('Error processing cover:', err);
    return res.status(500).json({ error: 'Failed to process cover image' });
  }
};

/**
 * POST /images/upload
 * Accepts a multipart file upload, processes to 3 sizes (WebP), uploads to Bunny CDN.
 * Body (multipart): file, filename (optional), type (optional: 'cover' | 'avatar')
 * Returns { large, medium, small } CDN URLs (or just { url } for avatars).
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const rawName = (req.body.filename as string) || '';
    const baseName = rawName ? sanitizeFilename(rawName) : `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const uploadType = (req.body.type as string) || 'cover';
    const buffer = file.buffer;

    // Avatar uploads - single small size only
    if (uploadType === 'avatar') {
      const url = await processAndUploadAvatar(buffer, baseName);
      return res.json({ url });
    }

    // Book cover uploads - 3 sizes, use user-covers path
    const sizes = [
      { suffix: 'L', width: 800 },
      { suffix: 'M', width: 400 },
      { suffix: 'S', width: 200 },
    ] as const;

    const urls: Record<string, string> = {};

    for (const { suffix, width } of sizes) {
      const webpBuffer = await sharp(buffer)
        .resize(width, undefined, { withoutEnlargement: true })
        .removeAlpha()
        .webp({ quality: 85 })
        .toBuffer();

      const filename = `${baseName}-${suffix}.webp`;
      urls[suffix] = await uploadBufferToCDN(webpBuffer, filename, CDN_PATHS.userCovers);
    }

    return res.json({
      large: urls['L'],
      medium: urls['M'],
      small: urls['S'],
    });
  } catch (err) {
    console.error('Error uploading image:', err);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
};

/**
 * POST /images/migrate-covers
 * Finds all books with external cover URLs and migrates them to CDN.
 */
export const migrateCovers = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, isbn, cover_url FROM books
       WHERE cover_url IS NOT NULL
         AND cover_url NOT LIKE $1`,
      [`https://${process.env.CDN_URL || 'cdn.allmybooks.com'}%`]
    );

    const results: { id: string; status: string; urls?: any; error?: string }[] = [];

    for (const book of result.rows) {
      try {
        const urls = await processAndUploadCover(book.cover_url, book.isbn);
        await pool.query(
          `UPDATE books SET cover_url = $1, cover_small_url = $2, cover_large_url = $3, updated_at = NOW() WHERE id = $4`,
          [urls.cover_url, urls.cover_small_url, urls.cover_large_url, book.id]
        );
        results.push({ id: book.id, status: 'ok', urls });
      } catch (err: any) {
        results.push({ id: book.id, status: 'error', error: err.message });
      }
    }

    return res.json({ migrated: results.length, results });
  } catch (err) {
    console.error('Error migrating covers:', err);
    return res.status(500).json({ error: 'Failed to migrate covers' });
  }
};
