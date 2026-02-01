import { Request, Response } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import { pool } from '../config/db';
import { processAndUploadCover } from '../services/imageProcessor';
import { indexBook } from '../services/searchService';

type AuthRequest = SessionRequest;

// Convert ISBN-10 to ISBN-13
const isbn10to13 = (isbn10: string): string | null => {
  if (isbn10.length !== 10) return null;
  const base = '978' + isbn10.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
};

// Convert ISBN-13 to ISBN-10
const isbn13to10 = (isbn13: string): string | null => {
  if (isbn13.length !== 13 || !isbn13.startsWith('978')) return null;
  const base = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(base[i]) * (10 - i);
  }
  const check = (11 - (sum % 11)) % 11;
  return base + (check === 10 ? 'X' : check.toString());
};

// Lookup a book by ISBN or UPC in local database
export const lookupBookByCode = async (req: SessionRequest, res: Response) => {
  try {
    const code = (req.query.code as string || '').replace(/[-\s]/g, '');
    if (!code) return res.status(400).json({ error: 'Missing code parameter' });

    // Build list of ISBN variants to search
    const isbnVariants = [code];
    if (code.length === 10) {
      const isbn13 = isbn10to13(code);
      if (isbn13) isbnVariants.push(isbn13);
    } else if (code.length === 13 && code.startsWith('978')) {
      const isbn10 = isbn13to10(code);
      if (isbn10) isbnVariants.push(isbn10);
    }

    // Search by ISBN (any variant)
    let result = await pool.query(
      "SELECT * FROM books WHERE isbn = ANY($1) LIMIT 1",
      [isbnVariants]
    );

    // Search identifiers JSONB for isbn_10, isbn_13
    if (result.rows.length === 0) {
      for (const variant of isbnVariants) {
        result = await pool.query(
          `SELECT * FROM books WHERE
            identifiers->'isbn_10' @> $1::jsonb OR
            identifiers->'isbn_13' @> $1::jsonb
          LIMIT 1`,
          [JSON.stringify([variant])]
        );
        if (result.rows.length > 0) break;
      }
    }

    // Search by UPC stored in identifiers JSONB
    if (result.rows.length === 0) {
      result = await pool.query(
        "SELECT * FROM books WHERE identifiers->'upc' @> $1::jsonb LIMIT 1",
        [JSON.stringify([code])]
      );
    }

    // Also try without leading zero (EAN reader adds implicit 0 to UPC)
    if (result.rows.length === 0 && code.length === 13 && code.startsWith('0')) {
      const upc12 = code.slice(1);
      result = await pool.query(
        "SELECT * FROM books WHERE identifiers->'upc' @> $1::jsonb LIMIT 1",
        [JSON.stringify([upc12])]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error looking up book by code:', err);
    return res.status(500).json({ error: 'Lookup failed' });
  }
};

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
      `SELECT b.*, ub.location_id,
              ub.cover_url as user_cover_url,
              ub.cover_small_url as user_cover_small_url,
              ub.cover_large_url as user_cover_large_url
       FROM books b
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

    // If reusing an existing book, merge in any new identifiers (e.g. UPC from a scan)
    if (bookId && book.identifiers) {
      const existingBook = await pool.query('SELECT identifiers FROM books WHERE id = $1', [bookId]);
      const existingIds = existingBook.rows[0]?.identifiers || {};
      const newIds = book.identifiers;
      let merged = { ...existingIds };
      let changed = false;
      for (const [key, values] of Object.entries(newIds)) {
        if (!values) continue;
        const existing = merged[key] || [];
        const toAdd = (Array.isArray(values) ? values : [values]).filter((v: string) => !existing.includes(v));
        if (toAdd.length > 0) {
          merged[key] = [...existing, ...toAdd];
          changed = true;
        }
      }
      if (changed) {
        await pool.query(
          'UPDATE books SET identifiers = $1, updated_at = NOW() WHERE id = $2',
          [JSON.stringify(merged), bookId]
        );
      }
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

    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );
    const isAdmin = adminCheck.rows[0]?.is_admin === true;

    const allowedFields = [
      'title', 'authors', 'isbn', 'publisher', 'published_date',
      'description', 'page_count', 'language', 'edition', 'width', 'height',
      'cover_url', 'cover_small_url', 'cover_large_url',
    ];

    // Filter to only allowed fields
    const filteredUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const coverFields = ['cover_url', 'cover_small_url', 'cover_large_url'];
    const isCoverOnlyUpdate = Object.keys(filteredUpdates).every(k => coverFields.includes(k));

    // Cover-only updates go to user_books as personal override (unless admin)
    if (isCoverOnlyUpdate && !isAdmin) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      for (const [key, val] of Object.entries(filteredUpdates)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(val ?? null);
        paramIndex++;
      }
      values.push(userId, id);
      await pool.query(
        `UPDATE user_books SET ${setClauses.join(', ')} WHERE user_id = $${paramIndex} AND book_id = $${paramIndex + 1}`,
        values
      );
      // Queue for admin approval as global cover
      await pool.query(
        `INSERT INTO pending_book_edits (book_id, user_id, changes) VALUES ($1, $2, $3)`,
        [id, userId, JSON.stringify(filteredUpdates)]
      );
      return res.json({ success: true, personal: true, message: 'Cover set as personal override, pending admin approval for global change' });
    }

    if (isAdmin) {
      // Admin: apply directly
      return applyBookUpdate(id, filteredUpdates, res);
    }

    // Non-admin editing content fields: queue for approval
    const result = await pool.query(
      `INSERT INTO pending_book_edits (book_id, user_id, changes)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, userId, JSON.stringify(filteredUpdates)]
    );

    return res.json({
      pending: true,
      message: 'Your changes have been submitted for review',
      edit: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating book:', err);
    return res.status(500).json({ error: 'Failed to update book' });
  }
};

// Helper: apply book updates directly
async function applyBookUpdate(bookId: string, updates: Record<string, any>, res: Response) {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, val] of Object.entries(updates)) {
    const finalVal = (key === 'authors' && Array.isArray(val)) ? JSON.stringify(val) : val;
    setClauses.push(`${key} = $${paramIndex}`);
    values.push(finalVal ?? null);
    paramIndex++;
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(bookId);

  const result = await pool.query(
    `UPDATE books SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Book not found' });
  }

  // Re-index in Elasticsearch
  indexBook(result.rows[0]).catch((err) =>
    console.error(`Failed to re-index book ${bookId}:`, err)
  );

  return res.json(result.rows[0]);
}

// Admin: review pending edits
export const getPendingEdits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query(
      `SELECT pe.*, b.title as book_title
       FROM pending_book_edits pe
       JOIN books b ON b.id = pe.book_id
       WHERE pe.status = 'pending'
       ORDER BY pe.created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pending edits:', err);
    return res.status(500).json({ error: 'Failed to fetch pending edits' });
  }
};

export const reviewEdit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { editId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const editResult = await pool.query(
      'SELECT * FROM pending_book_edits WHERE id = $1 AND status = $2',
      [editId, 'pending']
    );
    if (editResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pending edit not found' });
    }

    const edit = editResult.rows[0];

    if (action === 'approve') {
      // Apply the changes
      const changes = edit.changes;
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, val] of Object.entries(changes)) {
        const finalVal = (key === 'authors' && Array.isArray(val)) ? JSON.stringify(val) : val;
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(finalVal ?? null);
        paramIndex++;
      }
      setClauses.push('updated_at = NOW()');
      values.push(edit.book_id);

      const bookResult = await pool.query(
        `UPDATE books SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      // Re-index
      if (bookResult.rows.length > 0) {
        indexBook(bookResult.rows[0]).catch((err) =>
          console.error(`Failed to re-index book ${edit.book_id}:`, err)
        );
      }
    }

    // Mark edit as approved/rejected
    await pool.query(
      `UPDATE pending_book_edits SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3`,
      [action === 'approve' ? 'approved' : 'rejected', userId, editId]
    );

    return res.json({ success: true, action });
  } catch (err) {
    console.error('Error reviewing edit:', err);
    return res.status(500).json({ error: 'Failed to review edit' });
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

    console.log('[addBookImage] bookId:', bookId, 'url:', url, 'is_cover:', is_cover, 'userId:', userId);

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const result = await pool.query(
      `INSERT INTO book_images (book_id, user_id, url, url_small, url_large, is_cover, sort_order, caption)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [bookId, userId, url, url_small || null, url_large || null, is_cover || false, sort_order || 0, caption || null]
    );

    // If set as cover, set personal override and queue for admin approval
    if (is_cover) {
      await pool.query(
        'UPDATE book_images SET is_cover = false WHERE book_id = $1 AND id != $2',
        [bookId, result.rows[0].id]
      );

      const coverUrl = url;
      const coverSmallUrl = url_small || url;
      const coverLargeUrl = url_large || url;

      // Personal cover override
      await pool.query(
        `UPDATE user_books SET cover_url = $1, cover_small_url = $2, cover_large_url = $3
         WHERE user_id = $4 AND book_id = $5`,
        [coverUrl, coverSmallUrl, coverLargeUrl, userId, bookId]
      );

      // Check if admin — apply globally or queue
      const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
      if (adminCheck.rows[0]?.is_admin) {
        await pool.query(
          'UPDATE books SET cover_url = $1, cover_small_url = $2, cover_large_url = $3, updated_at = NOW() WHERE id = $4',
          [coverUrl, coverSmallUrl, coverLargeUrl, bookId]
        );
      } else {
        await pool.query(
          `INSERT INTO pending_book_edits (book_id, user_id, changes) VALUES ($1, $2, $3)`,
          [bookId, userId, JSON.stringify({ cover_url: coverUrl, cover_small_url: coverSmallUrl, cover_large_url: coverLargeUrl })]
        );
      }
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

// Set an image as the book's cover (personal override + queue for admin approval)
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

    // Unset all covers for this book (for this user), set this one
    await pool.query('UPDATE book_images SET is_cover = false WHERE book_id = $1', [bookId]);
    await pool.query('UPDATE book_images SET is_cover = true WHERE id = $1', [imageId]);

    const coverUrl = image.url;
    const coverSmallUrl = image.url_small || image.url;
    const coverLargeUrl = image.url_large || image.url;

    // Set personal cover override on user_books
    await pool.query(
      `UPDATE user_books SET cover_url = $1, cover_small_url = $2, cover_large_url = $3
       WHERE user_id = $4 AND book_id = $5`,
      [coverUrl, coverSmallUrl, coverLargeUrl, userId, bookId]
    );

    // Check if user is admin — if so, also update global cover
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    const isAdmin = adminCheck.rows[0]?.is_admin === true;

    if (isAdmin) {
      await pool.query(
        'UPDATE books SET cover_url = $1, cover_small_url = $2, cover_large_url = $3, updated_at = NOW() WHERE id = $4',
        [coverUrl, coverSmallUrl, coverLargeUrl, bookId]
      );
    } else {
      // Queue a pending edit for admin to approve as global cover
      await pool.query(
        `INSERT INTO pending_book_edits (book_id, user_id, changes)
         VALUES ($1, $2, $3)`,
        [bookId, userId, JSON.stringify({ cover_url: coverUrl, cover_small_url: coverSmallUrl, cover_large_url: coverLargeUrl })]
      );
    }

    return res.json({ success: true, personal: true });
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
