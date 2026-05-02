"use server";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/db";
import { requireRole } from "@/lib/auth.server";
import { buildCreatedByRbacFilter } from "@/lib/rbac";

const SCRYPT_KEY_LENGTH = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${key}`;
}

export async function verifySharePassword(password: string, stored: string): Promise<boolean> {
  const [salt, expectedKey] = stored.split(":");
  const candidateKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString(
    "hex",
  );
  if (!expectedKey || !candidateKey) return false;
  const a = Buffer.from(expectedKey, "hex");
  const b = Buffer.from(candidateKey, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function listShares() {
  const authUser = await requireRole("employee");
  const rbacFilter = await buildCreatedByRbacFilter(authUser, "createdByUser");
  const shares = await prisma.shareLink.findMany({
    where: rbacFilter ?? {},
    orderBy: { createdAt: "desc" },
  });
  return { shares };
}

export async function listAllShareViews() {
  await requireRole("employee");
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const views = await prisma.shareView.findMany({
    where: {
      viewedAt: { gte: since },
    },
    select: {
      id: true,
      shareLinkId: true,
      viewedAt: true,
    },
    orderBy: { viewedAt: "asc" },
    take: 10_000,
  });
  return { views };
}

const createShareSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  password: z.string().min(1, "Password is required"),
  recipient_name: z.string().nullable().optional(),
  recipient_email: z.email().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  max_views: z.number().int().positive().nullable().optional(),
  filter_industry_ids: z.array(z.uuid()).default([]),
  filter_category_ids: z.array(z.uuid()).default([]),
  filter_service_ids: z.array(z.uuid()).default([]),
  filter_client_ids: z.array(z.uuid()).default([]),
  specific_case_study_ids: z.array(z.uuid()).default([]),
});

export async function createShare(input: z.infer<typeof createShareSchema>) {
  const user = await requireRole("employee");
  const data = createShareSchema.parse(input);

  const token = crypto.randomUUID();
  const passwordHash = hashPassword(data.password);

  const shareLink = await prisma.shareLink.create({
    data: {
      name: data.name,
      passwordHash,
      token,
      recipientName: data.recipient_name ?? null,
      recipientEmail: data.recipient_email ?? null,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      maxViews: data.max_views ?? null,
      filterIndustryIds: data.filter_industry_ids,
      filterCategoryIds: data.filter_category_ids,
      filterServiceIds: data.filter_service_ids,
      filterClientIds: data.filter_client_ids,
      specificCaseStudyIds: data.specific_case_study_ids,
      createdBy: user.id,
    },
  });

  return { id: shareLink.id, url: `/s/${token}` };
}
