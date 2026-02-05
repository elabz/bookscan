import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import {
  getUserBooks,
  searchUserBooks,
  getBookById,
  getFeaturedBooks,
  addBookToLibrary,
  lookupBookByCode,
  checkDuplicate,
  updateBook,
  updateBookLocation,
  getBookImages,
  addBookImage,
  deleteBookImage,
  setImageAsCover,
  removeBookFromLibrary,
  getPendingEdits,
  reviewEdit,
} from '../controllers/library';

const router = express.Router();

// Public routes — no auth required
router.get('/featured', getFeaturedBooks);
router.get('/book/:id/public', getBookById);
router.get('/lookup', lookupBookByCode);

// Protected routes
router.use(verifySession());
router.get('/check-duplicate', checkDuplicate);
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

// Admin routes for pending edits
router.get('/admin/pending-edits', getPendingEdits);
router.post('/admin/pending-edits/:editId/review', reviewEdit);

export { router as libraryRoutes };
