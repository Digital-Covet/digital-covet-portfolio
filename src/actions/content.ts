"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/db";
import { requireRole } from "@/lib/auth.server";
import {
  ActionException,
  type ActionResult,
  err,
  ok,
} from "@/lib/action-result";
import { buildCreatedByFilter } from "@/lib/rbac";
import type {
  CaseStudyListItem,
  CaseStudyResponse,
  Taxonomies,
} from "@/types/case-studies";
import type { TaxonomyType } from "@/utils/taxonomy-crud";
import { createTaxonomyItem, deleteTaxonomyItem } from "@/utils/taxonomy-crud";
import { caseStudyInputSchema, type CaseStudyInput } from "@/schemas/content";

async function runAction<T>(
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ActionException) {
      return err(e.code, e.message);
    }
    if (e instanceof z.ZodError) {
      return err("VALIDATION", e.issues[0]?.message ?? "Validation failed");
    }
    console.error("[action error]", e);
    return err("SERVER_ERROR", e instanceof Error ? e.message : "An unexpected error occurred");
  }
}

export async function listTaxonomies(): Promise<ActionResult<Taxonomies>> {
  return runAction(async () => {
    await requireRole("employee");

    const [industries, categories, services, sectors, keyBusinesses, clients] = await Promise.all([
      prisma.industry.findMany({ 
        orderBy: { name: "asc" },
        select: { id: true, name: true, sectorId: true }
      }),
      prisma.workCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.service.findMany({ orderBy: { name: "asc" } }),
      prisma.sector.findMany({ orderBy: { name: "asc" } }),
      prisma.keyBusiness.findMany({ 
        orderBy: { name: "asc" },
        select: { id: true, name: true, industryId: true }
      }),
      prisma.client.findMany({ orderBy: { name: "asc" } }),
    ]);

    return ok({ industries, categories, services, sectors, keyBusinesses, clients });
  });
}

export async function createTaxonomy(input: {
  type: TaxonomyType;
  name: string;
  parentId?: string;
}): Promise<ActionResult<{ id: string; name: string }>> {
  return runAction(async () => {
    await requireRole("admin");

    if (!input.name.trim()) {
      throw new ActionException("VALIDATION", "Name is required");
    }

    const result = await createTaxonomyItem(
      input.type,
      input.name.trim(),
      input.parentId,
    );
    revalidatePath("/taxonomies");
    revalidatePath("/shares/new");
    return ok(result);
  });
}

export async function deleteTaxonomy(input: {
  type: TaxonomyType;
  id: string;
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    await requireRole("admin");
    await deleteTaxonomyItem(input.type, input.id);
    revalidatePath("/taxonomies");
    revalidatePath("/shares/new");
    return ok({ success: true });
  } catch (e) {
    if (e instanceof ActionException) {
      return err(e.code, e.message);
    }
    if (e instanceof z.ZodError) {
      return err("VALIDATION", e.issues[0]?.message ?? "Validation failed");
    }
    if (e instanceof Error && e.message.startsWith("Cannot delete")) {
      return err("FORBIDDEN", e.message);
    }
    console.error("[action error]", e);
    return err("SERVER_ERROR", e instanceof Error ? e.message : "An unexpected error occurred");
  }
}

const clientInputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(200),
  logoUrl: z.url().nullable().optional(),
});

export async function upsertClient(
  input: z.infer<typeof clientInputSchema>,
): Promise<ActionResult<{ id: string; name: string }>> {
  return runAction(async () => {
    await requireRole("employee");
    const data = clientInputSchema.parse(input);

    const values = {
      name: data.name,
      logoUrl: data.logoUrl ?? null,
    };

    const result = data.id
      ? await prisma.client.update({ where: { id: data.id }, data: values })
      : await prisma.client.create({ data: values });

    revalidatePath("/clients");
    revalidatePath("/shares/new");
    return ok(result);
  });
}

export async function deleteClient(input: {
  id: string;
}): Promise<ActionResult<{ success: boolean }>> {
  return runAction(async () => {
    await requireRole("admin");
    const { id } = z.object({ id: z.uuid() }).parse(input);
    await prisma.client.delete({ where: { id } });
    revalidatePath("/clients");
    revalidatePath("/shares/new");
    return ok({ success: true });
  });
}

export async function uploadFile(input: {
  bucket: "client-logos" | "case-study-media" | "case-study-attachments";
  filename: string;
  dataBase64: string;
  contentType: string;
}): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    await requireRole("employee");

    return ok({
      url: `https://storage.example.com/${input.bucket}/${input.filename}`,
    });
  });
}

export async function upsertCaseStudy(
  input: CaseStudyInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requireRole("employee");
    const data = caseStudyInputSchema.parse(input);

    const rbacFilter = await buildCreatedByFilter(user);

    const dbPayload = {
      title: data.title,
      slug: data.slug,
      clientId: data.clientId ?? null,
      projectDate: data.projectDate ? new Date(data.projectDate) : null,
      heroImageUrl: data.heroImageUrl ?? null,
      galleryUrls: data.galleryUrls,
      videoEmbedUrl: data.videoEmbedUrl ?? null,

      attachmentUrls: data.attachments,
      description: data.description ?? null,
      challenge: data.challenge ?? null,
      solution: data.solution ?? null,
      results: data.results ?? null,
      testimonialQuote: data.testimonialQuote ?? null,
      testimonialAuthor: data.testimonialAuthor ?? null,
      testimonialTitle: data.testimonialTitle ?? null,
      status: data.status,
    } satisfies Parameters<
      typeof prisma.caseStudy.create
    >[0]["data"] extends infer D
      ? Omit<D, "createdBy" | "createdByUser">
      : never;

    const result = await prisma.$transaction(async (tx) => {
      let id = data.id;

      if (id) {
        const whereClause = rbacFilter ? { id, ...rbacFilter } : { id };

        const updated = await tx.caseStudy.updateMany({
          where: whereClause,
          data: dbPayload,
        });

        if (!updated.count) {
          throw new ActionException("NOT_FOUND", "Not found");
        }
      } else {
        const row = await tx.caseStudy.create({
          data: { ...dbPayload, createdBy: user.id },
          select: { id: true },
        });
        id = row.id;
      }

      await tx.caseStudyCategory.deleteMany({ where: { caseStudyId: id! } });
      await tx.caseStudyService.deleteMany({ where: { caseStudyId: id! } });
      await tx.caseStudyMetric.deleteMany({ where: { caseStudyId: id! } });
      await tx.caseStudyKeyBusiness.deleteMany({ where: { caseStudyId: id! } });

      if (data.categoryIds.length) {
        await tx.caseStudyCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({
            caseStudyId: id!,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      if (data.serviceIds.length) {
        await tx.caseStudyService.createMany({
          data: data.serviceIds.map((serviceId) => ({
            caseStudyId: id!,
            serviceId,
          })),
          skipDuplicates: true,
        });
      }

      if (data.keyBusinessIds.length) {
        await tx.caseStudyKeyBusiness.createMany({
          data: data.keyBusinessIds.map((keyBusinessId) => ({
            caseStudyId: id!,
            keyBusinessId,
          })),
          skipDuplicates: true,
        });
      }

      if (data.metrics.length) {
        await tx.caseStudyMetric.createMany({
          data: data.metrics.map((m, sortOrder) => ({
            caseStudyId: id!,
            label: m.label,
            value: m.value,
            unit: m.unit ?? null,
            sortOrder,
          })),
        });
      }

      return { id: id! };
    });

    revalidatePath("/case-studies");
    revalidatePath("/dashboard");
    revalidatePath("/shares/new");

    return ok(result);
  });
}

const listInputSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  search: z.string().max(200).optional(),
  cursor: z.uuid().optional(),
});

export type ListCaseStudiesInput = z.infer<typeof listInputSchema>;

const PAGE_SIZE = 50;

export type CaseStudyListItemWithDates = CaseStudyListItem & {
  createdAt: Date;
  updatedAt: Date;
  keyBusinesses: { name: string; industryId: string }[];
  clientId: string | null;
};

export async function listCaseStudies(
  input: ListCaseStudiesInput = {},
): Promise<
  ActionResult<{ studies: CaseStudyListItemWithDates[]; nextCursor: string | null }>
> {
  return runAction(async () => {
    const user = await requireRole("employee");
    const opts = listInputSchema.parse(input);

    const rbacFilter = await buildCreatedByFilter(user);

    const rows = await prisma.caseStudy.findMany({
      where: {
        ...(rbacFilter ?? {}),
        ...(opts.status ? { status: opts.status } : {}),
        ...(opts.search
          ? { title: { contains: opts.search, mode: "insensitive" as const } }
          : {}),
      },
      orderBy: { createdAt: "desc" },

      select: {
        id: true,
        title: true,
        status: true,
        heroImageUrl: true,
        createdAt: true,
        updatedAt: true,
        clientId: true,
        client: { select: { name: true } },
        caseStudyKeyBusinesses: {
          select: { keyBusiness: { select: { name: true, industryId: true } } },
        },
      },

      take: PAGE_SIZE + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });

    const hasNextPage = rows.length > PAGE_SIZE;
    const page = hasNextPage ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasNextPage ? (page[page.length - 1]?.id ?? null) : null;

    return ok({
      studies: page.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        heroImageUrl: s.heroImageUrl,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        clientId: s.clientId,
        client: s.client,
        keyBusinesses: s.caseStudyKeyBusinesses.map(
          (k) => k.keyBusiness,
        ) as { name: string; industryId: string }[],
      })) as CaseStudyListItemWithDates[],
      nextCursor,
    });
  });
}

export async function getCaseStudy(input: {
  id: string;
}): Promise<ActionResult<CaseStudyResponse>> {
  return runAction(async () => {
    const user = await requireRole("employee");
    const { id } = z.object({ id: z.uuid() }).parse(input);

    const rbacFilter = await buildCreatedByFilter(user);
    const whereClause = rbacFilter ? { id, ...rbacFilter } : { id };

    const study = await prisma.caseStudy.findFirst({
      where: whereClause,
      include: {
        caseStudyCategories: { select: { categoryId: true } },
        caseStudyServices: { select: { serviceId: true } },
        caseStudyMetrics: { orderBy: { sortOrder: "asc" } },
        caseStudyKeyBusinesses: {
          include: {
            keyBusiness: {
              include: {
                industry: true,
              },
            },
          },
        },
        client: true,
      },
    });

    if (!study) {
      throw new ActionException("NOT_FOUND", "Not found");
    }

    const {
      caseStudyCategories,
      caseStudyServices,
      caseStudyMetrics,
      ...studyData
    } = study;

    return ok({
      study: studyData,
      categoryIds: caseStudyCategories.map((c) => c.categoryId),
      serviceIds: caseStudyServices.map((s) => s.serviceId),

      metrics: caseStudyMetrics.map(({ label, value, unit }) => ({
        label,
        value,
        unit,
      })),
    });
  });
}

export async function deleteCaseStudy(input: {
  id: string;
}): Promise<ActionResult<{ success: boolean }>> {
  return runAction(async () => {
    const user = await requireRole("employee");
    const { id } = z.object({ id: z.uuid() }).parse(input);

    const rbacFilter = await buildCreatedByFilter(user);
    const whereClause = rbacFilter ? { id, ...rbacFilter } : { id };

    const deleted = await prisma.caseStudy.deleteMany({
      where: whereClause,
    });

    if (!deleted.count) {
      throw new ActionException("NOT_FOUND", "Not found");
    }

    revalidatePath("/case-studies");
    revalidatePath("/dashboard");
    revalidatePath("/shares/new");

    return ok({ success: true });
  });
}
