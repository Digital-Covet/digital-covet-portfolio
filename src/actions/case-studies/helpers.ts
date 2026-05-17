import type { Prisma } from "@generated/prisma/client";
import { chunkArray } from "@/lib/async-utils";

type RelationSyncInput = {
  categoryIds: string[];
  serviceIds: string[];
  keyBusinessIds: string[];
  businessModelIds: string[];
  metrics: { label: string; value: string; unit: string | null }[];
};

const BULK_INSERT_CHUNK_SIZE = 100; // ✅ Prevent overwhelming the DB

export async function syncCaseStudyRelations(
  tx: Prisma.TransactionClient,
  caseStudyId: string,
  input: RelationSyncInput,
): Promise<void> {
  // ✅ PHASE 1: Delete existing relations (parallel is safe for deletes)
  await Promise.all([
    tx.caseStudyCategory.deleteMany({ where: { caseStudyId } }),
    tx.caseStudyService.deleteMany({ where: { caseStudyId } }),
    tx.caseStudyMetric.deleteMany({ where: { caseStudyId } }),
    tx.caseStudyKeyBusiness.deleteMany({ where: { caseStudyId } }),
    tx.caseStudyBusinessModel.deleteMany({ where: { caseStudyId } }),
  ]);

  // ✅ PHASE 2: Insert new relations in chunks to avoid connection pool exhaustion
  const insertOperations: Array<() => Promise<unknown>> = [];

  // Categories
  if (input.categoryIds.length > 0) {
    const chunks = chunkArray(input.categoryIds, BULK_INSERT_CHUNK_SIZE);
    for (const chunk of chunks) {
      insertOperations.push(() =>
        tx.caseStudyCategory.createMany({
          data: chunk.map((categoryId) => ({ caseStudyId, categoryId })),
          skipDuplicates: true,
        }),
      );
    }
  }

  // Services
  if (input.serviceIds.length > 0) {
    const chunks = chunkArray(input.serviceIds, BULK_INSERT_CHUNK_SIZE);
    for (const chunk of chunks) {
      insertOperations.push(() =>
        tx.caseStudyService.createMany({
          data: chunk.map((serviceId) => ({ caseStudyId, serviceId })),
          skipDuplicates: true,
        }),
      );
    }
  }

  // Key Businesses
  if (input.keyBusinessIds.length > 0) {
    const chunks = chunkArray(input.keyBusinessIds, BULK_INSERT_CHUNK_SIZE);
    for (const chunk of chunks) {
      insertOperations.push(() =>
        tx.caseStudyKeyBusiness.createMany({
          data: chunk.map((keyBusinessId) => ({ caseStudyId, keyBusinessId })),
          skipDuplicates: true,
        }),
      );
    }
  }

  // Business Models
  if (input.businessModelIds.length > 0) {
    const chunks = chunkArray(input.businessModelIds, BULK_INSERT_CHUNK_SIZE);
    for (const chunk of chunks) {
      insertOperations.push(() =>
        tx.caseStudyBusinessModel.createMany({
          data: chunk.map((businessModelId) => ({
            caseStudyId,
            businessModelId,
          })),
          skipDuplicates: true,
        }),
      );
    }
  }

  // Metrics (include sortOrder)
  if (input.metrics.length > 0) {
    const chunks = chunkArray(input.metrics, BULK_INSERT_CHUNK_SIZE);
    for (const [chunkIndex, chunk] of chunks.entries()) {
      insertOperations.push(() =>
        tx.caseStudyMetric.createMany({
          data: chunk.map((m, index) => ({
            caseStudyId,
            label: m.label,
            value: m.value,
            unit: m.unit ?? null,
            sortOrder: chunkIndex * BULK_INSERT_CHUNK_SIZE + index,
          })),
        }),
      );
    }
  }

  // ✅ Execute inserts sequentially (within transaction, concurrency is limited by Prisma)
  // For true concurrency control across transactions, use runWithConcurrencyLimit
  for (const operation of insertOperations) {
    await operation();
  }

  console.log(
    `[syncCaseStudyRelations] Synced ${input.categoryIds.length} categories, ` +
    `${input.serviceIds.length} services, ${input.keyBusinessIds.length} key businesses, ` +
    `${input.businessModelIds.length} business models, ${input.metrics.length} metrics`,
  );
}
