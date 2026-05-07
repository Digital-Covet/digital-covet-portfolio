"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/db";
import {
  ActionException,
  type ActionResult,
  runAction as baseRunAction,
  err,
  ok,
} from "@/lib/action-result";
import { requireRole } from "@/lib/auth.server";
import { buildCreatedByFilter } from "@/lib/rbac";
import { type CaseStudyInput, caseStudyInputSchema } from "@/schemas/content";
import type {
  CaseStudyListItem,
  CaseStudyResponse,
  Taxonomies,
} from "@/types/case-studies";
import {
  createTaxonomyItem,
  deleteTaxonomyItem,
  getTaxonomyDeletionBlocker,
  TaxonomyInUseError,
  taxonomyTypeSchema,
} from "@/utils/taxonomy-crud";

async function runAction<T>(
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await baseRunAction(fn);
  } catch (e) {
    if (e instanceof TaxonomyInUseError) {
      return err("CONFLICT", e.message);
    }
    throw e;
  }
}

const createTaxonomyInputSchema = z.object({
  type: taxonomyTypeSchema,
  name: z.string().trim().min(1, "Name is required").max(200),
  parentId: z.uuid("Invalid parent ID").optional(),
});

const deleteTaxonomyInputSchema = z.object({
  type: taxonomyTypeSchema,
  id: z.uuid("Invalid taxonomy ID"),
});

const checkTaxonomyInputSchema = deleteTaxonomyInputSchema;

export async function listTaxonomies(): Promise<ActionResult<Taxonomies>> {
  return runAction(async () => {
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
  input: z.infer<typeof createTaxonomyInputSchema>,
): Promise<ActionResult<{ id: string; name: string }>> {
  return runAction(async () => {
    await requireRole("admin");
    const { type, name, parentId } = createTaxonomyInputSchema.parse(input);
    const result = await createTaxonomyItem(type, name, parentId);
    revalidatePath("/taxonomies");
    revalidatePath("/shares/new");
    return ok(result);
  });
}

export async function checkTaxonomyDeletable(
  input: z.infer<typeof checkTaxonomyInputSchema>,
): Promise<ActionResult<{ deletable: boolean; reason: string | null }>> {
  return runAction(async () => {
    await requireRole("admin");
    const { type, id } = checkTaxonomyInputSchema.parse(input);
    const reason = await getTaxonomyDeletionBlocker(type, id);
    return ok({ deletable: reason === null, reason });
  });
}

export async function deleteTaxonomy(
  input: z.infer<typeof deleteTaxonomyInputSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  return runAction(async () => {
    await requireRole("admin");
    const { type, id } = deleteTaxonomyInputSchema.parse(input);
    await deleteTaxonomyItem(type, id);
    revalidatePath("/taxonomies");
    revalidatePath("/shares/new");
    return ok({ success: true });
  });
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
    const user = await requireRole("employee");
    const data = clientInputSchema.parse(input);
    const values = {
      name: data.name,
      logoUrl: data.logoUrl ?? null,
    };

    let result: { id: string; name: string };

    if (data.id) {
      const isAdmin = user.role === "admin" || user.role === "superadmin";
      const whereClause = isAdmin
        ? { id: data.id }
        : { id: data.id, createdBy: user.id };

      const updated = await prisma.client.updateMany({
        where: whereClause,
        data: values,
      });

      if (!updated.count) {
        throw new ActionException("NOT_FOUND", "Not found");
      }

      result = { id: data.id, name: data.name };
    } else {
      result = await prisma.client.create({
        data: { ...values, createdBy: user.id },
        select: { id: true, name: true },
      });
    }

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
  ActionResult<{
    studies: CaseStudyListItemWithDates[];
    nextCursor: string | null;
  }>
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
          select: {
            keyBusiness: { select: { name: true, industryId: true } },
          },
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
        keyBusinesses: s.caseStudyKeyBusinesses.map((k) => k.keyBusiness) as {
          name: string;
          industryId: string;
        }[],
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
              include: { industry: true },
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
