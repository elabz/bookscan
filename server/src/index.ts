import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { middleware } from 'supertokens-node/framework/express';
import { errorHandler } from 'supertokens-node/framework/express';
import { supertokens } from './config/supertokens';
import { bookRoutes } from './routes/books';
import { libraryRoutes } from './routes/library';
import { genreRoutes } from './routes/genres';
import { imageRoutes } from './routes/images';
import { searchRoutes } from './routes/search';
import { userRoutes } from './routes/users';
import { locationRoutes } from './routes/locations';
import { collectionRoutes } from './routes/collections';
import { createBooksIndex } from './config/elasticsearch';

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
app.use('/books', bookRoutes);
app.use('/library', libraryRoutes);
app.use('/genres', genreRoutes);
app.use('/images', imageRoutes);
app.use('/search', searchRoutes);
app.use('/users', userRoutes);
app.use('/locations', locationRoutes);
app.use('/collections', collectionRoutes);

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
