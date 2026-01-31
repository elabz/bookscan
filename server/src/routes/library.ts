import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import {
  getUserBooks,
  searchUserBooks,
  getBookById,
  getFeaturedBooks,
  addBookToLibrary,
  updateBook,
  updateBookLocation,
  getBookImages,
  addBookImage,
  deleteBookImage,
  setImageAsCover,
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
router.patch('/book/:id', updateBook);
router.patch('/book/:id/location', updateBookLocation);
router.get('/book/:id/images', getBookImages);
router.post('/book/:id/images', addBookImage);
router.delete('/book/:id/images/:imageId', deleteBookImage);
router.patch('/book/:id/images/:imageId/set-cover', setImageAsCover);
router.delete('/book/:bookId', removeBookFromLibrary);

export { router as libraryRoutes };
