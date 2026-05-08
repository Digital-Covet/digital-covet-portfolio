import { z } from "zod";
import { prisma } from "@/db";

export const taxonomyTypeSchema = z.enum([
  "industries",
  "work_categories",
  "services",
  "sectors",
  "key_businesses",
  "business_models",
]);

export type TaxonomyType = z.infer<typeof taxonomyTypeSchema>;

export class TaxonomyInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaxonomyInUseError";
  }
}

type TaxonomyHandler = {
  create: (
    name: string,
    parentId?: string,
  ) => Promise<{ id: string; name: string }>;
  delete: (id: string) => Promise<void>;
  getDeletionBlocker: (id: string) => Promise<string | null>;
};

const alwaysDeletable = async () => null;

const taxonomyHandlers: Record<TaxonomyType, TaxonomyHandler> = {
  industries: {
    create: (name, parentId) =>
      prisma.industry.create({
        data: { name, sectorId: parentId ?? null },
        select: { id: true, name: true },
      }),
    delete: (id) => prisma.industry.delete({ where: { id } }).then(() => {}),
    getDeletionBlocker: async (id) => {
      const count = await prisma.keyBusiness.count({
        where: { industryId: id },
      });
      return count > 0
        ? `Cannot delete: this industry has ${count} key business${count > 1 ? "es" : ""}. Delete them first.`
        : null;
    },
  },
  sectors: {
    create: (name) =>
      prisma.sector.create({
        data: { name },
        select: { id: true, name: true },
      }),
    delete: (id) => prisma.sector.delete({ where: { id } }).then(() => {}),
    getDeletionBlocker: async (id) => {
      const industries = await prisma.industry.findMany({
        where: { sectorId: id },
        include: { keyBusinesses: { select: { id: true } } },
      });
      const totalKeyBusinesses = industries.reduce(
        (sum, i) => sum + i.keyBusinesses.length,
        0,
      );
      if (totalKeyBusinesses > 0) {
        return `Cannot delete: this sector has ${totalKeyBusinesses} key business${totalKeyBusinesses > 1 ? "es" : ""} in its industries. Delete them first.`;
      }
      if (industries.length > 0) {
        return `Cannot delete: this sector has ${industries.length} industr${industries.length > 1 ? "ies" : "y"}. Delete them first.`;
      }
      return null;
    },
  },
  work_categories: {
    create: (name) =>
      prisma.workCategory.create({
        data: { name },
        select: { id: true, name: true },
      }),
    delete: (id) =>
      prisma.workCategory.delete({ where: { id } }).then(() => {}),
    getDeletionBlocker: alwaysDeletable,
  },
  services: {
    create: (name) =>
      prisma.service.create({
        data: { name },
        select: { id: true, name: true },
      }),
    delete: (id) => prisma.service.delete({ where: { id } }).then(() => {}),
    getDeletionBlocker: alwaysDeletable,
  },
  key_businesses: {
    create: (name, parentId) =>
      prisma.keyBusiness.create({
        data: { name, industryId: parentId ?? null },
        select: { id: true, name: true },
      }),
    delete: (id) => prisma.keyBusiness.delete({ where: { id } }).then(() => {}),
    getDeletionBlocker: alwaysDeletable,
  },
  business_models: {
    create: (name) =>
      prisma.businessModel.create({
        data: { name },
        select: { id: true, name: true },
      }),
    delete: (id) =>
      prisma.businessModel.delete({ where: { id } }).then(() => {}),
    getDeletionBlocker: alwaysDeletable,
  },
};

export async function createTaxonomyItem(
  type: TaxonomyType,
  name: string,
  parentId?: string,
) {
  return taxonomyHandlers[type].create(name, parentId);
}

export async function getTaxonomyDeletionBlocker(
  type: TaxonomyType,
  id: string,
): Promise<string | null> {
  return taxonomyHandlers[type].getDeletionBlocker(id);
}

export async function deleteTaxonomyItem(type: TaxonomyType, id: string) {
  const blocker = await getTaxonomyDeletionBlocker(type, id);
  if (blocker) {
    throw new TaxonomyInUseError(blocker);
  }
  await taxonomyHandlers[type].delete(id);
  return { success: true };
}
