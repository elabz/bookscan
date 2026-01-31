import { Request, Response } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import { pool } from '../config/db';
import { processAndUploadCover } from '../services/imageProcessor';
import { indexBook } from '../services/searchService';

type AuthRequest = SessionRequest;

// Get featured books (public, no auth)
export const getFeaturedBooks = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM books ORDER BY created_at DESC LIMIT 12'
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching featured books:', err);
    return res.status(500).json({ error: 'Failed to fetch featured books' });
  }
};

// Get all books in user's library
export const getUserBooks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();

    const result = await pool.query(
      `SELECT b.* FROM books b
       INNER JOIN user_books ub ON b.id = ub.book_id
       WHERE ub.user_id = $1
       ORDER BY ub.added_at DESC`,
      [userId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user books:', err);
    return res.status(500).json({ error: 'Failed to fetch library' });
  }
};

// Search books in user's library
export const searchUserBooks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const result = await pool.query(
      `SELECT b.* FROM books b
       INNER JOIN user_books ub ON b.id = ub.book_id
       WHERE ub.user_id = $1
         AND (b.title ILIKE $2 OR b.isbn = $3)
       ORDER BY b.title ASC`,
      [userId, `%${query}%`, query]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Error searching user books:', err);
    return res.status(500).json({ error: 'Failed to search library' });
  }
};

// Get a single book by ID
export const getBookById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching book:', err);
    return res.status(500).json({ error: 'Failed to fetch book' });
  }
};

// Add a book to user's library
export const addBookToLibrary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const book = req.body;

    // Check if book exists by ISBN
    let bookId: string | null = null;

    if (book.isbn) {
      const normalizedIsbn = book.isbn.replace(/-/g, '');
      const existing = await pool.query(
        'SELECT id FROM books WHERE isbn = $1 OR isbn = $2 LIMIT 1',
        [book.isbn, normalizedIsbn]
      );
      if (existing.rows.length > 0) {
        bookId = existing.rows[0].id;
      }
    }

    if (!bookId && book.title && book.authors?.length > 0) {
      const existing = await pool.query(
        "SELECT id FROM books WHERE title = $1 AND authors @> $2::jsonb LIMIT 1",
        [book.title, JSON.stringify([book.authors[0]])]
      );
      if (existing.rows.length > 0) {
        bookId = existing.rows[0].id;
      }
    }

    // Insert book if it doesn't exist
    if (!bookId) {
      const id = book.id || Math.random().toString(36).substring(2, 9);
      const result = await pool.query(
        `INSERT INTO books (
          id, title, authors, isbn, cover_url, cover_small_url, cover_large_url,
          publisher, published_date, description, page_count, categories, language,
          edition, width, height, identifiers, classifications, links, weight,
          url, subjects, publish_places, excerpts, number_of_pages, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), NOW()
        ) RETURNING *`,
        [
          id, book.title, JSON.stringify(book.authors), book.isbn || null,
          book.cover_url || null, book.cover_small_url || null, book.cover_large_url || null,
          book.publisher || null, book.published_date || null, book.description || null,
          book.page_count || null, book.categories ? JSON.stringify(book.categories) : null,
          book.language || null, book.edition || null, book.width || null, book.height || null,
          book.identifiers ? JSON.stringify(book.identifiers) : null,
          book.classifications ? JSON.stringify(book.classifications) : null,
          book.links ? JSON.stringify(book.links) : null,
          book.weight || null, book.url || null,
          book.subjects ? JSON.stringify(book.subjects) : null,
          book.publish_places ? JSON.stringify(book.publish_places) : null,
          book.excerpts ? JSON.stringify(book.excerpts) : null,
          book.number_of_pages || null,
        ]
      );
      bookId = result.rows[0].id;

      // Process cover image in background (download, strip meta, convert to WebP, upload to CDN)
      const coverUrl = book.cover_url || book.cover;
      if (coverUrl && !coverUrl.includes(process.env.CDN_URL || 'cdn.allmybooks.com')) {
        processAndUploadCover(coverUrl, book.isbn || id)
          .then(async (urls) => {
            await pool.query(
              `UPDATE books SET cover_url = $1, cover_small_url = $2, cover_large_url = $3, updated_at = NOW() WHERE id = $4`,
              [urls.cover_url, urls.cover_small_url, urls.cover_large_url, id]
            );
            console.log(`Cover processed for book ${id}`);
          })
          .catch((err) => console.error(`Failed to process cover for book ${id}:`, err));
      }

      // Index into Elasticsearch
      indexBook(result.rows[0]).catch((err) =>
        console.error(`Failed to index book ${id}:`, err)
      );
    }

    // Add to user's library (ignore if already exists)
    await pool.query(
      'INSERT INTO user_books (user_id, book_id, added_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
      [userId, bookId]
    );

    // Return the complete book
    const bookResult = await pool.query('SELECT * FROM books WHERE id = $1', [bookId]);
    return res.json(bookResult.rows[0]);
  } catch (err) {
    console.error('Error adding book to library:', err);
    return res.status(500).json({ error: 'Failed to add book' });
  }
};

// Remove a book from user's library
export const removeBookFromLibrary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { bookId } = req.params;

    await pool.query(
      'DELETE FROM user_books WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Error removing book from library:', err);
    return res.status(500).json({ error: 'Failed to remove book' });
  }
};
