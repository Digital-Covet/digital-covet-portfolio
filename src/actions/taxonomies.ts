"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db";
import { type ActionResult, err, ok, runAction } from "@/lib/action-result";
import { requireRole } from "@/lib/auth.server";
import {
  type CreateTaxonomyInput,
  checkTaxonomyInputSchema,
  createTaxonomyInputSchema,
  type DeleteTaxonomyInput,
  deleteTaxonomyInputSchema,
} from "@/schemas/taxonomy";
import type { Taxonomies } from "@/types/case-studies";
import {
  createTaxonomyItem,
  deleteTaxonomyItem,
  getTaxonomyDeletionBlocker,
  TaxonomyInUseError,
} from "@/utils/taxonomy-crud";

async function runTaxonomyAction<T>(
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await runAction(fn);
  } catch (e) {
    if (e instanceof TaxonomyInUseError) {
      return err("CONFLICT", e.message);
    }
    throw e;
  }
}

export async function listTaxonomies(): Promise<ActionResult<Taxonomies>> {
  return runTaxonomyAction(async () => {
    await requireRole("employee");
    const [industries, categories, services, sectors, keyBusinesses, clients] =
      await Promise.all([
        prisma.industry.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, sectorId: true },
        }),
        prisma.workCategory.findMany({ orderBy: { name: "asc" } }),
        prisma.service.findMany({ orderBy: { name: "asc" } }),
        prisma.sector.findMany({ orderBy: { name: "asc" } }),
        prisma.keyBusiness.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, industryId: true },
        }),
        prisma.client.findMany({ orderBy: { name: "asc" } }),
      ]);
    return ok({
      industries,
      categories,
      services,
      sectors,
      keyBusinesses,
      clients,
    });
  });
}

export async function createTaxonomy(
  input: CreateTaxonomyInput,
): Promise<ActionResult<{ id: string; name: string }>> {
  return runTaxonomyAction(async () => {
    await requireRole("admin");
    const { type, name, parentId } = createTaxonomyInputSchema.parse(input);
    const result = await createTaxonomyItem(type, name, parentId);
    revalidatePath("/taxonomies");
    revalidatePath("/shares/new");
    return ok(result);
  });
}

export async function checkTaxonomyDeletable(
  input: DeleteTaxonomyInput,
): Promise<ActionResult<{ deletable: boolean; reason: string | null }>> {
  return runTaxonomyAction(async () => {
    await requireRole("admin");
    const { type, id } = checkTaxonomyInputSchema.parse(input);
    const reason = await getTaxonomyDeletionBlocker(type, id);
    return ok({ deletable: reason === null, reason });
  });
}

export async function deleteTaxonomy(
  input: DeleteTaxonomyInput,
): Promise<ActionResult<{ success: boolean }>> {
  return runTaxonomyAction(async () => {
    await requireRole("admin");
    const { type, id } = deleteTaxonomyInputSchema.parse(input);
    await deleteTaxonomyItem(type, id);
    revalidatePath("/taxonomies");
    revalidatePath("/shares/new");
    return ok({ success: true });
  });
}
