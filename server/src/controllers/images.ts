import { Request, Response } from 'express';
import { pool } from '../config/db';
import { processAndUploadCover } from '../services/imageProcessor';

/**
 * POST /images/process-cover
 * Body: { sourceUrl: string, isbn?: string, bookId?: string }
 * Downloads image, strips meta, converts to WebP, uploads to CDN.
 * If bookId provided, updates the book record with new URLs.
 */
export const processCover = async (req: Request, res: Response) => {
  try {
    const { sourceUrl, isbn, bookId } = req.body;

    if (!sourceUrl) {
      return res.status(400).json({ error: 'sourceUrl is required' });
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
