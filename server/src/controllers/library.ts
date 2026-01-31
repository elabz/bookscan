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

// Update a book's details (owner only)
export const updateBook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id } = req.params;
    const updates = req.body;

    // Verify user owns this book
    const ownership = await pool.query(
      'SELECT 1 FROM user_books WHERE user_id = $1 AND book_id = $2',
      [userId, id]
    );
    if (ownership.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this book' });
    }

    // Build dynamic SET clause from allowed fields
    const allowedFields: Record<string, string> = {
      title: 'title',
      authors: 'authors',
      isbn: 'isbn',
      publisher: 'publisher',
      published_date: 'published_date',
      description: 'description',
      page_count: 'page_count',
      language: 'language',
      edition: 'edition',
      width: 'width',
      height: 'height',
      cover_url: 'cover_url',
      cover_small_url: 'cover_small_url',
      cover_large_url: 'cover_large_url',
    };

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, column] of Object.entries(allowedFields)) {
      if (key in updates) {
        let val = updates[key];
        // JSON-stringify arrays/objects for jsonb/array columns
        if (key === 'authors' && Array.isArray(val)) {
          val = JSON.stringify(val);
        }
        setClauses.push(`${column} = $${paramIndex}`);
        values.push(val ?? null);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE books SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating book:', err);
    return res.status(500).json({ error: 'Failed to update book' });
  }
};

// Update a book's location in user's library
export const updateBookLocation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id } = req.params;
    const { location_id } = req.body;

    const result = await pool.query(
      'UPDATE user_books SET location_id = $1 WHERE user_id = $2 AND book_id = $3 RETURNING *',
      [location_id || null, userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not in your library' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating book location:', err);
    return res.status(500).json({ error: 'Failed to update location' });
  }
};

// Get images for a book
export const getBookImages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM book_images WHERE book_id = $1 ORDER BY sort_order, created_at',
      [id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching book images:', err);
    return res.status(500).json({ error: 'Failed to fetch images' });
  }
};

// Add an image to a book
export const addBookImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id: bookId } = req.params;
    const { url, url_small, url_large, is_cover, sort_order, caption } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const result = await pool.query(
      `INSERT INTO book_images (book_id, user_id, url, url_small, url_large, is_cover, sort_order, caption)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [bookId, userId, url, url_small || null, url_large || null, is_cover || false, sort_order || 0, caption || null]
    );

    // If set as cover, update book's cover URLs and unset other covers
    if (is_cover) {
      await pool.query(
        'UPDATE book_images SET is_cover = false WHERE book_id = $1 AND id != $2',
        [bookId, result.rows[0].id]
      );
      await pool.query(
        'UPDATE books SET cover_url = $1, cover_small_url = $2, cover_large_url = $3, updated_at = NOW() WHERE id = $4',
        [url, url_small || url, url_large || url, bookId]
      );
    }

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding book image:', err);
    return res.status(500).json({ error: 'Failed to add image' });
  }
};

// Delete a book image
export const deleteBookImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id: bookId, imageId } = req.params;

    await pool.query(
      'DELETE FROM book_images WHERE id = $1 AND book_id = $2 AND user_id = $3',
      [imageId, bookId, userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting book image:', err);
    return res.status(500).json({ error: 'Failed to delete image' });
  }
};

// Set an image as the book's cover
export const setImageAsCover = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id: bookId, imageId } = req.params;

    // Get the image
    const imageResult = await pool.query(
      'SELECT * FROM book_images WHERE id = $1 AND book_id = $2 AND user_id = $3',
      [imageId, bookId, userId]
    );
    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = imageResult.rows[0];

    // Unset all covers for this book, set this one
    await pool.query('UPDATE book_images SET is_cover = false WHERE book_id = $1', [bookId]);
    await pool.query('UPDATE book_images SET is_cover = true WHERE id = $1', [imageId]);

    // Update book cover URLs
    await pool.query(
      'UPDATE books SET cover_url = $1, cover_small_url = $2, cover_large_url = $3, updated_at = NOW() WHERE id = $4',
      [image.url, image.url_small || image.url, image.url_large || image.url, bookId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Error setting cover:', err);
    return res.status(500).json({ error: 'Failed to set cover' });
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
