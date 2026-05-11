"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/db";
import {
  ActionException,
  type ActionResult,
  ok,
  runAction,
} from "@/lib/action-result";
import { requireRole } from "@/lib/auth.server";
import { buildCreatedByFilter } from "@/lib/rbac";
import { type CaseStudyInput, caseStudyInputSchema } from "@/schemas/content";
import { uuidSchema } from "@/schemas/primitives/uuid";
import type {
  CaseStudyListItemWithDates,
  CaseStudyResponse,
} from "@/types/case-studies";
import { syncCaseStudyRelations } from "./case-studies/helpers";

async function getDeptUserIds(deptId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { departmentId: deptId },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function upsertCaseStudy(
  input: CaseStudyInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requireRole("employee");
    const data = caseStudyInputSchema.parse(input);
    const rbacFilter = await buildCreatedByFilter(user, getDeptUserIds);
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

      await syncCaseStudyRelations(tx, id!, {
        categoryIds: data.categoryIds,
        serviceIds: data.serviceIds,
        keyBusinessIds: data.keyBusinessIds,
        businessModelIds: data.businessModelIds,
        metrics: data.metrics,
      });

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
  cursor: uuidSchema.optional(),
});

export type ListCaseStudiesInput = z.infer<typeof listInputSchema>;

const PAGE_SIZE = 50;

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
    const rbacFilter = await buildCreatedByFilter(user, getDeptUserIds);
    const rows = await prisma.caseStudy.findMany({
      where: {
        ...(rbacFilter ?? {}),
        ...(opts.status ? { status: opts.status } : {}),
        ...(opts.search
          ? {
              title: {
                contains: opts.search,
                mode: "insensitive" as const,
              },
            }
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
    const { id } = z.object({ id: uuidSchema }).parse(input);
    const rbacFilter = await buildCreatedByFilter(user, getDeptUserIds);
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
        caseStudyBusinessModels: {
          select: { businessModelId: true },
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
      caseStudyBusinessModels,
      ...studyData
    } = study;
    const businessModelIds = caseStudyBusinessModels.map((b) => b.businessModelId);
    return ok({
      study: studyData,
      categoryIds: caseStudyCategories.map((c) => c.categoryId),
      serviceIds: caseStudyServices.map((s) => s.serviceId),
      businessModelIds,
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
    const { id } = z.object({ id: uuidSchema }).parse(input);
    const rbacFilter = await buildCreatedByFilter(user, getDeptUserIds);
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
