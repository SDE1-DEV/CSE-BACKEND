import { Router } from 'express';
import { globalSearch } from '../controllers/search.controller';
import { validate } from '../middlewares/validate.middleware';
import { searchQuerySchema } from '../validators/search.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Global search
 */

router.get('/', validate(searchQuerySchema), globalSearch);

export default router;
