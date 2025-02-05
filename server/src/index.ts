import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { middleware } from 'supertokens-node/framework/express';
import { errorHandler } from 'supertokens-node/framework/express';
import { supertokens } from './config/supertokens';
import { bookRoutes } from './routes/books';

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

// Error handling
app.use(errorHandler());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
