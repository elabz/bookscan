import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import {
  getUserBooks,
  searchUserBooks,
  getBookById,
  getFeaturedBooks,
  addBookToLibrary,
  removeBookFromLibrary,
} from '../controllers/library';

const router = express.Router();

// Public routes — no auth required
router.get('/featured', getFeaturedBooks);
router.get('/book/:id/public', getBookById);

// Protected routes
router.use(verifySession());

router.get('/', getUserBooks);
router.get('/search', searchUserBooks);
router.get('/book/:id', getBookById);
router.post('/book', addBookToLibrary);
router.delete('/book/:bookId', removeBookFromLibrary);

export { router as libraryRoutes };
