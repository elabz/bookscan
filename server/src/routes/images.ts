import express from 'express';
import multer from 'multer';
import { processCover, uploadImage, migrateCovers } from '../controllers/images';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/process-cover', processCover);
router.post('/upload', upload.single('file'), uploadImage);
router.post('/migrate-covers', migrateCovers);

export { router as imageRoutes };
