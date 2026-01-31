import express from 'express';
import { search, syncIndex } from '../controllers/search';

const router = express.Router();

router.get('/', search);
router.post('/sync', syncIndex);

export { router as searchRoutes };
