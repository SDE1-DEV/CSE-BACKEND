import { Router } from 'express';
import { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } from '../controllers/company.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createCompanySchema, updateCompanySchema, companyParamsSchema } from '../validators/company.validator';

const router = Router();

router.get('/', getCompanies);
router.get('/:id', validate(companyParamsSchema), getCompanyById);
router.post('/', authenticate, requireManager, validate(createCompanySchema), createCompany);
router.put('/:id', authenticate, requireManager, validate(updateCompanySchema), updateCompany);
router.delete('/:id', authenticate, requireManager, validate(companyParamsSchema), deleteCompany);

export default router;
