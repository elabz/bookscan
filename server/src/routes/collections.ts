import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import {
  getCollections, createCollection, updateCollection, deleteCollection,
  addBookToCollection, removeBookFromCollection, getBookCollections,
} from '../controllers/collections';

const router = express.Router();

router.use(verifySession());

router.get('/', getCollections);
router.post('/', createCollection);
router.patch('/:id', updateCollection);
router.delete('/:id', deleteCollection);

// Book-collection endpoints
router.get('/book/:id', getBookCollections);
router.post('/book/:id', addBookToCollection);
router.delete('/book/:id/:collectionId', removeBookFromCollection);

export { router as collectionRoutes };
