import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import multer from 'multer';
import { scanISBN, scanImage, searchBooks } from '../controllers/books';

const router = express.Router();
const upload = multer({ dest: 'temp-images/' });

// Protected routes
router.use(verifySession());

// Book routes
router.post('/scan/isbn', scanISBN);
router.post('/scan/image', upload.single('image'), scanImage);
router.get('/search', searchBooks);

export { router as bookRoutes };
