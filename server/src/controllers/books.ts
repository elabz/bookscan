import { Request, Response } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import axios from 'axios';
import { createWorker } from 'tesseract.js';
import { pool } from '../config/db';
import { redis } from '../config/redis';

type AuthRequest = Request & SessionRequest;

export const scanISBN = async (req: AuthRequest, res: Response) => {
  try {
    const { isbn } = req.body;
    const userId = req.session!.getUserId();

    // Check cache first
    const cachedBook = await redis.get(`book:${isbn}`);
    if (cachedBook) {
      return res.json(JSON.parse(cachedBook));
    }

    // Check database
    const existingBook = await pool.query(
      'SELECT * FROM books WHERE isbn = $1',
      [isbn]
    );

    if (existingBook.rows.length > 0) {
      // Add to user's collection
      await pool.query(
        'INSERT INTO user_books (user_id, book_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, existingBook.rows[0].id]
      );
      
      // Cache the result
      await redis.set(`book:${isbn}`, JSON.stringify(existingBook.rows[0]));
      
      return res.json(existingBook.rows[0]);
    }

    // Fetch from OpenLibrary
    const response = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`);
    const bookData = response.data;

    // Insert into database
    const newBook = await pool.query(
      'INSERT INTO books (isbn, title, authors, description, cover_url, source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [isbn, bookData.title, bookData.authors, bookData.description, bookData.cover?.medium, 'openlibrary']
    );

    // Add to user's collection
    await pool.query(
      'INSERT INTO user_books (user_id, book_id) VALUES ($1, $2)',
      [userId, newBook.rows[0].id]
    );

    // Cache the result
    await redis.set(`book:${isbn}`, JSON.stringify(newBook.rows[0]));

    return res.json(newBook.rows[0]);
  } catch (err) {
    console.error('Error scanning ISBN:', err);
    return res.status(500).json({ error: 'Failed to scan ISBN' });
  }
};

export const scanImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();

    // Try to find ISBN in the text
    const isbnMatch = text.match(/(?:ISBN(?:-1[03])?:?\s*)?(?=[0-9X]{10}|(?=(?:[0-9]+[-\s]){3})[-\s0-9X]{13}|97[89][0-9]{10}|(?=(?:[0-9]+[-\s]){4})[-\s0-9]{17})(?:97[89][-\s]?)?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X]/i);
    
    if (isbnMatch) {
      const isbn = isbnMatch[0].replace(/[-\s]/g, '');
      // Redirect to ISBN scanning
      req.body.isbn = isbn;
      return scanISBN(req, res);
    }

    // If no ISBN found, perform vector search
    const embedding = await generateEmbedding(text);
    const similarBooks = await pool.query(
      'SELECT * FROM books ORDER BY embedding <-> $1 LIMIT 5',
      [embedding]
    );

    return res.json(similarBooks.rows);
  } catch (err) {
    console.error('Error scanning image:', err);
    return res.status(500).json({ error: 'Failed to scan image' });
  }
};

export const searchBooks = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Perform vector similarity search
    const embedding = await generateEmbedding(query as string);
    const books = await pool.query(
      'SELECT b.* FROM books b ORDER BY embedding <-> $1 LIMIT 10',
      [embedding]
    );

    return res.json(books.rows);
  } catch (err) {
    console.error('Error searching books:', err);
    return res.status(500).json({ error: 'Failed to search books' });
  }
};

// Helper function to generate embeddings using Ollama
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post('http://ollama:11434/api/embeddings', {
      model: 'llama2',
      prompt: text
    });
    return response.data.embedding;
  } catch (err) {
    console.error('Error generating embedding:', err);
    throw err;
  }
}
