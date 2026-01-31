import express from 'express';
import { processCover, migrateCovers } from '../controllers/images';

const router = express.Router();

router.post('/process-cover', processCover);
router.post('/migrate-covers', migrateCovers);

export { router as imageRoutes };
