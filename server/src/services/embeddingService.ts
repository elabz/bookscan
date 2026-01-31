const EMBEDDINGS_URL = process.env.EMBEDDINGS_URL || 'http://host.docker.internal:4000/v1/embeddings';
const EMBEDDINGS_MODEL = process.env.EMBEDDINGS_MODEL || 'heartcode-embed';
const API_KEY = process.env.LITELLM_API_KEY || '';

/**
 * Build a rich text representation of a book for embedding.
 * Includes all meaningful textual fields.
 */
export const buildBookText = (book: any): string => {
  const parts: string[] = [];

  if (book.title) parts.push(`Title: ${book.title}`);

  const authors = Array.isArray(book.authors)
    ? book.authors.map((a: any) => (typeof a === 'string' ? a : a.name || a)).join(', ')
    : '';
  if (authors) parts.push(`Authors: ${authors}`);

  if (book.description) parts.push(`Description: ${book.description}`);

  if (book.publisher) parts.push(`Publisher: ${book.publisher}`);
  if (book.published_date) parts.push(`Published: ${book.published_date}`);
  if (book.edition) parts.push(`Edition: ${book.edition}`);
  if (book.language) parts.push(`Language: ${book.language}`);

  // Categories
  const categories = Array.isArray(book.categories)
    ? book.categories.join(', ')
    : '';
  if (categories) parts.push(`Categories: ${categories}`);

  // Subjects
  if (Array.isArray(book.subjects)) {
    const subjectNames = book.subjects
      .map((s: any) => (typeof s === 'string' ? s : s.name || ''))
      .filter(Boolean)
      .join(', ');
    if (subjectNames) parts.push(`Subjects: ${subjectNames}`);
  }

  // Excerpts
  if (Array.isArray(book.excerpts)) {
    const excerptTexts = book.excerpts
      .map((e: any) => e.text || e.comment || '')
      .filter(Boolean)
      .join(' ');
    if (excerptTexts) parts.push(`Excerpts: ${excerptTexts}`);
  }

  // Publish places
  if (Array.isArray(book.publish_places)) {
    const places = book.publish_places
      .map((p: any) => (typeof p === 'string' ? p : p.name || ''))
      .filter(Boolean)
      .join(', ');
    if (places) parts.push(`Published in: ${places}`);
  }

  if (book.isbn) parts.push(`ISBN: ${book.isbn}`);
  if (book.page_count || book.number_of_pages) {
    parts.push(`Pages: ${book.page_count || book.number_of_pages}`);
  }

  return parts.join('\n');
};

/**
 * Generate an embedding vector for the given text using LiteLLM / nomic-embed-text.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await fetch(EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDINGS_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding API error ${response.status}: ${errText}`);
  }

  const data: any = await response.json();
  return data.data[0].embedding;
};

/**
 * Generate embedding for a book record.
 */
export const generateBookEmbedding = async (book: any): Promise<number[]> => {
  const text = buildBookText(book);
  return generateEmbedding(text);
};
