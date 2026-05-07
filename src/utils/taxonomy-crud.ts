import { z } from "zod";
import { prisma } from "@/db";

export const taxonomyTypeSchema = z.enum([
  "industries",
  "work_categories",
  "services",
  "sectors",
  "key_businesses",
]);

export type TaxonomyType = z.infer<typeof taxonomyTypeSchema>;

export class TaxonomyInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaxonomyInUseError";
  }
}

export async function createTaxonomyItem(
  type: TaxonomyType,
  name: string,
  parentId?: string,
) {
  switch (type) {
    case "industries":
      return prisma.industry.create({
        data: { name, sectorId: parentId ?? null },
      });
    case "work_categories":
      return prisma.workCategory.create({ data: { name } });
    case "services":
      return prisma.service.create({ data: { name } });
    case "sectors":
      return prisma.sector.create({ data: { name } });
    case "key_businesses":
      return prisma.keyBusiness.create({
        data: { name, industryId: parentId ?? null },
      });
    default:
      throw new Error(`Unknown taxonomy type: ${type}`);
  }
}

export async function getTaxonomyDeletionBlocker(
  type: TaxonomyType,
  id: string,
): Promise<string | null> {
  switch (type) {
    case "industries": {
      const count = await prisma.keyBusiness.count({
        where: { industryId: id },
      });
      if (count > 0) {
        return `Cannot delete: this industry has ${count} key business${count > 1 ? "es" : ""}. Delete them first.`;
      }
      return null;
    }
    case "sectors": {
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
    }

    default:
      return null;
  }
}

export async function deleteTaxonomyItem(type: TaxonomyType, id: string) {
  const blocker = await getTaxonomyDeletionBlocker(type, id);
  if (blocker) {
    throw new TaxonomyInUseError(blocker);
  }

  switch (type) {
    case "industries":
      await prisma.industry.delete({ where: { id } });
      break;
    case "work_categories":
      await prisma.workCategory.delete({ where: { id } });
      break;
    case "services":
      await prisma.service.delete({ where: { id } });
      break;
    case "sectors":
      await prisma.sector.delete({ where: { id } });
      break;
    case "key_businesses":
      await prisma.keyBusiness.delete({ where: { id } });
      break;
    default:
      throw new Error(`Unknown taxonomy type: ${type}`);
  }

  return { success: true };
}
