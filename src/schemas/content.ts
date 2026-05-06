import { z } from "zod";

const ALLOWED_VIDEO_EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
]);

function isAllowedEmbedHost(raw: string): boolean {
  try {
    return ALLOWED_VIDEO_EMBED_HOSTS.has(new URL(raw).hostname);
  } catch {
    return false;
  }
}

export const videoEmbedUrlSchema = z
  .url()
  .refine(isAllowedEmbedHost, {
    message: "Only YouTube and Vimeo embed URLs are accepted",
  })
  .nullable()
  .optional();

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
  url: z.url(),
});

export const caseStudyInputSchema = z.object({
  id: z.uuid().optional(),
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
  clientId: z.uuid().nullable().optional(),
  keyBusinessIds: z.array(z.uuid()).max(50).default([]),
  projectDate: z.string().nullable().optional(),
  heroImageUrl: z.url().nullable().optional(),
  galleryUrls: z.array(z.url()).max(50).default([]),
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
  categoryIds: z.array(z.uuid()).max(50).default([]),
  serviceIds: z.array(z.uuid()).max(50).default([]),
  metrics: z.array(metricSchema).max(20).default([]),
});

export type CaseStudyInput = z.infer<typeof caseStudyInputSchema>;
