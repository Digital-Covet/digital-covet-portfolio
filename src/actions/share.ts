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
import { hashPassword } from "@/lib/crypto.server";
import { buildCreatedByFilter } from "@/lib/rbac";

const shareLinkSelect = {
  id: true,
  name: true,
  token: true,
  recipientName: true,
  recipientEmail: true,
  expiresAt: true,
  maxViews: true,
  viewCount: true,
  revoked: true,
  createdAt: true,
  createdBy: true,
  filterSectorIds: true,
  filterIndustryIds: true,
  filterKeyBusinessIds: true,
  filterCategoryIds: true,
  filterServiceIds: true,
  filterClientIds: true,
  specificCaseStudyIds: true,
} as const;

export type ShareLinkItem = {
  id: string;
  name: string;
  token: string;
  recipientName: string | null;
  recipientEmail: string | null;
  expiresAt: Date | null;
  maxViews: number | null;
  viewCount: number;
  revoked: boolean;
  createdAt: Date;
  createdBy: string | null;
  filterSectorIds: string[];
  filterIndustryIds: string[];
  filterKeyBusinessIds: string[];
  filterCategoryIds: string[];
  filterServiceIds: string[];
  filterClientIds: string[];
  specificCaseStudyIds: string[];
};

const listSharesInputSchema = z.object({
  search: z.string().max(200).optional(),
  cursor: z.uuid().optional(),
});
export type ListSharesInput = z.infer<typeof listSharesInputSchema>;

const PAGE_SIZE = 50;

export async function listShares(
  input: ListSharesInput = {},
): Promise<
  ActionResult<{ shares: ShareLinkItem[]; nextCursor: string | null }>
> {
  return runAction(async () => {
    const authUser = await requireRole("employee");
    const opts = listSharesInputSchema.parse(input);
    const rbacFilter = await buildCreatedByFilter(authUser);

    const rows = await prisma.shareLink.findMany({
      where: {
        ...(rbacFilter ?? {}),
        ...(opts.search
          ? { name: { contains: opts.search, mode: "insensitive" as const } }
          : {}),
      },
      select: shareLinkSelect,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });

    const hasNextPage = rows.length > PAGE_SIZE;
    const page = hasNextPage ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasNextPage ? (page[page.length - 1]?.id ?? null) : null;
    return ok({ shares: page as ShareLinkItem[], nextCursor });
  });
}

export interface DailyViewBucket {
  date: string;
  views: number;
}

export interface DashboardViewStats {
  viewCountByShareId: Record<string, number>;
  totalViews: number;

  dailyBuckets: DailyViewBucket[];
}

export async function getDashboardViewStats(): Promise<
  ActionResult<DashboardViewStats>
> {
  return runAction(async () => {
    const authUser = await requireRole("employee");

    const isAdmin = authUser.role === "admin" || authUser.role === "superadmin";

    const shareLinkWhere = isAdmin ? {} : { createdBy: authUser.id };

    const accessibleLinks = await prisma.shareLink.findMany({
      where: shareLinkWhere,
      select: { id: true },
    });

    if (!isAdmin && accessibleLinks.length === 0) {
      return ok({ viewCountByShareId: {}, totalViews: 0, dailyBuckets: [] });
    }

    const accessibleLinkIds = accessibleLinks.map((l) => l.id);
    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const viewWhere = {
      viewedAt: { gte: since },
      ...(isAdmin ? {} : { shareLinkId: { in: accessibleLinkIds } }),
    };

    const perShareCounts = await prisma.shareView.groupBy({
      by: ["shareLinkId"],
      where: viewWhere,
      _count: { id: true },
    });

    const viewCountByShareId: Record<string, number> = {};
    let totalViews = 0;
    for (const row of perShareCounts) {
      viewCountByShareId[row.shareLinkId] = row._count.id;
      totalViews += row._count.id;
    }

    const rawBuckets = isAdmin
      ? await prisma.$queryRaw<{ date: Date; views: bigint }[]>`
          SELECT
            date_trunc('day', "viewed_at") AS date,
            COUNT(*) AS views
          FROM share_views
          WHERE "viewed_at" >= ${since}
          GROUP BY date_trunc('day', "viewed_at")
          ORDER BY date ASC
        `
      : await prisma.$queryRaw<{ date: Date; views: bigint }[]>`
          SELECT
            date_trunc('day', "viewed_at") AS date,
            COUNT(*) AS views
          FROM share_views
          WHERE "viewed_at" >= ${since}
            AND "share_link_id" = ANY(${accessibleLinkIds})
          GROUP BY date_trunc('day', "viewed_at")
          ORDER BY date ASC
        `;

    const dailyBuckets: DailyViewBucket[] = rawBuckets.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      views: Number(row.views),
    }));

    return ok({ viewCountByShareId, totalViews, dailyBuckets });
  });
}

const createShareSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  recipientName: z.string().trim().max(200).nullable().optional(),
  recipientEmail: z.email().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  maxViews: z.number().int().positive().nullable().optional(),
  filterSectorIds: z.array(z.uuid()).default([]),
  filterIndustryIds: z.array(z.uuid()).default([]),
  filterKeyBusinessIds: z.array(z.uuid()).default([]),
  filterCategoryIds: z.array(z.uuid()).default([]),
  filterServiceIds: z.array(z.uuid()).default([]),
  filterClientIds: z.array(z.uuid()).default([]),
  specificCaseStudyIds: z.array(z.uuid()).default([]),
});
export type CreateShareInput = z.infer<typeof createShareSchema>;

export async function createShare(
  input: CreateShareInput,
): Promise<ActionResult<{ id: string; url: string }>> {
  return runAction(async () => {
    const user = await requireRole("employee");
    const data = createShareSchema.parse(input);
    const token = crypto.randomUUID();

    const passwordHash = hashPassword(data.password);

    const shareLink = await prisma.shareLink.create({
      data: {
        name: data.name,
        passwordHash,
        token,
        recipientName: data.recipientName ?? null,
        recipientEmail: data.recipientEmail ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        maxViews: data.maxViews ?? null,
        filterSectorIds: data.filterSectorIds,
        filterIndustryIds: data.filterIndustryIds,
        filterKeyBusinessIds: data.filterKeyBusinessIds,
        filterCategoryIds: data.filterCategoryIds,
        filterServiceIds: data.filterServiceIds,
        filterClientIds: data.filterClientIds,
        specificCaseStudyIds: data.specificCaseStudyIds,
        createdBy: user.id,
      },
      select: { id: true, token: true },
    });

    revalidatePath("/shares");
    return ok({ id: shareLink.id, url: `/shares/${shareLink.token}` });
  });
}

export async function revokeShare(input: {
  id: string;
}): Promise<ActionResult<{ success: boolean }>> {
  return runAction(async () => {
    const authUser = await requireRole("employee");
    const { id } = z.object({ id: z.uuid() }).parse(input);

    const isAdmin = authUser.role === "admin" || authUser.role === "superadmin";
    const whereClause = isAdmin ? { id } : { id, createdBy: authUser.id };

    const updated = await prisma.shareLink.updateMany({
      where: whereClause,
      data: { revoked: true },
    });

    if (!updated.count) {
      throw new ActionException("NOT_FOUND", "Not found");
    }

    revalidatePath("/shares");
    return ok({ success: true });
  });
}

export async function deleteShare(input: {
  id: string;
}): Promise<ActionResult<{ success: boolean }>> {
  return runAction(async () => {
    const authUser = await requireRole("employee");
    const { id } = z.object({ id: z.uuid() }).parse(input);

    const isAdmin = authUser.role === "admin" || authUser.role === "superadmin";
    const whereClause = isAdmin ? { id } : { id, createdBy: authUser.id };

    const deleted = await prisma.shareLink.deleteMany({
      where: whereClause,
    });

    if (!deleted.count) {
      throw new ActionException("NOT_FOUND", "Not found");
    }

    revalidatePath("/shares");
    return ok({ success: true });
  });
}
