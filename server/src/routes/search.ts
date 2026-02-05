import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { search, searchSimilarInLibrary, syncIndex } from '../controllers/search';

const router = express.Router();

router.get('/', search);
router.post('/similar', verifySession(), searchSimilarInLibrary);
router.post('/sync', verifySession(), syncIndex);

export { router as searchRoutes };
