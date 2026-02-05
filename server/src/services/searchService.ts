import { esClient, BOOKS_INDEX } from '../config/elasticsearch';
import { pool } from '../config/db';
import { generateBookEmbedding } from './embeddingService';

/**
 * Index a single book into Elasticsearch.
 */
export const indexBook = async (book: any) => {
  const authors = Array.isArray(book.authors)
    ? (typeof book.authors[0] === 'string' ? book.authors : book.authors)
    : [];

  // Normalize subjects: may be array of objects { name: string } or strings
  let subjects: string[] | undefined;
  if (Array.isArray(book.subjects)) {
    subjects = book.subjects.map((s: any) => (typeof s === 'string' ? s : s?.name || '')).filter(Boolean);
  }

  const doc: any = {
    id: book.id,
    title: book.title,
    authors,
    isbn: book.isbn || undefined,
    description: book.description || undefined,
    publisher: book.publisher || undefined,
    published_date: book.published_date || undefined,
    categories: book.categories || undefined,
    language: book.language || undefined,
    page_count: book.page_count || undefined,
    cover_url: book.cover_url || undefined,
    cover_small_url: book.cover_small_url || undefined,
    cover_large_url: book.cover_large_url || undefined,
    subjects: subjects || undefined,
  };

  // Generate embedding vector
  try {
    const vector = await generateBookEmbedding(book);
    doc.title_vector = vector;
  } catch (err) {
    console.error(`Failed to generate embedding for book ${book.id}:`, err);
  }

  await esClient.index({
    index: BOOKS_INDEX,
    id: book.id,
    body: doc,
  });
};

/**
 * Sync all books from PostgreSQL into Elasticsearch.
 */
export const syncAllBooks = async () => {
  const result = await pool.query('SELECT * FROM books');
  let indexed = 0;

  for (const book of result.rows) {
    try {
      await indexBook(book);
      indexed++;
    } catch (err) {
      console.error(`Failed to index book ${book.id}:`, err);
    }
  }

  // Refresh index so documents are immediately searchable
  await esClient.indices.refresh({ index: BOOKS_INDEX });
  console.log(`Synced ${indexed}/${result.rows.length} books to Elasticsearch`);
  return indexed;
};

/**
 * Remove a book from the index.
 */
export const removeBookFromIndex = async (bookId: string) => {
  try {
    await esClient.delete({ index: BOOKS_INDEX, id: bookId });
  } catch (err: any) {
    if (err.meta?.statusCode !== 404) throw err;
  }
};

/**
 * Keyword search using multi_match across title, authors, description, isbn, subjects.
 */
export const keywordSearch = async (query: string, limit = 20) => {
  const { body } = await esClient.search({
    index: BOOKS_INDEX,
    body: {
      size: limit,
      query: {
        bool: {
          should: [
            // Exact ISBN match (highest boost)
            { term: { isbn: { value: query.replace(/-/g, ''), boost: 10 } } },
            // Title phrase match
            { match_phrase: { 'title.exact': { query, boost: 5 } } },
            // Title word match
            { match: { title: { query, boost: 3 } } },
            // Author match
            { match: { authors: { query, boost: 2 } } },
            // Description match
            { match: { description: { query, boost: 1 } } },
            // Subjects/categories
            { match: { subjects: { query, boost: 1 } } },
          ],
          minimum_should_match: 1,
        },
      },
    },
  });

  return body.hits.hits.map((hit: any) => ({
    ...hit._source,
    _score: hit._score,
  }));
};

/**
 * Vector search using script_score with cosineSimilarity (ES 7.x).
 * Requires books to have title_vector populated.
 */
export const vectorSearch = async (queryVector: number[], limit = 20) => {
  const { body } = await esClient.search({
    index: BOOKS_INDEX,
    body: {
      size: limit,
      query: {
        script_score: {
          query: {
            exists: { field: 'title_vector' },
          },
          script: {
            source: "cosineSimilarity(params.queryVector, 'title_vector') + 1.0",
            params: { queryVector },
          },
        },
      },
    },
  });

  return body.hits.hits.map((hit: any) => ({
    ...hit._source,
    _score: hit._score,
  }));
};

/**
 * Keyword search filtered to a specific set of book IDs.
 */
export const keywordSearchFiltered = async (query: string, bookIds: string[], limit = 20) => {
  const { body } = await esClient.search({
    index: BOOKS_INDEX,
    body: {
      size: limit,
      query: {
        bool: {
          filter: [{ terms: { id: bookIds } }],
          should: [
            { term: { isbn: { value: query.replace(/-/g, ''), boost: 10 } } },
            { match_phrase: { 'title.exact': { query, boost: 5 } } },
            { match: { title: { query, boost: 3 } } },
            { match: { authors: { query, boost: 2 } } },
            { match: { description: { query, boost: 1 } } },
            { match: { subjects: { query, boost: 1 } } },
          ],
          minimum_should_match: 1,
        },
      },
    },
  });

  return body.hits.hits.map((hit: any) => ({
    ...hit._source,
    _score: hit._score,
  }));
};

/**
 * Vector search filtered to a specific set of book IDs.
 */
export const vectorSearchFiltered = async (queryVector: number[], bookIds: string[], limit = 20) => {
  const { body } = await esClient.search({
    index: BOOKS_INDEX,
    body: {
      size: limit,
      query: {
        script_score: {
          query: {
            bool: {
              filter: [
                { terms: { id: bookIds } },
                { exists: { field: 'title_vector' } },
              ],
            },
          },
          script: {
            source: "cosineSimilarity(params.queryVector, 'title_vector') + 1.0",
            params: { queryVector },
          },
        },
      },
    },
  });

  return body.hits.hits.map((hit: any) => ({
    ...hit._source,
    _score: hit._score,
  }));
};

/**
 * Hybrid search filtered to a specific set of book IDs.
 */
export const hybridSearchFiltered = async (query: string, queryVector?: number[], bookIds: string[] = [], limit = 20) => {
  if (!queryVector) {
    return keywordSearchFiltered(query, bookIds, limit);
  }

  const [keywordResults, vectorResults] = await Promise.all([
    keywordSearchFiltered(query, bookIds, limit),
    vectorSearchFiltered(queryVector, bookIds, limit),
  ]);

  const scoreMap = new Map<string, { doc: any; kScore: number; vScore: number }>();
  const maxKScore = keywordResults.length > 0 ? keywordResults[0]._score : 1;
  const maxVScore = vectorResults.length > 0 ? vectorResults[0]._score : 1;

  for (const doc of keywordResults) {
    scoreMap.set(doc.id, { doc, kScore: doc._score / maxKScore, vScore: 0 });
  }
  for (const doc of vectorResults) {
    const existing = scoreMap.get(doc.id);
    const normalizedV = doc._score / maxVScore;
    if (existing) {
      existing.vScore = normalizedV;
    } else {
      scoreMap.set(doc.id, { doc, kScore: 0, vScore: normalizedV });
    }
  }

  return Array.from(scoreMap.values())
    .map(({ doc, kScore, vScore }) => ({
      ...doc,
      _score: kScore * 0.7 + vScore * 0.3,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
};

/**
 * Hybrid search: keyword + optional vector, combined with a weighted sum.
 */
export const hybridSearch = async (query: string, queryVector?: number[], limit = 20) => {
  // If no vector, just do keyword search
  if (!queryVector) {
    return keywordSearch(query, limit);
  }

  // Run both in parallel
  const [keywordResults, vectorResults] = await Promise.all([
    keywordSearch(query, limit),
    vectorSearch(queryVector, limit),
  ]);

  // Merge: deduplicate by id, combine scores
  const scoreMap = new Map<string, { doc: any; kScore: number; vScore: number }>();

  const maxKScore = keywordResults.length > 0 ? keywordResults[0]._score : 1;
  const maxVScore = vectorResults.length > 0 ? vectorResults[0]._score : 1;

  for (const doc of keywordResults) {
    scoreMap.set(doc.id, { doc, kScore: doc._score / maxKScore, vScore: 0 });
  }
  for (const doc of vectorResults) {
    const existing = scoreMap.get(doc.id);
    const normalizedV = doc._score / maxVScore;
    if (existing) {
      existing.vScore = normalizedV;
    } else {
      scoreMap.set(doc.id, { doc, kScore: 0, vScore: normalizedV });
    }
  }

  // Weighted: 70% keyword, 30% vector
  const merged = Array.from(scoreMap.values())
    .map(({ doc, kScore, vScore }) => ({
      ...doc,
      _score: kScore * 0.7 + vScore * 0.3,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  return merged;
};
