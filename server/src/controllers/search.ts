import { Request, Response } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import { hybridSearch, hybridSearchFiltered, syncAllBooks } from '../services/searchService';
import { generateEmbedding } from '../services/embeddingService';
import { pool } from '../config/db';

/**
 * GET /search?q=query&limit=20
 * Hybrid search: keyword + vector across all indexed books.
 */
export const search = async (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query "q" is required' });
    }

    const maxResults = Math.min(Number(limit) || 20, 50);

    // Generate query embedding for vector search
    let queryVector: number[] | undefined;
    try {
      queryVector = await generateEmbedding(q);
    } catch (err) {
      console.error('Failed to generate query embedding, falling back to keyword only:', err);
    }

    const results = await hybridSearch(q, queryVector, maxResults);

    return res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
};

/**
 * POST /search/similar
 * Search for similar books within the user's library.
 */
export const searchSimilarInLibrary = async (req: SessionRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const { text, limit } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: '"text" is required' });
    }

    const maxResults = Math.min(Number(limit) || 10, 50);

    // Get user's book IDs
    const userBooks = await pool.query(
      'SELECT book_id FROM user_books WHERE user_id = $1',
      [userId]
    );
    const bookIds = userBooks.rows.map((r: any) => r.book_id);

    if (bookIds.length === 0) {
      return res.json([]);
    }

    // Generate embedding for the query text
    let queryVector: number[] | undefined;
    try {
      queryVector = await generateEmbedding(text);
    } catch (err) {
      console.error('Failed to generate query embedding for similar search:', err);
    }

    const results = await hybridSearchFiltered(text, queryVector, bookIds, maxResults);
    return res.json(results);
  } catch (err) {
    console.error('Similar search error:', err);
    return res.status(500).json({ error: 'Similar search failed' });
  }
};

/**
 * POST /search/sync
 * Re-sync all books from PostgreSQL to Elasticsearch (with embeddings).
 */
export const syncIndex = async (req: SessionRequest, res: Response) => {
  try {
    const userId = req.session!.getUserId();
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const count = await syncAllBooks();
    return res.json({ synced: count });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: 'Sync failed' });
  }
};
