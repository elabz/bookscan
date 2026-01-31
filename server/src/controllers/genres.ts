import { Response } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import { pool } from '../config/db';

type AuthRequest = SessionRequest;

// Get all genres
export const getAllGenres = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM genres ORDER BY name');
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching genres:', err);
    return res.status(500).json({ error: 'Failed to fetch genres' });
  }
};

// Add a genre (returns existing if duplicate)
export const addGenre = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    // Check for existing
    const existing = await pool.query(
      'SELECT * FROM genres WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const result = await pool.query(
      'INSERT INTO genres (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding genre:', err);
    return res.status(500).json({ error: 'Failed to add genre' });
  }
};

// Get genres for a book
export const getBookGenres = async (req: AuthRequest, res: Response) => {
  try {
    const { bookId } = req.params;

    const result = await pool.query(
      `SELECT g.* FROM genres g
       INNER JOIN book_genres bg ON g.id = bg.genre_id
       WHERE bg.book_id = $1`,
      [bookId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching book genres:', err);
    return res.status(500).json({ error: 'Failed to fetch book genres' });
  }
};

// Add genre to book
export const addGenreToBook = async (req: AuthRequest, res: Response) => {
  try {
    const { bookId } = req.params;
    const { genreId } = req.body;

    await pool.query(
      'INSERT INTO book_genres (book_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [bookId, genreId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Error adding genre to book:', err);
    return res.status(500).json({ error: 'Failed to add genre to book' });
  }
};

// Get book IDs by genre
export const getBooksByGenre = async (req: AuthRequest, res: Response) => {
  try {
    const { genreId } = req.params;

    const result = await pool.query(
      'SELECT book_id FROM book_genres WHERE genre_id = $1',
      [genreId]
    );

    return res.json(result.rows.map(r => r.book_id));
  } catch (err) {
    console.error('Error fetching books by genre:', err);
    return res.status(500).json({ error: 'Failed to fetch books by genre' });
  }
};

// Remove genre from book
export const removeGenreFromBook = async (req: AuthRequest, res: Response) => {
  try {
    const { bookId, genreId } = req.params;

    await pool.query(
      'DELETE FROM book_genres WHERE book_id = $1 AND genre_id = $2',
      [bookId, genreId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Error removing genre from book:', err);
    return res.status(500).json({ error: 'Failed to remove genre from book' });
  }
};
