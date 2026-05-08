"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/db";
import { requireRole } from "@/lib/auth.server";
import { generateToken, hashPassword } from "@/lib/password";
import { buildCreatedByFilter, getDeptUserIds } from "@/lib/rbac";

const createShareSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(100),
  recipientName: z.string().max(100).nullable().optional(),
  recipientEmail: z.email().max(255).nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  maxViews: z.number().int().min(1).max(100_000).nullable().optional(),
  filterSectorIds: z.array(z.uuid()).max(50).default([]),
  filterIndustryIds: z.array(z.uuid()).max(50).default([]),
  filterKeyBusinessIds: z.array(z.uuid()).max(50).default([]),
  filterCategoryIds: z.array(z.uuid()).max(50).default([]),
  filterServiceIds: z.array(z.uuid()).max(50).default([]),
  filterClientIds: z.array(z.uuid()).max(50).default([]),
  specificCaseStudyIds: z.array(z.uuid()).max(200).default([]),
});

const revokeShareSchema = z.object({
  id: z.uuid(),
});

const getShareViewsSchema = z.object({
  shareLinkId: z.uuid(),
});

export type CreateShareInput = z.infer<typeof createShareSchema>;

export type SerializedShare = {
  id: string;
  createdAt: string;
  createdBy: string | null;
  expiresAt: string | null;
  filterSectorIds: string[];
  filterIndustryIds: string[];
  filterCategoryIds: string[];
  filterClientIds: string[];
  filterKeyBusinessIds: string[];
  filterServiceIds: string[];
  maxViews: number | null;
  name: string;
  passwordHash: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  revoked: boolean;
  specificCaseStudyIds: string[];
  token: string;
  viewCount: number;
  createdByUser: { name: string } | null;
  _count: { shareViews: number };
};

export type SerializedShareView = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  viewedAt: string;
};

export async function createShare(input: CreateShareInput) {
  const user = await requireRole("employee");
  const validated = createShareSchema.parse(input);
  const token = generateToken(24);
  const passwordHash = await hashPassword(validated.password);

  const share = await prisma.shareLink.create({
    data: {
      token,
      name: validated.name,
      passwordHash,
      recipientName: validated.recipientName ?? null,
      recipientEmail: validated.recipientEmail ?? null,
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
      maxViews: validated.maxViews ?? null,
      filterSectorIds: validated.filterSectorIds,
      filterIndustryIds: validated.filterIndustryIds,
      filterKeyBusinessIds: validated.filterKeyBusinessIds,
      filterCategoryIds: validated.filterCategoryIds,
      filterServiceIds: validated.filterServiceIds,
      filterClientIds: validated.filterClientIds,
      specificCaseStudyIds: validated.specificCaseStudyIds,
      createdBy: user.id,
    },
  });

  revalidatePath("/shares");
  revalidatePath("/dashboard");

  // FIX: Changed `/share/${token}` to `/shares/${token}` to match the Next.js route
  return { share, url: `/shares/${token}` };
}

export async function listShares() {
  const user = await requireRole("employee");
  const rbacFilter = await buildCreatedByFilter(user, getDeptUserIds);
  const shares = await prisma.shareLink.findMany({
    where: { ...rbacFilter },
    orderBy: { createdAt: "desc" },
    include: {
      createdByUser: { select: { name: true } },
      _count: { select: { shareViews: true } },
    },
  });
  const serialized: SerializedShare[] = shares.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt?.toISOString() ?? null,
  }));
  return { shares: serialized };
}

export async function revokeShare(id: string) {
  const user = await requireRole("employee");
  const { id: validatedId } = revokeShareSchema.parse({ id });
  const rbacFilter = await buildCreatedByFilter(user, getDeptUserIds);
  const result = await prisma.shareLink.updateMany({
    where: { id: validatedId, ...rbacFilter },
    data: { revoked: true },
  });
  if (result.count === 0) {
    throw new Error(
      "Share not found or you do not have permission to revoke it",
    );
  }
  revalidatePath("/shares");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getShareViews(shareLinkId: string) {
  const user = await requireRole("employee");
  const { shareLinkId: validatedId } = getShareViewsSchema.parse({
    shareLinkId,
  });
  const rbacFilter = await buildCreatedByFilter(user, getDeptUserIds);
  const share = await prisma.shareLink.findFirst({
    where: { id: validatedId, ...rbacFilter },
    select: { id: true, name: true },
  });
  if (!share) {
    throw new Error(
      "Share not found or you do not have permission to view its logs",
    );
  }
  const views = await prisma.shareView.findMany({
    where: { shareLinkId: validatedId },
    orderBy: { viewedAt: "desc" },
    take: 500,
  });
  const serializedViews: SerializedShareView[] = views.map((v) => ({
    id: v.id,
    ip: v.ip,
    userAgent: v.userAgent,
    viewedAt: v.viewedAt.toISOString(),
  }));
  return { views: serializedViews, shareName: share.name };
}
