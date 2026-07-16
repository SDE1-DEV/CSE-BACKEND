import { Response, NextFunction, Request } from 'express';
import { companyService } from '../services/company.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { CreateCompanyInput, UpdateCompanyInput } from '../validators/company.validator';

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management for problem tagging
 */

export const getCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = parseInt((req.query.limit as string) ?? '20', 10);
    const companies = await companyService.getAll(page, limit);
    sendSuccess(res, CODING_MESSAGES.COMPANIES_FETCHED, companies);
  } catch (error) {
    next(error);
  }
};

export const getCompanyById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const company = await companyService.getById(req.params.id);
    sendSuccess(res, CODING_MESSAGES.COMPANY_FETCHED, company);
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (
  req: Request<object, object, CreateCompanyInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const company = await companyService.create(req.body);
    sendCreated(res, CODING_MESSAGES.COMPANY_CREATED, company);
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (
  req: Request<{ id: string }, object, UpdateCompanyInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const company = await companyService.update(req.params.id, req.body);
    sendSuccess(res, CODING_MESSAGES.COMPANY_UPDATED, company);
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await companyService.delete(req.params.id);
    sendSuccess(res, CODING_MESSAGES.COMPANY_DELETED, null);
  } catch (error) {
    next(error);
  }
};
