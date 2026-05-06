"use server";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/db";
import {
  ActionException,
  type ActionResult,
  err,
  ok,
} from "@/lib/action-result";
import { requireRole } from "@/lib/auth.server";
import { buildCreatedByFilter } from "@/lib/rbac";

const SCRYPT_KEY_LENGTH = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${key}`;
}

export async function verifySharePassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const colonIndex = stored.indexOf(":");
  if (colonIndex === -1) return false;

  const salt = stored.slice(0, colonIndex);
  const expectedKey = stored.slice(colonIndex + 1);

  if (!salt || !expectedKey) return false;

  try {
    const candidateKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString(
      "hex",
    );

    const a = Buffer.from(expectedKey, "hex");
    const b = Buffer.from(candidateKey, "hex");

    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

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
    console.error("[share action error]", e);
    return err("SERVER_ERROR", "An unexpected error occurred");
  }
}

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

export type ShareViewItem = {
  id: string;
  shareLinkId: string;
  viewedAt: Date;
};

export async function listAllShareViews(): Promise<
  ActionResult<{ views: ShareViewItem[] }>
> {
  return runAction(async () => {
    const authUser = await requireRole("employee");

    const rbacFilter = await buildCreatedByFilter(authUser);

    const accessibleLinks = await prisma.shareLink.findMany({
      where: rbacFilter ?? {},
      select: { id: true },
    });

    const accessibleLinkIds = accessibleLinks.map((l) => l.id);

    if (rbacFilter !== undefined && accessibleLinkIds.length === 0) {
      return ok({ views: [] });
    }

    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const views = await prisma.shareView.findMany({
      where: {
        viewedAt: { gte: since },

        ...(rbacFilter !== undefined
          ? { shareLinkId: { in: accessibleLinkIds } }
          : {}),
      },
      select: {
        id: true,
        shareLinkId: true,
        viewedAt: true,
      },
      orderBy: { viewedAt: "asc" },
      take: 10_000,
    });

    return ok({ views });
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

    return ok({ id: shareLink.id, url: `/s/${shareLink.token}` });
  });
}

export async function revokeShare(input: {
  id: string;
}): Promise<ActionResult<{ success: boolean }>> {
  return runAction(async () => {
    const authUser = await requireRole("employee");
    const { id } = z.object({ id: z.uuid() }).parse(input);

    const rbacFilter = await buildCreatedByFilter(authUser);
    const whereClause = rbacFilter ? { id, ...rbacFilter } : { id };

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

    const rbacFilter = await buildCreatedByFilter(authUser);
    const whereClause = rbacFilter ? { id, ...rbacFilter } : { id };

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
