import type { Prisma } from "@generated/prisma/client";

type RelationSyncInput = {
  categoryIds: string[];
  serviceIds: string[];
  keyBusinessIds: string[];
  businessModelId: string | null;
  metrics: { label: string; value: string; unit: string | null }[];
};

export async function syncCaseStudyRelations(
  tx: Prisma.TransactionClient,
  caseStudyId: string,
  input: RelationSyncInput,
): Promise<void> {
  // Phase 1: Remove all existing relations in parallel (different tables, no FK conflicts)
  await Promise.all([
    tx.caseStudyCategory.deleteMany({ where: { caseStudyId } }),
    tx.caseStudyService.deleteMany({ where: { caseStudyId } }),
    tx.caseStudyMetric.deleteMany({ where: { caseStudyId } }),
    tx.caseStudyKeyBusiness.deleteMany({ where: { caseStudyId } }),
    tx.caseStudyBusinessModel.deleteMany({ where: { caseStudyId } }),
  ]);

  // Phase 2: Create new relations in parallel
  const creates: Promise<unknown>[] = [];

  if (input.categoryIds.length) {
    creates.push(
      tx.caseStudyCategory.createMany({
        data: input.categoryIds.map((categoryId) => ({
          caseStudyId,
          categoryId,
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (input.serviceIds.length) {
    creates.push(
      tx.caseStudyService.createMany({
        data: input.serviceIds.map((serviceId) => ({
          caseStudyId,
          serviceId,
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (input.keyBusinessIds.length) {
    creates.push(
      tx.caseStudyKeyBusiness.createMany({
        data: input.keyBusinessIds.map((keyBusinessId) => ({
          caseStudyId,
          keyBusinessId,
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (input.businessModelId) {
    creates.push(
      tx.caseStudyBusinessModel.create({
        data: {
          caseStudyId,
          businessModelId: input.businessModelId,
        },
      }),
    );
  }

  if (input.metrics.length) {
    creates.push(
      tx.caseStudyMetric.createMany({
        data: input.metrics.map((m, sortOrder) => ({
          caseStudyId,
          label: m.label,
          value: m.value,
          unit: m.unit ?? null,
          sortOrder,
        })),
      }),
    );
  }

  if (creates.length) {
    await Promise.all(creates);
  }
}
