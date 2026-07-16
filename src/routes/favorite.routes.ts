import { Router } from 'express';
import { getFavorites } from '../controllers/favorite.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

router.get('/', authenticate, requireStudent, getFavorites);

export default router;
