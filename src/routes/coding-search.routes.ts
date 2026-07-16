import { Router } from 'express';
import { codingSearch } from '../controllers/coding-search.controller';
import { validate } from '../middlewares/validate.middleware';
import { codingSearchQuerySchema } from '../validators/coding-search.validator';

const router = Router();

router.get('/', validate(codingSearchQuerySchema), codingSearch);

export default router;
