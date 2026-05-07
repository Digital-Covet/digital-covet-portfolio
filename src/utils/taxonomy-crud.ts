import { prisma } from "@/db";

export type TaxonomyType = "industries" | "work_categories" | "services" | "sectors" | "key_businesses";

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

export async function deleteTaxonomyItem(type: TaxonomyType, id: string) {
  switch (type) {
    case "industries": {
      const keyBusinesses = await prisma.keyBusiness.count({ where: { industryId: id } });
      if (keyBusinesses > 0) {
        throw new Error(`Cannot delete: this industry has ${keyBusinesses} key business${keyBusinesses > 1 ? "es" : ""}. Delete them first.`);
      }
      await prisma.industry.delete({ where: { id } });
      break;
    }
    case "work_categories":
      await prisma.workCategory.delete({ where: { id } });
      break;
    case "services":
      await prisma.service.delete({ where: { id } });
      break;
    case "sectors": {
      const industries = await prisma.industry.findMany({
        where: { sectorId: id },
        include: { keyBusinesses: { select: { id: true } } },
      });
      const totalKeyBusinesses = industries.reduce((sum, i) => sum + i.keyBusinesses.length, 0);
      if (totalKeyBusinesses > 0) {
        throw new Error(`Cannot delete: this sector has ${totalKeyBusinesses} key business${totalKeyBusinesses > 1 ? "es" : ""} in its industries. Delete them first.`);
      }
      if (industries.length > 0) {
        throw new Error(`Cannot delete: this sector has ${industries.length} industry${industries.length > 1 ? "ies" : ""}. Delete them first.`);
      }
      await prisma.sector.delete({ where: { id } });
      break;
    }
    case "key_businesses":
      await prisma.keyBusiness.delete({ where: { id } });
      break;
    default:
      throw new Error(`Unknown taxonomy type: ${type}`);
  }
  return { success: true };
}
