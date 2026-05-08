import { z } from "zod";
import { uuidSchema } from "@/schemas/primitives/uuid";
import { taxonomyTypeSchema } from "@/utils/taxonomy-crud";

export const createTaxonomyInputSchema = z.object({
  type: taxonomyTypeSchema,
  name: z.string().trim().min(1, "Name is required").max(200),
  parentId: uuidSchema.optional(),
});

export const deleteTaxonomyInputSchema = z.object({
  type: taxonomyTypeSchema,
  id: uuidSchema,
});

export const checkTaxonomyInputSchema = deleteTaxonomyInputSchema;

export type CreateTaxonomyInput = z.infer<typeof createTaxonomyInputSchema>;
export type DeleteTaxonomyInput = z.infer<typeof deleteTaxonomyInputSchema>;
