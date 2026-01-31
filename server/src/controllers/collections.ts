import { Response } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import { pool } from '../config/db';

type AuthRequest = SessionRequest;

export const getCollections = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const result = await pool.query(
      'SELECT * FROM collections WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching collections:', err);
    return res.status(500).json({ error: 'Failed to fetch collections' });
  }
};

export const createCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await pool.query(
      'INSERT INTO collections (user_id, name, description, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, description || null, color || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating collection:', err);
    return res.status(500).json({ error: 'Failed to create collection' });
  }
};

export const updateCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id } = req.params;
    const { name, description, color } = req.body;

    const result = await pool.query(
      `UPDATE collections SET name = COALESCE($1, name), description = $2, color = $3
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [name, description ?? null, color ?? null, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating collection:', err);
    return res.status(500).json({ error: 'Failed to update collection' });
  }
};

export const deleteCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id } = req.params;

    await pool.query('DELETE FROM collections WHERE id = $1 AND user_id = $2', [id, userId]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting collection:', err);
    return res.status(500).json({ error: 'Failed to delete collection' });
  }
};

// Add book to collection
export const addBookToCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id: bookId } = req.params;
    const { collection_id } = req.body;

    await pool.query(
      'INSERT INTO book_collections (book_id, collection_id, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [bookId, collection_id, userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('Error adding book to collection:', err);
    return res.status(500).json({ error: 'Failed to add book to collection' });
  }
};

// Remove book from collection
export const removeBookFromCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id: bookId, collectionId } = req.params;

    await pool.query(
      'DELETE FROM book_collections WHERE book_id = $1 AND collection_id = $2 AND user_id = $3',
      [bookId, collectionId, userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('Error removing book from collection:', err);
    return res.status(500).json({ error: 'Failed to remove book from collection' });
  }
};

// Get collections for a book
export const getBookCollections = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { id: bookId } = req.params;

    const result = await pool.query(
      `SELECT c.* FROM collections c
       JOIN book_collections bc ON bc.collection_id = c.id
       WHERE bc.book_id = $1 AND bc.user_id = $2`,
      [bookId, userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching book collections:', err);
    return res.status(500).json({ error: 'Failed to fetch book collections' });
  }
};
