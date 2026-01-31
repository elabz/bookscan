import { Request, Response } from 'express';
import { hybridSearch, syncAllBooks } from '../services/searchService';
import { generateEmbedding } from '../services/embeddingService';

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
 * POST /search/sync
 * Re-sync all books from PostgreSQL to Elasticsearch (with embeddings).
 */
export const syncIndex = async (_req: Request, res: Response) => {
  try {
    const count = await syncAllBooks();
    return res.json({ synced: count });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: 'Sync failed' });
  }
};
