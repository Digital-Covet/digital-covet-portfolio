"use server";

import type { Prisma } from "@generated/prisma/client";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/db";
import { verifyPassword } from "@/lib/auth.server";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHARE_UNLOCKED_PREFIX = "share_unlocked_";

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const tokenSchema = z.string().min(10).max(200);
const unlockSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(1).max(200),
});

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type ShareStatus = "ok" | "expired" | "revoked" | "limit";

export type ShareInfo =
  | { exists: false }
  | {
    exists: true;
    name: string;
    status: ShareStatus;
    unlocked: boolean;
  };

export type SerializedStudy = {
  id: string;
  title: string;
  description: string | null;
  heroImageUrl: string | null;
  projectDate: string | null;
  clientId: string | null;
  industryId: string | null;
  slug: string;
  galleryUrls: string[];
  videoEmbedUrl: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
  testimonialTitle: string | null;
  attachmentUrls: unknown;
  createdAt: string;
  updatedAt: string;
  client: { name: string; logoUrl: string | null } | null;
  industry: { name: string } | null;
};

export type SerializedMetric = {
  id: string;
  caseStudyId: string;
  label: string;
  value: string;
  unit: string | null;
  sortOrder: number;
};

export type ShareContent = {
  name: string;
  studies: SerializedStudy[];
  metrics: SerializedMetric[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeShareStatus(share: {
  revoked: boolean;
  expiresAt: Date | null;
  maxViews: number | null;
  viewCount: number;
}): ShareStatus {
  if (share.revoked) return "revoked";
  if (share.expiresAt && new Date(share.expiresAt) < new Date())
    return "expired";
  if (share.maxViews !== null && share.viewCount >= share.maxViews)
    return "limit";
  return "ok";
}

function assertShareAccessible(share: {
  revoked: boolean;
  expiresAt: Date | null;
  maxViews: number | null;
  viewCount: number;
}): void {
  const status = computeShareStatus(share);
  switch (status) {
    case "revoked":
      throw new Error("This share has been revoked");
    case "expired":
      throw new Error("This share has expired");
    case "limit":
      throw new Error("View limit reached");
  }
}

function getUnlockCookieName(shareId: string): string {
  return `${SHARE_UNLOCKED_PREFIX}${shareId}`;
}

async function isShareUnlocked(shareId: string): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(getUnlockCookieName(shareId))?.value === "1";
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function getShareInfo(token: string): Promise<ShareInfo> {
  const validatedToken = tokenSchema.safeParse(token);
  if (!validatedToken.success) return { exists: false };

  const share = await prisma.shareLink.findFirst({
    where: { token: validatedToken },
    select: {
      id: true,
      name: true,
      expiresAt: true,
      maxViews: true,
      viewCount: true,
      revoked: true,
    },
  });

  if (!share) return { exists: false };

  const status = computeShareStatus(share);
  const unlocked = await isShareUnlocked(share.id);

  return { exists: true, name: share.name, status, unlocked };
}

export async function unlockShare(token: string, password: string) {
  const validated = unlockSchema.safeParse({ token, password });
  if (!validated.success) throw new Error("Share not found");

  const share = await prisma.shareLink.findFirst({
    where: { token: validated.token },
  });

  if (!share) throw new Error("Share not found");
  assertShareAccessible(share);

  const ok = await verifyPassword(validated.password, share.passwordHash);
  if (!ok) throw new Error("Incorrect password");

  const cookieStore = await cookies();
  cookieStore.set(getUnlockCookieName(share.id), "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded
    ? (forwarded.split(",")[0]?.trim() ?? null)
    : (headersList.get("x-real-ip") ?? null);
  const userAgent = headersList.get("user-agent") ?? null;

  await Promise.all([
    prisma.shareLink.update({
      where: { id: share.id },
      data: { viewCount: share.viewCount + 1 },
    }),
    prisma.shareView.create({
      data: {
        shareLinkId: share.id,
        ip,
        userAgent,
      },
    }),
  ]);

  return { success: true };
}

export async function getShareContent(token: string): Promise<ShareContent> {
  const validatedToken = tokenSchema.safeParse(token);
  if (!validatedToken.success) throw new Error("Not found");

  const share = await prisma.shareLink.findFirst({
    where: { token: validatedToken },
  });

  if (!share) throw new Error("Not found");
  if (share.revoked) throw new Error("Revoked");

  const unlocked = await isShareUnlocked(share.id);
  if (!unlocked) throw new Error("Not unlocked");

  // Build Prisma where conditions
  const where: Prisma.CaseStudyWhereInput = { status: "published" };

  const specific = share.specificCaseStudyIds;
  if (specific.length > 0) {
    where.id = { in: specific };
  } else {
    const ind = share.filterIndustryIds;
    const cli = share.filterClientIds;
    const cats = share.filterCategoryIds;
    const svcs = share.filterServiceIds;

    if (ind.length > 0) where.industryId = { in: ind };
    if (cli.length > 0) where.clientId = { in: cli };
    if (cats.length > 0) {
      where.caseStudyCategories = { some: { categoryId: { in: cats } } };
    }
    if (svcs.length > 0) {
      where.caseStudyServices = { some: { serviceId: { in: svcs } } };
    }
  }

  const studies = await prisma.caseStudy.findMany({
    where,
    include: {
      client: { select: { name: true, logoUrl: true } },
      industry: { select: { name: true } },
    },
    orderBy: { projectDate: "desc" },
  });

  const ids = studies.map((s) => s.id);
  let metrics: Array<{
    id: string;
    caseStudyId: string;
    label: string;
    value: string;
    unit: string | null;
    sortOrder: number;
  }> = [];

  if (ids.length > 0) {
    metrics = await prisma.caseStudyMetric.findMany({
      where: { caseStudyId: { in: ids } },
      orderBy: { sortOrder: "asc" },
    });
  }

  const serializedStudies: SerializedStudy[] = studies.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    heroImageUrl: s.heroImageUrl,
    projectDate: s.projectDate?.toISOString() ?? null,
    clientId: s.clientId,
    industryId: s.industryId,
    slug: s.slug,
    galleryUrls: s.galleryUrls,
    videoEmbedUrl: s.videoEmbedUrl,
    challenge: s.challenge,
    solution: s.solution,
    results: s.results,
    testimonialQuote: s.testimonialQuote,
    testimonialAuthor: s.testimonialAuthor,
    testimonialTitle: s.testimonialTitle,
    attachmentUrls: s.attachmentUrls,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    client: s.client
      ? { name: s.client.name, logoUrl: s.client.logoUrl }
      : null,
    industry: s.industry ? { name: s.industry.name } : null,
  }));

  const serializedMetrics: SerializedMetric[] = metrics.map((m) => ({
    id: m.id,
    caseStudyId: m.caseStudyId,
    label: m.label,
    value: m.value,
    unit: m.unit,
    sortOrder: m.sortOrder,
  }));

  return {
    name: share.name,
    studies: serializedStudies,
    metrics: serializedMetrics,
  };
}
