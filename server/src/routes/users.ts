import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { getProfile, updateProfile, getLibraryStats } from '../controllers/users';

const router = express.Router();

// All user routes require auth
router.use(verifySession());

router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.get('/me/stats', getLibraryStats);

export { router as userRoutes };
