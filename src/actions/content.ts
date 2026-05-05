"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/db";
import { requireRole } from "@/lib/auth.server";
import { buildCreatedByRbacFilter } from "@/lib/rbac";
import type { TaxonomyType } from "@/utils/taxonomy-crud";
import { createTaxonomyItem, deleteTaxonomyItem } from "@/utils/taxonomy-crud";

export async function listTaxonomies() {
  await requireRole("employee");
  const [industries, categories, services, clients] = await Promise.all([
    prisma.industry.findMany({ orderBy: { name: "asc" } }),
    prisma.workCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.service.findMany({ orderBy: { name: "asc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { industries, categories, services, clients };
}

export async function createTaxonomy({
  type,
  name,
}: {
  type: TaxonomyType;
  name: string;
}) {
  await requireRole("admin");
  if (!name.trim()) {
    throw new Error("Name is required");
  }
  const result = await createTaxonomyItem(type, name.trim());
  revalidatePath("/taxonomies");
  revalidatePath("/shares/new");
  return result;
}

export async function deleteTaxonomy({
  type,
  id,
}: {
  type: TaxonomyType;
  id: string;
}) {
  await requireRole("admin");
  const result = await deleteTaxonomyItem(type, id);
  revalidatePath("/taxonomies");
  revalidatePath("/shares/new");
  return result;
}

// --- Client Actions ---

const clientInputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(200),
  logoUrl: z.url().nullable().optional(),
  industryId: z.uuid().nullable().optional(),
});

export async function upsertClient(input: z.infer<typeof clientInputSchema>) {
  await requireRole("employee");
  const data = clientInputSchema.parse(input);

  const values = {
    name: data.name,
    logoUrl: data.logoUrl ?? null,
    industryId: data.industryId ?? null,
  };

  let result;
  if (data.id) {
    result = await prisma.client.update({
      where: { id: data.id },
      data: values,
    });
  } else {
    result = await prisma.client.create({
      data: values,
    });
  }
  revalidatePath("/clients");
  revalidatePath("/shares/new");
  return result;
}

const deleteClientSchema = z.object({
  id: z.uuid(),
});

export async function deleteClient(input: z.infer<typeof deleteClientSchema>) {
  await requireRole("admin");
  const data = deleteClientSchema.parse(input);
  await prisma.client.delete({
    where: { id: data.id },
  });
  revalidatePath("/clients");
  revalidatePath("/shares/new");
  return { success: true };
}

// --- File Upload Action ---

export async function uploadFile(input: {
  bucket: "client-logos" | "case-study-media" | "case-study-attachments";
  filename: string;
  dataBase64: string;
  contentType: string;
}) {
  await requireRole("employee");

  // TODO: Implement your actual file upload logic here.
  // Example using Vercel Blob:
  // const buffer = Buffer.from(input.dataBase64, 'base64');
  // const blob = await put(`${input.bucket}/${input.filename}`, buffer, { access: 'public', contentType: input.contentType });
  // return { url: blob.url };

  // Placeholder return for continuity:
  return {
    url: `https://storage.example.com/${input.bucket}/${input.filename}`,
  };
}
const metricSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(50),
  unit: z.string().max(20).nullable().optional(),
});

const attachmentSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.url(),
});

const caseStudyInput = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  client_id: z.uuid().nullable().optional(),
  industry_id: z.uuid().nullable().optional(),
  project_date: z.string().nullable().optional(),
  hero_image_url: z.url().nullable().optional(),
  gallery_urls: z.array(z.url()).max(50).default([]),
  video_embed_url: z.url().nullable().optional(),
  attachments: z.array(attachmentSchema).max(20).default([]),
  description: z.string().max(20000).nullable().optional(),
  challenge: z.string().max(10000).nullable().optional(),
  solution: z.string().max(10000).nullable().optional(),
  results: z.string().max(10000).nullable().optional(),
  testimonial_quote: z.string().max(2000).nullable().optional(),
  testimonial_author: z.string().max(100).nullable().optional(),
  testimonial_title: z.string().max(100).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]),
  category_ids: z.array(z.uuid()).max(50).default([]),
  service_ids: z.array(z.uuid()).max(50).default([]),
  metrics: z.array(metricSchema).max(20).default([]),
});

export async function upsertCaseStudy(input: z.infer<typeof caseStudyInput>) {
  const user = await requireRole("employee");
  const data = caseStudyInput.parse(input);

  const payload = {
    title: data.title,
    slug: data.slug,
    clientId: data.client_id ?? null,
    industryId: data.industry_id ?? null,
    projectDate: data.project_date ? new Date(data.project_date) : null,
    heroImageUrl: data.hero_image_url ?? null,
    galleryUrls: data.gallery_urls,
    videoEmbedUrl: data.video_embed_url ?? null,
    attachmentUrls: data.attachments,
    description: data.description ?? null,
    challenge: data.challenge ?? null,
    solution: data.solution ?? null,
    results: data.results ?? null,
    testimonialQuote: data.testimonial_quote ?? null,
    testimonialAuthor: data.testimonial_author ?? null,
    testimonialTitle: data.testimonial_title ?? null,
    status: data.status,
  };

  const result = await prisma.$transaction(async (tx) => {
    let id = data.id;

    if (id) {
      const rbacFilter = await buildCreatedByRbacFilter(user, "createdByUser");

      const whereClause: Record<string, unknown> = rbacFilter
        ? { id, ...rbacFilter }
        : { id };

      const updated = await tx.caseStudy.updateMany({
        where: whereClause,
        data: payload,
      });

      if (!updated.count) {
        throw new Error("Not found or unauthorized to update this case study");
      }
    } else {
      const row = await tx.caseStudy.create({
        data: { ...payload, createdBy: user.id },
      });
      id = row.id;
    }

    // Delete existing relation rows
    await tx.caseStudyCategory.deleteMany({
      where: { caseStudyId: id! },
    });
    await tx.caseStudyService.deleteMany({
      where: { caseStudyId: id! },
    });
    await tx.caseStudyMetric.deleteMany({
      where: { caseStudyId: id! },
    });

    // Re-create relation rows
    if (data.category_ids.length) {
      await tx.caseStudyCategory.createMany({
        data: data.category_ids.map((cid) => ({
          caseStudyId: id!,
          categoryId: cid,
        })),
        skipDuplicates: true,
      });
    }
    if (data.service_ids.length) {
      await tx.caseStudyService.createMany({
        data: data.service_ids.map((sid) => ({
          caseStudyId: id!,
          serviceId: sid,
        })),
        skipDuplicates: true,
      });
    }
    if (data.metrics.length) {
      await tx.caseStudyMetric.createMany({
        data: data.metrics.map((m, idx) => ({
          caseStudyId: id!,
          label: m.label,
          value: m.value,
          unit: m.unit ?? null,
          sortOrder: idx,
        })),
      });
    }

    return { id };
  });

  revalidatePath("/case-studies");
  revalidatePath("/dashboard");
  revalidatePath("/shares/new");
  return result;
}

export async function listCaseStudies() {
  await requireRole("employee");

  const studies = await prisma.caseStudy.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        select: { name: true, logoUrl: true },
      },
      industry: {
        select: { name: true },
      },
    },
  });

  return { studies };
}

const getByIdInput = z.object({ id: z.uuid() });

export async function getCaseStudy(input: z.infer<typeof getByIdInput>) {
  await requireRole("employee");
  const data = getByIdInput.parse(input);

  const study = await prisma.caseStudy.findFirst({
    where: { id: data.id },
    include: {
      caseStudyCategories: {
        select: { categoryId: true },
      },
      caseStudyServices: {
        select: { serviceId: true },
      },
      caseStudyMetrics: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!study) throw new Error("Not found");

  const {
    caseStudyCategories,
    caseStudyServices,
    caseStudyMetrics: metricsRelation,
    ...studyData
  } = study;

  return {
    study: studyData,
    category_ids: caseStudyCategories.map((c) => c.categoryId),
    service_ids: caseStudyServices.map((s) => s.serviceId),
    metrics: metricsRelation,
  };
}

const deleteInput = z.object({ id: z.uuid() });

export async function deleteCaseStudy(input: z.infer<typeof deleteInput>) {
  const user = await requireRole("employee");
  const data = deleteInput.parse(input);

  // FIX: Added the `relationKey` argument ("createdByUser") matching the Prisma relation field
  // and added `await` since `buildCreatedByRbacFilter` is async.
  const rbacFilter = await buildCreatedByRbacFilter(user, "createdByUser");

  const whereClause: Record<string, unknown> = rbacFilter
    ? { id: data.id, ...rbacFilter }
    : { id: data.id };

  const deleted = await prisma.caseStudy.deleteMany({
    where: whereClause,
  });

  if (!deleted.count) {
    throw new Error("Not found or unauthorized to delete this case study");
  }

  revalidatePath("/case-studies");
  revalidatePath("/dashboard");
  revalidatePath("/shares/new");
  return { success: true };
}
