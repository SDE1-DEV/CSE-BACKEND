import { Router } from 'express';
import { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } from '../controllers/company.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createCompanySchema, updateCompanySchema, companyParamsSchema } from '../validators/company.validator';

const router = Router();

router.get('/', getCompanies);
router.get('/:id', validate(companyParamsSchema), getCompanyById);
router.post('/', authenticate, requireAdmin, validate(createCompanySchema), createCompany);
router.put('/:id', authenticate, requireAdmin, validate(updateCompanySchema), updateCompany);
router.delete('/:id', authenticate, requireAdmin, validate(companyParamsSchema), deleteCompany);

export default router;
