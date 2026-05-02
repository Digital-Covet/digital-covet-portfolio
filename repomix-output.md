This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.
The content has been processed where comments have been removed, empty lines have been removed.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: **/actions/**
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
src/
  actions/
    content.ts
    invite.ts
    share.ts
```

# Files

## File: src/actions/content.ts
```typescript
"use server";
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
  return createTaxonomyItem(type, name.trim());
}
export async function deleteTaxonomy({
  type,
  id,
}: {
  type: TaxonomyType;
  id: string;
}) {
  await requireRole("admin");
  return deleteTaxonomyItem(type, id);
}
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
  if (data.id) {
    return prisma.client.update({
      where: { id: data.id },
      data: values,
    });
  }
  return prisma.client.create({
    data: values,
  });
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
  return { success: true };
}
export async function uploadFile(input: {
  bucket: "client-logos" | "case-study-media" | "case-study-attachments";
  filename: string;
  dataBase64: string;
  contentType: string;
}) {
  await requireRole("employee");
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
  return prisma.$transaction(async (tx) => {
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
    await tx.caseStudyCategory.deleteMany({
      where: { caseStudyId: id! },
    });
    await tx.caseStudyService.deleteMany({
      where: { caseStudyId: id! },
    });
    await tx.caseStudyMetric.deleteMany({
      where: { caseStudyId: id! },
    });
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
  return { success: true };
}
```

## File: src/actions/invite.ts
```typescript
"use server";
import { headers } from "next/headers";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";
import { buildInviteUrl, ROLES, WORK_EMAIL_DOMAIN } from "@/lib/constants";
import { err, ok, type Result } from "@/lib/result";
import { sendEmail } from "@/services/email";
import { renderInviteEmail } from "@/services/email-templates";
import { createUserAndInvite, resetInvitation } from "@/services/invitation";
interface InviteSuccessData {
  inviteUrl: string;
}
export async function testInviteEmployee(
  personalEmail: string,
  workEmail: string,
): Promise<Result<InviteSuccessData>> {
  if (process.env.NODE_ENV === "production") {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return err("Unauthorized.");
    }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!personalEmail || !emailRegex.test(personalEmail)) {
    return err("A valid personal email address is required.");
  }
  if (!workEmail || !workEmail.endsWith(WORK_EMAIL_DOMAIN)) {
    return err(`A valid work email (${WORK_EMAIL_DOMAIN}) is required.`);
  }
  try {
    const [existingUser, invitation] = await Promise.all([
      prisma.user.findUnique({ where: { email: workEmail } }),
      prisma.invitation.findFirst({
        where: {
          email: workEmail,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);
    if (existingUser?.passwordChanged) {
      return err(
        "A user with this work email already exists and has activated their account.",
      );
    }
    if (existingUser && !existingUser.passwordChanged) {
      const result = await resetInvitation(
        workEmail,
        existingUser.id,
        existingUser.role || ROLES.EMPLOYEE,
      );
      fireInviteEmail(personalEmail, workEmail, result.inviteUrl);
      return ok({ inviteUrl: result.inviteUrl });
    }
    if (invitation) {
      return err(
        "An invitation already exists for this work email. Use the resend function.",
      );
    }
    const result = await createUserAndInvite(workEmail, ROLES.EMPLOYEE);
    fireInviteEmail(personalEmail, workEmail, result.inviteUrl);
    return ok({ inviteUrl: result.inviteUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[testInviteEmployee]", message);
    return err(message);
  }
}
export async function inviteEmployee(
  workEmail: string,
  personalEmail: string,
): Promise<Result<InviteSuccessData>> {
  if (!workEmail || !workEmail.endsWith(WORK_EMAIL_DOMAIN)) {
    return err(`A valid work email (${WORK_EMAIL_DOMAIN}) is required.`);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (personalEmail && !emailRegex.test(personalEmail)) {
    return err("Invalid personal email format.");
  }
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (
      !session ||
      (session.user.role !== ROLES.ADMIN &&
        session.user.role !== ROLES.SUPERADMIN)
    ) {
      return err("Unauthorized. Admin access is required to invite employees.");
    }
    const [existingUser, invitation] = await Promise.all([
      prisma.user.findUnique({ where: { email: workEmail } }),
      prisma.invitation.findFirst({
        where: {
          email: workEmail,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);
    if (existingUser?.passwordChanged) {
      return err(
        "A user with this work email already exists and has activated their account.",
      );
    }
    if (existingUser && !existingUser.passwordChanged) {
      if (invitation) {
        return err(
          "An invitation already exists for this user. Use the resend function.",
        );
      }
      const targetEmail = personalEmail || workEmail;
      const result = await resetInvitation(
        workEmail,
        existingUser.id,
        ROLES.EMPLOYEE,
        session.user.id,
      );
      fireInviteEmail(targetEmail, workEmail, result.inviteUrl);
      return ok({ inviteUrl: result.inviteUrl });
    }
    if (invitation) {
      return err(
        "An invitation already exists for this work email. Use the resend function.",
      );
    }
    const targetEmail = personalEmail || workEmail;
    const result = await createUserAndInvite(
      workEmail,
      ROLES.EMPLOYEE,
      session.user.id,
    );
    fireInviteEmail(targetEmail, workEmail, result.inviteUrl);
    return ok({ inviteUrl: result.inviteUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[inviteEmployee]", message);
    return err(message);
  }
}
export async function getExistingInviteUrl(
  email: string,
): Promise<Result<{ inviteUrl: string }>> {
  if (process.env.NODE_ENV === "production") {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return err("Unauthorized.");
    }
  }
  if (!email) {
    return err("Email is required.");
  }
  try {
    const invitation = await prisma.invitation.findFirst({
      where: { email, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!invitation) {
      return err("No active invitation found for this email.");
    }
    return ok({ inviteUrl: buildInviteUrl(invitation.token) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[getExistingInviteUrl]", message);
    return err(message);
  }
}
export async function sendInviteEmail(data: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<Result<{ success: boolean }>> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (
    !session?.user ||
    (session.user.role !== ROLES.ADMIN &&
      session.user.role !== ROLES.SUPERADMIN)
  ) {
    return err("Unauthorized.");
  }
  try {
    await sendEmail(data);
    return ok({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send email.";
    console.error("[sendInviteEmail]", message);
    return err(message);
  }
}
export async function resendInvite(
  workEmail: string,
): Promise<Result<InviteSuccessData>> {
  if (!workEmail || !workEmail.endsWith(WORK_EMAIL_DOMAIN)) {
    return err(`A valid work email (${WORK_EMAIL_DOMAIN}) is required.`);
  }
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (
      !session ||
      (session.user.role !== ROLES.ADMIN &&
        session.user.role !== ROLES.SUPERADMIN)
    ) {
      return err("Unauthorized. Admin access is required to resend invites.");
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: workEmail },
    });
    if (!existingUser) {
      return err("No user found with this work email.");
    }
    if (existingUser.passwordChanged) {
      return err("This user has already activated their account.");
    }
    const result = await resetInvitation(
      workEmail,
      existingUser.id,
      existingUser.role || ROLES.EMPLOYEE,
      session.user.id,
    );
    fireInviteEmail(workEmail, workEmail, result.inviteUrl);
    return ok({ inviteUrl: result.inviteUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[resendInvite]", message);
    return err(message);
  }
}
export async function setupPassword(
  token: string,
  newPassword: string,
): Promise<Result<{ success: boolean }>> {
  if (!token || !newPassword || newPassword.length < 8) {
    return err(
      "A valid token and new password (min 8 characters) are required.",
    );
  }
  try {
    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation)
      return err("The invitation token is invalid or does not exist.");
    if (invitation.expiresAt.getTime() < Date.now())
      return err("This invitation has expired.");
    if (invitation.usedAt) return err("This invitation has already been used.");
    const user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });
    if (!user) return err("No account found for this invitation.");
    if (user.passwordChanged)
      return err(
        "This account has already been activated. Please log in normally.",
      );
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(newPassword);
    await ctx.internalAdapter.updatePassword(user.id, hash);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordChanged: true, emailVerified: true },
      }),
      prisma.invitation.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);
    return ok({ success: true });
  } catch (error: any) {
    console.error("[setupPassword]", error);
    return err(
      error?.message || "An error occurred while setting your password.",
    );
  }
}
function fireInviteEmail(
  toEmail: string,
  workEmail: string,
  inviteUrl: string,
) {
  const username = workEmail.split("@")[0];
  const { html, text } = renderInviteEmail({ username, inviteUrl });
  sendEmail({
    to: toEmail,
    subject: `You're invited to join Digital Covet as ${workEmail}`,
    text,
    html,
  }).catch((e) => console.error("[Background Email] Failed:", e));
}
```

## File: src/actions/share.ts
```typescript
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
```
