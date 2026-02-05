import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { middleware } from 'supertokens-node/framework/express';
import { errorHandler } from 'supertokens-node/framework/express';
import { supertokens } from './config/supertokens';
import { libraryRoutes } from './routes/library';
import { genreRoutes } from './routes/genres';
import { imageRoutes } from './routes/images';
import { searchRoutes } from './routes/search';
import { userRoutes } from './routes/users';
import { locationRoutes } from './routes/locations';
import { collectionRoutes } from './routes/collections';
import { createBooksIndex } from './config/elasticsearch';
import { pool } from './config/db';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
  credentials: true,
}));

app.use(express.json());
app.use(middleware());

// Routes
app.use('/library', libraryRoutes);
app.use('/genres', genreRoutes);
app.use('/images', imageRoutes);
app.use('/search', searchRoutes);
app.use('/users', userRoutes);
app.use('/locations', locationRoutes);
app.use('/collections', collectionRoutes);

// Contact form endpoint
app.post('/contact', async (req, res): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and message are required' });
      return;
    }

    await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)`,
      [name, email, subject || null, message]
    );

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Error handling
app.use(errorHandler());

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);

  // Initialize Elasticsearch index and sync books
  try {
    await createBooksIndex();
  } catch (err) {
    console.error('Elasticsearch initialization failed (search will be unavailable):', err);
  }
});
