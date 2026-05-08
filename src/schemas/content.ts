import { z } from "zod";
import { urlSchema, videoEmbedUrlSchema } from "@/schemas/primitives/url";
import { uuidSchema } from "@/schemas/primitives/uuid";

export { videoEmbedUrlSchema };

export const metricSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(50),
  unit: z
    .string()
    .max(20)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

export const attachmentSchema = z.object({
  name: z.string().min(1).max(200),
  url: urlSchema,
});

export const caseStudyInputSchema = z.object({
  id: uuidSchema.optional(),
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers, and hyphens",
    ),
  clientId: uuidSchema.nullable().optional(),
  keyBusinessIds: z.array(uuidSchema).max(50).default([]),
  projectDate: z.string().nullable().optional(),
  heroImageUrl: urlSchema.nullable().optional(),
  galleryUrls: z.array(urlSchema).max(50).default([]),
  videoEmbedUrl: videoEmbedUrlSchema,
  attachments: z.array(attachmentSchema).max(20).default([]),
  description: z.string().max(20000).nullable().optional(),
  challenge: z.string().max(10000).nullable().optional(),
  solution: z.string().max(10000).nullable().optional(),
  results: z.string().max(10000).nullable().optional(),
  testimonialQuote: z.string().max(2000).nullable().optional(),
  testimonialAuthor: z.string().max(100).nullable().optional(),
  testimonialTitle: z.string().max(100).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]),
  categoryIds: z.array(uuidSchema).max(50).default([]),
  serviceIds: z.array(uuidSchema).max(50).default([]),
  metrics: z.array(metricSchema).max(20).default([]),
});

export type CaseStudyInput = z.infer<typeof caseStudyInputSchema>;
