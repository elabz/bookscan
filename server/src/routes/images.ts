import express from 'express';
import multer from 'multer';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { processCover, uploadImage, migrateCovers } from '../controllers/images';

const router = express.Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

// All image routes require authentication
router.use(verifySession());

router.post('/process-cover', processCover);
router.post('/upload', upload.single('file'), uploadImage);
router.post('/migrate-covers', migrateCovers);

export { router as imageRoutes };
