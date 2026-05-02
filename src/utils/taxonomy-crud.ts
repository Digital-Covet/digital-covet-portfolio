import { prisma } from "@/db";

export type TaxonomyType = "industries" | "work_categories" | "services";

export async function createTaxonomyItem(type: TaxonomyType, name: string) {
  switch (type) {
    case "industries":
      return prisma.industry.create({ data: { name } });
    case "work_categories":
      return prisma.workCategory.create({ data: { name } });
    case "services":
      return prisma.service.create({ data: { name } });
    default:
      throw new Error(`Unknown taxonomy type: ${type}`);
  }
}

export async function deleteTaxonomyItem(type: TaxonomyType, id: string) {
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
    default:
      throw new Error(`Unknown taxonomy type: ${type}`);
  }
  return { success: true };
}
