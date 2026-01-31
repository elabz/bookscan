import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../controllers/locations';

const router = express.Router();

router.use(verifySession());

router.get('/', getLocations);
router.post('/', createLocation);
router.patch('/:id', updateLocation);
router.delete('/:id', deleteLocation);

export { router as locationRoutes };
