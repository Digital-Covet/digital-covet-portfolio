"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import {
  ActionException,
  type ActionResult,
  ok,
  runAction,
} from "@/lib/action-result";
import { requireRole } from "@/lib/auth.server";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";
import {
  formatUploadError,
  UPLOAD_LIMITS,
  type UploadBucket,
  validateUpload,
} from "@/lib/upload-validation";

const CASE_STUDY_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const uploadInputSchema = z.object({
  bucket: z.enum([
    "client-logos",
    "case-study-media",
    "case-study-attachments",
  ]),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
  caseStudyId: z
    .string()
    .min(1)
    .max(64)
    .regex(CASE_STUDY_ID_PATTERN)
    .optional(),
});

function sanitizeFilename(filename: string): string {
  return (
    filename
      .replace(/[^\w.-]/g, "_")
      .replace(/\.{2,}/g, ".")
      .slice(0, 200) || "upload"
  );
}

function buildR2Key(input: {
  bucket: UploadBucket;
  filename: string;
  caseStudyId?: string;
  userId: string;
  dept: string;
  date?: Date;
}): string {
  const now = input.date ?? new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const caseStudySegment = input.caseStudyId
    ? `case-study=${input.caseStudyId}/`
    : "";
  const safeFilename = sanitizeFilename(input.filename);

  return `${input.bucket}/dept=${input.dept}/user=${input.userId}/${caseStudySegment}year=${year}/month=${month}/${randomUUID()}_${safeFilename}`;
}

export async function getUploadPresignedUrl(
  input: z.infer<typeof uploadInputSchema>,
): Promise<ActionResult<{ presignedUrl: string; proxyUrl: string }>> {
  return runAction(async () => {
    const user = await requireRole("employee");
    const validated = uploadInputSchema.parse(input);

    const validationResult = validateUpload(
      validated.bucket,
      validated.filename,
      validated.contentType,
      validated.fileSizeBytes,
    );

    if (!validationResult.valid) {
      throw new ActionException(
        "VALIDATION_ERROR",
        formatUploadError(validationResult.error),
      );
    }

    const key = buildR2Key({
      bucket: validated.bucket,
      filename: validated.filename,
      caseStudyId: validated.caseStudyId,
      userId: user.id,
      dept: user.departmentId || "unassigned",
    });

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: validated.contentType,
      ContentLength: validated.fileSizeBytes,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 300,
    });

    return ok({
      presignedUrl,
      proxyUrl: `/api/file?key=${encodeURIComponent(key)}`,
    });
  });
}

export async function getUploadLimits(
  bucket: UploadBucket,
): Promise<
  ActionResult<{ maxSizeBytes: number; allowedTypes: readonly string[] }>
> {
  return runAction(async () => {
    await requireRole("employee");
    const config = UPLOAD_LIMITS[bucket];
    return ok({
      maxSizeBytes: config.maxSizeBytes,
      allowedTypes: config.allowedTypes,
    });
  });
}
