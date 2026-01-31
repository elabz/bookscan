import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import {
  getAllGenres,
  addGenre,
  getBookGenres,
  addGenreToBook,
  getBooksByGenre,
  removeGenreFromBook,
} from '../controllers/genres';

const router = express.Router();

router.use(verifySession());

router.get('/', getAllGenres);
router.post('/', addGenre);
router.get('/book/:bookId', getBookGenres);
router.post('/book/:bookId', addGenreToBook);
router.get('/:genreId/books', getBooksByGenre);
router.delete('/book/:bookId/:genreId', removeGenreFromBook);

export { router as genreRoutes };
