import { Company } from '@prisma/client';
import { companyRepository } from '../repositories/company.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import { CreateCompanyInput, UpdateCompanyInput } from '../validators/company.validator';

export class CompanyService {
  async create(data: CreateCompanyInput): Promise<Company> {
    const [slugExists, nameExists] = await Promise.all([
      companyRepository.existsBySlug(data.slug),
      companyRepository.existsByName(data.name),
    ]);
    if (slugExists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.COMPANY_SLUG_EXISTS);
    if (nameExists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.COMPANY_NAME_EXISTS);

    return companyRepository.create({
      name: data.name,
      slug: data.slug,
      logo: data.logo ?? null,
      website: data.website ?? null,
      description: data.description ?? null,
      industry: data.industry ?? null,
      headquarters: data.headquarters ?? null,
      careersUrl: data.careersUrl ?? null,
      verified: data.verified ?? false,
    });
  }

  async getAll(page?: number, limit?: number) {
    const p = page ?? 1;
    const l = Math.min(limit ?? 20, 100);
    return companyRepository.findAllPaginated(p, l);
  }

  async getById(id: string): Promise<Company> {
    const company = await companyRepository.findById(id);
    if (!company) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.COMPANY_NOT_FOUND);
    return company;
  }

  async update(id: string, data: UpdateCompanyInput): Promise<Company> {
    const company = await companyRepository.findById(id);
    if (!company) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.COMPANY_NOT_FOUND);

    if (data.slug && data.slug !== company.slug) {
      const exists = await companyRepository.existsBySlug(data.slug, id);
      if (exists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.COMPANY_SLUG_EXISTS);
    }
    if (data.name && data.name !== company.name) {
      const exists = await companyRepository.existsByName(data.name, id);
      if (exists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.COMPANY_NAME_EXISTS);
    }

    return companyRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const company = await companyRepository.findById(id);
    if (!company) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.COMPANY_NOT_FOUND);
    await companyRepository.delete(id);
  }
}

export const companyService = new CompanyService();
