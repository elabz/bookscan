import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // managed by nginx/frontend in production
  crossOriginEmbedderPolicy: false, // allow CDN images
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(middleware());

// Rate limiting for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages, please try again later' },
});

// Routes
app.use('/library', libraryRoutes);
app.use('/genres', genreRoutes);
app.use('/images', imageRoutes);
app.use('/search', publicLimiter, searchRoutes);
app.use('/users', userRoutes);
app.use('/locations', locationRoutes);
app.use('/collections', collectionRoutes);

// Contact form endpoint with rate limiting and validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/contact', contactLimiter, async (req, res): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and message are required' });
      return;
    }

    if (typeof name !== 'string' || name.length > 200) {
      res.status(400).json({ error: 'Invalid name' });
      return;
    }
    if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }
    if (subject && (typeof subject !== 'string' || subject.length > 300)) {
      res.status(400).json({ error: 'Invalid subject' });
      return;
    }
    if (typeof message !== 'string' || message.length > 5000) {
      res.status(400).json({ error: 'Message too long (max 5000 characters)' });
      return;
    }

    await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)`,
      [name.trim(), email.trim().toLowerCase(), (subject || '').trim() || null, message.trim()]
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
