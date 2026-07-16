import { Company, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class CompanyRepository {
  async create(data: Prisma.CompanyCreateInput): Promise<Company> {
    return prisma.company.create({ data });
  }

  async findById(id: string): Promise<Company | null> {
    return prisma.company.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Company | null> {
    return prisma.company.findUnique({ where: { slug } });
  }

  async findAll(): Promise<Company[]> {
    return prisma.company.findMany({ orderBy: { name: 'asc' } });
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.company.findMany({ orderBy: { name: 'asc' }, skip, take: limit }),
      prisma.company.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, data: Prisma.CompanyUpdateInput): Promise<Company> {
    return prisma.company.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.company.delete({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.CompanyWhereInput = { slug };
    if (excludeId) where.id = { not: excludeId };
    return (await prisma.company.count({ where })) > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.CompanyWhereInput = { name };
    if (excludeId) where.id = { not: excludeId };
    return (await prisma.company.count({ where })) > 0;
  }
}

export const companyRepository = new CompanyRepository();
